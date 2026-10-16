/* Logik halaman Tetapan */
(function () {
  "use strict";

  var O = window.OPC;
  var $ = function (id) { return document.getElementById(id); };
  var profile = O.getProfile();
  var saveTimer = null;

  function setMode(mode) {
    profile.copMode = mode;
    $("modeTeks").setAttribute("aria-pressed", String(mode === "teks"));
    $("modeImej").setAttribute("aria-pressed", String(mode === "imej"));
    $("panelTeks").classList.toggle("hidden", mode !== "teks");
    $("panelImej").classList.toggle("hidden", mode !== "imej");
    renderPreview();
  }

  function renderPreview() {
    var host = $("copPreview");
    host.textContent = "";
    if (profile.copMode === "imej") {
      if (profile.copImg) {
        var img = document.createElement("img");
        img.alt = "Cop";
        img.src = profile.copImg;
        host.appendChild(img);
      } else {
        host.appendChild(empty("Belum ada imej cop. Pilih fail di atas."));
      }
      return;
    }
    var lines = O.copLines(profile);
    if (!lines.length) {
      host.appendChild(empty("Isi nama dahulu untuk melihat pratonton cop."));
      return;
    }
    var box = document.createElement("div");
    box.className = "cop-box";
    lines.forEach(function (l, i) {
      if (i) box.appendChild(document.createElement("br"));
      box.appendChild(document.createTextNode(l));
    });
    host.appendChild(box);
  }

  function empty(msg) {
    var d = document.createElement("div");
    d.className = "cop-empty";
    d.textContent = msg;
    return d;
  }

  function persist() {
    var ok = O.saveProfile(profile);
    var el = $("saved");
    el.style.color = ok ? "" : "#c62828";
    el.textContent = ok ? "Disimpan" : "Gagal simpan (storan penuh atau mod peribadi)";
    clearTimeout(persist._t);
    persist._t = setTimeout(function () { el.textContent = ""; }, 1800);
  }

  function scheduleSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(persist, 250);
  }

  ["nama", "noStaff", "jawatan", "cawangan", "copTeks"].forEach(function (id) {
    $(id).value = profile[id];
    $(id).addEventListener("input", function () {
      profile[id] = $(id).value;
      renderPreview();
      scheduleSave();
    });
  });

  $("modeTeks").addEventListener("click", function () { setMode("teks"); persist(); });
  $("modeImej").addEventListener("click", function () { setMode("imej"); persist(); });

  $("btnAutoCop").addEventListener("click", function () {
    var lines = O.autoCopLines(profile);
    if (!lines.length) {
      O.toast("Isi nama dahulu.");
      return;
    }
    profile.copTeks = lines.join("\n");
    $("copTeks").value = profile.copTeks;
    renderPreview();
    persist();
  });

  $("copFile").addEventListener("change", function () {
    var file = $("copFile").files && $("copFile").files[0];
    if (!file) return;
    var fr = new FileReader();
    fr.onload = function () {
      var img = new Image();
      img.onload = function () {
        var max = 700;
        var sc = Math.min(1, max / Math.max(img.width, img.height));
        var w = Math.max(1, Math.round(img.width * sc));
        var h = Math.max(1, Math.round(img.height * sc));
        var c = document.createElement("canvas");
        c.width = w;
        c.height = h;
        var ctx = c.getContext("2d");
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        profile.copImg = c.toDataURL("image/jpeg", 0.85);
        renderPreview();
        persist();
      };
      img.onerror = function () { O.toast("Imej tidak dapat dibaca. Cuba fail lain."); };
      img.src = fr.result;
    };
    fr.readAsDataURL(file);
  });

  $("btnRemoveImg").addEventListener("click", function () {
    profile.copImg = "";
    $("copFile").value = "";
    renderPreview();
    persist();
  });

  setMode(profile.copMode);
})();
