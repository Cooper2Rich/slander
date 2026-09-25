import express from "express";
import multer from "multer";
import { randomUUID } from "node:crypto";
import { mkdirSync, existsSync, readFileSync, unlinkSync } from "node:fs";
import { join, resolve, basename } from "node:path";
import { ZodError } from "zod";
import { z } from "zod";
import {
  ensureIdentity,
  readAccess,
  requireProject,
  requirePost,
  scopedWorkspace,
} from "./access.js";
import {
  AppError,
  projectSchema,
  normalizeInstagram,
  getProject,
  addActivity,
  addSubmission,
  reviewPost,
  revisePost,
  readiness,
  getPost,
} from "./domain.js";

export function createApp(store, dataDir) {
  const app = express();
  app.disable("x-powered-by");
  app.use(express.json({ limit: "100kb" }));
  app.use("/api", (req, res, next) => {
    res.set("Cache-Control", "no-store");
    if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
      const origin = req.get("origin");
      if (origin && origin !== `${req.protocol}://${req.get("host")}`)
        return res
          .status(403)
          .json({ error: "Cross-origin writes are not allowed." });
    }
    next();
  });
  const requireRole =
    (...roles) =>
    (req, res, next) =>
      roles.includes(req.get("x-demo-role"))
        ? next()
        : res.status(403).json({
            error: "This action is not available in the selected demo view.",
          });
  app.get("/api/health", (_req, res) => res.json({ ok: true }));
  app.get("/api/demo-options", (_req, res) => {
    const { nonprofits, creators } = store.read();
    res.json({ nonprofits, creators });
  });
  app.post("/api/demo-creators", requireRole("creator"), (req, res) => {
    const name = z.string().trim().min(1).max(80).parse(req.body.name);
    res
      .status(201)
      .json(store.update((state) => ensureIdentity(state, "creators", name)));
  });
  app.get("/api/workspace", (req, res) => {
    const state = store.read();
    res.json(scopedWorkspace(state, readAccess(req, state)));
  });
  app.post("/api/projects", requireRole("admin"), (req, res) => {
    const data = projectSchema.parse(req.body);
    data.instagram = normalizeInstagram(data.instagram);
    const project = store.update((state) => {
      const nonprofit = ensureIdentity(state, "nonprofits", data.nonprofit);
      const project = {
        ...data,
        nonprofit: nonprofit.name,
        nonprofitId: nonprofit.id,
        id: randomUUID(),
        color: {
          forest: "green",
          seedling: "green",
          food: "orange",
          education: "purple",
        }[data.cover],
        createdAt: new Date().toISOString(),
      };
      state.projects.unshift(project);
      addActivity(
        state,
        "project",
        `Created “${project.name}”`,
        project.nonprofit,
        project.id,
      );
      return project;
    });
    res.status(201).json(project);
  });
  app.put(
    "/api/projects/:id",
    requireRole("admin", "nonprofit"),
    (req, res) => {
      const data = projectSchema.parse(req.body);
      data.instagram = normalizeInstagram(data.instagram);
      res.json(
        store.update((state) => {
          const access = readAccess(req, state);
          const project = requireProject(state, req.params.id, access, true);
          if (
            access.role === "nonprofit" &&
            data.nonprofit !== project.nonprofit
          )
            throw new AppError(
              "Only Admin can reassign a project's nonprofit.",
              403,
            );
          const nonprofit = ensureIdentity(state, "nonprofits", data.nonprofit);
          const changedAccount = project.instagram !== data.instagram;
          Object.assign(project, data, {
            nonprofit: nonprofit.name,
            nonprofitId: nonprofit.id,
          });
          addActivity(
            state,
            changedAccount ? "instagram" : "project",
            changedAccount
              ? data.instagram
                ? `Paired @${data.instagram} with “${project.name}”`
                : `Removed the account from “${project.name}”`
              : `Updated “${project.name}”`,
            changedAccount
              ? "Project pairing saved. Live Instagram authorization is still required."
              : "Project settings saved.",
            project.id,
          );
          return project;
        }),
      );
    },
  );
  const uploadDir = join(dataDir, "uploads");
  mkdirSync(uploadDir, { recursive: true });
  const types = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "video/mp4": ".mp4",
    "video/quicktime": ".mov",
  };
  const upload = multer({
    storage: multer.diskStorage({
      destination: uploadDir,
      filename: (_req, file, cb) =>
        cb(null, randomUUID() + (types[file.mimetype] || "")),
    }),
    limits: { fileSize: 30 * 1024 * 1024, files: 1 },
    fileFilter: (_req, file, cb) =>
      types[file.mimetype]
        ? cb(null, true)
        : cb(new AppError("Use a JPG, PNG, WebP, MP4, or MOV file.")),
  });
  app.post(
    "/api/uploads",
    requireRole("admin", "creator"),
    (req, _res, next) => {
      readAccess(req, store.read());
      next();
    },
    upload.single("media"),
    (req, res) => {
      if (!req.file) throw new AppError("Choose a photo or video to upload.");
      const header = readFileSync(req.file.path).subarray(0, 16);
      const actualType =
        header[0] === 0xff && header[1] === 0xd8
          ? "image/jpeg"
          : header
                .subarray(0, 8)
                .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
            ? "image/png"
            : header.toString("ascii", 0, 4) === "RIFF" &&
                header.toString("ascii", 8, 12) === "WEBP"
              ? "image/webp"
              : header.toString("ascii", 4, 8) === "ftyp"
                ? "video"
                : "";
      if (
        !actualType ||
        (actualType === "video"
          ? !req.file.mimetype.startsWith("video/")
          : actualType !== req.file.mimetype)
      ) {
        unlinkSync(req.file.path);
        throw new AppError(
          "This file does not match its image or video type. Choose a valid media file.",
        );
      }
      res.status(201).json({
        media: `/uploads/${req.file.filename}`,
        mediaType: req.file.mimetype.startsWith("video/") ? "video" : "image",
      });
    },
  );
  app.use(
    "/uploads",
    express.static(uploadDir, {
      setHeaders: (res) => res.set("X-Content-Type-Options", "nosniff"),
    }),
  );
  const verifyMedia = (body) => {
    const media = body.media;
    const validSample =
      /^\/images\/(forest|food|education|seedling)\.jpg$/.test(media);
    const validUpload =
      /^\/uploads\/[a-f0-9-]+\.(jpg|png|webp|mp4|mov)$/.test(media) &&
      existsSync(join(uploadDir, basename(media)));
    if (!validSample && !validUpload)
      throw new AppError("Upload a media file or choose a sample image.");
    const inferred = /\.(mp4|mov)$/.test(media) ? "video" : "image";
    if (body.mediaType !== inferred)
      throw new AppError("The media type does not match the selected file.");
  };
  app.post(
    "/api/projects/:id/posts",
    requireRole("admin", "creator"),
    (req, res) => {
      verifyMedia(req.body);
      res.status(201).json(
        store.update((state) => {
          const access = readAccess(req, state);
          requireProject(state, req.params.id, access);
          const creator =
            access.role === "creator"
              ? state.creators.find((c) => c.id === access.creatorId)
              : ensureIdentity(
                  state,
                  "creators",
                  z.string().trim().min(1).max(80).parse(req.body.creator),
                );
          const post = addSubmission(state, req.params.id, {
            ...req.body,
            creator: creator.name,
          });
          post.creatorId = creator.id;
          return post;
        }),
      );
    },
  );
  app.post(
    "/api/posts/:id/review",
    requireRole("admin", "nonprofit"),
    (req, res) =>
      res.json(
        store.update((state) => {
          const access = readAccess(req, state);
          requirePost(state, req.params.id, access, "review");
          return reviewPost(
            state,
            req.params.id,
            req.body,
            access.role === "nonprofit"
              ? state.nonprofits.find((n) => n.id === access.nonprofitId).name
              : "Demo administrator",
          );
        }),
      ),
  );
  app.put("/api/posts/:id", requireRole("admin", "creator"), (req, res) => {
    verifyMedia(req.body);
    res.json(
      store.update((state) => {
        const access = readAccess(req, state);
        const post = requirePost(state, req.params.id, access, "edit");
        return revisePost(state, req.params.id, {
          ...req.body,
          creator: post.creator,
        });
      }),
    );
  });
  app.get("/api/posts/:id/export", (req, res) => {
    const state = store.read();
    const post = requirePost(
      state,
      req.params.id,
      readAccess(req, state),
      "export",
    );
    const project = getProject(state, post.projectId);
    const gate = readiness(post, project);
    if (!gate.ready) throw new AppError(gate.reasons.join(". "), 409);
    res
      .set(
        "Content-Disposition",
        `attachment; filename="slander-${post.id}.json"`,
      )
      .json({
        project: project.name,
        nonprofit: project.nonprofit,
        instagram: `@${project.instagram}`,
        title: post.title,
        creator: post.creator,
        caption: post.caption,
        format: post.format,
        media: post.media,
        revision: post.revision,
        approvalHistory: post.history,
        note: "Approved handoff package. This post has not been published to Instagram.",
      });
  });
  app.use("/api", (_req, res) =>
    res.status(404).json({ error: "API route not found." }),
  );
  app.use((error, _req, res, _next) => {
    if (error instanceof ZodError)
      return res.status(400).json({
        error: error.issues
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .join(" "),
      });
    if (error instanceof multer.MulterError)
      return res.status(400).json({
        error:
          error.code === "LIMIT_FILE_SIZE"
            ? "Files must be 30 MB or smaller."
            : "Upload failed. Choose one media file.",
      });
    const status = error.status || 500;
    if (status >= 500) console.error(error);
    res.status(status).json({
      error:
        status >= 500
          ? "Something went wrong. Please try again."
          : error.message,
    });
  });
  return app;
}
