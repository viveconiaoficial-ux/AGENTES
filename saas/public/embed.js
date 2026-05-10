(function () {
  var scripts = document.getElementsByTagName("script");
  var current = scripts[scripts.length - 1];
  if (!current) return;

  var negocioId = current.getAttribute("data-negocio");
  if (!negocioId) return;

  var endpoint = current.getAttribute("data-endpoint") || "";
  var defaultOpenAttr = current.getAttribute("data-default-open");
  var startExpanded =
    defaultOpenAttr !== "0" && defaultOpenAttr !== "false" && defaultOpenAttr !== "no";

  var origin = new URL(current.src, window.location.href).origin;
  var demoUrl = origin + "/demo/" + encodeURIComponent(negocioId) + "?embed=1";
  if (endpoint) {
    demoUrl += "&endpoint=" + encodeURIComponent(endpoint);
  }

  var iframe = document.createElement("iframe");
  iframe.src = demoUrl;
  iframe.title = "Chat widget";
  iframe.style.position = "fixed";
  iframe.style.right = "16px";
  iframe.style.bottom = "16px";
  if (startExpanded) {
    iframe.style.width = "min(92vw, 420px)";
    iframe.style.height = "min(78vh, 660px)";
  } else {
    iframe.style.width = "88px";
    iframe.style.height = "88px";
  }
  iframe.style.border = "0";
  iframe.style.zIndex = "2147483000";
  iframe.style.pointerEvents = "auto";
  iframe.style.background = "transparent";
  iframe.style.overflow = "hidden";
  iframe.allow = "clipboard-read; clipboard-write";

  window.addEventListener("message", function (event) {
    if (event.origin !== origin) return;
    if (!event.data || typeof event.data !== "object") return;
    if (event.data.type !== "vive-widget-toggle") return;
    if (event.data.open) {
      iframe.style.width = "min(92vw, 420px)";
      iframe.style.height = "min(78vh, 660px)";
    } else {
      iframe.style.width = "88px";
      iframe.style.height = "88px";
    }
  });

  document.body.appendChild(iframe);
})();
