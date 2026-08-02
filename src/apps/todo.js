(function () {
  var STORAGE_KEY = "noo-wari.todo";
  var FILTERS = ["all", "active", "done"];

  function loadTasks() {
    try {
      var raw = window.localStorage.getItem(STORAGE_KEY);

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

  function saveTasks(tasks) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));

      return true;
    } catch (error) {
      return false;
    }
  }

  function build(aSheet) {
    var ui = window.ui;

    var toolbar = ui.toolbar();
    var field = ui.toolbar();
    var stage = ui.stage();
    var input = ui.input("what needs doing?", add);

    var tasks = loadTasks();
    var filter = "all";

    var countValue = ui.value("0");

    function persist() {
      saveTasks(tasks);

      paint();
    }

    function add(text) {
      if (text.trim() == "") {
        return;
      }

      var aTask = new Object();

      aTask.text = text.trim();
      aTask.isDone = false;
      aTask.stamp = Date.now();

      tasks.unshift(aTask);

      input.value = "";

      persist();
    }

    function makeToggleHandler(aTask) {
      return function () {
        aTask.isDone = !aTask.isDone;

        persist();
      };
    }

    function makeRemoveHandler(aTask) {
      return function () {
        var index = tasks.indexOf(aTask);

        if (index != -1) {
          tasks.splice(index, 1);
        }

        persist();
      };
    }

    function makeRow(aTask) {
      var aRow = document.createElement("div");
      var rowStyle = aRow.style;

      var box = document.createElement("span");
      var textElement = document.createElement("span");
      var removeElement = document.createElement("span");

      box.textContent = aTask.isDone ? "☑" : "☐";
      box.style.marginRight = "10px";
      box.style.cursor = "pointer";
      box.style.userSelect = "none";
      box.style.fontSize = "15px";

      if (aTask.isDone) {
        box.style.color = ui.ACCENT_COLOR;
      } else {
        box.style.color = ui.MUTED_COLOR;
      }

      textElement.textContent = aTask.text;
      textElement.style.flexGrow = 1;
      textElement.style.fontSize = "13px";
      textElement.style.overflow = "hidden";
      textElement.style.textOverflow = "ellipsis";
      textElement.style.whiteSpace = "nowrap";

      if (aTask.isDone) {
        textElement.style.color = ui.MUTED_COLOR;
        textElement.style.textDecoration = "line-through";
      } else {
        textElement.style.color = ui.TEXT_COLOR;
      }

      removeElement.textContent = "✕";
      removeElement.style.marginLeft = "10px";
      removeElement.style.cursor = "pointer";
      removeElement.style.color = ui.MUTED_COLOR;
      removeElement.style.fontSize = "12px";

      rowStyle.display = "flex";
      rowStyle.alignItems = "center";
      rowStyle.padding = "8px 4px";
      rowStyle.borderBottomStyle = "solid";
      rowStyle.borderBottomWidth = "1px";
      rowStyle.borderBottomColor = ui.BORDER_COLOR;

      box.addEventListener("click", makeToggleHandler(aTask));
      textElement.addEventListener("click", makeToggleHandler(aTask));
      removeElement.addEventListener("click", makeRemoveHandler(aTask));

      aRow.appendChild(box);
      aRow.appendChild(textElement);
      aRow.appendChild(removeElement);

      return aRow;
    }

    function visibleTasks() {
      var found = [];

      for (var i = 0; i < tasks.length; i++) {
        if (filter == "all") {
          found.push(tasks[i]);
        } else if (filter == "active" && !tasks[i].isDone) {
          found.push(tasks[i]);
        } else if (filter == "done" && tasks[i].isDone) {
          found.push(tasks[i]);
        }
      }

      return found;
    }

    function paint() {
      ui.clear(stage);

      var visible = visibleTasks();

      if (visible.length == 0) {
        var empty = ui.label("nothing here");

        empty.style.display = "block";
        empty.style.padding = "12px 4px";

        stage.appendChild(empty);
      }

      for (var i = 0; i < visible.length; i++) {
        stage.appendChild(makeRow(visible[i]));
      }

      var active = 0;

      for (var j = 0; j < tasks.length; j++) {
        if (!tasks[j].isDone) {
          active = active + 1;
        }
      }

      countValue.textContent = active + " left";
    }

    function clearDone() {
      var kept = [];

      for (var i = 0; i < tasks.length; i++) {
        if (!tasks[i].isDone) {
          kept.push(tasks[i]);
        }
      }

      tasks = kept;

      persist();
    }

    function onFilterChange(name) {
      filter = name;

      paint();
    }

    field.style.borderBottomColor = ui.BORDER_COLOR;

    field.appendChild(input);
    field.appendChild(ui.button("add", function () {
      add(input.value);
    }));

    toolbar.appendChild(ui.select(FILTERS, filter, onFilterChange));
    toolbar.appendChild(ui.button("clear done", clearDone));
    toolbar.appendChild(ui.spacer());
    toolbar.appendChild(countValue);

    aSheet.appendChild(field);
    aSheet.appendChild(toolbar);
    aSheet.appendChild(stage);

    paint();

    return null;
  }

  window.makeApp("todo", "task list saved locally", 440, 460, build);
})();
