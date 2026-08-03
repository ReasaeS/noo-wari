(function () {
  var LIBRARY_NAME = "music";

  var AUDIO_TAILS = [
    ".mp3", ".ogg", ".oga", ".opus", ".wav", ".flac",
    ".m4a", ".aac", ".weba", ".webm"
  ];

  function endsWith(text, tail) {
    return text.length >= tail.length && text.substring(text.length - tail.length) == tail;
  }

  function isAudio(aNode) {
    if (aNode.kind != "file") {
      return false;
    }

    if (typeof aNode.type == "string" && aNode.type.indexOf("audio/") == 0) {
      return true;
    }

    var name = aNode.name.toLowerCase();

    for (var i = 0; i < AUDIO_TAILS.length; i++) {
      if (endsWith(name, AUDIO_TAILS[i])) {
        return true;
      }
    }

    return false;
  }

  function collect(host, trail, found) {
    for (var i = 0; i < host.children.length; i++) {
      var child = host.children[i];

      if (child.kind == "folder") {
        collect(child, trail.concat([child.name]), found);
      } else if (isAudio(child)) {
        found.push({ node: child, where: trail.join(" / ") });
      }
    }

    return found;
  }

  function formatBytes(amount) {
    if (amount < 1024) {
      return amount + " B";
    }

    if (amount < 1024 * 1024) {
      return Math.round((amount / 1024) * 10) / 10 + " KB";
    }

    return Math.round((amount / (1024 * 1024)) * 10) / 10 + " MB";
  }

  function formatClock(seconds) {
    if (typeof seconds != "number" || !isFinite(seconds) || seconds < 0) {
      return "0:00";
    }

    var whole = Math.floor(seconds);
    var minutes = Math.floor(whole / 60);

    return minutes + ":" + window.ui.pad(whole - minutes * 60, 2);
  }

  function build(aSheet) {
    var ui = window.ui;

    var toolbar = ui.toolbar();
    var stage = ui.stage();
    var canvas = ui.canvas();
    var context = canvas.getContext("2d");

    var element = document.createElement("audio");

    var tracks = [];
    var index = -1;
    var href = "";
    var volume = 80;
    var frameTimer = 0;
    var isScrubbing = false;

    var audio = null;
    var source = null;
    var analyser = null;
    var spectrum = null;

    var titleValue = ui.value("nothing loaded");
    var clockElement = document.createElement("div");
    var listElement = document.createElement("div");
    var seek = ui.range(0, 1000, 0, null);

    element.preload = "metadata";
    element.volume = volume / 100;

    function release() {
      if (href != "") {
        window.vault.release(href);

        href = "";
      }
    }

    function ensureGraph() {
      if (audio != null) {
        return;
      }

      var Context = window.AudioContext || window.webkitAudioContext;

      if (typeof Context == "undefined") {
        return;
      }

      try {
        audio = new Context();
        source = audio.createMediaElementSource(element);
        analyser = audio.createAnalyser();

        analyser.fftSize = 128;
        spectrum = new Uint8Array(analyser.frequencyBinCount);

        source.connect(analyser);
        analyser.connect(audio.destination);
      } catch (error) {
        audio = null;
        analyser = null;
      }
    }

    function paintClock() {
      var at = formatClock(element.currentTime);
      var whole = formatClock(element.duration);

      clockElement.textContent = at + " / " + whole;
    }

    function paintSeek() {
      if (isScrubbing) {
        return;
      }

      if (!isFinite(element.duration) || element.duration <= 0) {
        seek.value = 0;

        return;
      }

      seek.value = Math.round((element.currentTime / element.duration) * 1000);
    }

    function paintList() {
      ui.clear(listElement);

      if (tracks.length == 0) {
        var empty = ui.label(
          "no audio in the file system. drop mp3 files here or into the files app."
        );

        empty.style.display = "block";
        empty.style.padding = "8px";

        listElement.appendChild(empty);

        return;
      }

      for (var i = 0; i < tracks.length; i++) {
        listElement.appendChild(makeRow(tracks[i], i));
      }
    }

    function makeRow(entry, spot) {
      var aRow = document.createElement("div");
      var nameElement = document.createElement("span");
      var sizeElement = document.createElement("span");

      nameElement.textContent = entry.node.name;
      nameElement.style.overflow = "hidden";
      nameElement.style.textOverflow = "ellipsis";
      nameElement.style.whiteSpace = "nowrap";

      sizeElement.textContent = entry.where + "  ·  " + formatBytes(entry.node.size);
      sizeElement.style.marginLeft = "14px";
      sizeElement.style.flexShrink = 0;
      sizeElement.style.fontSize = "11px";
      sizeElement.style.color = ui.MUTED_COLOR;

      aRow.style.display = "flex";
      aRow.style.justifyContent = "space-between";
      aRow.style.alignItems = "center";
      aRow.style.padding = "6px 8px";
      aRow.style.borderRadius = "4px";
      aRow.style.fontSize = "12px";
      aRow.style.cursor = "pointer";

      if (spot == index) {
        aRow.style.backgroundColor = "var(--nw-active)";
        aRow.style.color = ui.ACCENT_COLOR;
      } else {
        aRow.style.color = ui.TEXT_COLOR;
      }

      function onPick() {
        start(spot);
      }

      aRow.addEventListener("click", onPick);

      aRow.appendChild(nameElement);
      aRow.appendChild(sizeElement);

      return aRow;
    }

    function scan() {
      var wanted = index == -1 ? null : tracks[index].node;

      tracks = collect(window.filesystem.home(), [], []);

      index = -1;

      for (var i = 0; i < tracks.length; i++) {
        if (tracks[i].node == wanted) {
          index = i;
        }
      }

      paintList();
    }

    function load(spot) {
      if (spot < 0 || spot >= tracks.length) {
        return Promise.resolve(false);
      }

      var aNode = tracks[spot].node;

      index = spot;

      titleValue.textContent = aNode.name;
      titleValue.style.color = ui.ACCENT_COLOR;

      paintList();

      return window.vault.url(aNode.blob, aNode.type).then(function (link) {
        if (link == "") {
          titleValue.textContent = "could not read " + aNode.name;
          titleValue.style.color = ui.DANGER_COLOR;

          return false;
        }

        if (index != spot) {
          window.vault.release(link);

          return false;
        }

        release();

        href = link;
        element.src = link;

        return true;
      });
    }

    function start(spot) {
      load(spot).then(function (isReady) {
        if (isReady) {
          play();
        }
      });
    }

    function play() {
      if (index == -1) {
        if (tracks.length == 0) {
          return;
        }

        start(0);

        return;
      }

      ensureGraph();

      if (audio != null && audio.state == "suspended") {
        audio.resume();
      }

      var pledge = element.play();

      if (pledge != null && typeof pledge.catch == "function") {
        pledge.catch(function () {
          titleValue.textContent = "this browser will not play that file";
          titleValue.style.color = ui.DANGER_COLOR;
        });
      }
    }

    function pause() {
      element.pause();
    }

    function toggle() {
      if (element.paused) {
        play();
      } else {
        pause();
      }
    }

    function step(amount) {
      if (tracks.length == 0) {
        return;
      }

      var spot = index + amount;

      if (spot < 0) {
        spot = tracks.length - 1;
      }

      if (spot >= tracks.length) {
        spot = 0;
      }

      start(spot);
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

    function onSeekDown() {
      isScrubbing = true;
    }

    function onSeekUp() {
      isScrubbing = false;

      if (!isFinite(element.duration) || element.duration <= 0) {
        return;
      }

      element.currentTime = (Number(seek.value) / 1000) * element.duration;
    }

    function onTimeUpdate() {
      paintClock();
      paintSeek();
    }

    function onEnded() {
      step(1);
    }

    function onError() {
      if (index == -1) {
        return;
      }

      titleValue.textContent = "cannot decode " + tracks[index].node.name;
      titleValue.style.color = ui.DANGER_COLOR;
    }

    function libraryFolder() {
      var home = window.filesystem.home();
      var found = window.filesystem.childNamed(home, LIBRARY_NAME);

      if (found != null && found.kind == "folder") {
        return found;
      }

      var made = window.filesystem.folder(LIBRARY_NAME);

      home.children.push(made);

      return made;
    }

    function hasFiles(event) {
      var carrier = event.dataTransfer;

      if (carrier == null || carrier.types == null) {
        return false;
      }

      for (var i = 0; i < carrier.types.length; i++) {
        if (carrier.types[i] == "Files") {
          return true;
        }
      }

      return false;
    }

    function onDragOver(event) {
      if (!hasFiles(event)) {
        return;
      }

      event.preventDefault();

      event.dataTransfer.dropEffect = "copy";

      stage.style.outlineStyle = "dashed";
      stage.style.outlineWidth = "2px";
      stage.style.outlineOffset = "-6px";
      stage.style.outlineColor = ui.ACCENT_COLOR;
    }

    function onDragLeave() {
      stage.style.outlineStyle = "none";
    }

    function onDrop(event) {
      if (!hasFiles(event)) {
        return;
      }

      event.preventDefault();

      stage.style.outlineStyle = "none";

      var dropped = event.dataTransfer.files;

      if (dropped == null || dropped.length == 0) {
        return;
      }

      window.filesystem.receive(libraryFolder(), dropped).then(function (landed) {
        if (landed.length == 0) {
          return;
        }

        window.filesystem.save();
      });
    }

    function onVolume(amount) {
      volume = amount;

      element.volume = volume / 100;
    }

    clockElement.textContent = "0:00 / 0:00";
    clockElement.style.fontSize = "11px";
    clockElement.style.color = ui.MUTED_COLOR;
    clockElement.style.marginTop = "6px";

    canvas.style.width = "100%";
    canvas.style.height = "120px";
    canvas.style.borderRadius = "4px";

    seek.style.width = "100%";
    seek.style.marginTop = "10px";

    listElement.style.marginTop = "12px";

    element.addEventListener("timeupdate", onTimeUpdate);
    element.addEventListener("loadedmetadata", onTimeUpdate);
    element.addEventListener("ended", onEnded);
    element.addEventListener("error", onError);

    seek.addEventListener("mousedown", onSeekDown);
    seek.addEventListener("mouseup", onSeekUp);
    seek.addEventListener("change", onSeekUp);

    stage.addEventListener("dragover", onDragOver);
    stage.addEventListener("dragleave", onDragLeave);
    stage.addEventListener("drop", onDrop);

    toolbar.appendChild(ui.button("play", play));
    toolbar.appendChild(ui.button("pause", pause));
    toolbar.appendChild(ui.button("prev", function () {
      step(-1);
    }));
    toolbar.appendChild(ui.button("next", function () {
      step(1);
    }));
    toolbar.appendChild(ui.label("volume"));
    toolbar.appendChild(ui.range(0, 100, volume, onVolume));
    toolbar.appendChild(ui.spacer());
    toolbar.appendChild(titleValue);

    stage.appendChild(canvas);
    stage.appendChild(seek);
    stage.appendChild(clockElement);
    stage.appendChild(listElement);

    aSheet.appendChild(toolbar);
    aSheet.appendChild(stage);

    aSheet.tabIndex = 0;
    aSheet.style.outlineStyle = "none";

    function onKeyDown(event) {
      if (event.key == " ") {
        event.preventDefault();
        toggle();
      }
    }

    aSheet.addEventListener("keydown", onKeyDown);

    scan();

    window.filesystem.watch(scan);

    frameTimer = window.requestAnimationFrame(drawSpectrum);

    function teardown() {
      window.filesystem.unwatch(scan);

      element.pause();
      element.removeAttribute("src");
      element.load();

      release();

      if (frameTimer != 0) {
        window.cancelAnimationFrame(frameTimer);

        frameTimer = 0;
      }

      if (audio != null && typeof audio.close == "function") {
        audio.close();

        audio = null;
      }
    }

    return teardown;
  }

  window.makeApp("player", "play audio files from the file system", 560, 460, build, "audio");
})();
