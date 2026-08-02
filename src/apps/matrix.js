(function () {
  var GLYPHS = "アイウエオカキクケコサシスセソタチツテトナニヌネノ0123456789";
  var PALETTES = ["green", "amber", "ice", "magenta"];

  var HUES = {
    green: 145,
    amber: 40,
    ice: 195,
    magenta: 310
  };

  function build(aSheet) {
    var ui = window.ui;

    var toolbar = ui.toolbar();
    var stage = ui.stage();
    var canvas = ui.canvas();
    var context = canvas.getContext("2d");

    var columns = [];
    var fontSize = 14;
    var speed = 6;
    var palette = "green";
    var frameTimer = 0;
    var lastDraw = 0;

    function reset() {
      var count = Math.ceil(canvas.width / fontSize);

      columns = [];

      for (var i = 0; i < count; i++) {
        columns.push(Math.floor((Math.random() * canvas.height) / fontSize));
      }
    }

    function resize() {
      canvas.width = Math.max(stage.clientWidth - 20, 120);
      canvas.height = Math.max(stage.clientHeight - 20, 120);

      context.fillStyle = "#0b0f14";
      context.fillRect(0, 0, canvas.width, canvas.height);

      reset();
    }

    function draw(now) {
      frameTimer = window.requestAnimationFrame(draw);

      if (now - lastDraw < 1000 / (speed * 4)) {
        return;
      }

      lastDraw = now;

      context.fillStyle = "rgba(11, 15, 20, 0.16)";
      context.fillRect(0, 0, canvas.width, canvas.height);

      context.font = fontSize + "px monospace";

      var hue = HUES[palette];

      for (var i = 0; i < columns.length; i++) {
        var glyph = GLYPHS.charAt(Math.floor(Math.random() * GLYPHS.length));
        var x = i * fontSize;
        var y = columns[i] * fontSize;

        context.fillStyle = "hsl(" + hue + ", 70%, 82%)";
        context.fillText(glyph, x, y);

        context.fillStyle = "hsl(" + hue + ", 60%, 48%)";
        context.fillText(glyph, x, y - fontSize);

        if (y > canvas.height && Math.random() > 0.975) {
          columns[i] = 0;
        } else {
          columns[i] = columns[i] + 1;
        }
      }
    }

    function onSpeedChange(amount) {
      speed = amount;
    }

    function onPaletteChange(name) {
      palette = name;
    }

    function onSizeChange(amount) {
      fontSize = amount;

      resize();
    }

    function teardown() {
      if (frameTimer != 0) {
        window.cancelAnimationFrame(frameTimer);

        frameTimer = 0;
      }

      window.removeEventListener("resize", resize);
    }

    canvas.style.width = "100%";
    canvas.style.imageRendering = "auto";
    canvas.style.borderRadius = "4px";

    stage.style.padding = "10px";

    toolbar.appendChild(ui.select(PALETTES, palette, onPaletteChange));
    toolbar.appendChild(ui.label("speed"));
    toolbar.appendChild(ui.range(1, 20, speed, onSpeedChange));
    toolbar.appendChild(ui.label("size"));
    toolbar.appendChild(ui.range(8, 28, fontSize, onSizeChange));
    toolbar.appendChild(ui.spacer());
    toolbar.appendChild(ui.button("reset", resize));

    stage.appendChild(canvas);

    aSheet.appendChild(toolbar);
    aSheet.appendChild(stage);

    window.addEventListener("resize", resize);

    setTimeout(resize, 0);

    frameTimer = window.requestAnimationFrame(draw);

    return teardown;
  }

  window.makeApp("matrix", "falling glyph screensaver", 560, 420, build);
})();
