(function () {
  var PHONE_WIDTH = 560;
  var TABLET_WIDTH = 900;

  function makeDevice() {
    var watchers = [];
    var last = "";

    function isTouch() {
      if ("ontouchstart" in window) {
        return true;
      }

      return navigator.maxTouchPoints > 0;
    }

    function kind() {
      if (window.innerWidth <= PHONE_WIDTH) {
        return "phone";
      }

      if (window.innerWidth <= TABLET_WIDTH) {
        return "tablet";
      }

      return "desktop";
    }

    function isPhone() {
      return kind() == "phone";
    }

    function isSmall() {
      return kind() != "desktop";
    }

    function tall() {
      return window.innerHeight > window.innerWidth;
    }

    function paint() {
      var root = document.documentElement;

      root.setAttribute("data-device", kind());
      root.setAttribute("data-touch", isTouch() ? "yes" : "no");
    }

    function notify() {
      for (var i = 0; i < watchers.length; i++) {
        watchers[i](kind());
      }
    }

    function onResize() {
      var now = kind();

      paint();

      if (now == last) {
        return;
      }

      last = now;

      notify();
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

    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);

    last = kind();

    paint();

    return {
      isTouch: isTouch,
      isPhone: isPhone,
      isSmall: isSmall,
      tall: tall,
      kind: kind,
      watch: watch,
      unwatch: unwatch
    };
  }

  var device = makeDevice();

  window.makeDevice = makeDevice;
  window.device = device;
})();
