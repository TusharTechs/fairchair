"use client";

import { useEffect } from "react";

// Tells the host page how tall the embedded quote flow is, so the iframe can
// grow and shrink with it (see public/embed.js). Measures <main> (the document
// is at least as tall as the iframe) and re-checks cheaply, because React can
// replace nodes that a ResizeObserver was watching.
export function EmbedResizer() {
  useEffect(() => {
    if (window.parent === window) return;
    let last = 0;
    const post = () => {
      const main = document.querySelector("main");
      if (!main) return;
      const height = Math.ceil(main.getBoundingClientRect().height) + 8;
      if (height === last) return;
      last = height;
      window.parent.postMessage({ type: "fairchair:height", height }, "*");
    };
    post();
    const timer = window.setInterval(post, 300);
    return () => window.clearInterval(timer);
  }, []);
  return null;
}
