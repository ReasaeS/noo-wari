(function () {
  var ROLES = [
    "primary",
    "secondary",
    "tertiary",
    "accent",
    "info",
    "alt",
    "ok",
    "warn",
    "danger",
    "text",
    "muted",
    "logoInk",
    "logoField"
  ];

  var PRESETS = [
    {
      name: "noo-wari",
      primary: "#262a31",
      secondary: "#2f3745",
      tertiary: "#3b414c",
      accent: "#7fd18b",
      info: "#7aa2e0",
      alt: "#a98fd1",
      ok: "#7faa68",
      warn: "#c9a45c",
      danger: "#c96a63",
      text: "#c5cad3",
      muted: "#7c848f"
    },
    {
      name: "nord",
      primary: "#2e3440",
      secondary: "#3b4252",
      tertiary: "#4c566a",
      accent: "#88c0d0",
      info: "#81a1c1",
      alt: "#b48ead",
      ok: "#a3be8c",
      warn: "#ebcb8b",
      danger: "#bf616a",
      text: "#e5e9f0",
      muted: "#7b88a1"
    },
    {
      name: "ember",
      primary: "#2a2320",
      secondary: "#362c27",
      tertiary: "#4a3b33",
      accent: "#e0a458",
      info: "#8fa9a3",
      alt: "#c98f7a",
      ok: "#9aab64",
      warn: "#d8b45c",
      danger: "#c4614f",
      text: "#ecdfd3",
      muted: "#a08d7e"
    },
    {
      name: "orchid",
      primary: "#2b2430",
      secondary: "#372c3e",
      tertiary: "#4b3d54",
      accent: "#d489a4",
      info: "#8fa6d8",
      alt: "#b18ad4",
      ok: "#86bb92",
      warn: "#d6b46a",
      danger: "#cc6a78",
      text: "#e4dceb",
      muted: "#9184a0"
    },
    {
      name: "mono",
      primary: "#232426",
      secondary: "#2d2f32",
      tertiary: "#43464a",
      accent: "#cfd3d8",
      info: "#a9aeb4",
      alt: "#8f949a",
      ok: "#a7b0a8",
      warn: "#bdb49a",
      danger: "#bf9a9a",
      text: "#e3e6e9",
      muted: "#868b91"
    },
    {
      name: "abyss",
      primary: "#1b2733",
      secondary: "#22303e",
      tertiary: "#314355",
      accent: "#57c7c7",
      info: "#5b93c4",
      alt: "#8f8ad4",
      ok: "#6fb894",
      warn: "#c9b06a",
      danger: "#c96f76",
      text: "#cfdae4",
      muted: "#748696"
    }
  ];

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

  function toHex(amount) {
    var text = Math.round(Math.max(0, Math.min(255, amount))).toString(16);

    if (text.length < 2) {
      text = "0" + text;
    }

    return text;
  }

  function rgbToHex(rgb) {
    return "#" + toHex(rgb.r) + toHex(rgb.g) + toHex(rgb.b);
  }

  function rgbToHsl(rgb) {
    var r = rgb.r / 255;
    var g = rgb.g / 255;
    var b = rgb.b / 255;

    var max = Math.max(r, g, b);
    var min = Math.min(r, g, b);
    var l = (max + min) / 2;
    var h = 0;
    var s = 0;

    if (max != min) {
      var d = max - min;

      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      if (max == r) {
        h = (g - b) / d + (g < b ? 6 : 0);
      } else if (max == g) {
        h = (b - r) / d + 2;
      } else {
        h = (r - g) / d + 4;
      }

      h = h / 6;
    }

    return { h: h, s: s, l: l };
  }

  function hslToRgb(hsl) {
    var h = hsl.h;
    var s = hsl.s;
    var l = hsl.l;

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

  function lift(hex, lightness, saturation) {
    var hsl = rgbToHsl(hexToRgb(hex));

    hsl.l = Math.max(0.02, Math.min(0.97, hsl.l * lightness));
    hsl.s = Math.max(0, Math.min(1, hsl.s * saturation));

    return rgbToHex(hslToRgb(hsl));
  }

  function toLightness(hex, lightness, saturation) {
    var hsl = rgbToHsl(hexToRgb(hex));

    hsl.l = Math.max(0.02, Math.min(0.97, lightness));
    hsl.s = Math.max(0, Math.min(1, hsl.s * saturation));

    return rgbToHex(hslToRgb(hsl));
  }

  function raise(hex, amount, saturation) {
    var hsl = rgbToHsl(hexToRgb(hex));

    return toLightness(hex, hsl.l + amount, saturation);
  }

  function mix(left, right, amount) {
    var a = hexToRgb(left);
    var b = hexToRgb(right);

    return rgbToHex({
      r: a.r + (b.r - a.r) * amount,
      g: a.g + (b.g - a.g) * amount,
      b: a.b + (b.b - a.b) * amount
    });
  }

  function alpha(hex, amount) {
    var rgb = hexToRgb(hex);

    return "rgba(" +
      Math.round(rgb.r) + ", " +
      Math.round(rgb.g) + ", " +
      Math.round(rgb.b) + ", " +
      amount + ")";
  }

  function derive(input) {
    var palette = new Object();

    palette.primary = input.primary;

    if (typeof palette.primary == "undefined") {
      palette.primary = PRESETS[0].primary;
    }

    palette.secondary = input.secondary;

    if (typeof palette.secondary == "undefined") {
      palette.secondary = raise(palette.primary, 0.05, 1.05);
    }

    palette.tertiary = input.tertiary;

    if (typeof palette.tertiary == "undefined") {
      palette.tertiary = raise(palette.primary, 0.11, 0.92);
    }

    palette.accent = input.accent;

    if (typeof palette.accent == "undefined") {
      palette.accent = PRESETS[0].accent;
    }

    palette.info = input.info;

    if (typeof palette.info == "undefined") {
      palette.info = lift(palette.accent, 0.95, 0.85);
    }

    palette.alt = input.alt;

    if (typeof palette.alt == "undefined") {
      palette.alt = lift(palette.accent, 0.92, 0.7);
    }

    palette.ok = input.ok;

    if (typeof palette.ok == "undefined") {
      palette.ok = palette.accent;
    }

    palette.warn = input.warn;

    if (typeof palette.warn == "undefined") {
      palette.warn = "#c9a45c";
    }

    palette.danger = input.danger;

    if (typeof palette.danger == "undefined") {
      palette.danger = "#c96a63";
    }

    palette.text = input.text;

    if (typeof palette.text == "undefined") {
      palette.text = toLightness(palette.primary, 0.82, 0.30);
    }

    palette.muted = input.muted;

    if (typeof palette.muted == "undefined") {
      palette.muted = toLightness(palette.primary, 0.55, 0.35);
    }

    palette.logoInk = input.logoInk;

    if (typeof palette.logoInk == "undefined") {
      palette.logoInk = palette.accent;
    }

    palette.logoField = input.logoField;

    if (typeof palette.logoField == "undefined") {
      palette.logoField = lift(palette.primary, 0.82, 1.1);
    }

    return palette;
  }

  function makeTheme(target) {
    var current = derive(PRESETS[0]);
    var activeName = PRESETS[0].name;
    var watchers = [];

    function emit() {
      var style = target.style;

      for (var i = 0; i < ROLES.length; i++) {
        style.setProperty("--nw-" + ROLES[i], current[ROLES[i]]);
      }

      style.setProperty("--nw-deep", lift(current.primary, 0.72, 1.05));
      style.setProperty("--nw-field", alpha("#000000", 0.22));
      style.setProperty("--nw-select", lift(current.primary, 0.78, 1.0));
      style.setProperty("--nw-hover", lift(current.tertiary, 1.28, 0.95));
      style.setProperty("--nw-focus", mix(current.tertiary, current.muted, 0.45));
      style.setProperty("--nw-bar", alpha(current.primary, 0.88));
      style.setProperty("--nw-panel", alpha(current.primary, 0.95));
      style.setProperty("--nw-orb", alpha(current.primary, 0.55));
      style.setProperty("--nw-overlay", alpha(lift(current.primary, 0.5, 1.1), 0.55));
      style.setProperty("--nw-veil", alpha(lift(current.primary, 0.5, 1.1), 0.35));
      style.setProperty("--nw-active", alpha(current.accent, 0.16));
      style.setProperty("--nw-alert", alpha(current.danger, 0.18));
      style.setProperty("--nw-sunken", alpha("#000000", 0.18));
    }

    function notify() {
      for (var i = 0; i < watchers.length; i++) {
        watchers[i](current);
      }
    }

    function set(input) {
      if (typeof input == "undefined" || input == null) {
        return false;
      }

      var merged = new Object();

      for (var i = 0; i < ROLES.length; i++) {
        if (typeof input[ROLES[i]] == "string") {
          merged[ROLES[i]] = input[ROLES[i]];
        }
      }

      current = derive(merged);
      activeName = "custom";

      emit();
      notify();

      return true;
    }

    function extend(input) {
      var merged = new Object();

      for (var i = 0; i < ROLES.length; i++) {
        merged[ROLES[i]] = current[ROLES[i]];
      }

      for (var j = 0; j < ROLES.length; j++) {
        if (typeof input[ROLES[j]] == "string") {
          merged[ROLES[j]] = input[ROLES[j]];
        }
      }

      return set(merged);
    }

    function find(name) {
      for (var i = 0; i < PRESETS.length; i++) {
        if (PRESETS[i].name == name) {
          return PRESETS[i];
        }
      }

      return null;
    }

    function select(name) {
      var preset = find(name);

      if (preset == null) {
        return false;
      }

      set(preset);

      activeName = preset.name;

      return true;
    }

    function current_name() {
      return activeName;
    }

    function get() {
      var copy = new Object();

      for (var i = 0; i < ROLES.length; i++) {
        copy[ROLES[i]] = current[ROLES[i]];
      }

      return copy;
    }

    function color(role) {
      if (typeof current[role] == "string") {
        return current[role];
      }

      return window.getComputedStyle(target).getPropertyValue("--nw-" + role).trim();
    }

    function list() {
      var found = [];

      for (var i = 0; i < PRESETS.length; i++) {
        found.push(PRESETS[i].name);
      }

      return found;
    }

    function roles() {
      return ROLES.slice(0);
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

    emit();

    return {
      set: set,
      extend: extend,
      select: select,
      current: current_name,
      get: get,
      color: color,
      list: list,
      roles: roles,
      watch: watch,
      unwatch: unwatch,
      lift: lift,
      mix: mix,
      alpha: alpha
    };
  }

  var theme = makeTheme(document.documentElement);

  window.makeTheme = makeTheme;
  window.theme = theme;
})();
