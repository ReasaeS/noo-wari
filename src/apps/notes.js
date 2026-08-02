(function () {
  var STORAGE_KEY = "noo-wari.notes";

  function loadNotes() {
    try {
      var raw = window.storage.get(STORAGE_KEY);

      if (raw == null) {
        return [];
      }

      var parsed = JSON.parse(raw);

      if (parsed instanceof Array) {
        return parsed;
      }

      return [];
    } catch (error) {
      return [];
    }
  }

  function saveNotes(notes) {
    try {
      window.storage.set(STORAGE_KEY, JSON.stringify(notes));

      return true;
    } catch (error) {
      return false;
    }
  }

  function build(aSheet) {
    var ui = window.ui;

    var toolbar = ui.toolbar();
    var body = document.createElement("div");
    var listElement = document.createElement("div");
    var editor = document.createElement("textarea");

    var notes = loadNotes();
    var activeIndex = -1;

    var statusValue = ui.value("");

    function paintList() {
      ui.clear(listElement);

      if (notes.length == 0) {
        var empty = ui.label("no notes yet");

        empty.style.padding = "8px";

        listElement.appendChild(empty);

        return;
      }

      for (var i = 0; i < notes.length; i++) {
        listElement.appendChild(makeRow(notes[i], i));
      }
    }

    function makeRow(aNote, index) {
      var aRow = document.createElement("div");
      var rowStyle = aRow.style;

      var title = aNote.title;

      if (title == "") {
        title = "untitled";
      }

      aRow.textContent = title;

      rowStyle.padding = "6px 8px";
      rowStyle.fontSize = "12px";
      rowStyle.borderRadius = "4px";
      rowStyle.cursor = "pointer";
      rowStyle.overflow = "hidden";
      rowStyle.textOverflow = "ellipsis";
      rowStyle.whiteSpace = "nowrap";

      if (index == activeIndex) {
        rowStyle.backgroundColor = "var(--nw-active)";
        rowStyle.color = ui.ACCENT_COLOR;
      } else {
        rowStyle.color = ui.TEXT_COLOR;
      }

      aRow.addEventListener("click", makeSelectHandler(index));

      return aRow;
    }

    function makeSelectHandler(index) {
      return function () {
        select(index);
      };
    }

    function select(index) {
      commit();

      activeIndex = index;

      editor.value = notes[index].body;

      paintList();

      statusValue.textContent = "editing";
      statusValue.style.color = ui.ACCENT_COLOR;
    }

    function titleFrom(text) {
      var line = text.split("\n")[0];

      if (line.length > 34) {
        line = line.substring(0, 34);
      }

      return line.trim();
    }

    function commit() {
      if (activeIndex == -1) {
        return;
      }

      notes[activeIndex].body = editor.value;
      notes[activeIndex].title = titleFrom(editor.value);
      notes[activeIndex].stamp = Date.now();
    }

    function persist() {
      commit();

      if (saveNotes(notes)) {
        statusValue.textContent = "saved";
        statusValue.style.color = ui.ACCENT_COLOR;
      } else {
        statusValue.textContent = "save failed";
        statusValue.style.color = ui.DANGER_COLOR;
      }

      paintList();
    }

    function create() {
      commit();

      var aNote = new Object();

      aNote.title = "";
      aNote.body = "";
      aNote.stamp = Date.now();

      notes.push(aNote);

      activeIndex = notes.length - 1;

      editor.value = "";

      paintList();
      persist();

      editor.focus();
    }

    function remove() {
      if (activeIndex == -1) {
        return;
      }

      notes.splice(activeIndex, 1);

      activeIndex = -1;

      editor.value = "";

      persist();
    }

    function onEditorInput() {
      statusValue.textContent = "unsaved";
      statusValue.style.color = ui.WARN_COLOR;
    }

    function onEditorKeyDown(event) {
      if (event.ctrlKey && event.key == "s") {
        event.preventDefault();

        persist();
      }
    }

    body.style.display = "flex";
    body.style.flexGrow = 1;
    body.style.minHeight = 0;

    listElement.style.width = "180px";
    listElement.style.flexShrink = 0;
    listElement.style.overflowY = "auto";
    listElement.style.padding = "6px";
    listElement.style.boxSizing = "border-box";
    listElement.style.backgroundColor = ui.PANEL_COLOR;
    listElement.style.borderRightStyle = "solid";
    listElement.style.borderRightWidth = "1px";
    listElement.style.borderRightColor = ui.BORDER_COLOR;

    editor.style.flexGrow = 1;
    editor.style.padding = "10px";
    editor.style.boxSizing = "border-box";
    editor.style.backgroundColor = "var(--nw-deep)";
    editor.style.borderStyle = "none";
    editor.style.outlineStyle = "none";
    editor.style.resize = "none";
    editor.style.color = ui.TEXT_COLOR;
    editor.style.fontFamily = ui.FONT_FAMILY;
    editor.style.fontSize = "13px";
    editor.style.lineHeight = "1.6";
    editor.spellcheck = false;

    editor.addEventListener("input", onEditorInput);
    editor.addEventListener("keydown", onEditorKeyDown);

    toolbar.appendChild(ui.button("new", create));
    toolbar.appendChild(ui.button("save", persist));
    toolbar.appendChild(ui.button("delete", remove));
    toolbar.appendChild(ui.spacer());
    toolbar.appendChild(ui.label("ctrl+s"));
    toolbar.appendChild(statusValue);

    body.appendChild(listElement);
    body.appendChild(editor);

    aSheet.appendChild(toolbar);
    aSheet.appendChild(body);

    paintList();

    if (notes.length > 0) {
      select(0);
    }

    return persist;
  }

  window.makeApp("notes", "notepad with local storage", 620, 420, build, "tools");
})();
