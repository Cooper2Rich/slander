import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowUpRight, Heart, Play, Search } from "lucide-react";
import App from "../App";
import { Logo, Modal } from "../components/ui";
import { demoAsset } from "../runtime";
import { mediaFile } from "./media";
import {
  activeViewer,
  createViewer,
  fundAd,
  fundedCents,
  loadAds,
  money,
  selectViewer,
  viewerState,
  type PublicAd,
} from "./catalog";
import * as demoViews from "./WorkspaceViews";
import { AdStats } from "./AdStats";

export function enterWorkspace(
  role: string,
  navigate: ReturnType<typeof useNavigate>,
) {
  localStorage.setItem(
    "slander-public-access-v1",
    JSON.stringify({ role, creatorId: null, nonprofitId: null }),
  );
  navigate(role === "creator" ? "/review" : "/projects");
}
function AdMedia({ ad, full = false }: { ad: PublicAd; full?: boolean }) {
  const video = useRef<HTMLVideoElement>(null);
  const [source, setSource] = useState("");
  useEffect(() => {
    let disposed = false,
      url = "";
    if (ad.media.startsWith("/api/media/"))
      void mediaFile(ad.media).then((blob) => {
        if (blob && !disposed) {
          url = URL.createObjectURL(blob);
          setSource(url);
        }
      });
    return () => {
      disposed = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [ad.media]);
  const src = ad.media.startsWith("/api/media/") ? source : demoAsset(ad.media);
  function preview() {
    if (!full && !matchMedia("(prefers-reduced-motion: reduce)").matches)
      void video.current?.play().catch(() => {});
  }
  function stop() {
    if (!full && video.current) {
      video.current.pause();
      video.current.currentTime = 0;
    }
  }
  return ad.mediaType === "video" ? (
    <video
      ref={video}
      src={src || undefined}
      poster={demoAsset(ad.poster)}
      muted={!full}
      loop={!full}
      controls={full}
      playsInline
      preload="metadata"
      aria-label={ad.title}
      onPointerEnter={preview}
      onPointerLeave={stop}
      onFocus={preview}
      onBlur={stop}
    />
  ) : (
    <img src={src || undefined} alt={ad.title} />
  );
}
export default function PublicApp() {
  const location = useLocation(),
    navigate = useNavigate();
  const publicRoute =
    location.pathname === "/" ||
    location.pathname === "/explore" ||
    location.pathname.startsWith("/ads/") ||
    location.pathname === "/viewer";
  const [ads, setAds] = useState<PublicAd[] | null>(null),
    [error, setError] = useState("");
  const [search, setSearch] = useState(""),
    [category, setCategory] = useState("All causes");
  const [support, setSupport] = useState<PublicAd | null>(null);
  const [version, setVersion] = useState(0);
  useEffect(() => {
    if (publicRoute) {
      setAds(null);
      void loadAds()
        .then(setAds)
        .catch((e) => setError(e.message));
    }
  }, [publicRoute, location.pathname]);
  useEffect(() => {
    if (publicRoute) document.title = "Discover stories · Ripple";
  }, [publicRoute]);
  if (!publicRoute) return <App demoViews={demoViews} />;
  const adId = location.pathname.startsWith("/ads/")
    ? decodeURIComponent(location.pathname.slice(5))
    : null;
  const selected = ads?.find((ad) => ad.id === adId);
  const viewer = activeViewer(),
    state = viewerState();
  const filtered = ads?.filter(
    (ad) =>
      `${ad.title} ${ad.creator} ${ad.project}`
        .toLowerCase()
        .includes(search.toLowerCase()) &&
      (category === "All causes" || ad.category === category),
  );
  const update = () => setVersion(version + 1);
  return (
    <div className="discovery-shell">
      <a
        href="#discovery-content"
        className="skip-link"
        onClick={(event) => {
          event.preventDefault();
          document.getElementById("discovery-content")?.focus();
          document.getElementById("discovery-content")?.scrollIntoView();
        }}
      >
        Skip to content
      </a>
      <header className="discovery-header">
        <Link to="/explore" aria-label="Ripple home">
          <Logo />
        </Link>
        <nav aria-label="Public navigation">
          <Link to="/explore">Discover ads</Link>
          <Link to="/viewer">{viewer ? "My giving" : "Viewer account"}</Link>
        </nav>
        <label className="demo-view-picker">
          <span>Preview as</span>
          <select
            aria-label="Demo role"
            value="public"
            onChange={(e) => enterWorkspace(e.target.value, navigate)}
          >
            <option value="public">Public viewer</option>
            <option value="creator">Creator</option>
            <option value="nonprofit">Campaign Owner</option>
            <option value="admin">Admin View</option>
          </select>
        </label>
      </header>
      <main id="discovery-content" className="discovery-content" tabIndex={-1}>
        {error && <p role="alert">{error}</p>}
        {location.pathname === "/viewer" ? (
          <>
            <div className="discovery-heading">
              <span className="eyebrow">YOUR GENEROSITY. YOUR IMPACT.</span>
              <h1>
                {viewer
                  ? `Hello, ${viewer.name}.`
                  : "A little support goes a long way."}
              </h1>
              <p>
                A viewer profile lets you support ad spend and follow your
                giving. Browse anytime without an account.
              </p>
            </div>
            {viewer ? (
              <section className="market-panel">
                <div className="section-toolbar">
                  <h2>My giving</h2>
                  <button
                    className="text-button"
                    onClick={() => {
                      selectViewer(null);
                      update();
                    }}
                  >
                    Leave viewer profile
                  </button>
                </div>
                <p>
                  Viewer account · {viewer.email} · saved only in this browser.
                </p>
                <strong className="giving-total">
                  {money(
                    state.support
                      .filter((s) => s.viewerId === viewer.id)
                      .reduce((n, s) => n + s.amountCents, 0),
                  )}
                </strong>
                <p>Simulated contributions to ad spend</p>
                {state.support
                  .filter((s) => s.viewerId === viewer.id)
                  .map((s) => (
                    <div key={s.id} className="support-row">
                      <Link to={`/ads/${s.adId}`}>{s.title}</Link>
                      <span>
                        {money(s.amountCents)} ·{" "}
                        {new Date(s.at).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                {!state.support.some((s) => s.viewerId === viewer.id) && (
                  <p>
                    Your first supported story is waiting.{" "}
                    <Link to="/explore">Discover ads ↗</Link>
                  </p>
                )}
              </section>
            ) : (
              <ViewerForm onDone={update} />
            )}
          </>
        ) : adId ? (
          selected ? (
            <>
              <Link className="text-button" to="/explore">
                ← Discover all ads
              </Link>
              <div className="ad-profile">
                <section className="profile-media">
                  <AdMedia ad={selected} full />
                </section>
                <section className="profile-copy">
                  <span className="eyebrow">
                    {selected.category} · AD PROFILE
                  </span>
                  <h1>{selected.title}</h1>
                  <p className="creator-byline">
                    Created by <strong>{selected.creator}</strong>
                  </p>
                  <p>{selected.caption}</p>
                  <div className="profile-cause">
                    <small>SUPPORTING</small>
                    <h2>{selected.project}</h2>
                    <p>{selected.nonprofit}</p>
                  </div>
                  <AdStats ad={selected} />
                  <p className="metrics-note">
                    {selected.impressions === null
                      ? "Performance data is not connected yet."
                      : "Illustrative sample metrics, not live platform results. $ donated represents gifts to the cause."}
                  </p>
                  <div className="spend-callout">
                    <Heart size={21} />
                    <div>
                      <strong>Help this story reach more people.</strong>
                      <p>
                        {money(fundedCents(selected.id))} contributed to this
                        ad’s spend in this browser.
                      </p>
                    </div>
                  </div>
                  <button
                    className="button primary"
                    onClick={() => setSupport(selected)}
                  >
                    Fund ad spend <ArrowUpRight size={17} />
                  </button>
                  <small className="metrics-note">
                    Ad spend supports distribution. It is separate from a
                    donation to the cause.
                  </small>
                </section>
              </div>
            </>
          ) : (
            <div className="market-panel">
              <h1>{ads ? "This ad is unavailable." : "Loading story…"}</h1>
              <p>Only currently eligible ads in active campaigns are public.</p>
              <Link to="/explore">Discover ads</Link>
            </div>
          )
        ) : (
          <>
            <section className="discovery-hero">
              <div>
                <span className="eyebrow">
                  GOOD STORIES DESERVE TO BE SEEN.
                </span>
                <h1>
                  Find a story.
                  <br />
                  <em>Help it go further.</em>
                </h1>
                <p>
                  Discover creators making a difference. Watch their stories,
                  see the impact, and help the ads you love reach more people.
                </p>
                <a
                  href="#stories"
                  className="button primary"
                  onClick={(event) => {
                    event.preventDefault();
                    document.getElementById("stories")?.scrollIntoView({
                      behavior: matchMedia("(prefers-reduced-motion: reduce)")
                        .matches
                        ? "instant"
                        : "smooth",
                    });
                  }}
                >
                  Explore the stories <ArrowUpRight size={17} />
                </a>
              </div>
              <div className="discovery-art">
                <img
                  src={demoAsset("images/nocturne-midnight-filmed-v2.jpg")}
                  alt="Fresh coffee being poured through a filter"
                />
                <span>
                  Nocturne Coffee.
                  <br />
                  <strong>Made for after dark.</strong> ✳
                </span>
              </div>
            </section>
            <section
              className="collection-banner"
              aria-label="Nocturne Coffee collection"
            >
              <div>
                <span className="eyebrow">
                  FEATURED COLLECTION · FINISHED FILMS
                </span>
                <h2>Three films. One after-dark ritual.</h2>
                <p>
                  Nocturne Coffee · three 16-second coffee shop ads, ready to
                  watch with sound.
                </p>
              </div>
              <button
                className="button secondary"
                onClick={() => {
                  setCategory("Coffee & culture");
                  setSearch("");
                  document.getElementById("stories")?.scrollIntoView();
                }}
              >
                Watch coffee collection <Play size={16} />
              </button>
            </section>
            <section id="stories">
              <div className="discovery-toolbar">
                <div>
                  <span className="eyebrow">
                    THE NEXT STORY YOU CAN MOVE FORWARD
                  </span>
                  <h2>
                    Stories for good<span className="title-dot">.</span>
                  </h2>
                </div>
                <div className="discovery-filters">
                  <label className="discovery-search">
                    <Search size={17} />
                    <input
                      aria-label="Search ads"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search stories or creators"
                    />
                  </label>
                  <select
                    aria-label="Filter by cause"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    {[
                      "All causes",
                      ...new Set(ads?.map((ad) => ad.category)),
                    ].map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
              <p className="metrics-note">
                Hover to preview · tap or click to open a profile · sample
                metrics are illustrative
              </p>
              <div className="ad-grid">
                {filtered?.map((ad) => (
                  <article key={ad.id} className="ad-card">
                    <Link
                      className="ad-card-media"
                      to={`/ads/${ad.id}`}
                      aria-label={`View ${ad.title}`}
                      onFocus={(e) => {
                        if (
                          !matchMedia("(prefers-reduced-motion: reduce)")
                            .matches
                        )
                          void e.currentTarget
                            .querySelector("video")
                            ?.play()
                            .catch(() => {});
                      }}
                      onBlur={(e) => {
                        const video = e.currentTarget.querySelector("video");
                        if (video) {
                          video.pause();
                          video.currentTime = 0;
                        }
                      }}
                    >
                      <AdMedia ad={ad} />
                      <span className="ad-category">{ad.category}</span>
                      {ad.durationSeconds && (
                        <span className="ad-duration">
                          0:{ad.durationSeconds} · Finished ad
                        </span>
                      )}
                      {ad.mediaType === "video" && (
                        <span className="ad-play">
                          <Play size={18} fill="currentColor" /> Preview
                        </span>
                      )}
                    </Link>
                    <div className="ad-card-copy">
                      <span className="eyebrow">{ad.nonprofit}</span>
                      <Link to={`/ads/${ad.id}`}>
                        <h3>{ad.title}</h3>
                      </Link>
                      <p>by {ad.creator}</p>
                      <AdStats ad={ad} />
                      <button
                        className="button primary full"
                        onClick={() => setSupport(ad)}
                      >
                        Fund ad spend <Heart size={16} />
                      </button>
                      <small>
                        {money(fundedCents(ad.id))} ad spend funded here
                      </small>
                    </div>
                  </article>
                ))}
              </div>
              {ads && !filtered?.length && (
                <div className="empty-state">
                  <h3>No matching stories yet.</h3>
                  <p>Try another search or cause.</p>
                </div>
              )}
              {!ads && !error && <p role="status">Gathering good stories…</p>}
            </section>
          </>
        )}
      </main>
      <footer className="discovery-footer">
        <Logo small />
        <p>Stories for good. A little louder.</p>
        <span>Fictional demo · no real donations or ad delivery</span>
      </footer>
      {support && (
        <SupportDialog
          ad={support}
          onClose={() => {
            setSupport(null);
            update();
          }}
        />
      )}
    </div>
  );
}

function ViewerForm({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState(""),
    [email, setEmail] = useState(""),
    [error, setError] = useState("");
  const profiles = viewerState().profiles;
  return (
    <div className="viewer-form market-panel">
      <h2>Create a viewer profile</h2>
      <p>For the general public: support ads and keep a giving history.</p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          try {
            createViewer(name, email);
            onDone();
          } catch (e) {
            setError((e as Error).message);
          }
        }}
      >
        <label>
          Your name
          <input
            required
            maxLength={80}
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
          />
        </label>
        <label>
          Email address
          <input
            required
            type="email"
            maxLength={254}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </label>
        <p className="metrics-note">
          Demo profile only, saved on this device. No password, external login,
          or email verification. This does not create a creator, campaign owner,
          or admin account.
        </p>
        {error && <p role="alert">{error}</p>}
        <button className="button primary" type="submit">
          Create viewer profile <ArrowUpRight size={16} />
        </button>
      </form>
      {!!profiles.length && (
        <label className="saved-viewers">
          Saved viewer profiles
          <select
            aria-label="Saved viewer profiles"
            defaultValue=""
            onChange={(e) => {
              if (e.target.value) {
                selectViewer(e.target.value);
                onDone();
              }
            }}
          >
            <option value="" disabled>
              Choose your demo profile
            </option>
            {profiles.map((p) => (
              <option value={p.id} key={p.id}>
                {p.name} · {p.email}
              </option>
            ))}
          </select>
        </label>
      )}
    </div>
  );
}
function SupportDialog({ ad, onClose }: { ad: PublicAd; onClose: () => void }) {
  const [amount, setAmount] = useState("25"),
    [error, setError] = useState(""),
    [done, setDone] = useState(false),
    [version, setVersion] = useState(0);
  const [requestId] = useState(() => crypto.randomUUID());
  return (
    <Modal
      title={
        done ? "A little louder. Thanks to you." : "Help this ad go further"
      }
      subtitle={ad.title}
      onClose={onClose}
    >
      <div className="form-content">
        {done ? (
          <div role="status">
            <h3>
              {money(Math.round(Number(amount) * 100))} in simulated ad support
            </h3>
            <p>
              Your contribution is saved to your viewer profile and this ad’s
              spend fund. No money was charged.
            </p>
            <Link className="text-button" to="/viewer" onClick={onClose}>
              View my giving ↗
            </Link>
          </div>
        ) : !activeViewer() ? (
          <ViewerForm key={version} onDone={() => setVersion(version + 1)} />
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              try {
                fundAd(ad, amount, requestId);
                setDone(true);
              } catch (e) {
                setError((e as Error).message);
              }
            }}
          >
            <p>
              Contributing as <strong>{activeViewer()?.name}</strong> · Viewer
            </p>
            <p>
              This contribution funds distribution of “{ad.title}”. It is
              separate from cause donations, creator commission, and donation
              votes.
            </p>
            <div className="giving-presets">
              {[10, 25, 50, 100].map((n) => (
                <button
                  type="button"
                  className={`button ${amount === String(n) ? "primary" : "secondary"}`}
                  key={n}
                  onClick={() => setAmount(String(n))}
                >
                  {money(n * 100)}
                </button>
              ))}
            </div>
            <label className="amount-field">
              Amount in USD
              <input
                type="number"
                required
                min="1"
                max="1000"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </label>
            <p className="metrics-note">
              Simulated ad spend contribution · no payment details or money
              movement.
            </p>
            {error && <p role="alert">{error}</p>}
            <button className="button primary full" type="submit">
              Confirm simulated contribution <Heart size={16} />
            </button>
          </form>
        )}
      </div>
      {done && (
        <div className="modal-footer">
          <button className="button primary" onClick={onClose}>
            Keep discovering <ArrowUpRight size={16} />
          </button>
        </div>
      )}
    </Modal>
  );
}
