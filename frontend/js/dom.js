/*
  Small helpers for building the page and formatting values.
  Everything is created with DOM methods and textContent (never innerHTML),
  so text a user types can never be run as code.
*/
window.Portal = window.Portal || {};

// Builds one element. attrs: class, text, on<event> handlers, or any attribute.
Portal.h = function (tag, attrs, children) {
  const node = document.createElement(tag);

  Object.keys(attrs || {}).forEach(function (key) {
    const value = attrs[key];
    if (value === null || value === undefined || value === false) return;

    if (key === "class") node.className = value;
    else if (key === "text") node.textContent = value;
    else if (key.indexOf("on") === 0 && typeof value === "function") node.addEventListener(key.slice(2), value);
    else if (value === true) node.setAttribute(key, "");
    else node.setAttribute(key, value);
  });

  (children || []).forEach(function (child) {
    if (child === null || child === undefined || child === false) return;
    node.appendChild(typeof child === "string" ? document.createTextNode(child) : child);
  });

  return node;
};

// "Oct 6, 2026"
Portal.formatDate = function (iso) {
  const date = new Date(iso);
  if (isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
};

// 1536 -> "1.5 KB"
Portal.formatBytes = function (bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
};

// Short unique id for things the user creates
Portal.uid = function () {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
};

// Today's date as YYYY-MM-DD in the visitor's own time zone
Portal.today = function () {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return now.getFullYear() + "-" + month + "-" + day;
};
