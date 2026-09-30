/* FairChair embed. Usage:
 *   Stylist quote flow:   <div data-fairchair="your-studio-slug"></div>
 *   Store match widget:   <div data-fairchair-shop="your-store-slug"></div>
 *   <script src="https://fairchair.vercel.app/embed.js" async></script>
 */
(function () {
  // currentScript is null when a framework injects the script; fall back to
  // finding our own <script> tag.
  var self = document.currentScript || document.querySelector('script[src$="/embed.js"]');
  var origin = self ? new URL(self.src, location.href).origin : location.origin;
  var frames = [];
  document.querySelectorAll("[data-fairchair],[data-fairchair-shop]").forEach(function (el) {
    var iframe = document.createElement("iframe");
    var shop = el.getAttribute("data-fairchair-shop");
    iframe.src = shop
      ? origin + "/embed/m/" + encodeURIComponent(shop)
      : origin + "/embed/" + encodeURIComponent(el.getAttribute("data-fairchair"));
    iframe.title = shop ? "Find your extension match" : "Get an honest quote";
    iframe.allow = "camera";
    iframe.loading = "lazy";
    iframe.style.cssText = "width:100%;border:0;border-radius:16px;background:transparent";
    el.appendChild(iframe);
    frames.push(iframe);
  });
  window.addEventListener("message", function (e) {
    if (e.origin !== origin || !e.data || e.data.type !== "fairchair:height") return;
    frames.forEach(function (f) {
      if (f.contentWindow === e.source) f.style.height = e.data.height + "px";
    });
  });
})();
