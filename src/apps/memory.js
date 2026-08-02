(function () {
  var GLYPHS = ["◆", "●", "▲", "■", "★", "✦", "❄", "☾", "✚", "◈", "☀", "♠"];
  var LEVELS = [
    { name: "4 x 3", columns: 4, rows: 3 },
    { name: "4 x 4", columns: 4, rows: 4 },
    { name: "6 x 4", columns: 6, rows: 4 }
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

  function build(aSheet) {
    var ui = window.ui;

    var toolbar = ui.toolbar();
    var stage = ui.center();
    var board = document.createElement("div");

    var level = LEVELS[0];
    var cards = [];
    var flipped = [];
    var moves = 0;
    var matched = 0;
    var isLocked = false;
    var lockTimer = 0;

    var movesValue = ui.value("0");
    var pairsValue = ui.value("0");
    var stateValue = ui.value("");

    function paintCard(aCard) {
      var cardStyle = aCard.element.style;

      if (aCard.isMatched) {
        aCard.element.textContent = aCard.glyph;
        cardStyle.backgroundColor = "var(--nw-active)";
        cardStyle.color = ui.ACCENT_COLOR;
        cardStyle.cursor = "default";

        return;
      }

      if (aCard.isFaceUp) {
        aCard.element.textContent = aCard.glyph;
        cardStyle.backgroundColor = ui.SURFACE_COLOR;
        cardStyle.color = ui.TEXT_COLOR;

        return;
      }

      aCard.element.textContent = "";
      cardStyle.backgroundColor = ui.PANEL_COLOR;
      cardStyle.cursor = "pointer";
    }

    function makeFlipHandler(aCard) {
      return function () {
        if (isLocked || aCard.isFaceUp || aCard.isMatched) {
          return;
        }

        aCard.isFaceUp = true;

        paintCard(aCard);

        flipped.push(aCard);

        if (flipped.length < 2) {
          return;
        }

        moves = moves + 1;

        movesValue.textContent = "" + moves;

        if (flipped[0].glyph == flipped[1].glyph) {
          flipped[0].isMatched = true;
          flipped[1].isMatched = true;

          matched = matched + 1;

          pairsValue.textContent = "" + matched;

          paintCard(flipped[0]);
          paintCard(flipped[1]);

          flipped = [];

          if (matched == cards.length / 2) {
            stateValue.textContent = "cleared";
            stateValue.style.color = ui.ACCENT_COLOR;
          }

          return;
        }

        isLocked = true;

        lockTimer = setTimeout(function () {
          flipped[0].isFaceUp = false;
          flipped[1].isFaceUp = false;

          paintCard(flipped[0]);
          paintCard(flipped[1]);

          flipped = [];
          isLocked = false;
        }, 700);
      };
    }

    function makeCard(glyph) {
      var anElement = document.createElement("div");
      var elementStyle = anElement.style;

      elementStyle.width = "60px";
      elementStyle.height = "60px";
      elementStyle.display = "flex";
      elementStyle.alignItems = "center";
      elementStyle.justifyContent = "center";
      elementStyle.fontSize = "24px";
      elementStyle.borderRadius = "5px";
      elementStyle.userSelect = "none";
      elementStyle.borderStyle = "solid";
      elementStyle.borderWidth = "1px";
      elementStyle.borderColor = ui.BORDER_COLOR;

      var aCard = new Object();

      aCard.element = anElement;
      aCard.glyph = glyph;
      aCard.isFaceUp = false;
      aCard.isMatched = false;

      anElement.addEventListener("click", makeFlipHandler(aCard));

      return aCard;
    }

    function start() {
      if (lockTimer != 0) {
        clearTimeout(lockTimer);

        lockTimer = 0;
      }

      var count = (level.columns * level.rows) / 2;
      var pool = [];

      for (var i = 0; i < count; i++) {
        pool.push(GLYPHS[i % GLYPHS.length]);
        pool.push(GLYPHS[i % GLYPHS.length]);
      }

      for (var j = pool.length - 1; j > 0; j--) {
        var k = Math.floor(Math.random() * (j + 1));
        var swap = pool[j];

        pool[j] = pool[k];
        pool[k] = swap;
      }

      cards = [];
      flipped = [];
      moves = 0;
      matched = 0;
      isLocked = false;

      movesValue.textContent = "0";
      pairsValue.textContent = "0";
      stateValue.textContent = "";
      stateValue.style.color = ui.ACCENT_COLOR;

      ui.clear(board);

      board.style.gridTemplateColumns = "repeat(" + level.columns + ", 60px)";

      for (var n = 0; n < pool.length; n++) {
        var aCard = makeCard(pool[n]);

        cards.push(aCard);
        board.appendChild(aCard.element);

        paintCard(aCard);
      }
    }

    function onLevelChange(name) {
      level = findLevel(name);

      start();
    }

    function teardown() {
      if (lockTimer != 0) {
        clearTimeout(lockTimer);

        lockTimer = 0;
      }
    }

    board.style.display = "grid";
    board.style.gap = "6px";

    toolbar.appendChild(ui.button("new game", start));
    toolbar.appendChild(ui.select(levelNames(), level.name, onLevelChange));
    toolbar.appendChild(ui.spacer());
    toolbar.appendChild(ui.label("moves"));
    toolbar.appendChild(movesValue);
    toolbar.appendChild(ui.label("pairs"));
    toolbar.appendChild(pairsValue);
    toolbar.appendChild(stateValue);

    stage.appendChild(board);

    aSheet.appendChild(toolbar);
    aSheet.appendChild(stage);

    start();

    return teardown;
  }

  window.makeApp("memory", "match the hidden pairs", 480, 440, build);
})();
