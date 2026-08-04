(function () {
  var PANEL_COLOR = "var(--nw-panel)";
  var BORDER_COLOR = "var(--nw-tertiary)";
  var TEXT_COLOR = "var(--nw-text)";
  var MUTED_COLOR = "var(--nw-muted)";
  var ACCENT_COLOR = "var(--nw-accent)";

  var FONT_FAMILY = "\"JetBrainsMono Nerd Font\", \"JetBrains Mono\", \"Fira Code\", monospace";
  var Z_INDEX = 1150;
  var ART_SIZE = 44;
  var LIFE = 4600;
  var FADE = 220;
  var CARD_WIDTH = 260;
  var STACK_CAP = 3;

  function makeHost() {
    var aHost = document.createElement("div");
    var hostStyle = aHost.style;

    hostStyle.position = "fixed";
    hostStyle.left = "50%";
    hostStyle.bottom = "20px";
    hostStyle.transform = "translateX(-50%)";
    hostStyle.display = "flex";
    hostStyle.flexDirection = "column-reverse";
    hostStyle.alignItems = "center";
    hostStyle.gap = "8px";
    hostStyle.maxWidth = "92%";
    hostStyle.pointerEvents = "none";
    hostStyle.zIndex = Z_INDEX;

    document.body.appendChild(aHost);

    return aHost;
  }

  function makeCard(anArt, title, line) {
    var aCard = document.createElement("div");
    var cardStyle = aCard.style;

    var column = document.createElement("div");
    var titleElement = document.createElement("div");
    var lineElement = document.createElement("div");

    titleElement.textContent = title;
    titleElement.style.color = ACCENT_COLOR;
    titleElement.style.fontSize = "12px";
    titleElement.style.overflow = "hidden";
    titleElement.style.textOverflow = "ellipsis";
    titleElement.style.whiteSpace = "nowrap";

    lineElement.textContent = line;
    lineElement.style.color = MUTED_COLOR;
    lineElement.style.fontSize = "11px";
    lineElement.style.marginTop = "3px";
    lineElement.style.overflow = "hidden";
    lineElement.style.textOverflow = "ellipsis";
    lineElement.style.whiteSpace = "nowrap";

    column.style.display = "flex";
    column.style.flexDirection = "column";
    column.style.justifyContent = "center";
    column.style.minWidth = "0px";
    column.style.flexGrow = 1;

    column.appendChild(titleElement);
    column.appendChild(lineElement);

    cardStyle.display = "flex";
    cardStyle.alignItems = "center";
    cardStyle.gap = "10px";
    cardStyle.width = CARD_WIDTH + "px";
    cardStyle.maxWidth = "100%";
    cardStyle.boxSizing = "border-box";
    cardStyle.padding = "8px 12px";
    cardStyle.backgroundColor = PANEL_COLOR;
    cardStyle.borderStyle = "solid";
    cardStyle.borderWidth = "1px";
    cardStyle.borderColor = BORDER_COLOR;
    cardStyle.borderRadius = "6px";
    cardStyle.backdropFilter = "blur(6px)";
    cardStyle.webkitBackdropFilter = "blur(6px)";
    cardStyle.color = TEXT_COLOR;
    cardStyle.fontFamily = FONT_FAMILY;
    cardStyle.opacity = "0";
    cardStyle.transform = "translateY(8px)";
    cardStyle.transition = "opacity " + FADE + "ms ease, transform " + FADE + "ms ease";

    if (anArt != null) {
      anArt.style.width = ART_SIZE + "px";
      anArt.style.height = ART_SIZE + "px";
      anArt.style.flexShrink = 0;

      if (anArt.style.borderRadius == "") {
        anArt.style.borderRadius = "4px";
      }

      aCard.appendChild(anArt);
    }

    aCard.appendChild(column);

    return aCard;
  }

  function makeNotices() {
    var aHost = makeHost();
    var cards = [];

    function drop(aCard) {
      for (var i = 0; i < cards.length; i++) {
        if (cards[i].card == aCard) {
          window.clearTimeout(cards[i].timer);

          cards.splice(i, 1);

          break;
        }
      }

      var anArt = aCard.firstChild;

      if (anArt != null && typeof anArt.release == "function") {
        anArt.release();
      }

      aCard.style.opacity = "0";
      aCard.style.transform = "translateY(8px)";

      function remove() {
        if (aCard.parentNode != null) {
          aCard.parentNode.removeChild(aCard);
        }
      }

      window.setTimeout(remove, FADE);
    }

    function trim() {
      while (cards.length > STACK_CAP) {
        drop(cards[0].card);
      }
    }

    function show(anArt, title, line) {
      var aCard = makeCard(anArt, title, line);

      aHost.appendChild(aCard);

      function raise() {
        aCard.style.opacity = "1";
        aCard.style.transform = "translateY(0px)";
      }

      function expire() {
        drop(aCard);
      }

      window.requestAnimationFrame(raise);

      cards.push({ card: aCard, timer: window.setTimeout(expire, LIFE) });

      trim();

      return aCard;
    }

    function clear() {
      while (cards.length > 0) {
        drop(cards[0].card);
      }

      return true;
    }

    function count() {
      return cards.length;
    }

    return {
      element: aHost,
      show: show,
      clear: clear,
      count: count
    };
  }

  var notices = makeNotices();

  window.makeNotices = makeNotices;
  window.notices = notices;
})();
