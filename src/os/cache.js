(function () {
  var FLAG_KEY = "noo-wari.assets";
  var WORKER_PATH = "sw.js";

  function makeAssetCache() {
    var isOn = true;

    function backing() {
      try {
        return window.localStorage;
      } catch (error) {
        return null;
      }
    }

    function readFlag() {
      var store = backing();

      if (store == null) {
        return;
      }

      try {
        if (store.getItem(FLAG_KEY) == "off") {
          isOn = false;
        }
      } catch (error) {
        isOn = true;
      }
    }

    function writeFlag(value) {
      var store = backing();

      if (store == null) {
        return false;
      }

      try {
        store.setItem(FLAG_KEY, value);

        return true;
      } catch (error) {
        return false;
      }
    }

    function isSupported() {
      if (typeof navigator.serviceWorker == "undefined") {
        return false;
      }

      return navigator.serviceWorker != null;
    }

    function isEnabled() {
      return isOn;
    }

    function detach() {
      navigator.serviceWorker.getRegistrations().then(function (found) {
        for (var i = 0; i < found.length; i++) {
          found[i].unregister();
        }
      });
    }

    function attach() {
      navigator.serviceWorker.register(WORKER_PATH).catch(function () {
        return false;
      });
    }

    function apply() {
      if (!isSupported()) {
        return false;
      }

      if (isOn) {
        detach();
      } else {
        attach();
      }

      return true;
    }

    function enable() {
      isOn = true;

      writeFlag("on");

      return apply();
    }

    function disable() {
      isOn = false;

      writeFlag("off");

      return apply();
    }

    function toggle() {
      if (isOn) {
        disable();
      } else {
        enable();
      }

      return isOn;
    }

    readFlag();
    apply();

    return {
      isEnabled: isEnabled,
      isSupported: isSupported,
      enable: enable,
      disable: disable,
      toggle: toggle
    };
  }

  var assets = makeAssetCache();

  window.makeAssetCache = makeAssetCache;
  window.assets = assets;
})();
