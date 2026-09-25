import { useState, type FormEvent } from "react";
import { Check, Upload, Send, Image as ImageIcon } from "lucide-react";
import { api } from "../api";
import { useWorkspace } from "../context";
import type { Post, Project, Format } from "../types";
import { Modal, Media } from "./ui";

export function SubmissionForm({
  project,
  post,
  onClose,
}: {
  project: Project;
  post?: Post;
  onClose: () => void;
}) {
  const { role, access, identity, refresh, notify } = useWorkspace();
  const [data, setData] = useState({
    title: post?.title || "",
    creator: post?.creator || (role === "creator" ? identity?.name || "" : ""),
    caption: post?.caption || "",
    format: post?.format || ("photo" as Format),
    media: post?.media || "",
    mediaType: post?.mediaType || ("image" as "image" | "video"),
    rights: post?.rights || false,
  });
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  async function upload(file?: File) {
    if (!file) return;
    setError("");
    if (file.size > 30 * 1024 * 1024) {
      setError("Choose a file smaller than 30 MB.");
      return;
    }
    setUploading(true);
    try {
      const form = new FormData();
      form.append("media", file);
      const media = await api<{ media: string; mediaType: "image" | "video" }>(
        "/uploads",
        access,
        "POST",
        form,
      );
      setData((d) => ({
        ...d,
        ...media,
        format: media.mediaType === "video" ? "reel" : "photo",
      }));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploading(false);
    }
  }
  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!data.media) {
      setError("Upload a creative or choose a sample image first.");
      return;
    }
    setSaving(true);
    try {
      await api(
        post ? `/posts/${post.id}` : `/projects/${project.id}/posts`,
        access,
        post ? "PUT" : "POST",
        { ...data, ...(post ? { revision: post.revision } : {}) },
      );
      await refresh();
      notify(
        post
          ? "Updated post sent for another review"
          : "Your post is in the review queue",
      );
      onClose();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }
  return (
    <Modal
      title={post ? "A fresh take." : "Your story starts here."}
      subtitle={`Submit a creative for ${project.name}`}
      onClose={onClose}
    >
      <form onSubmit={submit}>
        <div className="form-content">
          {post?.feedback && (
            <div className="callout amber">
              <p>
                <strong>Feedback from the nonprofit</strong>
                <br />
                {post.feedback}
              </p>
            </div>
          )}
          <div className="brief-mini">
            <span className="eyebrow">THE BRIEF</span>
            <p>{project.brief}</p>
          </div>
          <div className="form-grid">
            <label>
              Post title
              <input
                required
                maxLength={100}
                value={data.title}
                onChange={(e) => setData({ ...data, title: e.target.value })}
                placeholder="Give your idea a name"
              />
            </label>
            <label>
              Your name
              <input
                required
                maxLength={80}
                value={data.creator}
                readOnly={role === "creator" || !!post}
                onChange={(e) => setData({ ...data, creator: e.target.value })}
                placeholder="Creator name"
              />
            </label>
          </div>
          <label className="upload-zone">
            {data.media ? (
              <Media
                post={{
                  ...data,
                  title: data.title || "Your selected creative",
                }}
              />
            ) : (
              <Upload size={25} />
            )}
            <strong>
              {uploading
                ? "Uploading your creative…"
                : data.media
                  ? "Change your creative"
                  : "Choose a photo or video"}
            </strong>
            <span>JPG, PNG, WebP, MP4 or MOV · up to 30 MB</span>
            <input
              type="file"
              aria-label="Upload creative"
              accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime"
              onChange={(e) => {
                void upload(e.target.files?.[0]);
                e.target.value = "";
              }}
              disabled={uploading || saving}
            />
          </label>
          <div className="sample-picker">
            <span>
              <ImageIcon size={14} />
              Or try a sample
            </span>
            {["forest", "food", "seedling"].map((cover) => (
              <button
                key={cover}
                type="button"
                className={
                  data.media === `/images/${cover}.jpg` ? "selected" : ""
                }
                onClick={() =>
                  setData({
                    ...data,
                    media: `/images/${cover}.jpg`,
                    mediaType: "image",
                    format: "photo",
                  })
                }
                aria-label={`Use ${cover} sample`}
                disabled={uploading}
              >
                <img src={`/images/${cover}.jpg`} alt="" />
                {data.media === `/images/${cover}.jpg` && <Check size={12} />}
              </button>
            ))}
          </div>
          <label>
            Format
            <select
              value={data.format}
              onChange={(e) =>
                setData({ ...data, format: e.target.value as Format })
              }
            >
              <option value="photo">Photo post</option>
              <option value="reel">Reel</option>
              <option value="carousel">Carousel proposal</option>
              <option value="story">Story proposal</option>
              <option value="other">Other format proposal</option>
            </select>
          </label>
          {!["photo", "reel"].includes(data.format) && (
            <p className="field-help">
              We’ll retain this proposal for review. This format needs a
              separate handoff plan.
            </p>
          )}
          <label>
            Instagram caption
            <textarea
              required
              maxLength={2200}
              rows={5}
              value={data.caption}
              onChange={(e) => setData({ ...data, caption: e.target.value })}
              placeholder="A story worth stopping the scroll for…"
            />
            <span className="character-count">
              {data.caption.length.toLocaleString()} / 2,200
            </span>
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={data.rights}
              onChange={(e) => setData({ ...data, rights: e.target.checked })}
            />
            <span>
              I have the rights and necessary permissions to share this
              creative.
              <small>Posts cannot be approved until this is confirmed.</small>
            </span>
          </label>
        </div>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <div className="modal-footer">
          <button type="button" className="button secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="button primary" disabled={saving || uploading}>
            {saving
              ? "Submitting…"
              : post
                ? "Resubmit for review"
                : "Submit for review"}
            <Send size={15} />
          </button>
        </div>
      </form>
    </Modal>
  );
}
