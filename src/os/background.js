(function () {
  var DEFAULT_FIT = "cover";
  var DEFAULT_COLOR = "#15171b";
  var DEFAULT_TOP_COLOR = "#1b1e24";
  var DEFAULT_BOTTOM_COLOR = "#12141a";
  var CYCLE_INTERVAL = 60000;
  var MAX_PIXEL_RATIO = 2;

  var VERTEX_SOURCE =
    "attribute vec2 aPosition;\n" +
    "void main() {\n" +
    "  gl_Position = vec4(aPosition, 0.0, 1.0);\n" +
    "}\n";

  var FRAGMENT_HEADER =
    "#ifdef GL_FRAGMENT_PRECISION_HIGH\n" +
    "precision highp float;\n" +
    "#else\n" +
    "precision mediump float;\n" +
    "#endif\n" +
    "uniform vec2 uResolution;\n" +
    "uniform float uTime;\n" +
    "uniform vec2 uMouse;\n";

  var FLORAL_COLOR = "#061109";

  var FLORAL_SHADER_SOURCE =
    "const float PI = 3.14159265;\n" +
    "const float TAU = 6.28318531;\n" +
    "float xmbBranch(float r, float a, float angle, float speed, float amplitude, float thickness, float root, float tip) {\n" +
    "  float target = angle;\n" +
    "  target += sin(r * 3.0 + uTime * speed) * amplitude;\n" +
    "  target += sin(r * 6.5 - uTime * speed * 0.6) * amplitude * 0.5;\n" +
    "  float offset = mod(a - target + PI, TAU) - PI;\n" +
    "  float body = thickness / (abs(offset) * r + thickness);\n" +
    "  float span = smoothstep(root, root + 0.10, r) * (1.0 - smoothstep(tip - 0.25, tip, r));\n" +
    "  return body * span;\n" +
    "}\n" +
    "void main() {\n" +
    "  vec2 uv = gl_FragCoord.xy / uResolution;\n" +
    "  vec2 p = uv - vec2(0.5, 0.5);\n" +
    "  p.x *= uResolution.x / uResolution.y;\n" +
    "  float spin = uTime * 0.05;\n" +
    "  vec2 q = vec2(p.x * cos(spin) - p.y * sin(spin), p.x * sin(spin) + p.y * cos(spin));\n" +
    "  float r = length(q);\n" +
    "  float a = atan(q.y, q.x);\n" +
    "  vec3 color = mix(vec3(0.004, 0.020, 0.012), vec3(0.02, 0.07, 0.04), uv.y);\n" +
    "  color += vec3(0.01, 0.04, 0.02) * max(1.0 - r * 1.2, 0.0);\n" +
    "  float amount = 0.0;\n" +
    "  for (int i = 0; i < 5; i++) {\n" +
    "    float base = float(i) * (TAU / 5.0);\n" +
    "    amount += pow(xmbBranch(r, a, base, 0.25, 0.22, 0.011, 0.0, 0.95), 2.0) * 0.55;\n" +
    "    amount += pow(xmbBranch(r, a, base + 0.55, -0.18, 0.30, 0.008, 0.22, 0.70), 2.0) * 0.35;\n" +
    "    amount += pow(xmbBranch(r, a, base - 0.45, 0.32, 0.26, 0.007, 0.34, 0.62), 2.0) * 0.28;\n" +
    "  }\n" +
    "  color += vec3(0.20, 0.85, 0.35) * amount * 0.35;\n" +
    "  float grain = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);\n" +
    "  color += (grain - 0.5) * 0.006;\n" +
    "  gl_FragColor = vec4(color, 1.0);\n" +
    "}\n";

  var XMB_COLOR = "#050a16";

  var XMB_SHADER_SOURCE =
    "float xmbStrand(vec2 uv, float phase, float speed, float amplitude, float thickness, float base) {\n" +
    "  float y = base;\n" +
    "  y += sin(uv.x * 2.3 + uTime * speed + phase) * amplitude;\n" +
    "  y += sin(uv.x * 5.1 - uTime * speed * 0.55 + phase * 1.7) * amplitude * 0.42;\n" +
    "  y += sin(uv.x * 9.7 + uTime * speed * 0.30 + phase * 2.3) * amplitude * 0.18;\n" +
    "  return thickness / (abs(uv.y - y) + thickness);\n" +
    "}\n" +
    "void main() {\n" +
    "  vec2 uv = gl_FragCoord.xy / uResolution;\n" +
    "  vec3 deep = vec3(0.004, 0.010, 0.030);\n" +
    "  vec3 high = vec3(0.020, 0.055, 0.115);\n" +
    "  vec3 color = mix(deep, high, smoothstep(0.0, 1.0, uv.y));\n" +
    "  color += vec3(0.015, 0.040, 0.080) * exp(-abs(uv.y - 0.52) * 5.5);\n" +
    "  float band = 0.0;\n" +
    "  for (int i = 0; i < 16; i++) {\n" +
    "    float fi = float(i) / 15.0;\n" +
    "    float base = 0.52 + (fi - 0.5) * 0.16;\n" +
    "    float amplitude = 0.030 + fi * 0.022;\n" +
    "    float speed = 0.09 + fi * 0.05;\n" +
    "    float thickness = 0.0014 + fi * 0.0011;\n" +
    "    float weight = 1.0 - abs(fi - 0.5) * 1.3;\n" +
    "    band += pow(xmbStrand(uv, fi * 6.3, speed, amplitude, thickness, base), 1.5) * weight;\n" +
    "  }\n" +
    "  band = min(band / 5.0, 1.0);\n" +
    "  float edge = smoothstep(0.0, 0.22, uv.x) * smoothstep(1.0, 0.78, uv.x);\n" +
    "  band *= 0.30 + 0.70 * edge;\n" +
    "  vec3 glow = mix(vec3(0.20, 0.50, 0.95), vec3(0.80, 0.92, 1.00), min(band * 3.0, 1.0));\n" +
    "  color += glow * band * 1.6;\n" +
    "  float grain = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);\n" +
    "  color += (grain - 0.5) * 0.006;\n" +
    "  gl_FragColor = vec4(color, 1.0);\n" +
    "}\n";

  var FITS = [
    { name: "cover", size: "cover", repeat: "no-repeat", position: "center center" },
    { name: "contain", size: "contain", repeat: "no-repeat", position: "center center" },
    { name: "stretch", size: "100% 100%", repeat: "no-repeat", position: "center center" },
    { name: "center", size: "auto", repeat: "no-repeat", position: "center center" },
    { name: "tile", size: "auto", repeat: "repeat", position: "top left" }
  ];

  function findFit(name) {
    for (var i = 0; i < FITS.length; i++) {
      if (FITS[i].name == name) {
        return FITS[i];
      }
    }

    return FITS[0];
  }

  function makeFill(color) {
    var aBackground = new Object();

    aBackground.color = color;
    aBackground.image = "none";
    aBackground.fit = DEFAULT_FIT;

    return aBackground;
  }

  function makeGradient(angle, fromColor, toColor) {
    var aBackground = new Object();

    aBackground.color = fromColor;
    aBackground.image =
      "linear-gradient(" + angle + "deg, " + fromColor + ", " + toColor + ")";
    aBackground.fit = "stretch";

    return aBackground;
  }

  function makeImage(url, fit, color) {
    var aBackground = new Object();

    if (typeof fit == "undefined") {
      fit = DEFAULT_FIT;
    }

    if (typeof color == "undefined") {
      color = DEFAULT_COLOR;
    }

    aBackground.color = color;
    aBackground.image = "url(\"" + url + "\")";
    aBackground.fit = fit;

    return aBackground;
  }

  function makeShader(source, color) {
    var aBackground = new Object();

    if (typeof color == "undefined") {
      color = DEFAULT_COLOR;
    }

    aBackground.color = color;
    aBackground.image = "none";
    aBackground.fit = DEFAULT_FIT;
    aBackground.shader = source;

    return aBackground;
  }

  function makeCanvas() {
    var aCanvas = document.createElement("canvas");
    var canvasStyle = aCanvas.style;

    canvasStyle.position = "fixed";
    canvasStyle.left = "0px";
    canvasStyle.top = "0px";
    canvasStyle.width = "100%";
    canvasStyle.height = "100%";
    canvasStyle.zIndex = 0;
    canvasStyle.display = "none";
    canvasStyle.pointerEvents = "none";

    return aCanvas;
  }

  function makeRenderer(aCanvas) {
    var gl = aCanvas.getContext("webgl");

    var buffer = null;
    var program = null;
    var frameTimer = 0;
    var startTime = 0;
    var pixelRatio = 1;
    var mouseX = 0;
    var mouseY = 0;
    var currentSource = "";
    var lastError = "";

    var positionLocation = -1;
    var resolutionLocation = null;
    var timeLocation = null;
    var mouseLocation = null;

    if (gl == null) {
      gl = aCanvas.getContext("experimental-webgl");
    }

    function isSupported() {
      return gl != null;
    }

    function error() {
      return lastError;
    }

    function makeStage(type, source) {
      var aStage = gl.createShader(type);

      gl.shaderSource(aStage, source);
      gl.compileShader(aStage);

      if (!gl.getShaderParameter(aStage, gl.COMPILE_STATUS)) {
        lastError = gl.getShaderInfoLog(aStage);

        gl.deleteShader(aStage);

        return null;
      }

      return aStage;
    }

    function build(source) {
      var vertexStage = makeStage(gl.VERTEX_SHADER, VERTEX_SOURCE);
      var fragmentStage = makeStage(gl.FRAGMENT_SHADER, FRAGMENT_HEADER + source);

      if (vertexStage == null || fragmentStage == null) {
        if (vertexStage != null) {
          gl.deleteShader(vertexStage);
        }

        if (fragmentStage != null) {
          gl.deleteShader(fragmentStage);
        }

        return null;
      }

      var aProgram = gl.createProgram();

      gl.attachShader(aProgram, vertexStage);
      gl.attachShader(aProgram, fragmentStage);
      gl.linkProgram(aProgram);

      gl.deleteShader(vertexStage);
      gl.deleteShader(fragmentStage);

      if (!gl.getProgramParameter(aProgram, gl.LINK_STATUS)) {
        lastError = gl.getProgramInfoLog(aProgram);

        gl.deleteProgram(aProgram);

        return null;
      }

      return aProgram;
    }

    function setupBuffer() {
      buffer = gl.createBuffer();

      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([-1, -1, 3, -1, -1, 3]),
        gl.STATIC_DRAW
      );
    }

    function resize() {
      pixelRatio = window.devicePixelRatio || 1;

      if (pixelRatio > MAX_PIXEL_RATIO) {
        pixelRatio = MAX_PIXEL_RATIO;
      }

      var width = Math.round(window.innerWidth * pixelRatio);
      var height = Math.round(window.innerHeight * pixelRatio);

      if (aCanvas.width != width || aCanvas.height != height) {
        aCanvas.width = width;
        aCanvas.height = height;
      }

      gl.viewport(0, 0, aCanvas.width, aCanvas.height);
    }

    function draw(now) {
      frameTimer = 0;

      if (program == null) {
        return;
      }

      if (startTime == 0) {
        startTime = now;
      }

      resize();

      gl.useProgram(program);

      gl.uniform2f(resolutionLocation, aCanvas.width, aCanvas.height);
      gl.uniform1f(timeLocation, (now - startTime) / 1000);
      gl.uniform2f(
        mouseLocation,
        mouseX * pixelRatio,
        aCanvas.height - mouseY * pixelRatio
      );

      gl.drawArrays(gl.TRIANGLES, 0, 3);

      frameTimer = window.requestAnimationFrame(draw);
    }

    function use(source) {
      if (gl == null) {
        lastError = "webgl is unavailable";

        return false;
      }

      var aProgram = build(source);

      if (aProgram == null) {
        return false;
      }

      if (program != null) {
        gl.deleteProgram(program);
      }

      if (buffer == null) {
        setupBuffer();
      }

      program = aProgram;
      currentSource = source;
      startTime = 0;

      positionLocation = gl.getAttribLocation(program, "aPosition");
      resolutionLocation = gl.getUniformLocation(program, "uResolution");
      timeLocation = gl.getUniformLocation(program, "uTime");
      mouseLocation = gl.getUniformLocation(program, "uMouse");

      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.enableVertexAttribArray(positionLocation);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

      lastError = "";

      return true;
    }

    function start() {
      if (frameTimer != 0 || program == null) {
        return;
      }

      frameTimer = window.requestAnimationFrame(draw);
    }

    function stop() {
      if (frameTimer != 0) {
        window.cancelAnimationFrame(frameTimer);

        frameTimer = 0;
      }
    }

    function onContextLost(event) {
      event.preventDefault();

      stop();

      buffer = null;
      program = null;
    }

    function onContextRestored() {
      if (currentSource == "") {
        return;
      }

      if (use(currentSource)) {
        start();
      }
    }

    function onMouseMove(event) {
      mouseX = event.clientX;
      mouseY = event.clientY;
    }

    aCanvas.addEventListener("webglcontextlost", onContextLost);
    aCanvas.addEventListener("webglcontextrestored", onContextRestored);

    document.addEventListener("mousemove", onMouseMove);

    return {
      isSupported: isSupported,
      error: error,
      use: use,
      start: start,
      stop: stop
    };
  }

  function makeBackgrounds(target) {
    var targetStyle = target.style;

    var names = [];
    var entries = new Object();

    var currentName = "";
    var cycleTimer = 0;

    var aCanvas = null;
    var renderer = null;

    function ensureRenderer() {
      if (renderer != null) {
        return renderer;
      }

      aCanvas = makeCanvas();
      renderer = makeRenderer(aCanvas);

      document.body.insertBefore(aCanvas, document.body.firstChild);

      return renderer;
    }

    function startShader(source) {
      var activeRenderer = ensureRenderer();

      if (!activeRenderer.use(source)) {
        aCanvas.style.display = "none";

        return false;
      }

      aCanvas.style.display = "block";

      activeRenderer.start();

      return true;
    }

    function stopShader() {
      if (renderer == null) {
        return;
      }

      renderer.stop();

      aCanvas.style.display = "none";
    }

    function supportsShaders() {
      return ensureRenderer().isSupported();
    }

    function error() {
      if (renderer == null) {
        return "";
      }

      return renderer.error();
    }

    function indexOfName(name) {
      for (var i = 0; i < names.length; i++) {
        if (names[i] == name) {
          return i;
        }
      }

      return -1;
    }

    function apply(aBackground) {
      var fit = findFit(aBackground.fit);

      if (typeof aBackground.shader == "undefined") {
        stopShader();
      } else {
        startShader(aBackground.shader);
      }

      targetStyle.backgroundColor = aBackground.color;
      targetStyle.backgroundImage = aBackground.image;
      targetStyle.backgroundSize = fit.size;
      targetStyle.backgroundRepeat = fit.repeat;
      targetStyle.backgroundPosition = fit.position;
      targetStyle.backgroundAttachment = "fixed";
    }

    function clear() {
      stopShader();

      targetStyle.backgroundColor = "";
      targetStyle.backgroundImage = "";
      targetStyle.backgroundSize = "";
      targetStyle.backgroundRepeat = "";
      targetStyle.backgroundPosition = "";
      targetStyle.backgroundAttachment = "";

      currentName = "";
    }

    function select(name) {
      var aBackground = entries[name];

      if (typeof aBackground == "undefined") {
        return false;
      }

      apply(aBackground);

      currentName = name;

      return true;
    }

    function add(name, aBackground) {
      if (indexOfName(name) == -1) {
        names.push(name);
      }

      entries[name] = aBackground;

      if (currentName == "") {
        select(name);
      }

      return aBackground;
    }

    function remove(name) {
      var index = indexOfName(name);

      if (index == -1) {
        return false;
      }

      names.splice(index, 1);

      delete entries[name];

      if (currentName == name) {
        currentName = "";

        if (names.length == 0) {
          clear();
        } else {
          select(names[0]);
        }
      }

      return true;
    }

    function step(amount) {
      if (names.length == 0) {
        return false;
      }

      var index = indexOfName(currentName) + amount;

      while (index < 0) {
        index = index + names.length;
      }

      return select(names[index % names.length]);
    }

    function next() {
      return step(1);
    }

    function previous() {
      return step(-1);
    }

    function stopCycle() {
      if (cycleTimer != 0) {
        clearInterval(cycleTimer);

        cycleTimer = 0;
      }
    }

    function cycle(interval) {
      if (typeof interval == "undefined") {
        interval = CYCLE_INTERVAL;
      }

      stopCycle();

      cycleTimer = setInterval(next, interval);
    }

    function current() {
      return currentName;
    }

    function sourceOf(name) {
      var aBackground = entries[name];

      if (typeof aBackground == "undefined") {
        return "";
      }

      if (typeof aBackground.shader == "undefined") {
        return "";
      }

      return aBackground.shader;
    }

    function list() {
      return names.slice(0);
    }

    return {
      fill: makeFill,
      gradient: makeGradient,
      image: makeImage,
      shader: makeShader,
      source: sourceOf,
      supportsShaders: supportsShaders,
      error: error,
      add: add,
      remove: remove,
      select: select,
      next: next,
      previous: previous,
      cycle: cycle,
      stopCycle: stopCycle,
      clear: clear,
      current: current,
      list: list
    };
  }

  var backgrounds = makeBackgrounds(document.documentElement);

  backgrounds.add(
    "default",
    makeGradient(180, DEFAULT_TOP_COLOR, DEFAULT_BOTTOM_COLOR)
  );

  backgrounds.add(
    "floral",
    makeShader(FLORAL_SHADER_SOURCE, FLORAL_COLOR)
  );

  backgrounds.add(
    "ps3",
    makeShader(XMB_SHADER_SOURCE, XMB_COLOR)
  );

  if (backgrounds.supportsShaders()) {
    backgrounds.select("floral");
  }

  window.makeBackgrounds = makeBackgrounds;
  window.backgrounds = backgrounds;
})();