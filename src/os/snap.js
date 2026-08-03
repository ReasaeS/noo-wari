(function () {
  var FFT_SIZE = 4096;
  var POLL_MS = 16;
  var BLOCK = 64;

  var EDGE_SHARE = 0.15;
  var LOUD_SHARE = 0.5;
  var STEADY_SHARE = 0.5;
  var QUIET_SHARE = 0.3;
  var HUSH_SHARE = 0.25;
  var HUSH_DELAY = 110;
  var HOLD = 320;
  var MAX_SPAN = 20;
  var INPUT_GUARD = 400;
  var INPUT_EVENTS = ["keydown", "keyup", "mousedown", "mouseup", "wheel"];
  var SLACK = 2.5;
  var MIN_RISE = 4;
  var MIN_FALL = 8;

  var REFRACTORY = 380;
  var FLOOR_RISE = 0.01;
  var FLOOR_QUIET = 0.6;
  var SETTLE_WINDOW = 900;
  var TEACH_WINDOW = 7000;

  var MIN_MARGIN = 12;
  var MARGIN_SHARE = 0.45;

  function middle(values) {
    var kept = values.slice(0);

    kept.sort(function (left, right) {
      return left - right;
    });

    return kept[Math.floor(kept.length / 2)];
  }

  function themeNames() {
    var found = window.theme.list();
    var saved = window.themes.list();

    for (var i = 0; i < saved.length; i++) {
      var isKnown = false;

      for (var j = 0; j < found.length; j++) {
        if (found[j] == saved[i]) {
          isKnown = true;
        }
      }

      if (!isKnown) {
        found.push(saved[i]);
      }
    }

    return found;
  }

  function nextTheme() {
    var names = themeNames();

    if (names.length == 0) {
      return "";
    }

    var active = window.themes.current();
    var index = -1;

    for (var i = 0; i < names.length; i++) {
      if (names[i] == active) {
        index = i;
      }
    }

    var wanted = names[(index + 1) % names.length];

    window.themes.apply(wanted);

    return wanted;
  }

  function build(aBody, anItem) {
    var ui = window.ui;

    var phase = "off";
    var stream = null;
    var audio = null;
    var analyser = null;
    var wave = null;
    var envelope = null;
    var timer = 0;

    var floor = 0;
    var margin = typeof anItem.settings.margin == "number" ? anItem.settings.margin : 0;
    var riseLimit = typeof anItem.settings.rise == "number" ? anItem.settings.rise : 0;
    var fallLimit = typeof anItem.settings.fall == "number" ? anItem.settings.fall : 0;

    var lastSnap = 0;
    var count = 0;

    var pending = false;
    var pendingAt = 0;
    var pendingPeak = 0;
    var lastInput = 0;

    function onInput() {
      lastInput = window.performance.now();
    }

    function touched(since) {
      return lastInput > since - INPUT_GUARD;
    }

    var teachStart = 0;
    var best = 0;
    var risings = [];
    var fallings = [];

    var status = document.createElement("div");
    var reading = document.createElement("div");
    var track = document.createElement("div");
    var level = document.createElement("div");
    var mark = document.createElement("div");
    var action = ui.button("listen", null);

    function say(text, color) {
      status.textContent = text;
      status.style.color = color;
    }

    function shaped() {
      return margin > 0 && riseLimit > 0 && fallLimit > 0;
    }

    function paintReading() {
      if (phase == "ready") {
        reading.textContent = count + " snaps  ·  " + window.themes.current();
      } else if (phase == "teaching") {
        reading.textContent = risings.length + " heard";
      } else {
        reading.textContent = "";
      }
    }

    function paintMeter(amount) {
      level.style.width = Math.min(100, (amount / 127) * 100) + "%";

      if (margin > 0) {
        mark.style.display = "block";
        mark.style.left = Math.min(100, ((floor + margin) / 127) * 100) + "%";
      } else {
        mark.style.display = "none";
      }
    }

    function shape() {
      analyser.getByteTimeDomainData(wave);

      var blocks = envelope.length;
      var top = 0;
      var at = 0;

      for (var i = 0; i < blocks; i++) {
        var start = i * BLOCK;
        var most = 0;

        for (var j = 0; j < BLOCK; j++) {
          var swing = Math.abs(wave[start + j] - 128);

          if (swing > most) {
            most = swing;
          }
        }

        envelope[i] = most;

        if (most > top) {
          top = most;
          at = i;
        }
      }

      var loud = top * LOUD_SHARE;
      var steady = 0;

      for (var k = 0; k < blocks; k++) {
        if (envelope[k] > loud) {
          steady = steady + 1;
        }
      }

      var edge = top * EDGE_SHARE;
      var back = at;

      while (back > 0 && envelope[back - 1] > edge) {
        back = back - 1;
      }

      var ahead = at;

      while (ahead < blocks - 1 && envelope[ahead + 1] > edge) {
        ahead = ahead + 1;
      }

      var around = 0;
      var outside = 0;

      for (var m = 0; m < blocks; m++) {
        if (m < back || m > ahead) {
          around = around + envelope[m];
          outside = outside + 1;
        }
      }

      if (outside > 0) {
        around = around / outside;
      }

      return {
        peak: top,
        rise: at - back,
        fall: ahead - at,
        span: ahead - back,
        steady: steady / blocks,
        around: around
      };
    }

    function armed() {
      phase = "ready";

      say("snap to change theme", ui.ACCENT_COLOR);

      action.textContent = "stop";

      paintReading();
    }

    function finishTeaching() {
      if (risings.length == 0) {
        phase = "off";

        say("heard no snap i could measure", ui.WARN_COLOR);

        action.textContent = "listen";

        stop();

        return;
      }

      margin = Math.max(MIN_MARGIN, (best - floor) * MARGIN_SHARE);
      riseLimit = Math.max(MIN_RISE, Math.round(middle(risings) * SLACK));
      fallLimit = Math.max(MIN_FALL, Math.round(middle(fallings) * SLACK));

      anItem.settings.margin = margin;
      anItem.settings.rise = riseLimit;
      anItem.settings.fall = fallLimit;

      window.widgets.store();

      armed();
    }

    function study(form, now) {
      if (now - teachStart < SETTLE_WINDOW) {
        floor = floor * 0.85 + form.peak * 0.15;

        return;
      }

      if (form.peak > best) {
        best = form.peak;
      }

      if (form.span <= MAX_SPAN && form.peak > floor + MIN_MARGIN * 2) {
        risings.push(form.rise);
        fallings.push(form.fall);

        paintReading();
      }

      if (now - teachStart > TEACH_WINDOW) {
        finishTeaching();
      }
    }

    function accept(now) {
      lastSnap = now;
      count = count + 1;

      nextTheme();
      paintReading();
    }

    function watch(form, now) {
      if (pending) {
        var since = now - pendingAt;

        if (since > HUSH_DELAY && form.peak > pendingPeak * HUSH_SHARE) {
          pending = false;

          return;
        }

        if (touched(pendingAt)) {
          pending = false;

          return;
        }

        if (since >= HOLD) {
          pending = false;

          accept(now);
        }

        return;
      }

      if (form.peak < floor + margin * FLOOR_QUIET) {
        floor = floor + (form.peak - floor) * FLOOR_RISE;
      }

      if (now - lastSnap < REFRACTORY) {
        return;
      }

      if (touched(now)) {
        return;
      }

      if (form.peak < floor + margin) {
        return;
      }

      if (form.steady > STEADY_SHARE) {
        return;
      }

      if (form.span > MAX_SPAN) {
        return;
      }

      if (form.around > form.peak * QUIET_SHARE) {
        return;
      }

      if (form.rise > riseLimit) {
        return;
      }

      if (form.fall > fallLimit) {
        return;
      }

      pending = true;
      pendingAt = now;
      pendingPeak = form.peak;
    }

    function frame() {
      if (analyser == null) {
        return;
      }

      var form = shape();
      var now = window.performance.now();

      paintMeter(form.peak);

      if (phase == "teaching") {
        study(form, now);

        return;
      }

      if (phase == "ready") {
        watch(form, now);
      }
    }

    function stop() {
      if (timer != 0) {
        window.clearInterval(timer);

        timer = 0;
      }

      if (stream != null) {
        var tracks = stream.getTracks();

        for (var i = 0; i < tracks.length; i++) {
          tracks[i].stop();
        }

        stream = null;
      }

      if (audio != null && typeof audio.close == "function") {
        audio.close();
      }

      audio = null;
      analyser = null;
      wave = null;
      envelope = null;
      pending = false;

      paintMeter(0);
      paintReading();
    }

    function teach() {
      phase = "teaching";

      floor = 0;
      best = 0;
      risings = [];
      fallings = [];
      teachStart = window.performance.now();

      say("snap a few times so i learn your snap", ui.ACCENT_COLOR);

      action.textContent = "cancel";

      paintReading();
    }

    function listen() {
      if (navigator.mediaDevices == null ||
        typeof navigator.mediaDevices.getUserMedia != "function") {
        say("no microphone access in this browser", ui.DANGER_COLOR);

        return;
      }

      say("asking for the microphone…", ui.MUTED_COLOR);

      navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        }
      }).then(function (granted) {
        var Context = window.AudioContext || window.webkitAudioContext;

        if (typeof Context == "undefined") {
          say("no audio engine in this browser", ui.DANGER_COLOR);

          return;
        }

        stream = granted;
        audio = new Context();
        analyser = audio.createAnalyser();

        analyser.fftSize = FFT_SIZE;

        wave = new Uint8Array(analyser.fftSize);
        envelope = new Uint8Array(analyser.fftSize / BLOCK);

        audio.createMediaStreamSource(stream).connect(analyser);

        timer = window.setInterval(frame, POLL_MS);

        if (shaped()) {
          armed();
        } else {
          teach();
        }
      }).catch(function () {
        phase = "off";

        say("microphone refused", ui.DANGER_COLOR);

        action.textContent = "listen";
      });
    }

    function onAction() {
      if (phase == "off") {
        listen();

        return;
      }

      phase = "off";

      stop();

      say("idle", ui.MUTED_COLOR);

      action.textContent = "listen";
    }

    status.style.fontSize = "11px";
    status.style.lineHeight = "1.5";
    status.style.marginBottom = "6px";

    reading.style.fontSize = "10px";
    reading.style.color = ui.MUTED_COLOR;
    reading.style.marginBottom = "6px";
    reading.style.overflow = "hidden";
    reading.style.textOverflow = "ellipsis";
    reading.style.whiteSpace = "nowrap";

    track.style.position = "relative";
    track.style.height = "6px";
    track.style.borderRadius = "3px";
    track.style.overflow = "hidden";
    track.style.backgroundColor = "var(--nw-sunken)";
    track.style.marginBottom = "8px";

    level.style.height = "100%";
    level.style.width = "0%";
    level.style.backgroundColor = ui.ACCENT_COLOR;

    mark.style.position = "absolute";
    mark.style.top = "0px";
    mark.style.width = "2px";
    mark.style.height = "100%";
    mark.style.display = "none";
    mark.style.backgroundColor = ui.WARN_COLOR;

    action.style.width = "100%";

    action.addEventListener("click", onAction);

    track.appendChild(level);
    track.appendChild(mark);

    aBody.appendChild(status);
    aBody.appendChild(reading);
    aBody.appendChild(track);
    aBody.appendChild(action);

    for (var i = 0; i < INPUT_EVENTS.length; i++) {
      document.addEventListener(INPUT_EVENTS[i], onInput, true);
    }

    say("idle", ui.MUTED_COLOR);

    function teardown() {
      phase = "off";

      for (var i = 0; i < INPUT_EVENTS.length; i++) {
        document.removeEventListener(INPUT_EVENTS[i], onInput, true);
      }

      stop();
    }

    return teardown;
  }

  function menu(anItem) {
    return [
      {
        label: "recalibrate",
        run: function (item) {
          item.settings.margin = 0;
          item.settings.rise = 0;
          item.settings.fall = 0;
        }
      }
    ];
  }

  window.widgets.define("snap", {
    title: "the snap",
    width: 190,
    anchor: "bottomRight",
    x: 0,
    y: 0,
    seed: true,
    build: build,
    menu: menu
  });
})();
