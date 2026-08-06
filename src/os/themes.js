(function () {
  var CONFIG_FILE = "themes.json";
  var LEGACY_KEY = "noo-wari.themes";
  var SLOT = "custom";
  var KINDS = ["named", "fill", "gradient", "image"];

  var DEFAULT_FILL = "#15171b";
  var DEFAULT_TOP = "#1b1e24";
  var DEFAULT_BOTTOM = "#12141a";
  var DEFAULT_ANGLE = 180;
  var DEFAULT_FIT = "cover";

  var PRESET_PAPERS = {
    "noo-wari": "floral",
    nord: "aurora",
    ember: "forge",
    orchid: "bloom",
    mono: "drift",
    abyss: "trench",
    sumi: "ink",
    meridian: "orbit",
    fern: "canopy"
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

  function copyTheme(aTheme) {
    var out = new Object();

    out.name = typeof aTheme.name == "string" ? aTheme.name : "untitled";
    out.palette = copyPalette(aTheme.palette);
    out.wallpaper = copyPaper(aTheme.wallpaper);

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

      window.filesystem.writeConfig(CONFIG_FILE, JSON.stringify(payload));

      return true;
    }

    function load() {
      var raw = window.filesystem.adoptConfig(CONFIG_FILE, LEGACY_KEY);

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

    function paint(aTheme) {
      if (aTheme == null) {
        return false;
      }

      window.theme.set(aTheme.palette);

      dress(aTheme.wallpaper);

      return true;
    }

    function capture(name) {
      var out = new Object();

      out.name = name;
      out.palette = copyPalette(window.theme.get());
      out.wallpaper = paper();

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

    function land(name) {
      var found = get(name);

      if (found != null) {
        paint(found);

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

      activeName = name;

      store();
      notify();

      return true;
    }

    function apply(name) {
      return land(name);
    }

    function current() {
      return activeName;
    }

    function restore() {
      if (activeName == "") {
        return false;
      }

      if (land(activeName)) {
        return true;
      }

      activeName = "";

      store();

      return false;
    }

    function kinds() {
      return KINDS.slice(0);
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
