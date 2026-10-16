/* Borang Pemeriksaan Jangka OPC - kod dikongsi (data, simpanan, utiliti) */
(function () {
  "use strict";

  var VERSION = "1.0.0";

  var PERKARA = [
    "RUANG JANGKA YANG SESUAI DIGUNAKAN",
    "KETINGGIAN PANEL METER MENGIKUT ESAH\nGATE POST = 1.5m\nRISER – TIDAK MELEBIHI 2.1m\nDINDING – 1.75 - 1.85m",
    "PANEL METER MENGHADAP JALAN RAYA",
    "KETEBALAN PANEL BOARD MELEBIHI 5mm",
    "GETAH PEMBALUT (BUSHING) PADA LUBANG PANEL METER RISER DISEDIAKAN",
    "KABEL BERSAIZ 16mm/25mm DAN BERWARNA DARIPADA CUT-OUT METER DISEDIAKAN",
    "SURFACE WIRING",
    "CUT-OUT DAN NEUTRALINK TELAH DISEDIAKAN",
    "PINTU DIPASANG CERMIN MESTILAH JENIS LUTSINAR",
    "BUKAAN PINTU ANTARA 500 – 650mm",
    "JARAK PANEL METER KE BUKAAN PINTU HENDAKLAH 300mm",
    "LAMPU DAN SUIS DISEDIAKAN – MINIMA 1 UNIT BAGI SETIAP BILIK RISER",
    "PUNCA SOKET 13A (PLUG SOCKET) DISEDIAKAN",
    "PAPAN TANDA \"BILIK METER TNB\" DI LABELKAN",
    "NOMBOR RUMAH/BILIK/KEDAI HENDAKLAH DILABELKAN",
    "PANEL METER DILABEL DENGAN METAL PLATE YANG KEKAL DAN RIVET",
    "PANEL AGIHAN (DB) PENGGUNA TELAH SIAP DIPASANG",
    "PAIP METER AIR TIDAK DIBENARKAN BERADA DI BAWAH ATAS DI HADAPAN PANEL METER TNB YANG BOLEH MENGHALANGI PEMASANGAN METER",
    "PANEL METER TNB TIDAK BOLEH DIKUNCI/DIHALANG",
    "SATU COMPARTMENT HANYA UNTUK METER TNB SAHAJA",
    "PANEL METER TIDAK BOLEH TERDEDAH KEPADA CAHAYA ATAU HUJAN",
    "LAIN-LAIN HAL SILA RUJUK ESAH"
  ];

  var PROFILE_KEY = "opc.profile.v1";
  var DRAFT_KEY = "opc.draft.v1";

  function loadJSON(key, fallback) {
    try {
      var s = localStorage.getItem(key);
      return s ? JSON.parse(s) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function saveJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      return false;
    }
  }

  var EMPTY_PROFILE = {
    nama: "",
    noStaff: "",
    jawatan: "",
    cawangan: "",
    copMode: "teks", // "teks" | "imej"
    copTeks: "",
    copImg: ""
  };

  function getProfile() {
    var p = loadJSON(PROFILE_KEY, {});
    var out = {};
    for (var k in EMPTY_PROFILE) out[k] = typeof p[k] === "string" ? p[k] : EMPTY_PROFILE[k];
    if (out.copMode !== "imej") out.copMode = "teks";
    return out;
  }

  function saveProfile(p) {
    return saveJSON(PROFILE_KEY, p);
  }

  function profileReady(p) {
    return !!(p.nama.trim() && p.noStaff.trim());
  }

  // Baris teks untuk cop. Jika kosong, dijana daripada maklumat profil.
  function copLines(p) {
    var manual = (p.copTeks || "")
      .split(/\r?\n/)
      .map(function (s) { return s.trim(); })
      .filter(Boolean);
    if (manual.length) return manual;
    return autoCopLines(p);
  }

  function autoCopLines(p) {
    var lines = [];
    if (p.nama.trim()) lines.push(p.nama.trim().toUpperCase());
    if (p.jawatan.trim()) lines.push(p.jawatan.trim().toUpperCase());
    if (p.cawangan.trim()) lines.push(p.cawangan.trim().toUpperCase());
    if (lines.length) lines.push("TENAGA NASIONAL BERHAD");
    return lines;
  }

  function pad(n) { return String(n).padStart(2, "0"); }

  // Tarikh tempatan (bukan UTC) supaya tak jadi semalam selepas tengah malam
  function todayLocal() {
    var d = new Date();
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  }

  function fmtDate(iso) {
    if (!iso) return "";
    var p = iso.split("-");
    return p.length === 3 ? p[2] + "/" + p[1] + "/" + p[0] : iso;
  }

  function toast(msg) {
    var el = document.getElementById("toast");
    if (!el) return;
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { el.classList.remove("show"); }, 2600);
  }

  // Service worker: boleh guna offline & pasang di skrin utama
  if ("serviceWorker" in navigator && location.protocol.indexOf("http") === 0) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("sw.js").catch(function () {});
    });
  }

  window.OPC = {
    VERSION: VERSION,
    PERKARA: PERKARA,
    PROFILE_KEY: PROFILE_KEY,
    DRAFT_KEY: DRAFT_KEY,
    loadJSON: loadJSON,
    saveJSON: saveJSON,
    getProfile: getProfile,
    saveProfile: saveProfile,
    profileReady: profileReady,
    copLines: copLines,
    autoCopLines: autoCopLines,
    todayLocal: todayLocal,
    fmtDate: fmtDate,
    toast: toast
  };
})();
