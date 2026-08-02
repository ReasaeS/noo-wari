(function () {
  var WORDS = [
    "shell", "window", "kernel", "buffer", "socket", "thread", "daemon",
    "packet", "vector", "matrix", "shader", "raster", "opaque", "cursor",
    "binary", "syntax", "module", "linker", "static", "memory", "stream",
    "render", "canvas", "signal", "branch", "commit", "config", "device",
    "driver", "engine", "handle", "insert", "kernel", "layout", "mirror",
    "output", "parser", "queued", "region", "scalar", "target", "unique",
    "vertex", "widget", "yield", "zoning", "atomic", "buffer", "cipher"
  ];

  var DURATIONS = ["15s", "30s", "60s"];

  function makePhrase(count) {
    var picked = [];

    for (var i = 0; i < count; i++) {
      picked.push(WORDS[Math.floor(Math.random() * WORDS.length)]);
    }

    return picked.join(" ");
  }

  function build(aSheet) {
    var ui = window.ui;

    var toolbar = ui.toolbar();
    var stage = ui.stage();
    var phraseElement = document.createElement("div");
    var input = ui.input("start typing", null);

    var phrase = "";
    var duration = 30;
    var remaining = 30;
    var isRunning = false;
    var tickTimer = 0;
    var typedCount = 0;
    var errorCount = 0;

    var wpmValue = ui.value("0");
    var accuracyValue = ui.value("100%");
    var timeValue = ui.value("30s");

    function paintPhrase() {
      ui.clear(phraseElement);

      var typed = input.value;

      for (var i = 0; i < phrase.length; i++) {
        var glyph = document.createElement("span");

        glyph.textContent = phrase.charAt(i);

        if (i < typed.length) {
          if (typed.charAt(i) == phrase.charAt(i)) {
            glyph.style.color = ui.ACCENT_COLOR;
          } else {
            glyph.style.color = ui.DANGER_COLOR;
            glyph.style.backgroundColor = "var(--nw-alert)";
          }
        } else if (i == typed.length) {
          glyph.style.color = ui.TEXT_COLOR;
          glyph.style.borderLeftStyle = "solid";
          glyph.style.borderLeftWidth = "2px";
          glyph.style.borderLeftColor = ui.ACCENT_COLOR;
        } else {
          glyph.style.color = ui.MUTED_COLOR;
        }

        phraseElement.appendChild(glyph);
      }
    }

    function measure() {
      var typed = input.value;

      typedCount = typed.length;
      errorCount = 0;

      for (var i = 0; i < typed.length; i++) {
        if (typed.charAt(i) != phrase.charAt(i)) {
          errorCount = errorCount + 1;
        }
      }

      var elapsed = duration - remaining;

      if (elapsed <= 0) {
        wpmValue.textContent = "0";
      } else {
        var correct = typedCount - errorCount;

        wpmValue.textContent = "" + Math.max(Math.round((correct / 5) * (60 / elapsed)), 0);
      }

      if (typedCount == 0) {
        accuracyValue.textContent = "100%";
      } else {
        accuracyValue.textContent =
          Math.round(((typedCount - errorCount) / typedCount) * 100) + "%";
      }
    }

    function stop() {
      isRunning = false;

      if (tickTimer != 0) {
        clearInterval(tickTimer);

        tickTimer = 0;
      }
    }

    function finish() {
      stop();

      input.disabled = true;

      measure();
    }

    function tick() {
      remaining = remaining - 1;

      timeValue.textContent = remaining + "s";

      measure();

      if (remaining <= 0) {
        finish();
      }
    }

    function start() {
      stop();

      phrase = makePhrase(60);
      remaining = duration;
      isRunning = false;

      input.value = "";
      input.disabled = false;

      timeValue.textContent = remaining + "s";
      wpmValue.textContent = "0";
      accuracyValue.textContent = "100%";

      paintPhrase();

      input.focus();
    }

    function onInput() {
      if (!isRunning) {
        isRunning = true;

        tickTimer = setInterval(tick, 1000);
      }

      if (input.value.length >= phrase.length) {
        finish();
      }

      paintPhrase();
      measure();
    }

    function onDurationChange(name) {
      duration = Number(name.replace("s", ""));

      start();
    }

    phraseElement.style.fontSize = "16px";
    phraseElement.style.lineHeight = "1.9";
    phraseElement.style.wordBreak = "break-word";
    phraseElement.style.marginBottom = "14px";
    phraseElement.style.userSelect = "none";

    input.style.width = "100%";
    input.style.padding = "10px";
    input.style.fontSize = "14px";

    input.addEventListener("input", onInput);

    toolbar.appendChild(ui.button("restart", start));
    toolbar.appendChild(ui.select(DURATIONS, "30s", onDurationChange));
    toolbar.appendChild(ui.spacer());
    toolbar.appendChild(ui.label("wpm"));
    toolbar.appendChild(wpmValue);
    toolbar.appendChild(ui.label("acc"));
    toolbar.appendChild(accuracyValue);
    toolbar.appendChild(ui.label("left"));
    toolbar.appendChild(timeValue);

    stage.appendChild(phraseElement);
    stage.appendChild(input);

    aSheet.appendChild(toolbar);
    aSheet.appendChild(stage);

    start();

    return stop;
  }

  window.makeApp("typing", "words per minute test", 560, 400, build);
})();
