import type { DemoAccess } from "../types";
export const campaignId: string;
export const creatorId: string;
export const ownerId: string;
export function prepareWorkspace(): Promise<void>;
export function workspaceRequest(
  path: string,
  access?: DemoAccess,
  method?: string,
  body?: unknown,
): Promise<{ handled: boolean; data?: unknown }>;
export function attributionFor(
  token: string | null,
):
  | { id: string; creatorId: string; postId: string; snapshotId: string }
  | undefined;
export function previewMedia(
  path: string,
  access?: DemoAccess,
): Promise<Response>;
