(function () {
  var STORAGE_KEY = "noo-wari.desktop";

  var CELL_WIDTH = 88;
  var CELL_HEIGHT = 94;
  var ICON_SIZE = 44;
  var LEFT_MARGIN = 14;
  var TOP_MARGIN = 40;
  var LAYER_Z_INDEX = 0;
  var MENU_Z_INDEX = 1300;
  var FOLDER_WIDTH = 440;
  var FOLDER_HEIGHT = 320;
  var ICON_PIXELS = 88;

  function makeId() {
    return "i" + Math.floor(Math.random() * 1000000000).toString(36) + Date.now().toString(36);
  }

  function loadItems() {
    try {
      var raw = window.storage.get(STORAGE_KEY);

      if (raw == null) {
        return null;
      }

      var parsed = JSON.parse(raw);

      if (parsed instanceof Array) {
        return parsed;
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  function saveItems(items) {
    try {
      window.storage.set(STORAGE_KEY, JSON.stringify(items));

      return true;
    } catch (error) {
      return false;
    }
  }

  function makeAppItem(name, x, y) {
    var anItem = new Object();

    anItem.id = makeId();
    anItem.kind = "app";
    anItem.name = name;
    anItem.app = name;
    anItem.icon = "";
    anItem.x = x;
    anItem.y = y;

    return anItem;
  }

  function makeFolderItem(name, x, y) {
    var anItem = new Object();

    anItem.id = makeId();
    anItem.kind = "folder";
    anItem.name = name;
    anItem.items = [];
    anItem.icon = "";
    anItem.x = x;
    anItem.y = y;

    return anItem;
  }

  function makeFolderArt() {
    var anArt = document.createElement("div");
    var artStyle = anArt.style;

    var tab = document.createElement("div");
    var body = document.createElement("div");

    artStyle.position = "relative";
    artStyle.width = ICON_SIZE + "px";
    artStyle.height = ICON_SIZE + "px";

    tab.style.position = "absolute";
    tab.style.left = "2px";
    tab.style.top = "7px";
    tab.style.width = "17px";
    tab.style.height = "7px";
    tab.style.borderRadius = "3px 3px 0px 0px";
    tab.style.backgroundColor = "var(--nw-warn)";

    body.style.position = "absolute";
    body.style.left = "2px";
    body.style.top = "12px";
    body.style.width = ICON_SIZE - 4 + "px";
    body.style.height = ICON_SIZE - 18 + "px";
    body.style.borderRadius = "3px";
    body.style.backgroundColor = "var(--nw-warn)";
    body.style.opacity = "0.86";

    anArt.appendChild(tab);
    anArt.appendChild(body);

    return anArt;
  }

  function makeAppArt(name) {
    var anArt = document.createElement("div");
    var artStyle = anArt.style;

    var letter = name.charAt(0).toUpperCase();

    anArt.textContent = letter;

    artStyle.width = ICON_SIZE + "px";
    artStyle.height = ICON_SIZE + "px";
    artStyle.boxSizing = "border-box";
    artStyle.display = "flex";
    artStyle.alignItems = "center";
    artStyle.justifyContent = "center";
    artStyle.borderRadius = "9px";
    artStyle.borderStyle = "solid";
    artStyle.borderWidth = "1px";
    artStyle.borderColor = "var(--nw-tertiary)";
    artStyle.backgroundColor = "var(--nw-secondary)";
    artStyle.color = "var(--nw-accent)";
    artStyle.fontSize = "20px";

    return anArt;
  }

  function makePictureArt(src) {
    var anImage = document.createElement("img");
    var imageStyle = anImage.style;

    anImage.src = src;
    anImage.alt = "";
    anImage.draggable = false;

    imageStyle.width = ICON_SIZE + "px";
    imageStyle.height = ICON_SIZE + "px";
    imageStyle.objectFit = "cover";
    imageStyle.borderRadius = "9px";
    imageStyle.display = "block";

    return anImage;
  }

  function shrink(src, onDone) {
    var anImage = new Image();

    function onLoad() {
      var aCanvas = document.createElement("canvas");
      var context = aCanvas.getContext("2d");

      if (context == null) {
        onDone(src);

        return;
      }

      aCanvas.width = ICON_PIXELS;
      aCanvas.height = ICON_PIXELS;

      var scale = Math.max(ICON_PIXELS / anImage.width, ICON_PIXELS / anImage.height);
      var width = anImage.width * scale;
      var height = anImage.height * scale;

      context.drawImage(
        anImage,
        (ICON_PIXELS - width) / 2,
        (ICON_PIXELS - height) / 2,
        width,
        height
      );

      try {
        onDone(aCanvas.toDataURL("image/png"));
      } catch (error) {
        onDone(src);
      }
    }

    function onError() {
      onDone("");
    }

    anImage.addEventListener("load", onLoad);
    anImage.addEventListener("error", onError);

    anImage.src = src;
  }

  function makeArt(anItem) {
    if (typeof anItem.icon == "string" && anItem.icon != "") {
      return makePictureArt(anItem.icon);
    }

    if (anItem.kind == "folder") {
      return makeFolderArt();
    }

    return makeAppArt(anItem.name);
  }

  function makeMenu() {
    var aMenu = document.createElement("div");
    var menuStyle = aMenu.style;

    menuStyle.position = "fixed";
    menuStyle.display = "none";
    menuStyle.minWidth = "150px";
    menuStyle.padding = "5px 0px";
    menuStyle.backgroundColor = "var(--nw-panel)";
    menuStyle.borderStyle = "solid";
    menuStyle.borderWidth = "1px";
    menuStyle.borderColor = "var(--nw-tertiary)";
    menuStyle.borderRadius = "5px";
    menuStyle.backdropFilter = "blur(6px)";
    menuStyle.webkitBackdropFilter = "blur(6px)";
    menuStyle.fontFamily = window.ui.FONT_FAMILY;
    menuStyle.fontSize = "12px";
    menuStyle.color = "var(--nw-text)";
    menuStyle.zIndex = MENU_Z_INDEX;

    return aMenu;
  }

  function makeMenuEntry(label, onPick) {
    var anEntry = document.createElement("div");
    var entryStyle = anEntry.style;

    anEntry.textContent = label;

    entryStyle.padding = "6px 14px";
    entryStyle.cursor = "pointer";
    entryStyle.whiteSpace = "nowrap";

    function onEnter() {
      entryStyle.backgroundColor = "var(--nw-active)";
      entryStyle.color = "var(--nw-accent)";
    }

    function onLeave() {
      entryStyle.backgroundColor = "transparent";
      entryStyle.color = "var(--nw-text)";
    }

    anEntry.addEventListener("mouseenter", onEnter);
    anEntry.addEventListener("mouseleave", onLeave);
    anEntry.addEventListener("mousedown", onPick);

    return anEntry;
  }

  function makeDesktop() {
    var layer = document.createElement("div");
    var aMenu = makeMenu();

    var items = null;
    var selectedId = "";
    var folders = new Object();

    var dragItem = null;
    var dragElement = null;
    var dragOffsetX = 0;
    var dragOffsetY = 0;
    var didMove = false;

    function appNames() {
      var found = [];
      var apps = window.launcher.list();

      for (var i = 0; i < apps.length; i++) {
        found.push(apps[i].name);
      }

      return found;
    }

    function columns() {
      var usable = window.innerHeight - TOP_MARGIN - CELL_HEIGHT;

      return Math.max(1, Math.floor(usable / CELL_HEIGHT) + 1);
    }

    function defaults() {
      var names = appNames();
      var made = [];
      var rows = columns();

      for (var i = 0; i < names.length; i++) {
        made.push(makeAppItem(names[i], Math.floor(i / rows), i % rows));
      }

      return made;
    }

    function persist() {
      saveItems(items);
    }

    function findItem(id) {
      for (var i = 0; i < items.length; i++) {
        if (items[i].id == id) {
          return items[i];
        }
      }

      return null;
    }

    function removeItem(id) {
      for (var i = 0; i < items.length; i++) {
        if (items[i].id == id) {
          items.splice(i, 1);

          return true;
        }
      }

      return false;
    }

    function itemAtCell(x, y, exceptId) {
      for (var i = 0; i < items.length; i++) {
        if (items[i].x == x && items[i].y == y && items[i].id != exceptId) {
          return items[i];
        }
      }

      return null;
    }

    function freeCell() {
      var rows = columns();

      for (var x = 0; x < 40; x++) {
        for (var y = 0; y < rows; y++) {
          if (itemAtCell(x, y, "") == null) {
            return { x: x, y: y };
          }
        }
      }

      return { x: 0, y: 0 };
    }

    function launch(anItem) {
      if (anItem.kind == "folder") {
        openFolder(anItem);

        return;
      }

      var apps = window.launcher.list();

      for (var i = 0; i < apps.length; i++) {
        if (apps[i].name == anItem.app) {
          apps[i].run();

          return;
        }
      }
    }

    function openFolder(anItem) {
      var existing = folders[anItem.id];

      if (typeof existing != "undefined" && existing.content != null) {
        window.desktops.move(existing, window.desktops.current());
        window.desktops.focus(existing);

        return existing;
      }

      var aWindow = window.makeWindow(FOLDER_WIDTH, FOLDER_HEIGHT);
      var label = document.createElement("span");

      label.textContent = anItem.name;
      label.style.marginLeft = "4px";
      label.style.color = "var(--nw-text)";
      label.style.fontFamily = window.ui.FONT_FAMILY;
      label.style.fontSize = "12px";
      label.style.pointerEvents = "none";

      aWindow.titleBar.appendChild(label);

      var tray = document.createElement("div");

      tray.style.display = "flex";
      tray.style.flexWrap = "wrap";
      tray.style.alignContent = "flex-start";
      tray.style.gap = "6px";
      tray.style.padding = "12px";
      tray.style.width = "100%";
      tray.style.boxSizing = "border-box";
      tray.style.fontFamily = window.ui.FONT_FAMILY;

      aWindow.content.appendChild(tray);

      folders[anItem.id] = aWindow;

      paintFolder(anItem, tray);

      aWindow.tray = tray;
      aWindow.folder = anItem;

      return aWindow;
    }

    function paintFolder(anItem, tray) {
      window.ui.clear(tray);

      if (anItem.items.length == 0) {
        var empty = window.ui.label("drag icons here");

        empty.style.padding = "6px";

        tray.appendChild(empty);

        return;
      }

      for (var i = 0; i < anItem.items.length; i++) {
        tray.appendChild(makeTile(anItem.items[i], anItem));
      }
    }

    function refreshFolder(anItem) {
      var aWindow = folders[anItem.id];

      if (typeof aWindow == "undefined" || aWindow.content == null) {
        return;
      }

      paintFolder(anItem, aWindow.tray);
    }

    function makeTile(anItem, parent) {
      var aTile = document.createElement("div");
      var tileStyle = aTile.style;

      var label = document.createElement("div");

      label.textContent = anItem.name;
      label.style.marginTop = "5px";
      label.style.fontSize = "11px";
      label.style.textAlign = "center";
      label.style.color = "var(--nw-text)";
      label.style.overflow = "hidden";
      label.style.textOverflow = "ellipsis";
      label.style.whiteSpace = "nowrap";
      label.style.maxWidth = CELL_WIDTH - 16 + "px";

      tileStyle.width = CELL_WIDTH - 12 + "px";
      tileStyle.display = "flex";
      tileStyle.flexDirection = "column";
      tileStyle.alignItems = "center";
      tileStyle.padding = "6px 2px";
      tileStyle.borderRadius = "6px";
      tileStyle.cursor = "pointer";
      tileStyle.userSelect = "none";

      aTile.appendChild(makeArt(anItem));
      aTile.appendChild(label);

      function onOpen() {
        launch(anItem);
      }

      function onMenu(event) {
        event.preventDefault();
        event.stopPropagation();

        showItemMenu(anItem, parent, event.clientX, event.clientY);
      }

      aTile.addEventListener("dblclick", onOpen);
      aTile.addEventListener("contextmenu", onMenu);

      aTile.item = anItem;
      aTile.label = label;

      return aTile;
    }

    function makeDesktopTile(anItem) {
      var aTile = makeTile(anItem, null);
      var tileStyle = aTile.style;

      tileStyle.position = "absolute";
      tileStyle.left = LEFT_MARGIN + anItem.x * CELL_WIDTH + "px";
      tileStyle.top = TOP_MARGIN + anItem.y * CELL_HEIGHT + "px";

      if (anItem.id == selectedId) {
        tileStyle.backgroundColor = "var(--nw-active)";
      }

      function onDown(event) {
        if (event.button != 0) {
          return;
        }

        event.preventDefault();

        selectedId = anItem.id;

        paint();

        beginDrag(anItem, event);
      }

      aTile.addEventListener("mousedown", onDown);

      return aTile;
    }

    function beginDrag(anItem, event) {
      dragItem = anItem;
      didMove = false;

      dragElement = document.createElement("div");

      dragElement.style.position = "fixed";
      dragElement.style.opacity = "0.75";
      dragElement.style.pointerEvents = "none";
      dragElement.style.zIndex = MENU_Z_INDEX;

      dragElement.appendChild(makeArt(anItem));

      dragOffsetX = ICON_SIZE / 2;
      dragOffsetY = ICON_SIZE / 2;

      moveDrag(event);

      document.body.appendChild(dragElement);

      document.addEventListener("mousemove", moveDrag);
      document.addEventListener("mouseup", endDrag);
    }

    function moveDrag(event) {
      if (dragElement == null) {
        return;
      }

      didMove = true;

      dragElement.style.left = event.clientX - dragOffsetX + "px";
      dragElement.style.top = event.clientY - dragOffsetY + "px";
    }

    function endDrag(event) {
      document.removeEventListener("mousemove", moveDrag);
      document.removeEventListener("mouseup", endDrag);

      if (dragElement != null) {
        dragElement.remove();

        dragElement = null;
      }

      if (dragItem == null) {
        return;
      }

      var anItem = dragItem;

      dragItem = null;

      if (!didMove) {
        return;
      }

      var x = Math.round((event.clientX - LEFT_MARGIN - CELL_WIDTH / 2) / CELL_WIDTH);
      var y = Math.round((event.clientY - TOP_MARGIN - CELL_HEIGHT / 2) / CELL_HEIGHT);

      if (x < 0) {
        x = 0;
      }

      if (y < 0) {
        y = 0;
      }

      var target = itemAtCell(x, y, anItem.id);

      if (target != null && target.kind == "folder" && anItem.kind != "folder") {
        removeItem(anItem.id);

        target.items.push(anItem);

        refreshFolder(target);
      } else if (target == null) {
        anItem.x = x;
        anItem.y = y;
      }

      persist();
      paint();
    }

    function showMenu(entries, x, y) {
      window.ui.clear(aMenu);

      for (var i = 0; i < entries.length; i++) {
        aMenu.appendChild(makeMenuEntry(entries[i].label, entries[i].run));
      }

      aMenu.style.display = "block";
      aMenu.style.left = x + "px";
      aMenu.style.top = y + "px";
    }

    function hideMenu() {
      aMenu.style.display = "none";
    }

    function repaint(parent) {
      if (parent == null) {
        paint();
      } else {
        refreshFolder(parent);
      }
    }

    function applyPicture(anItem, src, parent) {
      shrink(src, function (small) {
        if (small == "") {
          return;
        }

        anItem.icon = small;

        persist();
        repaint(parent);
      });
    }

    function choosePicture(anItem, parent) {
      var picker = document.createElement("input");

      picker.type = "file";
      picker.accept = "image/*";
      picker.style.display = "none";

      function onChange() {
        var file = picker.files[0];

        if (typeof file == "undefined") {
          picker.remove();

          return;
        }

        var reader = new FileReader();

        function onRead() {
          applyPicture(anItem, reader.result, parent);

          picker.remove();
        }

        reader.addEventListener("load", onRead);
        reader.readAsDataURL(file);
      }

      picker.addEventListener("change", onChange);

      document.body.appendChild(picker);

      picker.click();
    }

    function clearPicture(anItem, parent) {
      anItem.icon = "";

      persist();
      repaint(parent);
    }

    function showItemMenu(anItem, parent, x, y) {
      var entries = [];

      entries.push({
        label: "open",
        run: function () {
          hideMenu();
          launch(anItem);
        }
      });

      entries.push({
        label: "rename",
        run: function () {
          hideMenu();
          beginRename(anItem, parent);
        }
      });

      entries.push({
        label: "set picture",
        run: function () {
          hideMenu();
          choosePicture(anItem, parent);
        }
      });

      if (typeof anItem.icon == "string" && anItem.icon != "") {
        entries.push({
          label: "clear picture",
          run: function () {
            hideMenu();
            clearPicture(anItem, parent);
          }
        });
      }

      entries.push({
        label: "remove",
        run: function () {
          hideMenu();
          discard(anItem, parent);
        }
      });

      showMenu(entries, x, y);
    }

    function showDesktopMenu(x, y) {
      showMenu([
        {
          label: "new folder",
          run: function () {
            hideMenu();
            addFolder("new folder");
          }
        },
        {
          label: "tidy icons",
          run: function () {
            hideMenu();
            tidy();
          }
        },
        {
          label: "reset to apps",
          run: function () {
            hideMenu();
            reset();
          }
        }
      ], x, y);
    }

    function discard(anItem, parent) {
      if (parent == null) {
        removeItem(anItem.id);
      } else {
        for (var i = 0; i < parent.items.length; i++) {
          if (parent.items[i].id == anItem.id) {
            parent.items.splice(i, 1);
          }
        }

        refreshFolder(parent);
      }

      persist();
      paint();
    }

    function beginRename(anItem, parent) {
      var tile = tileOf(anItem, parent);

      if (tile == null) {
        return;
      }

      var anInput = document.createElement("input");

      anInput.value = anItem.name;
      anInput.spellcheck = false;

      anInput.style.width = CELL_WIDTH - 20 + "px";
      anInput.style.marginTop = "5px";
      anInput.style.padding = "1px 4px";
      anInput.style.boxSizing = "border-box";
      anInput.style.textAlign = "center";
      anInput.style.fontSize = "11px";
      anInput.style.fontFamily = window.ui.FONT_FAMILY;
      anInput.style.color = "var(--nw-text)";
      anInput.style.backgroundColor = "var(--nw-select)";
      anInput.style.borderStyle = "solid";
      anInput.style.borderWidth = "1px";
      anInput.style.borderColor = "var(--nw-accent)";
      anInput.style.borderRadius = "3px";
      anInput.style.outlineStyle = "none";

      function commit() {
        var text = anInput.value.trim();

        if (text != "") {
          anItem.name = text;
        }

        persist();

        if (parent == null) {
          paint();
        } else {
          refreshFolder(parent);
        }
      }

      function onKeyDown(event) {
        event.stopPropagation();

        if (event.key == "Enter") {
          commit();
        }

        if (event.key == "Escape") {
          if (parent == null) {
            paint();
          } else {
            refreshFolder(parent);
          }
        }
      }

      anInput.addEventListener("keydown", onKeyDown);
      anInput.addEventListener("blur", commit);
      anInput.addEventListener("mousedown", function (event) {
        event.stopPropagation();
      });

      tile.replaceChild(anInput, tile.label);

      anInput.focus();
      anInput.select();
    }

    function tileOf(anItem, parent) {
      var host = layer;

      if (parent != null) {
        var aWindow = folders[parent.id];

        if (typeof aWindow == "undefined" || aWindow.content == null) {
          return null;
        }

        host = aWindow.tray;
      }

      for (var i = 0; i < host.childNodes.length; i++) {
        if (host.childNodes[i].item == anItem) {
          return host.childNodes[i];
        }
      }

      return null;
    }

    function addFolder(name) {
      var spot = freeCell();
      var anItem = makeFolderItem(name, spot.x, spot.y);

      items.push(anItem);

      persist();
      paint();

      return anItem;
    }

    function addApp(name) {
      var spot = freeCell();
      var anItem = makeAppItem(name, spot.x, spot.y);

      items.push(anItem);

      persist();
      paint();

      return anItem;
    }

    function setPicture(id, src) {
      var anItem = findItem(id);

      if (anItem == null) {
        return false;
      }

      applyPicture(anItem, src, null);

      return true;
    }

    function tidy() {
      var rows = columns();

      for (var i = 0; i < items.length; i++) {
        items[i].x = Math.floor(i / rows);
        items[i].y = i % rows;
      }

      persist();
      paint();
    }

    function reset() {
      items = defaults();
      selectedId = "";

      persist();
      paint();
    }

    function paint() {
      window.ui.clear(layer);

      for (var i = 0; i < items.length; i++) {
        layer.appendChild(makeDesktopTile(items[i]));
      }
    }

    function onLayerDown(event) {
      if (event.target != layer) {
        return;
      }

      selectedId = "";

      hideMenu();
      paint();
    }

    function onLayerMenu(event) {
      if (event.target != layer) {
        return;
      }

      event.preventDefault();

      showDesktopMenu(event.clientX, event.clientY);
    }

    function onGlobalDown(event) {
      if (aMenu.style.display == "none") {
        return;
      }

      if (aMenu.contains(event.target)) {
        return;
      }

      hideMenu();
    }

    layer.style.position = "fixed";
    layer.style.left = "0px";
    layer.style.top = "0px";
    layer.style.width = "100%";
    layer.style.height = "100%";
    layer.style.zIndex = LAYER_Z_INDEX;
    layer.style.fontFamily = window.ui.FONT_FAMILY;

    layer.addEventListener("mousedown", onLayerDown);
    layer.addEventListener("contextmenu", onLayerMenu);

    document.addEventListener("mousedown", onGlobalDown);

    var anchor = null;

    if (typeof window.launcher != "undefined") {
      anchor = window.launcher.orb;
    }

    if (anchor != null && anchor.parentNode == document.body) {
      document.body.insertBefore(layer, anchor);
    } else {
      document.body.appendChild(layer);
    }

    document.body.appendChild(aMenu);

    items = loadItems();

    if (items == null) {
      items = defaults();

      persist();
    }

    paint();

    return {
      element: layer,
      list: function () {
        return items.slice(0);
      },
      addApp: addApp,
      addFolder: addFolder,
      setPicture: setPicture,
      tidy: tidy,
      reset: reset,
      paint: paint
    };
  }

  var desktop = makeDesktop();

  window.makeDesktop = makeDesktop;
  window.desktop = desktop;
})();
