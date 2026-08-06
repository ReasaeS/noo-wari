(function () {
  var DB_NAME = "noo-wari";
  var DB_VERSION = 1;
  var STORE_NAME = "blobs";

  function makeVault() {
    var ready = null;
    var counter = 0;

    function isSupported() {
      return typeof window.indexedDB != "undefined" && window.indexedDB != null;
    }

    function open() {
      if (ready != null) {
        return ready;
      }

      ready = new Promise(function (resolve, reject) {
        if (!isSupported()) {
          reject(new Error("indexeddb is not available"));

          return;
        }

        var request = window.indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = function () {
          var aBase = request.result;

          if (!aBase.objectStoreNames.contains(STORE_NAME)) {
            aBase.createObjectStore(STORE_NAME);
          }
        };

        request.onsuccess = function () {
          resolve(request.result);
        };

        request.onerror = function () {
          reject(request.error);
        };
      });

      return ready;
    }

    function run(mode, task) {
      return open().then(function (aBase) {
        return new Promise(function (resolve, reject) {
          var deal = aBase.transaction(STORE_NAME, mode);
          var store = deal.objectStore(STORE_NAME);
          var request = task(store);

          deal.oncomplete = function () {
            resolve(request == null ? true : request.result);
          };

          deal.onerror = function () {
            reject(deal.error);
          };

          deal.onabort = function () {
            reject(deal.error);
          };
        });
      });
    }

    function mint(name) {
      counter = counter + 1;

      return "blob-" + Date.now() + "-" + counter + "-" + name;
    }

    function encode(text) {
      if (typeof window.TextEncoder != "undefined") {
        return new window.TextEncoder().encode(text).buffer;
      }

      var out = new ArrayBuffer(text.length);
      var view = new Uint8Array(out);

      for (var i = 0; i < text.length; i++) {
        view[i] = text.charCodeAt(i) & 255;
      }

      return out;
    }

    function decode(bytes) {
      if (bytes == null) {
        return "";
      }

      if (typeof bytes == "string") {
        return bytes;
      }

      if (typeof window.TextDecoder != "undefined") {
        return new window.TextDecoder().decode(bytes);
      }

      var view = new Uint8Array(bytes);
      var out = "";

      for (var i = 0; i < view.length; i++) {
        out = out + String.fromCharCode(view[i]);
      }

      return out;
    }

    function weigh(text) {
      return encode(text).byteLength;
    }

    function bytesOf(source) {
      if (typeof source == "string") {
        return Promise.resolve(encode(source));
      }

      if (source instanceof ArrayBuffer) {
        return Promise.resolve(source);
      }

      if (typeof source.arrayBuffer == "function") {
        return source.arrayBuffer();
      }

      return new Promise(function (resolve) {
        var reader = new FileReader();

        reader.onload = function () {
          resolve(reader.result);
        };

        reader.onerror = function () {
          resolve(new ArrayBuffer(0));
        };

        reader.readAsArrayBuffer(source);
      });
    }

    function put(id, source) {
      return bytesOf(source).then(function (bytes) {
        return run("readwrite", function (store) {
          return store.put(bytes, id);
        });
      });
    }

    function get(id) {
      return run("readonly", function (store) {
        return store.get(id);
      });
    }

    function remove(id) {
      return run("readwrite", function (store) {
        return store["delete"](id);
      });
    }

    function keys() {
      return run("readonly", function (store) {
        return store.getAllKeys();
      });
    }

    function clear() {
      return run("readwrite", function (store) {
        return store.clear();
      });
    }

    function isKept(kept, id) {
      for (var i = 0; i < kept.length; i++) {
        if (kept[i] == id) {
          return true;
        }
      }

      return false;
    }

    function sweep(kept) {
      if (!(kept instanceof Array)) {
        return Promise.resolve(0);
      }

      return keys().then(function (ids) {
        var doomed = [];

        for (var i = 0; i < ids.length; i++) {
          if (!isKept(kept, ids[i])) {
            doomed.push(ids[i]);
          }
        }

        if (doomed.length == 0) {
          return 0;
        }

        return run("readwrite", function (store) {
          for (var j = 0; j < doomed.length; j++) {
            store["delete"](doomed[j]);
          }

          return null;
        }).then(function () {
          return doomed.length;
        });
      }).catch(function () {
        return 0;
      });
    }

    function count() {
      return run("readonly", function (store) {
        return store.count();
      });
    }

    function measure() {
      return run("readonly", function (store) {
        return store.getAll();
      }).then(function (values) {
        var total = 0;

        for (var i = 0; i < values.length; i++) {
          if (values[i] != null && typeof values[i].byteLength == "number") {
            total = total + values[i].byteLength;
          }
        }

        return total;
      });
    }

    function text(id) {
      return get(id).then(function (bytes) {
        return decode(bytes);
      });
    }

    function url(id, type) {
      return get(id).then(function (bytes) {
        if (bytes == null || typeof window.URL.createObjectURL != "function") {
          return "";
        }

        return window.URL.createObjectURL(new window.Blob([bytes], { type: type }));
      });
    }

    function release(href) {
      if (href == "" || typeof window.URL.revokeObjectURL != "function") {
        return false;
      }

      window.URL.revokeObjectURL(href);

      return true;
    }

    return {
      supported: isSupported,
      mint: mint,
      weigh: weigh,
      put: put,
      get: get,
      text: text,
      url: url,
      release: release,
      remove: remove,
      keys: keys,
      clear: clear,
      sweep: sweep,
      count: count,
      measure: measure
    };
  }

  var vault = makeVault();

  window.makeVault = makeVault;
  window.vault = vault;
})();
