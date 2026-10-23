import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { seedData } from "./seed.js";
import { migrateIdentities } from "./access.js";
import { refreshEligibility } from "./eligibility.js";

export function createStore(filename, seed = true) {
  if (filename !== ":memory:")
    mkdirSync(dirname(filename), { recursive: true });
  const db = new DatabaseSync(filename);
  db.exec(
    "PRAGMA journal_mode = WAL; CREATE TABLE IF NOT EXISTS workspace (id INTEGER PRIMARY KEY CHECK (id = 1), document TEXT NOT NULL)",
  );
  if (!db.prepare("SELECT id FROM workspace WHERE id = 1").get()) {
    db.prepare("INSERT INTO workspace (id, document) VALUES (1, ?)").run(
      JSON.stringify(
        seed ? seedData() : { projects: [], posts: [], activity: [] },
      ),
    );
  }
  const store = {
    read() {
      return JSON.parse(
        db.prepare("SELECT document FROM workspace WHERE id = 1").get()
          .document,
      );
    },
    update(fn) {
      db.exec("BEGIN IMMEDIATE");
      try {
        const state = this.read();
        const result = fn(state);
        db.prepare("UPDATE workspace SET document = ? WHERE id = 1").run(
          JSON.stringify(state),
        );
        db.exec("COMMIT");
        return result;
      } catch (error) {
        db.exec("ROLLBACK");
        throw error;
      }
    },
    close() {
      db.close();
    },
  };
  store.update((state) => refreshEligibility(migrateIdentities(state)));
  return store;
}
