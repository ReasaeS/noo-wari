(function () {
  var BANNER = "noo-wari shell — type \"help\" for commands";

  var LOGO = [
    "  ___  ___  ___  ",
    " | . \\| . \\| . \\ ",
    " |   /|   /|   / ",
    " |_|_\\|_|_\\|_|_\\ "
  ];

  function build(aSheet) {
    var ui = window.ui;

    var stage = ui.stage();
    var field = document.createElement("div");
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

      stage.appendChild(aLine);

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
        write("  " + apps[i].name + "  —  " + apps[i].description, ui.MUTED_COLOR);
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
        "engine   " + navigator.userAgent.split(" ").pop(),
        "threads  " + (navigator.hardwareConcurrency || "n/a"),
        "screen   " + window.screen.width + "x" + window.screen.height,
        "desktop  " + window.desktops.current(),
        "windows  " + window.desktops.windows().length,
        "wallpaper " + window.backgrounds.current()
      ];

      for (var i = 0; i < Math.max(LOGO.length, lines.length); i++) {
        var left = "";
        var right = "";

        if (i < LOGO.length) {
          left = LOGO[i];
        }

        while (left.length < 20) {
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
        ui.clear(stage);
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

    function onFieldClick() {
      input.focus();
    }

    prompt.textContent = "❯";
    prompt.style.color = ui.ACCENT_COLOR;
    prompt.style.marginRight = "8px";

    field.style.display = "flex";
    field.style.alignItems = "center";
    field.style.flexShrink = 0;
    field.style.padding = "8px 10px";
    field.style.borderTopStyle = "solid";
    field.style.borderTopWidth = "1px";
    field.style.borderTopColor = ui.BORDER_COLOR;
    field.style.backgroundColor = ui.PANEL_COLOR;

    input.style.backgroundColor = "transparent";
    input.style.borderStyle = "none";

    stage.style.backgroundColor = "var(--nw-deep)";
    stage.style.cursor = "text";

    input.addEventListener("keydown", onKeyDown);
    field.addEventListener("click", onFieldClick);

    field.appendChild(prompt);
    field.appendChild(input);

    aSheet.appendChild(stage);
    aSheet.appendChild(field);

    write(BANNER, ui.MUTED_COLOR);

    setTimeout(onFieldClick, 0);

    return null;
  }

  window.makeApp("terminal", "shell for driving the os", 620, 420, build, "system");
})();
