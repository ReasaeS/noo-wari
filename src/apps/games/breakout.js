(function () {
  var WIDTH = 480;
  var HEIGHT = 380;
  var PADDLE_WIDTH = 76;
  var PADDLE_HEIGHT = 10;
  var BALL_SIZE = 7;
  var BRICK_ROWS = 6;
  var BRICK_COLUMNS = 10;
  var BRICK_HEIGHT = 16;

  var ROW_COLORS = [
    "#c96a63", "#d19a63", "#d6b46a",
    "#7fd18b", "#6fc3c9", "#7aa2e0"
  ];

  function build(aSheet, appWindow) {
    var ui = window.ui;

    var toolbar = ui.toolbar();
    var stage = ui.center();
    var canvas = ui.canvas();
    var context = canvas.getContext("2d");

    var bricks = [];
    var paddleX = WIDTH / 2 - PADDLE_WIDTH / 2;
    var ball = { x: 0, y: 0, dx: 0, dy: 0 };
    var score = 0;
    var lives = 3;
    var isRunning = false;
    var isOver = false;
    var frameTimer = 0;

    var scoreValue = ui.value("0");
    var livesValue = ui.value("3");
    var stateValue = ui.value("ready");

    function makeBricks() {
      var made = [];

      var brickWidth = WIDTH / BRICK_COLUMNS;

      for (var row = 0; row < BRICK_ROWS; row++) {
        for (var column = 0; column < BRICK_COLUMNS; column++) {
          made.push({
            x: column * brickWidth,
            y: 40 + row * BRICK_HEIGHT,
            width: brickWidth,
            height: BRICK_HEIGHT,
            color: ROW_COLORS[row % ROW_COLORS.length],
            value: (BRICK_ROWS - row) * 10,
            isAlive: true
          });
        }
      }

      return made;
    }

    function resetBall() {
      ball.x = WIDTH / 2;
      ball.y = HEIGHT - 60;
      ball.dx = 3 * (Math.random() > 0.5 ? 1 : -1);
      ball.dy = -3.4;
    }

    function draw() {
      context.fillStyle = "#1b2029";
      context.fillRect(0, 0, WIDTH, HEIGHT);

      for (var i = 0; i < bricks.length; i++) {
        var brick = bricks[i];

        if (!brick.isAlive) {
          continue;
        }

        context.fillStyle = brick.color;
        context.fillRect(brick.x + 1, brick.y + 1, brick.width - 2, brick.height - 2);
      }

      context.fillStyle = "#c5cad3";
      context.fillRect(paddleX, HEIGHT - 24, PADDLE_WIDTH, PADDLE_HEIGHT);

      context.fillStyle = "#7fd18b";
      context.beginPath();
      context.arc(ball.x, ball.y, BALL_SIZE, 0, Math.PI * 2);
      context.fill();
    }

    function aliveCount() {
      var count = 0;

      for (var i = 0; i < bricks.length; i++) {
        if (bricks[i].isAlive) {
          count = count + 1;
        }
      }

      return count;
    }

    function finish(text, color) {
      isRunning = false;
      isOver = true;

      stateValue.textContent = text;
      stateValue.style.color = color;
    }

    function update() {
      if (isRunning) {
        ball.x = ball.x + ball.dx;
        ball.y = ball.y + ball.dy;

        if (ball.x < BALL_SIZE || ball.x > WIDTH - BALL_SIZE) {
          ball.dx = -ball.dx;
        }

        if (ball.y < BALL_SIZE) {
          ball.dy = -ball.dy;
        }

        if (
          ball.y > HEIGHT - 24 - BALL_SIZE &&
          ball.y < HEIGHT - 24 + PADDLE_HEIGHT &&
          ball.x > paddleX &&
          ball.x < paddleX + PADDLE_WIDTH
        ) {
          var hit = (ball.x - (paddleX + PADDLE_WIDTH / 2)) / (PADDLE_WIDTH / 2);

          ball.dx = hit * 4.5;
          ball.dy = -Math.abs(ball.dy);
        }

        for (var i = 0; i < bricks.length; i++) {
          var brick = bricks[i];

          if (!brick.isAlive) {
            continue;
          }

          if (
            ball.x > brick.x &&
            ball.x < brick.x + brick.width &&
            ball.y > brick.y &&
            ball.y < brick.y + brick.height
          ) {
            brick.isAlive = false;
            ball.dy = -ball.dy;
            score = score + brick.value;

            scoreValue.textContent = "" + score;

            if (aliveCount() == 0) {
              finish("cleared", ui.ACCENT_COLOR);
            }

            break;
          }
        }

        if (ball.y > HEIGHT) {
          lives = lives - 1;

          livesValue.textContent = "" + lives;

          if (lives <= 0) {
            finish("game over", ui.DANGER_COLOR);
          } else {
            isRunning = false;

            stateValue.textContent = "click to serve";
            stateValue.style.color = ui.WARN_COLOR;

            resetBall();
          }
        }
      }

      draw();

      frameTimer = window.requestAnimationFrame(update);
    }

    function start() {
      bricks = makeBricks();
      score = 0;
      lives = 3;
      isOver = false;
      isRunning = false;

      scoreValue.textContent = "0";
      livesValue.textContent = "3";
      stateValue.textContent = "click to serve";
      stateValue.style.color = ui.WARN_COLOR;

      resetBall();
    }

    function serve() {
      if (isOver) {
        return;
      }

      isRunning = true;

      stateValue.textContent = "";
      stateValue.style.color = ui.ACCENT_COLOR;
    }

    function onMouseMove(event) {
      var box = canvas.getBoundingClientRect();
      var x = (event.clientX - box.left) * (WIDTH / box.width);

      paddleX = x - PADDLE_WIDTH / 2;

      if (paddleX < 0) {
        paddleX = 0;
      }

      if (paddleX > WIDTH - PADDLE_WIDTH) {
        paddleX = WIDTH - PADDLE_WIDTH;
      }
    }

    function teardown() {
      if (frameTimer != 0) {
        window.cancelAnimationFrame(frameTimer);

        frameTimer = 0;
      }
    }

    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    canvas.style.cursor = "none";
    canvas.style.maxWidth = "100%";
    canvas.style.borderStyle = "solid";
    canvas.style.borderWidth = "1px";
    canvas.style.borderColor = ui.BORDER_COLOR;

    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("click", serve);

    toolbar.appendChild(ui.button("new game", start));
    toolbar.appendChild(ui.spacer());
    toolbar.appendChild(ui.label("score"));
    toolbar.appendChild(scoreValue);
    toolbar.appendChild(ui.label("lives"));
    toolbar.appendChild(livesValue);
    toolbar.appendChild(stateValue);

    stage.appendChild(canvas);

    aSheet.appendChild(toolbar);
    aSheet.appendChild(stage);

    start();

    frameTimer = window.requestAnimationFrame(update);

    return teardown;
  }

  window.makeApp("breakout", "mouse paddle, break the wall", 520, 480, build, "games");
})();
