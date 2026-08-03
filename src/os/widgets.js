(function () {
  var STORAGE_KEY = "noo-wari.widgets";
  var SEEDED_KEY = "noo-wari.widgets.seeded";
  var LAYER_Z_INDEX = 0;
  var MENU_Z_INDEX = 1300;
  var EDGE_MARGIN = 14;
  var TOP_MARGIN = 40;
  var CELL_WIDTH = 88;
  var CELL_HEIGHT = 94;
  var DRAG_THRESHOLD = 5;
  var GAP = 6;

  var ANCHORS = ["topLeft", "topRight", "bottomLeft", "bottomRight"];

  function grid() {
    if (typeof window.desktop == "undefined" || typeof window.desktop.grid != "function") {
      return {
        cellWidth: CELL_WIDTH,
        cellHeight: CELL_HEIGHT,
        left: EDGE_MARGIN,
        top: TOP_MARGIN
      };
    }

    return window.desktop.grid();
  }

  function snap(amount, step) {
    var cells = Math.round(amount / step);

    if (cells < 0) {
      cells = 0;
    }

    return cells * step;
  }

  function overlaps(a, b) {
    return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
  }

  function iconBoxes() {
    if (typeof window.desktop == "undefined" || typeof window.desktop.boxes != "function") {
      return [];
    }

    return window.desktop.boxes();
  }

  var FACING = {
    topLeft: "bottomRight",
    topRight: "bottomLeft",
    bottomLeft: "topRight",
    bottomRight: "topLeft"
  };

  function facingCorner() {
    if (typeof window.layout == "undefined") {
      return FACING.topLeft;
    }

    return FACING[window.layout.corner()];
  }

  function facingFlow() {
    if (typeof window.layout == "undefined") {
      return "down";
    }

    return window.layout.flow();
  }

  function isAnchor(name) {
    for (var i = 0; i < ANCHORS.length; i++) {
      if (ANCHORS[i] == name) {
        return true;
      }
    }

    return false;
  }

  function makeLayer() {
    var aLayer = document.createElement("div");
    var layerStyle = aLayer.style;

    layerStyle.position = "fixed";
    layerStyle.left = "0px";
    layerStyle.top = "0px";
    layerStyle.right = "0px";
    layerStyle.bottom = "0px";
    layerStyle.pointerEvents = "none";
    layerStyle.zIndex = LAYER_Z_INDEX;

    return aLayer;
  }

  function makeMenu() {
    var aMenu = document.createElement("div");
    var menuStyle = aMenu.style;

    menuStyle.position = "fixed";
    menuStyle.display = "none";
    menuStyle.minWidth = "140px";
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

    entryStyle.padding = "5px 14px";
    entryStyle.cursor = "pointer";
    entryStyle.whiteSpace = "nowrap";

    function onEnter() {
      entryStyle.backgroundColor = "var(--nw-hover)";
    }

    function onLeave() {
      entryStyle.backgroundColor = "";
    }

    anEntry.addEventListener("mouseenter", onEnter);
    anEntry.addEventListener("mouseleave", onLeave);
    anEntry.addEventListener("click", onPick);

    return anEntry;
  }

  function makeFrame() {
    var aFrame = document.createElement("div");
    var frameStyle = aFrame.style;

    frameStyle.position = "absolute";
    frameStyle.boxSizing = "border-box";
    frameStyle.pointerEvents = "auto";
    frameStyle.backgroundColor = "var(--nw-bar)";
    frameStyle.borderStyle = "solid";
    frameStyle.borderWidth = "1px";
    frameStyle.borderColor = "var(--nw-tertiary)";
    frameStyle.borderRadius = "8px";
    frameStyle.backdropFilter = "blur(8px)";
    frameStyle.webkitBackdropFilter = "blur(8px)";
    frameStyle.fontFamily = window.ui.FONT_FAMILY;
    frameStyle.color = "var(--nw-text)";
    frameStyle.overflow = "hidden";
    frameStyle.userSelect = "none";
    frameStyle.cursor = "move";

    return aFrame;
  }

  function makeHeader(title) {
    var aHeader = document.createElement("div");
    var headerStyle = aHeader.style;

    aHeader.textContent = title;

    headerStyle.padding = "7px 10px";
    headerStyle.fontSize = "10px";
    headerStyle.letterSpacing = "1px";
    headerStyle.textTransform = "uppercase";
    headerStyle.color = "var(--nw-muted)";
    headerStyle.borderBottomStyle = "solid";
    headerStyle.borderBottomWidth = "1px";
    headerStyle.borderBottomColor = "var(--nw-tertiary)";
    headerStyle.cursor = "grab";

    return aHeader;
  }

  function makeBody() {
    var aBody = document.createElement("div");

    aBody.style.padding = "8px";

    return aBody;
  }

  function makeWidgets() {
    var layer = makeLayer();
    var aMenu = makeMenu();

    var kinds = new Object();
    var order = [];
    var items = [];
    var counter = 0;

    var dragItem = null;
    var pendingItem = null;
    var pendingX = 0;
    var pendingY = 0;
    var grabX = 0;
    var grabY = 0;

    function store() {
      var payload = [];

      for (var i = 0; i < items.length; i++) {
        payload.push({
          id: items[i].id,
          kind: items[i].kind,
          anchor: items[i].anchor,
          x: items[i].x,
          y: items[i].y,
          settings: items[i].settings
        });
      }

      window.storage.set(STORAGE_KEY, JSON.stringify(payload));

      return true;
    }

    function define(name, spec) {
      if (typeof name != "string" || spec == null) {
        return false;
      }

      var aKind = new Object();

      aKind.name = name;
      aKind.title = typeof spec.title == "string" ? spec.title : name;
      aKind.columns = typeof spec.columns == "number" ? Math.max(1, spec.columns) : 2;
      aKind.anchor = isAnchor(spec.anchor) ? spec.anchor : "topRight";
      aKind.x = typeof spec.x == "number" ? spec.x : 0;
      aKind.y = typeof spec.y == "number" ? spec.y : 0;
      aKind.build = spec.build;
      aKind.settings = spec.settings;
      aKind.menu = spec.menu;
      aKind.seed = spec.seed == true;

      if (typeof kinds[name] == "undefined") {
        order.push(name);
      }

      kinds[name] = aKind;

      return true;
    }

    function kindNamed(name) {
      if (typeof kinds[name] == "undefined") {
        return null;
      }

      return kinds[name];
    }

    function place(anItem) {
      var frameStyle = anItem.frame.style;
      var cells = grid();

      frameStyle.left = "";
      frameStyle.right = "";
      frameStyle.top = "";
      frameStyle.bottom = "";

      var side = typeof cells.right == "number" ? cells.right : cells.left;
      var foot = typeof cells.bottom == "number" ? cells.bottom : cells.left;

      if (anItem.anchor == "topLeft" || anItem.anchor == "bottomLeft") {
        frameStyle.left = cells.left + anItem.x + GAP + "px";
      } else {
        frameStyle.right = side + anItem.x + GAP + "px";
      }

      if (anItem.anchor == "topLeft" || anItem.anchor == "topRight") {
        frameStyle.top = cells.top + anItem.y + GAP + "px";
      } else {
        frameStyle.bottom = foot + anItem.y + GAP + "px";
      }
    }

    function hideMenu() {
      aMenu.style.display = "none";
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

    function indexOfId(id) {
      for (var i = 0; i < items.length; i++) {
        if (items[i].id == id) {
          return i;
        }
      }

      return -1;
    }

    function drop(anItem) {
      if (typeof anItem.teardown == "function") {
        anItem.teardown();
      }

      anItem.teardown = null;

      anItem.frame.remove();
    }

    function remove(id) {
      var index = indexOfId(id);

      if (index == -1) {
        return false;
      }

      drop(items[index]);

      items.splice(index, 1);

      store();

      return true;
    }

    function measure(anItem) {
      var cells = grid();
      var frameStyle = anItem.frame.style;

      frameStyle.width = anItem.spec.columns * cells.cellWidth - GAP * 2 + "px";
      frameStyle.height = "";

      var natural = anItem.frame.getBoundingClientRect().height + GAP * 2;
      var rows = Math.max(1, Math.ceil(natural / cells.cellHeight));

      frameStyle.height = rows * cells.cellHeight - GAP * 2 + "px";

      anItem.rows = rows;

      return rows;
    }

    function refresh(anItem) {
      if (typeof anItem.teardown == "function") {
        anItem.teardown();
      }

      window.ui.clear(anItem.body);

      anItem.teardown = anItem.spec.build(anItem.body, anItem);

      measure(anItem);
    }

    function menuFor(anItem, x, y) {
      var entries = [];

      if (typeof anItem.spec.menu == "function") {
        var extra = anItem.spec.menu(anItem);

        for (var i = 0; i < extra.length; i++) {
          entries.push({
            label: extra[i].label,
            run: (function (entry) {
              return function () {
                hideMenu();
                entry.run(anItem);

                store();
                refresh(anItem);
              };
            })(extra[i])
          });
        }
      }

      entries.push({
        label: "refresh",
        run: function () {
          hideMenu();
          refresh(anItem);
        }
      });

      entries.push({
        label: "remove widget",
        run: function () {
          hideMenu();
          remove(anItem.id);
        }
      });

      showMenu(entries, x, y);
    }

    function arrange(list) {
      if (!(list instanceof Array)) {
        return false;
      }

      var used = [];

      for (var i = 0; i < list.length; i++) {
        var spot = list[i];
        var anItem = null;
        var index = indexOfId(spot.id);

        if (index != -1) {
          anItem = items[index];
        } else {
          for (var j = 0; j < items.length; j++) {
            if (items[j].kind == spot.kind && used.indexOf(items[j].id) == -1) {
              anItem = items[j];

              break;
            }
          }
        }

        if (anItem == null || anItem.frame == null) {
          continue;
        }

        used.push(anItem.id);

        if (isAnchor(spot.anchor)) {
          anItem.anchor = spot.anchor;
        }

        if (typeof spot.x == "number") {
          anItem.x = spot.x;
        }

        if (typeof spot.y == "number") {
          anItem.y = spot.y;
        }

        place(anItem);
      }

      store();

      return true;
    }

    function tidy() {
      var cells = grid();
      var wall = facingCorner();
      var flow = facingFlow();
      var room = {
        width: (typeof cells.width == "number" ? cells.width : window.innerWidth - cells.left * 2) / 2,
        height: (typeof cells.height == "number" ? cells.height : window.innerHeight - cells.top) / 2
      };

      var x = 0;
      var y = 0;
      var lane = 0;

      for (var i = 0; i < items.length; i++) {
        var anItem = items[i];

        if (anItem.frame == null) {
          continue;
        }

        var wide = anItem.spec.columns * cells.cellWidth;
        var tall = (typeof anItem.rows == "number" ? anItem.rows : 1) * cells.cellHeight;

        if (flow == "down") {
          if (y > 0 && y + tall > room.height) {
            y = 0;
            x = x + lane;
            lane = 0;
          }
        } else {
          if (x > 0 && x + wide > room.width) {
            x = 0;
            y = y + lane;
            lane = 0;
          }
        }

        anItem.anchor = wall;
        anItem.x = x;
        anItem.y = y;

        if (flow == "down") {
          y = y + tall;

          if (wide > lane) {
            lane = wide;
          }
        } else {
          x = x + wide;

          if (tall > lane) {
            lane = tall;
          }
        }

        place(anItem);
      }

      store();

      return true;
    }

    function nearestAnchor(x, y) {
      var toLeft = x < window.innerWidth / 2;
      var toTop = y < window.innerHeight / 2;

      if (toTop) {
        return toLeft ? "topLeft" : "topRight";
      }

      return toLeft ? "bottomLeft" : "bottomRight";
    }

    function boxes(except) {
      var found = [];

      for (var i = 0; i < items.length; i++) {
        if (items[i] == except || items[i].frame == null) {
          continue;
        }

        var rect = items[i].frame.getBoundingClientRect();

        if (rect.width == 0 && rect.height == 0) {
          continue;
        }

        found.push({
          left: rect.left,
          top: rect.top,
          right: rect.right,
          bottom: rect.bottom
        });
      }

      return found;
    }

    function boxFor(anItem, anchor, x, y) {
      var cells = grid();
      var size = anItem.frame.getBoundingClientRect();
      var wide = size.width;
      var tall = size.height;

      var side = typeof cells.right == "number" ? cells.right : cells.left;
      var foot = typeof cells.bottom == "number" ? cells.bottom : cells.left;

      var left = anchor == "topLeft" || anchor == "bottomLeft"
        ? cells.left + x + GAP
        : window.innerWidth - side - x - GAP - wide;

      var top = anchor == "topLeft" || anchor == "topRight"
        ? cells.top + y + GAP
        : window.innerHeight - foot - y - GAP - tall;

      return { left: left, top: top, right: left + wide, bottom: top + tall };
    }

    function fits(anItem, anchor, x, y) {
      var rect = boxFor(anItem, anchor, x, y);
      var taken = boxes(anItem).concat(iconBoxes());

      for (var i = 0; i < taken.length; i++) {
        if (overlaps(rect, taken[i])) {
          return false;
        }
      }

      return true;
    }

    function clearOf(anItem, anchor, x, y) {
      var cells = grid();
      var tries = 0;

      while (!fits(anItem, anchor, x, y) && tries < 60) {
        y = y + cells.cellHeight;

        if (y + cells.cellHeight > window.innerHeight) {
          y = 0;
          x = x + cells.cellWidth;
        }

        tries = tries + 1;
      }

      return { x: x, y: y };
    }

    function settle(anItem, event) {
      var box = anItem.frame.getBoundingClientRect();
      var anchor = nearestAnchor(box.left + box.width / 2, box.top + box.height / 2);
      var cells = grid();

      anItem.anchor = anchor;

      if (anchor == "topLeft" || anchor == "bottomLeft") {
        anItem.x = snap(box.left - cells.left, cells.cellWidth);
      } else {
        anItem.x = snap(window.innerWidth - box.right - cells.left, cells.cellWidth);
      }

      if (anchor == "topLeft" || anchor == "topRight") {
        anItem.y = snap(box.top - cells.top, cells.cellHeight);
      } else {
        anItem.y = snap(window.innerHeight - box.bottom - cells.left, cells.cellHeight);
      }

      var free = clearOf(anItem, anchor, anItem.x, anItem.y);

      anItem.x = free.x;
      anItem.y = free.y;

      place(anItem);
      store();
    }

    function moveDrag(event) {
      if (dragItem == null) {
        if (pendingItem == null) {
          return;
        }

        if (
          Math.abs(event.clientX - pendingX) < DRAG_THRESHOLD &&
          Math.abs(event.clientY - pendingY) < DRAG_THRESHOLD
        ) {
          return;
        }

        dragItem = pendingItem;
      }

      var frameStyle = dragItem.frame.style;

      frameStyle.right = "";
      frameStyle.bottom = "";
      frameStyle.left = event.clientX - grabX + "px";
      frameStyle.top = event.clientY - grabY + "px";
    }

    function swallowClick(anItem) {
      function onClick(event) {
        event.stopPropagation();
        event.preventDefault();
      }

      anItem.frame.addEventListener("click", onClick, true);

      window.setTimeout(function () {
        anItem.frame.removeEventListener("click", onClick, true);
      }, 0);
    }

    function endDrag(event) {
      document.removeEventListener("mousemove", moveDrag);
      document.removeEventListener("mouseup", endDrag);

      pendingItem = null;

      if (dragItem == null) {
        return;
      }

      var anItem = dragItem;

      dragItem = null;

      settle(anItem, event);
      swallowClick(anItem);
    }

    function armDrag(anItem, event) {
      var box = anItem.frame.getBoundingClientRect();

      pendingItem = anItem;
      pendingX = event.clientX;
      pendingY = event.clientY;
      grabX = event.clientX - box.left;
      grabY = event.clientY - box.top;

      document.addEventListener("mousemove", moveDrag);
      document.addEventListener("mouseup", endDrag);
    }

    function dress(anItem) {
      var aFrame = makeFrame();
      var aHeader = makeHeader(anItem.spec.title);
      var aBody = makeBody();

      aFrame.appendChild(aHeader);
      aFrame.appendChild(aBody);

      anItem.frame = aFrame;
      anItem.body = aBody;

      function isInteractive(anElement) {
        var name = anElement.nodeName;

        return (
          name == "INPUT" ||
          name == "SELECT" ||
          name == "TEXTAREA" ||
          name == "BUTTON" ||
          name == "OPTION" ||
          name == "A"
        );
      }

      function onDown(event) {
        if (event.button != 0 || isInteractive(event.target)) {
          return;
        }

        event.preventDefault();

        hideMenu();
        armDrag(anItem, event);
      }

      function onMenu(event) {
        event.preventDefault();
        event.stopPropagation();

        menuFor(anItem, event.clientX, event.clientY);
      }

      aFrame.addEventListener("mousedown", onDown);
      aFrame.addEventListener("contextmenu", onMenu);

      place(anItem);

      layer.appendChild(aFrame);

      anItem.teardown = anItem.spec.build(aBody, anItem);

      measure(anItem);
    }

    function add(kind, options) {
      var spec = kindNamed(kind);

      if (spec == null) {
        return null;
      }

      if (options == null) {
        options = new Object();
      }

      var anItem = new Object();

      counter = counter + 1;

      anItem.id = typeof options.id == "string" ? options.id : kind + "-" + counter;
      anItem.kind = kind;
      anItem.spec = spec;
      anItem.anchor = isAnchor(options.anchor) ? options.anchor : spec.anchor;
      anItem.x = typeof options.x == "number" ? options.x : spec.x;
      anItem.y = typeof options.y == "number" ? options.y : spec.y;
      anItem.settings = options.settings != null ? options.settings : {};
      anItem.frame = null;
      anItem.body = null;
      anItem.teardown = null;

      if (indexOfId(anItem.id) != -1) {
        return null;
      }

      items.push(anItem);

      dress(anItem);

      return anItem;
    }

    function addAt(kind, x, y) {
      var cells = grid();
      var anchor = nearestAnchor(x, y);
      var offsetX = 0;
      var offsetY = 0;

      if (anchor == "topLeft" || anchor == "bottomLeft") {
        offsetX = snap(x - cells.left, cells.cellWidth);
      } else {
        offsetX = snap(window.innerWidth - x - cells.left, cells.cellWidth);
      }

      if (anchor == "topLeft" || anchor == "topRight") {
        offsetY = snap(y - cells.top, cells.cellHeight);
      } else {
        offsetY = snap(window.innerHeight - y - cells.left, cells.cellHeight);
      }

      var made = add(kind, { anchor: anchor, x: offsetX, y: offsetY });

      if (made == null) {
        return null;
      }

      var free = clearOf(made, anchor, offsetX, offsetY);

      made.x = free.x;
      made.y = free.y;

      place(made);
      store();

      return made;
    }

    function titleOf(kind) {
      var spec = kindNamed(kind);

      if (spec == null) {
        return kind;
      }

      return spec.title;
    }

    function has(kind) {
      for (var i = 0; i < items.length; i++) {
        if (items[i].kind == kind) {
          return true;
        }
      }

      return false;
    }

    function list() {
      return items.slice(0);
    }

    function kindList() {
      return order.slice(0);
    }

    function saved() {
      var raw = window.storage.get(STORAGE_KEY);

      if (raw == null) {
        return null;
      }

      try {
        var parsed = JSON.parse(raw);

        if (!(parsed instanceof Array)) {
          return null;
        }

        return parsed;
      } catch (error) {
        return null;
      }
    }

    function restore() {
      var kept = saved();

      if (kept == null) {
        return false;
      }

      for (var i = 0; i < kept.length; i++) {
        add(kept[i].kind, kept[i]);
      }

      return true;
    }

    function refreshAll() {
      for (var i = 0; i < items.length; i++) {
        refresh(items[i]);
      }

      return true;
    }

    function sown() {
      var raw = window.storage.get(SEEDED_KEY);

      if (raw == null) {
        return [];
      }

      try {
        var parsed = JSON.parse(raw);

        if (!(parsed instanceof Array)) {
          return [];
        }

        return parsed;
      } catch (error) {
        return [];
      }
    }

    function wasSown(planted, kind) {
      for (var i = 0; i < planted.length; i++) {
        if (planted[i] == kind) {
          return true;
        }
      }

      return false;
    }

    function boot() {
      restore();

      var planted = sown();
      var added = false;

      for (var i = 0; i < order.length; i++) {
        if (!kinds[order[i]].seed || wasSown(planted, order[i])) {
          continue;
        }

        add(order[i], { id: order[i] });

        planted.push(order[i]);

        added = true;
      }

      if (added) {
        window.storage.set(SEEDED_KEY, JSON.stringify(planted));

        store();
      }

      return true;
    }

    function onGlobalDown(event) {
      if (aMenu.style.display == "none") {
        return;
      }

      if (!aMenu.contains(event.target)) {
        hideMenu();
      }
    }

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

    return {
      define: define,
      add: add,
      addAt: addAt,
      titleOf: titleOf,
      remove: remove,
      has: has,
      list: list,
      boxes: boxes,
      kinds: kindList,
      restore: restore,
      tidy: tidy,
      arrange: arrange,
      saved: saved,
      boot: boot,
      refresh: refreshAll,
      store: store,
      layer: layer
    };
  }

  var widgets = makeWidgets();

  window.setTimeout(widgets.boot, 0);

  window.makeWidgets = makeWidgets;
  window.widgets = widgets;
})();
