import { useEffect, useRef, useState } from "react";
import { Play } from "lucide-react";
import { demoAsset } from "../runtime";
import { mediaResponse } from "../api";
import type { DemoAccess, Post } from "../types";
import { mediaFile } from "./media";

export function AdMedia({
  ad,
  full = false,
  access,
  previewOnly = false,
}: {
  ad: Pick<Post, "media" | "mediaType" | "title"> & { poster?: string };
  full?: boolean;
  access?: DemoAccess;
  previewOnly?: boolean;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const [source, setSource] = useState("");
  const [watching, setWatching] = useState(false);
  const scoped =
    ad.media.startsWith("/api/media/") || ad.media.startsWith("/uploads/");
  useEffect(() => {
    if (!scoped) return;
    let disposed = false,
      url = "";
    setSource("");
    // Creator uploads use the existing scoped media adapter; public cards only
    // receive media already included in the eligible public projection.
    const request = access
      ? mediaResponse(ad.media, access).then((response) =>
          response.ok ? response.blob() : undefined,
        )
      : mediaFile(ad.media);
    void request
      .then((blob) => {
        if (blob && !disposed) {
          url = URL.createObjectURL(blob);
          setSource(url);
        }
      })
      .catch(() => {});
    return () => {
      disposed = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [ad.media, scoped, access?.role, access?.creatorId, access?.nonprofitId]);
  const src = scoped ? source : demoAsset(ad.media);
  function preview() {
    if (
      !full &&
      !watching &&
      !matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      void video.current?.play().catch(() => {});
  }
  function stop() {
    if (!full && !watching && video.current) {
      video.current.pause();
      video.current.currentTime = 0;
    }
  }
  return ad.mediaType === "video" ? (
    <>
      <video
        ref={video}
        src={src || undefined}
        poster={ad.poster ? demoAsset(ad.poster) : undefined}
        muted={!full && !watching}
        loop={!full && !watching}
        controls={full || watching}
        tabIndex={previewOnly ? -1 : full || watching ? undefined : 0}
        playsInline
        preload="metadata"
        aria-label={ad.title}
        aria-hidden={previewOnly || undefined}
        onPointerEnter={(event) => {
          if (event.pointerType === "mouse") preview();
        }}
        onPointerLeave={stop}
        onFocus={preview}
        onBlur={stop}
        onTimeUpdate={() => {
          if (
            !full &&
            !watching &&
            video.current &&
            video.current.currentTime > 4
          )
            video.current.currentTime = 0;
        }}
      />
      {!full && !watching && !previewOnly && (
        <button
          className="inline-play"
          aria-label={`Play ${ad.title}`}
          onClick={() => {
            const player = video.current;
            if (!player) return;
            player.currentTime = 0;
            player.muted = false;
            player.loop = false;
            setWatching(true);
            void player.play().catch(() => {});
          }}
        >
          <Play size={14} fill="currentColor" /> Play
        </button>
      )}
    </>
  ) : (
    <img src={src || undefined} alt={ad.title} />
  );
}
