(function () {
  var FOLDER = "music/";
  var INDEX_PATH = FOLDER + "tracks.json";
  var UNKNOWN_ARTIST = "unknown artist";

  function stemOf(name) {
    var cut = name.lastIndexOf(".");
    var stem = cut == -1 ? name : name.substring(0, cut);
    var slash = stem.lastIndexOf("/");

    if (slash != -1) {
      stem = stem.substring(slash + 1);
    }

    return stem;
  }

  function makePicture(src, size) {
    var anImage = document.createElement("img");

    anImage.src = src;
    anImage.alt = "";

    anImage.style.width = size + "px";
    anImage.style.height = size + "px";
    anImage.style.display = "block";
    anImage.style.objectFit = "cover";
    anImage.style.borderRadius = "4px";

    return anImage;
  }

  function makeEmblem(size) {
    var aMark = window.logo.mark(size);

    aMark.release = function () {
      if (aMark.image != null) {
        window.logo.forget(aMark.image);
      }
    };

    return aMark;
  }

  function makeSongs() {
    var items = [];
    var pledge = null;

    function tidy(raw) {
      var found = [];

      if (!(raw instanceof Array)) {
        return found;
      }

      for (var i = 0; i < raw.length; i++) {
        var item = raw[i];

        if (item == null || typeof item.theme != "string" || item.theme == "") {
          continue;
        }

        if (typeof item.file != "string" || item.file == "") {
          continue;
        }

        var anEntry = new Object();

        anEntry.key = item.theme;
        anEntry.file = item.file;
        anEntry.src = FOLDER + item.file;
        anEntry.title = typeof item.title == "string" && item.title != "" ? item.title : stemOf(item.file);
        anEntry.artist = typeof item.artist == "string" && item.artist != "" ? item.artist : UNKNOWN_ARTIST;
        anEntry.cover = typeof item.cover == "string" && item.cover != "" ? FOLDER + item.cover : "";

        found.push(anEntry);
      }

      return found;
    }

    function ready() {
      if (pledge != null) {
        return pledge;
      }

      pledge = window.fetch(INDEX_PATH).then(function (response) {
        if (!response.ok) {
          return [];
        }

        return response.json();
      }).then(function (raw) {
        items = tidy(raw);

        return items.length;
      }).catch(function () {
        items = [];

        return 0;
      });

      return pledge;
    }

    function find(key) {
      for (var i = 0; i < items.length; i++) {
        if (items[i].key == key) {
          return items[i];
        }
      }

      return null;
    }

    function describe(anEntry) {
      var out = new Object();

      out.key = anEntry.key;
      out.title = anEntry.title;
      out.artist = anEntry.artist;
      out.src = anEntry.src;

      return out;
    }

    function forTheme(name) {
      var found = find(name);

      if (found == null) {
        return null;
      }

      return describe(found);
    }

    function list() {
      var found = [];

      for (var i = 0; i < items.length; i++) {
        found.push(describe(items[i]));
      }

      return found;
    }

    function url(key) {
      var found = find(key);

      if (found == null) {
        return Promise.resolve("");
      }

      return Promise.resolve(found.src);
    }

    function cover(key, size) {
      var found = find(key);

      if (found == null || found.cover == "") {
        return makeEmblem(size);
      }

      return makePicture(found.cover, size);
    }

    function emblem(size) {
      return makeEmblem(size);
    }

    function folder() {
      return FOLDER;
    }

    return {
      ready: ready,
      forTheme: forTheme,
      list: list,
      url: url,
      cover: cover,
      emblem: emblem,
      folder: folder
    };
  }

  var songs = makeSongs();

  songs.ready();

  window.makeSongs = makeSongs;
  window.songs = songs;
})();
