import { chromium } from "@playwright/test";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { coffeeAds } from "../src/public-demo/coffee-ads.js";

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
  const images = await Promise.all(
    coffeeAds.map(
      async (ad) =>
        `data:image/png;base64,${(await readFile(`public/images/${ad.image}.png`)).toString("base64")}`,
    ),
  );
  await mkdir("public/videos", { recursive: true });
  for (let index = 0; index < coffeeAds.length; index++) {
    const ad = coffeeAds[index];
    console.log(`Rendering ${ad.id}…`);
    const result = await page.evaluate(
      async ({ images, ad, index }) => {
        const photos = await Promise.all(
          images.map(async (source) => {
            const image = new Image();
            image.src = source;
            await image.decode();
            return image;
          }),
        );
        console.log("Images decoded");
        const canvas = document.createElement("canvas");
        canvas.width = 720;
        canvas.height = 1080;
        const ctx = canvas.getContext("2d");
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
          videoBitsPerSecond: 1600000,
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
        function picture(photo, zoom, pan, alpha = 1) {
          ctx.save();
          ctx.globalAlpha = alpha;
          const scale = Math.max(720 / photo.width, 1080 / photo.height) * zoom;
          const w = photo.width * scale,
            h = photo.height * scale;
          ctx.drawImage(photo, (720 - w) / 2 + pan, (1080 - h) / 2, w, h);
          ctx.restore();
        }
        function draw(seconds) {
          const scene = Math.min(3, Math.floor(seconds / 4.1)),
            progress = (seconds % 4.1) / 4.1;
          const photoIndex = (index + scene) % 3;
          ctx.fillStyle = "#100d18";
          ctx.fillRect(0, 0, 720, 1080);
          picture(
            photos[photoIndex],
            1.08 + progress * 0.06,
            (progress - 0.5) * 12,
            scene === 3 ? 0.38 : 1,
          );
          if (scene > 0 && progress < 0.13)
            picture(photos[(photoIndex + 2) % 3], 1.14, 0, 1 - progress / 0.13);
          const gradient = ctx.createLinearGradient(0, 0, 0, 1080);
          gradient.addColorStop(0, "#100d18da");
          gradient.addColorStop(0.5, "#100d1805");
          gradient.addColorStop(1, "#100d18e8");
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, 720, 1080);
          ctx.strokeStyle = "#d8b68c70";
          ctx.strokeRect(30, 30, 660, 1020);
          ctx.fillStyle = "#dfc29d";
          ctx.font = "18px sans-serif";
          ctx.textAlign = "left";
          ctx.fillText("N / C", 60, 81);
          ctx.textAlign = "right";
          ctx.font = "12px sans-serif";
          ctx.fillText("NOCTURNE COFFEE", 660, 80);
          const fade = Math.min(1, progress / 0.16);
          ctx.globalAlpha = fade;
          ctx.textAlign = "left";
          ctx.fillStyle = "#dfc29d";
          ctx.font = "13px sans-serif";
          ctx.fillText(ad.supporting[scene], 60, 185 + (1 - fade) * 12);
          ctx.fillStyle = "#faf2e7";
          ctx.font = scene === 3 ? "48px Georgia" : "62px Georgia";
          let y = 259 + (1 - fade) * 18;
          for (const hardLine of ad.scenes[scene].split("\n")) {
            let line = "";
            for (const word of hardLine.split(" ")) {
              const next = `${line}${word} `;
              if (ctx.measureText(next).width > 600) {
                ctx.fillText(line.trim(), 60, y);
                y += 70;
                line = `${word} `;
              } else line = next;
            }
            ctx.fillText(line.trim(), 60, y);
            y += 70;
          }
          if (scene === 3) {
            ctx.fillStyle = "#d8b68c";
            ctx.fillRect(60, 900, 600, 65);
            ctx.fillStyle = "#18121f";
            ctx.textAlign = "center";
            ctx.font = "16px sans-serif";
            ctx.fillText("DISCOVER NOCTURNE COFFEE  ↗", 360, 940);
          }
          ctx.globalAlpha = 1;
          ctx.fillStyle = "#f1e5d1";
          ctx.font = "14px sans-serif";
          ctx.textAlign = "left";
          ctx.fillText(
            scene === 3
              ? "A neighborhood coffee shop. A different kind of evening."
              : "A darker kind of coffee. A warmer kind of welcome.",
            60,
            1014,
          );
          ctx.fillStyle = "#d8b68c";
          ctx.fillRect(60, 1030, 600 * Math.min(1, seconds / 16.4), 2);
        }
        draw(0);
        recorder.start();
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
        recorder.stop();
        const bytes = await complete;
        combined.getTracks().forEach((track) => track.stop());
        await audio.close();
        console.log("Encoding complete");
        return bytes;
      },
      { images, ad, index },
    );
    await writeFile(
      `public/videos/${ad.id}.webm`,
      withDuration(Buffer.from(result), 16400),
    );
    console.log(
      `Created ${ad.id}.webm · 16.4 seconds · original ambient audio`,
    );
  }
} finally {
  await browser.close();
}
