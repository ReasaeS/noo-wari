(function () {
  var BANNER = "noo-wari shell - type \"help\" for commands";

  var MARK_FAMILY = "Helvetica, Arial, sans-serif";
  var RAMP = " .:-=+*#%@";
  var SUPERSAMPLE = 8;

  var STARS = [
    [0.08, 0.14, 0.026],
    [0.19, 0.05, 0.020],
    [0.05, 0.38, 0.020],
    [0.92, 0.12, 0.026],
    [0.81, 0.04, 0.020],
    [0.95, 0.36, 0.020],
    [0.14, 0.62, 0.018],
    [0.87, 0.60, 0.018]
  ];

  var ART_ROWS = 14;
  var LINE_SIZE = 12;
  var LINE_HEIGHT = 1.5;
  var ART_GAMMA = 1.15;
  var ART_FLOOR = 0.22;

  var FALLBACK = [
    " *        .    * ",
    "   *  N N     *  ",
    "      N  N       ",
    "   *  N   N   *  ",
    "  ___________    ",
    " /           \\   "
  ];

  function versionOf(mark) {
    var ua = navigator.userAgent;
    var at = ua.indexOf(mark);

    if (at == -1) {
      return "";
    }

    var rest = ua.substring(at + mark.length).split(" ")[0];

    return rest.split(".")[0];
  }

  function browserName() {
    if (typeof navigator.brave != "undefined") {
      return "Brave " + versionOf("Chrome/");
    }

    var brands = navigator.userAgentData == null ? null : navigator.userAgentData.brands;

    if (brands instanceof Array) {
      for (var i = 0; i < brands.length; i++) {
        var brand = brands[i].brand;

        if (brand.indexOf("Not") == -1 && brand.indexOf("Chromium") == -1) {
          return brand + " " + brands[i].version;
        }
      }
    }

    var marks = [
      ["Edg/", "Edge"],
      ["OPR/", "Opera"],
      ["Vivaldi/", "Vivaldi"],
      ["SamsungBrowser/", "Samsung Internet"],
      ["Firefox/", "Firefox"],
      ["Chrome/", "Chrome"],
      ["Version/", "Safari"]
    ];

    for (var j = 0; j < marks.length; j++) {
      var found = versionOf(marks[j][0]);

      if (found != "") {
        return marks[j][1] + " " + found;
      }
    }

    return "unknown";
  }

  function engineName() {
    var ua = navigator.userAgent;

    if (ua.indexOf("Gecko/") != -1 && ua.indexOf("like Gecko") == -1) {
      return "Gecko";
    }

    if (ua.indexOf("Chrome/") != -1 || ua.indexOf("Chromium/") != -1) {
      return "Blink";
    }

    if (ua.indexOf("AppleWebKit/") != -1) {
      return "WebKit";
    }

    return "unknown";
  }

  function trimArt(lines) {
    var kept = [];

    for (var i = 0; i < lines.length; i++) {
      var text = lines[i];

      while (text.length > 0 && text.charAt(text.length - 1) == " ") {
        text = text.substring(0, text.length - 1);
      }

      kept.push(text);
    }

    while (kept.length > 0 && kept[0] == "") {
      kept.shift();
    }

    while (kept.length > 0 && kept[kept.length - 1] == "") {
      kept.pop();
    }

    return kept;
  }

  function paintMark(brush, size) {
    var TAU = Math.PI * 2;

    brush.clearRect(0, 0, size, size);

    brush.fillStyle = "#ffffff";
    brush.strokeStyle = "#ffffff";

    for (var i = 0; i < STARS.length; i++) {
      brush.beginPath();
      brush.arc(STARS[i][0] * size, STARS[i][1] * size, STARS[i][2] * size, 0, TAU);
      brush.fill();
    }

    brush.lineWidth = size * 0.055;
    brush.lineCap = "butt";

    brush.beginPath();
    brush.save();
    brush.translate(size * 0.5, size * 1.02);
    brush.scale(1, 0.30);
    brush.arc(0, 0, size * 0.92, Math.PI * 1.02, Math.PI * 1.98);
    brush.restore();
    brush.stroke();

    brush.font = "bold " + Math.round(size * 0.78) + "px " + MARK_FAMILY;
    brush.textAlign = "center";
    brush.textBaseline = "middle";
    brush.fillText("N", size * 0.5, size * 0.40);

    return true;
  }

  function cellShape(context) {
    context.font = LINE_SIZE + "px " + window.ui.FONT_FAMILY;

    var wide = context.measureText("M").width;

    if (wide <= 0) {
      return 2;
    }

    return (LINE_SIZE * LINE_HEIGHT) / wide;
  }

  function drawArt(rows) {
    var square = document.createElement("canvas");
    var brush = square.getContext("2d");

    if (brush == null) {
      return null;
    }

    var columns = Math.round(rows * cellShape(brush));
    var size = rows * SUPERSAMPLE;

    square.width = size;
    square.height = size;

    paintMark(brush, size);

    var strip = document.createElement("canvas");
    var wide = strip.getContext("2d");

    if (wide == null) {
      return null;
    }

    strip.width = columns;
    strip.height = rows;

    wide.imageSmoothingEnabled = true;
    wide.drawImage(square, 0, 0, columns, rows);

    var pixels = null;

    try {
      pixels = wide.getImageData(0, 0, columns, rows);
    } catch (error) {
      return null;
    }

    var lines = [];

    for (var y = 0; y < rows; y++) {
      var text = "";

      for (var x = 0; x < columns; x++) {
        var alpha = pixels.data[(y * columns + x) * 4 + 3] / 255;

        if (alpha < ART_FLOOR) {
          text = text + " ";

          continue;
        }

        var lit = Math.pow(alpha, ART_GAMMA);
        var step = Math.max(1, Math.round(lit * (RAMP.length - 1)));

        text = text + RAMP.charAt(step);
      }

      lines.push(text);
    }

    return trimArt(lines);
  }

  function makeLogo() {
    var art = drawArt(ART_ROWS);

    if (art == null || art.length == 0) {
      return FALLBACK;
    }

    return art;
  }

  function widthOf(lines) {
    var most = 0;

    for (var i = 0; i < lines.length; i++) {
      if (lines[i].length > most) {
        most = lines[i].length;
      }
    }

    return most;
  }

  function build(aSheet) {
    var ui = window.ui;

    var stage = ui.stage();
    var line = document.createElement("div");
    var prompt = document.createElement("span");
    var input = ui.input("", onSubmit);

    var history = [];
    var historyIndex = 0;

    function write(text, color) {
      var aLine = document.createElement("div");
      var lineStyle = aLine.style;

      aLine.textContent = text;

      lineStyle.whiteSpace = "pre-wrap";
      lineStyle.wordBreak = "break-word";
      lineStyle.fontSize = "12px";
      lineStyle.lineHeight = "1.5";

      if (typeof color == "string") {
        lineStyle.color = color;
      }

      stage.insertBefore(aLine, line);

      stage.scrollTop = stage.scrollHeight;
    }

    function writeAll(lines, color) {
      for (var i = 0; i < lines.length; i++) {
        write(lines[i], color);
      }
    }

    function argumentsOf(text) {
      var parts = text.split(" ");
      var found = [];

      for (var i = 0; i < parts.length; i++) {
        if (parts[i] != "") {
          found.push(parts[i]);
        }
      }

      return found;
    }

    function runHelp() {
      writeAll([
        "help              this list",
        "clear             clear the screen",
        "echo <text>       print text",
        "apps              list registered apps",
        "open <app>        launch an app",
        "windows           list windows on this desktop",
        "desktop [n]       show or switch desktop",
        "bg [name|next]    show or change the wallpaper",
        "topbar <on|off>   toggle the top bar",
        "date              current date and time",
        "uname             shell identity",
        "neofetch          system summary",
        "history           previous commands"
      ], ui.MUTED_COLOR);
    }

    function runApps() {
      var apps = window.launcher.list();

      for (var i = 0; i < apps.length; i++) {
        write("  " + apps[i].name + "  -  " + apps[i].description, ui.MUTED_COLOR);
      }
    }

    function runOpen(name) {
      if (typeof name == "undefined") {
        write("open: needs an app name", ui.DANGER_COLOR);
        return;
      }

      var apps = window.launcher.list();

      for (var i = 0; i < apps.length; i++) {
        if (apps[i].name == name) {
          apps[i].run();

          write("opened " + name, ui.ACCENT_COLOR);

          return;
        }
      }

      write("open: no such app: " + name, ui.DANGER_COLOR);
    }

    function runWindows() {
      var found = window.desktops.windows(window.desktops.current());

      if (found.length == 0) {
        write("no windows on this desktop", ui.MUTED_COLOR);
        return;
      }

      for (var i = 0; i < found.length; i++) {
        var title = found[i].titleBar.textContent.trim();

        if (title == "") {
          title = "window";
        }

        write("  [" + found[i].desktop + "] " + title, ui.MUTED_COLOR);
      }
    }

    function runDesktop(value) {
      if (typeof value == "undefined") {
        write("desktop " + window.desktops.current(), ui.ACCENT_COLOR);
        return;
      }

      var index = Number(value);

      if (isNaN(index)) {
        write("desktop: not a number: " + value, ui.DANGER_COLOR);
        return;
      }

      window.topbar.selectWorkspace(index);

      write("switched to desktop " + index, ui.ACCENT_COLOR);
    }

    function runBackground(value) {
      if (typeof value == "undefined") {
        write("current: " + window.backgrounds.current(), ui.ACCENT_COLOR);
        write("available: " + window.backgrounds.list().join(", "), ui.MUTED_COLOR);
        return;
      }

      if (value == "next") {
        window.backgrounds.next();

        write("switched to " + window.backgrounds.current(), ui.ACCENT_COLOR);

        return;
      }

      if (window.backgrounds.select(value)) {
        write("switched to " + value, ui.ACCENT_COLOR);
        return;
      }

      write("bg: no such background: " + value, ui.DANGER_COLOR);
    }

    function runTopBar(value) {
      if (value == "off") {
        window.topbar.hide();

        write("top bar hidden", ui.ACCENT_COLOR);

        return;
      }

      if (value == "on") {
        window.topbar.show();

        write("top bar shown", ui.ACCENT_COLOR);

        return;
      }

      write("topbar: expected on or off", ui.DANGER_COLOR);
    }

    function runNeofetch() {
      var lines = [
        "user     " + "noo-wari",
        "shell    " + "nwsh 1.0",
        "browser  " + browserName(),
        "engine   " + engineName(),
        "threads  " + (navigator.hardwareConcurrency || "n/a"),
        "screen   " + window.screen.width + "x" + window.screen.height,
        "desktop  " + window.desktops.current(),
        "windows  " + window.desktops.windows().length,
        "wallpaper " + window.backgrounds.current()
      ];

      var art = makeLogo();
      var gutter = widthOf(art) + 3;

      for (var i = 0; i < Math.max(art.length, lines.length); i++) {
        var left = "";
        var right = "";

        if (i < art.length) {
          left = art[i];
        }

        while (left.length < gutter) {
          left = left + " ";
        }

        if (i < lines.length) {
          right = lines[i];
        }

        write(left + right, ui.ACCENT_COLOR);
      }
    }

    function run(text) {
      var parts = argumentsOf(text);

      if (parts.length == 0) {
        return;
      }

      var command = parts[0];

      if (command == "help") {
        runHelp();
      } else if (command == "clear") {
        wipe();
      } else if (command == "echo") {
        write(parts.slice(1).join(" "));
      } else if (command == "apps") {
        runApps();
      } else if (command == "open") {
        runOpen(parts[1]);
      } else if (command == "windows") {
        runWindows();
      } else if (command == "desktop") {
        runDesktop(parts[1]);
      } else if (command == "bg") {
        runBackground(parts[1]);
      } else if (command == "topbar") {
        runTopBar(parts[1]);
      } else if (command == "date") {
        write(new Date().toString(), ui.ACCENT_COLOR);
      } else if (command == "uname") {
        write("nwsh 1.0 (noo-wari web shell)", ui.ACCENT_COLOR);
      } else if (command == "neofetch") {
        runNeofetch();
      } else if (command == "history") {
        for (var i = 0; i < history.length; i++) {
          write("  " + i + "  " + history[i], ui.MUTED_COLOR);
        }
      } else {
        write("nwsh: command not found: " + command, ui.DANGER_COLOR);
      }
    }

    function onSubmit(value) {
      write("❯ " + value, ui.TEXT_COLOR);

      if (value.trim() != "") {
        history.push(value);
      }

      historyIndex = history.length;

      input.value = "";

      run(value);

      stage.scrollTop = stage.scrollHeight;
    }

    function onKeyDown(event) {
      if (event.key == "ArrowUp") {
        event.preventDefault();

        if (historyIndex > 0) {
          historyIndex = historyIndex - 1;

          input.value = history[historyIndex];
        }
      }

      if (event.key == "ArrowDown") {
        event.preventDefault();

        if (historyIndex < history.length - 1) {
          historyIndex = historyIndex + 1;

          input.value = history[historyIndex];
        } else {
          historyIndex = history.length;
          input.value = "";
        }
      }
    }

    function wipe() {
      while (stage.firstChild != null && stage.firstChild != line) {
        stage.removeChild(stage.firstChild);
      }

      return true;
    }

    function onFieldClick(event) {
      if (event != null && event.target.nodeName == "INPUT") {
        return;
      }

      if (window.getSelection != null && window.getSelection().toString() != "") {
        return;
      }

      input.focus();
    }

    prompt.textContent = "❯";
    prompt.style.color = ui.ACCENT_COLOR;
    prompt.style.marginRight = "8px";
    prompt.style.flexShrink = 0;
    prompt.style.fontSize = "12px";
    prompt.style.lineHeight = "1.5";

    line.style.display = "flex";
    line.style.alignItems = "baseline";

    input.style.flexGrow = 1;
    input.style.minWidth = "0px";
    input.style.padding = "0px";
    input.style.margin = "0px";
    input.style.backgroundColor = "transparent";
    input.style.borderStyle = "none";
    input.style.borderRadius = "0px";
    input.style.lineHeight = "1.5";
    input.style.caretColor = ui.ACCENT_COLOR;

    stage.style.backgroundColor = "var(--nw-deep)";
    stage.style.cursor = "text";

    input.addEventListener("keydown", onKeyDown);
    stage.addEventListener("click", onFieldClick);

    line.appendChild(prompt);
    line.appendChild(input);

    stage.appendChild(line);

    aSheet.appendChild(stage);

    runNeofetch();

    write(BANNER, ui.MUTED_COLOR);

    setTimeout(function () {
      input.focus();
    }, 0);

    return null;
  }

  window.makeApp("terminal", "shell for driving the os", 620, 420, build, "system");
})();
