(function () {
  var PROFILE = {
    name: "Marco Gomez",
    alias: "Reasae Storm",
    role: "author of noo-wari",
    location: "England, United Kingdom",
    blurb:
      "noo-wari is a desktop shell that runs in the browser. windows, desktops, " +
      "a command palette, a file system in local storage and a pile of small apps. "
  };

  var CONTACT = [
    { label: "email", value: "reasae.nostos@proton.me", href: "mailto:reasae.nostos@proton.me" },
    { label: "github", value: "github.com/ReasaeS", href: "https://github.com/ReasaeS" }
  ];

  function makeHeading(text) {
    var aHeading = document.createElement("div");

    aHeading.textContent = text;

    aHeading.style.marginTop = "16px";
    aHeading.style.marginBottom = "6px";
    aHeading.style.fontSize = "10px";
    aHeading.style.letterSpacing = "1px";
    aHeading.style.textTransform = "uppercase";
    aHeading.style.color = window.ui.MUTED_COLOR;

    return aHeading;
  }

  function makeHeader() {
    var aHeader = document.createElement("div");
    var aColumn = document.createElement("div");
    var aName = document.createElement("div");
    var anAlias = document.createElement("div");
    var aRole = document.createElement("div");
    var aPlace = document.createElement("div");

    aHeader.style.display = "flex";
    aHeader.style.alignItems = "center";
    aHeader.style.gap = "14px";
    aHeader.style.paddingBottom = "14px";
    aHeader.style.borderBottomStyle = "solid";
    aHeader.style.borderBottomWidth = "1px";
    aHeader.style.borderBottomColor = window.ui.BORDER_COLOR;

    aColumn.style.minWidth = 0;

    aName.textContent = PROFILE.name;
    aName.style.fontSize = "18px";
    aName.style.color = window.ui.TEXT_COLOR;

    anAlias.textContent = PROFILE.alias;
    anAlias.style.fontSize = "11px";
    anAlias.style.color = window.ui.MUTED_COLOR;

    aRole.textContent = PROFILE.role;
    aRole.style.fontSize = "12px";
    aRole.style.marginTop = "3px";
    aRole.style.color = window.ui.ACCENT_COLOR;

    aPlace.textContent = PROFILE.location;
    aPlace.style.fontSize = "11px";
    aPlace.style.marginTop = "3px";
    aPlace.style.color = window.ui.MUTED_COLOR;

    aColumn.appendChild(aName);
    aColumn.appendChild(anAlias);
    aColumn.appendChild(aRole);
    aColumn.appendChild(aPlace);

    aHeader.appendChild(window.logo.mark(56));
    aHeader.appendChild(aColumn);

    return aHeader;
  }

  function makeBlurb() {
    var aBlurb = document.createElement("div");

    aBlurb.textContent = PROFILE.blurb;

    aBlurb.style.fontSize = "12px";
    aBlurb.style.lineHeight = "1.7";
    aBlurb.style.whiteSpace = "pre-wrap";
    aBlurb.style.color = window.ui.TEXT_COLOR;

    return aBlurb;
  }

  function makeValueElement(entry) {
    if (entry.href == "") {
      var aText = document.createElement("span");

      aText.textContent = entry.value;
      aText.style.color = window.ui.MUTED_COLOR;

      return aText;
    }

    var aLink = document.createElement("a");

    aLink.textContent = entry.value;
    aLink.href = entry.href;
    aLink.style.color = window.ui.ACCENT_COLOR;
    aLink.style.textDecoration = "none";

    if (entry.href.indexOf("mailto:") != 0) {
      aLink.target = "_blank";
      aLink.rel = "noopener noreferrer";
    }

    function onEnter() {
      aLink.style.textDecoration = "underline";
    }

    function onLeave() {
      aLink.style.textDecoration = "none";
    }

    aLink.addEventListener("mouseenter", onEnter);
    aLink.addEventListener("mouseleave", onLeave);

    return aLink;
  }

  function makeContactRow(entry) {
    var aRow = document.createElement("div");
    var aLabel = document.createElement("span");

    aLabel.textContent = entry.label;
    aLabel.style.color = window.ui.MUTED_COLOR;
    aLabel.style.fontSize = "12px";
    aLabel.style.flexShrink = 0;

    aRow.style.display = "flex";
    aRow.style.justifyContent = "space-between";
    aRow.style.alignItems = "baseline";
    aRow.style.gap = "14px";
    aRow.style.padding = "7px 0px";
    aRow.style.fontSize = "12px";
    aRow.style.borderBottomStyle = "solid";
    aRow.style.borderBottomWidth = "1px";
    aRow.style.borderBottomColor = window.ui.BORDER_COLOR;

    var aValue = makeValueElement(entry);

    aValue.style.overflow = "hidden";
    aValue.style.textOverflow = "ellipsis";
    aValue.style.whiteSpace = "nowrap";

    aRow.appendChild(aLabel);
    aRow.appendChild(aValue);

    return aRow;
  }

  function firstMail() {
    for (var i = 0; i < CONTACT.length; i++) {
      if (CONTACT[i].href.indexOf("mailto:") == 0) {
        return CONTACT[i].value;
      }
    }

    return "";
  }

  function copyText(text, onDone) {
    if (navigator.clipboard != null && typeof navigator.clipboard.writeText == "function") {
      navigator.clipboard.writeText(text).then(function () {
        onDone(true);
      }).catch(function () {
        onDone(false);
      });

      return;
    }

    var aField = document.createElement("textarea");

    aField.value = text;
    aField.style.position = "fixed";
    aField.style.opacity = "0";

    document.body.appendChild(aField);
    aField.select();

    var copied = false;

    try {
      copied = document.execCommand("copy");
    } catch (error) {
      copied = false;
    }

    aField.remove();

    onDone(copied);
  }

  function build(aSheet) {
    var ui = window.ui;

    var toolbar = ui.toolbar();
    var stage = ui.stage();
    var mail = firstMail();
    var status = ui.value("");
    var timer = 0;

    function report(text) {
      status.textContent = text;

      if (timer != 0) {
        window.clearTimeout(timer);
      }

      timer = window.setTimeout(function () {
        status.textContent = "";
        timer = 0;
      }, 1600);
    }

    function onCopy() {
      copyText(mail, function (copied) {
        report(copied ? "copied" : "could not copy");
      });
    }

    stage.appendChild(makeHeader());
    stage.appendChild(makeHeading("about"));
    stage.appendChild(makeBlurb());
    stage.appendChild(makeHeading("contact"));

    for (var i = 0; i < CONTACT.length; i++) {
      stage.appendChild(makeContactRow(CONTACT[i]));
    }

    if (mail != "") {
      toolbar.appendChild(ui.button("copy email", onCopy));
    }

    toolbar.appendChild(ui.spacer());
    toolbar.appendChild(status);

    aSheet.appendChild(toolbar);
    aSheet.appendChild(stage);

    function teardown() {
      if (timer != 0) {
        window.clearTimeout(timer);
        timer = 0;
      }
    }

    return teardown;
  }

  window.makeApp("about", "who made this and how to reach them", 460, 500, build, "system");
})();
