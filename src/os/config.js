(function () {
  var TEXT_COLOR = "var(--nw-text)";
  var DANGER_COLOR = "var(--nw-danger)";
  var MUTED_COLOR = "var(--nw-muted)";
  var ACCENT_COLOR = "var(--nw-accent)";
  var BORDER_COLOR = "var(--nw-tertiary)";
  var FIELD_COLOR = "var(--nw-field)";
  var SELECT_COLOR = "var(--nw-select)";

  var FONT_FAMILY = "\"JetBrainsMono Nerd Font\", \"JetBrains Mono\", \"Fira Code\", monospace";
  var WINDOW_WIDTH = 460;
  var WINDOW_HEIGHT = 340;
  var CYCLE_INTERVAL = 30000;
  var STORAGE_PREFIX = "noo-wari.";
  var ARM_TIMEOUT = 4000;

  function makeTitle(text) {
    var aTitle = document.createElement("span");
    var titleStyle = aTitle.style;

    aTitle.textContent = text;

    titleStyle.marginLeft = "4px";
    titleStyle.color = TEXT_COLOR;
    titleStyle.fontFamily = FONT_FAMILY;
    titleStyle.fontSize = "12px";
    titleStyle.pointerEvents = "none";

    return aTitle;
  }

  function makeSheet() {
    var aSheet = document.createElement("div");
    var sheetStyle = aSheet.style;

    sheetStyle.width = "100%";
    sheetStyle.height = "100%";
    sheetStyle.boxSizing = "border-box";
    sheetStyle.display = "flex";
    sheetStyle.flexDirection = "column";
    sheetStyle.fontFamily = FONT_FAMILY;
    sheetStyle.fontSize = "13px";
    sheetStyle.color = TEXT_COLOR;

    return aSheet;
  }

  function makeStrip() {
    var aStrip = document.createElement("div");
    var stripStyle = aStrip.style;

    stripStyle.display = "flex";
    stripStyle.flexShrink = 0;
    stripStyle.padding = "0px 10px";
    stripStyle.backgroundColor = "var(--nw-primary)";
    stripStyle.borderBottomStyle = "solid";
    stripStyle.borderBottomWidth = "1px";
    stripStyle.borderBottomColor = BORDER_COLOR;

    return aStrip;
  }

  function makeTab(label, onPick) {
    var aTab = document.createElement("button");
    var tabStyle = aTab.style;

    aTab.textContent = label;
    aTab.type = "button";

    tabStyle.padding = "8px 11px";
    tabStyle.backgroundColor = "transparent";
    tabStyle.borderStyle = "none";
    tabStyle.borderBottomStyle = "solid";
    tabStyle.borderBottomWidth = "2px";
    tabStyle.borderBottomColor = "transparent";
    tabStyle.marginBottom = "-1px";
    tabStyle.color = MUTED_COLOR;
    tabStyle.fontFamily = FONT_FAMILY;
    tabStyle.fontSize = "10px";
    tabStyle.letterSpacing = "1px";
    tabStyle.textTransform = "uppercase";
    tabStyle.cursor = "pointer";
    tabStyle.outlineStyle = "none";

    aTab.addEventListener("click", onPick);

    return aTab;
  }

  function makePanel() {
    var aPanel = document.createElement("div");
    var panelStyle = aPanel.style;

    panelStyle.flexGrow = 1;
    panelStyle.minHeight = 0;
    panelStyle.overflowY = "auto";
    panelStyle.padding = "4px 16px 14px 16px";
    panelStyle.boxSizing = "border-box";

    return aPanel;
  }

  function makeRow(label) {
    var aRow = document.createElement("div");
    var rowStyle = aRow.style;

    var labelElement = document.createElement("span");

    labelElement.textContent = label;

    rowStyle.display = "flex";
    rowStyle.alignItems = "center";
    rowStyle.justifyContent = "space-between";
    rowStyle.padding = "9px 0px";
    rowStyle.borderBottomStyle = "solid";
    rowStyle.borderBottomWidth = "1px";
    rowStyle.borderBottomColor = BORDER_COLOR;

    aRow.appendChild(labelElement);

    return aRow;
  }

  function makeButton(label, onClick) {
    var aButton = document.createElement("button");
    var buttonStyle = aButton.style;

    aButton.textContent = label;
    aButton.type = "button";

    buttonStyle.minWidth = "64px";
    buttonStyle.padding = "4px 10px";
    buttonStyle.backgroundColor = FIELD_COLOR;
    buttonStyle.borderStyle = "solid";
    buttonStyle.borderWidth = "1px";
    buttonStyle.borderColor = BORDER_COLOR;
    buttonStyle.borderRadius = "4px";
    buttonStyle.color = TEXT_COLOR;
    buttonStyle.fontFamily = FONT_FAMILY;
    buttonStyle.fontSize = "12px";
    buttonStyle.cursor = "pointer";

    aButton.addEventListener("click", onClick);

    return aButton;
  }

  function fillOptions(aSelect, names, value) {
    while (aSelect.firstChild) {
      aSelect.removeChild(aSelect.firstChild);
    }

    for (var i = 0; i < names.length; i++) {
      var anOption = document.createElement("option");

      anOption.value = names[i];
      anOption.textContent = names[i];

      aSelect.appendChild(anOption);
    }

    aSelect.value = value;

    return aSelect;
  }

  function makeSelect(names, value, onChange) {
    var aSelect = document.createElement("select");
    var selectStyle = aSelect.style;

    fillOptions(aSelect, names, value);

    selectStyle.minWidth = "140px";
    selectStyle.padding = "4px 8px";
    selectStyle.backgroundColor = SELECT_COLOR;
    selectStyle.borderStyle = "solid";
    selectStyle.borderWidth = "1px";
    selectStyle.borderColor = BORDER_COLOR;
    selectStyle.borderRadius = "4px";
    selectStyle.color = TEXT_COLOR;
    selectStyle.fontFamily = FONT_FAMILY;
    selectStyle.fontSize = "12px";
    selectStyle.cursor = "pointer";

    function onSelectChange() {
      onChange(aSelect.value);
    }

    aSelect.addEventListener("change", onSelectChange);

    return aSelect;
  }

  function makeConfig() {
    var configWindow = null;
    var painters = [];
    var isCycling = false;

    function isOpen() {
      return configWindow != null && configWindow.content != null;
    }

    function refresh() {
      for (var i = 0; i < painters.length; i++) {
        painters[i]();
      }
    }

    function makeToggleRow(label, read, write) {
      var aRow = makeRow(label);

      function paint() {
        if (read()) {
          aButton.textContent = "on";
          aButton.style.color = ACCENT_COLOR;
          aButton.style.borderColor = ACCENT_COLOR;
        } else {
          aButton.textContent = "off";
          aButton.style.color = MUTED_COLOR;
          aButton.style.borderColor = BORDER_COLOR;
        }
      }

      function onClick() {
        write();
        paint();
      }

      var aButton = makeButton("", onClick);

      painters.push(paint);

      paint();

      aRow.appendChild(aButton);

      return aRow;
    }

    function makeActionRow(label, action, onClick) {
      var aRow = makeRow(label);

      aRow.appendChild(makeButton(action, onClick));

      return aRow;
    }

    function readTopBar() {
      return window.topbar.element.style.display != "none";
    }

    function writeTopBar() {
      if (readTopBar()) {
        window.topbar.hide();
      } else {
        window.topbar.show();
      }

      window.desktops.refit();
    }

    function readFullscreen() {
      return document.fullscreenElement != null;
    }

    function writeFullscreen() {
      if (readFullscreen()) {
        document.exitFullscreen();
      } else {
        document.documentElement.requestFullscreen();
      }
    }

    function readCycling() {
      return isCycling;
    }

    function writeCycling() {
      if (isCycling) {
        window.backgrounds.stopCycle();
      } else {
        window.backgrounds.cycle(CYCLE_INTERVAL);
      }

      isCycling = !isCycling;
    }

    function readAssets() {
      return window.assets.isEnabled();
    }

    function writeAssets() {
      window.assets.toggle();
    }

    function readPersist() {
      return window.storage.isEnabled();
    }

    function writePersist() {
      window.storage.toggle();
    }

    function storageKeys() {
      var found = [];

      try {
        for (var i = 0; i < window.localStorage.length; i++) {
          var key = window.localStorage.key(i);

          if (key.indexOf(STORAGE_PREFIX) == 0) {
            found.push(key);
          }
        }
      } catch (error) {
        return [];
      }

      return found;
    }

    function wipeStorage() {
      var doomed = storageKeys();

      for (var i = 0; i < doomed.length; i++) {
        window.localStorage.removeItem(doomed[i]);
      }

      window.vault.clear();

      return doomed.length;
    }

    function makeDangerRow() {
      var aRow = makeRow("reset storage");
      var aButton = makeButton("reset", null);
      var isArmed = false;
      var armTimer = 0;

      aButton.style.color = DANGER_COLOR;
      aButton.style.borderColor = DANGER_COLOR;

      function disarm() {
        isArmed = false;

        aButton.textContent = "reset";

        if (armTimer != 0) {
          clearTimeout(armTimer);

          armTimer = 0;
        }
      }

      function onClick() {
        if (!isArmed) {
          isArmed = true;

          aButton.textContent = "confirm?";

          armTimer = setTimeout(disarm, ARM_TIMEOUT);

          return;
        }

        disarm();
        wipeStorage();

        window.location.reload();
      }

      aButton.addEventListener("click", onClick);

      aRow.appendChild(aButton);

      return aRow;
    }

    function fillBackground(aPage) {
      var backgroundSelect = makeSelect(
        window.backgrounds.list(),
        window.backgrounds.current(),
        window.backgrounds.select
      );

      var backgroundRow = makeRow("wallpaper");

      backgroundRow.appendChild(backgroundSelect);

      function onNext() {
        window.backgrounds.next();

        backgroundSelect.value = window.backgrounds.current();
      }

      aPage.appendChild(backgroundRow);
      aPage.appendChild(makeActionRow("shuffle", "next", onNext));
      aPage.appendChild(makeToggleRow("auto cycle", readCycling, writeCycling));
    }

    function paletteNames() {
      var found = window.theme.list();
      var saved = window.themes.list();

      for (var i = 0; i < saved.length; i++) {
        var isKnown = false;

        for (var j = 0; j < found.length; j++) {
          if (found[j] == saved[i]) {
            isKnown = true;
          }
        }

        if (!isKnown) {
          found.push(saved[i]);
        }
      }

      return found;
    }

    function currentPalette() {
      var active = window.themes.current();

      if (active != "") {
        return active;
      }

      return window.theme.current();
    }

    function fillTheme(aPage) {
      var themeRow = makeRow("palette");
      var themeSelect = makeSelect(paletteNames(), currentPalette(), window.themes.apply);

      function paint() {
        fillOptions(themeSelect, paletteNames(), currentPalette());
      }

      painters.push(paint);

      themeRow.appendChild(themeSelect);

      aPage.appendChild(themeRow);
    }

    function fillShell(aPage) {
      function onReload() {
        window.location.reload();
      }

      aPage.appendChild(makeToggleRow("top bar", readTopBar, writeTopBar));
      aPage.appendChild(makeToggleRow("fullscreen", readFullscreen, writeFullscreen));
      aPage.appendChild(makeActionRow("session", "reload", onReload));
    }

    function fillDanger(aPage) {
      aPage.appendChild(makeToggleRow("asset cache", readAssets, writeAssets));
      aPage.appendChild(makeToggleRow("save data", readPersist, writePersist));
      aPage.appendChild(makeDangerRow());
    }

    function fill(aSheet) {
      var pages = [
        { name: "background", fill: fillBackground, tone: ACCENT_COLOR },
        { name: "theme", fill: fillTheme, tone: ACCENT_COLOR },
        { name: "shell", fill: fillShell, tone: ACCENT_COLOR },
        { name: "danger", fill: fillDanger, tone: DANGER_COLOR }
      ];

      var strip = makeStrip();
      var panel = makePanel();
      var tabs = [];
      var sheets = [];

      function select(index) {
        for (var i = 0; i < pages.length; i++) {
          var isActive = i == index;

          sheets[i].style.display = isActive ? "block" : "none";

          if (isActive) {
            tabs[i].style.color = pages[i].tone;
            tabs[i].style.borderBottomColor = pages[i].tone;
          } else {
            tabs[i].style.color = MUTED_COLOR;
            tabs[i].style.borderBottomColor = "transparent";
          }
        }
      }

      for (var i = 0; i < pages.length; i++) {
        var aPage = document.createElement("div");

        pages[i].fill(aPage);

        panel.appendChild(aPage);
        sheets.push(aPage);

        var aTab = makeTab(pages[i].name, (function (index) {
          return function () {
            select(index);
          };
        })(i));

        strip.appendChild(aTab);
        tabs.push(aTab);
      }

      select(0);

      aSheet.appendChild(strip);
      aSheet.appendChild(panel);
    }

    function open() {
      if (isOpen()) {
        window.desktops.move(configWindow, window.desktops.current());

        return configWindow;
      }

      painters = [];

      configWindow = window.makeWindow(WINDOW_WIDTH, WINDOW_HEIGHT);

      configWindow.titleBar.appendChild(makeTitle("config"));

      var aSheet = makeSheet();

      fill(aSheet);

      configWindow.content.appendChild(aSheet);

      return configWindow;
    }

    function close() {
      if (!isOpen()) {
        return false;
      }

      configWindow.close();
      configWindow = null;

      painters = [];

      return true;
    }

    function toggle() {
      if (isOpen()) {
        close();
      } else {
        open();
      }
    }

    function onFullscreenChange() {
      if (isOpen()) {
        refresh();
      }
    }

    function onThemesChange() {
      if (isOpen()) {
        refresh();
      }
    }

    document.addEventListener("fullscreenchange", onFullscreenChange);

    window.themes.watch(onThemesChange);

    return {
      open: open,
      close: close,
      toggle: toggle,
      isOpen: isOpen,
      refresh: refresh
    };
  }

  var config = makeConfig();

  window.makeConfig = makeConfig;
  window.config = config;
})();
