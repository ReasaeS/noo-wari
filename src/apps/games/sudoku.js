(function () {
  var SIZE = 9;
  var LEVELS = [
    { name: "easy", holes: 36 },
    { name: "medium", holes: 46 },
    { name: "hard", holes: 54 }
  ];

  function levelNames() {
    var names = [];

    for (var i = 0; i < LEVELS.length; i++) {
      names.push(LEVELS[i].name);
    }

    return names;
  }

  function findLevel(name) {
    for (var i = 0; i < LEVELS.length; i++) {
      if (LEVELS[i].name == name) {
        return LEVELS[i];
      }
    }

    return LEVELS[0];
  }

  function makeEmpty() {
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

  function isAllowed(grid, row, column, value) {
    for (var i = 0; i < SIZE; i++) {
      if (grid[row][i] == value || grid[i][column] == value) {
        return false;
      }
    }

    var boxRow = Math.floor(row / 3) * 3;
    var boxColumn = Math.floor(column / 3) * 3;

    for (var y = boxRow; y < boxRow + 3; y++) {
      for (var x = boxColumn; x < boxColumn + 3; x++) {
        if (grid[y][x] == value) {
          return false;
        }
      }
    }

    return true;
  }

  function shuffled() {
    var values = [1, 2, 3, 4, 5, 6, 7, 8, 9];

    for (var i = values.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var swap = values[i];

      values[i] = values[j];
      values[j] = swap;
    }

    return values;
  }

  function fill(grid, index) {
    if (index >= SIZE * SIZE) {
      return true;
    }

    var row = Math.floor(index / SIZE);
    var column = index % SIZE;
    var values = shuffled();

    for (var i = 0; i < values.length; i++) {
      if (isAllowed(grid, row, column, values[i])) {
        grid[row][column] = values[i];

        if (fill(grid, index + 1)) {
          return true;
        }

        grid[row][column] = 0;
      }
    }

    return false;
  }

  function build(aSheet) {
    var ui = window.ui;

    var toolbar = ui.toolbar();
    var stage = ui.center();
    var board = document.createElement("div");

    var level = LEVELS[0];
    var solution = makeEmpty();
    var puzzle = makeEmpty();
    var entries = [];
    var selected = null;

    var stateValue = ui.value("ready");

    function paintCell(aCell) {
      var cellStyle = aCell.element.style;
      var value = puzzle[aCell.row][aCell.column];

      if (value == 0) {
        aCell.element.textContent = "";
      } else {
        aCell.element.textContent = "" + value;
      }

      if (aCell.isFixed) {
        cellStyle.color = ui.TEXT_COLOR;
        cellStyle.backgroundColor = ui.PANEL_COLOR;
      } else if (value != 0 && value != solution[aCell.row][aCell.column]) {
        cellStyle.color = ui.DANGER_COLOR;
        cellStyle.backgroundColor = "var(--nw-alert)";
      } else {
        cellStyle.color = ui.ACCENT_COLOR;
        cellStyle.backgroundColor = "var(--nw-sunken)";
      }

      if (selected == aCell) {
        cellStyle.backgroundColor = "var(--nw-active)";
      }
    }

    function paintAll() {
      for (var i = 0; i < entries.length; i++) {
        paintCell(entries[i]);
      }
    }

    function isSolved() {
      for (var row = 0; row < SIZE; row++) {
        for (var column = 0; column < SIZE; column++) {
          if (puzzle[row][column] != solution[row][column]) {
            return false;
          }
        }
      }

      return true;
    }

    function makeSelectHandler(aCell) {
      return function () {
        if (aCell.isFixed) {
          return;
        }

        selected = aCell;

        paintAll();
      };
    }

    function makeCell(row, column) {
      var anElement = document.createElement("div");
      var elementStyle = anElement.style;

      elementStyle.width = "34px";
      elementStyle.height = "34px";
      elementStyle.lineHeight = "34px";
      elementStyle.textAlign = "center";
      elementStyle.fontSize = "15px";
      elementStyle.cursor = "pointer";
      elementStyle.userSelect = "none";
      elementStyle.boxSizing = "border-box";
      elementStyle.borderStyle = "solid";
      elementStyle.borderWidth = "1px";
      elementStyle.borderColor = ui.BORDER_COLOR;

      if (column % 3 == 0) {
        elementStyle.borderLeftWidth = "2px";
      }

      if (row % 3 == 0) {
        elementStyle.borderTopWidth = "2px";
      }

      if (column == SIZE - 1) {
        elementStyle.borderRightWidth = "2px";
      }

      if (row == SIZE - 1) {
        elementStyle.borderBottomWidth = "2px";
      }

      var aCell = new Object();

      aCell.element = anElement;
      aCell.row = row;
      aCell.column = column;
      aCell.isFixed = false;

      anElement.addEventListener("click", makeSelectHandler(aCell));

      return aCell;
    }

    function generate() {
      solution = makeEmpty();

      fill(solution, 0);

      puzzle = makeEmpty();

      for (var row = 0; row < SIZE; row++) {
        for (var column = 0; column < SIZE; column++) {
          puzzle[row][column] = solution[row][column];
        }
      }

      var removed = 0;

      while (removed < level.holes) {
        var r = Math.floor(Math.random() * SIZE);
        var c = Math.floor(Math.random() * SIZE);

        if (puzzle[r][c] != 0) {
          puzzle[r][c] = 0;

          removed = removed + 1;
        }
      }

      for (var i = 0; i < entries.length; i++) {
        entries[i].isFixed = puzzle[entries[i].row][entries[i].column] != 0;
      }

      selected = null;

      stateValue.textContent = "";
      stateValue.style.color = ui.ACCENT_COLOR;

      paintAll();
    }

    function reveal() {
      for (var row = 0; row < SIZE; row++) {
        for (var column = 0; column < SIZE; column++) {
          puzzle[row][column] = solution[row][column];
        }
      }

      stateValue.textContent = "revealed";
      stateValue.style.color = ui.MUTED_COLOR;

      paintAll();
    }

    function onKeyDown(event) {
      if (selected == null) {
        return;
      }

      if (event.key >= "1" && event.key <= "9") {
        puzzle[selected.row][selected.column] = Number(event.key);
      } else if (event.key == "Backspace" || event.key == "Delete" || event.key == "0") {
        puzzle[selected.row][selected.column] = 0;
      } else {
        return;
      }

      event.preventDefault();

      paintAll();

      if (isSolved()) {
        stateValue.textContent = "solved";
        stateValue.style.color = ui.ACCENT_COLOR;
      }
    }

    function onLevelChange(name) {
      level = findLevel(name);

      generate();
    }

    board.style.display = "grid";
    board.style.gridTemplateColumns = "repeat(9, 34px)";

    for (var row = 0; row < SIZE; row++) {
      for (var column = 0; column < SIZE; column++) {
        var aCell = makeCell(row, column);

        entries.push(aCell);
        board.appendChild(aCell.element);
      }
    }

    toolbar.appendChild(ui.button("new", generate));
    toolbar.appendChild(ui.button("reveal", reveal));
    toolbar.appendChild(ui.select(levelNames(), level.name, onLevelChange));
    toolbar.appendChild(ui.spacer());
    toolbar.appendChild(stateValue);

    stage.appendChild(board);

    aSheet.appendChild(toolbar);
    aSheet.appendChild(stage);

    aSheet.tabIndex = 0;
    aSheet.style.outlineStyle = "none";
    aSheet.addEventListener("keydown", onKeyDown);

    generate();

    setTimeout(function () {
      aSheet.focus();
    }, 0);

    return null;
  }

  window.makeApp("sudoku", "generated puzzles with checking", 420, 480, build, "games");
})();
