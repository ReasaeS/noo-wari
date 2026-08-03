(function () {
  var GROUPS = [
    { label: "base", roles: ["primary", "secondary", "tertiary"] },
    { label: "accents", roles: ["accent", "info", "alt"] },
    { label: "status", roles: ["ok", "warn", "danger"] },
    { label: "type", roles: ["text", "muted"] },
    { label: "logo", roles: ["logoInk", "logoField"] }
  ];

  var BASE_ROLES = ["primary", "secondary", "tertiary", "accent"];

  function isHex(value) {
    return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value);
  }

  function expand(value) {
    if (value.length != 4) {
      return value.toLowerCase();
    }

    return (
      "#" +
      value.charAt(1) + value.charAt(1) +
      value.charAt(2) + value.charAt(2) +
      value.charAt(3) + value.charAt(3)
    ).toLowerCase();
  }

  function build(aSheet) {
    var ui = window.ui;

    var toolbar = ui.toolbar();
    var body = document.createElement("div");
    var sidebar = document.createElement("div");
    var stage = ui.stage();

    var status = ui.value("");
    var timer = 0;

    var draft = null;
    var selected = window.themes.current();

    function uniqueName(wanted) {
      var name = wanted;
      var counter = 2;

      while (window.themes.get(name) != null) {
        name = wanted + " " + counter;

        counter = counter + 1;
      }

      return name;
    }

    draft = window.themes.get(selected);

    if (draft == null) {
      draft = window.themes.capture(uniqueName("my theme"));
    }

    function report(text) {
      status.textContent = text;

      if (timer != 0) {
        window.clearTimeout(timer);
      }

      timer = window.setTimeout(function () {
        status.textContent = "";
        timer = 0;
      }, 1600);
    }

    function preview() {
      window.themes.paint(draft);
    }

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

    function makeRow(label) {
      var aRow = document.createElement("div");
      var aLabel = document.createElement("span");

      aLabel.textContent = label;
      aLabel.style.color = ui.MUTED_COLOR;
      aLabel.style.fontSize = "12px";
      aLabel.style.width = "86px";
      aLabel.style.flexShrink = 0;

      aRow.style.display = "flex";
      aRow.style.alignItems = "center";
      aRow.style.gap = "8px";
      aRow.style.padding = "4px 0px";

      aRow.appendChild(aLabel);

      return aRow;
    }

    function makeSwatch(value, onPick) {
      var anInput = document.createElement("input");

      anInput.type = "color";
      anInput.value = value;

      anInput.style.width = "36px";
      anInput.style.height = "24px";
      anInput.style.padding = "1px";
      anInput.style.boxSizing = "border-box";
      anInput.style.backgroundColor = ui.FIELD_COLOR;
      anInput.style.borderStyle = "solid";
      anInput.style.borderWidth = "1px";
      anInput.style.borderColor = ui.BORDER_COLOR;
      anInput.style.borderRadius = "4px";
      anInput.style.cursor = "pointer";
      anInput.style.flexShrink = 0;

      function onInput() {
        onPick(anInput.value);
      }

      anInput.addEventListener("input", onInput);

      return anInput;
    }

    function makeText(value, width, onSet) {
      var anInput = document.createElement("input");

      anInput.type = "text";
      anInput.value = value;
      anInput.spellcheck = false;

      anInput.style.width = width + "px";
      anInput.style.padding = "4px 6px";
      anInput.style.boxSizing = "border-box";
      anInput.style.backgroundColor = ui.FIELD_COLOR;
      anInput.style.borderStyle = "solid";
      anInput.style.borderWidth = "1px";
      anInput.style.borderColor = ui.BORDER_COLOR;
      anInput.style.borderRadius = "4px";
      anInput.style.color = ui.TEXT_COLOR;
      anInput.style.fontFamily = ui.FONT_FAMILY;
      anInput.style.fontSize = "12px";
      anInput.style.outlineStyle = "none";

      function onInput() {
        onSet(anInput.value);
      }

      anInput.addEventListener("input", onInput);

      return anInput;
    }

    function makeColorRow(role) {
      var aRow = makeRow(role);
      var value = draft.palette[role];

      if (typeof value != "string") {
        value = "#000000";
      }

      var field = null;

      var swatch = makeSwatch(value, function (picked) {
        draft.palette[role] = picked;
        field.value = picked;

        preview();
      });

      field = makeText(value, 92, function (typed) {
        if (!isHex(typed)) {
          return;
        }

        draft.palette[role] = expand(typed);
        swatch.value = expand(typed);

        preview();
      });

      aRow.appendChild(swatch);
      aRow.appendChild(field);

      return aRow;
    }

    function makeSideRow(label, isActive, onPick) {
      var aRow = document.createElement("div");

      aRow.textContent = label;

      aRow.style.padding = "6px 9px";
      aRow.style.borderRadius = "4px";
      aRow.style.fontSize = "12px";
      aRow.style.cursor = "pointer";
      aRow.style.marginBottom = "2px";
      aRow.style.overflow = "hidden";
      aRow.style.textOverflow = "ellipsis";
      aRow.style.whiteSpace = "nowrap";

      if (isActive) {
        aRow.style.backgroundColor = "var(--nw-active)";
        aRow.style.color = ui.ACCENT_COLOR;
      } else {
        aRow.style.color = ui.TEXT_COLOR;
      }

      aRow.addEventListener("click", onPick);

      return aRow;
    }

    function makeGroupLabel(text) {
      var aLabel = document.createElement("div");

      aLabel.textContent = text;

      aLabel.style.marginTop = "8px";
      aLabel.style.marginBottom = "4px";
      aLabel.style.fontSize = "9px";
      aLabel.style.letterSpacing = "1px";
      aLabel.style.textTransform = "uppercase";
      aLabel.style.color = ui.MUTED_COLOR;

      return aLabel;
    }

    function loadPreset(name) {
      window.themes.apply(name);

      selected = name;
      draft = window.themes.capture(name);

      paint();
      report("applied " + name);
    }

    function loadSaved(name) {
      var found = window.themes.get(name);

      if (found == null) {
        return;
      }

      window.themes.apply(name);

      selected = name;
      draft = found;

      paint();
      report("applied " + name);
    }

    function paintSidebar() {
      ui.clear(sidebar);

      sidebar.appendChild(makeGroupLabel("presets"));

      var builtin = window.themes.presets();

      for (var i = 0; i < builtin.length; i++) {
        sidebar.appendChild(makeSideRow(builtin[i], selected == builtin[i], (function (name) {
          return function () {
            loadPreset(name);
          };
        })(builtin[i])));
      }

      sidebar.appendChild(makeGroupLabel("saved"));

      var mine = window.themes.list();

      if (mine.length == 0) {
        var hint = ui.label("none yet");

        hint.style.display = "block";
        hint.style.padding = "4px 9px";

        sidebar.appendChild(hint);
      }

      for (var j = 0; j < mine.length; j++) {
        sidebar.appendChild(makeSideRow(mine[j], selected == mine[j], (function (name) {
          return function () {
            loadSaved(name);
          };
        })(mine[j])));
      }
    }

    function deriveFromBase() {
      var base = new Object();

      for (var i = 0; i < BASE_ROLES.length; i++) {
        base[BASE_ROLES[i]] = draft.palette[BASE_ROLES[i]];
      }

      window.theme.set(base);

      draft.palette = window.themes.capture(draft.name).palette;

      preview();
      paint();
      report("derived");
    }

    function paintWallpaper() {
      var paper = draft.wallpaper;

      stage.appendChild(makeHeading("wallpaper"));

      var kindRow = makeRow("source");

      kindRow.appendChild(
        ui.select(window.themes.kinds(), paper.kind, function (picked) {
          paper.kind = picked;

          if (picked == "named" && paper.name == "") {
            paper.name = window.backgrounds.current();
          }

          preview();
          paint();
        })
      );

      stage.appendChild(kindRow);

      if (paper.kind == "named") {
        var namedRow = makeRow("wallpaper");

        namedRow.appendChild(
          ui.select(window.themes.wallpapers(), paper.name, function (picked) {
            paper.name = picked;

            preview();
          })
        );

        stage.appendChild(namedRow);
      }

      if (paper.kind == "fill") {
        var fillRow = makeRow("color");
        var fillField = null;

        var fillSwatch = makeSwatch(paper.color, function (picked) {
          paper.color = picked;
          fillField.value = picked;

          preview();
        });

        fillField = makeText(paper.color, 92, function (typed) {
          if (!isHex(typed)) {
            return;
          }

          paper.color = expand(typed);
          fillSwatch.value = expand(typed);

          preview();
        });

        fillRow.appendChild(fillSwatch);
        fillRow.appendChild(fillField);

        stage.appendChild(fillRow);
      }

      if (paper.kind == "gradient") {
        var topRow = makeRow("top");

        topRow.appendChild(
          makeSwatch(paper.top, function (picked) {
            paper.top = picked;

            preview();
          })
        );

        var bottomRow = makeRow("bottom");

        bottomRow.appendChild(
          makeSwatch(paper.bottom, function (picked) {
            paper.bottom = picked;

            preview();
          })
        );

        var angleRow = makeRow("angle");
        var angleValue = ui.value(paper.angle + "°");

        angleRow.appendChild(
          ui.range(0, 360, paper.angle, function (amount) {
            paper.angle = amount;
            angleValue.textContent = amount + "°";

            preview();
          })
        );

        angleRow.appendChild(angleValue);

        stage.appendChild(topRow);
        stage.appendChild(bottomRow);
        stage.appendChild(angleRow);
      }

      if (paper.kind == "image") {
        var urlRow = makeRow("url");

        urlRow.appendChild(
          makeText(paper.src, 240, function (typed) {
            paper.src = typed;

            preview();
          })
        );

        var fitRow = makeRow("fit");

        fitRow.appendChild(
          ui.select(window.themes.fits(), paper.fit, function (picked) {
            paper.fit = picked;

            preview();
          })
        );

        var backRow = makeRow("backdrop");

        backRow.appendChild(
          makeSwatch(paper.color, function (picked) {
            paper.color = picked;

            preview();
          })
        );

        stage.appendChild(urlRow);
        stage.appendChild(fitRow);
        stage.appendChild(backRow);
      }
    }

    function paintStage() {
      ui.clear(stage);

      var nameRow = makeRow("name");

      nameRow.appendChild(
        makeText(draft.name, 200, function (typed) {
          draft.name = typed;
        })
      );

      stage.appendChild(makeHeading("theme"));
      stage.appendChild(nameRow);

      for (var i = 0; i < GROUPS.length; i++) {
        stage.appendChild(makeHeading(GROUPS[i].label));

        for (var j = 0; j < GROUPS[i].roles.length; j++) {
          stage.appendChild(makeColorRow(GROUPS[i].roles[j]));
        }
      }

      var deriveRow = makeRow("");

      deriveRow.appendChild(ui.button("derive the rest from base", deriveFromBase));

      stage.appendChild(deriveRow);

      paintWallpaper();
    }

    function paint() {
      paintSidebar();
      paintStage();
    }

    function onSave() {
      if (draft.name == "") {
        report("name it first");

        return;
      }

      window.themes.save(draft);

      selected = draft.name;

      paint();
      report("saved " + draft.name);
    }

    function onNew() {
      draft = window.themes.capture(uniqueName("my theme"));

      selected = "";

      paint();
      report("started from the current look");
    }

    function onDelete() {
      if (window.themes.get(draft.name) == null) {
        report("not a saved theme");

        return;
      }

      window.themes.remove(draft.name);

      selected = "";

      paint();
      report("deleted");
    }

    body.style.display = "flex";
    body.style.flexGrow = 1;
    body.style.minHeight = 0;

    sidebar.style.width = "142px";
    sidebar.style.flexShrink = 0;
    sidebar.style.display = "flex";
    sidebar.style.flexDirection = "column";
    sidebar.style.padding = "8px";
    sidebar.style.boxSizing = "border-box";
    sidebar.style.overflowY = "auto";
    sidebar.style.backgroundColor = ui.PANEL_COLOR;
    sidebar.style.borderRightStyle = "solid";
    sidebar.style.borderRightWidth = "1px";
    sidebar.style.borderRightColor = ui.BORDER_COLOR;

    toolbar.appendChild(ui.button("new", onNew));
    toolbar.appendChild(ui.button("save", onSave));
    toolbar.appendChild(ui.button("delete", onDelete));
    toolbar.appendChild(ui.spacer());
    toolbar.appendChild(status);

    body.appendChild(sidebar);
    body.appendChild(stage);

    aSheet.appendChild(toolbar);
    aSheet.appendChild(body);

    paint();

    function onOutside() {
      selected = window.themes.current();

      paintSidebar();
    }

    window.themes.watch(onOutside);

    function teardown() {
      window.themes.unwatch(onOutside);

      if (timer != 0) {
        window.clearTimeout(timer);
        timer = 0;
      }
    }

    return teardown;
  }

  window.makeApp("themes", "build a look: colors and wallpaper", 720, 560, build, "system");
})();
