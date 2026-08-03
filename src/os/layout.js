(function () {
  var STORAGE_KEY = "noo-wari.layout";
  var BARS = ["top", "bottom"];

  var DEFAULT_BAR = "top";

  function pick(value, allowed, fallback) {
    for (var i = 0; i < allowed.length; i++) {
      if (allowed[i] == value) {
        return value;
      }
    }

    return fallback;
  }

  function clean(input) {
    var out = new Object();

    if (input == null) {
      input = new Object();
    }

    out.bar = pick(input.bar, BARS, DEFAULT_BAR);

    return out;
  }

  function makeLayout() {
    var current = clean(null);
    var watchers = [];

    function store() {
      window.storage.set(STORAGE_KEY, JSON.stringify(current));

      return true;
    }

    function load() {
      var raw = window.storage.get(STORAGE_KEY);

      if (raw == null) {
        return false;
      }

      try {
        current = clean(JSON.parse(raw));
      } catch (error) {
        current = clean(null);

        return false;
      }

      return true;
    }

    function get() {
      return clean(current);
    }

    function notify() {
      for (var i = 0; i < watchers.length; i++) {
        watchers[i](get());
      }
    }

    function bar() {
      return current.bar;
    }

    function set(input) {
      var wanted = clean(input);
      var moved = wanted.bar != current.bar;
      var same = wanted.bar == current.bar;

      current = wanted;

      if (typeof window.topbar != "undefined" && typeof window.topbar.side == "function") {
        window.topbar.side(current.bar);
      }

      if (moved && typeof window.desktops != "undefined") {
        window.desktops.refit();
      }

      store();

      if (same) {
        return true;
      }

      notify();

      return true;
    }

    function extend(input) {
      var merged = get();

      if (input != null) {
        if (typeof input.bar == "string") {
          merged.bar = input.bar;
        }
      }

      return set(merged);
    }

    function bars() {
      return BARS.slice(0);
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

    if (!load() && window.device.isPhone()) {
      current = clean({ bar: "bottom" });
    }

    if (typeof window.topbar != "undefined" && typeof window.topbar.side == "function") {
      window.topbar.side(current.bar);
    }

    return {
      get: get,
      set: set,
      extend: extend,
      clean: clean,
      bar: bar,
      bars: bars,
      watch: watch,
      unwatch: unwatch
    };
  }

  var layout = makeLayout();

  window.makeLayout = makeLayout;
  window.layout = layout;
})();
