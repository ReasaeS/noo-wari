(function () {
  var CELL_SIZE = 24;
  var LEVELS = [
    { name: "beginner", columns: 9, rows: 9, mines: 10 },
    { name: "intermediate", columns: 16, rows: 16, mines: 40 },
    { name: "expert", columns: 24, rows: 16, mines: 70 }
  ];

  var NUMBER_COLORS = [
    "#7c848f",
    "#7aa2e0",
    "#7fd18b",
    "#c96a63",
    "#a98fd1",
    "#d6b46a",
    "#6fc3c9",
    "#c5cad3",
    "#7c848f"
  ];

  function findLevel(name) {
    for (var i = 0; i < LEVELS.length; i++) {
      if (LEVELS[i].name == name) {
        return LEVELS[i];
      }
    }

    return LEVELS[0];
  }

  function levelNames() {
    var names = [];

    for (var i = 0; i < LEVELS.length; i++) {
      names.push(LEVELS[i].name);
    }

    return names;
  }

  function build(aSheet) {
    var ui = window.ui;

    var toolbar = ui.toolbar();
    var stage = ui.center();
    var board = document.createElement("div");

    var level = LEVELS[0];
    var cells = [];
    var isOver = false;
    var isStarted = false;
    var flagCount = 0;
    var revealCount = 0;
    var startTime = 0;
    var clockTimer = 0;

    var statusValue = ui.value("ready");
    var minesValue = ui.value("0");
    var timeValue = ui.value("0s");

    function indexOf(column, row) {
      return row * level.columns + column;
    }

    function isInside(column, row) {
      return column >= 0 && column < level.columns && row >= 0 && row < level.rows;
    }

    function forEachNeighbour(column, row, visit) {
      for (var dy = -1; dy <= 1; dy++) {
        for (var dx = -1; dx <= 1; dx++) {
          if (dx == 0 && dy == 0) {
            continue;
          }

          if (isInside(column + dx, row + dy)) {
            visit(cells[indexOf(column + dx, row + dy)]);
          }
        }
      }
    }

    function paintCell(aCell) {
      var cellStyle = aCell.element.style;

      if (aCell.isRevealed) {
        cellStyle.backgroundColor = ui.SURFACE_COLOR;
        cellStyle.borderColor = ui.BORDER_COLOR;
        cellStyle.cursor = "default";

        if (aCell.isMine) {
          aCell.element.textContent = "✳";
          cellStyle.color = ui.DANGER_COLOR;
          cellStyle.backgroundColor = "var(--nw-alert)";
          return;
        }

        if (aCell.count == 0) {
          aCell.element.textContent = "";
          return;
        }

        aCell.element.textContent = "" + aCell.count;
        cellStyle.color = NUMBER_COLORS[aCell.count];

        return;
      }

      cellStyle.backgroundColor = ui.PANEL_COLOR;
      cellStyle.borderColor = ui.BORDER_COLOR;
      cellStyle.cursor = "pointer";

      if (aCell.isFlagged) {
        aCell.element.textContent = "⚑";
        cellStyle.color = ui.WARN_COLOR;
        return;
      }

      aCell.element.textContent = "";
    }

    function updateStatus() {
      minesValue.textContent = level.mines - flagCount + " left";
    }

    function stopClock() {
      if (clockTimer != 0) {
        clearInterval(clockTimer);

        clockTimer = 0;
      }
    }

    function tickClock() {
      timeValue.textContent = Math.floor((Date.now() - startTime) / 1000) + "s";
    }

    function startClock() {
      startTime = Date.now();

      stopClock();

      clockTimer = setInterval(tickClock, 1000);

      tickClock();
    }

    function placeMines(safeIndex) {
      var placed = 0;

      while (placed < level.mines) {
        var index = Math.floor(Math.random() * cells.length);

        if (index == safeIndex || cells[index].isMine) {
          continue;
        }

        cells[index].isMine = true;

        placed = placed + 1;
      }

      for (var row = 0; row < level.rows; row++) {
        for (var column = 0; column < level.columns; column++) {
          var aCell = cells[indexOf(column, row)];
          var count = 0;

          forEachNeighbour(column, row, function (neighbour) {
            if (neighbour.isMine) {
              count = count + 1;
            }
          });

          aCell.count = count;
        }
      }
    }

    function revealAll() {
      for (var i = 0; i < cells.length; i++) {
        if (cells[i].isMine) {
          cells[i].isRevealed = true;
        }

        paintCell(cells[i]);
      }
    }

    function finish(hasWon) {
      isOver = true;

      stopClock();

      revealAll();

      if (hasWon) {
        statusValue.textContent = "cleared";
        statusValue.style.color = ui.ACCENT_COLOR;
      } else {
        statusValue.textContent = "boom";
        statusValue.style.color = ui.DANGER_COLOR;
      }
    }

    function reveal(aCell) {
      if (aCell.isRevealed || aCell.isFlagged) {
        return;
      }

      aCell.isRevealed = true;

      revealCount = revealCount + 1;

      paintCell(aCell);

      if (aCell.isMine) {
        finish(false);
        return;
      }

      if (aCell.count == 0) {
        forEachNeighbour(aCell.column, aCell.row, reveal);
      }

      if (revealCount == cells.length - level.mines) {
        finish(true);
      }
    }

    function makeClickHandler(aCell) {
      return function (event) {
        if (isOver) {
          return;
        }

        if (!isStarted) {
          isStarted = true;

          placeMines(indexOf(aCell.column, aCell.row));
          startClock();

          statusValue.textContent = "";
          statusValue.style.color = ui.ACCENT_COLOR;
        }

        reveal(aCell);
      };
    }

    function makeFlagHandler(aCell) {
      return function (event) {
        event.preventDefault();

        if (isOver || aCell.isRevealed) {
          return;
        }

        aCell.isFlagged = !aCell.isFlagged;

        if (aCell.isFlagged) {
          flagCount = flagCount + 1;
        } else {
          flagCount = flagCount - 1;
        }

        paintCell(aCell);
        updateStatus();
      };
    }

    function makeCell(column, row) {
      var anElement = document.createElement("div");
      var elementStyle = anElement.style;

      elementStyle.width = CELL_SIZE + "px";
      elementStyle.height = CELL_SIZE + "px";
      elementStyle.lineHeight = CELL_SIZE - 2 + "px";
      elementStyle.textAlign = "center";
      elementStyle.fontSize = "12px";
      elementStyle.borderStyle = "solid";
      elementStyle.borderWidth = "1px";
      elementStyle.borderRadius = "3px";
      elementStyle.boxSizing = "border-box";
      elementStyle.userSelect = "none";

      var aCell = new Object();

      aCell.element = anElement;
      aCell.column = column;
      aCell.row = row;
      aCell.isMine = false;
      aCell.isRevealed = false;
      aCell.isFlagged = false;
      aCell.count = 0;

      anElement.addEventListener("click", makeClickHandler(aCell));
      anElement.addEventListener("contextmenu", makeFlagHandler(aCell));

      return aCell;
    }

    function reset() {
      stopClock();

      cells = [];
      isOver = false;
      isStarted = false;
      flagCount = 0;
      revealCount = 0;

      statusValue.textContent = "ready";
      statusValue.style.color = ui.ACCENT_COLOR;
      timeValue.textContent = "0s";

      ui.clear(board);

      board.style.gridTemplateColumns = "repeat(" + level.columns + ", " + CELL_SIZE + "px)";

      for (var row = 0; row < level.rows; row++) {
        for (var column = 0; column < level.columns; column++) {
          var aCell = makeCell(column, row);

          cells.push(aCell);
          board.appendChild(aCell.element);

          paintCell(aCell);
        }
      }

      updateStatus();
    }

    function onLevelChange(name) {
      level = findLevel(name);

      reset();
    }

    board.style.display = "grid";
    board.style.gap = "2px";

    toolbar.appendChild(ui.button("new game", reset));
    toolbar.appendChild(ui.select(levelNames(), level.name, onLevelChange));
    toolbar.appendChild(ui.spacer());
    toolbar.appendChild(ui.label("mines"));
    toolbar.appendChild(minesValue);
    toolbar.appendChild(ui.label("time"));
    toolbar.appendChild(timeValue);
    toolbar.appendChild(statusValue);

    stage.appendChild(board);

    aSheet.appendChild(toolbar);
    aSheet.appendChild(stage);

    reset();

    return stopClock;
  }

  window.makeApp("minesweeper", "classic mine clearing grid", 560, 480, build, "games");
})();
