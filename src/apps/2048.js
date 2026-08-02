(function () {
  var SIZE = 4;

  var TILE_COLORS = {
    2: "#39414f",
    4: "#414b5c",
    8: "#5a7a63",
    16: "#63906f",
    32: "#6fa87c",
    64: "#7fd18b",
    128: "#c9a45c",
    256: "#d1a94f",
    512: "#d19a63",
    1024: "#c9736a",
    2048: "#a98fd1"
  };

  function build(aSheet) {
    var ui = window.ui;

    var toolbar = ui.toolbar();
    var stage = ui.center();
    var board = document.createElement("div");

    var grid = [];
    var score = 0;
    var best = 0;
    var isOver = false;

    var scoreValue = ui.value("0");
    var bestValue = ui.value("0");
    var stateValue = ui.value("");

    function makeGrid() {
      var made = [];

      for (var row = 0; row < SIZE; row++) {
        var line = [];

        for (var column = 0; column < SIZE; column++) {
          line.push(0);
        }

        made.push(line);
      }

      return made;
    }

    function emptyCells() {
      var found = [];

      for (var row = 0; row < SIZE; row++) {
        for (var column = 0; column < SIZE; column++) {
          if (grid[row][column] == 0) {
            found.push({ row: row, column: column });
          }
        }
      }

      return found;
    }

    function spawn() {
      var free = emptyCells();

      if (free.length == 0) {
        return;
      }

      var spot = free[Math.floor(Math.random() * free.length)];
      var value = 2;

      if (Math.random() > 0.9) {
        value = 4;
      }

      grid[spot.row][spot.column] = value;
    }

    function colorOf(value) {
      if (typeof TILE_COLORS[value] == "undefined") {
        return "#a98fd1";
      }

      return TILE_COLORS[value];
    }

    function paint() {
      ui.clear(board);

      for (var row = 0; row < SIZE; row++) {
        for (var column = 0; column < SIZE; column++) {
          var value = grid[row][column];
          var aTile = document.createElement("div");
          var tileStyle = aTile.style;

          tileStyle.display = "flex";
          tileStyle.alignItems = "center";
          tileStyle.justifyContent = "center";
          tileStyle.borderRadius = "5px";
          tileStyle.fontSize = "20px";
          tileStyle.userSelect = "none";

          if (value == 0) {
            tileStyle.backgroundColor = "var(--nw-sunken)";
            aTile.textContent = "";
          } else {
            tileStyle.backgroundColor = colorOf(value);
            tileStyle.color = "#1b2029";
            aTile.textContent = "" + value;

            if (value > 512) {
              tileStyle.fontSize = "16px";
            }
          }

          board.appendChild(aTile);
        }
      }

      scoreValue.textContent = "" + score;
      bestValue.textContent = "" + best;
    }

    function collapse(line) {
      var packed = [];

      for (var i = 0; i < line.length; i++) {
        if (line[i] != 0) {
          packed.push(line[i]);
        }
      }

      var merged = [];

      for (var j = 0; j < packed.length; j++) {
        if (j < packed.length - 1 && packed[j] == packed[j + 1]) {
          merged.push(packed[j] * 2);

          score = score + packed[j] * 2;

          j = j + 1;
        } else {
          merged.push(packed[j]);
        }
      }

      while (merged.length < SIZE) {
        merged.push(0);
      }

      return merged;
    }

    function rowOf(index) {
      return grid[index].slice(0);
    }

    function columnOf(index) {
      var line = [];

      for (var row = 0; row < SIZE; row++) {
        line.push(grid[row][index]);
      }

      return line;
    }

    function sameLine(left, right) {
      for (var i = 0; i < left.length; i++) {
        if (left[i] != right[i]) {
          return false;
        }
      }

      return true;
    }

    function reverse(line) {
      return line.slice(0).reverse();
    }

    function slide(direction) {
      var moved = false;

      for (var index = 0; index < SIZE; index++) {
        var line = [];

        if (direction == "left" || direction == "right") {
          line = rowOf(index);
        } else {
          line = columnOf(index);
        }

        var source = line;

        if (direction == "right" || direction == "down") {
          source = reverse(line);
        }

        var result = collapse(source);

        if (direction == "right" || direction == "down") {
          result = reverse(result);
        }

        if (!sameLine(line, result)) {
          moved = true;
        }

        for (var i = 0; i < SIZE; i++) {
          if (direction == "left" || direction == "right") {
            grid[index][i] = result[i];
          } else {
            grid[i][index] = result[i];
          }
        }
      }

      return moved;
    }

    function hasMoves() {
      if (emptyCells().length > 0) {
        return true;
      }

      for (var row = 0; row < SIZE; row++) {
        for (var column = 0; column < SIZE; column++) {
          var value = grid[row][column];

          if (column < SIZE - 1 && grid[row][column + 1] == value) {
            return true;
          }

          if (row < SIZE - 1 && grid[row + 1][column] == value) {
            return true;
          }
        }
      }

      return false;
    }

    function move(direction) {
      if (isOver) {
        return;
      }

      if (!slide(direction)) {
        return;
      }

      spawn();

      if (score > best) {
        best = score;
      }

      paint();

      if (!hasMoves()) {
        isOver = true;

        stateValue.textContent = "no moves";
        stateValue.style.color = ui.DANGER_COLOR;
      }
    }

    function start() {
      grid = makeGrid();
      score = 0;
      isOver = false;

      stateValue.textContent = "";
      stateValue.style.color = ui.ACCENT_COLOR;

      spawn();
      spawn();
      paint();
    }

    function onKeyDown(event) {
      var key = event.key;

      if (key == "ArrowLeft" || key == "a") {
        move("left");
      } else if (key == "ArrowRight" || key == "d") {
        move("right");
      } else if (key == "ArrowUp" || key == "w") {
        move("up");
      } else if (key == "ArrowDown" || key == "s") {
        move("down");
      } else {
        return;
      }

      event.preventDefault();
    }

    board.style.display = "grid";
    board.style.gridTemplateColumns = "repeat(" + SIZE + ", 70px)";
    board.style.gridTemplateRows = "repeat(" + SIZE + ", 70px)";
    board.style.gap = "6px";
    board.style.padding = "6px";
    board.style.backgroundColor = ui.PANEL_COLOR;
    board.style.borderRadius = "6px";

    toolbar.appendChild(ui.button("new game", start));
    toolbar.appendChild(ui.spacer());
    toolbar.appendChild(ui.label("score"));
    toolbar.appendChild(scoreValue);
    toolbar.appendChild(ui.label("best"));
    toolbar.appendChild(bestValue);
    toolbar.appendChild(stateValue);

    stage.appendChild(board);

    aSheet.appendChild(toolbar);
    aSheet.appendChild(stage);

    aSheet.tabIndex = 0;
    aSheet.style.outlineStyle = "none";
    aSheet.addEventListener("keydown", onKeyDown);

    start();

    setTimeout(function () {
      aSheet.focus();
    }, 0);

    return null;
  }

  window.makeApp("2048", "slide and merge the tiles", 400, 480, build);
})();
