/* Logik halaman borang */
(function () {
  "use strict";

  var O = window.OPC;
  var $ = function (id) { return document.getElementById(id); };
  var N = O.PERKARA.length;

  var FIELDS = ["sn", "tarikh", "noProjek", "projek", "jenisPengguna", "jenisJangka", "md",
    "pemeriksaan", "catatan", "namaKontraktor", "hpKontraktor"];

  var state = { statuses: new Array(N).fill(null), keputusan: null };

  /* ---------- Draf ---------- */

  function readFields() {
    var f = {};
    FIELDS.forEach(function (id) { f[id] = $(id).value; });
    return f;
  }

  function saveDraft() {
    O.saveJSON(O.DRAFT_KEY, {
      fields: readFields(),
      statuses: state.statuses,
      keputusan: state.keputusan
    });
  }

  function loadDraft() {
    var dr = O.loadJSON(O.DRAFT_KEY, null);
    if (dr && dr.fields) {
      FIELDS.forEach(function (id) {
        if (typeof dr.fields[id] === "string") $(id).value = dr.fields[id];
      });
      if (Array.isArray(dr.statuses) && dr.statuses.length === N) {
        state.statuses = dr.statuses.map(function (s) {
          return s === "lulus" || s === "gagal" || s === "tiada" ? s : null;
        });
      }
      if (dr.keputusan === "LULUS" || dr.keputusan === "GAGAL") state.keputusan = dr.keputusan;
    }
    if (!$("tarikh").value) $("tarikh").value = O.todayLocal();
  }

  /* ---------- Banner profil ---------- */

  function renderBanner() {
    var p = O.getProfile();
    var box = $("profileBanner");
    box.textContent = "";
    var div = document.createElement("div");
    var txt = document.createElement("div");
    txt.className = "txt";
    var a = document.createElement("a");
    a.href = "tetapan.html";
    a.className = "btn small";

    if (O.profileReady(p)) {
      div.className = "banner";
      var s = document.createElement("strong");
      s.textContent = p.nama;
      var sm = document.createElement("small");
      sm.textContent = [p.noStaff, p.jawatan, p.cawangan].filter(Boolean).join(" • ") +
        (p.copMode === "imej" && p.copImg ? " • cop: imej" : " • cop: teks");
      txt.appendChild(s);
      txt.appendChild(sm);
      a.textContent = "Ubah";
    } else {
      div.className = "banner warn";
      var s2 = document.createElement("strong");
      s2.textContent = "Maklumat wakil TNB belum diisi";
      var sm2 = document.createElement("small");
      sm2.textContent = "Isi nama, no pekerja, jawatan dan cop di Tetapan (sekali sahaja).";
      txt.appendChild(s2);
      txt.appendChild(sm2);
      a.textContent = "Isi Tetapan";
      a.className = "btn small primary";
    }
    div.appendChild(txt);
    div.appendChild(a);
    box.appendChild(div);
  }

  /* ---------- Senarai semak ---------- */

  function buildChecklist() {
    var host = $("checklist");
    host.textContent = "";
    O.PERKARA.forEach(function (text, i) {
      var item = document.createElement("div");
      item.className = "item";
      item.id = "item" + i;

      var no = document.createElement("div");
      no.className = "no";
      no.textContent = i + 1;
      var tx = document.createElement("div");
      tx.className = "txt";
      tx.textContent = text;

      var seg = document.createElement("div");
      seg.className = "seg";
      [["lulus", "Lulus"], ["gagal", "Gagal"], ["tiada", "Tiada"]].forEach(function (o) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = o[0];
        b.textContent = o[1];
        b.setAttribute("aria-pressed", "false");
        b.addEventListener("click", function () { setStatus(i, o[0]); });
        seg.appendChild(b);
      });

      item.appendChild(no);
      item.appendChild(tx);
      item.appendChild(seg);
      host.appendChild(item);
    });
  }

  function autoKeputusan() {
    if (state.statuses.indexOf("gagal") !== -1) return "GAGAL";
    var done = state.statuses.filter(function (s) { return s === "lulus" || s === "tiada"; }).length;
    return done === N ? "LULUS" : null;
  }

  function setStatus(i, val) {
    state.statuses[i] = state.statuses[i] === val ? null : val;
    state.keputusan = autoKeputusan();
    refresh();
    saveDraft();
  }

  function refresh() {
    var c = { lulus: 0, gagal: 0, tiada: 0 };
    state.statuses.forEach(function (s, i) {
      if (s) c[s]++;
      var item = $("item" + i);
      item.classList.toggle("gagal", s === "gagal");
      var btns = item.querySelectorAll(".seg button");
      btns.forEach(function (b) { b.setAttribute("aria-pressed", String(b.className === s)); });
    });
    $("cLulus").textContent = c.lulus;
    $("cGagal").textContent = c.gagal;
    $("cTiada").textContent = c.tiada;
    var filled = c.lulus + c.gagal + c.tiada;
    $("progressFill").style.width = Math.round((filled / N) * 100) + "%";
    $("progressLabel").textContent = filled + "/" + N + " diisi";
    $("kLulus").setAttribute("aria-pressed", String(state.keputusan === "LULUS"));
    $("kGagal").setAttribute("aria-pressed", String(state.keputusan === "GAGAL"));
  }

  /* ---------- PDF ---------- */

  function collect() {
    var d = readFields();
    d.statuses = state.statuses.slice();
    d.keputusan = state.keputusan;
    return d;
  }

  function fileName() {
    var d = readFields();
    var key = (d.sn || d.noProjek || "borang").trim().replace(/[^A-Za-z0-9_-]+/g, "_").slice(0, 30);
    return "OPC_" + key + "_" + (d.tarikh || O.todayLocal()).replace(/-/g, "") + ".pdf";
  }

  function preflight() {
    if (!window.jspdf || !window.jspdf.jsPDF) {
      alert("Pustaka PDF tidak dimuatkan. Sambung internet sekali, kemudian muat semula halaman.");
      return false;
    }
    var p = O.getProfile();
    var warns = [];
    if (!O.profileReady(p)) warns.push("Maklumat wakil TNB (nama/no pekerja) belum diisi di Tetapan.");
    var blank = state.statuses.filter(function (s) { return !s; }).length;
    if (blank) warns.push(blank + " item senarai semak belum diisi.");
    if (!state.keputusan) warns.push("Keputusan pemeriksaan belum dipilih.");
    if (warns.length) return confirm(warns.join("\n") + "\n\nTeruskan jana PDF?");
    return true;
  }

  function makePdf() {
    return O.buildPdf(collect(), O.getProfile());
  }

  $("btnPreview").addEventListener("click", function () {
    if (!preflight()) return;
    var doc = makePdf();
    var url = doc.output("bloburl");
    var w = window.open(url, "_blank");
    if (!w) {
      doc.save(fileName());
      O.toast("Pratonton disekat pelayar. PDF dimuat turun.");
    }
  });

  $("btnDownload").addEventListener("click", function () {
    if (!preflight()) return;
    makePdf().save(fileName());
    O.toast("PDF dimuat turun");
  });

  $("btnShare").addEventListener("click", function () {
    if (!preflight()) return;
    var doc = makePdf();
    var name = fileName();
    var blob = doc.output("blob");
    var file = new File([blob], name, { type: "application/pdf" });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      navigator.share({ files: [file], title: name }).catch(function (e) {
        if (e && e.name !== "AbortError") {
          doc.save(name);
          O.toast("Kongsi gagal. PDF dimuat turun.");
        }
      });
    } else {
      doc.save(name);
      O.toast("Peranti tak sokong kongsi terus. PDF dimuat turun, hantar manual.");
    }
  });

  /* ---------- WhatsApp teks ---------- */

  $("btnWA").addEventListener("click", function () {
    var d = readFields();
    var p = O.getProfile();
    var cnt = { lulus: 0, gagal: 0, tiada: 0 };
    state.statuses.forEach(function (s) { if (s) cnt[s]++; });
    var icon = { lulus: "✅", gagal: "❌", tiada: "➖" };
    var lines = [
      "*SENARAI SEMAK PEMERIKSAAN JANGKA OPC*",
      "--------------------",
      "*SN:* " + (d.sn || "-") + "  |  *Tarikh:* " + O.fmtDate(d.tarikh),
      "*No Projek:* " + (d.noProjek || "-"),
      "*Projek:* " + (d.projek || "-"),
      "*Jenis Pengguna:* " + (d.jenisPengguna || "-") + "  |  *Jenis Jangka:* " + (d.jenisJangka || "-"),
      "*MD:* " + (d.md || "-"),
      "--------------------"
    ];
    state.statuses.forEach(function (s, i) {
      lines.push((s ? icon[s] : "⬜") + " " + (i + 1) + ". " + O.PERKARA[i].split("\n")[0]);
    });
    lines.push("--------------------");
    lines.push("Lulus: " + cnt.lulus + "  Gagal: " + cnt.gagal + "  Tiada: " + cnt.tiada);
    lines.push("*KEPUTUSAN: " + (state.keputusan || "-") + "*");
    if (d.catatan.trim()) lines.push("Catatan: " + d.catatan.trim());
    lines.push("--------------------");
    lines.push("*Wakil TNB:* " + (p.nama || "-") + (p.noStaff ? " (" + p.noStaff + ")" : ""));
    lines.push([p.jawatan, p.cawangan].filter(Boolean).join(", "));
    lines.push("*Kontraktor:* " + (d.namaKontraktor || "-") + "  " + (d.hpKontraktor || ""));
    window.open("https://wa.me/?text=" + encodeURIComponent(lines.join("\n")), "_blank");
  });

  /* ---------- Lain-lain ---------- */

  $("kLulus").addEventListener("click", function () {
    state.keputusan = state.keputusan === "LULUS" ? null : "LULUS";
    refresh();
    saveDraft();
  });
  $("kGagal").addEventListener("click", function () {
    state.keputusan = state.keputusan === "GAGAL" ? null : "GAGAL";
    refresh();
    saveDraft();
  });

  $("btnAllPass").addEventListener("click", function () {
    state.statuses = state.statuses.map(function (s) { return s || "lulus"; });
    state.keputusan = autoKeputusan();
    refresh();
    saveDraft();
    O.toast("Item kosong ditanda Lulus. Tukar yang Gagal/Tiada.");
  });

  $("btnReset").addEventListener("click", function () {
    if (!confirm("Kosongkan semua data borang? (Maklumat Tetapan kekal)")) return;
    FIELDS.forEach(function (id) { $(id).value = ""; });
    $("tarikh").value = O.todayLocal();
    state.statuses = new Array(N).fill(null);
    state.keputusan = null;
    refresh();
    saveDraft();
    window.scrollTo(0, 0);
  });

  FIELDS.forEach(function (id) {
    $(id).addEventListener("input", saveDraft);
    $(id).addEventListener("change", saveDraft);
  });

  $("ver").textContent = O.VERSION;
  buildChecklist();
  loadDraft();
  renderBanner();
  refresh();

  // Bila kembali dari halaman Tetapan (bfcache), muat semula banner
  window.addEventListener("pageshow", renderBanner);
})();
