(function () {
  var PANEL_COLOR = "var(--nw-panel)";
  var ORB_COLOR = "var(--nw-orb)";
  var OVERLAY_COLOR = "var(--nw-overlay)";
  var BORDER_COLOR = "var(--nw-tertiary)";
  var TEXT_COLOR = "var(--nw-text)";
  var MUTED_COLOR = "var(--nw-muted)";
  var ACCENT_COLOR = "var(--nw-accent)";
  var ACTIVE_COLOR = "var(--nw-active)";

  var FONT_FAMILY = "\"JetBrainsMono Nerd Font\", \"JetBrains Mono\", \"Fira Code\", monospace";
  var PANEL_WIDTH = 520;
  var PANEL_TOP = "18vh";
  var LIST_HEIGHT = 260;
  var ORB_SIZE = 96;
  var ORB_LOGO_SIZE = 58;
  var ORB_GLYPH = "☰";
  var ORB_HINT = "ctrl + space";
  var TOUCH_HINT = "tap to open";
  var ORB_Z_INDEX = 0;
  var OVERLAY_Z_INDEX = 1200;

  var CATEGORY_ORDER = ["system", "games", "art", "audio", "tools"];
  var DEFAULT_CATEGORY = "misc";

  var HINT_CLASS = "nw-hint";
  var ORB_CLASS = "nw-orb";

  var ORB_SOURCE =
    "@keyframes nw-hint-blink {\n" +
    "  0%, 100% { opacity: 1; }\n" +
    "  50% { opacity: 0.12; }\n" +
    "}\n" +
    "@keyframes nw-orb-pulse {\n" +
    "  0% {\n" +
    "    box-shadow: 0 0 0 0 var(--nw-active);\n" +
    "  }\n" +
    "  60% {\n" +
    "    box-shadow: 0 0 0 18px rgba(0, 0, 0, 0);\n" +
    "  }\n" +
    "  100% {\n" +
    "    box-shadow: 0 0 0 0 rgba(0, 0, 0, 0);\n" +
    "  }\n" +
    "}\n" +
    "." + HINT_CLASS + " {\n" +
    "  animation: nw-hint-blink 1.4s ease-in-out infinite;\n" +
    "}\n" +
    "." + ORB_CLASS + " {\n" +
    "  animation: nw-orb-pulse 2.6s ease-out infinite;\n" +
    "}\n" +
    "@media (prefers-reduced-motion: reduce) {\n" +
    "  ." + HINT_CLASS + ", ." + ORB_CLASS + " {\n" +
    "    animation: none;\n" +
    "  }\n" +
    "}\n";

  function makeOrbStyle() {
    var aStyle = document.createElement("style");

    aStyle.textContent = ORB_SOURCE;

    document.head.appendChild(aStyle);

    return aStyle;
  }

  function makeOrb(onClick) {
    var anOrb = document.createElement("div");
    var orbStyle = anOrb.style;

    var logoElement = window.logo.mark(ORB_LOGO_SIZE);
    var glyphElement = document.createElement("span");
    var hintElement = document.createElement("span");

    glyphElement.textContent = ORB_GLYPH;
    glyphElement.style.fontSize = "26px";
    glyphElement.style.lineHeight = "1";
    glyphElement.style.color = ACCENT_COLOR;
    glyphElement.style.display = "none";

    function onLogoError() {
      logoElement.style.display = "none";
      glyphElement.style.display = "block";
    }

    if (logoElement.image != null) {
      logoElement.image.addEventListener("error", onLogoError);
    }

    hintElement.textContent =
      typeof window.device != "undefined" && window.device.isTouch() ? TOUCH_HINT : ORB_HINT;
    hintElement.className = HINT_CLASS;
    hintElement.style.position = "absolute";
    hintElement.style.top = "100%";
    hintElement.style.left = "50%";
    hintElement.style.transform = "translateX(-50%)";
    hintElement.style.marginTop = "12px";
    hintElement.style.fontSize = "10px";
    hintElement.style.whiteSpace = "nowrap";
    hintElement.style.color = MUTED_COLOR;
    hintElement.style.transition = "opacity 260ms ease";

    orbStyle.position = "fixed";
    orbStyle.left = "50%";
    orbStyle.top = "50%";
    orbStyle.transform = "translate(-50%, -50%)";
    orbStyle.width = ORB_SIZE + "px";
    orbStyle.height = ORB_SIZE + "px";
    orbStyle.borderRadius = "50%";
    orbStyle.boxSizing = "border-box";
    orbStyle.display = "flex";
    orbStyle.alignItems = "center";
    orbStyle.justifyContent = "center";
    orbStyle.backgroundColor = ORB_COLOR;
    orbStyle.borderStyle = "solid";
    orbStyle.borderWidth = "1px";
    orbStyle.borderColor = BORDER_COLOR;
    orbStyle.backdropFilter = "blur(6px)";
    orbStyle.webkitBackdropFilter = "blur(6px)";
    orbStyle.fontFamily = FONT_FAMILY;
    orbStyle.cursor = "pointer";
    orbStyle.userSelect = "none";
    orbStyle.zIndex = ORB_Z_INDEX;

    anOrb.className = ORB_CLASS;

    function onEnter() {
      orbStyle.borderColor = ACCENT_COLOR;
    }

    function onLeave() {
      orbStyle.borderColor = BORDER_COLOR;
    }

    function settle() {
      if (hintElement.style.opacity == "0") {
        return false;
      }

      hintElement.className = "";
      hintElement.style.opacity = "0";
      hintElement.style.pointerEvents = "none";

      return true;
    }

    anOrb.appendChild(logoElement);
    anOrb.appendChild(glyphElement);
    anOrb.appendChild(hintElement);

    anOrb.addEventListener("click", onClick);
    anOrb.addEventListener("mouseenter", onEnter);
    anOrb.addEventListener("mouseleave", onLeave);

    anOrb.settle = settle;

    return anOrb;
  }

  function makeOverlay() {
    var anOverlay = document.createElement("div");
    var overlayStyle = anOverlay.style;

    overlayStyle.position = "fixed";
    overlayStyle.left = "0px";
    overlayStyle.top = "0px";
    overlayStyle.width = "100%";
    overlayStyle.height = "100%";
    overlayStyle.boxSizing = "border-box";
    overlayStyle.display = "none";
    overlayStyle.alignItems = "flex-start";
    overlayStyle.justifyContent = "center";
    overlayStyle.paddingTop = PANEL_TOP;
    overlayStyle.backgroundColor = OVERLAY_COLOR;
    overlayStyle.backdropFilter = "blur(3px)";
    overlayStyle.webkitBackdropFilter = "blur(3px)";
    overlayStyle.zIndex = OVERLAY_Z_INDEX;

    return anOverlay;
  }

  function makePanel() {
    var aPanel = document.createElement("div");
    var panelStyle = aPanel.style;

    panelStyle.width = PANEL_WIDTH + "px";
    panelStyle.maxWidth = "88%";
    panelStyle.boxSizing = "border-box";
    panelStyle.display = "flex";
    panelStyle.flexDirection = "column";
    panelStyle.backgroundColor = PANEL_COLOR;
    panelStyle.borderStyle = "solid";
    panelStyle.borderWidth = "1px";
    panelStyle.borderColor = BORDER_COLOR;
    panelStyle.borderRadius = "6px";
    panelStyle.overflow = "hidden";
    panelStyle.fontFamily = FONT_FAMILY;

    return aPanel;
  }

  function makeField() {
    var aField = document.createElement("div");
    var fieldStyle = aField.style;

    fieldStyle.display = "flex";
    fieldStyle.alignItems = "center";
    fieldStyle.padding = "0px 14px";
    fieldStyle.borderBottomStyle = "solid";
    fieldStyle.borderBottomWidth = "1px";
    fieldStyle.borderBottomColor = BORDER_COLOR;

    return aField;
  }

  function makePrompt() {
    var aPrompt = document.createElement("span");
    var promptStyle = aPrompt.style;

    aPrompt.textContent = "❯";

    promptStyle.flexShrink = 0;
    promptStyle.color = ACCENT_COLOR;
    promptStyle.fontSize = "14px";
    promptStyle.marginRight = "10px";
    promptStyle.userSelect = "none";

    return aPrompt;
  }

  function makeInput() {
    var anInput = document.createElement("input");
    var inputStyle = anInput.style;

    anInput.type = "text";
    anInput.spellcheck = false;

    inputStyle.flexGrow = 1;
    inputStyle.padding = "13px 0px";
    inputStyle.backgroundColor = "transparent";
    inputStyle.borderStyle = "none";
    inputStyle.outlineStyle = "none";
    inputStyle.color = TEXT_COLOR;
    inputStyle.fontFamily = FONT_FAMILY;
    inputStyle.fontSize = "14px";

    return anInput;
  }

  function makeList() {
    var aList = document.createElement("div");
    var listStyle = aList.style;

    listStyle.maxHeight = LIST_HEIGHT + "px";
    listStyle.overflowY = "auto";
    listStyle.padding = "6px 0px";

    return aList;
  }

  function makeEntry(anApp, isActive, onClick) {
    var anEntry = document.createElement("div");
    var entryStyle = anEntry.style;

    var nameElement = document.createElement("span");
    var descriptionElement = document.createElement("span");

    nameElement.textContent = anApp.name;
    nameElement.style.fontSize = "13px";

    descriptionElement.textContent = anApp.description;
    descriptionElement.style.fontSize = "11px";
    descriptionElement.style.color = MUTED_COLOR;
    descriptionElement.style.marginLeft = "12px";

    entryStyle.display = "flex";
    entryStyle.alignItems = "baseline";
    entryStyle.justifyContent = "space-between";
    entryStyle.padding = "7px 14px";
    entryStyle.cursor = "pointer";
    entryStyle.whiteSpace = "nowrap";
    entryStyle.overflow = "hidden";

    if (isActive) {
      entryStyle.backgroundColor = ACTIVE_COLOR;
      nameElement.style.color = ACCENT_COLOR;
    } else {
      entryStyle.backgroundColor = "transparent";
      nameElement.style.color = TEXT_COLOR;
    }

    anEntry.appendChild(nameElement);
    anEntry.appendChild(descriptionElement);

    anEntry.addEventListener("mousedown", onClick);

    return anEntry;
  }

  function makeEmpty() {
    var anEmpty = document.createElement("div");
    var emptyStyle = anEmpty.style;

    anEmpty.textContent = "no matches";

    emptyStyle.padding = "7px 14px";
    emptyStyle.fontSize = "13px";
    emptyStyle.color = MUTED_COLOR;

    return anEmpty;
  }

  function makeLauncher() {
    var anOverlay = makeOverlay();
    var aPanel = makePanel();
    var aField = makeField();
    var anInput = makeInput();
    var aList = makeList();

    var apps = [];
    var matches = [];

    var activeIndex = 0;
    var isOpen = false;
    var path = "";
    var aPrompt = makePrompt();

    function indexOfApp(name) {
      for (var i = 0; i < apps.length; i++) {
        if (apps[i].name == name) {
          return i;
        }
      }

      return -1;
    }

    function register(name, description, run, category) {
      var anApp = new Object();

      anApp.name = name;
      anApp.description = description;
      anApp.run = run;
      anApp.category = DEFAULT_CATEGORY;

      if (typeof category == "string" && category != "") {
        anApp.category = category;
      }

      apps.push(anApp);

      return anApp;
    }

    function categoryOf(anApp) {
      if (typeof anApp.category == "string" && anApp.category != "") {
        return anApp.category;
      }

      return DEFAULT_CATEGORY;
    }

    function countIn(name) {
      var total = 0;

      for (var i = 0; i < apps.length; i++) {
        if (categoryOf(apps[i]) == name) {
          total = total + 1;
        }
      }

      return total;
    }

    function makeCategoryEntry(name) {
      var anEntry = new Object();

      anEntry.kind = "category";
      anEntry.name = name;
      anEntry.description = countIn(name) + " apps  ›";

      return anEntry;
    }

    function makeAppEntry(anApp) {
      var anEntry = new Object();

      anEntry.kind = "app";
      anEntry.name = anApp.name;
      anEntry.description = anApp.description;
      anEntry.app = anApp;

      return anEntry;
    }

    function categories() {
      var found = [];
      var seen = new Object();

      for (var i = 0; i < CATEGORY_ORDER.length; i++) {
        if (countIn(CATEGORY_ORDER[i]) > 0) {
          found.push(makeCategoryEntry(CATEGORY_ORDER[i]));

          seen[CATEGORY_ORDER[i]] = true;
        }
      }

      for (var j = 0; j < apps.length; j++) {
        var name = categoryOf(apps[j]);

        if (typeof seen[name] == "undefined") {
          found.push(makeCategoryEntry(name));

          seen[name] = true;
        }
      }

      return found;
    }

    function unregister(name) {
      var index = indexOfApp(name);

      if (index == -1) {
        return false;
      }

      apps.splice(index, 1);

      return true;
    }

    function list() {
      return apps.slice(0);
    }

    function makeRunHandler(index) {
      return function (event) {
        event.preventDefault();

        run(index);
      };
    }

    function paint() {
      while (aList.firstChild) {
        aList.removeChild(aList.firstChild);
      }

      if (matches.length == 0) {
        aList.appendChild(makeEmpty());

        return;
      }

      for (var i = 0; i < matches.length; i++) {
        aList.appendChild(makeEntry(matches[i], i == activeIndex, makeRunHandler(i)));
      }
    }

    function refresh() {
      var query = anInput.value.trim().toLowerCase();

      matches = [];

      if (query != "") {
        for (var i = 0; i < apps.length; i++) {
          var haystack = (apps[i].name + " " + apps[i].description).toLowerCase();

          if (haystack.indexOf(query) != -1) {
            matches.push(makeAppEntry(apps[i]));
          }
        }
      } else if (path == "") {
        matches = categories();
      } else {
        for (var j = 0; j < apps.length; j++) {
          if (categoryOf(apps[j]) == path) {
            matches.push(makeAppEntry(apps[j]));
          }
        }
      }

      if (activeIndex >= matches.length) {
        activeIndex = 0;
      }

      paintPrompt();
      paint();
    }

    function paintPrompt() {
      if (path == "" || anInput.value.trim() != "") {
        aPrompt.textContent = "❯";
      } else {
        aPrompt.textContent = path + " ❯";
      }
    }

    function ascend() {
      if (path == "") {
        return false;
      }

      path = "";
      activeIndex = 0;

      refresh();

      return true;
    }

    function run(index) {
      if (index < 0 || index >= matches.length) {
        return false;
      }

      var anEntry = matches[index];

      if (anEntry.kind == "category") {
        path = anEntry.name;
        activeIndex = 0;

        anInput.value = "";

        refresh();
        anInput.focus();

        return true;
      }

      close();

      anEntry.app.run();

      return true;
    }

    function move(amount) {
      if (matches.length == 0) {
        return;
      }

      activeIndex = activeIndex + amount;

      while (activeIndex < 0) {
        activeIndex = activeIndex + matches.length;
      }

      activeIndex = activeIndex % matches.length;

      paint();

      aList.childNodes[activeIndex].scrollIntoView({ block: "nearest" });
    }

    function open() {
      anOrb.settle();

      if (isOpen) {
        return;
      }

      isOpen = true;

      anOverlay.style.display = "flex";
      anInput.value = "";

      path = "";
      activeIndex = 0;

      refresh();

      anInput.focus();
    }

    function close() {
      if (!isOpen) {
        return;
      }

      isOpen = false;

      anOverlay.style.display = "none";

      anInput.blur();
    }

    function toggle() {
      if (isOpen) {
        close();
      } else {
        open();
      }
    }

    function onKeyDown(event) {
      if (event.ctrlKey && event.code == "Space") {
        event.preventDefault();

        toggle();

        return;
      }

      if (!isOpen) {
        return;
      }

      if (event.key == "Escape") {
        event.preventDefault();

        if (anInput.value != "") {
          anInput.value = "";

          refresh();
        } else if (!ascend()) {
          close();
        }
      }

      if (event.key == "Backspace" && anInput.value == "") {
        if (ascend()) {
          event.preventDefault();
        }
      }

      if (event.key == "ArrowDown") {
        event.preventDefault();

        move(1);
      }

      if (event.key == "ArrowUp") {
        event.preventDefault();

        move(-1);
      }

      if (event.key == "Enter") {
        event.preventDefault();

        run(activeIndex);
      }
    }

    function onOverlayDown(event) {
      if (event.target == anOverlay) {
        close();
      }
    }

    var anOrb = makeOrb(open);

    aField.appendChild(aPrompt);
    aField.appendChild(anInput);

    aPanel.appendChild(aField);
    aPanel.appendChild(aList);

    anOverlay.appendChild(aPanel);

    anInput.addEventListener("input", refresh);
    anOverlay.addEventListener("mousedown", onOverlayDown);

    document.addEventListener("keydown", onKeyDown);

    document.body.appendChild(anOrb);
    document.body.appendChild(anOverlay);

    return {
      orb: anOrb,
      element: anOverlay,
      register: register,
      unregister: unregister,
      list: list,
      open: open,
      close: close,
      toggle: toggle
    };
  }

  makeOrbStyle();

  var launcher = makeLauncher();

  launcher.register("config", "wallpaper, top bar and session settings", function () {
    window.config.open();
  }, "system");

  window.makeLauncher = makeLauncher;
  window.launcher = launcher;
})();
