import { DatabaseSync } from "node:sqlite";
import { mkdirSync, existsSync, readdirSync, cpSync } from "node:fs";
import { dirname, join, basename } from "node:path";
import { seedData } from "./seed.js";
import { migrateIdentities } from "./access.js";
import { refreshEligibility, bindEligibilityRecords } from "./eligibility.js";
import { migrateRecords, recordRepository } from "./records.js";
import { migrateOrganizations } from "./marketplace.js";

export function createStore(filename, seed = true, { migrationHook } = {}) {
  if (filename !== ":memory:")
    mkdirSync(dirname(filename), { recursive: true });
  const existed = filename !== ":memory:" && existsSync(filename);
  const db = new DatabaseSync(filename);
  let migrationBackup = null;
  const hasVersionTable = !!db
    .prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='schema_migrations'",
    )
    .get();
  const oldVersion = hasVersionTable
    ? db
        .prepare(
          "SELECT COALESCE(MAX(version),0) AS version FROM schema_migrations",
        )
        .get().version
    : 0;
  if (existed && oldVersion < 4) {
    const directory = dirname(filename);
    migrationBackup = `${directory}-backup-v${oldVersion === 0 ? 1 : oldVersion + 1}-${Date.now()}`;
    mkdirSync(migrationBackup);
    for (const entry of readdirSync(directory)) {
      if (
        ![
          basename(filename),
          `${basename(filename)}-wal`,
          `${basename(filename)}-shm`,
        ].includes(entry)
      )
        cpSync(join(directory, entry), join(migrationBackup, entry), {
          recursive: true,
        });
    }
    // VACUUM snapshots committed WAL content as one consistent database file.
    db.prepare("VACUUM INTO ?").run(join(migrationBackup, basename(filename)));
  }
  db.exec("PRAGMA journal_mode = WAL");
  db.exec("PRAGMA foreign_keys = ON");
  let writing = false;
  const records = recordRepository(db, () => writing);
  const store = {
    migrationBackup,
    records,
    read() {
      return bindEligibilityRecords(
        JSON.parse(
          db.prepare("SELECT document FROM workspace WHERE id = 1").get()
            .document,
        ),
        records,
      );
    },
    update(fn, initializing = false) {
      db.exec("BEGIN IMMEDIATE");
      writing = true;
      records.beginWrite();
      try {
        if (initializing) {
          db.exec(
            "CREATE TABLE IF NOT EXISTS workspace (id INTEGER PRIMARY KEY CHECK (id = 1), document TEXT NOT NULL)",
          );
          migrateRecords(db);
          migrationHook?.("afterSchema");
          if (!db.prepare("SELECT id FROM workspace WHERE id=1").get())
            db.prepare("INSERT INTO workspace(id,document) VALUES(1,?)").run(
              JSON.stringify(
                seed ? seedData() : { projects: [], posts: [], activity: [] },
              ),
            );
        }
        const state = this.read();
        const result = fn(state, records);
        records.validateWrite();
        records.indexSnapshots(state);
        records.indexCampaigns(state);
        db.prepare("UPDATE workspace SET document = ? WHERE id = 1").run(
          JSON.stringify(state),
        );
        if (initializing) migrationHook?.("afterWorkspace");
        db.exec("COMMIT");
        return result;
      } catch (error) {
        db.exec("ROLLBACK");
        throw error;
      } finally {
        writing = false;
      }
    },
    close() {
      db.close();
    },
  };
  try {
    store.update(
      (state) =>
        refreshEligibility(migrateOrganizations(migrateIdentities(state))),
      true,
    );
  } catch (error) {
    db.close();
    throw error;
  }
  return store;
}
