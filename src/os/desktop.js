(function () {
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
  var DRAG_THRESHOLD = 5;

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
      return window.icons.picture(anItem.icon, ICON_SIZE);
    }

    if (anItem.kind == "folder") {
      return window.icons.folder(ICON_SIZE);
    }

    return window.icons.app(anItem.name, ICON_SIZE);
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

    function onDown(event) {
      event.preventDefault();
      event.stopPropagation();

      onPick(event);
    }

    anEntry.addEventListener("mouseenter", onEnter);
    anEntry.addEventListener("mouseleave", onLeave);
    anEntry.addEventListener("mousedown", onDown);

    return anEntry;
  }

  function makeDesktop() {
    var layer = document.createElement("div");
    var aMenu = makeMenu();

    var selectedNode = null;
    var folders = new Object();

    var dragItem = null;
    var dragElement = null;
    var dragOffsetX = 0;
    var dragOffsetY = 0;
    var pendingItem = null;
    var pendingX = 0;
    var pendingY = 0;

    function isRegistered(name) {
      var apps = window.launcher.list();

      for (var i = 0; i < apps.length; i++) {
        if (apps[i].name == name) {
          return true;
        }
      }

      return false;
    }

    function seedNames() {
      var found = [];
      var stock = window.icons.names();

      for (var i = 0; i < stock.length; i++) {
        if (isRegistered(stock[i])) {
          found.push(stock[i]);
        }
      }

      return found;
    }

    function field() {
      var bar = 0;

      if (typeof window.topbar != "undefined" && window.topbar.element.style.display != "none") {
        bar = window.topbar.height();
      }

      var side = typeof window.layout == "undefined" ? "top" : window.layout.bar();

      return {
        left: LEFT_MARGIN,
        top: side == "bottom" ? LEFT_MARGIN : TOP_MARGIN,
        width: window.innerWidth - LEFT_MARGIN * 2,
        height: window.innerHeight - bar - LEFT_MARGIN -
          (side == "bottom" ? LEFT_MARGIN : TOP_MARGIN)
      };
    }

    function columns() {
      var usable = field().height;

      return Math.max(1, Math.floor(usable / CELL_HEIGHT));
    }

    function lanes() {
      var usable = field().width;

      return Math.max(1, Math.floor(usable / CELL_WIDTH));
    }

    function cellFor(index) {
      var rows = columns();

      return { x: Math.floor(index / rows), y: index % rows };
    }

    function spotOf(cell) {
      var area = field();

      return {
        x: area.left + cell.x * CELL_WIDTH,
        y: area.top + cell.y * CELL_HEIGHT
      };
    }

    function overlaps(a, b) {
      return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
    }

    function boxOf(cell) {
      var spot = spotOf(cell);

      return {
        left: spot.x,
        top: spot.y,
        right: spot.x + CELL_WIDTH,
        bottom: spot.y + CELL_HEIGHT
      };
    }

    function boxes() {
      var found = [];
      var items = itemList();

      for (var i = 0; i < items.length; i++) {
        found.push(boxOf(items[i]));
      }

      return found;
    }

    function blocked(cell) {
      if (typeof window.widgets == "undefined") {
        return false;
      }

      var taken = window.widgets.boxes(null);

      if (taken.length == 0) {
        return false;
      }

      var box = boxOf(cell);

      for (var i = 0; i < taken.length; i++) {
        if (overlaps(box, taken[i])) {
          return true;
        }
      }

      return false;
    }

    function cellAt(x, y) {
      var area = field();
      var column = Math.round((x - area.left - CELL_WIDTH / 2) / CELL_WIDTH);
      var row = Math.round((y - area.top - CELL_HEIGHT / 2) / CELL_HEIGHT);

      return { x: Math.max(0, column), y: Math.max(0, row) };
    }

    function seed() {
      var names = seedNames();
      var host = desktopFolder();

      host.children = [];

      var slot = 0;

      for (var i = 0; i < names.length; i++) {
        var aNode = window.filesystem.shortcut(names[i], names[i]);
        var cell = cellFor(slot);

        while (blocked(cell) && slot < 400) {
          slot = slot + 1;
          cell = cellFor(slot);
        }

        aNode.x = cell.x;
        aNode.y = cell.y;

        slot = slot + 1;

        host.children.push(aNode);
      }
    }

    function desktopFolder() {
      return window.filesystem.desktop();
    }

    function itemList() {
      return desktopFolder().children;
    }

    function persist() {
      window.filesystem.save();
    }

    function findItem(name) {
      var items = itemList();

      for (var i = 0; i < items.length; i++) {
        if (items[i].name == name) {
          return items[i];
        }
      }

      return null;
    }

    function removeItem(aNode) {
      return window.filesystem.remove(desktopFolder(), aNode);
    }

    function itemAtCell(x, y, except) {
      var items = itemList();

      for (var i = 0; i < items.length; i++) {
        if (items[i].x == x && items[i].y == y && items[i] != except) {
          return items[i];
        }
      }

      return null;
    }

    function freeCell() {
      for (var i = 0; i < 400; i++) {
        var cell = cellFor(i);

        if (itemAtCell(cell.x, cell.y, null) == null && !blocked(cell)) {
          return cell;
        }
      }

      return { x: 0, y: 0 };
    }

    function pathOf(aNode) {
      var root = window.filesystem.home();
      var names = [];
      var node = aNode;

      while (node != root) {
        var host = window.filesystem.parentOf(root, node);

        if (host == null) {
          return null;
        }

        names.unshift(node.name);

        node = host;
      }

      return names;
    }

    function browse(anItem) {
      var path = pathOf(anItem);

      if (path == null || typeof window.files == "undefined") {
        openFolder(anItem);

        return;
      }

      window.files.at(path);
    }

    function launch(anItem) {
      if (anItem.kind == "folder") {
        browse(anItem);

        return;
      }

      if (anItem.kind == "file") {
        openEditor(anItem);

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

    function openEditor(anItem) {
      var aWindow = window.makeWindow(FOLDER_WIDTH, FOLDER_HEIGHT);
      var label = document.createElement("span");
      var editor = document.createElement("textarea");

      label.textContent = anItem.name;
      label.style.marginLeft = "4px";
      label.style.color = "var(--nw-text)";
      label.style.fontFamily = window.ui.FONT_FAMILY;
      label.style.fontSize = "12px";
      label.style.pointerEvents = "none";

      aWindow.titleBar.appendChild(label);

      editor.value = anItem.body;
      editor.spellcheck = false;

      editor.style.width = "100%";
      editor.style.height = "100%";
      editor.style.boxSizing = "border-box";
      editor.style.padding = "10px";
      editor.style.resize = "none";
      editor.style.backgroundColor = "var(--nw-deep)";
      editor.style.borderStyle = "none";
      editor.style.outlineStyle = "none";
      editor.style.color = "var(--nw-text)";
      editor.style.fontFamily = window.ui.FONT_FAMILY;
      editor.style.fontSize = "12px";
      editor.style.lineHeight = "1.6";

      function onInput() {
        anItem.body = editor.value;

        persist();
      }

      editor.addEventListener("input", onInput);

      aWindow.content.appendChild(editor);

      return aWindow;
    }

    function openFolder(anItem) {
      var existing = folders[anItem.name];

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

      folders[anItem.name] = aWindow;

      paintFolder(anItem, tray);

      aWindow.tray = tray;
      aWindow.folder = anItem;

      return aWindow;
    }

    function paintFolder(anItem, tray) {
      window.ui.clear(tray);

      if (anItem.children.length == 0) {
        var empty = window.ui.label("drag icons here");

        empty.style.padding = "6px";

        tray.appendChild(empty);

        return;
      }

      for (var i = 0; i < anItem.children.length; i++) {
        tray.appendChild(makeTile(anItem.children[i], anItem));
      }
    }

    function refreshFolder(anItem) {
      var aWindow = folders[anItem.name];

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

      function tapOpens() {
        if (typeof window.device == "undefined") {
          return false;
        }

        return window.device.isTouch() || window.device.isSmall();
      }

      function onTap() {
        if (!tapOpens()) {
          return;
        }

        launch(anItem);
      }

      if (anItem.kind == "file") {
        aTile.title = anItem.name;
      }

      function onMenu(event) {
        event.preventDefault();
        event.stopPropagation();

        showItemMenu(anItem, parent, event.clientX, event.clientY);
      }

      aTile.addEventListener("dblclick", onOpen);
      aTile.addEventListener("click", onTap);
      aTile.addEventListener("contextmenu", onMenu);

      aTile.item = anItem;
      aTile.label = label;

      return aTile;
    }

    function makeDesktopTile(anItem) {
      var aTile = makeTile(anItem, null);
      var tileStyle = aTile.style;

      tileStyle.position = "absolute";
      var spot = spotOf(anItem);

      tileStyle.left = spot.x + "px";
      tileStyle.top = spot.y + "px";

      if (anItem == selectedNode) {
        tileStyle.backgroundColor = "var(--nw-active)";
      }

      function onDown(event) {
        if (event.button != 0) {
          return;
        }

        closeRename();

        event.preventDefault();

        select(anItem);
        armDrag(anItem, event);
      }

      aTile.addEventListener("mousedown", onDown);

      window.touch.surface(aTile);

      return aTile;
    }

    function closeRename() {
      var active = document.activeElement;

      if (active != null && active.nodeName == "INPUT" && layer.contains(active)) {
        active.blur();
      }
    }

    function select(aNode) {
      selectedNode = aNode;

      paintSelection();
    }

    function paintSelection() {
      for (var i = 0; i < layer.childNodes.length; i++) {
        var aTile = layer.childNodes[i];

        if (aTile.item == selectedNode) {
          aTile.style.backgroundColor = "var(--nw-active)";
        } else {
          aTile.style.backgroundColor = "";
        }
      }
    }

    function armDrag(anItem, event) {
      pendingItem = anItem;
      pendingX = event.clientX;
      pendingY = event.clientY;

      document.addEventListener("mousemove", watchDrag);
      document.addEventListener("mouseup", endDrag);
    }

    function watchDrag(event) {
      if (dragElement == null) {
        if (pendingItem == null) {
          return;
        }

        if (
          Math.abs(event.clientX - pendingX) < DRAG_THRESHOLD &&
          Math.abs(event.clientY - pendingY) < DRAG_THRESHOLD
        ) {
          return;
        }

        beginDrag(pendingItem, event);

        return;
      }

      moveDrag(event);
    }

    function beginDrag(anItem, event) {
      dragItem = anItem;

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
    }

    function moveDrag(event) {
      if (dragElement == null) {
        return;
      }

      dragElement.style.left = event.clientX - dragOffsetX + "px";
      dragElement.style.top = event.clientY - dragOffsetY + "px";
    }

    function endDrag(event) {
      document.removeEventListener("mousemove", watchDrag);
      document.removeEventListener("mouseup", endDrag);

      pendingItem = null;

      if (dragElement != null) {
        dragElement.remove();

        dragElement = null;
      }

      if (dragItem == null) {
        return;
      }

      var anItem = dragItem;

      dragItem = null;

      var over = document.elementFromPoint(event.clientX, event.clientY);

      if (window.filesystem.isStarZone(over)) {
        if (anItem.kind == "folder") {
          window.filesystem.star(["desktop", anItem.name]);
        }

        return;
      }

      var cell = cellAt(event.clientX, event.clientY);

      if (blocked(cell)) {
        paint();

        return;
      }

      var x = cell.x;
      var y = cell.y;

      var target = itemAtCell(x, y, anItem);

      if (target != null && target.kind == "folder" && anItem.kind != "folder") {
        removeItem(anItem);

        target.children.push(anItem);

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

    function showWidgetMenu(x, y) {
      var entries = [];

      if (typeof window.widgets != "undefined") {
        var kinds = window.widgets.kinds();

        for (var i = 0; i < kinds.length; i++) {
          entries.push({
            label: window.widgets.titleOf(kinds[i]),
            run: (function (kind) {
              return function () {
                hideMenu();
                window.widgets.addAt(kind, x, y);
              };
            })(kinds[i])
          });
        }
      }

      if (entries.length == 0) {
        entries.push({
          label: "no widgets available",
          run: hideMenu
        });
      }

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
          label: "add widget",
          run: function () {
            showWidgetMenu(x, y);
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
          label: "reset icons",
          run: function () {
            hideMenu();
            reset();
          }
        }
      ], x, y);
    }

    function discard(anItem, parent) {
      if (parent == null) {
        removeItem(anItem);
      } else {
        window.filesystem.remove(parent, anItem);

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

        if (text != "" && !window.filesystem.isProtected(anItem)) {
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

      function grab() {
        anInput.focus();
        anInput.select();
      }

      setTimeout(grab, 0);
    }

    function tileOf(anItem, parent) {
      var host = layer;

      if (parent != null) {
        var aWindow = folders[parent.name];

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
      var host = desktopFolder();
      var anItem = window.filesystem.folder(window.filesystem.uniqueName(host, name));

      anItem.x = spot.x;
      anItem.y = spot.y;

      host.children.push(anItem);

      persist();
      paint();

      return anItem;
    }

    function addApp(name) {
      var spot = freeCell();
      var host = desktopFolder();
      var anItem = window.filesystem.shortcut(window.filesystem.uniqueName(host, name), name);

      anItem.x = spot.x;
      anItem.y = spot.y;

      host.children.push(anItem);

      persist();
      paint();

      return anItem;
    }

    function setPicture(name, src) {
      var anItem = findItem(name);

      if (anItem == null) {
        return false;
      }

      applyPicture(anItem, src, null);

      return true;
    }

    function tidyIcons() {
      var items = itemList();
      var slot = 0;

      for (var i = 0; i < items.length; i++) {
        var cell = cellFor(slot);

        while (blocked(cell) && slot < 400) {
          slot = slot + 1;
          cell = cellFor(slot);
        }

        items[i].x = cell.x;
        items[i].y = cell.y;

        slot = slot + 1;
      }

      persist();
      paint();
    }

    function rescue() {
      var items = itemList();
      var wide = lanes();
      var tall = columns();
      var moved = false;

      for (var i = 0; i < items.length; i++) {
        if (items[i].x < wide && items[i].y < tall) {
          continue;
        }

        var cell = freeCell();

        items[i].x = cell.x;
        items[i].y = cell.y;

        moved = true;
      }

      if (moved) {
        persist();
        paint();
      }

      return moved;
    }

    function tidy() {
      if (typeof window.widgets != "undefined" && typeof window.widgets.tidy == "function") {
        window.widgets.tidy();
      }

      tidyIcons();
    }

    function reset() {
      seed();

      selectedNode = null;

      persist();
      paint();
    }

    function paint() {
      var items = itemList();

      window.ui.clear(layer);

      for (var i = 0; i < items.length; i++) {
        layer.appendChild(makeDesktopTile(items[i]));
      }
    }

    function onLayerDown(event) {
      if (event.target != layer) {
        return;
      }

      hideMenu();
      select(null);
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
    }

    function onDrop(event) {
      if (!hasFiles(event)) {
        return;
      }

      event.preventDefault();

      var dropped = event.dataTransfer.files;

      if (dropped == null || dropped.length == 0) {
        return;
      }

      window.filesystem.receive(desktopFolder(), dropped).then(function (landed) {
        if (landed.length == 0) {
          return;
        }

        tidy();
      });
    }

    layer.addEventListener("mousedown", onLayerDown);
    layer.addEventListener("contextmenu", onLayerMenu);
    layer.addEventListener("dragover", onDragOver);
    layer.addEventListener("drop", onDrop);

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

    if (window.filesystem.fresh()) {
      seed();

      window.filesystem.settle();

      persist();
    }

    window.filesystem.watch(paint);

    if (typeof window.layout != "undefined") {
      window.layout.watch(paint);
    }

    window.addEventListener("resize", rescue);

    paint();

    function grid() {
      var area = field();

      return {
        cellWidth: CELL_WIDTH,
        cellHeight: CELL_HEIGHT,
        left: area.left,
        top: area.top,
        right: LEFT_MARGIN,
        bottom: window.innerHeight - area.top - area.height,
        width: area.width,
        height: area.height
      };
    }

    return {
      element: layer,
      grid: grid,
      boxes: boxes,
      list: function () {
        return itemList().slice(0);
      },
      addApp: addApp,
      addFolder: addFolder,
      setPicture: setPicture,
      tidy: tidy,
      tidyIcons: tidyIcons,
      rescue: rescue,
      reset: reset,
      paint: paint
    };
  }

  var desktop = makeDesktop();

  window.makeDesktop = makeDesktop;
  window.desktop = desktop;
})();
