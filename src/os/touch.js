(function () {
  var HOLD = 480;
  var SLIP = 12;

  function isDragSurface(anElement) {
    while (anElement != null) {
      if (anElement.dragSurface == true) {
        return anElement;
      }

      anElement = anElement.parentNode;
    }

    return null;
  }

  function makeTouch() {
    var target = null;
    var startX = 0;
    var startY = 0;
    var holdTimer = 0;
    var isDragging = false;
    var isHeld = false;

    function send(anElement, name, x, y) {
      var event = document.createEvent("MouseEvent");

      event.initMouseEvent(
        name, true, true, window, name == "click" ? 1 : 0,
        x, y, x, y, false, false, false, false, 0, null
      );

      anElement.dispatchEvent(event);

      return event;
    }

    function stopHold() {
      if (holdTimer != 0) {
        window.clearTimeout(holdTimer);

        holdTimer = 0;
      }
    }

    function onHold() {
      holdTimer = 0;
      isHeld = true;

      if (target == null) {
        return;
      }

      if (isDragging) {
        send(document, "mouseup", startX, startY);

        isDragging = false;
      }

      send(target, "contextmenu", startX, startY);
    }

    function onStart(event) {
      if (event.touches.length != 1) {
        stopHold();

        target = null;

        return;
      }

      var spot = event.touches[0];

      target = event.target;
      startX = spot.clientX;
      startY = spot.clientY;
      isHeld = false;
      isDragging = false;

      stopHold();

      holdTimer = window.setTimeout(onHold, HOLD);

      if (isDragSurface(target) == null) {
        return;
      }

      event.preventDefault();

      isDragging = true;

      send(target, "mousedown", startX, startY);
    }

    function onMove(event) {
      if (target == null || event.touches.length != 1) {
        return;
      }

      var spot = event.touches[0];
      var slid = Math.abs(spot.clientX - startX) > SLIP ||
        Math.abs(spot.clientY - startY) > SLIP;

      if (slid) {
        stopHold();
      }

      if (!isDragging) {
        return;
      }

      event.preventDefault();

      send(document, "mousemove", spot.clientX, spot.clientY);
    }

    function onEnd(event) {
      stopHold();

      if (target == null) {
        return;
      }

      var spot = event.changedTouches[0];
      var x = spot == null ? startX : spot.clientX;
      var y = spot == null ? startY : spot.clientY;

      if (isDragging) {
        event.preventDefault();

        send(document, "mouseup", x, y);

        var slid = Math.abs(x - startX) > SLIP || Math.abs(y - startY) > SLIP;

        if (!slid && !isHeld) {
          send(target, "click", x, y);
        }
      } else if (isHeld) {
        event.preventDefault();
      }

      target = null;
      isDragging = false;
      isHeld = false;
    }

    function onCancel() {
      stopHold();

      if (isDragging) {
        send(document, "mouseup", startX, startY);
      }

      target = null;
      isDragging = false;
      isHeld = false;
    }

    if (window.device.isTouch()) {
      document.addEventListener("touchstart", onStart, { passive: false });
      document.addEventListener("touchmove", onMove, { passive: false });
      document.addEventListener("touchend", onEnd, { passive: false });
      document.addEventListener("touchcancel", onCancel, false);
    }

    return {
      surface: function (anElement) {
        anElement.dragSurface = true;
        anElement.style.touchAction = "none";
        anElement.style.webkitTouchCallout = "none";

        return anElement;
      },
      holding: function () {
        return isHeld;
      }
    };
  }

  var touch = makeTouch();

  window.makeTouch = makeTouch;
  window.touch = touch;
})();
