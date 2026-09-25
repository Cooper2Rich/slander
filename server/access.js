import { randomUUID } from "node:crypto";
import { AppError, getProject, getPost, readiness } from "./domain.js";

const identityKey = (name) => name.trim().toLocaleLowerCase("en-US");
export function ensureIdentity(state, collection, name) {
  state[collection] ||= [];
  let identity = state[collection].find(
    (item) => identityKey(item.name) === identityKey(name),
  );
  if (!identity) {
    identity = { id: randomUUID(), name: name.trim() };
    state[collection].push(identity);
  }
  return identity;
}
export function migrateIdentities(state) {
  state.nonprofits ||= [];
  state.creators ||= [];
  for (const project of state.projects) {
    if (!project.nonprofitId)
      project.nonprofitId = ensureIdentity(
        state,
        "nonprofits",
        project.nonprofit,
      ).id;
  }
  for (const post of state.posts) {
    if (!post.creatorId)
      post.creatorId = ensureIdentity(state, "creators", post.creator).id;
  }
  return state;
}
export function readAccess(req, state, requireSelection = true) {
  const role = req.get("x-demo-role");
  if (!["admin", "nonprofit", "creator"].includes(role))
    throw new AppError("Select a demo view first.", 403);
  const access = {
    role,
    nonprofitId: req.get("x-demo-nonprofit") || null,
    creatorId: req.get("x-demo-creator") || null,
  };
  if (requireSelection && role !== "admin") {
    const exists =
      role === "nonprofit"
        ? state.nonprofits.some((n) => n.id === access.nonprofitId)
        : state.creators.some((c) => c.id === access.creatorId);
    if (!exists)
      throw new AppError(
        `Select a ${role === "nonprofit" ? "nonprofit" : "creator profile"} to continue.`,
        403,
      );
  }
  return access;
}
export function canViewProject(project, access) {
  if (access.role === "admin") return true;
  if (access.role === "nonprofit")
    return project.nonprofitId === access.nonprofitId;
  return project.status === "active";
}
export function requireProject(state, id, access, manage = false) {
  const project = getProject(state, id);
  if (!canViewProject(project, access))
    throw new AppError("Project not available in this view.", 404);
  if (manage && access.role === "creator")
    throw new AppError(
      "Project settings are available to Admin and the project's nonprofit only.",
      403,
    );
  return project;
}
export function requirePost(state, id, access, action) {
  const post = getPost(state, id);
  requireProject(
    state,
    post.projectId,
    access,
    action === "review" || action === "export",
  );
  if (
    action === "edit" &&
    access.role !== "admin" &&
    (access.role !== "creator" || post.creatorId !== access.creatorId)
  )
    throw new AppError("You can only edit your own submissions.", 403);
  return post;
}
function publicPost(post) {
  return {
    id: post.id,
    projectId: post.projectId,
    title: post.title,
    creatorId: post.creatorId,
    creator: post.creator,
    format: post.format,
    caption: post.caption,
    media: post.media,
    mediaType: post.mediaType,
    status: post.status,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    revision: post.revision,
    history: [],
    feedback: "",
  };
}
export function scopedWorkspace(state, access) {
  const projects = state.projects.filter((p) => canViewProject(p, access));
  const projectIds = new Set(projects.map((p) => p.id));
  const visible = state.posts.filter((p) => projectIds.has(p.projectId));
  const posts = visible
    .filter(
      (p) => access.role !== "creator" || p.creatorId === access.creatorId,
    )
    .map((post) =>
      access.role === "creator"
        ? { ...post, readiness: undefined }
        : {
            ...post,
            readiness: readiness(post, getProject(state, post.projectId)),
          },
    );
  return {
    projects: projects.map((p) =>
      access.role === "creator"
        ? { ...p, instagram: undefined, nonprofitId: undefined }
        : p,
    ),
    posts,
    approvedPosts: visible
      .filter((p) => p.status === "approved")
      .map((p) =>
        access.role === "creator" && p.creatorId !== access.creatorId
          ? publicPost(p)
          : posts.find((post) => post.id === p.id),
      ),
    activity:
      access.role === "creator"
        ? []
        : state.activity.filter(
            (e) => access.role === "admin" || projectIds.has(e.projectId),
          ),
  };
}
