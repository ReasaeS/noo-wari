(function () {
  var BARS = ["top", "bottom"];
  var CORNERS = ["topLeft", "topRight", "bottomLeft", "bottomRight"];
  var FLOWS = ["down", "across"];

  var DEFAULT_BAR = "top";
  var DEFAULT_CORNER = "topLeft";
  var DEFAULT_FLOW = "down";

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
    out.corner = pick(input.corner, CORNERS, DEFAULT_CORNER);
    out.flow = pick(input.flow, FLOWS, DEFAULT_FLOW);

    return out;
  }

  function makeLayout() {
    var current = clean(null);
    var watchers = [];

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

    function corner() {
      return current.corner;
    }

    function flow() {
      return current.flow;
    }

    function fromTop() {
      return current.corner == "topLeft" || current.corner == "topRight";
    }

    function fromLeft() {
      return current.corner == "topLeft" || current.corner == "bottomLeft";
    }

    function down() {
      return current.flow == "down";
    }

    function set(input) {
      var wanted = clean(input);
      var moved = wanted.bar != current.bar;
      var same = wanted.bar == current.bar && wanted.corner == current.corner &&
        wanted.flow == current.flow;

      current = wanted;

      if (typeof window.topbar != "undefined" && typeof window.topbar.side == "function") {
        window.topbar.side(current.bar);
      }

      if (moved && typeof window.desktops != "undefined") {
        window.desktops.refit();
      }

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

        if (typeof input.corner == "string") {
          merged.corner = input.corner;
        }

        if (typeof input.flow == "string") {
          merged.flow = input.flow;
        }
      }

      return set(merged);
    }

    function bars() {
      return BARS.slice(0);
    }

    function corners() {
      return CORNERS.slice(0);
    }

    function flows() {
      return FLOWS.slice(0);
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

    return {
      get: get,
      set: set,
      extend: extend,
      clean: clean,
      bar: bar,
      corner: corner,
      flow: flow,
      fromTop: fromTop,
      fromLeft: fromLeft,
      down: down,
      bars: bars,
      corners: corners,
      flows: flows,
      watch: watch,
      unwatch: unwatch
    };
  }

  var layout = makeLayout();

  window.makeLayout = makeLayout;
  window.layout = layout;
})();
