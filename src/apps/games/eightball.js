(function () {
  var CANVAS_WIDTH = 580;
  var CANVAS_HEIGHT = 320;
  var RAIL = 18;
  var BALL_R = 10;
  var POCKET_R = 16;
  var POCKET_SET = 5;

  var FRICTION = 0.985;
  var STOP_SPEED = 0.06;
  var WALL_BOUNCE = 0.86;
  var RESTITUTION = 0.96;
  var SUB_STEPS = 4;

  var MAX_PULL = 110;
  var MAX_SPEED = 15;

  var FELT_COLOR = "#1f6b45";
  var FELT_EDGE = "#17553708";
  var POCKET_COLOR = "#0c0e11";
  var CUE_COLOR = "#f2efe6";
  var EIGHT_COLOR = "#17181c";

  var SUITS = [
    { number: 1, color: "#e0b02a" },
    { number: 2, color: "#2f5fc4" },
    { number: 3, color: "#c0392b" },
    { number: 4, color: "#7d3c98" },
    { number: 5, color: "#e07b1a" },
    { number: 6, color: "#1e8449" },
    { number: 7, color: "#8a3324" }
  ];

  function colorFor(number) {
    if (number == 8) {
      return EIGHT_COLOR;
    }

    var index = number > 8 ? number - 9 : number - 1;

    if (index < 0 || index >= SUITS.length) {
      return CUE_COLOR;
    }

    return SUITS[index].color;
  }

  function kindFor(number) {
    if (number == 0) {
      return "cue";
    }

    if (number == 8) {
      return "eight";
    }

    if (number < 8) {
      return "solid";
    }

    return "stripe";
  }

  function makeBall(number, x, y) {
    var aBall = new Object();

    aBall.number = number;
    aBall.kind = kindFor(number);
    aBall.color = number == 0 ? CUE_COLOR : colorFor(number);
    aBall.x = x;
    aBall.y = y;
    aBall.vx = 0;
    aBall.vy = 0;
    aBall.potted = false;

    return aBall;
  }

  function shuffled(numbers) {
    var pool = numbers.slice(0);
    var found = [];

    while (pool.length > 0) {
      var index = Math.floor(Math.random() * pool.length);

      found.push(pool[index]);
      pool.splice(index, 1);
    }

    return found;
  }

  function build(aSheet) {
    var ui = window.ui;

    var toolbar = ui.toolbar();
    var stage = ui.center();
    var column = document.createElement("div");
    var canvas = ui.canvas();
    var context = canvas.getContext("2d");
    var message = document.createElement("div");

    var turnValue = ui.value("player 1");
    var groupValue = ui.value("open");
    var leftValue = ui.value("-");

    var balls = [];
    var player = 0;
    var groups = null;
    var isOver = false;
    var isAiming = false;
    var aimX = 0;
    var aimY = 0;
    var firstHit = 0;
    var wasCleared = false;
    var pottedShot = [];
    var frameTimer = 0;
    var tone = new Object();
    var shades = new Object();
    var grain = 0;

    var playLeft = RAIL + BALL_R;
    var playTop = RAIL + BALL_R;
    var playRight = CANVAS_WIDTH - RAIL - BALL_R;
    var playBottom = CANVAS_HEIGHT - RAIL - BALL_R;

    var pockets = [
      { x: playLeft - POCKET_SET, y: playTop - POCKET_SET },
      { x: CANVAS_WIDTH / 2, y: playTop - POCKET_SET },
      { x: playRight + POCKET_SET, y: playTop - POCKET_SET },
      { x: playLeft - POCKET_SET, y: playBottom + POCKET_SET },
      { x: CANVAS_WIDTH / 2, y: playBottom + POCKET_SET },
      { x: playRight + POCKET_SET, y: playBottom + POCKET_SET }
    ];

    function density() {
      var found = window.devicePixelRatio;

      if (typeof found != "number" || found <= 0) {
        return 1;
      }

      return found;
    }

    function fit() {
      var scale = density();

      if (scale == grain) {
        return false;
      }

      grain = scale;

      canvas.width = Math.round(CANVAS_WIDTH * scale);
      canvas.height = Math.round(CANVAS_HEIGHT * scale);
      canvas.style.width = CANVAS_WIDTH + "px";
      canvas.style.height = CANVAS_HEIGHT + "px";

      shades = new Object();

      return true;
    }

    function readTone() {
      tone.rail = window.theme.color("tertiary");
      tone.frame = window.theme.color("primary");
      tone.accent = window.theme.color("accent");
      tone.muted = window.theme.color("muted");
      tone.text = window.theme.color("text");
    }

    function say(text, color) {
      message.textContent = text;
      message.style.color = color;
    }

    function cueBall() {
      return balls[0];
    }

    function headSpot() {
      return { x: playLeft + (playRight - playLeft) * 0.22, y: CANVAS_HEIGHT / 2 };
    }

    function isFree(x, y) {
      for (var i = 1; i < balls.length; i++) {
        if (balls[i].potted) {
          continue;
        }

        var dx = balls[i].x - x;
        var dy = balls[i].y - y;

        if (Math.sqrt(dx * dx + dy * dy) < BALL_R * 2.2) {
          return false;
        }
      }

      return true;
    }

    function respot() {
      var spot = headSpot();
      var slide = 0;

      while (!isFree(spot.x - slide, spot.y) && slide < 120) {
        slide = slide + BALL_R;
      }

      var aBall = cueBall();

      aBall.x = spot.x - slide;
      aBall.y = spot.y;
      aBall.vx = 0;
      aBall.vy = 0;
      aBall.potted = false;
    }

    function rack() {
      var apexX = playLeft + (playRight - playLeft) * 0.62;
      var midY = CANVAS_HEIGHT / 2;
      var gap = BALL_R * 2 + 0.8;
      var rowStep = gap * 0.88;

      var order = shuffled([1, 2, 3, 4, 5, 6, 7, 9, 10, 11, 12, 13, 14, 15]);
      var numbers = [];
      var taken = 0;

      for (var slot = 0; slot < 15; slot++) {
        if (slot == 4) {
          numbers.push(8);
        } else {
          numbers.push(order[taken]);

          taken = taken + 1;
        }
      }

      var made = [];
      var index = 0;

      for (var row = 0; row < 5; row++) {
        for (var seat = 0; seat <= row; seat++) {
          var x = apexX + row * rowStep;
          var y = midY + (seat - row / 2) * gap;

          made.push(makeBall(numbers[index], x, y));

          index = index + 1;
        }
      }

      return made;
    }

    function start() {
      var spot = headSpot();

      balls = [makeBall(0, spot.x, spot.y)];

      var racked = rack();

      for (var i = 0; i < racked.length; i++) {
        balls.push(racked[i]);
      }

      player = 0;
      groups = null;
      isOver = false;
      isAiming = false;
      firstHit = 0;
      wasCleared = false;
      pottedShot = [];

      paintStatus();
      say("player 1 breaks - drag back from the cue ball", tone.muted);
    }

    function groupOf(aBall) {
      if (aBall.kind == "solid" || aBall.kind == "stripe") {
        return aBall.kind;
      }

      return "";
    }

    function mine() {
      if (groups == null) {
        return "";
      }

      return groups[player];
    }

    function countLeft(kind) {
      var total = 0;

      for (var i = 1; i < balls.length; i++) {
        if (!balls[i].potted && groupOf(balls[i]) == kind) {
          total = total + 1;
        }
      }

      return total;
    }

    function isCleared(kind) {
      if (kind == "") {
        return false;
      }

      return countLeft(kind) == 0;
    }

    function paintStatus() {
      turnValue.textContent = "player " + (player + 1);
      turnValue.style.color = isOver ? ui.MUTED_COLOR : ui.ACCENT_COLOR;

      if (groups == null) {
        groupValue.textContent = "open";
        leftValue.textContent = "-";

        return;
      }

      groupValue.textContent = mine();
      leftValue.textContent = isCleared(mine()) ? "the 8" : "" + countLeft(mine());
    }

    function isResting() {
      for (var i = 0; i < balls.length; i++) {
        if (balls[i].potted) {
          continue;
        }

        if (balls[i].vx != 0 || balls[i].vy != 0) {
          return false;
        }
      }

      return true;
    }

    function pocketAt(aBall) {
      for (var i = 0; i < pockets.length; i++) {
        var dx = aBall.x - pockets[i].x;
        var dy = aBall.y - pockets[i].y;

        if (Math.sqrt(dx * dx + dy * dy) < POCKET_R) {
          return true;
        }
      }

      return false;
    }

    function bounce(aBall) {
      if (aBall.x < playLeft) {
        aBall.x = playLeft;
        aBall.vx = -aBall.vx * WALL_BOUNCE;
      }

      if (aBall.x > playRight) {
        aBall.x = playRight;
        aBall.vx = -aBall.vx * WALL_BOUNCE;
      }

      if (aBall.y < playTop) {
        aBall.y = playTop;
        aBall.vy = -aBall.vy * WALL_BOUNCE;
      }

      if (aBall.y > playBottom) {
        aBall.y = playBottom;
        aBall.vy = -aBall.vy * WALL_BOUNCE;
      }
    }

    function collide(a, b) {
      var dx = b.x - a.x;
      var dy = b.y - a.y;
      var span = Math.sqrt(dx * dx + dy * dy);

      if (span == 0) {
        b.x = b.x + 0.5;

        return;
      }

      if (span >= BALL_R * 2) {
        return;
      }

      var nx = dx / span;
      var ny = dy / span;
      var overlap = BALL_R * 2 - span;

      a.x = a.x - nx * overlap / 2;
      a.y = a.y - ny * overlap / 2;
      b.x = b.x + nx * overlap / 2;
      b.y = b.y + ny * overlap / 2;

      var dot = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;

      if (dot > 0) {
        return;
      }

      var push = dot * (1 + RESTITUTION) / 2;

      a.vx = a.vx + push * nx;
      a.vy = a.vy + push * ny;
      b.vx = b.vx - push * nx;
      b.vy = b.vy - push * ny;

      if (a.number == 0 && firstHit == 0) {
        firstHit = b.number;
      }

      if (b.number == 0 && firstHit == 0) {
        firstHit = a.number;
      }
    }

    function advance() {
      for (var step = 0; step < SUB_STEPS; step++) {
        for (var i = 0; i < balls.length; i++) {
          var aBall = balls[i];

          if (aBall.potted) {
            continue;
          }

          aBall.x = aBall.x + aBall.vx / SUB_STEPS;
          aBall.y = aBall.y + aBall.vy / SUB_STEPS;

          if (pocketAt(aBall)) {
            aBall.potted = true;
            aBall.vx = 0;
            aBall.vy = 0;

            pottedShot.push(aBall);

            continue;
          }

          bounce(aBall);
        }

        for (var a = 0; a < balls.length; a++) {
          if (balls[a].potted) {
            continue;
          }

          for (var b = a + 1; b < balls.length; b++) {
            if (balls[b].potted) {
              continue;
            }

            collide(balls[a], balls[b]);
          }
        }
      }

      for (var k = 0; k < balls.length; k++) {
        var one = balls[k];

        if (one.potted) {
          continue;
        }

        one.vx = one.vx * FRICTION;
        one.vy = one.vy * FRICTION;

        if (Math.sqrt(one.vx * one.vx + one.vy * one.vy) < STOP_SPEED) {
          one.vx = 0;
          one.vy = 0;
        }
      }
    }

    function pottedKinds() {
      var found = [];

      for (var i = 0; i < pottedShot.length; i++) {
        found.push(pottedShot[i]);
      }

      return found;
    }

    function finish(text) {
      isOver = true;

      say(text, ui.ACCENT_COLOR);
      paintStatus();
    }

    function settle() {
      var potted = pottedKinds();
      var scratched = cueBall().potted;
      var sankEight = false;
      var foul = false;
      var note = "";

      for (var i = 0; i < potted.length; i++) {
        if (potted[i].kind == "eight") {
          sankEight = true;
        }
      }

      if (firstHit == 0) {
        foul = true;
        note = "foul - no contact";
      } else if (groups == null && firstHit == 8) {
        foul = true;
        note = "foul - hit the 8 first";
      } else if (groups != null && wasCleared && firstHit != 8) {
        foul = true;
        note = "foul - you needed the 8";
      } else if (groups != null && !wasCleared && kindFor(firstHit) != mine()) {
        foul = true;
        note = "foul - hit the wrong ball first";
      }

      if (sankEight) {
        if (isCleared(mine()) && !scratched && !foul) {
          finish("player " + (player + 1) + " wins");
        } else {
          finish("player " + (player == 0 ? 2 : 1) + " wins - the 8 went down early");
        }

        return;
      }

      if (scratched) {
        foul = true;
        note = "scratch";

        respot();
      }

      if (groups == null && !foul) {
        for (var j = 0; j < potted.length; j++) {
          var kind = groupOf(potted[j]);

          if (kind != "") {
            groups = new Object();
            groups[player] = kind;
            groups[player == 0 ? 1 : 0] = kind == "solid" ? "stripe" : "solid";

            note = "player " + (player + 1) + " takes " + kind + "s";

            break;
          }
        }
      }

      var kept = false;

      for (var m = 0; m < potted.length; m++) {
        if (groups != null && groupOf(potted[m]) == mine()) {
          kept = true;
        }

        if (groups == null && groupOf(potted[m]) != "") {
          kept = true;
        }
      }

      if (foul || !kept) {
        player = player == 0 ? 1 : 0;

        if (note == "") {
          note = potted.length == 0 ? "no pot - over to player " + (player + 1) : "wrong ball - over to player " + (player + 1);
        } else {
          note = note + " - over to player " + (player + 1);
        }
      } else if (note == "") {
        note = "pot - player " + (player + 1) + " again";
      }

      say(note, foul ? ui.DANGER_COLOR : ui.MUTED_COLOR);
      paintStatus();
    }

    function drawTable() {
      context.fillStyle = tone.frame;
      context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      context.fillStyle = tone.rail;
      context.fillRect(4, 4, CANVAS_WIDTH - 8, CANVAS_HEIGHT - 8);

      context.fillStyle = FELT_COLOR;
      context.fillRect(RAIL, RAIL, CANVAS_WIDTH - RAIL * 2, CANVAS_HEIGHT - RAIL * 2);

      context.strokeStyle = FELT_EDGE;
      context.lineWidth = 2;
      context.strokeRect(RAIL, RAIL, CANVAS_WIDTH - RAIL * 2, CANVAS_HEIGHT - RAIL * 2);

      for (var i = 0; i < pockets.length; i++) {
        context.fillStyle = POCKET_COLOR;
        context.beginPath();
        context.arc(pockets[i].x, pockets[i].y, POCKET_R, 0, Math.PI * 2);
        context.fill();
      }
    }

    function shadeFor(color) {
      if (shades[color] != null) {
        return shades[color];
      }

      var aShade = context.createRadialGradient(
        -BALL_R * 0.34,
        -BALL_R * 0.36,
        BALL_R * 0.12,
        0,
        0,
        BALL_R
      );

      aShade.addColorStop(0, window.theme.mix(color, "#ffffff", 0.52));
      aShade.addColorStop(0.45, color);
      aShade.addColorStop(1, window.theme.mix(color, "#000000", 0.42));

      shades[color] = aShade;

      return aShade;
    }

    function drawBall(aBall) {
      var base = aBall.kind == "stripe" ? CUE_COLOR : aBall.color;

      context.save();
      context.translate(aBall.x, aBall.y);

      context.fillStyle = shadeFor(base);
      context.beginPath();
      context.arc(0, 0, BALL_R, 0, Math.PI * 2);
      context.fill();

      if (aBall.kind == "stripe") {
        context.save();
        context.beginPath();
        context.arc(0, 0, BALL_R, 0, Math.PI * 2);
        context.clip();

        context.fillStyle = shadeFor(aBall.color);
        context.fillRect(-BALL_R, -BALL_R * 0.54, BALL_R * 2, BALL_R * 1.08);

        context.restore();
      }

      context.strokeStyle = "rgba(0, 0, 0, 0.28)";
      context.lineWidth = 0.7;
      context.beginPath();
      context.arc(0, 0, BALL_R - 0.35, 0, Math.PI * 2);
      context.stroke();

      context.fillStyle = "rgba(255, 255, 255, 0.42)";
      context.beginPath();
      context.arc(-BALL_R * 0.3, -BALL_R * 0.33, BALL_R * 0.2, 0, Math.PI * 2);
      context.fill();

      context.restore();
    }

    function drawAim() {
      var aBall = cueBall();
      var dx = aBall.x - aimX;
      var dy = aBall.y - aimY;
      var span = Math.sqrt(dx * dx + dy * dy);

      if (span < 4) {
        return;
      }

      var nx = dx / span;
      var ny = dy / span;
      var pull = span > MAX_PULL ? MAX_PULL : span;

      context.strokeStyle = tone.accent;
      context.lineWidth = 1;
      context.beginPath();
      context.moveTo(aBall.x, aBall.y);
      context.lineTo(aBall.x + nx * 130, aBall.y + ny * 130);
      context.stroke();

      context.strokeStyle = tone.muted;
      context.lineWidth = 3;
      context.beginPath();
      context.moveTo(aBall.x - nx * BALL_R, aBall.y - ny * BALL_R);
      context.lineTo(aBall.x - nx * (BALL_R + pull), aBall.y - ny * (BALL_R + pull));
      context.stroke();
    }

    function draw() {
      fit();

      context.setTransform(grain, 0, 0, grain, 0, 0);

      drawTable();

      for (var i = 0; i < balls.length; i++) {
        if (!balls[i].potted) {
          drawBall(balls[i]);
        }
      }

      if (isAiming && !isOver) {
        drawAim();
      }
    }

    function tick() {
      var wasMoving = !isResting();

      if (wasMoving) {
        advance();

        if (isResting()) {
          settle();
        }
      }

      draw();

      frameTimer = window.requestAnimationFrame(tick);
    }

    function spotOf(event) {
      var box = canvas.getBoundingClientRect();

      return {
        x: (event.clientX - box.left) * (CANVAS_WIDTH / box.width),
        y: (event.clientY - box.top) * (CANVAS_HEIGHT / box.height)
      };
    }

    function onMove(event) {
      var spot = spotOf(event);

      aimX = spot.x;
      aimY = spot.y;
    }

    function onUp(event) {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);

      if (!isAiming) {
        return;
      }

      isAiming = false;

      var spot = spotOf(event);
      var aBall = cueBall();
      var dx = aBall.x - spot.x;
      var dy = aBall.y - spot.y;
      var span = Math.sqrt(dx * dx + dy * dy);

      if (span < 6) {
        return;
      }

      var pull = span > MAX_PULL ? MAX_PULL : span;
      var speed = (pull / MAX_PULL) * MAX_SPEED;

      firstHit = 0;
      wasCleared = groups != null && isCleared(mine());
      pottedShot = [];

      aBall.vx = (dx / span) * speed;
      aBall.vy = (dy / span) * speed;

      say("", ui.MUTED_COLOR);
    }

    function onDown(event) {
      if (isOver || !isResting()) {
        return;
      }

      event.preventDefault();

      var spot = spotOf(event);

      isAiming = true;
      aimX = spot.x;
      aimY = spot.y;

      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    }

    function onTheme() {
      readTone();
    }

    function teardown() {
      if (frameTimer != 0) {
        window.cancelAnimationFrame(frameTimer);

        frameTimer = 0;
      }

      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);

      window.theme.unwatch(onTheme);
    }

    fit();

    canvas.style.imageRendering = "auto";
    canvas.style.cursor = "crosshair";
    canvas.style.borderRadius = "6px";

    column.style.display = "flex";
    column.style.flexDirection = "column";
    column.style.alignItems = "center";
    column.style.gap = "8px";

    message.style.fontSize = "11px";
    message.style.color = ui.MUTED_COLOR;
    message.style.minHeight = "14px";
    message.style.textAlign = "center";

    toolbar.appendChild(ui.button("new game", start));
    toolbar.appendChild(ui.spacer());
    toolbar.appendChild(ui.label("turn"));
    toolbar.appendChild(turnValue);
    toolbar.appendChild(ui.label("group"));
    toolbar.appendChild(groupValue);
    toolbar.appendChild(ui.label("left"));
    toolbar.appendChild(leftValue);

    column.appendChild(canvas);
    column.appendChild(message);

    stage.appendChild(column);

    aSheet.appendChild(toolbar);
    aSheet.appendChild(stage);

    canvas.addEventListener("mousedown", onDown);

    window.touch.surface(canvas);
    window.theme.watch(onTheme);

    readTone();
    start();

    frameTimer = window.requestAnimationFrame(tick);

    return teardown;
  }

  window.makeApp("8 ball", "two player pool, drag back to aim", 640, 470, build, "games");
})();
