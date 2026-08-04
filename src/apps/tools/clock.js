(function () {
  var SIZE = 220;

  function build(aSheet) {
    var ui = window.ui;

    var toolbar = ui.toolbar();
    var stage = ui.center();
    var column = document.createElement("div");
    var canvas = ui.canvas();
    var context = canvas.getContext("2d");
    var digital = document.createElement("div");
    var stopwatch = document.createElement("div");

    var mode = "clock";
    var elapsed = 0;
    var lastTick = 0;
    var isRunning = false;
    var frameTimer = 0;

    var stateValue = ui.value("clock");

    function drawFace(hours, minutes, seconds) {
      var half = SIZE / 2;

      context.clearRect(0, 0, SIZE, SIZE);

      context.fillStyle = "#262a31";
      context.beginPath();
      context.arc(half, half, half - 2, 0, Math.PI * 2);
      context.fill();

      context.strokeStyle = "#3b414c";
      context.lineWidth = 2;
      context.stroke();

      for (var i = 0; i < 60; i++) {
        var angle = (i / 60) * Math.PI * 2;
        var inner = half - 12;

        if (i % 5 == 0) {
          inner = half - 18;
          context.strokeStyle = "#7c848f";
          context.lineWidth = 2;
        } else {
          context.strokeStyle = "#3b414c";
          context.lineWidth = 1;
        }

        context.beginPath();
        context.moveTo(
          half + Math.sin(angle) * inner,
          half - Math.cos(angle) * inner
        );
        context.lineTo(
          half + Math.sin(angle) * (half - 6),
          half - Math.cos(angle) * (half - 6)
        );
        context.stroke();
      }

      drawHand((hours % 12) / 12 + minutes / 720, half * 0.5, 4, "#c5cad3");
      drawHand(minutes / 60 + seconds / 3600, half * 0.72, 3, "#c5cad3");
      drawHand(seconds / 60, half * 0.8, 1.5, "#7fd18b");

      context.fillStyle = "#7fd18b";
      context.beginPath();
      context.arc(half, half, 4, 0, Math.PI * 2);
      context.fill();
    }

    function drawHand(fraction, length, width, color) {
      var half = SIZE / 2;
      var angle = fraction * Math.PI * 2;

      context.strokeStyle = color;
      context.lineWidth = width;
      context.lineCap = "round";

      context.beginPath();
      context.moveTo(half, half);
      context.lineTo(
        half + Math.sin(angle) * length,
        half - Math.cos(angle) * length
      );
      context.stroke();
    }

    function formatClock(now) {
      return (
        ui.pad(now.getHours(), 2) +
        ":" +
        ui.pad(now.getMinutes(), 2) +
        ":" +
        ui.pad(now.getSeconds(), 2)
      );
    }

    function formatElapsed(amount) {
      var totalSeconds = Math.floor(amount / 1000);
      var minutes = Math.floor(totalSeconds / 60);
      var seconds = totalSeconds % 60;
      var hundredths = Math.floor((amount % 1000) / 10);

      return (
        ui.pad(minutes, 2) +
        ":" +
        ui.pad(seconds, 2) +
        "." +
        ui.pad(hundredths, 2)
      );
    }

    function tick() {
      var now = new Date();

      if (mode == "clock") {
        drawFace(now.getHours(), now.getMinutes(), now.getSeconds());

        digital.textContent = formatClock(now);
        stopwatch.textContent = now.toDateString();
      } else {
        if (isRunning) {
          var stamp = Date.now();

          elapsed = elapsed + (stamp - lastTick);
          lastTick = stamp;
        }

        var total = elapsed / 1000;

        drawFace(0, (total / 60) % 60, total % 60);

        digital.textContent = formatElapsed(elapsed);
        stopwatch.textContent = "stopwatch";
      }

      frameTimer = window.requestAnimationFrame(tick);
    }

    function setMode(name) {
      mode = name;

      stateValue.textContent = name;
    }

    function toggleRun() {
      if (mode != "stopwatch") {
        setMode("stopwatch");
      }

      isRunning = !isRunning;

      lastTick = Date.now();
    }

    function resetWatch() {
      elapsed = 0;
      isRunning = false;
    }

    function teardown() {
      if (frameTimer != 0) {
        window.cancelAnimationFrame(frameTimer);

        frameTimer = 0;
      }
    }

    canvas.width = SIZE;
    canvas.height = SIZE;
    canvas.style.imageRendering = "auto";

    column.style.display = "flex";
    column.style.flexDirection = "column";
    column.style.alignItems = "center";
    column.style.gap = "10px";

    digital.style.fontSize = "26px";
    digital.style.color = ui.TEXT_COLOR;

    stopwatch.style.fontSize = "11px";
    stopwatch.style.color = ui.MUTED_COLOR;

    toolbar.appendChild(ui.button("clock", function () {
      setMode("clock");
    }));
    toolbar.appendChild(ui.button("stopwatch", function () {
      setMode("stopwatch");
    }));
    toolbar.appendChild(ui.button("start / stop", toggleRun));
    toolbar.appendChild(ui.button("reset", resetWatch));
    toolbar.appendChild(ui.spacer());
    toolbar.appendChild(stateValue);

    column.appendChild(canvas);
    column.appendChild(digital);
    column.appendChild(stopwatch);

    stage.appendChild(column);

    aSheet.appendChild(toolbar);
    aSheet.appendChild(stage);

    frameTimer = window.requestAnimationFrame(tick);

    return teardown;
  }

  window.makeApp("clock", "analog clock and stopwatch", 420, 460, build, "tools");
})();
