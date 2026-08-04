(function () {
  var TEXT_COLOR = "var(--nw-text)";
  var MUTED_COLOR = "var(--nw-muted)";
  var ACCENT_COLOR = "var(--nw-accent)";
  var BORDER_COLOR = "var(--nw-tertiary)";
  var PANEL_COLOR = "var(--nw-primary)";
  var FIELD_COLOR = "var(--nw-field)";
  var SELECT_COLOR = "var(--nw-select)";
  var SURFACE_COLOR = "var(--nw-secondary)";
  var DANGER_COLOR = "var(--nw-danger)";
  var WARN_COLOR = "var(--nw-warn)";

  var FONT_FAMILY = "\"JetBrainsMono Nerd Font\", \"JetBrains Mono\", \"Fira Code\", monospace";

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

  function makeToolbar() {
    var aToolbar = document.createElement("div");
    var toolbarStyle = aToolbar.style;

    toolbarStyle.display = "flex";
    toolbarStyle.alignItems = "center";
    toolbarStyle.flexShrink = 0;
    toolbarStyle.gap = "6px";
    toolbarStyle.padding = "7px 10px";
    toolbarStyle.backgroundColor = PANEL_COLOR;
    toolbarStyle.borderBottomStyle = "solid";
    toolbarStyle.borderBottomWidth = "1px";
    toolbarStyle.borderBottomColor = BORDER_COLOR;

    return aToolbar;
  }

  function makeStage() {
    var aStage = document.createElement("div");
    var stageStyle = aStage.style;

    stageStyle.flexGrow = 1;
    stageStyle.minHeight = 0;
    stageStyle.overflow = "auto";
    stageStyle.padding = "10px";
    stageStyle.boxSizing = "border-box";

    return aStage;
  }

  function makeCenter() {
    var aCenter = makeStage();
    var centerStyle = aCenter.style;

    centerStyle.display = "flex";
    centerStyle.alignItems = "center";
    centerStyle.justifyContent = "center";

    return aCenter;
  }

  function makeButton(label, onClick) {
    var aButton = document.createElement("button");
    var buttonStyle = aButton.style;

    aButton.textContent = label;
    aButton.type = "button";

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
    buttonStyle.flexShrink = 0;

    if (typeof onClick == "function") {
      aButton.addEventListener("click", onClick);
    }

    return aButton;
  }

  function makeLabel(text) {
    var aLabel = document.createElement("span");
    var labelStyle = aLabel.style;

    aLabel.textContent = text;

    labelStyle.color = MUTED_COLOR;
    labelStyle.fontSize = "11px";
    labelStyle.flexShrink = 0;

    return aLabel;
  }

  function makeValue(text) {
    var aValue = document.createElement("span");
    var valueStyle = aValue.style;

    aValue.textContent = text;

    valueStyle.color = ACCENT_COLOR;
    valueStyle.fontSize = "12px";
    valueStyle.flexShrink = 0;

    return aValue;
  }

  function makeSpacer() {
    var aSpacer = document.createElement("span");

    aSpacer.style.flexGrow = 1;

    return aSpacer;
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

    selectStyle.padding = "3px 6px";
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

  function makeInput(placeholder, onEnter) {
    var anInput = document.createElement("input");
    var inputStyle = anInput.style;

    anInput.type = "text";
    anInput.spellcheck = false;

    if (typeof placeholder == "string") {
      anInput.placeholder = placeholder;
    }

    inputStyle.flexGrow = 1;
    inputStyle.minWidth = "40px";
    inputStyle.padding = "4px 8px";
    inputStyle.backgroundColor = FIELD_COLOR;
    inputStyle.borderStyle = "solid";
    inputStyle.borderWidth = "1px";
    inputStyle.borderColor = BORDER_COLOR;
    inputStyle.borderRadius = "4px";
    inputStyle.outlineStyle = "none";
    inputStyle.color = TEXT_COLOR;
    inputStyle.fontFamily = FONT_FAMILY;
    inputStyle.fontSize = "12px";

    function onKeyDown(event) {
      if (event.key == "Enter") {
        onEnter(anInput.value);
      }
    }

    if (typeof onEnter == "function") {
      anInput.addEventListener("keydown", onKeyDown);
    }

    return anInput;
  }

  function makeRange(min, max, value, onChange) {
    var aRange = document.createElement("input");
    var rangeStyle = aRange.style;

    aRange.type = "range";
    aRange.min = min;
    aRange.max = max;
    aRange.value = value;

    rangeStyle.width = "110px";
    rangeStyle.accentColor = ACCENT_COLOR;
    rangeStyle.cursor = "pointer";
    rangeStyle.flexShrink = 0;

    function onInput() {
      onChange(Number(aRange.value));
    }

    aRange.addEventListener("input", onInput);

    return aRange;
  }

  function makeCanvas() {
    var aCanvas = document.createElement("canvas");
    var canvasStyle = aCanvas.style;

    canvasStyle.display = "block";
    canvasStyle.imageRendering = "pixelated";
    canvasStyle.borderRadius = "4px";

    return aCanvas;
  }

  function clearElement(anElement) {
    while (anElement.firstChild) {
      anElement.removeChild(anElement.firstChild);
    }
  }

  function pad(amount, size) {
    var text = "" + amount;

    while (text.length < size) {
      text = "0" + text;
    }

    return text;
  }

  function makeApp(name, description, width, height, build, category) {
    var appWindow = null;
    var teardown = null;

    function isOpen() {
      return appWindow != null && appWindow.content != null;
    }

    function open() {
      if (isOpen()) {
        window.desktops.move(appWindow, window.desktops.current());
        window.desktops.focus(appWindow);

        return appWindow;
      }

      appWindow = window.makeWindow(width, height);

      appWindow.least(width);

      if (typeof window.device != "undefined" && window.device.isPhone()) {
        appWindow.snap("top");
      }

      appWindow.titleBar.appendChild(makeTitle(name));

      var aSheet = makeSheet();

      appWindow.content.appendChild(aSheet);

      teardown = build(aSheet, appWindow);

      function isInteractive(anElement) {
        var name = anElement.nodeName;

        return (
          name == "INPUT" ||
          name == "SELECT" ||
          name == "TEXTAREA" ||
          name == "BUTTON" ||
          name == "OPTION"
        );
      }

      function onWindowDown(event) {
        if (aSheet.tabIndex < 0 || isInteractive(event.target)) {
          return;
        }

        aSheet.focus();
      }

      appWindow.addEventListener("mousedown", onWindowDown);

      var originalClose = appWindow.close;

      function closeApp() {
        if (typeof teardown == "function") {
          teardown();
        }

        teardown = null;

        originalClose();
      }

      appWindow.close = closeApp;

      return appWindow;
    }

    function close() {
      if (!isOpen()) {
        return false;
      }

      appWindow.close();
      appWindow = null;

      return true;
    }

    window.launcher.register(name, description, open, category);

    return {
      open: open,
      close: close,
      isOpen: isOpen
    };
  }

  window.ui = {
    TEXT_COLOR: TEXT_COLOR,
    MUTED_COLOR: MUTED_COLOR,
    ACCENT_COLOR: ACCENT_COLOR,
    BORDER_COLOR: BORDER_COLOR,
    PANEL_COLOR: PANEL_COLOR,
    FIELD_COLOR: FIELD_COLOR,
    SURFACE_COLOR: SURFACE_COLOR,
    DANGER_COLOR: DANGER_COLOR,
    WARN_COLOR: WARN_COLOR,
    FONT_FAMILY: FONT_FAMILY,
    sheet: makeSheet,
    toolbar: makeToolbar,
    stage: makeStage,
    center: makeCenter,
    button: makeButton,
    label: makeLabel,
    value: makeValue,
    spacer: makeSpacer,
    select: makeSelect,
    input: makeInput,
    range: makeRange,
    canvas: makeCanvas,
    clear: clearElement,
    pad: pad
  };

  window.makeApp = makeApp;
})();
