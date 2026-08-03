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

  var AURORA_COLOR = "#0b1220";

  var AURORA_SHADER_SOURCE =
    "float band(vec2 p, float offset, float speed, float thickness) {\n" +
    "  float wave = sin(p.x * 1.7 + uTime * speed + offset) * 0.16;\n" +
    "  wave += sin(p.x * 3.1 - uTime * speed * 0.7 + offset * 2.0) * 0.09;\n" +
    "  wave += sin(p.x * 0.6 + uTime * speed * 0.4) * 0.13;\n" +
    "  float d = abs(p.y - wave - offset * 0.11);\n" +
    "  return thickness / (d + thickness);\n" +
    "}\n" +
    "void main() {\n" +
    "  vec2 uv = gl_FragCoord.xy / uResolution;\n" +
    "  vec2 p = uv - 0.5;\n" +
    "  p.x *= uResolution.x / uResolution.y;\n" +
    "  vec3 color = mix(vec3(0.030, 0.042, 0.075), vec3(0.008, 0.014, 0.030), uv.y);\n" +
    "  float curtain = 0.0;\n" +
    "  vec3 glow = vec3(0.0);\n" +
    "  for (int i = 0; i < 4; i++) {\n" +
    "    float f = float(i);\n" +
    "    float amount = pow(band(p, f * 0.62 - 0.9, 0.22 + f * 0.05, 0.030), 2.4);\n" +
    "    curtain += amount;\n" +
    "    glow += mix(vec3(0.42, 0.72, 0.82), vec3(0.62, 0.55, 0.78), f / 3.0) * amount;\n" +
    "  }\n" +
    "  color += glow * 0.30;\n" +
    "  color += vec3(0.30, 0.52, 0.62) * curtain * curtain * 0.05;\n" +
    "  float star = fract(sin(dot(floor(gl_FragCoord.xy * 0.5), vec2(12.9898, 78.233))) * 43758.5453);\n" +
    "  color += vec3(0.6, 0.7, 0.85) * smoothstep(0.9975, 1.0, star) * (0.6 - uv.y * 0.4);\n" +
    "  float grain = fract(sin(dot(gl_FragCoord.xy, vec2(21.7, 61.3))) * 9134.71);\n" +
    "  color += (grain - 0.5) * 0.006;\n" +
    "  gl_FragColor = vec4(color, 1.0);\n" +
    "}\n";

  var FORGE_COLOR = "#150d08";

  var FORGE_SHADER_SOURCE =
    "float hash(vec2 p) {\n" +
    "  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);\n" +
    "}\n" +
    "float noise(vec2 p) {\n" +
    "  vec2 i = floor(p);\n" +
    "  vec2 f = fract(p);\n" +
    "  f = f * f * (3.0 - 2.0 * f);\n" +
    "  float a = hash(i);\n" +
    "  float b = hash(i + vec2(1.0, 0.0));\n" +
    "  float c = hash(i + vec2(0.0, 1.0));\n" +
    "  float d = hash(i + vec2(1.0, 1.0));\n" +
    "  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);\n" +
    "}\n" +
    "float ember(vec2 uv, float seed, float speed, float size) {\n" +
    "  float t = uTime * speed + seed * 37.0;\n" +
    "  float lane = hash(vec2(seed, 3.0));\n" +
    "  float x = lane + sin(t * 0.6 + seed) * 0.06;\n" +
    "  float y = fract(t * 0.12 + hash(vec2(seed, 7.0)));\n" +
    "  vec2 d = uv - vec2(x, y);\n" +
    "  d.x *= uResolution.x / uResolution.y;\n" +
    "  float life = 1.0 - y;\n" +
    "  return size * life / (dot(d, d) * 260.0 + size);\n" +
    "}\n" +
    "void main() {\n" +
    "  vec2 uv = gl_FragCoord.xy / uResolution;\n" +
    "  vec3 color = mix(vec3(0.105, 0.048, 0.020), vec3(0.020, 0.012, 0.010), pow(uv.y, 0.7));\n" +
    "  float heat = noise(vec2(uv.x * 3.0, uv.y * 2.0 - uTime * 0.10));\n" +
    "  heat += noise(vec2(uv.x * 7.0 + 4.0, uv.y * 4.0 - uTime * 0.16)) * 0.5;\n" +
    "  color += vec3(0.34, 0.13, 0.03) * heat * (1.0 - uv.y) * 0.55;\n" +
    "  float glow = 0.0;\n" +
    "  for (int i = 0; i < 9; i++) {\n" +
    "    glow += ember(uv, float(i), 0.9, 0.020);\n" +
    "  }\n" +
    "  color += mix(vec3(0.95, 0.45, 0.10), vec3(1.0, 0.82, 0.42), glow) * glow * 0.75;\n" +
    "  color += vec3(0.30, 0.10, 0.02) * pow(1.0 - uv.y, 3.0) * 0.5;\n" +
    "  float grain = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);\n" +
    "  color += (grain - 0.5) * 0.008;\n" +
    "  gl_FragColor = vec4(color, 1.0);\n" +
    "}\n";

  var BLOOM_COLOR = "#150f1c";

  var BLOOM_SHADER_SOURCE =
    "const float TAU = 6.28318531;\n" +
    "float petal(vec2 p, float count, float phase, float thickness) {\n" +
    "  float r = length(p);\n" +
    "  float a = atan(p.y, p.x);\n" +
    "  float shape = 0.30 + 0.13 * sin(a * count + phase);\n" +
    "  shape += 0.04 * sin(a * count * 2.0 - phase * 1.4);\n" +
    "  return thickness / (abs(r - shape) + thickness);\n" +
    "}\n" +
    "void main() {\n" +
    "  vec2 uv = gl_FragCoord.xy / uResolution;\n" +
    "  vec2 p = uv - 0.5;\n" +
    "  p.x *= uResolution.x / uResolution.y;\n" +
    "  vec3 color = mix(vec3(0.052, 0.032, 0.070), vec3(0.014, 0.010, 0.024), length(p) * 1.1);\n" +
    "  float amount = 0.0;\n" +
    "  vec3 glow = vec3(0.0);\n" +
    "  for (int i = 0; i < 4; i++) {\n" +
    "    float f = float(i);\n" +
    "    float spin = uTime * (0.06 + f * 0.025) + f * 1.3;\n" +
    "    vec2 q = vec2(p.x * cos(spin) - p.y * sin(spin), p.x * sin(spin) + p.y * cos(spin));\n" +
    "    q *= 1.0 + f * 0.42;\n" +
    "    float lobe = pow(petal(q, 5.0 + f, uTime * 0.30 + f, 0.014), 2.0);\n" +
    "    amount += lobe;\n" +
    "    glow += mix(vec3(0.83, 0.54, 0.64), vec3(0.69, 0.54, 0.83), f / 3.0) * lobe;\n" +
    "  }\n" +
    "  color += glow * 0.26;\n" +
    "  float core = 1.0 - smoothstep(0.0, 0.34, length(p));\n" +
    "  color += vec3(0.36, 0.20, 0.32) * core * 0.30;\n" +
    "  float grain = fract(sin(dot(gl_FragCoord.xy, vec2(45.1, 12.7))) * 21334.7);\n" +
    "  color += (grain - 0.5) * 0.006;\n" +
    "  gl_FragColor = vec4(color, 1.0);\n" +
    "}\n";

  var DRIFT_COLOR = "#141517";

  var DRIFT_SHADER_SOURCE =
    "float line(float v, float thickness) {\n" +
    "  float d = abs(fract(v) - 0.5);\n" +
    "  return thickness / (d + thickness);\n" +
    "}\n" +
    "void main() {\n" +
    "  vec2 uv = gl_FragCoord.xy / uResolution;\n" +
    "  vec2 p = uv - 0.5;\n" +
    "  p.x *= uResolution.x / uResolution.y;\n" +
    "  vec3 color = mix(vec3(0.088, 0.092, 0.100), vec3(0.038, 0.040, 0.045), length(p) * 1.2);\n" +
    "  float amount = 0.0;\n" +
    "  for (int i = 0; i < 3; i++) {\n" +
    "    float f = float(i);\n" +
    "    float spin = uTime * (0.014 + f * 0.008) + f * 0.7;\n" +
    "    vec2 q = vec2(p.x * cos(spin) - p.y * sin(spin), p.x * sin(spin) + p.y * cos(spin));\n" +
    "    float scale = 5.0 + f * 4.0;\n" +
    "    float warp = sin(q.y * 2.2 + uTime * 0.18) * 0.10;\n" +
    "    amount += pow(line(q.x * scale + warp, 0.030), 3.0) * (0.5 - f * 0.12);\n" +
    "    amount += pow(line(q.y * scale - warp, 0.030), 3.0) * (0.5 - f * 0.12);\n" +
    "  }\n" +
    "  color += vec3(0.80, 0.82, 0.86) * amount * 0.055;\n" +
    "  float sweep = sin(uv.x * 1.4 - uTime * 0.12) * 0.5 + 0.5;\n" +
    "  color += vec3(0.10, 0.10, 0.11) * sweep * 0.30;\n" +
    "  float grain = fract(sin(dot(gl_FragCoord.xy, vec2(92.3, 41.9))) * 7712.3);\n" +
    "  color += (grain - 0.5) * 0.007;\n" +
    "  gl_FragColor = vec4(color, 1.0);\n" +
    "}\n";

  var TRENCH_COLOR = "#05141a";

  var TRENCH_SHADER_SOURCE =
    "float caustic(vec2 p, float t) {\n" +
    "  float v = 0.0;\n" +
    "  v += sin(p.x * 3.1 + t);\n" +
    "  v += sin(p.y * 2.7 - t * 0.8);\n" +
    "  v += sin((p.x + p.y) * 2.2 + t * 0.6);\n" +
    "  v += sin(length(p * 1.8) * 3.4 - t * 1.1);\n" +
    "  return v * 0.25;\n" +
    "}\n" +
    "void main() {\n" +
    "  vec2 uv = gl_FragCoord.xy / uResolution;\n" +
    "  vec2 p = uv - 0.5;\n" +
    "  p.x *= uResolution.x / uResolution.y;\n" +
    "  vec3 color = mix(vec3(0.020, 0.070, 0.088), vec3(0.004, 0.016, 0.028), pow(1.0 - uv.y, 0.8));\n" +
    "  float web = caustic(p * 3.0, uTime * 0.30);\n" +
    "  web = pow(abs(web), 2.6);\n" +
    "  color += vec3(0.22, 0.72, 0.74) * web * 0.55 * (0.35 + uv.y * 0.9);\n" +
    "  float deep = caustic(p * 1.3 + vec2(3.0), uTime * 0.16);\n" +
    "  color += vec3(0.06, 0.26, 0.30) * pow(abs(deep), 1.8) * 0.30;\n" +
    "  float shaft = pow(max(sin(p.x * 2.0 + uTime * 0.06), 0.0), 22.0);\n" +
    "  color += vec3(0.16, 0.46, 0.50) * shaft * uv.y * 0.22;\n" +
    "  float mote = fract(sin(dot(floor(gl_FragCoord.xy * 0.4), vec2(19.7, 83.1))) * 5417.3);\n" +
    "  color += vec3(0.25, 0.55, 0.58) * smoothstep(0.9985, 1.0, mote) * 0.7;\n" +
    "  float grain = fract(sin(dot(gl_FragCoord.xy, vec2(33.1, 71.9))) * 12931.7);\n" +
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

    function fits() {
      var found = [];

      for (var i = 0; i < FITS.length; i++) {
        found.push(FITS[i].name);
      }

      return found;
    }

    return {
      fill: makeFill,
      gradient: makeGradient,
      image: makeImage,
      shader: makeShader,
      source: sourceOf,
      fits: fits,
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

  backgrounds.add(
    "aurora",
    makeShader(AURORA_SHADER_SOURCE, AURORA_COLOR)
  );

  backgrounds.add(
    "forge",
    makeShader(FORGE_SHADER_SOURCE, FORGE_COLOR)
  );

  backgrounds.add(
    "bloom",
    makeShader(BLOOM_SHADER_SOURCE, BLOOM_COLOR)
  );

  backgrounds.add(
    "drift",
    makeShader(DRIFT_SHADER_SOURCE, DRIFT_COLOR)
  );

  backgrounds.add(
    "trench",
    makeShader(TRENCH_SHADER_SOURCE, TRENCH_COLOR)
  );

  if (backgrounds.supportsShaders()) {
    backgrounds.select("floral");
  }

  window.makeBackgrounds = makeBackgrounds;
  window.backgrounds = backgrounds;
})();