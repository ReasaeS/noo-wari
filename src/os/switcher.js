(function () {
  var PANEL_COLOR = "rgba(38, 42, 49, 0.95)";
  var OVERLAY_COLOR = "rgba(6, 17, 9, 0.35)";
  var BORDER_COLOR = "#3b414c";
  var TEXT_COLOR = "#c5cad3";
  var MUTED_COLOR = "#7c848f";
  var ACCENT_COLOR = "#7fd18b";
  var ACTIVE_COLOR = "rgba(127, 209, 139, 0.14)";

  var FONT_FAMILY = "\"JetBrainsMono Nerd Font\", \"JetBrains Mono\", \"Fira Code\", monospace";
  var PANEL_WIDTH = 380;
  var LIST_HEIGHT = 280;
  var DOT_SIZE = 10;
  var DOT_BORDER_COLOR = "rgba(0, 0, 0, 0.25)";
  var OVERLAY_Z_INDEX = 1100;

  function makeOverlay() {
    var anOverlay = document.createElement("div");
    var overlayStyle = anOverlay.style;

    overlayStyle.position = "fixed";
    overlayStyle.left = "0px";
    overlayStyle.top = "0px";
    overlayStyle.width = "100%";
    overlayStyle.height = "100%";
    overlayStyle.display = "none";
    overlayStyle.alignItems = "center";
    overlayStyle.justifyContent = "center";
    overlayStyle.backgroundColor = OVERLAY_COLOR;
    overlayStyle.pointerEvents = "none";
    overlayStyle.zIndex = OVERLAY_Z_INDEX;

    return anOverlay;
  }

  function makePanel() {
    var aPanel = document.createElement("div");
    var panelStyle = aPanel.style;

    panelStyle.width = PANEL_WIDTH + "px";
    panelStyle.maxWidth = "80%";
    panelStyle.maxHeight = LIST_HEIGHT + "px";
    panelStyle.overflow = "hidden";
    panelStyle.boxSizing = "border-box";
    panelStyle.padding = "6px 0px";
    panelStyle.backgroundColor = PANEL_COLOR;
    panelStyle.borderStyle = "solid";
    panelStyle.borderWidth = "1px";
    panelStyle.borderColor = BORDER_COLOR;
    panelStyle.borderRadius = "6px";
    panelStyle.backdropFilter = "blur(6px)";
    panelStyle.webkitBackdropFilter = "blur(6px)";
    panelStyle.fontFamily = FONT_FAMILY;

    return aPanel;
  }

  function makeDot(color) {
    var aDot = document.createElement("span");
    var dotStyle = aDot.style;

    dotStyle.width = DOT_SIZE + "px";
    dotStyle.height = DOT_SIZE + "px";
    dotStyle.borderRadius = "50%";
    dotStyle.backgroundColor = color;
    dotStyle.borderStyle = "solid";
    dotStyle.borderWidth = "1px";
    dotStyle.borderColor = DOT_BORDER_COLOR;
    dotStyle.boxSizing = "border-box";
    dotStyle.flexShrink = 0;
    dotStyle.marginRight = "10px";

    return aDot;
  }

  function makeEntry(aWindow, isActive) {
    var anEntry = document.createElement("div");
    var entryStyle = anEntry.style;

    var leadElement = document.createElement("span");
    var titleElement = document.createElement("span");
    var badgeElement = document.createElement("span");

    titleElement.textContent = titleOf(aWindow);
    titleElement.style.fontSize = "13px";
    titleElement.style.overflow = "hidden";
    titleElement.style.textOverflow = "ellipsis";

    badgeElement.textContent = badgeOf(aWindow);
    badgeElement.style.fontSize = "11px";
    badgeElement.style.marginLeft = "12px";
    badgeElement.style.color = MUTED_COLOR;

    leadElement.style.display = "flex";
    leadElement.style.alignItems = "center";
    leadElement.style.overflow = "hidden";

    entryStyle.display = "flex";
    entryStyle.alignItems = "center";
    entryStyle.justifyContent = "space-between";
    entryStyle.padding = "7px 14px";
    entryStyle.whiteSpace = "nowrap";
    entryStyle.overflow = "hidden";

    if (isActive) {
      entryStyle.backgroundColor = ACTIVE_COLOR;
      titleElement.style.color = ACCENT_COLOR;
    } else {
      entryStyle.backgroundColor = "transparent";
      titleElement.style.color = TEXT_COLOR;
    }

    leadElement.appendChild(makeDot(colorOf(aWindow)));
    leadElement.appendChild(titleElement);

    anEntry.appendChild(leadElement);
    anEntry.appendChild(badgeElement);

    return anEntry;
  }

  function titleOf(aWindow) {
    var text = "";

    if (aWindow.titleBar != null) {
      text = aWindow.titleBar.textContent.trim();
    }

    if (text == "") {
      text = "window";
    }

    return text;
  }

  function colorOf(aWindow) {
    if (typeof aWindow.color == "undefined") {
      return MUTED_COLOR;
    }

    return aWindow.color;
  }

  function badgeOf(aWindow) {
    if (aWindow.style.display == "none") {
      return "minimized";
    }

    return "";
  }

  function makeSwitcher() {
    var anOverlay = makeOverlay();
    var aPanel = makePanel();

    var session = null;
    var sessionKey = "";
    var activeIndex = 0;

    function paint() {
      while (aPanel.firstChild) {
        aPanel.removeChild(aPanel.firstChild);
      }

      for (var i = 0; i < session.length; i++) {
        aPanel.appendChild(makeEntry(session[i], i == activeIndex));
      }
    }

    function start(key) {
      var found = window.desktops.windows(window.desktops.current());

      if (found.length == 0) {
        return false;
      }

      session = found;
      sessionKey = key;
      activeIndex = 0;

      anOverlay.style.display = "flex";

      return true;
    }

    function step(amount) {
      activeIndex = activeIndex + amount;

      while (activeIndex < 0) {
        activeIndex = activeIndex + session.length;
      }

      activeIndex = activeIndex % session.length;

      paint();
    }

    function cancel() {
      if (session == null) {
        return;
      }

      session = null;
      sessionKey = "";

      anOverlay.style.display = "none";
    }

    function commit() {
      if (session == null) {
        return;
      }

      var target = session[activeIndex];

      cancel();

      if (target.content == null) {
        return;
      }

      target.restore();

      window.desktops.focus(target);
    }

    function onKeyDown(event) {
      if (session != null && event.key == "Escape") {
        event.preventDefault();

        cancel();

        return;
      }

      var isAltTab = event.altKey && event.key == "Tab";
      var isCtrlTick = event.ctrlKey && event.code == "Backquote";

      if (!isAltTab && !isCtrlTick) {
        return;
      }

      event.preventDefault();

      if (session == null) {
        var key = "Alt";

        if (isCtrlTick) {
          key = "Control";
        }

        if (!start(key)) {
          return;
        }
      }

      if (event.shiftKey) {
        step(-1);
      } else {
        step(1);
      }
    }

    function onKeyUp(event) {
      if (session == null) {
        return;
      }

      if (event.key == sessionKey) {
        commit();
      }
    }

    anOverlay.appendChild(aPanel);

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup", onKeyUp);

    window.addEventListener("blur", cancel);

    document.body.appendChild(anOverlay);

    return {
      element: anOverlay,
      start: start,
      step: step,
      commit: commit,
      cancel: cancel
    };
  }

  var switcher = makeSwitcher();

  window.makeSwitcher = makeSwitcher;
  window.switcher = switcher;
})();
