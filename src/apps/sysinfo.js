(function () {
  function build(aSheet) {
    var ui = window.ui;

    var toolbar = ui.toolbar();
    var stage = ui.stage();

    var refreshTimer = 0;

    function makeSection(title) {
      var aSection = document.createElement("div");
      var sectionStyle = aSection.style;

      aSection.textContent = title;

      sectionStyle.marginTop = "14px";
      sectionStyle.marginBottom = "4px";
      sectionStyle.fontSize = "10px";
      sectionStyle.letterSpacing = "1px";
      sectionStyle.textTransform = "uppercase";
      sectionStyle.color = ui.MUTED_COLOR;

      return aSection;
    }

    function makeRow(label, value) {
      var aRow = document.createElement("div");
      var rowStyle = aRow.style;

      var labelElement = document.createElement("span");
      var valueElement = document.createElement("span");

      labelElement.textContent = label;
      labelElement.style.color = ui.MUTED_COLOR;
      labelElement.style.fontSize = "12px";

      valueElement.textContent = value;
      valueElement.style.color = ui.TEXT_COLOR;
      valueElement.style.fontSize = "12px";
      valueElement.style.marginLeft = "16px";
      valueElement.style.overflow = "hidden";
      valueElement.style.textOverflow = "ellipsis";
      valueElement.style.whiteSpace = "nowrap";

      rowStyle.display = "flex";
      rowStyle.justifyContent = "space-between";
      rowStyle.padding = "5px 0px";
      rowStyle.borderBottomStyle = "solid";
      rowStyle.borderBottomWidth = "1px";
      rowStyle.borderBottomColor = ui.BORDER_COLOR;

      aRow.appendChild(labelElement);
      aRow.appendChild(valueElement);

      return aRow;
    }

    function readMemory() {
      var memory = window.performance.memory;

      if (typeof memory == "undefined") {
        return "unavailable in this browser";
      }

      return (
        Math.round(memory.usedJSHeapSize / 1048576) +
        "M used of " +
        Math.round(memory.jsHeapSizeLimit / 1048576) +
        "M limit"
      );
    }

    function readRenderer() {
      var probe = document.createElement("canvas");
      var gl = probe.getContext("webgl");

      if (gl == null) {
        return "webgl unavailable";
      }

      var info = gl.getExtension("WEBGL_debug_renderer_info");

      if (info == null) {
        return gl.getParameter(gl.VERSION);
      }

      return gl.getParameter(info.UNMASKED_RENDERER_WEBGL);
    }

    function readNetwork() {
      if (!navigator.onLine) {
        return "offline";
      }

      var connection = navigator.connection;

      if (typeof connection == "undefined" || connection == null) {
        return "—";
      }

      return connection.effectiveType + " · " + connection.downlink + " Mbps";
    }

    function readStorage() {
      try {
        var used = 0;

        for (var i = 0; i < window.localStorage.length; i++) {
          var key = window.localStorage.key(i);

          used = used + key.length + window.localStorage.getItem(key).length;
        }

        return window.localStorage.length + " keys · " + used + " chars";
      } catch (error) {
        return "unavailable";
      }
    }

    function readUptime() {
      var seconds = Math.floor(window.performance.now() / 1000);
      var minutes = Math.floor(seconds / 60);

      return minutes + "m " + (seconds % 60) + "s";
    }

    function paint() {
      ui.clear(stage);

      stage.appendChild(makeSection("shell"));
      stage.appendChild(makeRow("session uptime", readUptime()));
      stage.appendChild(makeRow("desktop", "" + window.desktops.current()));
      stage.appendChild(makeRow("windows open", "" + window.desktops.windows().length));
      stage.appendChild(makeRow("wallpaper", window.backgrounds.current()));
      stage.appendChild(makeRow("apps registered", "" + window.launcher.list().length));

      stage.appendChild(makeSection("machine"));
      stage.appendChild(makeRow("platform", navigator.platform));
      stage.appendChild(makeRow("threads", "" + (navigator.hardwareConcurrency || "n/a")));
      stage.appendChild(makeRow("renderer", readRenderer()));
      stage.appendChild(makeRow("screen", window.screen.width + " x " + window.screen.height));
      stage.appendChild(makeRow("pixel ratio", "" + window.devicePixelRatio));
      stage.appendChild(makeRow("colour depth", window.screen.colorDepth + " bit"));

      stage.appendChild(makeSection("runtime"));
      stage.appendChild(makeRow("js heap", readMemory()));
      stage.appendChild(makeRow("local storage", readStorage()));
      stage.appendChild(makeRow("network", readNetwork()));
      stage.appendChild(makeRow("language", navigator.language));
      stage.appendChild(makeRow("timezone", Intl.DateTimeFormat().resolvedOptions().timeZone));
      stage.appendChild(makeRow("viewport", window.innerWidth + " x " + window.innerHeight));
    }

    function stop() {
      if (refreshTimer != 0) {
        clearInterval(refreshTimer);

        refreshTimer = 0;
      }
    }

    toolbar.appendChild(ui.button("refresh", paint));
    toolbar.appendChild(ui.spacer());
    toolbar.appendChild(ui.label("auto refresh 2s"));

    aSheet.appendChild(toolbar);
    aSheet.appendChild(stage);

    paint();

    refreshTimer = setInterval(paint, 2000);

    return stop;
  }

  window.makeApp("sysinfo", "what the browser will admit to", 480, 520, build, "system");
})();
