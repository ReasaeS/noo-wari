(function () {
  var SAMPLES = [
    {
      name: "ps3 xmb",
      from: "ps3",
      source: ""
    },
    {
      name: "floral",
      from: "floral",
      source: ""
    },
    {
      name: "plasma",
      source:
        "void main() {\n" +
        "  vec2 uv = gl_FragCoord.xy / uResolution;\n" +
        "  float v = sin(uv.x * 10.0 + uTime);\n" +
        "  v += sin(uv.y * 12.0 - uTime * 0.7);\n" +
        "  v += sin((uv.x + uv.y) * 8.0 + uTime * 0.4);\n" +
        "  vec3 color = 0.5 + 0.5 * cos(vec3(0.0, 2.0, 4.0) + v);\n" +
        "  gl_FragColor = vec4(color * 0.35, 1.0);\n" +
        "}\n"
    },
    {
      name: "rings",
      source:
        "void main() {\n" +
        "  vec2 p = (gl_FragCoord.xy - uResolution * 0.5) / uResolution.y;\n" +
        "  float r = length(p);\n" +
        "  float band = sin(r * 40.0 - uTime * 2.0) * 0.5 + 0.5;\n" +
        "  vec3 color = mix(vec3(0.02, 0.05, 0.08), vec3(0.2, 0.6, 0.4), band);\n" +
        "  gl_FragColor = vec4(color, 1.0);\n" +
        "}\n"
    },
    {
      name: "grid",
      source:
        "void main() {\n" +
        "  vec2 uv = gl_FragCoord.xy / uResolution;\n" +
        "  vec2 cell = fract(uv * 20.0 + vec2(uTime * 0.2, 0.0));\n" +
        "  float line = step(0.94, max(cell.x, cell.y));\n" +
        "  vec3 color = mix(vec3(0.02, 0.04, 0.06), vec3(0.3, 0.8, 0.5), line);\n" +
        "  gl_FragColor = vec4(color, 1.0);\n" +
        "}\n"
    },
    {
      name: "mouse glow",
      source:
        "void main() {\n" +
        "  vec2 uv = gl_FragCoord.xy / uResolution;\n" +
        "  vec2 m = uMouse / uResolution;\n" +
        "  float d = distance(uv, m);\n" +
        "  float glow = 0.06 / (d + 0.06);\n" +
        "  vec3 color = vec3(0.1, 0.6, 0.3) * glow * 0.4;\n" +
        "  gl_FragColor = vec4(color, 1.0);\n" +
        "}\n"
    }
  ];

  function sampleNames() {
    var names = [];

    for (var i = 0; i < SAMPLES.length; i++) {
      names.push(SAMPLES[i].name);
    }

    return names;
  }

  function findSample(name) {
    for (var i = 0; i < SAMPLES.length; i++) {
      if (SAMPLES[i].name == name) {
        return SAMPLES[i];
      }
    }

    return SAMPLES[0];
  }

  function sourceOf(aSample) {
    if (aSample.source != "") {
      return aSample.source;
    }

    if (typeof window.backgrounds.source != "function") {
      return "";
    }

    return window.backgrounds.source(aSample.from);
  }

  function build(aSheet) {
    var ui = window.ui;

    var toolbar = ui.toolbar();
    var editor = document.createElement("textarea");
    var status = document.createElement("div");

    var previousName = window.backgrounds.current();

    var statusValue = ui.value("ready");

    function applyShader() {
      window.backgrounds.add(
        "sandbox",
        window.backgrounds.shader(editor.value, "#0b1410")
      );

      window.backgrounds.select("sandbox");

      var error = window.backgrounds.error();

      if (error == "") {
        statusValue.textContent = "running";
        statusValue.style.color = ui.ACCENT_COLOR;

        status.textContent = "compiled cleanly — the desktop is your canvas";
        status.style.color = ui.MUTED_COLOR;

        return;
      }

      statusValue.textContent = "failed";
      statusValue.style.color = ui.DANGER_COLOR;

      status.textContent = error;
      status.style.color = ui.DANGER_COLOR;
    }

    function revert() {
      window.backgrounds.select(previousName);

      statusValue.textContent = "reverted";
      statusValue.style.color = ui.MUTED_COLOR;

      status.textContent = "restored " + previousName;
      status.style.color = ui.MUTED_COLOR;
    }

    function onSampleChange(name) {
      editor.value = sourceOf(findSample(name));
    }

    function onKeyDown(event) {
      if (event.ctrlKey && event.key == "Enter") {
        event.preventDefault();

        applyShader();
      }

      if (event.key == "Tab") {
        event.preventDefault();

        var start = editor.selectionStart;

        editor.value =
          editor.value.substring(0, start) +
          "  " +
          editor.value.substring(editor.selectionEnd);

        editor.selectionStart = start + 2;
        editor.selectionEnd = start + 2;
      }
    }

    editor.value = sourceOf(SAMPLES[0]);
    editor.spellcheck = false;

    editor.style.flexGrow = 1;
    editor.style.minHeight = 0;
    editor.style.padding = "10px";
    editor.style.boxSizing = "border-box";
    editor.style.backgroundColor = "var(--nw-deep)";
    editor.style.borderStyle = "none";
    editor.style.outlineStyle = "none";
    editor.style.resize = "none";
    editor.style.color = ui.TEXT_COLOR;
    editor.style.fontFamily = ui.FONT_FAMILY;
    editor.style.fontSize = "12px";
    editor.style.lineHeight = "1.5";

    editor.addEventListener("keydown", onKeyDown);

    status.style.flexShrink = 0;
    status.style.padding = "8px 10px";
    status.style.fontSize = "11px";
    status.style.whiteSpace = "pre-wrap";
    status.style.maxHeight = "90px";
    status.style.overflowY = "auto";
    status.style.color = ui.MUTED_COLOR;
    status.style.backgroundColor = ui.PANEL_COLOR;
    status.style.borderTopStyle = "solid";
    status.style.borderTopWidth = "1px";
    status.style.borderTopColor = ui.BORDER_COLOR;

    status.textContent = "uniforms: uResolution, uTime, uMouse — ctrl+enter to run";

    toolbar.appendChild(ui.button("run", applyShader));
    toolbar.appendChild(ui.button("revert", revert));
    toolbar.appendChild(ui.select(sampleNames(), SAMPLES[0].name, onSampleChange));
    toolbar.appendChild(ui.spacer());
    toolbar.appendChild(ui.label("ctrl+enter"));
    toolbar.appendChild(statusValue);

    aSheet.appendChild(toolbar);
    aSheet.appendChild(editor);
    aSheet.appendChild(status);

    return null;
  }

  window.makeApp("shadertoy", "live editor for the desktop shader", 620, 500, build);
})();
