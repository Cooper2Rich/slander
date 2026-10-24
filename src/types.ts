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
export type PostStatus =
  "pending" | "approved" | "changes" | "rejected" | "held";
export interface EligibilityPolicy {
  version: number;
  allowedChannels: string[];
  allowedFormats: string[];
  destinations: string[];
  compensationDisclosure: string;
  beneficiaryDisclosure: string;
  factualClaims: string[];
  termsVersion: string;
  maxFileBytes: number;
}
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
  coverMedia?: string;
  color: string;
  startDate: string;
  endDate: string;
  status: "draft" | "active" | "archived";
  instagram?: string;
  createdAt: string;
  eligibilityPolicy: EligibilityPolicy;
  policyConfig?: Omit<EligibilityPolicy, "version">;
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
  channel?: string;
  destination?: string;
  disclosures?: { compensation: string; beneficiary: string };
  factualClaims?: string[];
  acceptedTermsVersion?: string;
  eligibility?: {
    id: string;
    outcome: string;
    snapshotDigest: string;
    policyVersion: number;
    ruleVersion: string;
    factVersion: string;
    reasons: { code: string; message: string }[];
    facts: { holds: { id: string; reason: string; evidence: string }[] };
  };
  snapshots?: { id: string; revision: number; digest: string }[];
  appeals?: {
    id: string;
    holdId: string;
    note: string;
    resolution?: { correctedFact: string };
  }[];
  policy?: { passed: boolean; reasons: string[]; version: string };
  revision: number;
  createdAt: string;
  updatedAt: string;
  feedback: string;
  withdrawnAt?: string;
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
  ownArchivedPosts?: string[];
  ownPastAds?: { postId: string; campaign: string; reason: string }[];
  projects: Project[];
  posts: Post[];
  approvedPosts: Post[];
  activity: Activity[];
}
