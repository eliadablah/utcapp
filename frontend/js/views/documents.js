/*
  Documents view: a checklist of required documents, an upload form with
  drag and drop, and the list of what has been sent.
  Files are checked for type and size before they are accepted.
*/
window.Portal = window.Portal || {};
Portal.views = Portal.views || {};

Portal.views.documents = {
  render: function () {
    const h = Portal.h;
    const ui = Portal.components;
    const text = Portal.content.documents;
    const status = Portal.content.status;
    const state = Portal.store.get();

    // --- State ---
    let selectedFile = null;
    const hasType = function (typeId) {
      return state.documents.some(function (doc) { return doc.typeId === typeId; });
    };
    // Start the dropdown on the first required document that is still missing
    const firstMissing = text.types.find(function (type) { return type.required && !hasType(type.id); });

    // --- Required checklist ---
    const checklist = h("ul", { class: "list" }, text.types
      .filter(function (type) { return type.required; })
      .map(function (type) {
        const received = hasType(type.id);
        return h("li", {}, [
          h("div", { class: "item-main" }, [h("div", { class: "item-title", text: type.label })]),
          ui.badge(received ? status.received : status.missing, received ? "ok" : "warn"),
        ]);
      }));

    // --- Upload form ---
    const typeField = ui.field({
      id: "doc-type",
      label: text.typeLabel,
      type: "select",
      options: text.types.map(function (type) { return { value: type.id, label: type.label }; }),
    });
    if (firstMissing) typeField.input.value = firstMissing.id;

    const fileInput = h("input", { type: "file", id: "doc-file", class: "sr-only", accept: text.accept });
    const selectedLine = h("span", { class: "field-hint", text: text.dropHint });
    const error = h("p", { class: "form-error", role: "alert" });

    function choose(file) {
      selectedFile = file || null;
      error.textContent = "";
      selectedLine.textContent = selectedFile
        ? text.selected + selectedFile.name + " (" + Portal.formatBytes(selectedFile.size) + ")"
        : text.dropHint;
    }

    fileInput.addEventListener("change", function () { choose(fileInput.files[0]); });

    const dropzone = h("label", { class: "dropzone", for: "doc-file" }, [
      Portal.icon("upload", 28),
      h("strong", { text: text.dropStrong }),
      selectedLine,
      fileInput,
    ]);
    dropzone.addEventListener("dragover", function (event) {
      event.preventDefault();
      dropzone.classList.add("is-over");
    });
    dropzone.addEventListener("dragleave", function () { dropzone.classList.remove("is-over"); });
    dropzone.addEventListener("drop", function (event) {
      event.preventDefault();
      dropzone.classList.remove("is-over");
      choose(event.dataTransfer.files[0]);
    });

    function submit(event) {
      event.preventDefault();

      if (!selectedFile) { error.textContent = text.errors.noFile; return; }
      if (text.acceptedMime.indexOf(selectedFile.type) === -1) { error.textContent = text.errors.badType; return; }
      if (selectedFile.size > text.maxBytes) { error.textContent = text.errors.tooBig; return; }

      // Uploading takes a moment, so stop a second click from sending it twice
      submitButton.disabled = true;
      Portal.store.addDocument({ typeId: typeField.input.value, file: selectedFile })
        .then(function () { ui.toast(text.added); })
        .catch(function (failure) {
          submitButton.disabled = false;
          error.textContent = failure.message;
        });
    }

    // Saves the stored file to the visitor's device
    function download(doc) {
      Portal.store.downloadDocument(doc.id)
        .then(function (blob) {
          const link = h("a", { href: URL.createObjectURL(blob), download: doc.fileName });
          link.click();
          URL.revokeObjectURL(link.href);
        })
        .catch(function (failure) { ui.toast(failure.message); });
    }

    const submitButton = h("button", { class: "btn", type: "submit", text: text.submit });
    const form = h("form", { class: "form", onsubmit: submit, novalidate: true }, [
      typeField.wrap,
      h("div", { class: "field" }, [dropzone]),
      error,
      h("p", { class: "field-hint", text: Portal.store.mode === "server" ? text.serverNote : text.demoNote }),
      h("div", {}, [submitButton]),
    ]);

    // --- Uploaded list ---
    const uploads = state.documents.length === 0
      ? ui.emptyState(text.empty)
      : h("ul", { class: "list" }, state.documents.map(function (doc) {
        return h("li", {}, [
          h("div", { class: "item-main" }, [
            h("div", { class: "item-title", text: doc.typeLabel }),
            h("div", { class: "item-meta", text: doc.fileName + " · " + Portal.formatBytes(doc.size) + " · " + Portal.formatDate(doc.createdAt) }),
          ]),
          h("div", { class: "item-side" }, [
            ui.badge(status.received, "ok"),
            Portal.store.canDownload()
              ? h("button", {
                class: "btn btn-ghost btn-small",
                type: "button",
                text: text.download,
                "aria-label": text.download + ": " + doc.fileName,
                onclick: function () { download(doc); },
              })
              : null,
            h("button", {
              class: "btn btn-ghost btn-small",
              type: "button",
              text: text.remove,
              "aria-label": text.remove + ": " + doc.fileName,
              onclick: function () {
                Portal.store.removeDocument(doc.id)
                  .then(function () { ui.toast(text.removed); })
                  .catch(function (failure) { ui.toast(failure.message); });
              },
            }),
          ]),
        ]);
      }));

    // --- Render ---
    return h("div", { class: "main-inner" }, [
      ui.pageHeader(text.title, text.subtitle),
      h("div", { class: "grid-2" }, [
        ui.card(text.uploadTitle, [form]),
        ui.card(text.requiredTitle, [checklist]),
      ]),
      ui.card(text.listTitle, [uploads]),
    ]);
  },
};
