(function () {
  var TITLE_BAR_HEIGHT = 26;
  var BUTTON_SIZE = 14;
  var RESIZE_MARGIN = 8;
  var MIN_WIDTH = 120;
  var MIN_HEIGHT = TITLE_BAR_HEIGHT + 20;

  var BORDER_COLOR = "var(--nw-tertiary)";
  var TITLE_BAR_COLOR = "var(--nw-primary)";
  var CONTENT_COLOR = "var(--nw-secondary)";
  var BUTTON_BORDER_COLOR = "rgba(0, 0, 0, 0.25)";
  var CLOSE_COLOR = "var(--nw-danger)";
  var MINIMIZE_COLOR = "var(--nw-warn)";
  var MAXIMIZE_COLOR = "var(--nw-ok)";
  var SCROLLBAR_HOVER_COLOR = "var(--nw-hover)";
  var FOCUS_COLOR = "var(--nw-focus)";

  var WINDOW_Z_BASE = 1;

  var SNAP_EDGE = 26;
  var GHOST_Z_INDEX = 900;

  var HUE_START = 145;
  var HUE_STEP = 137.508;
  var HUE_SATURATION = 45;
  var HUE_LIGHTNESS = 62;

  var SCROLLBAR_SIZE = 10;
  var SCROLLBAR_INSET = 2;
  var SCROLLBAR_RADIUS = 5;

  var CONTROL_TEXT_COLOR = "var(--nw-text)";
  var CONTROL_ACTIVE_COLOR = "var(--nw-accent)";
  var CONTROL_POPUP_COLOR = "var(--nw-primary)";

  var CONTROL_SOURCE =
    ":root {\n" +
    "  color-scheme: dark;\n" +
    "}\n" +
    "select {\n" +
    "  color: " + CONTROL_TEXT_COLOR + ";\n" +
    "}\n" +
    "select option {\n" +
    "  background-color: " + CONTROL_POPUP_COLOR + ";\n" +
    "  color: " + CONTROL_TEXT_COLOR + ";\n" +
    "}\n" +
    "select option:checked {\n" +
    "  background-color: " + BORDER_COLOR + ";\n" +
    "  color: " + CONTROL_ACTIVE_COLOR + ";\n" +
    "}\n" +
    "select option:disabled {\n" +
    "  color: " + SCROLLBAR_HOVER_COLOR + ";\n" +
    "}\n" +
    "input::placeholder, textarea::placeholder {\n" +
    "  color: " + SCROLLBAR_HOVER_COLOR + ";\n" +
    "}\n";

  var SCROLLBAR_SOURCE =
    "@supports not selector(::-webkit-scrollbar) {\n" +
    "  * {\n" +
    "    scrollbar-width: thin;\n" +
    "    scrollbar-color: " + BORDER_COLOR + " " + TITLE_BAR_COLOR + ";\n" +
    "  }\n" +
    "}\n" +
    "::-webkit-scrollbar {\n" +
    "  width: " + SCROLLBAR_SIZE + "px;\n" +
    "  height: " + SCROLLBAR_SIZE + "px;\n" +
    "}\n" +
    "::-webkit-scrollbar-track {\n" +
    "  background-color: " + TITLE_BAR_COLOR + ";\n" +
    "}\n" +
    "::-webkit-scrollbar-thumb {\n" +
    "  background-color: " + BORDER_COLOR + ";\n" +
    "  border: " + SCROLLBAR_INSET + "px solid " + TITLE_BAR_COLOR + ";\n" +
    "  border-radius: " + SCROLLBAR_RADIUS + "px;\n" +
    "  background-clip: padding-box;\n" +
    "}\n" +
    "::-webkit-scrollbar-thumb:hover {\n" +
    "  background-color: " + SCROLLBAR_HOVER_COLOR + ";\n" +
    "}\n" +
    "::-webkit-scrollbar-corner {\n" +
    "  background-color: " + TITLE_BAR_COLOR + ";\n" +
    "}\n";

  var EDGES = [
    { name: "n", xFactor: 0, yFactor: -1, cursor: "ns-resize" },
    { name: "s", xFactor: 0, yFactor: 1, cursor: "ns-resize" },
    { name: "w", xFactor: -1, yFactor: 0, cursor: "ew-resize" },
    { name: "e", xFactor: 1, yFactor: 0, cursor: "ew-resize" },
    { name: "nw", xFactor: -1, yFactor: -1, cursor: "nwse-resize" },
    { name: "se", xFactor: 1, yFactor: 1, cursor: "nwse-resize" },
    { name: "ne", xFactor: 1, yFactor: -1, cursor: "nesw-resize" },
    { name: "sw", xFactor: -1, yFactor: 1, cursor: "nesw-resize" }
  ];

  var windows = [];
  var activeDesktop = 0;
  var activeWindow = null;
  var windowCount = 0;

  function makeWindowColor() {
    var hue = (HUE_START + windowCount * HUE_STEP) % 360;

    windowCount = windowCount + 1;

    return "hsl(" + Math.round(hue) + ", " + HUE_SATURATION + "%, " + HUE_LIGHTNESS + "%)";
  }

  function indexOfWindow(aWindow) {
    for (var i = 0; i < windows.length; i++) {
      if (windows[i] == aWindow) {
        return i;
      }
    }

    return -1;
  }

  function selectDesktop(index) {
    activeDesktop = index;

    for (var i = 0; i < windows.length; i++) {
      windows[i].present(windows[i].desktop == index);
    }

    return true;
  }

  function currentDesktop() {
    return activeDesktop;
  }

  function currentWindow() {
    return activeWindow;
  }

  function paintStack() {
    for (var i = 0; i < windows.length; i++) {
      windows[i].setStack(WINDOW_Z_BASE + windows.length - 1 - i);
      windows[i].paintFocus(windows[i] == activeWindow);
    }
  }

  function focusWindow(aWindow) {
    var index = indexOfWindow(aWindow);

    if (index == -1) {
      return false;
    }

    windows.splice(index, 1);
    windows.unshift(aWindow);

    activeWindow = aWindow;

    paintStack();

    return true;
  }

  function listWindows(index) {
    var found = [];

    for (var i = 0; i < windows.length; i++) {
      if (typeof index == "undefined" || windows[i].desktop == index) {
        found.push(windows[i]);
      }
    }

    return found;
  }

  function moveWindow(aWindow, index) {
    if (indexOfWindow(aWindow) == -1) {
      return false;
    }

    aWindow.desktop = index;

    aWindow.present(index == activeDesktop);

    return true;
  }

  function makeThemeStyle() {
    var aStyle = document.createElement("style");

    aStyle.textContent = SCROLLBAR_SOURCE + CONTROL_SOURCE;

    document.head.appendChild(aStyle);

    return aStyle;
  }

  function makeStyler(anElement) {
    var elementStyle = anElement.style;
    var shadowElement = new Object();

    function setProp(prop, amount, unit) {
      if (typeof unit == "undefined") {
        unit = "";
      }

      elementStyle[prop] = amount + unit;
      shadowElement[prop] = amount;
      shadowElement[prop + "Unit"] = unit;
    }

    function getProp(prop) {
      return shadowElement[prop];
    }

    function getUnit(prop) {
      return shadowElement[prop + "Unit"];
    }

    return {
      setProp: setProp,
      getProp: getProp,
      getUnit: getUnit
    };
  }

  function makeButton(color, onClick) {
    var aButton = document.createElement("div");
    var setProp = makeStyler(aButton).setProp;

    setProp("width", BUTTON_SIZE, "px");
    setProp("height", BUTTON_SIZE, "px");
    setProp("backgroundColor", color);
    setProp("borderStyle", "solid");
    setProp("borderColor", BUTTON_BORDER_COLOR);
    setProp("borderWidth", 1, "px");
    setProp("borderRadius", 50, "%");
    setProp("boxSizing", "border-box");
    setProp("display", "inline-block");
    setProp("flexShrink", 0);
    setProp("marginRight", 6, "px");
    setProp("cursor", "pointer");
    setProp("position", "relative");
    setProp("zIndex", 3);

    aButton.addEventListener("click", onClick);

    return aButton;
  }

  function makeTitleBar() {
    var aTitleBar = document.createElement("div");
    var setProp = makeStyler(aTitleBar).setProp;

    setProp("height", TITLE_BAR_HEIGHT, "px");
    setProp("backgroundColor", TITLE_BAR_COLOR);
    setProp("borderBottomStyle", "solid");
    setProp("borderColor", BORDER_COLOR);
    setProp("borderWidth", 2, "px");
    setProp("boxSizing", "border-box");
    setProp("display", "flex");
    setProp("alignItems", "center");
    setProp("paddingLeft", 6, "px");
    setProp("userSelect", "none");
    setProp("cursor", "move");

    return aTitleBar;
  }

  function makeContent() {
    var aContent = document.createElement("div");
    var styler = makeStyler(aContent);
    var setProp = styler.setProp;

    setProp("display", "block");
    setProp("width", 100, "%");
    setProp("height", "calc(100% - " + TITLE_BAR_HEIGHT + "px)");
    setProp("backgroundColor", CONTENT_COLOR);
    setProp("boxSizing", "border-box");
    setProp("overflow", "auto");

    aContent.styler = styler;

    return aContent;
  }

  function barHeight() {
    if (typeof window.topbar == "undefined" || window.topbar == null) {
      return 0;
    }

    if (window.topbar.element == null) {
      return 0;
    }

    if (window.topbar.element.style.display == "none") {
      return 0;
    }

    return window.topbar.height();
  }

  function barSide() {
    if (typeof window.layout == "undefined") {
      return "top";
    }

    return window.layout.bar();
  }

  function workArea() {
    var edge = barHeight();
    var top = barSide() == "bottom" ? 0 : edge;

    return {
      left: 0,
      top: top,
      width: window.innerWidth,
      height: window.innerHeight - edge
    };
  }

  function sideAt(x, y) {
    var area = workArea();

    if (x <= area.left + SNAP_EDGE) {
      return "left";
    }

    if (x >= area.left + area.width - SNAP_EDGE) {
      return "right";
    }

    if (y <= area.top + SNAP_EDGE) {
      return "top";
    }

    if (y >= area.top + area.height - SNAP_EDGE) {
      return "bottom";
    }

    return "";
  }

  function snapBox(side) {
    var area = workArea();

    var wide = area.width;
    var tall = area.height;
    var left = area.left;
    var top = area.top;

    if (side == "left") {
      return { width: wide / 2, height: tall, left: left + wide / 4, top: top + tall / 2 };
    }

    if (side == "right") {
      return { width: wide / 2, height: tall, left: left + wide * 0.75, top: top + tall / 2 };
    }

    if (side == "top") {
      return { width: wide, height: tall, left: left + wide / 2, top: top + tall / 2 };
    }

    if (side == "bottom") {
      return { width: wide, height: tall / 2, left: left + wide / 2, top: top + tall * 0.75 };
    }

    return null;
  }

  var ghost = null;

  function showGhost(side) {
    var box = snapBox(side);

    if (box == null) {
      hideGhost();

      return;
    }

    if (ghost == null) {
      ghost = document.createElement("div");

      var ghostStyle = ghost.style;

      ghostStyle.position = "fixed";
      ghostStyle.boxSizing = "border-box";
      ghostStyle.pointerEvents = "none";
      ghostStyle.borderStyle = "solid";
      ghostStyle.borderWidth = "2px";
      ghostStyle.borderColor = "var(--nw-accent)";
      ghostStyle.borderRadius = "5px";
      ghostStyle.backgroundColor = "var(--nw-active)";
      ghostStyle.zIndex = GHOST_Z_INDEX;

      document.body.appendChild(ghost);
    }

    ghost.style.display = "block";
    ghost.style.width = box.width + "px";
    ghost.style.height = box.height + "px";
    ghost.style.left = box.left - box.width / 2 + "px";
    ghost.style.top = box.top - box.height / 2 + "px";
  }

  function hideGhost() {
    if (ghost == null) {
      return;
    }

    ghost.style.display = "none";
  }

  function makeDraggable(aWindow, windowStyler, aHandle, onDragStart, onDragEnd) {
    function startDrag(event) {
      if (event.target != aHandle) {
        return;
      }

      event.preventDefault();

      var box = aWindow.getBoundingClientRect();

      var startX = event.clientX;
      var startY = event.clientY;
      var startLeft = box.left + box.width / 2 + window.scrollX;
      var startTop = box.top + box.height / 2 + window.scrollY;

      function onMove(moveEvent) {
        windowStyler.setProp("left", startLeft + (moveEvent.clientX - startX), "px");
        windowStyler.setProp("top", startTop + (moveEvent.clientY - startY), "px");

        showGhost(sideAt(moveEvent.clientX, moveEvent.clientY));
      }

      function onUp(upEvent) {
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);

        hideGhost();

        onDragEnd(sideAt(upEvent.clientX, upEvent.clientY));
      }

      onDragStart();

      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    }

    aHandle.addEventListener("mousedown", startDrag);

    return aHandle;
  }

  function makeResizer(aWindow, windowStyler, edge, onResizeStart) {    var aResizer = document.createElement("div");
    var setProp = makeStyler(aResizer).setProp;

    var name = edge.name;
    var isCorner = edge.xFactor != 0 && edge.yFactor != 0;

    setProp("position", "absolute");
    setProp("cursor", edge.cursor);
    setProp("zIndex", isCorner ? 2 : 1);

    if (name.indexOf("n") != -1) {
      setProp("top", 0, "px");
    }

    if (name.indexOf("s") != -1) {
      setProp("bottom", 0, "px");
    }

    if (name.indexOf("w") != -1) {
      setProp("left", 0, "px");
    }

    if (name.indexOf("e") != -1) {
      setProp("right", 0, "px");
    }

    if (edge.xFactor == 0) {
      setProp("left", 0, "px");
      setProp("width", 100, "%");
    } else {
      setProp("width", RESIZE_MARGIN, "px");
    }

    if (edge.yFactor == 0) {
      setProp("top", 0, "px");
      setProp("height", 100, "%");
    } else {
      setProp("height", RESIZE_MARGIN, "px");
    }

    function startResize(event) {
      event.preventDefault();

      var box = aWindow.getBoundingClientRect();

      var startX = event.clientX;
      var startY = event.clientY;
      var startWidth = box.width;
      var startHeight = box.height;
      var startLeft = box.left + box.width / 2 + window.scrollX;
      var startTop = box.top + box.height / 2 + window.scrollY;

      function onMove(moveEvent) {
        var newWidth = 0;
        var newHeight = 0;

        if (edge.xFactor != 0) {
          newWidth = startWidth + edge.xFactor * (moveEvent.clientX - startX);

          if (newWidth < MIN_WIDTH) {
            newWidth = MIN_WIDTH;
          }

          windowStyler.setProp("width", newWidth, "px");
          windowStyler.setProp(
            "left",
            startLeft + (edge.xFactor * (newWidth - startWidth)) / 2,
            "px"
          );
        }

        if (edge.yFactor != 0) {
          newHeight = startHeight + edge.yFactor * (moveEvent.clientY - startY);

          if (newHeight < MIN_HEIGHT) {
            newHeight = MIN_HEIGHT;
          }

          windowStyler.setProp("height", newHeight, "px");
          windowStyler.setProp(
            "top",
            startTop + (edge.yFactor * (newHeight - startHeight)) / 2,
            "px"
          );
        }
      }

      function onUp() {
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
      }

      onResizeStart();

      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    }

    aResizer.addEventListener("mousedown", startResize);

    return aResizer;
  }

  function makeWindow(width, height) {
    var aWindow = document.createElement("div");

    var styler = makeStyler(aWindow);
    var setProp = styler.setProp;

    if (typeof width == "undefined") {
      width = window.innerWidth * 0.7;
    }

    if (typeof height == "undefined") {
      height = window.innerHeight * 0.7;
    }

    setProp("width", width, "px");
    setProp("height", height, "px");
    setProp("position", "absolute");
    setProp("transform", "translate(-50%, -50%)");
    setProp("left", 50, "%");
    setProp("top", 50, "%");
    setProp("borderStyle", "solid");
    setProp("borderWidth", 2, "px");
    setProp("borderRadius", 5, "px");
    setProp("borderColor", BORDER_COLOR);
    setProp("boxSizing", "border-box");
    setProp("overflow", "hidden");
    setProp("display", "block");

    var isClosed = false;
    var isMinimized = false;
    var isMaximized = false;
    var snapSide = "";
    var savedDisplay = "block";
    var savedSize = new Object();

    function present(isVisible) {
      if (isClosed) {
        return;
      }

      if (isVisible && !isMinimized) {
        setProp("display", savedDisplay);
      } else {
        setProp("display", "none");
      }
    }

    function setStack(depth) {
      if (isClosed) {
        return;
      }

      setProp("zIndex", depth);
    }

    function paintFocus(isFocused) {
      if (isClosed) {
        return;
      }

      if (isFocused) {
        setProp("borderColor", FOCUS_COLOR);
      } else {
        setProp("borderColor", BORDER_COLOR);
      }
    }

    function restore() {
      if (isClosed || !isMinimized) {
        return;
      }

      minimize();
    }

    function close() {
      if (isClosed) {
        return;
      }

      while (aWindow.firstChild) {
        aWindow.removeChild(aWindow.firstChild);
      }

      aWindow.remove();
      aWindow.titleBar = null;
      aWindow.content = null;

      var index = indexOfWindow(aWindow);

      if (index != -1) {
        windows.splice(index, 1);
      }

      if (activeWindow == aWindow) {
        activeWindow = null;
      }

      isClosed = true;

      paintStack();
    }

    function minimize() {
      if (isClosed) {
        return;
      }

      if (isMinimized) {
        setProp("display", savedDisplay);

        isMinimized = false;
        return;
      }

      if (styler.getProp("display") != "none") {
        savedDisplay = styler.getProp("display");
      }

      setProp("display", "none");

      isMinimized = true;
    }

    function remember() {
      savedSize.width = styler.getProp("width");
      savedSize.widthUnit = styler.getUnit("width");
      savedSize.height = styler.getProp("height");
      savedSize.heightUnit = styler.getUnit("height");
      savedSize.left = styler.getProp("left");
      savedSize.leftUnit = styler.getUnit("left");
      savedSize.top = styler.getProp("top");
      savedSize.topUnit = styler.getUnit("top");
    }

    function applyBox(box) {
      setProp("width", box.width, "px");
      setProp("height", box.height, "px");
      setProp("left", box.left, "px");
      setProp("top", box.top, "px");
    }

    function fullBox() {
      var area = workArea();

      return {
        width: area.width,
        height: area.height,
        left: area.left + area.width / 2,
        top: area.top + area.height / 2
      };
    }

    function maximize() {
      if (isClosed) {
        return;
      }

      if (isMinimized) {
        minimize();
      }

      if (isMaximized) {
        setProp("width", savedSize.width, savedSize.widthUnit);
        setProp("height", savedSize.height, savedSize.heightUnit);
        setProp("left", savedSize.left, savedSize.leftUnit);
        setProp("top", savedSize.top, savedSize.topUnit);

        isMaximized = false;
        snapSide = "";

        return;
      }

      remember();
      applyBox(fullBox());

      isMaximized = true;
      snapSide = "full";
    }

    function snap(side) {
      if (isClosed) {
        return false;
      }

      var box = snapBox(side);

      if (box == null) {
        return false;
      }

      if (isMinimized) {
        minimize();
      }

      if (!isMaximized) {
        remember();
      }

      applyBox(box);

      isMaximized = true;
      snapSide = side;

      return true;
    }

    function tuck() {
      if (isClosed || isMinimized) {
        return false;
      }

      minimize();

      return true;
    }

    function refit() {
      if (isClosed || snapSide == "") {
        return false;
      }

      if (snapSide == "full") {
        applyBox(fullBox());

        return true;
      }

      var box = snapBox(snapSide);

      if (box == null) {
        return false;
      }

      applyBox(box);

      return true;
    }

    var titleBar = makeTitleBar();

    function closeWindow() {
      aWindow.close();
    }

    function minimizeWindow() {
      aWindow.minimize();
    }

    function maximizeWindow() {
      aWindow.maximize();
    }

    titleBar.appendChild(makeButton(CLOSE_COLOR, closeWindow));
    titleBar.appendChild(makeButton(MINIMIZE_COLOR, minimizeWindow));
    titleBar.appendChild(makeButton(MAXIMIZE_COLOR, maximizeWindow));

    var content = makeContent();

    aWindow.appendChild(titleBar);
    aWindow.appendChild(content);

    function unmaximize() {
      isMaximized = false;
      snapSide = "";
    }

    function onDropped(side) {
      if (side == "") {
        return;
      }

      snap(side);
    }

    makeDraggable(aWindow, styler, titleBar, unmaximize, onDropped);

    for (var i = 0; i < EDGES.length; i++) {
      aWindow.appendChild(makeResizer(aWindow, styler, EDGES[i], unmaximize));
    }

    aWindow.titleBar = titleBar;
    aWindow.content = content;
    aWindow.close = close;
    aWindow.minimize = minimize;
    aWindow.maximize = maximize;
    aWindow.snap = snap;
    aWindow.refit = refit;
    aWindow.present = present;
    aWindow.setStack = setStack;
    aWindow.paintFocus = paintFocus;
    aWindow.restore = restore;
    aWindow.tuck = tuck;
    aWindow.desktop = activeDesktop;
    aWindow.color = makeWindowColor();

    function onMouseDown() {
      focusWindow(aWindow);
    }

    aWindow.addEventListener("mousedown", onMouseDown);

    windows.push(aWindow);

    document.body.appendChild(aWindow);

    focusWindow(aWindow);

    return aWindow;
  }

  makeThemeStyle();

  function sideForKey(key) {
    if (key == "ArrowLeft") {
      return "left";
    }

    if (key == "ArrowRight") {
      return "right";
    }

    if (key == "ArrowUp") {
      return "top";
    }

    if (key == "ArrowDown") {
      return "bottom";
    }

    return "";
  }

  function isTyping(anElement) {
    if (anElement == null) {
      return false;
    }

    var name = anElement.nodeName;

    if (name == "INPUT" || name == "TEXTAREA" || name == "SELECT") {
      return true;
    }

    return anElement.isContentEditable == true;
  }

  function onSnapKey(event) {
    if (!event.ctrlKey || event.altKey || event.metaKey || event.shiftKey) {
      return;
    }

    var side = sideForKey(event.key);

    if (side == "" || isTyping(event.target)) {
      return;
    }

    var aWindow = currentWindow();

    if (aWindow == null || typeof aWindow.snap != "function") {
      return;
    }

    if (aWindow.snap(side)) {
      event.preventDefault();
    }
  }

  function refitAll() {
    for (var i = 0; i < windows.length; i++) {
      if (typeof windows[i].refit == "function") {
        windows[i].refit();
      }
    }

    return true;
  }

  document.addEventListener("keydown", onSnapKey);

  window.addEventListener("resize", refitAll);

  window.makeWindow = makeWindow;
  window.desktops = {
    refit: refitAll,
    select: selectDesktop,
    current: currentDesktop,
    windows: listWindows,
    move: moveWindow,
    focus: focusWindow,
    focused: currentWindow
  };
})();
