(function () {
  var STORAGE_KEY = "noo-wari.fs";
  var LEGACY_KEY = "noo-wari.desktop";
  var DESKTOP_NAME = "desktop";
  var CONFIG_NAME = "config";
  var SYSTEM_NAMES = ["desktop", "config"];
  var TEXT_TYPE = "text/plain";

  function isStarZone(anElement) {
    while (anElement != null) {
      if (anElement.starZone == true) {
        return true;
      }

      anElement = anElement.parentNode;
    }

    return false;
  }

  function makeFolder(name) {
    var aNode = new Object();

    aNode.kind = "folder";
    aNode.name = name;
    aNode.children = [];
    aNode.icon = "";
    aNode.x = 0;
    aNode.y = 0;

    return aNode;
  }

  function sizeOf(body) {
    return window.vault.weigh(body);
  }

  function makeFile(name, body) {
    var aNode = new Object();

    aNode.kind = "file";
    aNode.name = name;
    aNode.blob = window.vault.mint(name);
    aNode.size = sizeOf(body);
    aNode.type = TEXT_TYPE;
    aNode.icon = "";
    aNode.x = 0;
    aNode.y = 0;

    window.vault.put(aNode.blob, body);

    return aNode;
  }

  function makeInlineFile(name, body) {
    var aNode = new Object();

    aNode.kind = "file";
    aNode.name = name;
    aNode.body = body;
    aNode.inline = true;
    aNode.size = sizeOf(body);
    aNode.type = TEXT_TYPE;
    aNode.icon = "";
    aNode.x = 0;
    aNode.y = 0;

    return aNode;
  }

  function adoptFile(name, aFile) {
    var aNode = new Object();

    aNode.kind = "file";
    aNode.name = name;
    aNode.blob = window.vault.mint(name);
    aNode.size = aFile.size;
    aNode.type = aFile.type == "" ? TEXT_TYPE : aFile.type;
    aNode.icon = "";
    aNode.x = 0;
    aNode.y = 0;

    return aNode;
  }

  function makeShortcut(name, app) {
    var aNode = new Object();

    aNode.kind = "app";
    aNode.name = name;
    aNode.app = app;
    aNode.icon = "";
    aNode.x = 0;
    aNode.y = 0;

    return aNode;
  }

  function convertLegacy(anItem) {
    if (anItem.kind == "folder") {
      var aFolder = makeFolder(anItem.name);

      if (anItem.items instanceof Array) {
        for (var i = 0; i < anItem.items.length; i++) {
          aFolder.children.push(convertLegacy(anItem.items[i]));
        }
      }

      aFolder.icon = anItem.icon;
      aFolder.x = anItem.x;
      aFolder.y = anItem.y;

      return aFolder;
    }

    var aShortcut = makeShortcut(anItem.name, anItem.app);

    aShortcut.icon = anItem.icon;
    aShortcut.x = anItem.x;
    aShortcut.y = anItem.y;

    return aShortcut;
  }

  function legacyDesktop() {
    var raw = window.storage.get(LEGACY_KEY);

    if (raw == null) {
      return null;
    }

    try {
      var parsed = JSON.parse(raw);

      if (!(parsed instanceof Array)) {
        return null;
      }

      var aFolder = makeFolder(DESKTOP_NAME);

      for (var i = 0; i < parsed.length; i++) {
        aFolder.children.push(convertLegacy(parsed[i]));
      }

      return aFolder;
    } catch (error) {
      return null;
    }
  }

  function defaultTree() {
    var home = makeFolder("home");
    var documents = makeFolder("documents");

    documents.children.push(
      makeFile(
        "welcome.txt",
        "this is your file system.\n\n" +
          "file contents live in indexeddb, the tree lives in local storage.\n" +
          "anything inside home/desktop also appears on the desktop.\n" +
          "drop files from your computer onto this window to bring them in.\n\n" +
          "the server tab lists everything in the web root, read only."
      )
    );

    home.children.push(makeFolder(DESKTOP_NAME));
    home.children.push(makeFolder(CONFIG_NAME));
    home.children.push(documents);
    home.children.push(makeFolder("projects"));

    return home;
  }

  function makeFilesystem() {
    var root = null;
    var watchers = [];
    var isFresh = false;

    function childNamed(host, name) {
      for (var i = 0; i < host.children.length; i++) {
        if (host.children[i].name == name) {
          return host.children[i];
        }
      }

      return null;
    }

    function load() {
      var raw = window.storage.get(STORAGE_KEY);

      if (raw != null) {
        try {
          var parsed = JSON.parse(raw);

          if (parsed != null && parsed.kind == "folder") {
            root = parsed;
          }
        } catch (error) {
          root = null;
        }
      }

      if (root == null) {
        root = defaultTree();
        isFresh = true;

        var carried = legacyDesktop();

        if (carried != null) {
          for (var i = 0; i < root.children.length; i++) {
            if (root.children[i].name == DESKTOP_NAME) {
              root.children[i] = carried;
              isFresh = false;
            }
          }
        }
      }

      if (childNamed(root, CONFIG_NAME) == null) {
        root.children.unshift(makeFolder(CONFIG_NAME));
      }

      if (childNamed(root, DESKTOP_NAME) == null) {
        root.children.unshift(makeFolder(DESKTOP_NAME));
      }
    }

    function notify() {
      for (var i = 0; i < watchers.length; i++) {
        watchers[i](root);
      }
    }

    function save() {
      window.storage.set(STORAGE_KEY, JSON.stringify(root));

      notify();

      return true;
    }

    function quiet() {
      window.storage.set(STORAGE_KEY, JSON.stringify(root));

      return true;
    }

    function home() {
      return root;
    }

    function desktop() {
      return childNamed(root, DESKTOP_NAME);
    }

    function config() {
      var found = childNamed(root, CONFIG_NAME);

      if (found == null || found.kind != "folder") {
        found = makeFolder(CONFIG_NAME);

        root.children.unshift(found);
      }

      return found;
    }

    function readConfig(name) {
      var found = childNamed(config(), name);

      if (found == null || found.kind != "file") {
        return null;
      }

      if (typeof found.body != "string") {
        return null;
      }

      return found.body;
    }

    function writeConfig(name, body) {
      var host = config();
      var found = childNamed(host, name);

      if (found == null) {
        host.children.push(makeInlineFile(name, body));

        save();

        return true;
      }

      if (typeof found.blob == "string") {
        window.vault.remove(found.blob);

        delete found.blob;
      }

      found.kind = "file";
      found.body = body;
      found.inline = true;
      found.size = sizeOf(body);
      found.type = TEXT_TYPE;

      quiet();

      return true;
    }

    function removeConfig(name) {
      var host = config();
      var found = childNamed(host, name);

      if (found == null) {
        return false;
      }

      remove(host, found);

      save();

      return true;
    }

    function adoptConfig(name, legacyKey) {
      var found = readConfig(name);

      if (found != null) {
        return found;
      }

      var carried = window.storage.get(legacyKey);

      if (carried == null) {
        return null;
      }

      writeConfig(name, carried);

      window.storage.remove(legacyKey);

      return carried;
    }

    function fresh() {
      return isFresh;
    }

    function settle() {
      isFresh = false;
    }

    function uniqueName(host, wanted) {
      var name = wanted;
      var counter = 2;

      while (childNamed(host, name) != null) {
        name = wanted + " " + counter;

        counter = counter + 1;
      }

      return name;
    }

    function remove(host, aNode) {
      for (var i = 0; i < host.children.length; i++) {
        if (host.children[i] == aNode) {
          var doomed = blobsUnder(aNode, []);

          host.children.splice(i, 1);

          for (var j = 0; j < doomed.length; j++) {
            window.vault.remove(doomed[j]);
          }

          return true;
        }
      }

      return false;
    }

    function parentOf(host, aNode) {
      for (var i = 0; i < host.children.length; i++) {
        if (host.children[i] == aNode) {
          return host;
        }

        if (host.children[i].kind == "folder") {
          var found = parentOf(host.children[i], aNode);

          if (found != null) {
            return found;
          }
        }
      }

      return null;
    }

    function measure(aNode) {
      if (aNode.kind == "folder") {
        var total = 0;

        for (var i = 0; i < aNode.children.length; i++) {
          total = total + measure(aNode.children[i]);
        }

        return total;
      }

      if (aNode.kind == "file") {
        if (typeof aNode.size == "number") {
          return aNode.size;
        }

        return 0;
      }

      return aNode.name.length * 2;
    }

    function blobsUnder(aNode, found) {
      if (aNode.kind == "folder") {
        for (var i = 0; i < aNode.children.length; i++) {
          blobsUnder(aNode.children[i], found);
        }

        return found;
      }

      if (aNode.kind == "file" && typeof aNode.blob == "string") {
        found.push(aNode.blob);
      }

      return found;
    }

    function read(aNode) {
      if (aNode == null || aNode.kind != "file") {
        return Promise.resolve("");
      }

      if (typeof aNode.body == "string") {
        return Promise.resolve(aNode.body);
      }

      return window.vault.text(aNode.blob).catch(function () {
        return "";
      });
    }

    function write(aNode, body) {
      if (aNode == null || aNode.kind != "file") {
        return Promise.resolve(false);
      }

      if (aNode.inline == true) {
        aNode.body = body;
        aNode.size = sizeOf(body);
        aNode.type = TEXT_TYPE;

        save();

        return Promise.resolve(true);
      }

      if (typeof aNode.blob != "string") {
        aNode.blob = window.vault.mint(aNode.name);
      }

      delete aNode.body;

      aNode.size = sizeOf(body);
      aNode.type = TEXT_TYPE;

      return window.vault.put(aNode.blob, body).then(function () {
        save();

        return true;
      }).catch(function () {
        return false;
      });
    }

    function absorb(host, aFile) {
      var aNode = adoptFile(uniqueName(host, aFile.name), aFile);

      return window.vault.put(aNode.blob, aFile).then(function () {
        host.children.push(aNode);

        return aNode;
      });
    }

    function receive(host, list) {
      var chain = Promise.resolve(null);
      var landed = [];

      for (var i = 0; i < list.length; i++) {
        chain = chain.then((function (aFile) {
          return function () {
            return absorb(host, aFile).then(function (aNode) {
              landed.push(aNode);
            });
          };
        })(list[i]));
      }

      return chain.then(function () {
        if (landed.length > 0) {
          save();
        }

        return landed;
      }).catch(function () {
        return landed;
      });
    }

    function isProtected(aNode) {
      if (aNode == root) {
        return true;
      }

      for (var i = 0; i < SYSTEM_NAMES.length; i++) {
        if (childNamed(root, SYSTEM_NAMES[i]) == aNode) {
          return true;
        }
      }

      return false;
    }

    function stars() {
      if (!(root.stars instanceof Array)) {
        root.stars = [];
      }

      return root.stars;
    }

    function indexOfStar(path) {
      var wanted = path.join("/");
      var kept = stars();

      for (var i = 0; i < kept.length; i++) {
        if (kept[i].join("/") == wanted) {
          return i;
        }
      }

      return -1;
    }

    function star(path) {
      if (path.length == 0 || indexOfStar(path) != -1) {
        return false;
      }

      stars().push(path);

      save();

      return true;
    }

    function unstar(path) {
      var index = indexOfStar(path);

      if (index == -1) {
        return false;
      }

      stars().splice(index, 1);

      save();

      return true;
    }

    function trailFor(path) {
      var chain = [root];
      var host = root;

      for (var i = 0; i < path.length; i++) {
        var found = childNamed(host, path[i]);

        if (found == null || found.kind != "folder") {
          return null;
        }

        chain.push(found);

        host = found;
      }

      return chain;
    }

    function resolve(path) {
      var chain = trailFor(path);

      if (chain == null) {
        return null;
      }

      return chain[chain.length - 1];
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

    function reload() {
      root = null;

      load();
      notify();

      return true;
    }

    function strandedIn(aNode, found) {
      if (aNode.kind == "folder") {
        for (var i = 0; i < aNode.children.length; i++) {
          strandedIn(aNode.children[i], found);
        }

        return found;
      }

      if (aNode.kind == "file" && typeof aNode.body == "string" && aNode.inline != true) {
        found.push(aNode);
      }

      return found;
    }

    function reap() {
      if (isFresh) {
        return Promise.resolve(0);
      }

      return window.vault.sweep(blobsUnder(root, []));
    }

    function rehouse() {
      var stranded = strandedIn(root, []);

      if (stranded.length == 0) {
        return Promise.resolve(0);
      }

      var chain = Promise.resolve(null);

      for (var i = 0; i < stranded.length; i++) {
        chain = chain.then((function (aNode) {
          return function () {
            var body = aNode.body;

            aNode.blob = window.vault.mint(aNode.name);
            aNode.size = sizeOf(body);
            aNode.type = TEXT_TYPE;

            return window.vault.put(aNode.blob, body).then(function () {
              delete aNode.body;
            });
          };
        })(stranded[i]));
      }

      return chain.then(function () {
        save();

        return stranded.length;
      }).catch(function () {
        return 0;
      });
    }

    load();
    rehouse().then(reap);

    return {
      home: home,
      desktop: desktop,
      config: config,
      readConfig: readConfig,
      writeConfig: writeConfig,
      removeConfig: removeConfig,
      adoptConfig: adoptConfig,
      reap: reap,
      folder: makeFolder,
      file: makeFile,
      shortcut: makeShortcut,
      read: read,
      write: write,
      receive: receive,
      childNamed: childNamed,
      uniqueName: uniqueName,
      parentOf: parentOf,
      remove: remove,
      measure: measure,
      isProtected: isProtected,
      isStarZone: isStarZone,
      stars: stars,
      star: star,
      unstar: unstar,
      trailFor: trailFor,
      resolve: resolve,
      save: save,
      reload: reload,
      fresh: fresh,
      settle: settle,
      watch: watch,
      unwatch: unwatch
    };
  }

  var filesystem = makeFilesystem();

  window.makeFilesystem = makeFilesystem;
  window.filesystem = filesystem;
})();
