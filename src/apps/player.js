(function () {
  var NOTES = ["c", "c#", "d", "d#", "e", "f", "f#", "g", "g#", "a", "a#", "b"];
  var WAVES = ["square", "sawtooth", "triangle", "sine"];

  var TRACKS = [
    {
      name: "ode to joy",
      tempo: 120,
      notes: [
        ["e4", 1], ["e4", 1], ["f4", 1], ["g4", 1],
        ["g4", 1], ["f4", 1], ["e4", 1], ["d4", 1],
        ["c4", 1], ["c4", 1], ["d4", 1], ["e4", 1],
        ["e4", 1.5], ["d4", 0.5], ["d4", 2],
        ["e4", 1], ["e4", 1], ["f4", 1], ["g4", 1],
        ["g4", 1], ["f4", 1], ["e4", 1], ["d4", 1],
        ["c4", 1], ["c4", 1], ["d4", 1], ["e4", 1],
        ["d4", 1.5], ["c4", 0.5], ["c4", 2]
      ]
    },
    {
      name: "korobeiniki",
      tempo: 150,
      notes: [
        ["e5", 1], ["b4", 0.5], ["c5", 0.5], ["d5", 1], ["c5", 0.5], ["b4", 0.5],
        ["a4", 1], ["a4", 0.5], ["c5", 0.5], ["e5", 1], ["d5", 0.5], ["c5", 0.5],
        ["b4", 1.5], ["c5", 0.5], ["d5", 1], ["e5", 1],
        ["c5", 1], ["a4", 1], ["a4", 1], ["", 1],
        ["d5", 1.5], ["f5", 0.5], ["a5", 1], ["g5", 0.5], ["f5", 0.5],
        ["e5", 1.5], ["c5", 0.5], ["e5", 1], ["d5", 0.5], ["c5", 0.5],
        ["b4", 1], ["b4", 0.5], ["c5", 0.5], ["d5", 1], ["e5", 1],
        ["c5", 1], ["a4", 1], ["a4", 1], ["", 1]
      ]
    },
    {
      name: "greensleeves",
      tempo: 100,
      notes: [
        ["a4", 1], ["c5", 1.5], ["d5", 0.5], ["e5", 1.5], ["f5", 0.5],
        ["e5", 1], ["d5", 1.5], ["b4", 0.5], ["g4", 1.5], ["a4", 0.5],
        ["b4", 1], ["c5", 1.5], ["a4", 0.5], ["a4", 1.5], ["g4", 0.5],
        ["a4", 1], ["b4", 1], ["c5", 2],
        ["a4", 1], ["c5", 1.5], ["d5", 0.5], ["e5", 1.5], ["f5", 0.5],
        ["e5", 1], ["d5", 1.5], ["b4", 0.5], ["g4", 1.5], ["a4", 0.5],
        ["b4", 1], ["c5", 0.5], ["b4", 0.5], ["a4", 1], ["g4", 1],
        ["g4", 1], ["a4", 3]
      ]
    },
    {
      name: "drift",
      tempo: 96,
      notes: [
        ["c4", 1], ["e4", 1], ["g4", 1], ["b4", 1],
        ["a4", 1], ["g4", 1], ["e4", 1], ["c4", 1],
        ["d4", 1], ["f4", 1], ["a4", 1], ["c5", 1],
        ["b4", 1], ["a4", 1], ["f4", 1], ["d4", 1],
        ["e4", 1], ["g4", 1], ["b4", 1], ["d5", 1],
        ["c5", 1], ["b4", 1], ["g4", 1], ["e4", 1],
        ["f4", 2], ["e4", 2], ["d4", 2], ["c4", 2]
      ]
    }
  ];

  function frequencyOf(name) {
    if (name == "") {
      return 0;
    }

    var octave = Number(name.charAt(name.length - 1));
    var pitch = name.substring(0, name.length - 1);
    var index = -1;

    for (var i = 0; i < NOTES.length; i++) {
      if (NOTES[i] == pitch) {
        index = i;
      }
    }

    if (index == -1) {
      return 0;
    }

    var steps = index - 9 + (octave - 4) * 12;

    return 440 * Math.pow(2, steps / 12);
  }

  function trackNames() {
    var names = [];

    for (var i = 0; i < TRACKS.length; i++) {
      names.push(TRACKS[i].name);
    }

    return names;
  }

  function findTrack(name) {
    for (var i = 0; i < TRACKS.length; i++) {
      if (TRACKS[i].name == name) {
        return TRACKS[i];
      }
    }

    return TRACKS[0];
  }

  function build(aSheet) {
    var ui = window.ui;

    var toolbar = ui.toolbar();
    var stage = ui.stage();
    var canvas = ui.canvas();
    var context = canvas.getContext("2d");

    var track = TRACKS[0];
    var wave = WAVES[0];
    var volume = 30;
    var noteIndex = 0;
    var isPlaying = false;
    var stepTimer = 0;
    var frameTimer = 0;

    var audio = null;
    var master = null;
    var analyser = null;
    var spectrum = null;

    var trackValue = ui.value("stopped");
    var positionElement = document.createElement("div");
    var listElement = document.createElement("div");

    function ensureAudio() {
      if (audio != null) {
        return;
      }

      var Context = window.AudioContext || window.webkitAudioContext;

      if (typeof Context == "undefined") {
        return;
      }

      audio = new Context();
      master = audio.createGain();
      analyser = audio.createAnalyser();

      analyser.fftSize = 128;
      spectrum = new Uint8Array(analyser.frequencyBinCount);

      master.gain.value = volume / 100;

      master.connect(analyser);
      analyser.connect(audio.destination);
    }

    function paintList() {
      ui.clear(listElement);

      for (var i = 0; i < TRACKS.length; i++) {
        var aRow = document.createElement("div");
        var rowStyle = aRow.style;

        aRow.textContent = TRACKS[i].name + "  ·  " + TRACKS[i].notes.length + " notes";

        rowStyle.padding = "5px 8px";
        rowStyle.borderRadius = "4px";
        rowStyle.fontSize = "12px";

        if (TRACKS[i] == track) {
          rowStyle.backgroundColor = "var(--nw-active)";
          rowStyle.color = ui.ACCENT_COLOR;
        } else {
          rowStyle.color = ui.MUTED_COLOR;
        }

        listElement.appendChild(aRow);
      }
    }

    function paintPosition() {
      positionElement.textContent = noteIndex + " / " + track.notes.length;
    }

    function drawSpectrum() {
      var width = canvas.width;
      var height = canvas.height;

      context.fillStyle = "#262a31";
      context.fillRect(0, 0, width, height);

      if (analyser == null) {
        frameTimer = window.requestAnimationFrame(drawSpectrum);
        return;
      }

      analyser.getByteFrequencyData(spectrum);

      var bars = spectrum.length;
      var barWidth = width / bars;

      for (var i = 0; i < bars; i++) {
        var amount = spectrum[i] / 255;
        var barHeight = amount * height;

        context.fillStyle = "hsl(" + Math.round(145 + amount * 90) + ", 45%, 62%)";
        context.fillRect(i * barWidth, height - barHeight, barWidth - 1, barHeight);
      }

      frameTimer = window.requestAnimationFrame(drawSpectrum);
    }

    function playNote(name, seconds) {
      var frequency = frequencyOf(name);

      if (audio == null || frequency == 0) {
        return;
      }

      var oscillator = audio.createOscillator();
      var envelope = audio.createGain();
      var now = audio.currentTime;

      oscillator.type = wave;
      oscillator.frequency.value = frequency;

      envelope.gain.setValueAtTime(0, now);
      envelope.gain.linearRampToValueAtTime(0.6, now + 0.01);
      envelope.gain.exponentialRampToValueAtTime(0.001, now + seconds * 0.95);

      oscillator.connect(envelope);
      envelope.connect(master);

      oscillator.start(now);
      oscillator.stop(now + seconds);
    }

    function step() {
      if (!isPlaying) {
        return;
      }

      if (noteIndex >= track.notes.length) {
        noteIndex = 0;
      }

      var entry = track.notes[noteIndex];
      var seconds = (entry[1] * 60) / track.tempo;

      playNote(entry[0], seconds);

      noteIndex = noteIndex + 1;

      paintPosition();

      stepTimer = setTimeout(step, seconds * 1000);
    }

    function stopTimers() {
      if (stepTimer != 0) {
        clearTimeout(stepTimer);

        stepTimer = 0;
      }
    }

    function play() {
      if (isPlaying) {
        return;
      }

      ensureAudio();

      if (audio == null) {
        trackValue.textContent = "no audio";
        return;
      }

      if (audio.state == "suspended") {
        audio.resume();
      }

      isPlaying = true;

      trackValue.textContent = "";
      trackValue.style.color = ui.ACCENT_COLOR;

      step();
    }

    function pause() {
      isPlaying = false;

      stopTimers();

      trackValue.textContent = "paused";
      trackValue.style.color = ui.WARN_COLOR;
    }

    function stop() {
      isPlaying = false;

      stopTimers();

      noteIndex = 0;

      paintPosition();

      trackValue.textContent = "stopped";
      trackValue.style.color = ui.MUTED_COLOR;
    }

    function onTrackChange(name) {
      var wasPlaying = isPlaying;

      stop();

      track = findTrack(name);

      paintList();
      paintPosition();

      if (wasPlaying) {
        play();
      }
    }

    function onWaveChange(name) {
      wave = name;
    }

    function onVolumeChange(amount) {
      volume = amount;

      if (master != null) {
        master.gain.value = volume / 100;
      }
    }

    function resize() {
      canvas.width = Math.max(stage.clientWidth - 20, 80);
      canvas.height = 120;
    }

    function teardown() {
      stopTimers();

      isPlaying = false;

      if (frameTimer != 0) {
        window.cancelAnimationFrame(frameTimer);

        frameTimer = 0;
      }

      if (audio != null) {
        audio.close();

        audio = null;
      }

      window.removeEventListener("resize", resize);
    }

    positionElement.style.color = ui.MUTED_COLOR;
    positionElement.style.fontSize = "11px";
    positionElement.style.margin = "8px 0px";

    listElement.style.display = "flex";
    listElement.style.flexDirection = "column";
    listElement.style.gap = "3px";

    canvas.style.width = "100%";
    canvas.style.imageRendering = "auto";

    toolbar.appendChild(ui.button("play", play));
    toolbar.appendChild(ui.button("pause", pause));
    toolbar.appendChild(ui.button("stop", stop));
    toolbar.appendChild(ui.select(trackNames(), track.name, onTrackChange));
    toolbar.appendChild(ui.select(WAVES, wave, onWaveChange));
    toolbar.appendChild(ui.spacer());
    toolbar.appendChild(ui.label("vol"));
    toolbar.appendChild(ui.range(0, 100, volume, onVolumeChange));
    toolbar.appendChild(trackValue);

    stage.appendChild(canvas);
    stage.appendChild(positionElement);
    stage.appendChild(listElement);

    aSheet.appendChild(toolbar);
    aSheet.appendChild(stage);

    paintList();
    paintPosition();

    setTimeout(resize, 0);

    window.addEventListener("resize", resize);

    frameTimer = window.requestAnimationFrame(drawSpectrum);

    return teardown;
  }

  window.makeApp("player", "chiptune player with visualiser", 520, 420, build, "audio");
})();
