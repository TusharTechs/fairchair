/* FairChair embed. Usage:
 *   <div data-fairchair="your-studio-slug"></div>
 *   <script src="https://fairchair.vercel.app/embed.js" async></script>
 */
(function () {
  var origin = new URL(document.currentScript.src).origin;
  var frames = [];
  document.querySelectorAll("[data-fairchair]").forEach(function (el) {
    var iframe = document.createElement("iframe");
    iframe.src = origin + "/embed/" + encodeURIComponent(el.getAttribute("data-fairchair"));
    iframe.title = "Get an honest quote";
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
