import { randomUUID } from "node:crypto";
import { z } from "zod";

export class AppError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}
const text = (max) => z.string().trim().min(1).max(max);
const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine(
    (v) =>
      !Number.isNaN(Date.parse(v)) &&
      new Date(v).toISOString().slice(0, 10) === v,
    "Enter a valid calendar date.",
  );
export const projectSchema = z
  .object({
    name: text(80),
    nonprofit: text(80),
    category: text(40),
    description: text(600),
    brief: text(1200),
    cover: z.enum(["forest", "food", "education", "seedling"]),
    startDate: date,
    endDate: date,
    status: z.enum(["draft", "active", "archived"]),
    instagram: z.string().trim().max(150).default(""),
  })
  .refine((v) => v.endDate >= v.startDate, {
    message: "The end date must be on or after the start date.",
    path: ["endDate"],
  });
export const postSchema = z.object({
  title: text(100),
  creator: text(80),
  caption: text(2200),
  format: z.enum(["photo", "reel", "carousel", "story", "other"]),
  media: text(300),
  mediaType: z.enum(["image", "video"]),
  rights: z.boolean(),
});
export const reviewSchema = z
  .object({
    decision: z.enum(["approved", "changes", "rejected"]),
    note: z.string().trim().max(2000).default(""),
    revision: z.number().int().positive(),
  })
  .refine((v) => v.decision === "approved" || v.note.length > 0, {
    message: "Add feedback so the creator knows what to change.",
    path: ["note"],
  });
export function normalizeInstagram(input) {
  const value = input
    .trim()
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
    .replace(/^@/, "")
    .replace(/\/$/, "");
  if (
    value &&
    (!/^[a-zA-Z0-9._]{1,30}$/.test(value) ||
      value.endsWith(".") ||
      value.includes(".."))
  )
    throw new AppError("Enter a valid Instagram username or profile URL.");
  return value.toLowerCase();
}
export function getProject(state, id) {
  const project = state.projects.find((p) => p.id === id);
  if (!project) throw new AppError("Project not found.", 404);
  return project;
}
export function getPost(state, id) {
  const post = state.posts.find((p) => p.id === id);
  if (!post) throw new AppError("Post not found.", 404);
  return post;
}
export function checkPolicy(post) {
  const reasons = [];
  if (!post.rights)
    reasons.push(
      "The creator must confirm media rights and permission to share.",
    );
  if (post.format === "photo" && post.mediaType !== "image")
    reasons.push("A photo post needs an image.");
  if (post.format === "reel" && post.mediaType !== "video")
    reasons.push("A reel needs a video.");
  return {
    passed: reasons.length === 0,
    reasons,
    version: "demo-submission-v1",
  };
}
export function readiness(post, project) {
  const reasons = [];
  if (post.status !== "approved") reasons.push("Awaiting nonprofit approval");
  if (!post.policy.passed) reasons.push("Submission checks need attention");
  if (!["photo", "reel"].includes(post.format))
    reasons.push("Format needs a separate handoff plan");
  if (!project.instagram) reasons.push("Add the nonprofit’s Instagram account");
  if (project.status === "archived") reasons.push("Project is archived");
  return { ready: reasons.length === 0, reasons };
}
export function addActivity(state, action, title, detail, projectId) {
  state.activity.unshift({
    id: randomUUID(),
    action,
    title,
    detail,
    projectId,
    at: new Date().toISOString(),
  });
}
export function assertSubmissionsOpen(project) {
  const today = new Date().toISOString().slice(0, 10);
  if (
    project.status !== "active" ||
    today < project.startDate ||
    today > project.endDate
  )
    throw new AppError(
      "This project is not currently accepting submissions.",
      409,
    );
}
export function addSubmission(state, projectId, input) {
  const project = getProject(state, projectId);
  assertSubmissionsOpen(project);
  const data = postSchema.parse(input);
  const at = new Date().toISOString();
  const post = {
    ...data,
    id: randomUUID(),
    projectId,
    status: "pending",
    policy: checkPolicy(data),
    revision: 1,
    createdAt: at,
    updatedAt: at,
    feedback: "",
    history: [
      {
        id: randomUUID(),
        action: "submitted",
        actor: data.creator,
        note: "Submitted for nonprofit review.",
        at,
      },
    ],
  };
  state.posts.unshift(post);
  addActivity(
    state,
    "submitted",
    `${data.creator} submitted “${data.title}”`,
    project.name,
    projectId,
  );
  return post;
}
export function reviewPost(state, id, input, actor = "Demo administrator") {
  const data = reviewSchema.parse(input);
  const post = getPost(state, id);
  if (getProject(state, post.projectId).status === "archived")
    throw new AppError("Archived projects cannot be reviewed.", 409);
  if (post.revision !== data.revision)
    throw new AppError(
      "This post changed. Close it and open it again before reviewing.",
      409,
    );
  if (post.status !== "pending")
    throw new AppError(
      "Only posts awaiting review can receive a decision.",
      409,
    );
  if (data.decision === "approved" && !post.policy.passed)
    throw new AppError(
      "Resolve the submission checks before approving this post.",
      409,
    );
  post.status = data.decision;
  post.feedback = data.note;
  post.revision += 1;
  post.updatedAt = new Date().toISOString();
  post.history.push({
    id: randomUUID(),
    action: data.decision,
    actor,
    note: data.note || "Approved for Instagram handoff.",
    at: post.updatedAt,
  });
  addActivity(
    state,
    data.decision,
    `${data.decision === "approved" ? "Approved" : data.decision === "changes" ? "Requested changes to" : "Declined"} “${post.title}”`,
    data.note || "Ready for the next step.",
    post.projectId,
  );
  return post;
}
export function revisePost(state, id, input) {
  const post = getPost(state, id);
  assertSubmissionsOpen(getProject(state, post.projectId));
  if (post.revision !== input.revision)
    throw new AppError(
      "This submission changed. Reopen it and try again.",
      409,
    );
  if (!["changes", "pending"].includes(post.status))
    throw new AppError(
      "Only pending posts or posts with requested changes can be edited.",
      409,
    );
  const data = postSchema.parse(input);
  Object.assign(post, data, {
    status: "pending",
    policy: checkPolicy(data),
    revision: post.revision + 1,
    updatedAt: new Date().toISOString(),
    feedback: "",
  });
  post.history.push({
    id: randomUUID(),
    action: "resubmitted",
    actor: data.creator,
    note: "Updated creative submitted for a new review.",
    at: post.updatedAt,
  });
  addActivity(
    state,
    "resubmitted",
    `${data.creator} resubmitted “${data.title}”`,
    "A new review is required.",
    post.projectId,
  );
  return post;
}
