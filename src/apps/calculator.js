(function () {
  var KEYS = [
    ["C", "±", "%", "÷"],
    ["7", "8", "9", "×"],
    ["4", "5", "6", "−"],
    ["1", "2", "3", "+"],
    ["0", ".", "⌫", "="]
  ];

  var OPERATORS = "÷×−+";

  function build(aSheet) {
    var ui = window.ui;

    var display = document.createElement("div");
    var readout = document.createElement("div");
    var trail = document.createElement("div");
    var pad = document.createElement("div");

    var current = "0";
    var stored = 0;
    var pending = "";
    var isFresh = true;

    function paint() {
      readout.textContent = current;

      if (pending == "") {
        trail.textContent = "";
      } else {
        trail.textContent = format(stored) + " " + pending;
      }
    }

    function format(amount) {
      if (!isFinite(amount)) {
        return "error";
      }

      var text = "" + Math.round(amount * 1e10) / 1e10;

      return text;
    }

    function apply(left, right, operator) {
      if (operator == "+") {
        return left + right;
      }

      if (operator == "−") {
        return left - right;
      }

      if (operator == "×") {
        return left * right;
      }

      if (operator == "÷") {
        return left / right;
      }

      return right;
    }

    function pressDigit(key) {
      if (isFresh) {
        current = key;
        isFresh = false;
      } else if (current == "0" && key != ".") {
        current = key;
      } else {
        current = current + key;
      }

      paint();
    }

    function pressDot() {
      if (isFresh) {
        current = "0.";
        isFresh = false;
      } else if (current.indexOf(".") == -1) {
        current = current + ".";
      }

      paint();
    }

    function pressOperator(key) {
      if (pending != "" && !isFresh) {
        stored = apply(stored, Number(current), pending);
        current = format(stored);
      } else {
        stored = Number(current);
      }

      pending = key;
      isFresh = true;

      paint();
    }

    function pressEquals() {
      if (pending == "") {
        return;
      }

      stored = apply(stored, Number(current), pending);
      current = format(stored);
      pending = "";
      isFresh = true;

      paint();
    }

    function pressClear() {
      current = "0";
      stored = 0;
      pending = "";
      isFresh = true;

      paint();
    }

    function pressSign() {
      if (current.charAt(0) == "-") {
        current = current.substring(1);
      } else if (current != "0") {
        current = "-" + current;
      }

      paint();
    }

    function pressPercent() {
      current = format(Number(current) / 100);

      paint();
    }

    function pressBack() {
      if (isFresh) {
        return;
      }

      current = current.substring(0, current.length - 1);

      if (current == "" || current == "-") {
        current = "0";
        isFresh = true;
      }

      paint();
    }

    function press(key) {
      if (key >= "0" && key <= "9") {
        pressDigit(key);
      } else if (key == ".") {
        pressDot();
      } else if (OPERATORS.indexOf(key) != -1) {
        pressOperator(key);
      } else if (key == "=") {
        pressEquals();
      } else if (key == "C") {
        pressClear();
      } else if (key == "±") {
        pressSign();
      } else if (key == "%") {
        pressPercent();
      } else if (key == "⌫") {
        pressBack();
      }
    }

    function makeKeyHandler(key) {
      return function () {
        press(key);
      };
    }

    function makeKey(key) {
      var aKey = ui.button(key, makeKeyHandler(key));
      var keyStyle = aKey.style;

      keyStyle.padding = "0px";
      keyStyle.height = "100%";
      keyStyle.width = "100%";
      keyStyle.fontSize = "15px";

      if (OPERATORS.indexOf(key) != -1 || key == "=") {
        keyStyle.color = ui.ACCENT_COLOR;
      }

      if (key == "C") {
        keyStyle.color = ui.DANGER_COLOR;
      }

      return aKey;
    }

    function onKeyDown(event) {
      var key = event.key;

      if (key == "*") {
        key = "×";
      }

      if (key == "/") {
        key = "÷";
      }

      if (key == "-") {
        key = "−";
      }

      if (key == "Enter") {
        key = "=";
      }

      if (key == "Backspace") {
        key = "⌫";
      }

      if (key == "Escape") {
        key = "C";
      }

      press(key);
    }

    display.style.flexShrink = 0;
    display.style.padding = "14px 16px";
    display.style.backgroundColor = ui.PANEL_COLOR;
    display.style.borderBottomStyle = "solid";
    display.style.borderBottomWidth = "1px";
    display.style.borderBottomColor = ui.BORDER_COLOR;
    display.style.textAlign = "right";

    trail.style.color = ui.MUTED_COLOR;
    trail.style.fontSize = "11px";
    trail.style.minHeight = "14px";

    readout.style.color = ui.TEXT_COLOR;
    readout.style.fontSize = "28px";
    readout.style.overflow = "hidden";
    readout.style.textOverflow = "ellipsis";

    pad.style.display = "grid";
    pad.style.gridTemplateColumns = "repeat(4, 1fr)";
    pad.style.gridTemplateRows = "repeat(5, 1fr)";
    pad.style.gap = "6px";
    pad.style.padding = "10px";
    pad.style.flexGrow = 1;
    pad.style.minHeight = 0;
    pad.style.boxSizing = "border-box";

    for (var row = 0; row < KEYS.length; row++) {
      for (var column = 0; column < KEYS[row].length; column++) {
        pad.appendChild(makeKey(KEYS[row][column]));
      }
    }

    display.appendChild(trail);
    display.appendChild(readout);

    aSheet.appendChild(display);
    aSheet.appendChild(pad);

    aSheet.tabIndex = 0;
    aSheet.style.outlineStyle = "none";
    aSheet.addEventListener("keydown", onKeyDown);

    paint();

    setTimeout(function () {
      aSheet.focus();
    }, 0);

    return null;
  }

  window.makeApp("calculator", "arithmetic with keyboard input", 300, 400, build);
})();
