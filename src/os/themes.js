(function () {
  var STORAGE_KEY = "noo-wari.themes";
  var SLOT = "custom";
  var KINDS = ["named", "fill", "gradient", "image"];

  var DEFAULT_FILL = "#15171b";
  var DEFAULT_TOP = "#1b1e24";
  var DEFAULT_BOTTOM = "#12141a";
  var DEFAULT_ANGLE = 180;
  var DEFAULT_FIT = "cover";

  var PRESET_APPS = {
    "noo-wari": "terminal",
    nord: "files",
    ember: "shadertoy",
    orchid: "paint",
    mono: "notes",
    abyss: "player"
  };

  var PRESET_DESKS = {
    "noo-wari": [
      { kind: "featured", anchor: "bottomRight", x: 0, y: 0 },
      { kind: "snap", anchor: "bottomRight", x: 176, y: 0 }
    ],
    nord: [
      { kind: "featured", anchor: "bottomRight", x: 0, y: 0 },
      { kind: "snap", anchor: "bottomRight", x: 176, y: 0 }
    ],
    ember: [
      { kind: "featured", anchor: "topRight", x: 0, y: 0 },
      { kind: "snap", anchor: "topRight", x: 176, y: 0 }
    ],
    orchid: [
      { kind: "featured", anchor: "bottomLeft", x: 0, y: 0 },
      { kind: "snap", anchor: "bottomLeft", x: 176, y: 0 }
    ],
    mono: [
      { kind: "featured", anchor: "bottomRight", x: 0, y: 0 },
      { kind: "snap", anchor: "bottomRight", x: 176, y: 0 }
    ],
    abyss: [
      { kind: "featured", anchor: "topRight", x: 0, y: 0 },
      { kind: "snap", anchor: "topRight", x: 176, y: 0 }
    ]
  };

  var PRESET_LAYOUTS = {
    "noo-wari": { bar: "top", corner: "topLeft", flow: "down" },
    nord: { bar: "top", corner: "topLeft", flow: "across" },
    ember: { bar: "bottom", corner: "bottomLeft", flow: "down" },
    orchid: { bar: "top", corner: "topRight", flow: "down" },
    mono: { bar: "bottom", corner: "topLeft", flow: "across" },
    abyss: { bar: "top", corner: "bottomLeft", flow: "across" }
  };

  var PRESET_PAPERS = {
    "noo-wari": "floral",
    nord: "aurora",
    ember: "forge",
    orchid: "bloom",
    mono: "drift",
    abyss: "trench"
  };

  function copyPalette(source) {
    var roles = window.theme.roles();
    var palette = new Object();

    if (source == null) {
      return palette;
    }

    for (var i = 0; i < roles.length; i++) {
      if (typeof source[roles[i]] == "string") {
        palette[roles[i]] = source[roles[i]];
      }
    }

    return palette;
  }

  function copyPaper(paper) {
    var out = new Object();

    if (paper == null || typeof paper.kind != "string") {
      paper = new Object();
    }

    out.kind = KINDS.indexOf(paper.kind) == -1 ? "named" : paper.kind;
    out.name = typeof paper.name == "string" ? paper.name : "";
    out.color = typeof paper.color == "string" ? paper.color : DEFAULT_FILL;
    out.top = typeof paper.top == "string" ? paper.top : DEFAULT_TOP;
    out.bottom = typeof paper.bottom == "string" ? paper.bottom : DEFAULT_BOTTOM;
    out.angle = typeof paper.angle == "number" ? paper.angle : DEFAULT_ANGLE;
    out.src = typeof paper.src == "string" ? paper.src : "";
    out.fit = typeof paper.fit == "string" ? paper.fit : DEFAULT_FIT;

    return out;
  }

  function copyLayout(input) {
    return window.layout.clean(input);
  }

  function copyDesk(input) {
    var out = new Object();

    out.icons = [];
    out.widgets = [];

    if (input == null) {
      return out;
    }

    if (input.icons instanceof Array) {
      for (var i = 0; i < input.icons.length; i++) {
        var spot = input.icons[i];

        if (spot != null && typeof spot.name == "string") {
          out.icons.push({
            name: spot.name,
            x: typeof spot.x == "number" ? spot.x : 0,
            y: typeof spot.y == "number" ? spot.y : 0
          });
        }
      }
    }

    if (input.widgets instanceof Array) {
      for (var j = 0; j < input.widgets.length; j++) {
        var held = input.widgets[j];

        if (held != null && typeof held.kind == "string") {
          out.widgets.push({
            id: typeof held.id == "string" ? held.id : "",
            kind: held.kind,
            anchor: typeof held.anchor == "string" ? held.anchor : "topRight",
            x: typeof held.x == "number" ? held.x : 0,
            y: typeof held.y == "number" ? held.y : 0
          });
        }
      }
    }

    return out;
  }

  function copyTheme(aTheme) {
    var out = new Object();

    out.name = typeof aTheme.name == "string" ? aTheme.name : "untitled";
    out.palette = copyPalette(aTheme.palette);
    out.wallpaper = copyPaper(aTheme.wallpaper);
    out.layout = copyLayout(aTheme.layout);
    out.app = typeof aTheme.app == "string" ? aTheme.app : "";
    out.desk = copyDesk(aTheme.desk);

    return out;
  }

  function makeThemes() {
    var items = [];
    var activeName = "";
    var lastPaper = null;
    var watchers = [];

    function notify() {
      for (var i = 0; i < watchers.length; i++) {
        watchers[i](activeName);
      }
    }

    function store() {
      var payload = new Object();

      payload.items = items;
      payload.active = activeName;

      window.storage.set(STORAGE_KEY, JSON.stringify(payload));

      return true;
    }

    function load() {
      var raw = window.storage.get(STORAGE_KEY);

      if (raw == null) {
        return false;
      }

      try {
        var parsed = JSON.parse(raw);

        if (parsed == null) {
          return false;
        }

        if (parsed.items instanceof Array) {
          for (var i = 0; i < parsed.items.length; i++) {
            if (parsed.items[i] != null) {
              items.push(copyTheme(parsed.items[i]));
            }
          }
        }

        if (typeof parsed.active == "string") {
          activeName = parsed.active;
        }
      } catch (error) {
        items = [];
        activeName = "";

        return false;
      }

      return true;
    }

    function indexOfName(name) {
      for (var i = 0; i < items.length; i++) {
        if (items[i].name == name) {
          return i;
        }
      }

      return -1;
    }

    function dress(paper) {
      if (paper == null) {
        return false;
      }

      if (paper.kind == "named") {
        lastPaper = null;

        return window.backgrounds.select(paper.name);
      }

      var made = null;

      if (paper.kind == "fill") {
        made = window.backgrounds.fill(paper.color);
      }

      if (paper.kind == "gradient") {
        made = window.backgrounds.gradient(paper.angle, paper.top, paper.bottom);
      }

      if (paper.kind == "image") {
        if (paper.src == "") {
          return false;
        }

        made = window.backgrounds.image(paper.src, paper.fit, paper.color);
      }

      if (made == null) {
        return false;
      }

      lastPaper = copyPaper(paper);

      window.backgrounds.add(SLOT, made);

      return window.backgrounds.select(SLOT);
    }

    function paper() {
      if (lastPaper != null && window.backgrounds.current() == SLOT) {
        return copyPaper(lastPaper);
      }

      return copyPaper({ kind: "named", name: window.backgrounds.current() });
    }

    function settle(shape) {
      window.layout.set(shape);

      return true;
    }

    function snapshot() {
      var out = new Object();

      out.icons = [];
      out.widgets = [];

      if (typeof window.filesystem != "undefined") {
        var host = window.filesystem.desktop();

        for (var i = 0; i < host.children.length; i++) {
          out.icons.push({
            name: host.children[i].name,
            x: host.children[i].x,
            y: host.children[i].y
          });
        }
      }

      if (typeof window.widgets != "undefined") {
        var held = window.widgets.list();

        for (var j = 0; j < held.length; j++) {
          out.widgets.push({
            id: held[j].id,
            kind: held[j].kind,
            anchor: held[j].anchor,
            x: held[j].x,
            y: held[j].y
          });
        }
      }

      return out;
    }

    function dressDesk(desk) {
      if (desk == null) {
        return false;
      }

      if (desk.icons.length > 0 && typeof window.filesystem != "undefined") {
        var host = window.filesystem.desktop();
        var moved = false;

        for (var i = 0; i < desk.icons.length; i++) {
          for (var j = 0; j < host.children.length; j++) {
            if (host.children[j].name == desk.icons[i].name) {
              host.children[j].x = desk.icons[i].x;
              host.children[j].y = desk.icons[i].y;

              moved = true;
            }
          }
        }

        if (moved) {
          window.filesystem.save();
        }
      }

      if (desk.widgets.length > 0 && typeof window.widgets != "undefined") {
        window.widgets.arrange(desk.widgets);
      }

      return true;
    }

    function feature(name) {
      if (typeof name != "string" || name == "") {
        return false;
      }

      if (typeof window.launcher == "undefined" || typeof window.desktops == "undefined") {
        return false;
      }

      var apps = window.launcher.list();
      var found = null;

      for (var i = 0; i < apps.length; i++) {
        if (apps[i].name == name) {
          found = apps[i];
        }
      }

      if (found == null) {
        return false;
      }

      found.run();

      var active = window.desktops.focused();

      if (active != null && typeof active.restore == "function") {
        active.restore();
      }

      var open = window.desktops.windows(window.desktops.current());

      for (var j = 0; j < open.length; j++) {
        if (open[j] != active && typeof open[j].tuck == "function") {
          open[j].tuck();
        }
      }

      return true;
    }

    function paint(aTheme) {
      if (aTheme == null) {
        return false;
      }

      window.theme.set(aTheme.palette);

      dress(aTheme.wallpaper);
      settle(copyLayout(aTheme.layout));

      return true;
    }

    function capture(name) {
      var out = new Object();

      out.name = name;
      out.palette = copyPalette(window.theme.get());
      out.wallpaper = paper();
      out.layout = copyLayout(window.layout.get());
      out.app = "";
      out.desk = copyDesk(null);

      return out;
    }

    function get(name) {
      var index = indexOfName(name);

      if (index == -1) {
        return null;
      }

      return copyTheme(items[index]);
    }

    function saved() {
      var found = [];

      for (var i = 0; i < items.length; i++) {
        found.push(copyTheme(items[i]));
      }

      return found;
    }

    function list() {
      var found = [];

      for (var i = 0; i < items.length; i++) {
        found.push(items[i].name);
      }

      return found;
    }

    function presets() {
      return window.theme.list();
    }

    function save(aTheme) {
      if (aTheme == null || typeof aTheme.name != "string" || aTheme.name == "") {
        return false;
      }

      var kept = copyTheme(aTheme);
      var index = indexOfName(kept.name);

      if (index == -1) {
        items.push(kept);
      } else {
        items[index] = kept;
      }

      activeName = kept.name;

      store();
      notify();

      return true;
    }

    function remove(name) {
      var index = indexOfName(name);

      if (index == -1) {
        return false;
      }

      items.splice(index, 1);

      if (activeName == name) {
        activeName = "";
      }

      store();
      notify();

      return true;
    }

    function rename(name, wanted) {
      var index = indexOfName(name);

      if (index == -1 || wanted == "" || indexOfName(wanted) != -1) {
        return false;
      }

      items[index].name = wanted;

      if (activeName == name) {
        activeName = wanted;
      }

      store();
      notify();

      return true;
    }

    function land(name, isSwitch) {
      var found = get(name);

      if (found != null) {
        paint(found);

        if (isSwitch) {
          dressDesk(found.desk);
          feature(found.app);
        }

        activeName = name;

        store();
        notify();

        return true;
      }

      if (!window.theme.select(name)) {
        return false;
      }

      var skin = PRESET_PAPERS[name];

      if (typeof skin == "string") {
        dress({ kind: "named", name: skin });
      }

      settle(copyLayout(PRESET_LAYOUTS[name]));

      if (isSwitch) {
        dressDesk(copyDesk({ icons: [], widgets: PRESET_DESKS[name] }));
        feature(PRESET_APPS[name]);
      }

      activeName = name;

      store();
      notify();

      return true;
    }

    function apply(name) {
      return land(name, true);
    }

    function current() {
      return activeName;
    }

    function restore() {
      if (activeName == "") {
        return false;
      }

      return land(activeName, false);
    }

    function kinds() {
      return KINDS.slice(0);
    }

    function appFor(name) {
      if (typeof PRESET_APPS[name] != "string") {
        return "";
      }

      return PRESET_APPS[name];
    }

    function layoutFor(name) {
      return copyLayout(PRESET_LAYOUTS[name]);
    }

    function paperFor(name) {
      if (typeof PRESET_PAPERS[name] != "string") {
        return "";
      }

      return PRESET_PAPERS[name];
    }

    function wallpapers() {
      return window.backgrounds.list();
    }

    function fits() {
      return window.backgrounds.fits();
    }

    function watch(handler) {
      watchers.push(handler);

      return handler;
    }

    function unwatch(handler) {
      for (var i = 0; i < watchers.length; i++) {
        if (watchers[i] == handler) {
          watchers.splice(i, 1);

          return true;
        }
      }

      return false;
    }

    load();

    return {
      paint: paint,
      apply: apply,
      capture: capture,
      get: get,
      save: save,
      remove: remove,
      rename: rename,
      saved: saved,
      list: list,
      presets: presets,
      current: current,
      restore: restore,
      paper: paper,
      dress: dress,
      blank: copyPaper,
      kinds: kinds,
      paperFor: paperFor,
      snapshot: snapshot,
      layoutFor: layoutFor,
      appFor: appFor,
      wallpapers: wallpapers,
      fits: fits,
      watch: watch,
      unwatch: unwatch
    };
  }

  var themes = makeThemes();

  themes.restore();

  window.makeThemes = makeThemes;
  window.themes = themes;
})();
