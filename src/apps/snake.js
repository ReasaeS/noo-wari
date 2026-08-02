(function () {
  var GRID = 20;
  var CELL = 18;
  var SPEEDS = [
    { name: "slow", interval: 160 },
    { name: "normal", interval: 110 },
    { name: "fast", interval: 70 },
    { name: "brutal", interval: 45 }
  ];

  function findSpeed(name) {
    for (var i = 0; i < SPEEDS.length; i++) {
      if (SPEEDS[i].name == name) {
        return SPEEDS[i];
      }
    }

    return SPEEDS[1];
  }

  function speedNames() {
    var names = [];

    for (var i = 0; i < SPEEDS.length; i++) {
      names.push(SPEEDS[i].name);
    }

    return names;
  }

  function build(aSheet, appWindow) {
    var ui = window.ui;

    var toolbar = ui.toolbar();
    var stage = ui.center();
    var canvas = ui.canvas();
    var context = canvas.getContext("2d");

    var speed = SPEEDS[1];
    var snake = [];
    var direction = { x: 1, y: 0 };
    var queued = null;
    var food = { x: 0, y: 0 };
    var score = 0;
    var best = 0;
    var isOver = false;
    var isPaused = false;
    var stepTimer = 0;

    var scoreValue = ui.value("0");
    var bestValue = ui.value("0");
    var stateValue = ui.value("");

    function placeFood() {
      while (true) {
        var spot = {
          x: Math.floor(Math.random() * GRID),
          y: Math.floor(Math.random() * GRID)
        };

        var taken = false;

        for (var i = 0; i < snake.length; i++) {
          if (snake[i].x == spot.x && snake[i].y == spot.y) {
            taken = true;
          }
        }

        if (!taken) {
          food = spot;
          return;
        }
      }
    }

    function draw() {
      context.fillStyle = "#1b2029";
      context.fillRect(0, 0, canvas.width, canvas.height);

      context.strokeStyle = "rgba(59, 65, 76, 0.4)";
      context.lineWidth = 1;

      for (var i = 1; i < GRID; i++) {
        context.beginPath();
        context.moveTo(i * CELL, 0);
        context.lineTo(i * CELL, canvas.height);
        context.stroke();

        context.beginPath();
        context.moveTo(0, i * CELL);
        context.lineTo(canvas.width, i * CELL);
        context.stroke();
      }

      context.fillStyle = "#c96a63";
      context.beginPath();
      context.arc(
        food.x * CELL + CELL / 2,
        food.y * CELL + CELL / 2,
        CELL / 2 - 3,
        0,
        Math.PI * 2
      );
      context.fill();

      for (var j = 0; j < snake.length; j++) {
        var amount = 1 - j / (snake.length + 6);

        context.fillStyle = "hsl(145, 45%, " + Math.round(38 + amount * 26) + "%)";
        context.fillRect(
          snake[j].x * CELL + 2,
          snake[j].y * CELL + 2,
          CELL - 4,
          CELL - 4
        );
      }
    }

    function stop() {
      if (stepTimer != 0) {
        clearInterval(stepTimer);

        stepTimer = 0;
      }
    }

    function finish() {
      isOver = true;

      stop();

      stateValue.textContent = "dead";
      stateValue.style.color = ui.DANGER_COLOR;
    }

    function step() {
      if (isPaused || isOver) {
        return;
      }

      if (queued != null) {
        direction = queued;
        queued = null;
      }

      var head = {
        x: snake[0].x + direction.x,
        y: snake[0].y + direction.y
      };

      if (head.x < 0 || head.x >= GRID || head.y < 0 || head.y >= GRID) {
        finish();
        return;
      }

      for (var i = 0; i < snake.length; i++) {
        if (snake[i].x == head.x && snake[i].y == head.y) {
          finish();
          return;
        }
      }

      snake.unshift(head);

      if (head.x == food.x && head.y == food.y) {
        score = score + 1;

        scoreValue.textContent = "" + score;

        if (score > best) {
          best = score;

          bestValue.textContent = "" + best;
        }

        placeFood();
      } else {
        snake.pop();
      }

      draw();
    }

    function start() {
      stop();

      snake = [
        { x: 8, y: 10 },
        { x: 7, y: 10 },
        { x: 6, y: 10 }
      ];

      direction = { x: 1, y: 0 };
      queued = null;
      score = 0;
      isOver = false;
      isPaused = false;

      scoreValue.textContent = "0";
      stateValue.textContent = "";
      stateValue.style.color = ui.ACCENT_COLOR;

      placeFood();
      draw();

      stepTimer = setInterval(step, speed.interval);
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

    function turn(x, y) {
      if (direction.x == -x && direction.y == -y) {
        return;
      }

      queued = { x: x, y: y };
    }

    function onKeyDown(event) {
      var key = event.key;

      if (key == "ArrowUp" || key == "w") {
        turn(0, -1);
      } else if (key == "ArrowDown" || key == "s") {
        turn(0, 1);
      } else if (key == "ArrowLeft" || key == "a") {
        turn(-1, 0);
      } else if (key == "ArrowRight" || key == "d") {
        turn(1, 0);
      } else if (key == " ") {
        togglePause();
      } else {
        return;
      }

      event.preventDefault();
    }

    function onSpeedChange(name) {
      speed = findSpeed(name);

      if (!isOver) {
        stop();

        stepTimer = setInterval(step, speed.interval);
      }
    }

    canvas.width = GRID * CELL;
    canvas.height = GRID * CELL;
    canvas.style.borderStyle = "solid";
    canvas.style.borderWidth = "1px";
    canvas.style.borderColor = ui.BORDER_COLOR;

    toolbar.appendChild(ui.button("new game", start));
    toolbar.appendChild(ui.button("pause", togglePause));
    toolbar.appendChild(ui.select(speedNames(), speed.name, onSpeedChange));
    toolbar.appendChild(ui.spacer());
    toolbar.appendChild(ui.label("score"));
    toolbar.appendChild(scoreValue);
    toolbar.appendChild(ui.label("best"));
    toolbar.appendChild(bestValue);
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

  window.makeApp("snake", "arrow keys, eat and grow", 420, 480, build);
})();
