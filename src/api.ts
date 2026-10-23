import type { DemoAccess } from "./types";
import { PUBLIC_DEMO } from "./runtime";

export function accessHeaders(access?: DemoAccess) {
  return access
    ? {
        "x-demo-role": access.role === "nonprofit" ? "owner" : access.role,
        ...(access.nonprofitId
          ? {
              "x-demo-nonprofit": access.nonprofitId,
              "x-demo-organization": access.nonprofitId,
            }
          : {}),
        ...(access.creatorId ? { "x-demo-creator": access.creatorId } : {}),
      }
    : {};
}

export async function downloadMedia(path: string, access: DemoAccess) {
  const response = await fetch(path, { headers: accessHeaders(access) });
  if (!response.ok)
    throw new Error("The creative media is unavailable in this view.");
  const url = URL.createObjectURL(await response.blob());
  const link = document.createElement("a");
  link.href = url;
  link.download = "slander-creative";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function api<T>(
  path: string,
  access?: DemoAccess,
  method = "GET",
  body?: unknown,
): Promise<T> {
  if (PUBLIC_DEMO) {
    const { publicApi } = await import("./public-demo/api");
    return publicApi(path, access, method, body) as T;
  }
  const form = body instanceof FormData;
  const response = await fetch(`/api${path}`, {
    method,
    headers: {
      ...accessHeaders(access),
      ...(!form && body !== undefined
        ? { "Content-Type": "application/json" }
        : {}),
    },
    body: body === undefined ? undefined : form ? body : JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok)
    throw new Error(data.error || "The request failed. Please try again.");
  return data;
}

export async function downloadPost(id: string, access: DemoAccess) {
  const workspace = await api<{
    posts: { id: string; projectId: string }[];
    projects: { id: string; offerVersionId?: string }[];
  }>("/workspace", access);
  const post = workspace.posts.find((p) => p.id === id);
  const campaign = workspace.projects.find((p) => p.id === post?.projectId);
  let query = "";
  if (campaign?.offerVersionId) {
    const page = await api<{ items: { id: string; postId: string }[] }>(
      `/campaigns/${campaign.id}/records/distributions`,
      access,
    );
    const distribution = page.items.find((d) => d.postId === id);
    if (!distribution)
      throw new Error(
        "Create a distribution from Campaigns before exporting this creative.",
      );
    query = `?distributionId=${encodeURIComponent(distribution.id)}`;
  }
  const response = await fetch(`/api/posts/${id}/export${query}`, {
    headers: accessHeaders(access),
  });
  if (!response.ok)
    throw new Error((await response.json()).error || "The download failed.");
  const url = URL.createObjectURL(await response.blob());
  const link = document.createElement("a");
  link.href = url;
  link.download = `slander-${id}.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
