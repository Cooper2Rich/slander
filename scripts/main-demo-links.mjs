const start = "\n<!-- BRM PUBLIC DEMO LINKS START -->\n";
const end = "\n<!-- BRM PUBLIC DEMO LINKS END -->\n";
const banner =
  "\n<!-- BRM PUBLIC DEMO LINKS START -->\n<style>\n#brm-public-demo-links { position: sticky; top: 0; z-index: 70; }\n.brm-demo-index.public-demo .public-notice { top: var(--brm-demo-links-height, 54px); }\n.brm-demo-index.public-demo .sidebar,\n.brm-demo-index.public-demo .topbar { top: calc(var(--public-notice-height) + var(--brm-demo-links-height, 54px)); }\n.brm-demo-index.public-demo .app-shell { min-height: calc(100vh - var(--public-notice-height) - var(--brm-demo-links-height, 54px)); }\n</style>\n<nav id=\"brm-public-demo-links\" aria-label=\"Public demos\" style=\"display:flex;align-items:center;flex-wrap:wrap;gap:8px;padding:10px 3%;border-bottom:1px solid #203b5c;background:#07121b;color:#abc4d4;font:12px/1.5 system-ui,sans-serif\">\n  <strong style=\"margin-right:6px;font-size:11px\">Public demos</strong>\n  <a href=\"/slander/demo-shared-with-john/\" style=\"display:inline-flex;align-items:center;min-height:34px;padding:6px 12px;border:1px solid #315268;border-radius:7px;background:#102237;color:#fff;text-decoration:none\">John — Frozen demo</a>\n  <a href=\"/slander/working/\" style=\"display:inline-flex;align-items:center;min-height:34px;padding:6px 12px;border:1px solid #315268;border-radius:7px;background:#102237;color:#fff;text-decoration:none\">Working — Editable demo</a>\n</nav>\n<script>\n(() => {\n  const bar = document.getElementById(\"brm-public-demo-links\");\n  const update = () => document.documentElement.style.setProperty(\"--brm-demo-links-height\", bar.getBoundingClientRect().height + \"px\");\n  document.body.classList.add(\"brm-demo-index\");\n  update();\n  if (\"ResizeObserver\" in window) new ResizeObserver(update).observe(bar);\n  else window.addEventListener(\"resize\", update);\n})();\n</script>\n<!-- BRM PUBLIC DEMO LINKS END -->\n";

export function withoutMainDemoLinks(html) {
  const first = html.indexOf(start);
  const last = html.indexOf(end);
  if (first < 0 && last < 0) return html;
  if (
    first < 0 ||
    last < first ||
    html.indexOf(start, first + start.length) >= 0 ||
    html.indexOf(end, last + end.length) >= 0
  )
    throw new Error("Malformed or repeated main demo-link markers");
  return html.slice(0, first) + html.slice(last + end.length);
}

export function withMainDemoLinks(html) {
  const original = withoutMainDemoLinks(html);
  if (!/<body\b[^>]*>/i.test(original))
    throw new Error("Main entry point has no body");
  return original.replace(/<body\b[^>]*>/i, (tag) => tag + banner);
}
