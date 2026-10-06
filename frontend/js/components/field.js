/*
  Field: a label plus its input, wired together so clicking the label focuses the input.
  Portal.components.field({ id, label, type, options, hint, placeholder, attrs })
    type    - "text" (default), "date", "search", "select" or "textarea"
    options - for "select": array of strings or { value, label }
    attrs   - extra attributes for the input (min, maxlength, ...)
  Returns { wrap, input } so the caller can read input.value.
*/
window.Portal = window.Portal || {};
Portal.components = Portal.components || {};

Portal.components.field = function (config) {
  const h = Portal.h;
  const hintId = config.hint ? config.id + "-hint" : null;
  const base = Object.assign({ id: config.id, "aria-describedby": hintId }, config.attrs || {});
  let input;

  if (config.type === "select") {
    input = h("select", base, (config.options || []).map(function (option) {
      const value = typeof option === "string" ? option : option.value;
      const label = typeof option === "string" ? option : option.label;
      return h("option", { value: value, text: label });
    }));
  } else if (config.type === "textarea") {
    input = h("textarea", Object.assign({ placeholder: config.placeholder }, base));
  } else {
    input = h("input", Object.assign({ type: config.type || "text", placeholder: config.placeholder }, base));
  }

  const wrap = h("div", { class: "field" }, [
    h("label", { for: config.id, text: config.label }),
    input,
    config.hint ? h("span", { class: "field-hint", id: hintId, text: config.hint }) : null,
  ]);

  return { wrap: wrap, input: input };
};
