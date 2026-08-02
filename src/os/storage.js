(function () {
  var FLAG_KEY = "noo-wari.persist";

  function makeStorage() {
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

    function isEnabled() {
      return isOn;
    }

    function get(key) {
      var store = backing();

      if (store == null) {
        return null;
      }

      try {
        return store.getItem(key);
      } catch (error) {
        return null;
      }
    }

    function set(key, value) {
      if (!isOn) {
        return false;
      }

      var store = backing();

      if (store == null) {
        return false;
      }

      try {
        store.setItem(key, value);

        return true;
      } catch (error) {
        return false;
      }
    }

    function remove(key) {
      var store = backing();

      if (store == null) {
        return false;
      }

      try {
        store.removeItem(key);

        return true;
      } catch (error) {
        return false;
      }
    }

    function keys(prefix) {
      var store = backing();
      var found = [];

      if (store == null) {
        return found;
      }

      try {
        for (var i = 0; i < store.length; i++) {
          var key = store.key(i);

          if (typeof prefix != "string" || key.indexOf(prefix) == 0) {
            found.push(key);
          }
        }
      } catch (error) {
        return [];
      }

      return found;
    }

    function enable() {
      isOn = true;

      writeFlag("on");

      return true;
    }

    function disable() {
      isOn = false;

      writeFlag("off");

      return true;
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

    return {
      isEnabled: isEnabled,
      get: get,
      set: set,
      remove: remove,
      keys: keys,
      enable: enable,
      disable: disable,
      toggle: toggle
    };
  }

  var storage = makeStorage();

  window.makeStorage = makeStorage;
  window.storage = storage;
})();
