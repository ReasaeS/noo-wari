(function () {
  var WHITE_STEPS = [0, 2, 4, 5, 7, 9, 11];
  var BLACK_KEYS = [
    { after: 0, step: 1 },
    { after: 1, step: 3 },
    { after: 3, step: 6 },
    { after: 4, step: 8 },
    { after: 5, step: 10 }
  ];
  var WAVES = ["sine", "triangle", "square", "sawtooth"];
  var OCTAVES = 2;
  var BASE_OCTAVE = 4;

  var KEY_MAP = {
    a: 0, w: 1, s: 2, e: 3, d: 4, f: 5, t: 6,
    g: 7, y: 8, h: 9, u: 10, j: 11, k: 12,
    o: 13, l: 14, p: 15, ";": 16
  };

  function frequencyOf(semitone) {
    return 440 * Math.pow(2, (semitone - 9 + (BASE_OCTAVE - 4) * 12) / 12);
  }

  function build(aSheet) {
    var ui = window.ui;

    var toolbar = ui.toolbar();
    var stage = ui.center();
    var keyboard = document.createElement("div");

    var wave = WAVES[0];
    var volume = 25;
    var held = new Object();

    var audio = null;
    var master = null;

    var noteValue = ui.value("—");

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

      master.gain.value = volume / 100;
      master.connect(audio.destination);
    }

    function startNote(semitone) {
      if (typeof held[semitone] != "undefined") {
        return;
      }

      ensureAudio();

      if (audio == null) {
        return;
      }

      if (audio.state == "suspended") {
        audio.resume();
      }

      var oscillator = audio.createOscillator();
      var envelope = audio.createGain();
      var now = audio.currentTime;

      oscillator.type = wave;
      oscillator.frequency.value = frequencyOf(semitone);

      envelope.gain.setValueAtTime(0, now);
      envelope.gain.linearRampToValueAtTime(0.5, now + 0.02);

      oscillator.connect(envelope);
      envelope.connect(master);

      oscillator.start(now);

      held[semitone] = { oscillator: oscillator, envelope: envelope };

      noteValue.textContent = nameOf(semitone);

      paintKeys();
    }

    function stopNote(semitone) {
      var voice = held[semitone];

      if (typeof voice == "undefined") {
        return;
      }

      var now = audio.currentTime;

      voice.envelope.gain.cancelScheduledValues(now);
      voice.envelope.gain.setValueAtTime(voice.envelope.gain.value, now);
      voice.envelope.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      voice.oscillator.stop(now + 0.2);

      delete held[semitone];

      paintKeys();
    }

    function nameOf(semitone) {
      var names = ["c", "c#", "d", "d#", "e", "f", "f#", "g", "g#", "a", "a#", "b"];
      var octave = BASE_OCTAVE + Math.floor(semitone / 12);

      return names[semitone % 12] + octave;
    }

    function isHeld(semitone) {
      return typeof held[semitone] != "undefined";
    }

    function makeWhiteKey(semitone, index) {
      var aKey = document.createElement("div");
      var keyStyle = aKey.style;

      keyStyle.position = "absolute";
      keyStyle.left = index * 40 + "px";
      keyStyle.top = "0px";
      keyStyle.width = "38px";
      keyStyle.height = "150px";
      keyStyle.borderRadius = "0px 0px 4px 4px";
      keyStyle.boxSizing = "border-box";
      keyStyle.borderStyle = "solid";
      keyStyle.borderWidth = "1px";
      keyStyle.borderColor = "#1b2029";
      keyStyle.cursor = "pointer";
      keyStyle.display = "flex";
      keyStyle.alignItems = "flex-end";
      keyStyle.justifyContent = "center";
      keyStyle.paddingBottom = "6px";
      keyStyle.fontSize = "10px";
      keyStyle.color = "#7c848f";
      keyStyle.userSelect = "none";

      aKey.textContent = nameOf(semitone);
      aKey.semitone = semitone;
      aKey.isBlack = false;

      bindKey(aKey, semitone);

      return aKey;
    }

    function makeBlackKey(semitone, index) {
      var aKey = document.createElement("div");
      var keyStyle = aKey.style;

      keyStyle.position = "absolute";
      keyStyle.left = index * 40 + 27 + "px";
      keyStyle.top = "0px";
      keyStyle.width = "24px";
      keyStyle.height = "94px";
      keyStyle.borderRadius = "0px 0px 3px 3px";
      keyStyle.boxSizing = "border-box";
      keyStyle.cursor = "pointer";
      keyStyle.zIndex = 2;
      keyStyle.userSelect = "none";

      aKey.semitone = semitone;
      aKey.isBlack = true;

      bindKey(aKey, semitone);

      return aKey;
    }

    function bindKey(aKey, semitone) {
      aKey.addEventListener("mousedown", function (event) {
        event.preventDefault();

        startNote(semitone);
      });

      aKey.addEventListener("mouseup", function () {
        stopNote(semitone);
      });

      aKey.addEventListener("mouseleave", function () {
        stopNote(semitone);
      });
    }

    function paintKeys() {
      for (var i = 0; i < keyboard.childNodes.length; i++) {
        var aKey = keyboard.childNodes[i];
        var keyStyle = aKey.style;

        if (aKey.isBlack) {
          if (isHeld(aKey.semitone)) {
            keyStyle.backgroundColor = "#5a8f66";
          } else {
            keyStyle.backgroundColor = "#1b2029";
          }
        } else {
          if (isHeld(aKey.semitone)) {
            keyStyle.backgroundColor = "#7fd18b";
          } else {
            keyStyle.backgroundColor = "#c5cad3";
          }
        }
      }
    }

    function buildKeyboard() {
      ui.clear(keyboard);

      var whiteIndex = 0;

      for (var octave = 0; octave < OCTAVES; octave++) {
        for (var i = 0; i < WHITE_STEPS.length; i++) {
          keyboard.appendChild(
            makeWhiteKey(octave * 12 + WHITE_STEPS[i], whiteIndex)
          );

          whiteIndex = whiteIndex + 1;
        }
      }

      for (var o = 0; o < OCTAVES; o++) {
        for (var j = 0; j < BLACK_KEYS.length; j++) {
          keyboard.appendChild(
            makeBlackKey(
              o * 12 + BLACK_KEYS[j].step,
              o * WHITE_STEPS.length + BLACK_KEYS[j].after
            )
          );
        }
      }

      keyboard.style.width = whiteIndex * 40 + "px";

      paintKeys();
    }

    function onKeyDown(event) {
      if (event.repeat) {
        return;
      }

      var semitone = KEY_MAP[event.key];

      if (typeof semitone == "undefined") {
        return;
      }

      event.preventDefault();

      startNote(semitone);
    }

    function onKeyUp(event) {
      var semitone = KEY_MAP[event.key];

      if (typeof semitone == "undefined") {
        return;
      }

      stopNote(semitone);
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

    function teardown() {
      for (var semitone in held) {
        stopNote(semitone);
      }

      if (audio != null) {
        audio.close();

        audio = null;
      }
    }

    keyboard.style.position = "relative";
    keyboard.style.height = "150px";

    toolbar.appendChild(ui.select(WAVES, wave, onWaveChange));
    toolbar.appendChild(ui.label("vol"));
    toolbar.appendChild(ui.range(0, 100, volume, onVolumeChange));
    toolbar.appendChild(ui.spacer());
    toolbar.appendChild(ui.label("keys a-k / w-u"));
    toolbar.appendChild(noteValue);

    stage.appendChild(keyboard);

    aSheet.appendChild(toolbar);
    aSheet.appendChild(stage);

    aSheet.tabIndex = 0;
    aSheet.style.outlineStyle = "none";
    aSheet.addEventListener("keydown", onKeyDown);
    aSheet.addEventListener("keyup", onKeyUp);

    buildKeyboard();

    setTimeout(function () {
      aSheet.focus();
    }, 0);

    return teardown;
  }

  window.makeApp("piano", "playable synth keyboard", 640, 300, build, "audio");
})();
