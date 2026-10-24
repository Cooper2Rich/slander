export class DemoUpdateRequiredError extends Error {
  constructor(cause: unknown) {
    super(
      "The demo could not load a required file. Reload to get the latest version.",
      { cause },
    );
    this.name = "DemoUpdateRequiredError";
  }
}

export function latestDemoUrl(href: string, version = Date.now()) {
  const url = new URL(href);
  url.searchParams.set("v", String(version));
  return url.toString();
}

export function reloadPublicDemo() {
  // A new document clears the browser's cached rejected module import. Only
  // the cache-busting query changes; saved data and the workspace route remain.
  window.location.replace(latestDemoUrl(window.location.href));
}
