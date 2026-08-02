(function () {
  var COLUMNS = 10;
  var ROWS = 20;
  var CELL = 20;

  var SHAPES = [
    { name: "i", color: "#6fc3c9", cells: [[0, 1], [1, 1], [2, 1], [3, 1]] },
    { name: "o", color: "#d6b46a", cells: [[1, 0], [2, 0], [1, 1], [2, 1]] },
    { name: "t", color: "#a98fd1", cells: [[1, 0], [0, 1], [1, 1], [2, 1]] },
    { name: "s", color: "#7fd18b", cells: [[1, 0], [2, 0], [0, 1], [1, 1]] },
    { name: "z", color: "#c96a63", cells: [[0, 0], [1, 0], [1, 1], [2, 1]] },
    { name: "j", color: "#7aa2e0", cells: [[0, 0], [0, 1], [1, 1], [2, 1]] },
    { name: "l", color: "#d19a63", cells: [[2, 0], [0, 1], [1, 1], [2, 1]] }
  ];

  function build(aSheet, appWindow) {
    var ui = window.ui;

    var toolbar = ui.toolbar();
    var stage = ui.center();
    var canvas = ui.canvas();
    var context = canvas.getContext("2d");

    var board = [];
    var piece = null;
    var nextShape = null;
    var score = 0;
    var lines = 0;
    var level = 1;
    var isOver = false;
    var isPaused = false;
    var dropTimer = 0;

    var scoreValue = ui.value("0");
    var linesValue = ui.value("0");
    var levelValue = ui.value("1");
    var stateValue = ui.value("");

    function makeBoard() {
      var made = [];

      for (var row = 0; row < ROWS; row++) {
        var line = [];

        for (var column = 0; column < COLUMNS; column++) {
          line.push(null);
        }

        made.push(line);
      }

      return made;
    }

    function randomShape() {
      return SHAPES[Math.floor(Math.random() * SHAPES.length)];
    }

    function makePiece(shape) {
      var aPiece = new Object();

      aPiece.shape = shape;
      aPiece.cells = shape.cells.slice(0);
      aPiece.x = 3;
      aPiece.y = 0;

      return aPiece;
    }

    function rotate(cells) {
      var turned = [];

      for (var i = 0; i < cells.length; i++) {
        turned.push([3 - cells[i][1], cells[i][0]]);
      }

      var minX = 3;
      var minY = 3;

      for (var j = 0; j < turned.length; j++) {
        if (turned[j][0] < minX) {
          minX = turned[j][0];
        }

        if (turned[j][1] < minY) {
          minY = turned[j][1];
        }
      }

      var shifted = [];

      for (var k = 0; k < turned.length; k++) {
        shifted.push([turned[k][0] - minX, turned[k][1] - minY]);
      }

      return shifted;
    }

    function fits(cells, x, y) {
      for (var i = 0; i < cells.length; i++) {
        var column = x + cells[i][0];
        var row = y + cells[i][1];

        if (column < 0 || column >= COLUMNS || row >= ROWS) {
          return false;
        }

        if (row >= 0 && board[row][column] != null) {
          return false;
        }
      }

      return true;
    }

    function lockPiece() {
      for (var i = 0; i < piece.cells.length; i++) {
        var column = piece.x + piece.cells[i][0];
        var row = piece.y + piece.cells[i][1];

        if (row >= 0) {
          board[row][column] = piece.shape.color;
        }
      }

      clearLines();

      piece = makePiece(nextShape);
      nextShape = randomShape();

      if (!fits(piece.cells, piece.x, piece.y)) {
        finish();
      }
    }

    function clearLines() {
      var cleared = 0;

      for (var row = ROWS - 1; row >= 0; row--) {
        var full = true;

        for (var column = 0; column < COLUMNS; column++) {
          if (board[row][column] == null) {
            full = false;
          }
        }

        if (full) {
          board.splice(row, 1);

          var fresh = [];

          for (var i = 0; i < COLUMNS; i++) {
            fresh.push(null);
          }

          board.unshift(fresh);

          cleared = cleared + 1;

          row = row + 1;
        }
      }

      if (cleared == 0) {
        return;
      }

      lines = lines + cleared;
      score = score + cleared * cleared * 100;
      level = 1 + Math.floor(lines / 10);

      scoreValue.textContent = "" + score;
      linesValue.textContent = "" + lines;
      levelValue.textContent = "" + level;

      restartTimer();
    }

    function draw() {
      context.fillStyle = "#1b2029";
      context.fillRect(0, 0, canvas.width, canvas.height);

      for (var row = 0; row < ROWS; row++) {
        for (var column = 0; column < COLUMNS; column++) {
          if (board[row][column] != null) {
            drawCell(column, row, board[row][column]);
          }
        }
      }

      if (piece != null) {
        for (var i = 0; i < piece.cells.length; i++) {
          drawCell(
            piece.x + piece.cells[i][0],
            piece.y + piece.cells[i][1],
            piece.shape.color
          );
        }
      }

      context.strokeStyle = "rgba(59, 65, 76, 0.35)";
      context.lineWidth = 1;

      for (var c = 1; c < COLUMNS; c++) {
        context.beginPath();
        context.moveTo(c * CELL, 0);
        context.lineTo(c * CELL, canvas.height);
        context.stroke();
      }

      for (var r = 1; r < ROWS; r++) {
        context.beginPath();
        context.moveTo(0, r * CELL);
        context.lineTo(canvas.width, r * CELL);
        context.stroke();
      }
    }

    function drawCell(column, row, color) {
      if (row < 0) {
        return;
      }

      context.fillStyle = color;
      context.fillRect(column * CELL + 1, row * CELL + 1, CELL - 2, CELL - 2);
    }

    function move(dx) {
      if (piece == null || isPaused || isOver) {
        return;
      }

      if (fits(piece.cells, piece.x + dx, piece.y)) {
        piece.x = piece.x + dx;

        draw();
      }
    }

    function turn() {
      if (piece == null || isPaused || isOver) {
        return;
      }

      var turned = rotate(piece.cells);

      if (fits(turned, piece.x, piece.y)) {
        piece.cells = turned;

        draw();
      }
    }

    function drop() {
      if (piece == null || isPaused || isOver) {
        return;
      }

      if (fits(piece.cells, piece.x, piece.y + 1)) {
        piece.y = piece.y + 1;
      } else {
        lockPiece();
      }

      draw();
    }

    function slam() {
      if (piece == null || isPaused || isOver) {
        return;
      }

      while (fits(piece.cells, piece.x, piece.y + 1)) {
        piece.y = piece.y + 1;
      }

      lockPiece();
      draw();
    }

    function stop() {
      if (dropTimer != 0) {
        clearInterval(dropTimer);

        dropTimer = 0;
      }
    }

    function restartTimer() {
      stop();

      var interval = Math.max(700 - (level - 1) * 60, 90);

      dropTimer = setInterval(drop, interval);
    }

    function finish() {
      isOver = true;

      stop();

      stateValue.textContent = "game over";
      stateValue.style.color = ui.DANGER_COLOR;
    }

    function start() {
      board = makeBoard();
      score = 0;
      lines = 0;
      level = 1;
      isOver = false;
      isPaused = false;

      nextShape = randomShape();
      piece = makePiece(randomShape());

      scoreValue.textContent = "0";
      linesValue.textContent = "0";
      levelValue.textContent = "1";
      stateValue.textContent = "";
      stateValue.style.color = ui.ACCENT_COLOR;

      draw();
      restartTimer();
    }

    function togglePause() {
      if (isOver) {
        return;
      }

      isPaused = !isPaused;

      if (isPaused) {
        stateValue.textContent = "paused";
        stateValue.style.color = ui.WARN_COLOR;
      } else {
        stateValue.textContent = "";
        stateValue.style.color = ui.ACCENT_COLOR;
      }
    }

    function onKeyDown(event) {
      var key = event.key;

      if (key == "ArrowLeft") {
        move(-1);
      } else if (key == "ArrowRight") {
        move(1);
      } else if (key == "ArrowDown") {
        drop();
      } else if (key == "ArrowUp") {
        turn();
      } else if (key == " ") {
        slam();
      } else if (key == "p") {
        togglePause();
      } else {
        return;
      }

      event.preventDefault();
    }

    canvas.width = COLUMNS * CELL;
    canvas.height = ROWS * CELL;
    canvas.style.borderStyle = "solid";
    canvas.style.borderWidth = "1px";
    canvas.style.borderColor = ui.BORDER_COLOR;

    toolbar.appendChild(ui.button("new game", start));
    toolbar.appendChild(ui.button("pause", togglePause));
    toolbar.appendChild(ui.spacer());
    toolbar.appendChild(ui.label("score"));
    toolbar.appendChild(scoreValue);
    toolbar.appendChild(ui.label("lines"));
    toolbar.appendChild(linesValue);
    toolbar.appendChild(ui.label("lvl"));
    toolbar.appendChild(levelValue);
    toolbar.appendChild(stateValue);

    stage.appendChild(canvas);

    aSheet.appendChild(toolbar);
    aSheet.appendChild(stage);

    aSheet.tabIndex = 0;
    aSheet.style.outlineStyle = "none";
    aSheet.addEventListener("keydown", onKeyDown);

    start();

    setTimeout(function () {
      aSheet.focus();
    }, 0);

    return stop;
  }

  window.makeApp("tetris", "stack the falling blocks", 380, 560, build);
})();
