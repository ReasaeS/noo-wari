(function () {
  var CATEGORIES = [
    {
      name: "length",
      units: [
        { name: "millimetre", factor: 0.001 },
        { name: "centimetre", factor: 0.01 },
        { name: "metre", factor: 1 },
        { name: "kilometre", factor: 1000 },
        { name: "inch", factor: 0.0254 },
        { name: "foot", factor: 0.3048 },
        { name: "yard", factor: 0.9144 },
        { name: "mile", factor: 1609.344 },
        { name: "nautical mile", factor: 1852 }
      ]
    },
    {
      name: "mass",
      units: [
        { name: "gram", factor: 0.001 },
        { name: "kilogram", factor: 1 },
        { name: "tonne", factor: 1000 },
        { name: "ounce", factor: 0.0283495 },
        { name: "pound", factor: 0.453592 },
        { name: "stone", factor: 6.35029 }
      ]
    },
    {
      name: "data",
      units: [
        { name: "bit", factor: 0.125 },
        { name: "byte", factor: 1 },
        { name: "kilobyte", factor: 1024 },
        { name: "megabyte", factor: 1048576 },
        { name: "gigabyte", factor: 1073741824 },
        { name: "terabyte", factor: 1099511627776 }
      ]
    },
    {
      name: "time",
      units: [
        { name: "millisecond", factor: 0.001 },
        { name: "second", factor: 1 },
        { name: "minute", factor: 60 },
        { name: "hour", factor: 3600 },
        { name: "day", factor: 86400 },
        { name: "week", factor: 604800 },
        { name: "year", factor: 31557600 }
      ]
    },
    {
      name: "speed",
      units: [
        { name: "metre / second", factor: 1 },
        { name: "kilometre / hour", factor: 0.277778 },
        { name: "mile / hour", factor: 0.44704 },
        { name: "knot", factor: 0.514444 },
        { name: "foot / second", factor: 0.3048 }
      ]
    },
    {
      name: "temperature",
      units: [
        { name: "celsius", factor: 1 },
        { name: "fahrenheit", factor: 1 },
        { name: "kelvin", factor: 1 }
      ]
    }
  ];

  function categoryNames() {
    var names = [];

    for (var i = 0; i < CATEGORIES.length; i++) {
      names.push(CATEGORIES[i].name);
    }

    return names;
  }

  function findCategory(name) {
    for (var i = 0; i < CATEGORIES.length; i++) {
      if (CATEGORIES[i].name == name) {
        return CATEGORIES[i];
      }
    }

    return CATEGORIES[0];
  }

  function unitNames(category) {
    var names = [];

    for (var i = 0; i < category.units.length; i++) {
      names.push(category.units[i].name);
    }

    return names;
  }

  function findUnit(category, name) {
    for (var i = 0; i < category.units.length; i++) {
      if (category.units[i].name == name) {
        return category.units[i];
      }
    }

    return category.units[0];
  }

  function toCelsius(amount, name) {
    if (name == "fahrenheit") {
      return (amount - 32) / 1.8;
    }

    if (name == "kelvin") {
      return amount - 273.15;
    }

    return amount;
  }

  function fromCelsius(amount, name) {
    if (name == "fahrenheit") {
      return amount * 1.8 + 32;
    }

    if (name == "kelvin") {
      return amount + 273.15;
    }

    return amount;
  }

  function build(aSheet) {
    var ui = window.ui;

    var toolbar = ui.toolbar();
    var stage = ui.stage();
    var listElement = document.createElement("div");
    var input = ui.input("1", null);

    var category = CATEGORIES[0];
    var source = category.units[2];

    var sourceSelect = null;

    function convert(amount, fromUnit, toUnit) {
      if (category.name == "temperature") {
        return fromCelsius(toCelsius(amount, fromUnit.name), toUnit.name);
      }

      return (amount * fromUnit.factor) / toUnit.factor;
    }

    function format(amount) {
      if (!isFinite(amount)) {
        return "—";
      }

      if (Math.abs(amount) >= 1e9 || (Math.abs(amount) < 1e-4 && amount != 0)) {
        return amount.toExponential(4);
      }

      return "" + Math.round(amount * 1e6) / 1e6;
    }

    function paint() {
      ui.clear(listElement);

      var amount = Number(input.value);

      if (isNaN(amount)) {
        amount = 0;
      }

      for (var i = 0; i < category.units.length; i++) {
        var unit = category.units[i];
        var aRow = document.createElement("div");
        var rowStyle = aRow.style;

        var nameElement = document.createElement("span");
        var valueElement = document.createElement("span");

        nameElement.textContent = unit.name;
        nameElement.style.color = ui.MUTED_COLOR;
        nameElement.style.fontSize = "12px";

        valueElement.textContent = format(convert(amount, source, unit));
        valueElement.style.fontSize = "13px";

        if (unit == source) {
          valueElement.style.color = ui.ACCENT_COLOR;
        } else {
          valueElement.style.color = ui.TEXT_COLOR;
        }

        rowStyle.display = "flex";
        rowStyle.justifyContent = "space-between";
        rowStyle.padding = "7px 2px";
        rowStyle.borderBottomStyle = "solid";
        rowStyle.borderBottomWidth = "1px";
        rowStyle.borderBottomColor = ui.BORDER_COLOR;

        aRow.appendChild(nameElement);
        aRow.appendChild(valueElement);

        listElement.appendChild(aRow);
      }
    }

    function rebuildUnits() {
      if (sourceSelect != null) {
        toolbar.removeChild(sourceSelect);
      }

      sourceSelect = ui.select(unitNames(category), source.name, onUnitChange);

      toolbar.insertBefore(sourceSelect, toolbar.childNodes[1]);
    }

    function onCategoryChange(name) {
      category = findCategory(name);
      source = category.units[0];

      rebuildUnits();
      paint();
    }

    function onUnitChange(name) {
      source = findUnit(category, name);

      paint();
    }

    input.value = "1";
    input.style.maxWidth = "120px";
    input.addEventListener("input", paint);

    toolbar.appendChild(ui.select(categoryNames(), category.name, onCategoryChange));
    toolbar.appendChild(input);

    aSheet.appendChild(toolbar);
    aSheet.appendChild(stage);

    stage.appendChild(listElement);

    rebuildUnits();
    paint();

    return null;
  }

  window.makeApp("convert", "units, data sizes and temperature", 440, 420, build, "tools");
})();
