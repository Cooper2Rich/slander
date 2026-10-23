import { chromium } from "@playwright/test";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { createHash } from "node:crypto";
import { coffeeAds } from "../src/public-demo/coffee-ads.js";
import { footageSources } from "./coffee-footage.mjs";

// MediaRecorder omits duration. Add the standard EBML Duration field so normal
// players have a finite timeline and can seek without first scanning the file.
function withDuration(bytes, milliseconds) {
  const info = bytes.indexOf(Buffer.from([0x15, 0x49, 0xa9, 0x66]));
  if (info < 0) throw new Error("WebM information header missing.");
  const sizeAt = info + 4;
  let width = 1;
  while (width <= 8 && !(bytes[sizeAt] & (1 << (8 - width)))) width++;
  if (width > 8) throw new Error("Invalid WebM info size.");
  let size = bytes[sizeAt] & ((1 << (8 - width)) - 1);
  for (let i = 1; i < width; i++) size = size * 256 + bytes[sizeAt + i];
  const duration = Buffer.alloc(11);
  duration.set([0x44, 0x89, 0x88]);
  duration.writeDoubleBE(milliseconds, 3);
  const newSize = size + duration.length;
  if (newSize >= 2 ** (7 * width) - 1)
    throw new Error("WebM info size exceeds original field.");
  const encodedSize = Buffer.alloc(width);
  let remaining = newSize;
  for (let i = width - 1; i >= 0; i--) {
    encodedSize[i] = remaining % 256;
    remaining = Math.floor(remaining / 256);
  }
  encodedSize[0] |= 1 << (8 - width);
  const dataAt = sizeAt + width;
  return Buffer.concat([
    bytes.subarray(0, sizeAt),
    encodedSize,
    bytes.subarray(dataAt, dataAt + size),
    duration,
    bytes.subarray(dataAt + size),
  ]);
}

