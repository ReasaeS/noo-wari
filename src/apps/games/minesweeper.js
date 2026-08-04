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

  var UNKNOWN = 0;
  var OPEN = 1;
  var MINE = 2;

  var GROUP_CAP = 24;
  var STEP_BUDGET = 400000;
  var LAYOUT_TRIES = 2000;

  function makeNeighbourhood(columns, rows) {
    var out = [];

    for (var row = 0; row < rows; row++) {
      for (var column = 0; column < columns; column++) {
        var list = [];

        for (var dy = -1; dy <= 1; dy++) {
          for (var dx = -1; dx <= 1; dx++) {
            if (dx == 0 && dy == 0) {
              continue;
            }

            var nx = column + dx;
            var ny = row + dy;

            if (nx >= 0 && nx < columns && ny >= 0 && ny < rows) {
              list.push(ny * columns + nx);
            }
          }
        }

        out.push(list);
      }
    }

    return out;
  }

  function blend(left, right) {
    var out = [];

    for (var l = 0; l < left.length; l++) {
      if (!left[l]) {
        continue;
      }

      for (var r = 0; r < right.length; r++) {
        if (right[r]) {
          out[l + r] = true;
        }
      }
    }

    return out;
  }

  function makeSolver(aLevel) {
    var size = aLevel.columns * aLevel.rows;
    var neighbours = makeNeighbourhood(aLevel.columns, aLevel.rows);

    function tally(board) {
      var out = [];

      for (var i = 0; i < size; i++) {
        var list = neighbours[i];
        var total = 0;

        for (var k = 0; k < list.length; k++) {
          if (board[list[k]]) {
            total = total + 1;
          }
        }

        out.push(total);
      }

      return out;
    }

    function solve(board, safeIndex) {
      var count = tally(board);
      var state = [];
      var unknown = size;
      var marked = 0;
      var i;

      for (i = 0; i < size; i++) {
        state.push(UNKNOWN);
      }

      function open(index) {
        var stack = [index];

        while (stack.length > 0) {
          var at = stack.pop();

          if (state[at] != UNKNOWN) {
            continue;
          }

          state[at] = OPEN;
          unknown = unknown - 1;

          if (count[at] != 0) {
            continue;
          }

          var list = neighbours[at];

          for (var k = 0; k < list.length; k++) {
            if (state[list[k]] == UNKNOWN) {
              stack.push(list[k]);
            }
          }
        }
      }

      function flag(index) {
        if (state[index] != UNKNOWN) {
          return;
        }

        state[index] = MINE;
        unknown = unknown - 1;
        marked = marked + 1;
      }

      function freeAround(at) {
        var list = neighbours[at];
        var out = new Object();

        out.cells = [];
        out.sure = 0;

        for (var k = 0; k < list.length; k++) {
          if (state[list[k]] == UNKNOWN) {
            out.cells.push(list[k]);
          } else if (state[list[k]] == MINE) {
            out.sure = out.sure + 1;
          }
        }

        return out;
      }

      function simple() {
        var moved = false;

        for (var at = 0; at < size; at++) {
          if (state[at] != OPEN || count[at] == 0) {
            continue;
          }

          var near = freeAround(at);

          if (near.cells.length == 0) {
            continue;
          }

          var k;

          if (count[at] == near.sure) {
            for (k = 0; k < near.cells.length; k++) {
              open(near.cells[k]);
            }

            moved = true;

            continue;
          }

          if (count[at] - near.sure == near.cells.length) {
            for (k = 0; k < near.cells.length; k++) {
              flag(near.cells[k]);
            }

            moved = true;
          }
        }

        return moved;
      }

      function chart(group, remaining, budget) {
        var cells = group.cells;
        var span = cells.length;
        var order = new Object();
        var lines = [];
        var byLast = [];
        var pick = [];
        var sums = [];
        var mineAt = [];
        var safeAt = [];
        var spent = 0;
        var ruined = false;
        var c;

        if (span > GROUP_CAP) {
          return null;
        }

        for (c = 0; c < span; c++) {
          order[cells[c]] = c;

          byLast.push([]);
          pick.push(0);
          mineAt.push([]);
          safeAt.push([]);
        }

        for (c = 0; c < group.rules.length; c++) {
          var raw = group.rules[c].cells;
          var slots = [];
          var last = 0;

          for (var s = 0; s < raw.length; s++) {
            slots.push(order[raw[s]]);

            if (order[raw[s]] > last) {
              last = order[raw[s]];
            }
          }

          var line = new Object();

          line.slots = slots;
          line.need = group.rules[c].need;

          lines.push(line);
          byLast[last].push(line);
        }

        function step(at, used) {
          if (ruined) {
            return;
          }

          spent = spent + 1;

          if (spent > budget) {
            ruined = true;

            return;
          }

          if (used > remaining) {
            return;
          }

          var c;

          if (at == span) {
            sums[used] = true;

            for (c = 0; c < span; c++) {
              if (pick[c] == 1) {
                mineAt[c][used] = true;
              } else {
                safeAt[c][used] = true;
              }
            }

            return;
          }

          for (var value = 0; value <= 1; value++) {
            var checks = byLast[at];
            var fine = true;

            pick[at] = value;

            for (c = 0; c < checks.length; c++) {
              var slots = checks[c].slots;
              var total = 0;

              for (var s = 0; s < slots.length; s++) {
                total = total + pick[slots[s]];
              }

              if (total != checks[c].need) {
                fine = false;

                break;
              }
            }

            if (fine) {
              step(at + 1, used + value);
            }
          }
        }

        step(0, 0);

        if (ruined) {
          return null;
        }

        var report = new Object();

        report.cells = cells;
        report.sums = sums;
        report.mineAt = mineAt;
        report.safeAt = safeAt;

        return report;
      }

      function gather() {
        var rules = [];
        var edge = new Object();
        var loose = [];
        var at;
        var k;

        for (at = 0; at < size; at++) {
          if (state[at] != OPEN) {
            continue;
          }

          var near = freeAround(at);

          if (near.cells.length == 0) {
            continue;
          }

          for (k = 0; k < near.cells.length; k++) {
            edge[near.cells[k]] = true;
          }

          var rule = new Object();

          rule.cells = near.cells;
          rule.need = count[at] - near.sure;

          rules.push(rule);
        }

        for (at = 0; at < size; at++) {
          if (state[at] == UNKNOWN && edge[at] == null) {
            loose.push(at);
          }
        }

        var byCell = new Object();

        for (k = 0; k < rules.length; k++) {
          var cells = rules[k].cells;

          for (var c = 0; c < cells.length; c++) {
            if (byCell[cells[c]] == null) {
              byCell[cells[c]] = [];
            }

            byCell[cells[c]].push(k);
          }
        }

        var ruleGroup = [];
        var groups = [];

        for (k = 0; k < rules.length; k++) {
          ruleGroup.push(-1);
        }

        for (k = 0; k < rules.length; k++) {
          if (ruleGroup[k] != -1) {
            continue;
          }

          var group = new Object();
          var seen = new Object();
          var queue = [k];

          group.cells = [];
          group.rules = [];

          ruleGroup[k] = groups.length;

          while (queue.length > 0) {
            var index = queue.pop();
            var own = rules[index].cells;

            group.rules.push(rules[index]);

            for (var o = 0; o < own.length; o++) {
              var cell = own[o];
              var linked = byCell[cell];

              if (seen[cell] == null) {
                seen[cell] = true;

                group.cells.push(cell);
              }

              for (var j = 0; j < linked.length; j++) {
                if (ruleGroup[linked[j]] == -1) {
                  ruleGroup[linked[j]] = groups.length;

                  queue.push(linked[j]);
                }
              }
            }
          }

          groups.push(group);
        }

        var out = new Object();

        out.groups = groups;
        out.loose = loose;

        return out;
      }

      function deep() {
        var field = gather();
        var groups = field.groups;
        var loose = field.loose;
        var remaining = aLevel.mines - marked;
        var reports = [];
        var live = [];
        var k;

        if (groups.length == 0) {
          if (loose.length == 0) {
            return false;
          }

          if (remaining == 0 || remaining == loose.length) {
            for (k = 0; k < loose.length; k++) {
              if (remaining == 0) {
                open(loose[k]);
              } else {
                flag(loose[k]);
              }
            }

            return true;
          }

          return false;
        }

        for (k = 0; k < groups.length; k++) {
          var report = chart(groups[k], remaining, STEP_BUDGET);

          reports.push(report);

          if (report != null) {
            live.push(report);
          }
        }

        if (live.length == 0) {
          return false;
        }

        var whole = live.length == reports.length;
        var slack = whole ? loose.length : size;
        var prefix = [[true]];
        var suffix = [];
        var moved = false;

        for (k = 0; k < live.length; k++) {
          prefix.push(blend(prefix[k], live[k].sums));

          suffix.push(null);
        }

        suffix.push([true]);

        for (k = live.length - 1; k >= 0; k--) {
          suffix[k] = blend(live[k].sums, suffix[k + 1]);
        }

        for (k = 0; k < live.length; k++) {
          var mine = live[k];
          var others = blend(prefix[k], suffix[k + 1]);
          var allowed = [];
          var s;
          var t;
          var c;

          for (s = 0; s < mine.sums.length; s++) {
            if (!mine.sums[s]) {
              continue;
            }

            for (t = 0; t < others.length; t++) {
              if (!others[t]) {
                continue;
              }

              var spare = remaining - s - t;

              if (spare >= 0 && spare <= slack) {
                allowed[s] = true;

                break;
              }
            }
          }

          for (c = 0; c < mine.cells.length; c++) {
            var canMine = false;
            var canSafe = false;

            for (s = 0; s < allowed.length; s++) {
              if (!allowed[s]) {
                continue;
              }

              if (mine.mineAt[c][s]) {
                canMine = true;
              }

              if (mine.safeAt[c][s]) {
                canSafe = true;
              }
            }

            if (canMine && !canSafe) {
              flag(mine.cells[c]);

              moved = true;
            } else if (canSafe && !canMine) {
              open(mine.cells[c]);

              moved = true;
            }
          }
        }

        if (moved) {
          return true;
        }

        if (loose.length == 0 || !whole) {
          return false;
        }

        var totals = prefix[live.length];
        var least = -1;
        var most = -1;

        for (var w = 0; w < totals.length; w++) {
          if (!totals[w]) {
            continue;
          }

          var rest = remaining - w;

          if (rest < 0 || rest > loose.length) {
            continue;
          }

          if (least == -1 || rest < least) {
            least = rest;
          }

          if (rest > most) {
            most = rest;
          }
        }

        if (least == 0 && most == 0) {
          for (k = 0; k < loose.length; k++) {
            open(loose[k]);
          }

          return true;
        }

        if (least == loose.length && most == loose.length) {
          for (k = 0; k < loose.length; k++) {
            flag(loose[k]);
          }

          return true;
        }

        return false;
      }

      open(safeIndex);

      while (unknown > 0) {
        if (simple()) {
          continue;
        }

        if (deep()) {
          continue;
        }

        return false;
      }

      return true;
    }

    return { solve: solve, size: size, neighbours: neighbours };
  }

  function scatter(aSolver, mineTotal, safeIndex) {
    var size = aSolver.size;
    var near = aSolver.neighbours[safeIndex];
    var banned = new Object();
    var board = [];
    var placed = 0;
    var i;

    banned[safeIndex] = true;

    if (mineTotal <= size - near.length - 1) {
      for (i = 0; i < near.length; i++) {
        banned[near[i]] = true;
      }
    }

    for (i = 0; i < size; i++) {
      board.push(false);
    }

    while (placed < mineTotal) {
      var index = Math.floor(Math.random() * size);

      if (board[index] || banned[index] != null) {
        continue;
      }

      board[index] = true;
      placed = placed + 1;
    }

    return board;
  }

  function layoutFor(aLevel, safeIndex) {
    var solver = makeSolver(aLevel);
    var board = null;

    for (var tries = 0; tries < LAYOUT_TRIES; tries++) {
      board = scatter(solver, aLevel.mines, safeIndex);

      if (solver.solve(board, safeIndex)) {
        return board;
      }
    }

    return board;
  }

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
      var board = layoutFor(level, safeIndex);

      for (var i = 0; i < cells.length; i++) {
        cells[i].isMine = board[i];
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
