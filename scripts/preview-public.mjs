import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { resolve, extname, sep } from "node:path";

const root = resolve("public-site");
const base = process.env.PUBLIC_DEMO_BASE_PATH || "/slander/";
if (!["/slander/", "/slander/working/"].includes(base))
  throw new Error("Unsupported preview base");
const port = Number(process.env.PUBLIC_DEMO_PORT || 3200);
const mime = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webm": "video/webm",
  ".mp4": "video/mp4",
};
createServer((req, res) => {
  const path = decodeURIComponent(
    new URL(req.url, "http://localhost").pathname,
  );
  const target = resolve(root, path.slice(base.length) || "index.html");
  if (!path.startsWith(base) || !target.startsWith(root + sep)) {
    res.writeHead(404).end();
    return;
  }
  try {
    res.setHeader(
      "Content-Type",
      mime[extname(target)] || "application/octet-stream",
    );
    const bytes = readFileSync(target);
    res.setHeader("Accept-Ranges", "bytes");
    const range = /^bytes=(\d+)-(\d*)$/.exec(req.headers.range || "");
    if (range) {
      const start = Number(range[1]);
      const end = Math.min(
        range[2] ? Number(range[2]) : bytes.length - 1,
        bytes.length - 1,
      );
      if (start > end || start >= bytes.length) {
        res
          .writeHead(416, { "Content-Range": `bytes */${bytes.length}` })
          .end();
        return;
      }
      res.writeHead(206, {
        "Content-Range": `bytes ${start}-${end}/${bytes.length}`,
        "Content-Length": end - start + 1,
      });
      res.end(bytes.subarray(start, end + 1));
    } else {
      res.setHeader("Content-Length", bytes.length);
      res.end(bytes);
    }
  } catch {
    res.writeHead(404).end();
  }
}).listen(port, "127.0.0.1", () =>
  console.log(`Public preview: http://127.0.0.1:${port}${base}`),
);