await mkdir("outputs/coffee-footage", { recursive: true });
const sources = new Map();
for (const ad of coffeeAds) {
  const source = footageSources[ad.id],
    path = `outputs/coffee-footage/${source.file}`;
  let bytes;
  try {
    bytes = await readFile(path);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    const response = await fetch(source.url);
    if (!response.ok)
      throw new Error(`Source download failed: ${response.status}`);
    bytes = Buffer.from(await response.arrayBuffer());
    await writeFile(path, bytes);
  }
  if (createHash("sha256").update(bytes).digest("hex") !== source.sha256)
    throw new Error(`Source digest changed: ${source.file}`);
  sources.set(`/source/${ad.id}.mp4`, bytes);
}
const server = createServer((request, response) => {
  const bytes = sources.get(request.url);
  if (!bytes) {
    response.setHeader("Content-Type", "text/html");
    response.end("<!doctype html><title>Coffee ad renderer</title>");
    return;
  }
  response.setHeader("Content-Type", "video/mp4");
  response.setHeader("Accept-Ranges", "bytes");
  const range = /^bytes=(\d+)-(\d*)$/.exec(request.headers.range || "");
  if (range) {
    const start = Number(range[1]),
      end = Math.min(
        range[2] ? Number(range[2]) : bytes.length - 1,
        bytes.length - 1,
      );
    if (start > end) {
      response.writeHead(416).end();
      return;
    }
    response.writeHead(206, {
      "Content-Range": `bytes ${start}-${end}/${bytes.length}`,
      "Content-Length": end - start + 1,
    });
    response.end(bytes.subarray(start, end + 1));
  } else {
    response.setHeader("Content-Length", bytes.length);
    response.end(bytes);
  }
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({
  headless: true,
  args: ["--autoplay-policy=no-user-gesture-required"],
});
try {
  const page = await browser.newPage();
  page.on("pageerror", (error) =>
    console.error("Video renderer:", error.message),
  );
  page.on("console", (message) => console.log(message.text()));
  await page.goto(origin);
  await mkdir("public/videos", { recursive: true });
  for (let index = 0; index < coffeeAds.length; index++) {
    const ad = coffeeAds[index];
    console.log(`Rendering ${ad.id}…`);
    const result = await page.evaluate(
      async ({ sourceUrl, sourceStart, ad, index }) => {
        const film = document.createElement("video");
        film.muted = true;
        film.preload = "auto";
        film.playsInline = true;
        const loaded = new Promise((resolve, reject) => {
          film.onloadeddata = resolve;
          film.onerror = () =>
            reject(new Error("Filmed source failed to decode."));
        });
        film.src = sourceUrl;
        await loaded;
        if (film.duration - sourceStart < 16.4)
          throw new Error(
            "The source must contain 16.4 seconds of continuous footage.",
          );
        if (sourceStart) {
          const seek = new Promise((resolve) => {
            film.onseeked = resolve;
          });
          film.currentTime = sourceStart;
          await seek;
        }
        const canvas = document.createElement("canvas");
        canvas.width = 1280;
        canvas.height = 720;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(film, 0, 0, 1280, 720);
        const poster = canvas.toDataURL("image/jpeg", 0.9);
        const audio = new AudioContext();
        await audio.resume();
        const destination = audio.createMediaStreamDestination();
        const master = audio.createGain();
        master.gain.value = 0.48;
        master.connect(destination);
        // Original quiet minor-key pad: generated tones, with no licensed audio.
        for (const frequency of [130.81, 155.56, 196]) {
          const oscillator = audio.createOscillator(),
            gain = audio.createGain();
          oscillator.type = "sine";
          oscillator.frequency.value = frequency * (index === 1 ? 1.12246 : 1);
          gain.gain.setValueAtTime(0, audio.currentTime);
          gain.gain.linearRampToValueAtTime(0.033, audio.currentTime + 2);
          gain.gain.setValueAtTime(0.033, audio.currentTime + 13);
          gain.gain.linearRampToValueAtTime(0, audio.currentTime + 16.3);
          oscillator.connect(gain);
          gain.connect(master);
          oscillator.start();
          oscillator.stop(audio.currentTime + 16.5);
        }
        const stream = canvas.captureStream(24);
        const combined = new MediaStream([
          ...stream.getVideoTracks(),
          ...destination.stream.getAudioTracks(),
        ]);
        const recorder = new MediaRecorder(combined, {
          mimeType: "video/webm;codecs=vp9,opus",
          videoBitsPerSecond: 2500000,
          audioBitsPerSecond: 96000,
        });
        const chunks = [];
        recorder.ondataavailable = (e) => chunks.push(e.data);
        const complete = new Promise((resolve) => {
          recorder.onstop = async () =>
            resolve(
              Array.from(new Uint8Array(await new Blob(chunks).arrayBuffer())),
            );
        });
        function draw(seconds) {
          const scene = Math.min(3, Math.floor(seconds / 4.1)),
            progress = (seconds % 4.1) / 4.1;
          // The camera image comes only from the playing source video. No still
          // photos, camera pans, image zooms, looping or time stretching.
          ctx.drawImage(film, 0, 0, 1280, 720);
          const gradient = ctx.createLinearGradient(0, 250, 0, 720);
          gradient.addColorStop(0, "#16082405");
          gradient.addColorStop(0.45, "#16082455");
          gradient.addColorStop(1, "#160824f5");
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, 1280, 720);
          ctx.fillStyle = "#28123bd9";
          ctx.fillRect(32, 28, 370, 62);
          ctx.fillStyle = "#f5ebff";
          ctx.font = "26px sans-serif";
          ctx.textAlign = "left";
          ctx.fillText("N / C    NOCTURNE COFFEE", 48, 68);
          const fade = Math.min(1, progress / 0.16);
          ctx.globalAlpha = fade;
          ctx.textAlign = "left";
          ctx.fillStyle = "#e3c7ff";
          ctx.font = "24px sans-serif";
          ctx.fillText(ad.supporting[scene], 48, 386 + (1 - fade) * 12);
          ctx.fillStyle = "#fff9ff";
          ctx.font = "64px Georgia";
          let y = 454 + (1 - fade) * 18;
          for (const hardLine of ad.scenes[scene].split("\n")) {
            let line = "";
            for (const word of hardLine.split(" ")) {
              const next = `${line}${word} `;
              if (ctx.measureText(next).width > 900) {
                ctx.fillText(line.trim(), 48, y);
                y += 62;
                line = `${word} `;
              } else line = next;
            }
            ctx.fillText(line.trim(), 48, y);
            y += 62;
          }
          if (scene === 3) {
            ctx.fillStyle = "#d8b4fe";
            ctx.fillRect(48, 548, 620, 52);
            ctx.fillStyle = "#18121f";
            ctx.textAlign = "center";
            ctx.font = "26px sans-serif";
            ctx.fillText("DISCOVER NOCTURNE COFFEE  ↗", 358, 582);
          }
          ctx.globalAlpha = 1;
          ctx.fillStyle = "#f4eaff";
          ctx.font = "14px sans-serif";
          ctx.textAlign = "left";
          ctx.fillText(
            scene === 3
              ? "A neighborhood coffee shop. A different kind of evening."
              : "A darker kind of coffee. A warmer kind of welcome.",
            48,
            695,
          );
          ctx.fillStyle = "#cda0ff";
          ctx.fillRect(48, 708, 1184 * Math.min(1, seconds / 16.4), 2);
        }
        draw(0);
        recorder.start();
        await film.play();
        const start = performance.now();
        await new Promise((resolve, reject) => {
          function frame(now) {
            try {
              const seconds = Math.max(0, Math.min(16.4, (now - start) / 1000));
              draw(seconds);
              if (seconds < 16.4) requestAnimationFrame(frame);
              else resolve();
            } catch (error) {
              reject(error);
            }
          }
          requestAnimationFrame(frame);
        });
        console.log("Frames complete");
        const decodedFrames = film.getVideoPlaybackQuality().totalVideoFrames;
        const sourcePlayed = film.currentTime - sourceStart;
        film.pause();
        recorder.stop();
        const bytes = await complete;
        combined.getTracks().forEach((track) => track.stop());
        await audio.close();
        console.log("Encoding complete");
        if (decodedFrames < 300 || sourcePlayed < 16)
          throw new Error(
            `Insufficient real video motion: ${decodedFrames} frames / ${sourcePlayed}s`,
          );
        return { bytes, poster, decodedFrames, sourcePlayed };
      },
      {
        sourceUrl: `${origin}/source/${ad.id}.mp4`,
        sourceStart: footageSources[ad.id].startSeconds,
        ad,
        index,
      },
    );
    await writeFile(
      `public${ad.media}`,
      withDuration(Buffer.from(result.bytes), 16400),
    );
    await writeFile(
      `public${ad.poster}`,
      Buffer.from(result.poster.split(",")[1], "base64"),
    );
    console.log(
      `Created ${ad.media} · 16.4 seconds · ${result.decodedFrames} decoded source frames · ambient audio`,
    );
  }
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
