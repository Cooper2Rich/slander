import { useCallback, useEffect, useRef } from "react";

export const PREVIEW_SECONDS = 5;

export function useAdPreview(source: string | undefined) {
  const video = useRef<HTMLVideoElement>(null);
  const manual = useRef(false);
  const previewing = useRef(false);
  const frame = useRef(0);
  const cancel = useCallback(() => {
    cancelAnimationFrame(frame.current);
    previewing.current = false;
  }, []);
  const startFullPlayback = useCallback(() => {
    const player = video.current;
    if (!player) return;
    cancel();
    manual.current = true;
    player.currentTime = 0;
    player.muted = false;
    player.loop = false;
    void player.play().catch(() => {});
  }, [cancel]);

  useEffect(() => {
    const player = video.current;
    if (!player) return;
    manual.current = false;
    let request = 0;
    const container =
      player.closest<HTMLElement>(
        "[data-ad-preview], .ad-card, .post-row, .profile-media, .preview-column, .upload-zone, .form-content",
      ) || player;
    const reset = () => {
      if (previewing.current && player.currentTime >= PREVIEW_SECONDS) {
        player.currentTime = 0;
      }
    };
    const tick = () => {
      if (!previewing.current) return;
      reset();
      frame.current = requestAnimationFrame(tick);
    };
    const start = () => {
      if (
        manual.current ||
        previewing.current ||
        matchMedia("(prefers-reduced-motion: reduce)").matches
      )
        return;
      previewing.current = true;
      player.currentTime = 0;
      player.muted = true;
      player.loop = false;
      const attempt = ++request;
      void player.play().catch(() => {
        // An interrupted load must not latch the player in preview mode.
        // Ignore failures from a request that has since been replaced.
        if (attempt === request && !manual.current) cancel();
      });
      frame.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      request++;
      if (manual.current) {
        if (player.paused) manual.current = false;
        return;
      }
      if (!previewing.current) return;
      cancel();
      player.pause();
      player.currentTime = 0;
    };
    const enter = (event: PointerEvent) => {
      if (event.pointerType === "mouse") start();
    };
    const focusOut = (event: FocusEvent) => {
      if (!container.contains(event.relatedTarget as Node | null)) stop();
    };
    const explicitPlayback = () => {
      cancel();
      manual.current = true;
      player.muted = false;
    };
    const keyPlayback = (event: KeyboardEvent) => {
      if ([" ", "Enter"].includes(event.key)) explicitPlayback();
    };
    const ended = () => {
      if (previewing.current) {
        player.currentTime = 0;
        void player.play().catch(() => {});
      } else manual.current = false;
    };
    container.addEventListener("pointerenter", enter);
    container.addEventListener("pointermove", enter);
    container.addEventListener("pointerleave", stop);
    // Embedded browsers can forward traditional mouse events without pointer
    // events. Both paths use the same guarded start/stop lifecycle.
    container.addEventListener("mouseenter", start);
    container.addEventListener("mousemove", start);
    container.addEventListener("mouseleave", stop);
    container.addEventListener("focusin", start);
    container.addEventListener("focusout", focusOut);
    player.addEventListener("pointerdown", explicitPlayback);
    player.addEventListener("keydown", keyPlayback);
    player.addEventListener("timeupdate", reset);
    player.addEventListener("ended", ended);
    if (
      container.matches(":hover") ||
      container.contains(document.activeElement)
    )
      start();
    return () => {
      request++;
      if (previewing.current) player.pause();
      cancel();
      container.removeEventListener("pointerenter", enter);
      container.removeEventListener("pointermove", enter);
      container.removeEventListener("pointerleave", stop);
      container.removeEventListener("mouseenter", start);
      container.removeEventListener("mousemove", start);
      container.removeEventListener("mouseleave", stop);
      container.removeEventListener("focusin", start);
      container.removeEventListener("focusout", focusOut);
      player.removeEventListener("pointerdown", explicitPlayback);
      player.removeEventListener("keydown", keyPlayback);
      player.removeEventListener("timeupdate", reset);
      player.removeEventListener("ended", ended);
    };
  }, [source, cancel]);
  return { video, startFullPlayback };
}
