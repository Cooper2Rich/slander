import { useState, type FormEvent } from "react";
import { ArrowRight, Check, Info } from "lucide-react";
import { api } from "../api";
import { useWorkspace } from "../context";
import type { Project } from "../types";
import { Modal, Instagram } from "./ui";

export function ProjectForm({
  project,
  onClose,
  accountFocus = false,
}: {
  project?: Project;
  onClose: () => void;
  accountFocus?: boolean;
}) {
  const { refresh, notify, role, access } = useWorkspace();
  const [tab, setTab] = useState(accountFocus ? "account" : "details");
  const [data, setData] = useState({
    name: project?.name || "",
    nonprofit: project?.nonprofit || "",
    category: project?.category || "Environment",
    description: project?.description || "",
    brief: project?.brief || "",
    cover: project?.cover || "forest",
    startDate: project?.startDate || new Date().toISOString().slice(0, 10),
    endDate:
      project?.endDate ||
      new Date(Date.now() + 75 * 86400000).toISOString().slice(0, 10),
    status: project?.status || "draft",
    instagram: project?.instagram || "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const set = (key: string, value: string) =>
    setData((d) => ({ ...d, [key]: value }));
  async function save(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await api(
        project ? `/projects/${project.id}` : "/projects",
        access,
        project ? "PUT" : "POST",
        data,
      );
      await refresh();
      notify(project ? "Project settings saved" : "Your new project is ready");
      onClose();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }
  return (
    <Modal
      title={project ? "Project settings" : "Make room for something good."}
      subtitle={
        project
          ? project.name
          : "Start with a mission. Your creators will bring the stories."
      }
      onClose={onClose}
    >
      <div className="form-tabs">
        <button
          className={tab === "details" ? "selected" : ""}
          onClick={() => setTab("details")}
        >
          Project details
        </button>
        <button
          className={tab === "account" ? "selected" : ""}
          onClick={() => setTab("account")}
        >
          <Instagram size={15} />
          Instagram account
        </button>
      </div>
      <form onSubmit={save} className="project-form">
        <div className="form-content" hidden={tab !== "details"}>
          <label>
            Project name
            <input
              required
              maxLength={80}
              value={data.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="A name for your next big idea"
            />
          </label>
          <div className="form-grid">
            <label>
              Nonprofit name
              <input
                required
                maxLength={80}
                value={data.nonprofit}
                readOnly={role === "nonprofit"}
                onChange={(e) => set("nonprofit", e.target.value)}
                placeholder="Your organization"
              />
            </label>
            <label>
              Cause
              <select
                value={data.category}
                onChange={(e) => set("category", e.target.value)}
              >
                {[
                  "Environment",
                  "Food & community",
                  "Education",
                  "Health & wellbeing",
                  "Animal welfare",
                  "Arts & culture",
                  "Other",
                ].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
          </div>
          <label>
            About the project
            <textarea
              required
              maxLength={600}
              value={data.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="What change are you hoping to make?"
              rows={3}
            />
          </label>
          <label>
            Creator brief
            <textarea
              required
              maxLength={1200}
              value={data.brief}
              onChange={(e) => set("brief", e.target.value)}
              placeholder="Tell creators what makes a great story for this project."
              rows={3}
            />
          </label>
          <div className="form-grid">
            <label>
              Start date
              <input
                type="date"
                required
                value={data.startDate}
                onChange={(e) => set("startDate", e.target.value)}
              />
            </label>
            <label>
              End date
              <input
                type="date"
                required
                min={data.startDate}
                value={data.endDate}
                onChange={(e) => set("endDate", e.target.value)}
              />
            </label>
          </div>
          <div className="form-grid">
            <label>
              Project status
              <select
                value={data.status}
                onChange={(e) => set("status", e.target.value)}
              >
                <option value="draft">Draft — preparing the project</option>
                <option value="active">
                  Published — accept submissions within dates
                </option>
                <option value="archived">
                  Archived — close submissions and review
                </option>
              </select>
            </label>
            <label>
              Cover image
              <select
                value={data.cover}
                onChange={(e) => set("cover", e.target.value)}
              >
                <option value="forest">Into the green</option>
                <option value="food">Around the table</option>
                <option value="education">A world of possibility</option>
                <option value="seedling">New beginnings</option>
              </select>
            </label>
          </div>
        </div>
        <div className="form-content" hidden={tab !== "account"}>
          <div className="instagram-intro">
            <span className="instagram-icon">
              <Instagram size={30} />
            </span>
            <h3>One project. One official voice.</h3>
            <p>
              Pair this project with the nonprofit’s Instagram account so every
              approved post has a clear destination.
            </p>
          </div>
          <label>
            Nonprofit Instagram account{" "}
            <span className="optional">Optional</span>
            <div className="input-with-prefix">
              <span>@</span>
              <input
                value={data.instagram}
                onChange={(e) => set("instagram", e.target.value)}
                placeholder="your.nonprofit"
                maxLength={150}
                aria-label="Nonprofit Instagram account"
              />
            </div>
          </label>
          <p className="field-help">
            Enter a username or Instagram profile URL. You can add it later or
            clear it to remove the pairing.
          </p>
          <div className="callout">
            <Info size={18} />
            <p>
              This saves the destination for this project. Live Instagram
              authorization and publishing are not enabled in this demo.
            </p>
          </div>
          <div className="account-checks">
            <span>
              <Check size={16} />
              Review posts before an account is added
            </span>
            <span>
              <Check size={16} />
              Keep each nonprofit’s destination separate
            </span>
            <span>
              <Check size={16} />
              Only approved posts can be handed off
            </span>
          </div>
          {!project && (
            <button
              type="button"
              className="text-button"
              onClick={() => setTab("details")}
            >
              Complete project details <ArrowRight size={15} />
            </button>
          )}
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
          <button
            className="button primary"
            disabled={saving}
            onClick={() => {
              if (
                !data.name ||
                !data.nonprofit ||
                !data.description ||
                !data.brief
              )
                setTab("details");
            }}
          >
            {saving ? "Saving…" : project ? "Save changes" : "Create project"}
            <ArrowRight size={16} />
          </button>
        </div>
      </form>
    </Modal>
  );
}
