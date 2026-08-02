(function () {
  var SCHEMES = ["complement", "triad", "analogous", "tetrad", "monochrome"];

  function toHex(amount) {
    var text = Math.round(amount).toString(16);

    if (text.length < 2) {
      text = "0" + text;
    }

    return text;
  }

  function hslToRgb(hue, saturation, lightness) {
    var h = hue / 360;
    var s = saturation / 100;
    var l = lightness / 100;

    if (s == 0) {
      return { r: l * 255, g: l * 255, b: l * 255 };
    }

    var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    var p = 2 * l - q;

    function channel(t) {
      if (t < 0) {
        t = t + 1;
      }

      if (t > 1) {
        t = t - 1;
      }

      if (t < 1 / 6) {
        return p + (q - p) * 6 * t;
      }

      if (t < 1 / 2) {
        return q;
      }

      if (t < 2 / 3) {
        return p + (q - p) * (2 / 3 - t) * 6;
      }

      return p;
    }

    return {
      r: channel(h + 1 / 3) * 255,
      g: channel(h) * 255,
      b: channel(h - 1 / 3) * 255
    };
  }

  function hexOf(hue, saturation, lightness) {
    var rgb = hslToRgb(hue, saturation, lightness);

    return "#" + toHex(rgb.r) + toHex(rgb.g) + toHex(rgb.b);
  }

  function build(aSheet) {
    var ui = window.ui;

    var toolbar = ui.toolbar();
    var stage = ui.stage();
    var preview = document.createElement("div");
    var readout = document.createElement("div");
    var strip = document.createElement("div");
    var controls = document.createElement("div");

    var hue = 145;
    var saturation = 45;
    var lightness = 62;
    var scheme = "complement";

    function schemeHues() {
      if (scheme == "complement") {
        return [hue, (hue + 180) % 360];
      }

      if (scheme == "triad") {
        return [hue, (hue + 120) % 360, (hue + 240) % 360];
      }

      if (scheme == "analogous") {
        return [(hue + 330) % 360, hue, (hue + 30) % 360];
      }

      if (scheme == "tetrad") {
        return [hue, (hue + 90) % 360, (hue + 180) % 360, (hue + 270) % 360];
      }

      return [hue, hue, hue, hue, hue];
    }

    function schemeLightness(index, count) {
      if (scheme != "monochrome") {
        return lightness;
      }

      return 25 + (index / Math.max(count - 1, 1)) * 55;
    }

    function paint() {
      var hex = hexOf(hue, saturation, lightness);
      var rgb = hslToRgb(hue, saturation, lightness);

      preview.style.backgroundColor = hex;

      ui.clear(readout);

      readout.appendChild(makeRow("hex", hex));
      readout.appendChild(makeRow("rgb", Math.round(rgb.r) + ", " + Math.round(rgb.g) + ", " + Math.round(rgb.b)));
      readout.appendChild(makeRow("hsl", Math.round(hue) + ", " + saturation + "%, " + lightness + "%"));

      ui.clear(strip);

      var hues = schemeHues();

      for (var i = 0; i < hues.length; i++) {
        strip.appendChild(
          makeSwatch(hexOf(hues[i], saturation, schemeLightness(i, hues.length)))
        );
      }
    }

    function makeRow(label, value) {
      var aRow = document.createElement("div");
      var rowStyle = aRow.style;

      var labelElement = ui.label(label);
      var valueElement = document.createElement("span");

      valueElement.textContent = value;
      valueElement.style.color = ui.TEXT_COLOR;
      valueElement.style.fontSize = "13px";
      valueElement.style.cursor = "pointer";
      valueElement.title = "click to copy";

      valueElement.addEventListener("click", function () {
        copy(value);
      });

      rowStyle.display = "flex";
      rowStyle.justifyContent = "space-between";
      rowStyle.padding = "6px 0px";
      rowStyle.borderBottomStyle = "solid";
      rowStyle.borderBottomWidth = "1px";
      rowStyle.borderBottomColor = ui.BORDER_COLOR;

      aRow.appendChild(labelElement);
      aRow.appendChild(valueElement);

      return aRow;
    }

    function makeSwatch(hex) {
      var aSwatch = document.createElement("div");
      var swatchStyle = aSwatch.style;

      aSwatch.textContent = hex;
      aSwatch.title = "click to copy";

      swatchStyle.flexGrow = 1;
      swatchStyle.height = "56px";
      swatchStyle.backgroundColor = hex;
      swatchStyle.borderRadius = "4px";
      swatchStyle.display = "flex";
      swatchStyle.alignItems = "flex-end";
      swatchStyle.justifyContent = "center";
      swatchStyle.paddingBottom = "4px";
      swatchStyle.fontSize = "10px";
      swatchStyle.color = "rgba(0, 0, 0, 0.55)";
      swatchStyle.cursor = "pointer";

      aSwatch.addEventListener("click", function () {
        copy(hex);
      });

      return aSwatch;
    }

    function copy(text) {
      if (navigator.clipboard != null) {
        navigator.clipboard.writeText(text);
      }
    }

    function onHueChange(amount) {
      hue = amount;

      paint();
    }

    function onSaturationChange(amount) {
      saturation = amount;

      paint();
    }

    function onLightnessChange(amount) {
      lightness = amount;

      paint();
    }

    function onSchemeChange(name) {
      scheme = name;

      paint();
    }

    function randomise() {
      hue = Math.floor(Math.random() * 360);
      saturation = 30 + Math.floor(Math.random() * 50);
      lightness = 40 + Math.floor(Math.random() * 30);

      paint();
    }

    preview.style.height = "90px";
    preview.style.borderRadius = "6px";
    preview.style.marginBottom = "12px";
    preview.style.borderStyle = "solid";
    preview.style.borderWidth = "1px";
    preview.style.borderColor = ui.BORDER_COLOR;

    strip.style.display = "flex";
    strip.style.gap = "6px";
    strip.style.marginTop = "14px";

    controls.style.display = "flex";
    controls.style.flexDirection = "column";
    controls.style.gap = "6px";
    controls.style.marginTop = "14px";

    controls.appendChild(makeSlider("hue", 0, 360, hue, onHueChange));
    controls.appendChild(makeSlider("saturation", 0, 100, saturation, onSaturationChange));
    controls.appendChild(makeSlider("lightness", 0, 100, lightness, onLightnessChange));

    function makeSlider(label, min, max, value, onChange) {
      var aRow = document.createElement("div");

      aRow.style.display = "flex";
      aRow.style.alignItems = "center";
      aRow.style.gap = "10px";

      var labelElement = ui.label(label);

      labelElement.style.width = "72px";

      var range = ui.range(min, max, value, onChange);

      range.style.flexGrow = 1;
      range.style.width = "auto";

      aRow.appendChild(labelElement);
      aRow.appendChild(range);

      return aRow;
    }

    toolbar.appendChild(ui.select(SCHEMES, scheme, onSchemeChange));
    toolbar.appendChild(ui.button("random", randomise));
    toolbar.appendChild(ui.spacer());
    toolbar.appendChild(ui.label("click a value to copy"));

    stage.appendChild(preview);
    stage.appendChild(readout);
    stage.appendChild(controls);
    stage.appendChild(strip);

    aSheet.appendChild(toolbar);
    aSheet.appendChild(stage);

    paint();

    return null;
  }

  window.makeApp("colors", "palette picker with harmonies", 460, 520, build);
})();
