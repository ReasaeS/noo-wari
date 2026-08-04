(function () {
  var SEPARATOR = /[+,]/;

  function decode(text) {
    try {
      return decodeURIComponent(text);
    } catch (error) {
      return text;
    }
  }

  function segmentOf(pathname) {
    var parts = pathname.split("/");
    var found = "";

    for (var i = 0; i < parts.length; i++) {
      if (parts[i] != "") {
        found = parts[i];
      }
    }

    return found;
  }

  function makeRouter() {
    function names(text) {
      var raw = decode(text).split(SEPARATOR);
      var found = [];

      for (var i = 0; i < raw.length; i++) {
        var name = raw[i].trim().toLowerCase();

        if (name != "" && name.indexOf(".") == -1) {
          found.push(name);
        }
      }

      return found;
    }

    function requested() {
      var fromPath = names(segmentOf(window.location.pathname));
      var fromHash = names(window.location.hash.replace("#", ""));

      return fromPath.concat(fromHash);
    }

    function find(name) {
      var apps = window.launcher.list();

      for (var i = 0; i < apps.length; i++) {
        if (apps[i].name.toLowerCase() == name) {
          return apps[i];
        }
      }

      return null;
    }

    function list() {
      var apps = window.launcher.list();
      var found = [];

      for (var i = 0; i < apps.length; i++) {
        found.push(apps[i].name);
      }

      return found;
    }

    function open(name) {
      var anApp = find(name);

      if (anApp == null) {
        return false;
      }

      anApp.run();

      return true;
    }

    function apply() {
      var wanted = requested();
      var opened = 0;

      for (var i = 0; i < wanted.length; i++) {
        if (open(wanted[i])) {
          opened = opened + 1;
        }
      }

      return opened;
    }

    function onPopState() {
      apply();
    }

    window.addEventListener("popstate", onPopState);

    return {
      apply: apply,
      open: open,
      requested: requested,
      list: list
    };
  }

  var router = makeRouter();

  router.apply();

  window.makeRouter = makeRouter;
  window.router = router;
})();
