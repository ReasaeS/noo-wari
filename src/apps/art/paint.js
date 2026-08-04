(function () {
  var PALETTE = [
    "#c5cad3", "#1b2029", "#c96a63", "#d6b46a",
    "#7fd18b", "#7aa2e0", "#a98fd1", "#6fc3c9",
    "#d19a63", "#7c848f"
  ];

  var TOOLS = ["brush", "line", "rect", "circle", "eraser"];

  function build(aSheet) {
    var ui = window.ui;

    var toolbar = ui.toolbar();
    var stage = ui.center();
    var canvas = ui.canvas();
    var context = canvas.getContext("2d");
    var swatches = document.createElement("div");

    var color = PALETTE[0];
    var tool = TOOLS[0];
    var size = 4;
    var isDrawing = false;
    var startX = 0;
    var startY = 0;
    var snapshot = null;

    function positionOf(event) {
      var box = canvas.getBoundingClientRect();

      return {
        x: (event.clientX - box.left) * (canvas.width / box.width),
        y: (event.clientY - box.top) * (canvas.height / box.height)
      };
    }

    function paintSwatches() {
      ui.clear(swatches);

      for (var i = 0; i < PALETTE.length; i++) {
        swatches.appendChild(makeSwatch(PALETTE[i]));
      }
    }

    function makeSwatch(value) {
      var aSwatch = document.createElement("div");
      var swatchStyle = aSwatch.style;

      swatchStyle.width = "18px";
      swatchStyle.height = "18px";
      swatchStyle.borderRadius = "4px";
      swatchStyle.backgroundColor = value;
      swatchStyle.cursor = "pointer";
      swatchStyle.boxSizing = "border-box";
      swatchStyle.borderStyle = "solid";
      swatchStyle.borderWidth = "2px";

      if (value == color) {
        swatchStyle.borderColor = ui.ACCENT_COLOR;
      } else {
        swatchStyle.borderColor = "rgba(0, 0, 0, 0.3)";
      }

      aSwatch.addEventListener("click", function () {
        color = value;

        paintSwatches();
      });

      return aSwatch;
    }

    function clearCanvas() {
      context.fillStyle = "#2f3745";
      context.fillRect(0, 0, canvas.width, canvas.height);
    }

    function stamp(x, y) {
      if (tool == "eraser") {
        context.fillStyle = "#2f3745";
      } else {
        context.fillStyle = color;
      }

      context.beginPath();
      context.arc(x, y, Math.max(size / 2, 0.5), 0, Math.PI * 2);
      context.fill();
    }

    function beginStroke(event) {
      isDrawing = true;

      var spot = positionOf(event);

      startX = spot.x;
      startY = spot.y;

      snapshot = context.getImageData(0, 0, canvas.width, canvas.height);

      stamp(startX, startY);

      if (tool == "brush" || tool == "eraser") {
        context.beginPath();
        context.moveTo(startX, startY);
      }
    }

    function extendStroke(event) {
      if (!isDrawing) {
        return;
      }

      var spot = positionOf(event);

      context.lineWidth = size;
      context.lineCap = "round";
      context.lineJoin = "round";

      if (tool == "eraser") {
        context.strokeStyle = "#2f3745";
      } else {
        context.strokeStyle = color;
      }

      if (tool == "brush" || tool == "eraser") {
        context.lineTo(spot.x, spot.y);
        context.stroke();

        return;
      }

      context.putImageData(snapshot, 0, 0);

      if (tool == "line") {
        context.beginPath();
        context.moveTo(startX, startY);
        context.lineTo(spot.x, spot.y);
        context.stroke();
      }

      if (tool == "rect") {
        context.strokeRect(startX, startY, spot.x - startX, spot.y - startY);
      }

      if (tool == "circle") {
        var radius = Math.sqrt(
          Math.pow(spot.x - startX, 2) + Math.pow(spot.y - startY, 2)
        );

        context.beginPath();
        context.arc(startX, startY, radius, 0, Math.PI * 2);
        context.stroke();
      }
    }

    function endStroke() {
      isDrawing = false;
    }

    function onToolChange(name) {
      tool = name;
    }

    function onSizeChange(amount) {
      size = amount;
    }

    function download() {
      var link = document.createElement("a");

      link.download = "noo-wari-paint.png";
      link.href = canvas.toDataURL("image/png");

      link.click();
    }

    canvas.width = 520;
    canvas.height = 360;
    canvas.style.cursor = "crosshair";
    canvas.style.borderStyle = "solid";
    canvas.style.borderWidth = "1px";
    canvas.style.borderColor = ui.BORDER_COLOR;
    canvas.style.maxWidth = "100%";
    canvas.style.imageRendering = "auto";

    canvas.addEventListener("mousedown", beginStroke);
    canvas.addEventListener("mousemove", extendStroke);
    canvas.addEventListener("mouseup", endStroke);
    canvas.addEventListener("mouseleave", endStroke);

    swatches.style.display = "flex";
    swatches.style.gap = "4px";

    toolbar.appendChild(ui.select(TOOLS, tool, onToolChange));
    toolbar.appendChild(ui.range(1, 40, size, onSizeChange));
    toolbar.appendChild(swatches);
    toolbar.appendChild(ui.spacer());
    toolbar.appendChild(ui.button("clear", clearCanvas));
    toolbar.appendChild(ui.button("save", download));

    stage.appendChild(canvas);

    aSheet.appendChild(toolbar);
    aSheet.appendChild(stage);

    paintSwatches();
    clearCanvas();

    return null;
  }

  window.makeApp("paint", "canvas drawing with shapes", 600, 480, build, "art");
})();
