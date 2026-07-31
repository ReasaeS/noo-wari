(function () {
  var TITLE_BAR_HEIGHT = 26;
  var BUTTON_SIZE = 14;
  var RESIZE_MARGIN = 8;
  var MIN_WIDTH = 120;
  var MIN_HEIGHT = TITLE_BAR_HEIGHT + 20;

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
    setProp("backgroundColor", "#2f2f2f");
    setProp("borderBottomStyle", "solid");
    setProp("borderColor", "black");
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
    setProp("boxSizing", "border-box");
    setProp("overflow", "auto");

    aContent.styler = styler;

    return aContent;
  }

  function makeDraggable(aWindow, windowStyler, aHandle, onDragStart) {
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
      }

      function onUp() {
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
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

  function makeWindow() {
    var aWindow = document.createElement("div");

    var styler = makeStyler(aWindow);
    var setProp = styler.setProp;

    setProp("width", window.innerWidth * 0.7, "px");
    setProp("height", window.innerHeight * 0.7, "px");
    setProp("backgroundColor", "blue");
    setProp("position", "absolute");
    setProp("transform", "translate(-50%, -50%)");
    setProp("left", 50, "%");
    setProp("top", 50, "%");
    setProp("borderStyle", "solid");
    setProp("borderWidth", 2, "px");
    setProp("borderRadius", 5, "px");
    setProp("borderColor", "black")
    setProp("boxSizing", "border-box");
    setProp("overflow", "hidden");
    setProp("display", "block");

    var isClosed = false;
    var isMinimized = false;
    var isMaximized = false;
    var savedDisplay = "block";
    var savedSize = new Object();

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

      isClosed = true;
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

      savedDisplay = styler.getProp("display");

      setProp("display", "none");

      isMinimized = true;
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
        return;
      }

      savedSize.width = styler.getProp("width");
      savedSize.widthUnit = styler.getUnit("width");
      savedSize.height = styler.getProp("height");
      savedSize.heightUnit = styler.getUnit("height");
      savedSize.left = styler.getProp("left");
      savedSize.leftUnit = styler.getUnit("left");
      savedSize.top = styler.getProp("top");
      savedSize.topUnit = styler.getUnit("top");

      setProp("width", window.innerWidth, "px");
      setProp("height", window.innerHeight, "px");
      setProp("left", 50, "%");
      setProp("top", 50, "%");

      isMaximized = true;
    }

    var titleBar = makeTitleBar();

    titleBar.appendChild(makeButton("red", close));
    titleBar.appendChild(makeButton("yellow", minimize));
    titleBar.appendChild(makeButton("green", maximize));

    var content = makeContent();

    aWindow.appendChild(titleBar);
    aWindow.appendChild(content);

    function unmaximize() {
      isMaximized = false;
    }

    makeDraggable(aWindow, styler, titleBar, unmaximize);

    for (var i = 0; i < EDGES.length; i++) {
      aWindow.appendChild(makeResizer(aWindow, styler, EDGES[i], unmaximize));
    }

    aWindow.titleBar = titleBar;
    aWindow.content = content;
    aWindow.close = close;
    aWindow.minimize = minimize;
    aWindow.maximize = maximize;

    document.body.appendChild(aWindow);

    return aWindow;
  }

  window.makeWindow = makeWindow;
})();

makeWindow();