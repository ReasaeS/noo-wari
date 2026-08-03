(function () {
  var ICON_PATH = "icons/";
  var DEFAULT_SIZE = 44;
  var STOCK_NAMES = ["terminal", "files", "config", "about"];
  var LOGO_NAMES = ["about"];

  var GLYPH_SCALE = 0.45;
  var VECTOR_SCALE = 0.59;
  var LOGO_SCALE = 0.77;
  var RADIUS_SCALE = 0.2;

  var stockArt = new Object();
  var logoFrames = [];

  function sized(size) {
    if (typeof size != "number" || size <= 0) {
      return DEFAULT_SIZE;
    }

    return size;
  }

  function isLogoName(name) {
    for (var i = 0; i < LOGO_NAMES.length; i++) {
      if (LOGO_NAMES[i] == name) {
        return true;
      }
    }

    return false;
  }

  function stockIcon(name) {
    if (isLogoName(name)) {
      return "";
    }

    for (var i = 0; i < STOCK_NAMES.length; i++) {
      if (STOCK_NAMES[i] == name) {
        return ICON_PATH + name + ".svg";
      }
    }

    return "";
  }

  function hasStock(name) {
    return isLogoName(name) || stockIcon(name) != "";
  }

  function makeChip(size) {
    var edge = sized(size);
    var anArt = document.createElement("div");
    var artStyle = anArt.style;

    artStyle.width = edge + "px";
    artStyle.height = edge + "px";
    artStyle.boxSizing = "border-box";
    artStyle.display = "flex";
    artStyle.alignItems = "center";
    artStyle.justifyContent = "center";
    artStyle.borderRadius = Math.round(edge * RADIUS_SCALE) + "px";
    artStyle.borderStyle = "solid";
    artStyle.borderWidth = "1px";
    artStyle.borderColor = "var(--nw-tertiary)";
    artStyle.backgroundColor = "var(--nw-secondary)";
    artStyle.color = "var(--nw-accent)";
    artStyle.fontSize = Math.round(edge * GLYPH_SCALE) + "px";

    return anArt;
  }

  function makeLetterArt(name, size) {
    var anArt = makeChip(size);

    anArt.textContent = name.charAt(0).toUpperCase();

    return anArt;
  }

  function fitVector(anArt, size) {
    var inner = Math.round(sized(size) * VECTOR_SCALE);
    var aVector = anArt.firstChild;

    if (aVector == null) {
      return false;
    }

    aVector.setAttribute("width", inner);
    aVector.setAttribute("height", inner);

    return true;
  }

  function makeStockArt(name, size) {
    var anArt = makeChip(size);
    var src = stockIcon(name);

    if (stockArt[src] != null) {
      anArt.innerHTML = stockArt[src];

      fitVector(anArt, size);

      return anArt;
    }

    fetch(src).then(function (response) {
      if (!response.ok) {
        throw new Error("missing");
      }

      return response.text();
    }).then(function (markup) {
      stockArt[src] = markup;

      anArt.innerHTML = markup;

      fitVector(anArt, size);
    }).catch(function () {
      anArt.textContent = name.charAt(0).toUpperCase();
    });

    return anArt;
  }

  function releaseLogos() {
    var kept = [];

    for (var i = 0; i < logoFrames.length; i++) {
      if (logoFrames[i].isConnected) {
        kept.push(logoFrames[i]);
      } else if (logoFrames[i].image != null) {
        window.logo.forget(logoFrames[i].image);
      }
    }

    logoFrames = kept;
  }

  function makeLogoArt(size) {
    releaseLogos();

    var anArt = makeChip(size);
    var aFrame = window.logo.mark(Math.round(sized(size) * LOGO_SCALE));

    if (aFrame.image == null) {
      aFrame.style.backgroundColor = "transparent";
    }

    anArt.appendChild(aFrame);

    logoFrames.push(aFrame);

    return anArt;
  }

  function makePictureArt(src, size) {
    var edge = sized(size);
    var anImage = document.createElement("img");
    var imageStyle = anImage.style;

    anImage.src = src;
    anImage.alt = "";
    anImage.draggable = false;

    imageStyle.width = edge + "px";
    imageStyle.height = edge + "px";
    imageStyle.objectFit = "cover";
    imageStyle.borderRadius = Math.round(edge * RADIUS_SCALE) + "px";
    imageStyle.display = "block";

    return anImage;
  }

  function makeFolderArt(size) {
    var edge = sized(size);
    var anArt = document.createElement("div");
    var artStyle = anArt.style;

    var tab = document.createElement("div");
    var body = document.createElement("div");

    artStyle.position = "relative";
    artStyle.width = edge + "px";
    artStyle.height = edge + "px";

    tab.style.position = "absolute";
    tab.style.left = "2px";
    tab.style.top = Math.round(edge * 0.16) + "px";
    tab.style.width = Math.round(edge * 0.39) + "px";
    tab.style.height = Math.round(edge * 0.16) + "px";
    tab.style.borderRadius = "3px 3px 0px 0px";
    tab.style.backgroundColor = "var(--nw-warn)";

    body.style.position = "absolute";
    body.style.left = "2px";
    body.style.top = Math.round(edge * 0.27) + "px";
    body.style.width = edge - 4 + "px";
    body.style.height = edge - Math.round(edge * 0.41) + "px";
    body.style.borderRadius = "3px";
    body.style.backgroundColor = "var(--nw-warn)";
    body.style.opacity = "0.86";

    anArt.appendChild(tab);
    anArt.appendChild(body);

    return anArt;
  }

  function makeAppArt(name, size) {
    if (isLogoName(name)) {
      return makeLogoArt(size);
    }

    if (stockIcon(name) != "") {
      return makeStockArt(name, size);
    }

    return makeLetterArt(name, size);
  }

  function names() {
    return STOCK_NAMES.slice(0);
  }

  window.icons = {
    chip: makeChip,
    app: makeAppArt,
    letter: makeLetterArt,
    stock: makeStockArt,
    logo: makeLogoArt,
    picture: makePictureArt,
    folder: makeFolderArt,
    has: hasStock,
    isLogo: isLogoName,
    path: stockIcon,
    names: names,
    size: DEFAULT_SIZE
  };
})();
