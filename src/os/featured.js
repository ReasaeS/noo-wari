(function () {
  var DEFAULT_PICKS = ["minesweeper", "shadertoy", "player", "paint"];
  var ICON_SIZE = 30;
  var PICK_COUNT = 4;

  function appNames() {
    var apps = window.launcher.list();
    var found = [];

    for (var i = 0; i < apps.length; i++) {
      found.push(apps[i].name);
    }

    return found;
  }

  function runApp(name) {
    var apps = window.launcher.list();

    for (var i = 0; i < apps.length; i++) {
      if (apps[i].name == name) {
        apps[i].run();

        return true;
      }
    }

    return false;
  }

  function picksFor(anItem) {
    var wanted = anItem.settings.names;

    if (!(wanted instanceof Array) || wanted.length == 0) {
      wanted = DEFAULT_PICKS;
    }

    var live = appNames();
    var found = [];

    for (var i = 0; i < wanted.length; i++) {
      for (var j = 0; j < live.length; j++) {
        if (live[j] == wanted[i]) {
          found.push(wanted[i]);
        }
      }
    }

    return found;
  }

  function shuffled(count) {
    var pool = appNames();
    var found = [];

    while (found.length < count && pool.length > 0) {
      var index = Math.floor(Math.random() * pool.length);

      found.push(pool[index]);
      pool.splice(index, 1);
    }

    return found;
  }

  function makeTile(name) {
    var aTile = document.createElement("div");
    var aLabel = document.createElement("div");

    aLabel.textContent = name;
    aLabel.style.marginTop = "4px";
    aLabel.style.fontSize = "10px";
    aLabel.style.textAlign = "center";
    aLabel.style.color = "var(--nw-text)";
    aLabel.style.overflow = "hidden";
    aLabel.style.textOverflow = "ellipsis";
    aLabel.style.whiteSpace = "nowrap";
    aLabel.style.maxWidth = "72px";

    aTile.style.display = "flex";
    aTile.style.flexDirection = "column";
    aTile.style.alignItems = "center";
    aTile.style.padding = "6px 2px";
    aTile.style.borderRadius = "6px";
    aTile.style.cursor = "pointer";

    aTile.appendChild(window.icons.app(name, ICON_SIZE));
    aTile.appendChild(aLabel);

    function onEnter() {
      aTile.style.backgroundColor = "var(--nw-active)";
    }

    function onLeave() {
      aTile.style.backgroundColor = "";
    }

    function onPick() {
      runApp(name);
    }

    aTile.addEventListener("mouseenter", onEnter);
    aTile.addEventListener("mouseleave", onLeave);
    aTile.addEventListener("click", onPick);

    return aTile;
  }

  function build(aBody, anItem) {
    var picks = picksFor(anItem);

    if (picks.length == 0) {
      var empty = window.ui.label("nothing to feature");

      empty.style.display = "block";
      empty.style.padding = "4px";

      aBody.appendChild(empty);

      return null;
    }

    var grid = document.createElement("div");

    grid.style.display = "grid";
    grid.style.gridTemplateColumns = "1fr 1fr";
    grid.style.gap = "2px";

    for (var i = 0; i < picks.length; i++) {
      grid.appendChild(makeTile(picks[i]));
    }

    aBody.appendChild(grid);

    return null;
  }

  function menu(anItem) {
    return [
      {
        label: "shuffle picks",
        run: function (item) {
          item.settings.names = shuffled(PICK_COUNT);
        }
      },
      {
        label: "reset picks",
        run: function (item) {
          item.settings.names = DEFAULT_PICKS.slice(0);
        }
      }
    ];
  }

  window.widgets.define("featured", {
    title: "featured",
    columns: 2,
    anchor: "topRight",
    x: 0,
    y: 0,
    seed: true,
    build: build,
    menu: menu
  });
})();
