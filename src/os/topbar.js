(function () {
  var BAR_HEIGHT = 28;
  var BAR_COLOR = "var(--nw-bar)";
  var BORDER_COLOR = "var(--nw-tertiary)";
  var TEXT_COLOR = "var(--nw-text)";
  var MUTED_COLOR = "var(--nw-muted)";
  var PILL_COLOR = "var(--nw-field)";

  var ACCENT_GREEN = "var(--nw-accent)";

  var FONT_FAMILY = "\"JetBrainsMono Nerd Font\", \"JetBrains Mono\", \"Fira Code\", monospace";
  var FONT_SIZE = 12;
  var GAP = 8;
  var PADDING = 10;
  var TICK_INTERVAL = 1000;
  var BAR_Z_INDEX = 1000;

  var WORKSPACES = ["1", "2", "3", "4", "5"];

  function pad(amount) {
    if (amount < 10) {
      return "0" + amount;
    }

    return "" + amount;
  }

  function readDate() {
    var now = new Date();

    return now.getFullYear() + "-" + pad(now.getMonth() + 1) + "-" + pad(now.getDate());
  }

  function readClock() {
    var now = new Date();

    return pad(now.getHours()) + ":" + pad(now.getMinutes()) + ":" + pad(now.getSeconds());
  }

  function makeBar() {
    var aBar = document.createElement("div");
    var barStyle = aBar.style;

    barStyle.position = "fixed";
    barStyle.left = "0px";
    barStyle.top = "0px";
    barStyle.width = "100%";
    barStyle.height = BAR_HEIGHT + "px";
    barStyle.boxSizing = "border-box";
    barStyle.display = "flex";
    barStyle.alignItems = "center";
    barStyle.padding = "0px " + PADDING + "px";
    barStyle.backgroundColor = BAR_COLOR;
    barStyle.borderBottomStyle = "solid";
    barStyle.borderBottomWidth = "1px";
    barStyle.borderBottomColor = BORDER_COLOR;
    barStyle.backdropFilter = "blur(8px)";
    barStyle.webkitBackdropFilter = "blur(8px)";
    barStyle.fontFamily = FONT_FAMILY;
    barStyle.fontSize = FONT_SIZE + "px";
    barStyle.color = TEXT_COLOR;
    barStyle.userSelect = "none";
    barStyle.zIndex = BAR_Z_INDEX;

    return aBar;
  }

  function makeSection(justify, grow) {
    var aSection = document.createElement("div");
    var sectionStyle = aSection.style;

    sectionStyle.display = "flex";
    sectionStyle.alignItems = "center";
    sectionStyle.flexBasis = "auto";
    sectionStyle.flexGrow = grow;
    sectionStyle.flexShrink = grow;
    sectionStyle.justifyContent = justify;
    sectionStyle.overflow = "hidden";
    sectionStyle.whiteSpace = "nowrap";

    return aSection;
  }

  function makeWorkspace(label, onClick) {
    var aWorkspace = document.createElement("div");
    var workspaceStyle = aWorkspace.style;

    aWorkspace.textContent = label;

    workspaceStyle.minWidth = "16px";
    workspaceStyle.height = "18px";
    workspaceStyle.lineHeight = "18px";
    workspaceStyle.textAlign = "center";
    workspaceStyle.padding = "0px 5px";
    workspaceStyle.marginRight = "4px";
    workspaceStyle.borderRadius = "4px";
    workspaceStyle.color = MUTED_COLOR;
    workspaceStyle.backgroundColor = "transparent";
    workspaceStyle.cursor = "pointer";

    aWorkspace.addEventListener("click", onClick);

    return aWorkspace;
  }

  function makeModule(label, color) {
    var aModule = document.createElement("div");
    var moduleStyle = aModule.style;

    var labelElement = document.createElement("span");
    var valueElement = document.createElement("span");

    labelElement.textContent = label;
    labelElement.style.color = color;
    labelElement.style.marginRight = "6px";

    valueElement.style.color = TEXT_COLOR;

    moduleStyle.display = "flex";
    moduleStyle.alignItems = "center";
    moduleStyle.padding = "2px 8px";
    moduleStyle.marginLeft = GAP + "px";
    moduleStyle.borderRadius = "4px";
    moduleStyle.backgroundColor = PILL_COLOR;

    aModule.appendChild(labelElement);
    aModule.appendChild(valueElement);

    aModule.labelElement = labelElement;
    aModule.valueElement = valueElement;

    return aModule;
  }

  function makeTitle() {
    var aTitle = document.createElement("span");
    var titleStyle = aTitle.style;

    titleStyle.color = MUTED_COLOR;
    titleStyle.overflow = "hidden";
    titleStyle.textOverflow = "ellipsis";
    titleStyle.whiteSpace = "nowrap";

    return aTitle;
  }

  function makeTopBar() {
    var aBar = makeBar();

    var leftSection = makeSection("flex-start", 0);
    var centerSection = makeSection("center", 1);
    var rightSection = makeSection("flex-end", 0);

    var titleElement = makeTitle();

    var workspaces = [];
    var modules = [];

    var activeIndex = 0;
    var tickTimer = 0;

    function paintWorkspaces() {
      for (var i = 0; i < workspaces.length; i++) {
        var workspaceStyle = workspaces[i].style;

        if (i == activeIndex) {
          workspaceStyle.color = "var(--nw-primary)";
          workspaceStyle.backgroundColor = ACCENT_GREEN;
        } else {
          workspaceStyle.color = MUTED_COLOR;
          workspaceStyle.backgroundColor = "transparent";
        }
      }
    }

    function selectWorkspace(index) {
      if (index < 0 || index >= workspaces.length) {
        return false;
      }

      activeIndex = index;

      paintWorkspaces();

      if (typeof window.desktops != "undefined") {
        window.desktops.select(index);
      }

      return true;
    }

    function makeWorkspaceHandler(index) {
      return function () {
        selectWorkspace(index);
      };
    }

    function indexOfModule(label) {
      for (var i = 0; i < modules.length; i++) {
        if (modules[i].label == label) {
          return i;
        }
      }

      return -1;
    }

    function addModule(label, color, read) {
      var anEntry = new Object();

      anEntry.label = label;
      anEntry.element = makeModule(label, color);
      anEntry.read = read;

      modules.push(anEntry);

      rightSection.appendChild(anEntry.element);

      if (typeof read == "function") {
        anEntry.element.valueElement.textContent = read();
      }

      return anEntry.element;
    }

    function removeModule(label) {
      var index = indexOfModule(label);

      if (index == -1) {
        return false;
      }

      rightSection.removeChild(modules[index].element);

      modules.splice(index, 1);

      return true;
    }

    function setTitle(text) {
      titleElement.textContent = text;
    }

    function tick() {
      for (var i = 0; i < modules.length; i++) {
        var anEntry = modules[i];

        if (typeof anEntry.read == "function") {
          anEntry.element.valueElement.textContent = anEntry.read();
        }
      }
    }

    function stop() {
      if (tickTimer != 0) {
        clearInterval(tickTimer);

        tickTimer = 0;
      }
    }

    function start(interval) {
      if (typeof interval == "undefined") {
        interval = TICK_INTERVAL;
      }

      stop();

      tick();

      tickTimer = setInterval(tick, interval);
    }

    function show() {
      aBar.style.display = "flex";
    }

    function hide() {
      aBar.style.display = "none";
    }

    function height() {
      return BAR_HEIGHT;
    }

    for (var i = 0; i < WORKSPACES.length; i++) {
      var aWorkspace = makeWorkspace(WORKSPACES[i], makeWorkspaceHandler(i));

      workspaces.push(aWorkspace);

      leftSection.appendChild(aWorkspace);
    }

    paintWorkspaces();

    centerSection.appendChild(titleElement);

    aBar.appendChild(leftSection);
    aBar.appendChild(centerSection);
    aBar.appendChild(rightSection);

    document.body.appendChild(aBar);

    return {
      element: aBar,
      addModule: addModule,
      removeModule: removeModule,
      selectWorkspace: selectWorkspace,
      setTitle: setTitle,
      start: start,
      stop: stop,
      show: show,
      hide: hide,
      height: height
    };
  }

  var topbar = makeTopBar();

  topbar.addModule("date", ACCENT_GREEN, readDate);
  topbar.addModule("time", ACCENT_GREEN, readClock);

  topbar.start();

  window.makeTopBar = makeTopBar;
  window.topbar = topbar;
})();
