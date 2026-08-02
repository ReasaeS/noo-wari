(function () {
  var COLUMNS = 60;
  var ROWS = 40;
  var CELL = 9;

  var PATTERNS = ["random", "glider gun", "pulsar", "acorn", "empty"];

  function build(aSheet) {
    var ui = window.ui;

    var toolbar = ui.toolbar();
    var stage = ui.center();
    var canvas = ui.canvas();
    var context = canvas.getContext("2d");

    var grid = [];
    var generation = 0;
    var speed = 8;
    var isRunning = false;
    var stepTimer = 0;
    var isPainting = false;

    var generationValue = ui.value("0");
    var populationValue = ui.value("0");

    function makeGrid() {
      var made = [];

      for (var row = 0; row < ROWS; row++) {
        var line = [];

        for (var column = 0; column < COLUMNS; column++) {
          line.push(0);
        }

        made.push(line);
      }

      return made;
    }

    function population() {
      var count = 0;

      for (var row = 0; row < ROWS; row++) {
        for (var column = 0; column < COLUMNS; column++) {
          count = count + grid[row][column];
        }
      }

      return count;
    }

    function neighbours(column, row) {
      var count = 0;

      for (var dy = -1; dy <= 1; dy++) {
        for (var dx = -1; dx <= 1; dx++) {
          if (dx == 0 && dy == 0) {
            continue;
          }

          var x = (column + dx + COLUMNS) % COLUMNS;
          var y = (row + dy + ROWS) % ROWS;

          count = count + grid[y][x];
        }
      }

      return count;
    }

    function step() {
      var next = makeGrid();

      for (var row = 0; row < ROWS; row++) {
        for (var column = 0; column < COLUMNS; column++) {
          var count = neighbours(column, row);

          if (grid[row][column] == 1) {
            if (count == 2 || count == 3) {
              next[row][column] = 1;
            }
          } else if (count == 3) {
            next[row][column] = 1;
          }
        }
      }

      grid = next;
      generation = generation + 1;

      draw();
    }

    function draw() {
      context.fillStyle = "#1b2029";
      context.fillRect(0, 0, canvas.width, canvas.height);

      for (var row = 0; row < ROWS; row++) {
        for (var column = 0; column < COLUMNS; column++) {
          if (grid[row][column] == 1) {
            context.fillStyle = "#7fd18b";
            context.fillRect(column * CELL, row * CELL, CELL - 1, CELL - 1);
          }
        }
      }

      generationValue.textContent = "" + generation;
      populationValue.textContent = "" + population();
    }

    function stop() {
      isRunning = false;

      if (stepTimer != 0) {
        clearInterval(stepTimer);

        stepTimer = 0;
      }
    }

    function play() {
      stop();

      isRunning = true;

      stepTimer = setInterval(step, 1000 / speed);
    }

    function toggle() {
      if (isRunning) {
        stop();
      } else {
        play();
      }
    }

    function fillRandom() {
      for (var row = 0; row < ROWS; row++) {
        for (var column = 0; column < COLUMNS; column++) {
          if (Math.random() > 0.78) {
            grid[row][column] = 1;
          }
        }
      }
    }

    function place(cells, offsetX, offsetY) {
      for (var i = 0; i < cells.length; i++) {
        var x = offsetX + cells[i][0];
        var y = offsetY + cells[i][1];

        if (x >= 0 && x < COLUMNS && y >= 0 && y < ROWS) {
          grid[y][x] = 1;
        }
      }
    }

    function loadPattern(name) {
      grid = makeGrid();
      generation = 0;

      if (name == "random") {
        fillRandom();
      }

      if (name == "glider gun") {
        place([
          [0, 4], [0, 5], [1, 4], [1, 5],
          [10, 4], [10, 5], [10, 6], [11, 3], [11, 7],
          [12, 2], [12, 8], [13, 2], [13, 8], [14, 5],
          [15, 3], [15, 7], [16, 4], [16, 5], [16, 6], [17, 5],
          [20, 2], [20, 3], [20, 4], [21, 2], [21, 3], [21, 4],
          [22, 1], [22, 5], [24, 0], [24, 1], [24, 5], [24, 6],
          [34, 2], [34, 3], [35, 2], [35, 3]
        ], 4, 8);
      }

      if (name == "pulsar") {
        var arms = [2, 3, 4, 8, 9, 10];
        var cells = [];

        for (var i = 0; i < arms.length; i++) {
          cells.push([arms[i], 0]);
          cells.push([arms[i], 5]);
          cells.push([arms[i], 7]);
          cells.push([arms[i], 12]);
          cells.push([0, arms[i]]);
          cells.push([5, arms[i]]);
          cells.push([7, arms[i]]);
          cells.push([12, arms[i]]);
        }

        place(cells, 24, 14);
      }

      if (name == "acorn") {
        place([
          [1, 0], [3, 1], [0, 2], [1, 2], [4, 2], [5, 2], [6, 2]
        ], 28, 20);
      }

      draw();
    }

    function positionOf(event) {
      var box = canvas.getBoundingClientRect();

      return {
        column: Math.floor((event.clientX - box.left) / CELL),
        row: Math.floor((event.clientY - box.top) / CELL)
      };
    }

    function paintCell(event) {
      var spot = positionOf(event);

      if (spot.column < 0 || spot.column >= COLUMNS) {
        return;
      }

      if (spot.row < 0 || spot.row >= ROWS) {
        return;
      }

      grid[spot.row][spot.column] = 1;

      draw();
    }

    function onSpeedChange(amount) {
      speed = amount;

      if (isRunning) {
        play();
      }
    }

    canvas.width = COLUMNS * CELL;
    canvas.height = ROWS * CELL;
    canvas.style.cursor = "crosshair";
    canvas.style.maxWidth = "100%";
    canvas.style.borderStyle = "solid";
    canvas.style.borderWidth = "1px";
    canvas.style.borderColor = ui.BORDER_COLOR;

    canvas.addEventListener("mousedown", function (event) {
      isPainting = true;

      paintCell(event);
    });

    canvas.addEventListener("mousemove", function (event) {
      if (isPainting) {
        paintCell(event);
      }
    });

    canvas.addEventListener("mouseup", function () {
      isPainting = false;
    });

    canvas.addEventListener("mouseleave", function () {
      isPainting = false;
    });

    toolbar.appendChild(ui.button("play / pause", toggle));
    toolbar.appendChild(ui.button("step", step));
    toolbar.appendChild(ui.select(PATTERNS, "random", loadPattern));
    toolbar.appendChild(ui.range(1, 30, speed, onSpeedChange));
    toolbar.appendChild(ui.spacer());
    toolbar.appendChild(ui.label("gen"));
    toolbar.appendChild(generationValue);
    toolbar.appendChild(ui.label("pop"));
    toolbar.appendChild(populationValue);

    stage.appendChild(canvas);

    aSheet.appendChild(toolbar);
    aSheet.appendChild(stage);

    grid = makeGrid();

    loadPattern("random");

    return stop;
  }

  window.makeApp("life", "conway's game of life", 620, 480, build, "games");
})();
