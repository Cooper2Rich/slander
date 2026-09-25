import type { DemoAccess } from "./types";

function accessHeaders(access?: DemoAccess) {
  return access
    ? {
        "x-demo-role": access.role,
        ...(access.nonprofitId
          ? { "x-demo-nonprofit": access.nonprofitId }
          : {}),
        ...(access.creatorId ? { "x-demo-creator": access.creatorId } : {}),
      }
    : {};
}

export async function api<T>(
  path: string,
  access?: DemoAccess,
  method = "GET",
  body?: unknown,
): Promise<T> {
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
  const response = await fetch(`/api/posts/${id}/export`, {
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
