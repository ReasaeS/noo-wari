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
    var isApplying = false;

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

      if (fromPath.length > 0) {
        return fromPath;
      }

      return names(window.location.hash.replace("#", ""));
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

    function pathOf(name) {
      return "/" + encodeURIComponent(name);
    }

    function write(name, isReplace) {
      if (typeof window.history == "undefined") {
        return false;
      }

      try {
        if (isReplace) {
          window.history.replaceState(null, "", pathOf(name));
        } else {
          window.history.pushState(null, "", pathOf(name));
        }

        return true;
      } catch (error) {
        window.location.hash = encodeURIComponent(name);

        return false;
      }
    }

    function open(name) {
      var anApp = find(name);

      if (anApp == null) {
        return false;
      }

      isApplying = true;

      anApp.run();

      isApplying = false;

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

    function navigate(name) {
      if (!open(name)) {
        return false;
      }

      write(name, false);

      return true;
    }

    function makeRunWrapper(anApp, originalRun) {
      return function () {
        var result = originalRun();

        if (!isApplying) {
          write(anApp.name, false);
        }

        return result;
      };
    }

    function watchApps() {
      var apps = window.launcher.list();

      for (var i = 0; i < apps.length; i++) {
        apps[i].run = makeRunWrapper(apps[i], apps[i].run);
      }
    }

    function onPopState() {
      apply();
    }

    window.addEventListener("popstate", onPopState);

    return {
      apply: apply,
      navigate: navigate,
      requested: requested,
      list: list,
      watch: watchApps
    };
  }

  var router = makeRouter();

  router.watch();
  router.apply();

  window.makeRouter = makeRouter;
  window.router = router;
})();
