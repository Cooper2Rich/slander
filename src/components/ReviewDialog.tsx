import { useState } from "react";
import {
  Check,
  CheckCircle2,
  CircleAlert,
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  MoreHorizontal,
  Download,
  ArrowRight,
} from "lucide-react";
import { api, downloadPost } from "../api";
import { useWorkspace } from "../context";
import type { Post, PostStatus } from "../types";
import {
  Modal,
  Media,
  StatusBadge,
  Avatar,
  FormatLabel,
  relativeTime,
  Instagram,
} from "./ui";
import { SubmissionForm } from "./SubmissionForm";

export function ReviewDialog({
  post: initialPost,
  onClose,
}: {
  post: Post;
  onClose: () => void;
}) {
  const { projects, posts, role, access, refresh, notify } = useWorkspace();
  const post = posts.find((p) => p.id === initialPost.id) || initialPost;
  const project = projects.find((p) => p.id === post.projectId)!;
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  async function decide(decision: PostStatus) {
    setError("");
    setSaving(true);
    try {
      await api(`/posts/${post.id}/review`, access, "POST", {
        decision,
        note,
        revision: post.revision,
      });
      await refresh();
      notify(
        decision === "approved"
          ? "Post approved. The creator can see your decision."
          : decision === "changes"
            ? "Feedback saved for the creator"
            : "Post declined with your feedback",
      );
      onClose();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }
  async function exportPost() {
    setError("");
    try {
      await downloadPost(post.id, access);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  if (editing)
    return <SubmissionForm project={project} post={post} onClose={onClose} />;
  return (
    <Modal
      title={post.title}
      subtitle={`${project.name} · Revision ${post.revision}`}
      onClose={onClose}
      wide
    >
      <div className="review-layout">
        <div className="preview-column">
          <span className="eyebrow">INSTAGRAM PREVIEW</span>
          <div className="instagram-preview">
            <div className="ig-top">
              <span className={`nonprofit-icon ${project.color}`}>
                <Instagram size={19} />
              </span>
              <div>
                <strong>{project.instagram || project.nonprofit}</strong>
                <small>{project.nonprofit}</small>
              </div>
              <MoreHorizontal size={21} />
            </div>
            <Media post={post} className="ig-media" />
            <div className="ig-actions" aria-hidden="true">
              <Heart />
              <MessageCircle />
              <Send />
              <Bookmark />
            </div>
            <p className="ig-caption">
              <strong>{project.instagram || project.nonprofit}</strong>{" "}
              {post.caption}
            </p>
          </div>
          <p className="preview-note">
            Preview only · This post has not been published.
          </p>
        </div>
        <div className="review-column">
          <div className="review-meta">
            <StatusBadge status={post.status} />
            <FormatLabel format={post.format} />
          </div>
          <div className="creator-info">
            <Avatar name={post.creator} />
            <div>
              <strong>{post.creator}</strong>
              <span>Submitted {relativeTime(post.createdAt)}</span>
            </div>
          </div>
          {post.policy && (
            <div className={`check-card ${post.policy.passed ? "" : "failed"}`}>
              {post.policy.passed ? (
                <CheckCircle2 size={20} />
              ) : (
                <CircleAlert size={20} />
              )}
              <div>
                <strong>
                  {post.policy.passed
                    ? "Submission checks passed"
                    : "Submission checks need attention"}
                </strong>
                <p>
                  {post.policy.passed
                    ? "Caption, media type, and rights confirmation checked."
                    : post.policy.reasons.join(" ")}
                </p>
                <small>
                  Basic demo checks. A person must review the creative.
                </small>
              </div>
            </div>
          )}
          {role !== "creator" && (
            <div className="destination-card">
              <Instagram size={20} />
              <div>
                <strong>
                  {project.instagram
                    ? `@${project.instagram}`
                    : "Instagram account pending"}
                </strong>
                <p>
                  {project.instagram
                    ? "Project destination paired · Live authorization pending"
                    : "You can approve now and add the account later."}
                </p>
              </div>
            </div>
          )}
          {role !== "creator" && !["photo", "reel"].includes(post.format) && (
            <div className="callout amber">
              <CircleAlert size={18} />
              <p>
                This format proposal can be reviewed, but needs a separate
                handoff plan.
              </p>
            </div>
          )}
          {post.feedback && (
            <div className="feedback-card">
              <span className="eyebrow">NONPROFIT FEEDBACK</span>
              <p>{post.feedback}</p>
            </div>
          )}
          {role !== "creator" &&
            post.status === "pending" &&
            project.status !== "archived" && (
              <div className="decision-form">
                <label>
                  Feedback for the creator{" "}
                  <span className="optional">
                    Required for changes or decline
                  </span>
                  <textarea
                    rows={3}
                    maxLength={2000}
                    placeholder="What works? What could be even better?"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </label>
                {error && (
                  <p className="inline-error" role="alert">
                    {error}
                  </p>
                )}
                <button
                  className="button primary full"
                  onClick={() => void decide("approved")}
                  disabled={saving || !post.policy?.passed}
                >
                  <Check size={17} />
                  {saving ? "Saving decision…" : "Approve post"}
                </button>
                <div className="decision-secondary">
                  <button
                    className="button secondary"
                    disabled={saving}
                    onClick={() => void decide("changes")}
                  >
                    Request changes
                  </button>
                  <button
                    className="button subtle danger-text"
                    disabled={saving}
                    onClick={() => void decide("rejected")}
                  >
                    Decline
                  </button>
                </div>
              </div>
            )}
          {(role === "admin" ||
            (role === "creator" && post.creatorId === access.creatorId)) &&
            ["pending", "changes"].includes(post.status) &&
            project.status === "active" && (
              <button
                className="button primary full"
                onClick={() => setEditing(true)}
              >
                Edit & resubmit
                <ArrowRight size={16} />
              </button>
            )}
          {role !== "creator" &&
            post.status === "approved" &&
            post.readiness && (
              <div className="handoff-box">
                <strong>
                  {post.readiness.ready
                    ? "Ready for Instagram handoff"
                    : "Approved. One more thing…"}
                </strong>
                <p>
                  {post.readiness.ready
                    ? "Download the approved caption and details, then save the creative for your nonprofit’s Instagram workflow."
                    : post.readiness.reasons.join(". ") + "."}
                </p>
                {post.readiness.ready && (
                  <div className="handoff-links">
                    <button
                      onClick={() => void exportPost()}
                      className="button secondary"
                    >
                      <Download size={15} />
                      Post details
                    </button>
                    <a href={post.media} className="text-button" download>
                      Save creative
                      <Download size={14} />
                    </a>
                  </div>
                )}
              </div>
            )}
          {role === "creator" && post.status === "approved" && (
            <div className="check-card">
              <CheckCircle2 size={20} />
              <div>
                <strong>Approved by the nonprofit</strong>
                <p>This creative is included in the approved-post library.</p>
              </div>
            </div>
          )}
          {error && post.status !== "pending" && (
            <p className="inline-error" role="alert">
              {error}
            </p>
          )}
          {post.history.length > 0 && (
            <div className="review-history">
              <h4>Review history</h4>
              {[...post.history].reverse().map((event) => (
                <div className="history-item" key={event.id}>
                  <span className="history-dot" />
                  <div>
                    <strong>
                      {event.action === "submitted"
                        ? "Submitted for review"
                        : event.action === "resubmitted"
                          ? "Resubmitted for review"
                          : event.action === "approved"
                            ? "Approved"
                            : event.action === "changes"
                              ? "Changes requested"
                              : "Declined"}
                    </strong>
                    <p>{event.note}</p>
                    <small>
                      {event.actor} · {relativeTime(event.at)}
                    </small>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
