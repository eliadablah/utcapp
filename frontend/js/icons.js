/*
  Line icons drawn as inline SVG, so there are no image files to load.
  Portal.icon("home") returns a ready-to-insert <svg>.
*/
window.Portal = window.Portal || {};

(function () {
  const SVG_NS = "http://www.w3.org/2000/svg";

  const paths = {
    home: "M3 11l9-8 9 8M5 10v10h14V10",
    check: "M12 21a9 9 0 100-18 9 9 0 000 18zM8.5 12l2.5 2.5 4.5-5",
    file: "M14 3H6v18h12V7l-4-4zM14 3v4h4M9 13h6M9 17h6",
    flask: "M9 3h6M10 3v6L5 19a1 1 0 001 2h12a1 1 0 001-2l-5-10V3",
    help: "M12 21a9 9 0 100-18 9 9 0 000 18zM9.5 9.5a2.5 2.5 0 115 0c0 1.5-2.5 2-2.5 4M12 17h.01",
    book: "M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2V5zM4 19a2 2 0 012-2h13",
    upload: "M12 16V4M7 9l5-5 5 5M4 20h16",
  };

  Portal.icon = function (name, size) {
    const svg = document.createElementNS(SVG_NS, "svg");
    const path = document.createElementNS(SVG_NS, "path");
    const px = String(size || 20);

    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("width", px);
    svg.setAttribute("height", px);
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "2");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");
    // Icons are decoration; the text next to them carries the meaning
    svg.setAttribute("aria-hidden", "true");

    path.setAttribute("d", paths[name] || "");
    svg.appendChild(path);
    return svg;
  };
})();
