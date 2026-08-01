(function () {
  var PANEL_COLOR = "rgba(38, 42, 49, 0.95)";
  var ORB_COLOR = "rgba(38, 42, 49, 0.55)";
  var OVERLAY_COLOR = "rgba(6, 17, 9, 0.55)";
  var BORDER_COLOR = "#3b414c";
  var TEXT_COLOR = "#c5cad3";
  var MUTED_COLOR = "#7c848f";
  var ACCENT_COLOR = "#7fd18b";
  var ACTIVE_COLOR = "rgba(127, 209, 139, 0.14)";

  var FONT_FAMILY = "\"JetBrainsMono Nerd Font\", \"JetBrains Mono\", \"Fira Code\", monospace";
  var PANEL_WIDTH = 520;
  var PANEL_TOP = "18vh";
  var LIST_HEIGHT = 260;
  var ORB_SIZE = 96;
  var ORB_GLYPH = "☰";
  var ORB_HINT = "ctrl + space";
  var ORB_Z_INDEX = 0;
  var OVERLAY_Z_INDEX = 1200;

  function makeOrb(onClick) {
    var anOrb = document.createElement("div");
    var orbStyle = anOrb.style;

    var glyphElement = document.createElement("span");
    var hintElement = document.createElement("span");

    glyphElement.textContent = ORB_GLYPH;
    glyphElement.style.fontSize = "26px";
    glyphElement.style.lineHeight = "1";
    glyphElement.style.color = ACCENT_COLOR;

    hintElement.textContent = ORB_HINT;
    hintElement.style.fontSize = "10px";
    hintElement.style.marginTop = "8px";
    hintElement.style.color = MUTED_COLOR;

    orbStyle.position = "fixed";
    orbStyle.left = "50%";
    orbStyle.top = "50%";
    orbStyle.transform = "translate(-50%, -50%)";
    orbStyle.width = ORB_SIZE + "px";
    orbStyle.height = ORB_SIZE + "px";
    orbStyle.borderRadius = "50%";
    orbStyle.boxSizing = "border-box";
    orbStyle.display = "flex";
    orbStyle.flexDirection = "column";
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

    function onEnter() {
      orbStyle.borderColor = ACCENT_COLOR;
    }

    function onLeave() {
      orbStyle.borderColor = BORDER_COLOR;
    }

    anOrb.appendChild(glyphElement);
    anOrb.appendChild(hintElement);

    anOrb.addEventListener("click", onClick);
    anOrb.addEventListener("mouseenter", onEnter);
    anOrb.addEventListener("mouseleave", onLeave);

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

    function indexOfApp(name) {
      for (var i = 0; i < apps.length; i++) {
        if (apps[i].name == name) {
          return i;
        }
      }

      return -1;
    }

    function register(name, description, run) {
      var anApp = new Object();

      anApp.name = name;
      anApp.description = description;
      anApp.run = run;

      apps.push(anApp);

      return anApp;
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
      var query = anInput.value.toLowerCase();

      matches = [];

      for (var i = 0; i < apps.length; i++) {
        var haystack = (apps[i].name + " " + apps[i].description).toLowerCase();

        if (haystack.indexOf(query) != -1) {
          matches.push(apps[i]);
        }
      }

      if (activeIndex >= matches.length) {
        activeIndex = 0;
      }

      paint();
    }

    function run(index) {
      if (index < 0 || index >= matches.length) {
        return false;
      }

      var anApp = matches[index];

      close();

      anApp.run();

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
      if (isOpen) {
        return;
      }

      isOpen = true;

      anOverlay.style.display = "flex";
      anInput.value = "";

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

        close();
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

    aField.appendChild(makePrompt());
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

  function openWindow(title) {
    var aWindow = window.makeWindow();

    var labelElement = document.createElement("span");
    var labelStyle = labelElement.style;

    labelElement.textContent = title;

    labelStyle.marginLeft = "4px";
    labelStyle.color = TEXT_COLOR;
    labelStyle.fontFamily = FONT_FAMILY;
    labelStyle.fontSize = "12px";
    labelStyle.pointerEvents = "none";

    aWindow.titleBar.appendChild(labelElement);

    return aWindow;
  }

  var launcher = makeLauncher();

  launcher.register("window", "open an empty window", function () {
    openWindow("window");
  });

  launcher.register("config", "wallpaper, top bar and session settings", function () {
    window.config.open();
  });

  window.makeLauncher = makeLauncher;
  window.launcher = launcher;
})();
