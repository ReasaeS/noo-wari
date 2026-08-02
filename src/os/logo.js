(function () {
  var SOURCE = "favicons/android-chrome-192x192.png";
  var SIZE = 192;
  var ALPHA_FLOOR = 8;
  var INSET = 0.70;

  var CHARACTER = "終";
  var GLYPH_SCALE = 0.62;
  var GLYPH_FAMILY =
    "\"Noto Sans CJK JP\", \"Noto Sans JP\", \"Source Han Sans\", " +
    "\"Hiragino Kaku Gothic ProN\", \"Yu Gothic\", \"MS Gothic\", " +
    "\"Microsoft YaHei\", sans-serif";

  function hexToRgb(hex) {
    var value = hex.replace("#", "");

    if (value.length == 3) {
      value = value.charAt(0) + value.charAt(0) +
        value.charAt(1) + value.charAt(1) +
        value.charAt(2) + value.charAt(2);
    }

    return {
      r: parseInt(value.substring(0, 2), 16),
      g: parseInt(value.substring(2, 4), 16),
      b: parseInt(value.substring(4, 6), 16)
    };
  }

  function makeFrame(size) {
    var aFrame = document.createElement("div");
    var frameStyle = aFrame.style;

    frameStyle.width = size + "px";
    frameStyle.height = size + "px";
    frameStyle.flexShrink = 0;
    frameStyle.borderRadius = "50%";
    frameStyle.display = "flex";
    frameStyle.alignItems = "center";
    frameStyle.justifyContent = "center";
    frameStyle.overflow = "hidden";
    frameStyle.backgroundColor = "var(--nw-logoField)";
    frameStyle.pointerEvents = "none";

    return aFrame;
  }

  function supportsGlyph() {
    var probe = document.createElement("canvas").getContext("2d");

    if (probe == null) {
      return false;
    }

    probe.font = "72px " + GLYPH_FAMILY;

    var wanted = probe.measureText(CHARACTER).width;
    var missing = probe.measureText("￿").width;

    if (wanted <= 0) {
      return false;
    }

    return Math.abs(wanted - missing) > 0.5;
  }

  function makeGlyphView(size) {
    var aFrame = makeFrame(size);
    var aGlyph = document.createElement("span");
    var glyphStyle = aGlyph.style;

    aGlyph.textContent = CHARACTER;

    glyphStyle.fontFamily = GLYPH_FAMILY;
    glyphStyle.fontSize = Math.round(size * GLYPH_SCALE) + "px";
    glyphStyle.lineHeight = "1";
    glyphStyle.color = "var(--nw-logoInk)";
    glyphStyle.userSelect = "none";
    glyphStyle.pointerEvents = "none";

    aFrame.appendChild(aGlyph);

    aFrame.glyph = aGlyph;
    aFrame.image = null;

    return aFrame;
  }

  function makeImageView(size, href) {
    var aFrame = makeFrame(size);
    var anImage = document.createElement("img");
    var inset = Math.round(size * INSET);

    anImage.src = href;
    anImage.alt = "noo-wari";
    anImage.draggable = false;

    anImage.style.width = inset + "px";
    anImage.style.height = inset + "px";
    anImage.style.display = "block";

    aFrame.appendChild(anImage);

    aFrame.image = anImage;
    aFrame.glyph = null;

    return aFrame;
  }

  function makeLogo() {
    var buffer = document.createElement("canvas");
    var context = buffer.getContext("2d");
    var source = new Image();

    var pixels = null;
    var lowest = 0;
    var highest = 255;
    var current = "";
    var views = [];

    function plainView(size) {
      return makeImageView(size, SOURCE);
    }

    function plainMark(size) {
      if (supportsGlyph()) {
        return makeGlyphView(size);
      }

      return plainView(size);
    }

    if (context == null) {
      return {
        view: plainView,
        mark: plainMark,
        forget: function () {
          return false;
        },
        repaint: function () {
          return false;
        },
        url: function () {
          return SOURCE;
        }
      };
    }

    buffer.width = SIZE;
    buffer.height = SIZE;

    function resolve(color) {
      context.fillStyle = "#000000";
      context.fillStyle = color;

      if (context.fillStyle.charAt(0) != "#") {
        return { r: 0, g: 0, b: 0 };
      }

      return hexToRgb(context.fillStyle);
    }

    function measure(data) {
      lowest = 255;
      highest = 0;

      for (var i = 0; i < data.length; i += 4) {
        if (data[i + 3] < ALPHA_FLOOR) {
          continue;
        }

        var luminance = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];

        if (luminance < lowest) {
          lowest = luminance;
        }

        if (luminance > highest) {
          highest = luminance;
        }
      }

      if (highest - lowest < 1) {
        lowest = 0;
        highest = 255;
      }
    }

    function paintFavicon() {
      var links = document.querySelectorAll("link[rel~=\"icon\"]");

      if (links.length == 0) {
        var aLink = document.createElement("link");

        aLink.rel = "icon";
        aLink.type = "image/png";
        aLink.href = current;

        document.head.appendChild(aLink);

        return;
      }

      for (var i = 0; i < links.length; i++) {
        links[i].href = current;
      }
    }

    function repaint() {
      if (pixels == null) {
        return false;
      }

      var ink = resolve(window.theme.color("logoInk"));
      var field = resolve(window.theme.color("logoField"));

      var out = context.createImageData(SIZE, SIZE);
      var range = highest - lowest;

      for (var i = 0; i < pixels.data.length; i += 4) {
        var alpha = pixels.data[i + 3];

        if (alpha < ALPHA_FLOOR) {
          out.data[i + 3] = alpha;
          continue;
        }

        var luminance =
          0.2126 * pixels.data[i] +
          0.7152 * pixels.data[i + 1] +
          0.0722 * pixels.data[i + 2];

        var t = (luminance - lowest) / range;

        if (t < 0) {
          t = 0;
        }

        if (t > 1) {
          t = 1;
        }

        out.data[i] = field.r + (ink.r - field.r) * t;
        out.data[i + 1] = field.g + (ink.g - field.g) * t;
        out.data[i + 2] = field.b + (ink.b - field.b) * t;
        out.data[i + 3] = alpha;
      }

      context.putImageData(out, 0, 0);

      try {
        current = buffer.toDataURL("image/png");
      } catch (error) {
        return false;
      }

      for (var j = 0; j < views.length; j++) {
        views[j].src = current;
      }

      paintFavicon();

      return true;
    }

    function onLoad() {
      context.clearRect(0, 0, SIZE, SIZE);
      context.drawImage(source, 0, 0, SIZE, SIZE);

      try {
        pixels = context.getImageData(0, 0, SIZE, SIZE);
      } catch (error) {
        pixels = null;

        return;
      }

      measure(pixels.data);
      repaint();
    }

    function view(size) {
      var href = SOURCE;

      if (current != "") {
        href = current;
      }

      var aFrame = makeImageView(size, href);

      views.push(aFrame.image);

      return aFrame;
    }

    function mark(size) {
      if (supportsGlyph()) {
        return makeGlyphView(size);
      }

      return view(size);
    }

    function forget(anImage) {
      for (var i = 0; i < views.length; i++) {
        if (views[i] == anImage) {
          views.splice(i, 1);

          return true;
        }
      }

      return false;
    }

    function url() {
      return current;
    }

    source.addEventListener("load", onLoad);
    source.src = SOURCE;

    window.theme.watch(repaint);

    return {
      view: view,
      mark: mark,
      forget: forget,
      repaint: repaint,
      url: url
    };
  }

  var logo = makeLogo();

  window.makeLogo = makeLogo;
  window.logo = logo;
})();
