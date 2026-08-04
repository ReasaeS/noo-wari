(function () {
  var LIBRARY_NAME = "music";
  var LOOP_LABELS = ["loop: off", "loop: on"];
  var COVER_SIZE = 44;

  var live = null;

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
    var isLooping = true;
    var isHeld = false;
    var isArmed = false;
    var themeSong = null;
    var announced = null;
    var ticket = 0;

    var audio = null;
    var source = null;
    var analyser = null;
    var spectrum = null;

    var titleValue = ui.value("nothing loaded");
    var clockElement = document.createElement("div");
    var listElement = document.createElement("div");
    var seek = ui.range(0, 1000, 0, null);
    var loopButton = ui.button(LOOP_LABELS[1], null);

    element.preload = "metadata";
    element.volume = volume / 100;
    element.loop = isLooping;

    function release() {
      if (href != "" && !isHeld) {
        window.vault.release(href);
      }

      href = "";
      isHeld = false;
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

      nameElement.textContent = entry.title;
      nameElement.style.minWidth = "0px";
      nameElement.style.overflow = "hidden";
      nameElement.style.textOverflow = "ellipsis";
      nameElement.style.whiteSpace = "nowrap";

      sizeElement.textContent = entry.artist + "  ·  " + entry.note;
      sizeElement.style.marginLeft = "14px";
      sizeElement.style.minWidth = "0px";
      sizeElement.style.overflow = "hidden";
      sizeElement.style.textOverflow = "ellipsis";
      sizeElement.style.whiteSpace = "nowrap";
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

    function makeFileEntry(aNode, where) {
      var anEntry = new Object();

      anEntry.kind = "file";
      anEntry.node = aNode;
      anEntry.title = aNode.name;
      anEntry.artist = where == "" ? "home" : where;
      anEntry.note = formatBytes(aNode.size);

      anEntry.source = function () {
        return window.vault.url(aNode.blob, aNode.type);
      };

      anEntry.art = function (size) {
        return window.songs.emblem(size);
      };

      return anEntry;
    }

    function makeSongEntry(aSong) {
      var anEntry = new Object();

      anEntry.kind = "song";
      anEntry.key = aSong.key;
      anEntry.title = aSong.title;
      anEntry.artist = aSong.artist;
      anEntry.note = "theme song";

      anEntry.source = function () {
        return window.songs.url(aSong.key);
      };

      anEntry.art = function (size) {
        return window.songs.cover(aSong.key, size);
      };

      return anEntry;
    }

    function spotOf(anEntry) {
      if (anEntry == null) {
        return -1;
      }

      for (var i = 0; i < tracks.length; i++) {
        if (anEntry.kind == "song" && tracks[i].kind == "song" && tracks[i].key == anEntry.key) {
          return i;
        }

        if (anEntry.kind == "file" && tracks[i].node == anEntry.node) {
          return i;
        }
      }

      return -1;
    }

    function scan() {
      var wanted = index == -1 ? null : tracks[index];
      var found = [];

      if (themeSong != null) {
        found.push(makeSongEntry(themeSong));
      }

      var files = collect(window.filesystem.home(), [], []);

      for (var i = 0; i < files.length; i++) {
        found.push(makeFileEntry(files[i].node, files[i].where));
      }

      tracks = found;
      index = spotOf(wanted);

      paintList();
    }

    function load(spot) {
      if (spot < 0 || spot >= tracks.length) {
        return Promise.resolve(false);
      }

      var anEntry = tracks[spot];

      ticket = ticket + 1;

      var mine = ticket;

      index = spot;

      titleValue.textContent = anEntry.title;
      titleValue.style.color = ui.ACCENT_COLOR;

      paintList();

      return anEntry.source().then(function (link) {
        if (mine != ticket) {
          if (anEntry.kind != "song" && link != "") {
            window.vault.release(link);
          }

          return false;
        }

        if (link == "") {
          titleValue.textContent = "could not read " + anEntry.title;
          titleValue.style.color = ui.DANGER_COLOR;

          return false;
        }

        if (href == link) {
          return true;
        }

        release();

        href = link;
        isHeld = anEntry.kind == "song";
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
        pledge.catch(function (error) {
          if (error != null && error.name == "NotAllowedError") {
            arm();

            return;
          }

          if (error != null && error.name == "AbortError") {
            return;
          }

          titleValue.textContent = "this browser will not play that file";
          titleValue.style.color = ui.DANGER_COLOR;
        });
      }
    }

    function onGesture() {
      disarm();

      play();
    }

    function arm() {
      if (isArmed) {
        return;
      }

      isArmed = true;

      document.addEventListener("pointerdown", onGesture, true);
      document.addEventListener("keydown", onGesture, true);
    }

    function disarm() {
      if (!isArmed) {
        return;
      }

      isArmed = false;

      document.removeEventListener("pointerdown", onGesture, true);
      document.removeEventListener("keydown", onGesture, true);
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

    function paintBackdrop() {
      context.fillStyle = "#262a31";
      context.fillRect(0, 0, canvas.width, canvas.height);
    }

    function onScreen() {
      return aSheet.offsetParent != null;
    }

    function pump() {
      if (frameTimer != 0) {
        return;
      }

      frameTimer = window.requestAnimationFrame(drawSpectrum);
    }

    function drawSpectrum() {
      frameTimer = 0;

      if (!onScreen()) {
        if (!element.paused) {
          pump();
        }

        return;
      }

      var width = canvas.width;
      var height = canvas.height;

      paintBackdrop();

      if (element.paused) {
        return;
      }

      if (analyser != null) {
        analyser.getByteFrequencyData(spectrum);

        var bars = spectrum.length;
        var barWidth = width / bars;

        for (var i = 0; i < bars; i++) {
          var amount = spectrum[i] / 255;
          var barHeight = amount * height;

          context.fillStyle = "hsl(" + Math.round(145 + amount * 90) + ", 45%, 62%)";
          context.fillRect(i * barWidth, height - barHeight, barWidth - 1, barHeight);
        }
      }

      pump();
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

    function onPlaying() {
      if (index == -1) {
        return;
      }

      var anEntry = tracks[index];

      titleValue.textContent = anEntry.title;
      titleValue.style.color = ui.ACCENT_COLOR;

      if (anEntry == announced) {
        return;
      }

      announced = anEntry;

      window.notices.show(anEntry.art(COVER_SIZE), anEntry.title, anEntry.artist);
    }

    function onPause() {
      announced = null;

      paintBackdrop();
    }

    function onLoop() {
      isLooping = !isLooping;

      element.loop = isLooping;
      loopButton.textContent = LOOP_LABELS[isLooping ? 1 : 0];
    }

    function onTheme(name) {
      var found = window.songs.forTheme(name == "" ? window.theme.current() : name);

      if (found == null) {
        return;
      }

      if (themeSong != null && themeSong.key == found.key) {
        return;
      }

      var wasSong = index != -1 && tracks[index].kind == "song";
      var wasPlaying = !element.paused;

      themeSong = found;

      scan();

      if (!wasSong) {
        return;
      }

      if (wasPlaying) {
        start(0);
      } else {
        load(0);
      }
    }

    function onError() {
      if (index == -1) {
        return;
      }

      titleValue.textContent = "cannot decode " + tracks[index].title;
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

    toolbar.style.flexWrap = "wrap";

    titleValue.style.flexShrink = 1;
    titleValue.style.minWidth = "0px";
    titleValue.style.overflow = "hidden";
    titleValue.style.textOverflow = "ellipsis";
    titleValue.style.whiteSpace = "nowrap";

    clockElement.textContent = "0:00 / 0:00";
    clockElement.style.fontSize = "11px";
    clockElement.style.color = ui.MUTED_COLOR;
    clockElement.style.marginTop = "6px";

    canvas.style.width = "100%";
    canvas.style.height = "120px";
    canvas.style.borderRadius = "4px";

    seek.style.width = "100%";
    seek.style.boxSizing = "border-box";
    seek.style.margin = "10px 0px 0px 0px";

    listElement.style.marginTop = "12px";

    element.addEventListener("timeupdate", onTimeUpdate);
    element.addEventListener("loadedmetadata", onTimeUpdate);
    element.addEventListener("ended", onEnded);
    element.addEventListener("playing", onPlaying);
    element.addEventListener("playing", pump);
    element.addEventListener("pause", onPause);
    element.addEventListener("error", onError);

    loopButton.addEventListener("click", onLoop);

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
    toolbar.appendChild(loopButton);
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

    function adopt() {
      var found = window.songs.forTheme(window.theme.current());

      if (found == null || (themeSong != null && themeSong.key == found.key)) {
        return themeSong != null;
      }

      themeSong = found;

      scan();

      return true;
    }

    scan();

    window.songs.ready().then(adopt);

    window.filesystem.watch(scan);
    window.themes.watch(onTheme);

    paintBackdrop();

    function begin() {
      return window.songs.ready().then(function () {
        if (!adopt()) {
          return false;
        }

        start(0);

        return true;
      });
    }

    function teardown() {
      window.filesystem.unwatch(scan);
      window.themes.unwatch(onTheme);

      disarm();

      element.pause();
      element.removeAttribute("src");
      element.load();

      release();

      live = null;

      if (frameTimer != 0) {
        window.cancelAnimationFrame(frameTimer);

        frameTimer = 0;
      }

      if (audio != null && typeof audio.close == "function") {
        audio.close();

        audio = null;
      }
    }

    live = { begin: begin };

    return teardown;
  }

  var player = window.makeApp("player", "play audio files from the file system", 560, 460, build, "audio");

  function autostart() {
    return window.songs.ready().then(function () {
      if (window.songs.forTheme(window.theme.current()) == null) {
        return false;
      }

      if (!player.isOpen()) {
        player.open().minimize();
      }

      if (live == null) {
        return false;
      }

      return live.begin();
    });
  }

  window.addEventListener("load", autostart);
})();
