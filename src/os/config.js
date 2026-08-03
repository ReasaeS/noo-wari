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

    sheetStyle.padding = "14px 16px";
    sheetStyle.fontFamily = FONT_FAMILY;
    sheetStyle.fontSize = "13px";
    sheetStyle.color = TEXT_COLOR;

    return aSheet;
  }

  function makeHeading(text) {
    var aHeading = document.createElement("div");
    var headingStyle = aHeading.style;

    aHeading.textContent = text;

    headingStyle.marginTop = "14px";
    headingStyle.marginBottom = "2px";
    headingStyle.fontSize = "10px";
    headingStyle.letterSpacing = "1px";
    headingStyle.textTransform = "uppercase";
    headingStyle.color = MUTED_COLOR;

    return aHeading;
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

  function makeSelect(names, value, onChange) {
    var aSelect = document.createElement("select");
    var selectStyle = aSelect.style;

    for (var i = 0; i < names.length; i++) {
      var anOption = document.createElement("option");

      anOption.value = names[i];
      anOption.textContent = names[i];

      aSelect.appendChild(anOption);
    }

    aSelect.value = value;

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

    function fill(aSheet) {
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

      aSheet.appendChild(makeHeading("background"));
      aSheet.appendChild(backgroundRow);
      aSheet.appendChild(makeActionRow("shuffle", "next", onNext));
      aSheet.appendChild(makeToggleRow("auto cycle", readCycling, writeCycling));

      function onReload() {
        window.location.reload();
      }

      var themeRow = makeRow("palette");

      themeRow.appendChild(
        makeSelect(window.theme.list(), window.theme.current(), window.theme.select)
      );

      aSheet.appendChild(makeHeading("theme"));
      aSheet.appendChild(themeRow);

      var armTimer = 0;

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

      aSheet.appendChild(makeHeading("shell"));
      aSheet.appendChild(makeToggleRow("top bar", readTopBar, writeTopBar));
      aSheet.appendChild(makeToggleRow("fullscreen", readFullscreen, writeFullscreen));
      aSheet.appendChild(makeActionRow("session", "reload", onReload));

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

      aSheet.appendChild(makeHeading("danger"));
      aSheet.appendChild(makeToggleRow("asset cache", readAssets, writeAssets));
      aSheet.appendChild(makeToggleRow("save data", readPersist, writePersist));
      aSheet.appendChild(makeDangerRow());
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

    document.addEventListener("fullscreenchange", onFullscreenChange);

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
