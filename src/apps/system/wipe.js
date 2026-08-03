(function () {
  var CONFIRM_WORD = "wipe";

  function formatBytes(amount) {
    if (amount < 1024) {
      return amount + " B";
    }

    if (amount < 1024 * 1024) {
      return Math.round((amount / 1024) * 10) / 10 + " KB";
    }

    return Math.round((amount / (1024 * 1024)) * 10) / 10 + " MB";
  }

  function readKeys() {
    var found = [];

    try {
      for (var i = 0; i < window.localStorage.length; i++) {
        var key = window.localStorage.key(i);
        var value = window.localStorage.getItem(key);

        if (value == null) {
          value = "";
        }

        found.push({ key: key, size: (key.length + value.length) * 2 });
      }
    } catch (error) {
      return [];
    }

    found.sort(function (left, right) {
      return right.size - left.size;
    });

    return found;
  }

  function build(aSheet) {
    var ui = window.ui;

    var toolbar = ui.toolbar();
    var stage = ui.stage();

    var totalValue = ui.value("0 B");

    function makeHeading(text) {
      var aHeading = document.createElement("div");

      aHeading.textContent = text;

      aHeading.style.marginTop = "14px";
      aHeading.style.marginBottom = "6px";
      aHeading.style.fontSize = "10px";
      aHeading.style.letterSpacing = "1px";
      aHeading.style.textTransform = "uppercase";
      aHeading.style.color = ui.MUTED_COLOR;

      return aHeading;
    }

    function makeRow(left, right, color) {
      var aRow = document.createElement("div");
      var leftElement = document.createElement("span");
      var rightElement = document.createElement("span");

      leftElement.textContent = left;
      leftElement.style.color = ui.MUTED_COLOR;
      leftElement.style.fontSize = "12px";
      leftElement.style.overflow = "hidden";
      leftElement.style.textOverflow = "ellipsis";
      leftElement.style.whiteSpace = "nowrap";

      rightElement.textContent = right;
      rightElement.style.fontSize = "12px";
      rightElement.style.marginLeft = "14px";
      rightElement.style.flexShrink = 0;

      if (typeof color == "string") {
        rightElement.style.color = color;
      } else {
        rightElement.style.color = ui.TEXT_COLOR;
      }

      aRow.style.display = "flex";
      aRow.style.justifyContent = "space-between";
      aRow.style.padding = "6px 0px";
      aRow.style.borderBottomStyle = "solid";
      aRow.style.borderBottomWidth = "1px";
      aRow.style.borderBottomColor = ui.BORDER_COLOR;

      aRow.appendChild(leftElement);
      aRow.appendChild(rightElement);

      return aRow;
    }

    function wipe() {
      try {
        window.localStorage.clear();
      } catch (error) {
        return false;
      }

      window.vault.clear().then(function () {
        window.location.reload();
      }).catch(function () {
        window.location.reload();
      });

      return true;
    }

    function paint() {
      ui.clear(stage);

      var entries = readKeys();
      var total = 0;

      for (var i = 0; i < entries.length; i++) {
        total = total + entries[i].size;
      }

      totalValue.textContent = formatBytes(total);

      stage.appendChild(makeHeading("origin"));
      stage.appendChild(makeRow("location", window.location.origin));
      stage.appendChild(makeRow("keys", "" + entries.length));
      stage.appendChild(makeRow("total", formatBytes(total), ui.ACCENT_COLOR));

      stage.appendChild(makeHeading("everything stored here"));

      if (entries.length == 0) {
        var empty = ui.label("local storage is already empty");

        empty.style.display = "block";
        empty.style.padding = "6px 0px";

        stage.appendChild(empty);
      }

      for (var j = 0; j < entries.length; j++) {
        var color = ui.TEXT_COLOR;

        if (entries[j].key.indexOf("noo-wari.") != 0) {
          color = ui.WARN_COLOR;
        }

        stage.appendChild(makeRow(entries[j].key, formatBytes(entries[j].size), color));
      }

      stage.appendChild(makeHeading("danger"));

      var warning = document.createElement("div");

      warning.textContent =
        "this erases every key above, including anything not written by noo-wari, " +
        "and every file kept in the indexeddb vault. it cannot be undone.";

      warning.style.fontSize = "12px";
      warning.style.lineHeight = "1.6";
      warning.style.color = ui.DANGER_COLOR;
      warning.style.marginBottom = "10px";

      var field = document.createElement("div");
      var anInput = ui.input("type " + CONFIRM_WORD + " to confirm", null);
      var aButton = ui.button("wipe everything", null);

      field.style.display = "flex";
      field.style.alignItems = "center";
      field.style.gap = "8px";

      aButton.style.flexShrink = 0;
      aButton.disabled = true;
      aButton.style.color = ui.MUTED_COLOR;
      aButton.style.borderColor = ui.BORDER_COLOR;
      aButton.style.cursor = "not-allowed";

      function onInput() {
        var isReady = anInput.value.trim().toLowerCase() == CONFIRM_WORD;

        aButton.disabled = !isReady;

        if (isReady) {
          aButton.style.color = ui.DANGER_COLOR;
          aButton.style.borderColor = ui.DANGER_COLOR;
          aButton.style.cursor = "pointer";
        } else {
          aButton.style.color = ui.MUTED_COLOR;
          aButton.style.borderColor = ui.BORDER_COLOR;
          aButton.style.cursor = "not-allowed";
        }
      }

      function onWipe() {
        if (aButton.disabled) {
          return;
        }

        wipe();
      }

      anInput.addEventListener("input", onInput);
      aButton.addEventListener("click", onWipe);

      field.appendChild(anInput);
      field.appendChild(aButton);

      stage.appendChild(warning);
      stage.appendChild(field);
    }

    toolbar.appendChild(ui.button("refresh", paint));
    toolbar.appendChild(ui.spacer());
    toolbar.appendChild(ui.label("stored"));
    toolbar.appendChild(totalValue);

    aSheet.appendChild(toolbar);
    aSheet.appendChild(stage);

    paint();

    return null;
  }

  window.makeApp("wipe", "erase every key in local storage", 520, 520, build, "system");
})();
