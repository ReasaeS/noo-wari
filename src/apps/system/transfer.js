(function () {
  var FORMAT = "noo-wari.transfer";
  var VERSION = 1;
  var PREFIX = "noo-wari.";
  var MODES = ["replace", "merge"];
  var CHUNK = 0x8000;

  function formatBytes(amount) {
    if (amount < 1024) {
      return amount + " B";
    }

    if (amount < 1024 * 1024) {
      return Math.round((amount / 1024) * 10) / 10 + " KB";
    }

    return Math.round((amount / (1024 * 1024)) * 10) / 10 + " MB";
  }

  function stamp() {
    var now = new Date();
    var pad = window.ui.pad;

    return now.getFullYear() + pad(now.getMonth() + 1, 2) + pad(now.getDate(), 2) +
      "-" + pad(now.getHours(), 2) + pad(now.getMinutes(), 2);
  }

  function toBase64(bytes) {
    var view = new Uint8Array(bytes);
    var text = "";

    for (var i = 0; i < view.length; i += CHUNK) {
      text = text + String.fromCharCode.apply(null, view.subarray(i, i + CHUNK));
    }

    return window.btoa(text);
  }

  function fromBase64(text) {
    var binary = window.atob(text);
    var out = new ArrayBuffer(binary.length);
    var view = new Uint8Array(out);

    for (var i = 0; i < binary.length; i++) {
      view[i] = binary.charCodeAt(i);
    }

    return out;
  }

  function ownKeys() {
    var found = [];

    try {
      for (var i = 0; i < window.localStorage.length; i++) {
        var key = window.localStorage.key(i);

        if (key.indexOf(PREFIX) == 0) {
          found.push(key);
        }
      }
    } catch (error) {
      return [];
    }

    return found;
  }

  function keyBytes() {
    var keys = ownKeys();
    var total = 0;

    for (var i = 0; i < keys.length; i++) {
      var value = window.localStorage.getItem(keys[i]);

      if (value == null) {
        value = "";
      }

      total = total + (keys[i].length + value.length) * 2;
    }

    return total;
  }

  function gatherKeys() {
    var keys = ownKeys();
    var out = new Object();

    for (var i = 0; i < keys.length; i++) {
      out[keys[i]] = window.localStorage.getItem(keys[i]);
    }

    return out;
  }

  function gatherVault() {
    if (!window.vault.supported()) {
      return Promise.resolve(new Object());
    }

    return window.vault.keys().then(function (ids) {
      var out = new Object();
      var chain = Promise.resolve(null);

      for (var i = 0; i < ids.length; i++) {
        chain = chain.then((function (id) {
          return function () {
            return window.vault.get(id).then(function (bytes) {
              if (bytes != null) {
                out["" + id] = toBase64(bytes);
              }
            });
          };
        })(ids[i]));
      }

      return chain.then(function () {
        return out;
      });
    }).catch(function () {
      return new Object();
    });
  }

  function makeBundle() {
    return gatherVault().then(function (vault) {
      var bundle = new Object();

      bundle.format = FORMAT;
      bundle.version = VERSION;
      bundle.origin = window.location.origin;
      bundle.saved = new Date().toISOString();
      bundle.keys = gatherKeys();
      bundle.vault = vault;

      return bundle;
    });
  }

  function countOf(host) {
    var total = 0;

    for (var key in host) {
      if (host.hasOwnProperty(key)) {
        total = total + 1;
      }
    }

    return total;
  }

  function readable(bundle) {
    return bundle != null && bundle.format == FORMAT && bundle.keys != null;
  }

  function build(aSheet) {
    var ui = window.ui;

    var toolbar = ui.toolbar();
    var stage = ui.stage();
    var status = ui.value("");
    var timer = 0;

    var incoming = null;
    var mode = MODES[0];
    var isArmed = false;
    var armTimer = 0;

    var picker = document.createElement("input");

    picker.type = "file";
    picker.accept = "application/json,.json";
    picker.style.display = "none";

    function report(text, color) {
      status.textContent = text;
      status.style.color = typeof color == "string" ? color : ui.ACCENT_COLOR;

      if (timer != 0) {
        window.clearTimeout(timer);
      }

      timer = window.setTimeout(function () {
        status.textContent = "";
        timer = 0;
      }, 2600);
    }

    function makeHeading(text) {
      var aHeading = document.createElement("div");

      aHeading.textContent = text;

      aHeading.style.marginTop = "16px";
      aHeading.style.marginBottom = "6px";
      aHeading.style.fontSize = "10px";
      aHeading.style.letterSpacing = "1px";
      aHeading.style.textTransform = "uppercase";
      aHeading.style.color = ui.MUTED_COLOR;

      return aHeading;
    }

    function makeRow(left, right, color) {
      var aRow = document.createElement("div");
      var leftElement = document.createElement("span");
      var rightElement = document.createElement("span");

      leftElement.textContent = left;
      leftElement.style.color = ui.MUTED_COLOR;
      leftElement.style.fontSize = "12px";
      leftElement.style.overflow = "hidden";
      leftElement.style.textOverflow = "ellipsis";
      leftElement.style.whiteSpace = "nowrap";

      rightElement.textContent = right;
      rightElement.style.fontSize = "12px";
      rightElement.style.marginLeft = "14px";
      rightElement.style.flexShrink = 0;
      rightElement.style.color = typeof color == "string" ? color : ui.TEXT_COLOR;

      aRow.style.display = "flex";
      aRow.style.justifyContent = "space-between";
      aRow.style.padding = "6px 0px";
      aRow.style.borderBottomStyle = "solid";
      aRow.style.borderBottomWidth = "1px";
      aRow.style.borderBottomColor = ui.BORDER_COLOR;

      aRow.appendChild(leftElement);
      aRow.appendChild(rightElement);

      return aRow;
    }

    function disarm() {
      isArmed = false;

      if (armTimer != 0) {
        window.clearTimeout(armTimer);

        armTimer = 0;
      }
    }

    function onExport() {
      report("packing…", ui.MUTED_COLOR);

      makeBundle().then(function (bundle) {
        var text = JSON.stringify(bundle);
        var aBlob = new window.Blob([text], { type: "application/json" });
        var href = window.URL.createObjectURL(aBlob);
        var aLink = document.createElement("a");

        aLink.href = href;
        aLink.download = "noo-wari-" + stamp() + ".json";

        document.body.appendChild(aLink);
        aLink.click();
        aLink.remove();

        window.setTimeout(function () {
          window.URL.revokeObjectURL(href);
        }, 0);

        report("exported " + formatBytes(text.length) + " to your downloads");
      }).catch(function () {
        report("could not build the bundle", ui.DANGER_COLOR);
      });
    }

    function takeBundle(bundle, name) {
      if (!readable(bundle)) {
        report("that is not a noo-wari bundle", ui.DANGER_COLOR);

        return;
      }

      incoming = bundle;
      incoming.filename = name;

      disarm();
      paint();

      report("bundle loaded, review it below");
    }

    function readFile(aFile) {
      var reader = new FileReader();

      reader.onload = function () {
        try {
          takeBundle(JSON.parse("" + reader.result), aFile.name);
        } catch (error) {
          report("that file is not valid json", ui.DANGER_COLOR);
        }
      };

      reader.onerror = function () {
        report("could not read that file", ui.DANGER_COLOR);
      };

      reader.readAsText(aFile);
    }

    function wipeOwn() {
      var keys = ownKeys();

      for (var i = 0; i < keys.length; i++) {
        window.localStorage.removeItem(keys[i]);
      }
    }

    function writeVault(vault) {
      var chain = Promise.resolve(null);

      for (var id in vault) {
        if (vault.hasOwnProperty(id)) {
          chain = chain.then((function (key, text) {
            return function () {
              return window.vault.put(key, fromBase64(text));
            };
          })(id, vault[id]));
        }
      }

      return chain;
    }

    function apply() {
      if (incoming == null) {
        return;
      }

      var bundle = incoming;

      report("restoring…", ui.MUTED_COLOR);

      var ready = Promise.resolve(true);

      if (mode == "replace") {
        wipeOwn();

        if (window.vault.supported()) {
          ready = window.vault.clear();
        }
      }

      ready.then(function () {
        for (var key in bundle.keys) {
          if (bundle.keys.hasOwnProperty(key) && key.indexOf(PREFIX) == 0) {
            window.localStorage.setItem(key, bundle.keys[key]);
          }
        }

        if (bundle.vault == null || !window.vault.supported()) {
          return null;
        }

        return writeVault(bundle.vault);
      }).then(function () {
        window.location.reload();
      }).catch(function () {
        report("the restore did not finish", ui.DANGER_COLOR);
      });
    }

    function onApply() {
      if (incoming == null) {
        return;
      }

      if (!isArmed) {
        isArmed = true;

        paint();

        armTimer = window.setTimeout(function () {
          disarm();
          paint();
        }, 4000);

        return;
      }

      disarm();
      apply();
    }

    function paintHere() {
      stage.appendChild(makeHeading("this browser"));
      stage.appendChild(makeRow("origin", window.location.origin));
      stage.appendChild(makeRow("settings keys", "" + ownKeys().length));
      stage.appendChild(makeRow("settings size", formatBytes(keyBytes())));

      var vaultRow = makeRow("stored files", "counting…");

      stage.appendChild(vaultRow);

      if (!window.vault.supported()) {
        vaultRow.lastChild.textContent = "no vault";

        return;
      }

      window.vault.count().then(function (many) {
        return window.vault.measure().then(function (bytes) {
          vaultRow.lastChild.textContent = many + "  ·  " + formatBytes(bytes);
        });
      }).catch(function () {
        vaultRow.lastChild.textContent = "unreadable";
      });
    }

    function paintIncoming() {
      stage.appendChild(makeHeading("bundle to restore"));

      if (incoming == null) {
        var hint = ui.label("choose a file or drop one anywhere on this window");

        hint.style.display = "block";
        hint.style.padding = "8px 0px";

        stage.appendChild(hint);

        return;
      }

      stage.appendChild(makeRow("file", incoming.filename));
      stage.appendChild(makeRow("came from", incoming.origin));
      stage.appendChild(makeRow("saved", ("" + incoming.saved).replace("T", " ").slice(0, 16)));
      stage.appendChild(makeRow("settings keys", "" + countOf(incoming.keys)));
      stage.appendChild(
        makeRow("stored files", "" + countOf(incoming.vault == null ? {} : incoming.vault))
      );

      var modeRow = document.createElement("div");
      var modeLabel = ui.label("how");

      modeRow.style.display = "flex";
      modeRow.style.alignItems = "center";
      modeRow.style.gap = "8px";
      modeRow.style.padding = "10px 0px";

      function onMode(picked) {
        mode = picked;

        disarm();
        paint();
      }

      modeRow.appendChild(modeLabel);
      modeRow.appendChild(ui.select(MODES, mode, onMode));

      var note = ui.label(
        mode == "replace"
          ? "wipes this browser's noo-wari data first, then restores the bundle"
          : "keeps anything the bundle does not mention"
      );

      note.style.fontSize = "11px";

      modeRow.appendChild(note);

      stage.appendChild(modeRow);

      var applyButton = ui.button(isArmed ? "confirm restore?" : "restore", onApply);

      applyButton.style.color = ui.DANGER_COLOR;
      applyButton.style.borderColor = ui.DANGER_COLOR;

      stage.appendChild(applyButton);
    }

    function paint() {
      ui.clear(stage);

      paintHere();
      paintIncoming();
    }

    function onPick() {
      picker.click();
    }

    function onPicked() {
      if (picker.files != null && picker.files.length > 0) {
        readFile(picker.files[0]);
      }

      picker.value = "";
    }

    function hasFiles(event) {
      var carrier = event.dataTransfer;

      if (carrier == null || carrier.types == null) {
        return false;
      }

      for (var i = 0; i < carrier.types.length; i++) {
        if (carrier.types[i] == "Files") {
          return true;
        }
      }

      return false;
    }

    function onDragOver(event) {
      if (!hasFiles(event)) {
        return;
      }

      event.preventDefault();

      event.dataTransfer.dropEffect = "copy";

      stage.style.outlineStyle = "dashed";
      stage.style.outlineWidth = "2px";
      stage.style.outlineOffset = "-6px";
      stage.style.outlineColor = ui.ACCENT_COLOR;
    }

    function onDragLeave() {
      stage.style.outlineStyle = "none";
    }

    function onDrop(event) {
      if (!hasFiles(event)) {
        return;
      }

      event.preventDefault();

      stage.style.outlineStyle = "none";

      if (event.dataTransfer.files.length > 0) {
        readFile(event.dataTransfer.files[0]);
      }
    }

    picker.addEventListener("change", onPicked);

    stage.addEventListener("dragover", onDragOver);
    stage.addEventListener("dragleave", onDragLeave);
    stage.addEventListener("drop", onDrop);

    toolbar.appendChild(ui.button("export", onExport));
    toolbar.appendChild(ui.button("choose file", onPick));
    toolbar.appendChild(ui.button("refresh", paint));
    toolbar.appendChild(ui.spacer());
    toolbar.appendChild(status);

    aSheet.appendChild(toolbar);
    aSheet.appendChild(stage);
    aSheet.appendChild(picker);

    paint();

    function teardown() {
      disarm();

      if (timer != 0) {
        window.clearTimeout(timer);
        timer = 0;
      }
    }

    return teardown;
  }

  window.makeApp("transfer", "export and import your whole setup", 560, 520, build, "system");
})();
