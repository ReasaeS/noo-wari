(function () {
  var INDEX_PATH = "__files";
  var LOCAL_LIMIT = 5 * 1024 * 1024;

  var TEXT_TYPES = ["application/json", "application/xml", "application/javascript"];

  var HOME_PLACE = "home";
  var SERVER_PLACE = "server";
  var DEVICE_PLACE = "device";

  var current = null;

  function formatBytes(amount) {
    if (amount < 1024) {
      return amount + " B";
    }

    if (amount < 1024 * 1024) {
      return Math.round((amount / 1024) * 10) / 10 + " KB";
    }

    if (amount < 1024 * 1024 * 1024) {
      return Math.round((amount / (1024 * 1024)) * 10) / 10 + " MB";
    }

    return Math.round((amount / (1024 * 1024 * 1024)) * 10) / 10 + " GB";
  }

  function formatPercent(part, whole) {
    if (whole <= 0) {
      return "0%";
    }

    var amount = (part / whole) * 100;

    if (amount > 0 && amount < 0.1) {
      return "< 0.1%";
    }

    return Math.round(amount * 10) / 10 + "%";
  }

  function makeFolder(name) {
    return window.filesystem.folder(name);
  }

  function makeRemote(name, path, size) {
    var aNode = new Object();

    aNode.kind = "remote";
    aNode.name = name;
    aNode.path = path;
    aNode.size = size;

    return aNode;
  }

  function buildRemoteTree(entries) {
    var root = makeFolder("server");

    for (var i = 0; i < entries.length; i++) {
      var parts = entries[i].path.split("/");
      var host = root;

      for (var j = 0; j < parts.length - 1; j++) {
        var found = null;

        for (var k = 0; k < host.children.length; k++) {
          if (host.children[k].name == parts[j] && host.children[k].kind == "folder") {
            found = host.children[k];
          }
        }

        if (found == null) {
          found = makeFolder(parts[j]);

          host.children.push(found);
        }

        host = found;
      }

      host.children.push(
        makeRemote(parts[parts.length - 1], entries[i].path, entries[i].size)
      );
    }

    return root;
  }

  function measureLocal() {
    var report = new Object();

    report.entries = [];
    report.characters = 0;

    var keys = window.storage.keys();

    for (var i = 0; i < keys.length; i++) {
      var value = window.storage.get(keys[i]);

      if (value == null) {
        value = "";
      }

      var size = (keys[i].length + value.length) * 2;

      report.entries.push({ key: keys[i], size: size });
      report.characters = report.characters + size;
    }

    report.entries.sort(function (left, right) {
      return right.size - left.size;
    });

    return report;
  }

  function build(aSheet) {
    var ui = window.ui;

    var toolbar = ui.toolbar();
    var body = document.createElement("div");
    var sidebar = document.createElement("div");
    var content = document.createElement("div");

    var home = window.filesystem.home();
    var server = null;
    var place = HOME_PLACE;
    var trail = [home];
    var openFile = null;
    var editor = null;
    var preview = "";

    function release(href) {
      if (typeof href == "string" && href != "") {
        window.vault.release(href);
      }

      return true;
    }

    var pathValue = ui.value("home");

    var newFolderButton = ui.button("new folder", null);
    var newFileButton = ui.button("new file", null);
    var saveButton = ui.button("save", null);
    var deleteButton = ui.button("delete", null);

    function pathOf(aNode) {
      var parts = [];

      for (var i = 1; i < trail.length; i++) {
        parts.push(trail[i].name);
      }

      parts.push(aNode.name);

      return parts;
    }

    function here() {
      return trail[trail.length - 1];
    }

    function persist() {
      window.filesystem.save();
    }

    function makeBar(part, whole) {
      var aTrack = document.createElement("div");
      var aFill = document.createElement("div");

      var ratio = 0;

      if (whole > 0) {
        ratio = Math.min(part / whole, 1);
      }

      var color = ui.ACCENT_COLOR;

      if (ratio > 0.9) {
        color = ui.DANGER_COLOR;
      } else if (ratio > 0.7) {
        color = ui.WARN_COLOR;
      }

      aTrack.style.height = "16px";
      aTrack.style.borderRadius = "3px";
      aTrack.style.overflow = "hidden";
      aTrack.style.backgroundColor = "var(--nw-sunken)";
      aTrack.style.borderStyle = "solid";
      aTrack.style.borderWidth = "1px";
      aTrack.style.borderColor = ui.BORDER_COLOR;

      aFill.style.height = "100%";
      aFill.style.width = Math.max(ratio * 100, 0.5) + "%";
      aFill.style.backgroundColor = color;

      aTrack.appendChild(aFill);

      return aTrack;
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

    function makeInfoRow(left, right, color) {
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

      if (typeof color == "string") {
        rightElement.style.color = color;
      } else {
        rightElement.style.color = ui.TEXT_COLOR;
      }

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

    function makeGlyph(aNode) {
      var aGlyph = document.createElement("span");

      if (aNode.kind == "folder") {
        aGlyph.textContent = "▸";
        aGlyph.style.color = ui.WARN_COLOR;
      } else if (aNode.kind == "remote") {
        aGlyph.textContent = "·";
        aGlyph.style.color = ui.MUTED_COLOR;
      } else {
        aGlyph.textContent = "◆";
        aGlyph.style.color = ui.ACCENT_COLOR;
      }

      aGlyph.style.width = "14px";
      aGlyph.style.flexShrink = 0;
      aGlyph.style.fontSize = "12px";

      return aGlyph;
    }

    function sizeOf(aNode) {
      if (aNode.kind == "folder") {
        return aNode.children.length + " items";
      }

      if (aNode.kind == "remote") {
        return formatBytes(aNode.size);
      }

      return formatBytes(window.filesystem.measure(aNode));
    }

    function makeEntryRow(aNode) {
      var aRow = document.createElement("div");
      var nameElement = document.createElement("span");
      var sizeElement = document.createElement("span");

      nameElement.textContent = aNode.name;
      nameElement.style.fontSize = "13px";
      nameElement.style.color = ui.TEXT_COLOR;
      nameElement.style.flexGrow = 1;
      nameElement.style.overflow = "hidden";
      nameElement.style.textOverflow = "ellipsis";
      nameElement.style.whiteSpace = "nowrap";

      sizeElement.textContent = sizeOf(aNode);
      sizeElement.style.fontSize = "11px";
      sizeElement.style.color = ui.MUTED_COLOR;
      sizeElement.style.marginLeft = "14px";
      sizeElement.style.flexShrink = 0;

      aRow.style.display = "flex";
      aRow.style.alignItems = "center";
      aRow.style.padding = "7px 8px";
      aRow.style.borderRadius = "4px";
      aRow.style.cursor = "pointer";

      function onEnter() {
        aRow.style.backgroundColor = "var(--nw-active)";
      }

      function onLeave() {
        aRow.style.backgroundColor = "transparent";
      }

      function onOpen() {
        if (aNode.kind == "folder") {
          trail.push(aNode);
        } else {
          openFile = aNode;
        }

        paint();
      }

      function onMenu(event) {
        event.preventDefault();

        if (place != HOME_PLACE) {
          return;
        }

        beginRename(aNode);
      }

      function onDown(event) {
        if (event.button != 0 || aNode.kind != "folder" || place != HOME_PLACE) {
          return;
        }

        beginStarDrag(aNode, event);
      }

      aRow.addEventListener("mouseenter", onEnter);
      aRow.addEventListener("mouseleave", onLeave);
      aRow.addEventListener("mousedown", onDown);
      aRow.addEventListener("click", onOpen);
      aRow.addEventListener("contextmenu", onMenu);

      aRow.appendChild(makeGlyph(aNode));
      aRow.appendChild(nameElement);
      aRow.appendChild(sizeElement);

      aRow.node = aNode;
      aRow.label = nameElement;

      return aRow;
    }

    function beginRename(aNode) {
      var aRow = rowOf(aNode);

      if (aRow == null || window.filesystem.isProtected(aNode)) {
        return;
      }

      var anInput = document.createElement("input");

      anInput.value = aNode.name;
      anInput.spellcheck = false;

      anInput.style.flexGrow = 1;
      anInput.style.padding = "1px 4px";
      anInput.style.fontSize = "13px";
      anInput.style.fontFamily = ui.FONT_FAMILY;
      anInput.style.color = ui.TEXT_COLOR;
      anInput.style.backgroundColor = "var(--nw-select)";
      anInput.style.borderStyle = "solid";
      anInput.style.borderWidth = "1px";
      anInput.style.borderColor = ui.ACCENT_COLOR;
      anInput.style.borderRadius = "3px";
      anInput.style.outlineStyle = "none";
      anInput.style.userSelect = "text";
      anInput.style.webkitUserSelect = "text";

      function commit() {
        var text = anInput.value.trim();

        if (text != "" && text != aNode.name && window.filesystem.childNamed(here(), text) == null) {
          aNode.name = text;

          persist();
        }

        paint();
      }

      function onKeyDown(event) {
        event.stopPropagation();

        if (event.key == "Enter") {
          commit();
        }

        if (event.key == "Escape") {
          paint();
        }
      }

      anInput.addEventListener("keydown", onKeyDown);
      anInput.addEventListener("blur", commit);
      anInput.addEventListener("click", function (event) {
        event.stopPropagation();
      });

      aRow.replaceChild(anInput, aRow.label);

      anInput.focus();
      anInput.select();
    }

    function beginStarDrag(aNode, event) {
      var ghost = document.createElement("div");
      var path = pathOf(aNode);
      var moved = false;

      ghost.textContent = "★ " + aNode.name;

      ghost.style.position = "fixed";
      ghost.style.padding = "4px 8px";
      ghost.style.borderRadius = "4px";
      ghost.style.fontSize = "11px";
      ghost.style.fontFamily = ui.FONT_FAMILY;
      ghost.style.color = ui.ACCENT_COLOR;
      ghost.style.backgroundColor = "var(--nw-panel)";
      ghost.style.borderStyle = "solid";
      ghost.style.borderWidth = "1px";
      ghost.style.borderColor = ui.ACCENT_COLOR;
      ghost.style.pointerEvents = "none";
      ghost.style.zIndex = 1400;
      ghost.style.display = "none";

      function onMove(moveEvent) {
        moved = true;

        ghost.style.display = "block";
        ghost.style.left = moveEvent.clientX + 10 + "px";
        ghost.style.top = moveEvent.clientY + 10 + "px";
      }

      function onUp(upEvent) {
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);

        ghost.remove();

        if (!moved) {
          return;
        }

        var over = document.elementFromPoint(upEvent.clientX, upEvent.clientY);

        if (window.filesystem.isStarZone(over)) {
          window.filesystem.star(path);
        }
      }

      document.body.appendChild(ghost);

      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    }

    function rowOf(aNode) {
      for (var i = 0; i < content.childNodes.length; i++) {
        if (content.childNodes[i].node == aNode) {
          return content.childNodes[i];
        }
      }

      return null;
    }

    function makeViewer() {
      var aViewer = document.createElement("pre");

      aViewer.style.margin = "10px 0px 0px 0px";
      aViewer.style.padding = "10px";
      aViewer.style.borderRadius = "4px";
      aViewer.style.backgroundColor = "var(--nw-deep)";
      aViewer.style.color = ui.TEXT_COLOR;
      aViewer.style.fontFamily = ui.FONT_FAMILY;
      aViewer.style.fontSize = "11px";
      aViewer.style.lineHeight = "1.5";
      aViewer.style.whiteSpace = "pre";
      aViewer.style.overflowX = "auto";
      aViewer.style.userSelect = "text";
      aViewer.style.webkitUserSelect = "text";

      return aViewer;
    }

    function isText(aNode) {
      if (typeof aNode.type != "string" || aNode.type == "") {
        return true;
      }

      if (aNode.type.indexOf("text/") == 0) {
        return true;
      }

      return TEXT_TYPES.indexOf(aNode.type) != -1;
    }

    function isPicture(aNode) {
      return typeof aNode.type == "string" && aNode.type.indexOf("image/") == 0;
    }

    function paintOpaque(aNode) {
      ui.clear(content);

      content.appendChild(makeInfoRow(aNode.name, formatBytes(aNode.size)));
      content.appendChild(makeInfoRow("type", aNode.type));

      if (!isPicture(aNode)) {
        var note = ui.label("stored in the vault, no preview for this type");

        note.style.display = "block";
        note.style.padding = "10px 0px";

        content.appendChild(note);

        return;
      }

      var aFrame = document.createElement("img");

      aFrame.alt = aNode.name;
      aFrame.draggable = false;

      aFrame.style.display = "block";
      aFrame.style.marginTop = "10px";
      aFrame.style.maxWidth = "100%";
      aFrame.style.borderRadius = "4px";
      aFrame.style.borderStyle = "solid";
      aFrame.style.borderWidth = "1px";
      aFrame.style.borderColor = ui.BORDER_COLOR;

      content.appendChild(aFrame);

      window.vault.url(aNode.blob, aNode.type).then(function (href) {
        if (href == "" || aFrame.parentNode == null) {
          window.vault.release(href);

          return;
        }

        release(preview);

        preview = href;
        aFrame.src = href;
      });
    }

    function paintFile(aNode) {
      if (!isText(aNode)) {
        paintOpaque(aNode);

        return;
      }

      window.filesystem.read(aNode).then(function (body) {
        if (openFile != aNode) {
          return;
        }

        paintEditor(aNode, body);
      });
    }

    function paintEditor(aNode, body) {
      ui.clear(content);

      editor = document.createElement("textarea");

      editor.value = body;
      editor.spellcheck = false;

      editor.style.width = "100%";
      editor.style.minHeight = "260px";
      editor.style.marginTop = "10px";
      editor.style.padding = "10px";
      editor.style.boxSizing = "border-box";
      editor.style.resize = "vertical";
      editor.style.backgroundColor = "var(--nw-deep)";
      editor.style.borderStyle = "solid";
      editor.style.borderWidth = "1px";
      editor.style.borderColor = ui.BORDER_COLOR;
      editor.style.borderRadius = "4px";
      editor.style.outlineStyle = "none";
      editor.style.color = ui.TEXT_COLOR;
      editor.style.fontFamily = ui.FONT_FAMILY;
      editor.style.fontSize = "12px";
      editor.style.lineHeight = "1.6";
      editor.style.userSelect = "text";
      editor.style.webkitUserSelect = "text";

      content.appendChild(makeInfoRow(aNode.name, formatBytes(window.filesystem.measure(aNode))));
      content.appendChild(editor);
    }

    function paintRemote(aNode) {
      ui.clear(content);

      var header = makeInfoRow(aNode.path, formatBytes(aNode.size));
      var infoElement = header.childNodes[1];
      var viewer = makeViewer();

      content.appendChild(header);
      content.appendChild(viewer);

      fetch(aNode.path).then(function (response) {
        return response.text();
      }).then(function (text) {
        if (openFile != aNode) {
          return;
        }

        viewer.textContent = text;

        infoElement.textContent =
          formatBytes(aNode.size) + "   " + text.split("\n").length + " lines";
      }).catch(function () {
        viewer.textContent = "could not read " + aNode.path;
      });
    }

    function paintFolder(aFolder) {
      ui.clear(content);

      if (aFolder.children.length == 0) {
        var empty = ui.label("empty");

        empty.style.display = "block";
        empty.style.padding = "8px";

        content.appendChild(empty);

        return;
      }

      for (var i = 0; i < aFolder.children.length; i++) {
        content.appendChild(makeEntryRow(aFolder.children[i]));
      }
    }

    function paintStorage() {
      ui.clear(content);

      var report = measureLocal();
      var used = report.characters;
      var free = Math.max(LOCAL_LIMIT - used, 0);

      var summary = document.createElement("div");
      var usedElement = document.createElement("span");
      var percentElement = document.createElement("span");

      usedElement.textContent = formatBytes(used) + " used of " + formatBytes(LOCAL_LIMIT);
      usedElement.style.color = ui.TEXT_COLOR;

      percentElement.textContent = formatPercent(used, LOCAL_LIMIT);
      percentElement.style.color = ui.ACCENT_COLOR;

      summary.style.display = "flex";
      summary.style.justifyContent = "space-between";
      summary.style.marginBottom = "8px";
      summary.style.fontSize = "13px";

      summary.appendChild(usedElement);
      summary.appendChild(percentElement);

      content.appendChild(makeHeading("local storage"));
      content.appendChild(summary);
      content.appendChild(makeBar(used, LOCAL_LIMIT));
      content.appendChild(makeInfoRow("free", formatBytes(free)));
      content.appendChild(makeInfoRow("keys", "" + report.entries.length));
      content.appendChild(makeInfoRow("file system", formatBytes(window.filesystem.measure(home))));

      content.appendChild(makeHeading("by key"));

      for (var i = 0; i < report.entries.length; i++) {
        content.appendChild(
          makeInfoRow(
            report.entries[i].key,
            formatBytes(report.entries[i].size) +
              "   " +
              formatPercent(report.entries[i].size, used)
          )
        );
      }

      content.appendChild(makeHeading("vault"));

      var vaultNote = ui.label("counting stored files…");

      vaultNote.style.display = "block";
      vaultNote.style.padding = "6px 0px";

      content.appendChild(vaultNote);

      paintVault(vaultNote);

      content.appendChild(makeHeading("origin quota"));

      var note = ui.label("asking the browser…");

      note.style.display = "block";
      note.style.padding = "6px 0px";

      content.appendChild(note);

      paintQuota(note);
    }

    function paintVault(note) {
      if (!window.vault.supported()) {
        note.textContent = "indexeddb is not available in this browser";

        return;
      }

      window.vault.count().then(function (stored) {
        return window.vault.measure().then(function (bytes) {
          if (place != DEVICE_PLACE) {
            return;
          }

          var host = note.parentNode;

          if (host == null) {
            return;
          }

          host.removeChild(note);

          host.appendChild(makeInfoRow("file contents", formatBytes(bytes)));
          host.appendChild(makeInfoRow("blobs", "" + stored));
          host.appendChild(makeInfoRow("kept in", "indexeddb"));
        });
      }).catch(function () {
        note.textContent = "the vault could not be read";
      });
    }

    function paintQuota(note) {
      if (typeof navigator.storage == "undefined") {
        note.textContent = "not reported by this browser";

        return;
      }

      if (typeof navigator.storage.estimate != "function") {
        note.textContent = "not reported by this browser";

        return;
      }

      navigator.storage.estimate().then(function (estimate) {
        if (place != DEVICE_PLACE) {
          return;
        }

        var host = note.parentNode;

        if (host == null) {
          return;
        }

        host.removeChild(note);

        host.appendChild(makeBar(estimate.usage, estimate.quota));
        host.appendChild(makeInfoRow("used", formatBytes(estimate.usage)));
        host.appendChild(makeInfoRow("available", formatBytes(estimate.quota)));
        host.appendChild(
          makeInfoRow("share", formatPercent(estimate.usage, estimate.quota), ui.ACCENT_COLOR)
        );
      });
    }

    function loadServer() {
      ui.clear(content);

      var note = ui.label("reading the web root…");

      note.style.display = "block";
      note.style.padding = "8px";

      content.appendChild(note);

      fetch(INDEX_PATH).then(function (response) {
        return response.json();
      }).then(function (entries) {
        server = buildRemoteTree(entries);

        if (place != SERVER_PLACE) {
          return;
        }

        trail = [server];

        paint();
      }).catch(function () {
        note.textContent = "the server did not provide a file index";
      });
    }

    function makeSideRow(label, depth, isActive, onPick) {
      var aRow = document.createElement("div");

      aRow.textContent = label;

      aRow.style.padding = "6px 9px";
      aRow.style.paddingLeft = 9 + depth * 12 + "px";
      aRow.style.borderRadius = "4px";
      aRow.style.fontSize = "12px";
      aRow.style.cursor = "pointer";
      aRow.style.marginBottom = "2px";
      aRow.style.overflow = "hidden";
      aRow.style.textOverflow = "ellipsis";
      aRow.style.whiteSpace = "nowrap";

      if (isActive) {
        aRow.style.backgroundColor = "var(--nw-active)";
        aRow.style.color = ui.ACCENT_COLOR;
      } else {
        aRow.style.color = ui.TEXT_COLOR;
      }

      aRow.addEventListener("click", onPick);

      return aRow;
    }

    function goPlace(name) {
      place = name;
      openFile = null;
      editor = null;

      if (name == HOME_PLACE) {
        trail = [home];
      }

      if (name == SERVER_PLACE) {
        if (server == null) {
          paintSidebar();
          paintTools();

          pathValue.textContent = "server";

          loadServer();

          return;
        }

        trail = [server];
      }

      paint();
    }

    function show(path) {
      var found = window.filesystem.trailFor(path);

      if (found == null) {
        return false;
      }

      place = HOME_PLACE;
      trail = found;
      openFile = null;
      editor = null;

      paint();

      return true;
    }

    function makeStarSection() {
      var aSection = document.createElement("div");
      var aHeading = document.createElement("div");
      var kept = window.filesystem.stars();

      aHeading.textContent = "starred";
      aHeading.style.marginTop = "10px";
      aHeading.style.marginBottom = "4px";
      aHeading.style.fontSize = "9px";
      aHeading.style.letterSpacing = "1px";
      aHeading.style.textTransform = "uppercase";
      aHeading.style.color = ui.MUTED_COLOR;

      aSection.style.paddingTop = "4px";
      aSection.style.paddingBottom = "6px";
      aSection.style.borderTopStyle = "solid";
      aSection.style.borderTopWidth = "1px";
      aSection.style.borderTopColor = ui.BORDER_COLOR;
      aSection.style.minHeight = "54px";
      aSection.style.flexGrow = 1;
      aSection.style.flexShrink = 1;
      aSection.style.flexBasis = "auto";
      aSection.style.overflowY = "auto";

      aSection.starZone = true;

      aSection.appendChild(aHeading);

      if (kept.length == 0) {
        var hint = ui.label("drop folders here");

        hint.style.display = "block";
        hint.style.padding = "4px 9px";
        hint.style.fontSize = "10px";

        aSection.appendChild(hint);
      }

      for (var i = 0; i < kept.length; i++) {
        aSection.appendChild(makeStarRow(kept[i]));
      }

      return aSection;
    }

    function makeStarRow(path) {
      var chain = window.filesystem.trailFor(path);
      var label = path[path.length - 1];
      var isHere = place == HOME_PLACE && chain != null && here() == chain[chain.length - 1];

      var aRow = makeSideRow("★ " + label, 0, isHere, function () {
        show(path);
      });

      if (chain == null) {
        aRow.style.color = ui.DANGER_COLOR;
        aRow.title = "missing";
      }

      aRow.title = path.join(" / ");

      function onMenu(event) {
        event.preventDefault();

        window.filesystem.unstar(path);

        paint();
      }

      aRow.addEventListener("contextmenu", onMenu);

      return aRow;
    }

    function paintSidebar() {
      ui.clear(sidebar);

      sidebar.appendChild(
        makeSideRow("home", 0, place == HOME_PLACE, function () {
          goPlace(HOME_PLACE);
        })
      );

      sidebar.appendChild(
        makeSideRow("server", 0, place == SERVER_PLACE, function () {
          goPlace(SERVER_PLACE);
        })
      );

      sidebar.appendChild(makeStarSection());

      var deviceRow = makeSideRow("this device", 0, place == DEVICE_PLACE, function () {
        goPlace(DEVICE_PLACE);
      });

      deviceRow.style.marginTop = "auto";
      deviceRow.style.marginBottom = "0px";
      deviceRow.style.borderRadius = "0px";
      deviceRow.style.paddingTop = "9px";
      deviceRow.style.borderTopStyle = "solid";
      deviceRow.style.borderTopWidth = "1px";
      deviceRow.style.borderTopColor = ui.BORDER_COLOR;

      sidebar.appendChild(deviceRow);
    }

    function paintTools() {
      var canWrite = place == HOME_PLACE;

      newFolderButton.style.display = canWrite ? "inline-block" : "none";
      newFileButton.style.display = canWrite ? "inline-block" : "none";
      deleteButton.style.display = canWrite && openFile != null ? "inline-block" : "none";
      saveButton.style.display = canWrite && openFile != null ? "inline-block" : "none";
    }

    function pathLabel() {
      if (place == DEVICE_PLACE) {
        return "this device";
      }

      var parts = [];

      for (var i = 0; i < trail.length; i++) {
        parts.push(trail[i].name);
      }

      if (openFile != null) {
        parts.push(openFile.name);
      }

      return parts.join(" / ");
    }

    function paint() {
      paintSidebar();
      paintTools();

      pathValue.textContent = pathLabel();

      if (place == DEVICE_PLACE) {
        paintStorage();

        return;
      }

      if (openFile != null) {
        if (openFile.kind == "remote") {
          paintRemote(openFile);
        } else {
          paintFile(openFile);
        }

        return;
      }

      paintFolder(here());
    }

    function goUp() {
      if (openFile != null) {
        openFile = null;
        editor = null;

        paint();

        return;
      }

      if (place == DEVICE_PLACE) {
        goPlace(HOME_PLACE);

        return;
      }

      if (trail.length > 1) {
        trail.pop();
      }

      paint();
    }

    function addFolder() {
      if (place != HOME_PLACE || openFile != null) {
        return;
      }

      here().children.push(
        window.filesystem.folder(window.filesystem.uniqueName(here(), "new folder"))
      );

      persist();
      paint();
    }

    function addFile() {
      if (place != HOME_PLACE || openFile != null) {
        return;
      }

      here().children.push(
        window.filesystem.file(window.filesystem.uniqueName(here(), "untitled.txt"), "")
      );

      persist();
      paint();
    }

    function saveFile() {
      if (openFile == null || editor == null) {
        return;
      }

      window.filesystem.write(openFile, editor.value).then(function () {
        paint();
      });
    }

    function deleteFile() {
      if (openFile == null || window.filesystem.isProtected(openFile)) {
        return;
      }

      window.filesystem.remove(here(), openFile);

      openFile = null;
      editor = null;

      persist();
      paint();
    }

    function refresh() {
      if (place == SERVER_PLACE) {
        server = null;

        goPlace(SERVER_PLACE);

        return;
      }

      window.filesystem.reload();

      home = window.filesystem.home();
      trail = [home];
      openFile = null;

      paint();
    }

    aSheet.style.userSelect = "none";
    aSheet.style.webkitUserSelect = "none";

    body.style.display = "flex";
    body.style.flexGrow = 1;
    body.style.minHeight = 0;

    sidebar.style.width = "132px";
    sidebar.style.flexShrink = 0;
    sidebar.style.display = "flex";
    sidebar.style.flexDirection = "column";
    sidebar.style.padding = "8px";
    sidebar.style.boxSizing = "border-box";
    sidebar.style.overflowY = "auto";
    sidebar.style.backgroundColor = ui.PANEL_COLOR;
    sidebar.style.borderRightStyle = "solid";
    sidebar.style.borderRightWidth = "1px";
    sidebar.style.borderRightColor = ui.BORDER_COLOR;

    content.style.flexGrow = 1;
    content.style.minWidth = 0;
    content.style.overflow = "auto";
    content.style.padding = "10px 14px";
    content.style.boxSizing = "border-box";

    newFolderButton.addEventListener("click", addFolder);
    newFileButton.addEventListener("click", addFile);
    saveButton.addEventListener("click", saveFile);
    deleteButton.addEventListener("click", deleteFile);

    toolbar.appendChild(ui.button("up", goUp));
    toolbar.appendChild(newFolderButton);
    toolbar.appendChild(newFileButton);
    toolbar.appendChild(saveButton);
    toolbar.appendChild(deleteButton);
    toolbar.appendChild(ui.button("refresh", refresh));
    toolbar.appendChild(ui.spacer());
    toolbar.appendChild(pathValue);

    body.appendChild(sidebar);
    body.appendChild(content);

    aSheet.appendChild(toolbar);
    aSheet.appendChild(body);

    function canReceive() {
      return place == HOME_PLACE && openFile == null;
    }

    function hasFiles(event) {
      var carrier = event.dataTransfer;

      if (carrier == null) {
        return false;
      }

      if (carrier.types == null) {
        return false;
      }

      for (var i = 0; i < carrier.types.length; i++) {
        if (carrier.types[i] == "Files") {
          return true;
        }
      }

      return false;
    }

    function litUp(isOn) {
      if (isOn) {
        content.style.outlineStyle = "dashed";
        content.style.outlineWidth = "2px";
        content.style.outlineOffset = "-6px";
        content.style.outlineColor = ui.ACCENT_COLOR;
      } else {
        content.style.outlineStyle = "none";
      }
    }

    function onDragOver(event) {
      if (!hasFiles(event) || !canReceive()) {
        return;
      }

      event.preventDefault();

      event.dataTransfer.dropEffect = "copy";

      litUp(true);
    }

    function onDragLeave(event) {
      if (event.target != content) {
        return;
      }

      litUp(false);
    }

    function onDrop(event) {
      if (!hasFiles(event) || !canReceive()) {
        return;
      }

      event.preventDefault();

      litUp(false);

      var dropped = event.dataTransfer.files;

      if (dropped == null || dropped.length == 0) {
        return;
      }

      var host = here();

      window.filesystem.receive(host, dropped).then(function (landed) {
        if (landed.length == 0) {
          return;
        }

        paint();
      });
    }

    content.addEventListener("dragover", onDragOver);
    content.addEventListener("dragleave", onDragLeave);
    content.addEventListener("drop", onDrop);

    paint();

    function onChange() {
      home = window.filesystem.home();

      if (place == HOME_PLACE && trail[0] != home) {
        trail = [home];
        openFile = null;
      }

      if (place == HOME_PLACE) {
        paint();
      }
    }

    window.filesystem.watch(onChange);

    current = show;

    function teardown() {
      window.filesystem.unwatch(onChange);

      release(preview);

      preview = "";

      if (current == show) {
        current = null;
      }
    }

    return teardown;
  }

  function openAt(path) {
    var aWindow = app.open();

    if (typeof current == "function") {
      current(path);
    }

    return aWindow;
  }

  var app = window.makeApp(
    "files",
    "local file system and server browser",
    700,
    500,
    build,
    "system"
  );

  window.files = {
    open: app.open,
    at: openAt
  };
})();
