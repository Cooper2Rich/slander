export type Role = "admin" | "nonprofit" | "creator";
export interface Identity {
  id: string;
  name: string;
}
export interface DemoAccess {
  role: Role;
  nonprofitId: string | null;
  creatorId: string | null;
}
export interface DemoOptions {
  nonprofits: Identity[];
  creators: Identity[];
}
export type PostStatus = "pending" | "approved" | "changes" | "rejected";
export type Format = "photo" | "reel" | "carousel" | "story" | "other";
export interface Project {
  id: string;
  name: string;
  nonprofit: string;
  nonprofitId?: string;
  category: string;
  description: string;
  brief: string;
  cover: string;
  color: string;
  startDate: string;
  endDate: string;
  status: "draft" | "active" | "archived";
  instagram?: string;
  createdAt: string;
}
export interface HistoryEvent {
  id: string;
  action: string;
  actor: string;
  note: string;
  at: string;
}
export interface Post {
  id: string;
  projectId: string;
  title: string;
  creator: string;
  creatorId: string;
  format: Format;
  caption: string;
  status: PostStatus;
  media: string;
  mediaType: "image" | "video";
  rights?: boolean;
  policy?: { passed: boolean; reasons: string[]; version: string };
  revision: number;
  createdAt: string;
  updatedAt: string;
  feedback: string;
  history: HistoryEvent[];
  readiness?: { ready: boolean; reasons: string[] };
}
export interface Activity {
  id: string;
  action: string;
  title: string;
  detail: string;
  projectId?: string;
  at: string;
}
export interface Workspace {
  projects: Project[];
  posts: Post[];
  approvedPosts: Post[];
  activity: Activity[];
}
