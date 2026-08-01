(function () {
  var TEXT_COLOR = "#c5cad3";
  var MUTED_COLOR = "#7c848f";
  var ACCENT_COLOR = "#7fd18b";
  var BORDER_COLOR = "#3b414c";
  var FIELD_COLOR = "rgba(0, 0, 0, 0.22)";

  var FONT_FAMILY = "\"JetBrainsMono Nerd Font\", \"JetBrains Mono\", \"Fira Code\", monospace";
  var WINDOW_WIDTH = 460;
  var WINDOW_HEIGHT = 340;
  var CYCLE_INTERVAL = 30000;

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
    selectStyle.backgroundColor = FIELD_COLOR;
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

      aSheet.appendChild(makeHeading("shell"));
      aSheet.appendChild(makeToggleRow("top bar", readTopBar, writeTopBar));
      aSheet.appendChild(makeToggleRow("fullscreen", readFullscreen, writeFullscreen));
      aSheet.appendChild(makeActionRow("session", "reload", onReload));
    }

    function open() {
      if (isOpen()) {
        window.desktops.move(configWindow, window.desktops.current());

        return configWindow;
      }

      painters = [];

      configWindow = window.makeWindow();

      configWindow.style.width = WINDOW_WIDTH + "px";
      configWindow.style.height = WINDOW_HEIGHT + "px";

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
