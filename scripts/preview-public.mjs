import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { resolve, extname, sep } from "node:path";

const root = resolve("public-site");
const mime = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
};
createServer((req, res) => {
  const path = decodeURIComponent(
    new URL(req.url, "http://localhost").pathname,
  );
  const target = resolve(
    root,
    path.replace(/^\/slander\//, "") || "index.html",
  );
  if (!path.startsWith("/slander/") || !target.startsWith(root + sep)) {
    res.writeHead(404).end();
    return;
  }
  try {
    res.setHeader(
      "Content-Type",
      mime[extname(target)] || "application/octet-stream",
    );
    res.end(readFileSync(target));
  } catch {
    res.writeHead(404).end();
  }
}).listen(3200, "127.0.0.1", () =>
  console.log("Public preview: http://127.0.0.1:3200/slander/"),
);
