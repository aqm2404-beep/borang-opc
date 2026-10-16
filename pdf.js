/* Penjana PDF (jsPDF + AutoTable). Susun atur A4 mengikut borang kertas OPC. */
(function () {
  "use strict";

  var O = window.OPC;
  var BLUE = [25, 55, 160];

  // Fon piawai PDF tak sokong sesetengah simbol, jadi tukar ke ASCII
  function clean(s) {
    return String(s == null ? "" : s)
      .replace(/[–—]/g, "-")
      .replace(/[“”]/g, '"')
      .replace(/[‘’]/g, "'");
  }

  function drawMark(doc, cx, cy, kind) {
    doc.setDrawColor(0);
    doc.setLineWidth(0.55);
    if (kind === "x") {
      doc.line(cx - 1.4, cy - 1.4, cx + 1.4, cy + 1.4);
      doc.line(cx - 1.4, cy + 1.4, cx + 1.4, cy - 1.4);
    } else {
      doc.line(cx - 1.7, cy + 0.1, cx - 0.6, cy + 1.3);
      doc.line(cx - 0.6, cy + 1.3, cx + 1.9, cy - 1.6);
    }
    doc.setLineWidth(0.2);
  }

  function dataUrlType(url) {
    return /^data:image\/png/i.test(url) ? "PNG" : "JPEG";
  }

  // Lukis cop dalam kawasan (x, y, maxW, maxH). Pulangkan tinggi yang digunakan.
  function drawCop(doc, profile, x, y, maxW, maxH) {
    if (profile.copMode === "imej" && profile.copImg) {
      try {
        var props = doc.getImageProperties(profile.copImg);
        var sc = Math.min(maxW / props.width, maxH / props.height);
        var w = props.width * sc;
        var h = props.height * sc;
        doc.addImage(profile.copImg, dataUrlType(profile.copImg), x + (maxW - w) / 2, y, w, h);
        return h;
      } catch (e) {
        /* jatuh ke mod teks */
      }
    }

    var lines = O.copLines(profile).map(clean);
    if (!lines.length) return 0;

    var boxW = Math.min(maxW, 66);
    var fs = 9;
    doc.setFont("helvetica", "bold");
    for (; fs > 5; fs -= 0.5) {
      doc.setFontSize(fs);
      var widest = 0;
      for (var i = 0; i < lines.length; i++) widest = Math.max(widest, doc.getTextWidth(lines[i]));
      var lineH = fs * 0.3528 * 1.3;
      if (widest <= boxW - 4 && lines.length * lineH + 5 <= maxH) break;
    }
    doc.setFontSize(fs);
    var lh = fs * 0.3528 * 1.3;
    var boxH = lines.length * lh + 5;
    var bx = x + (maxW - boxW) / 2;

    doc.setDrawColor(BLUE[0], BLUE[1], BLUE[2]);
    doc.setTextColor(BLUE[0], BLUE[1], BLUE[2]);
    doc.setLineWidth(0.5);
    doc.rect(bx, y, boxW, boxH);
    for (var j = 0; j < lines.length; j++) {
      doc.text(lines[j], bx + boxW / 2, y + 2.5 + lh * (j + 0.8), { align: "center" });
    }
    doc.setDrawColor(0);
    doc.setTextColor(0);
    doc.setLineWidth(0.2);
    return boxH;
  }

  function build(d, profile) {
    var jsPDF = window.jspdf.jsPDF;
    var doc = new jsPDF({ unit: "mm", format: "a4" });
    var L = 15;
    var W = 180;
    var y = 10;

    doc.setLineWidth(0.3);
    doc.setDrawColor(0);
    doc.setTextColor(0);

    // Tajuk
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("TENAGA NASIONAL BERHAD", L, y + 4);
    y += 6.5;
    doc.rect(L, y, W, 8);
    doc.setFontSize(10.5);
    doc.text("SENARAI SEMAK : PEMERIKSAAN JANGKA OPC", L + W / 2, y + 5.4, { align: "center" });
    y += 8;

    // Kotak maklumat projek
    function box(x, yy, w, h, label, value) {
      doc.rect(x, yy, w, h);
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "bold");
      doc.text(label, x + 2, yy + 4.8);
      var lw = doc.getTextWidth(label) + 1.5;
      doc.setFont("helvetica", "normal");
      var lines = doc.splitTextToSize(clean(value), w - lw - 4).slice(0, 2);
      doc.text(lines, x + 2 + lw, yy + 4.8);
    }

    box(L, y, 100, 6.5, "SN:", d.sn);
    box(L + 100, y, 80, 6.5, "TARIKH:", O.fmtDate(d.tarikh));
    y += 6.5;
    box(L, y, 100, 6.5, "NO PROJEK:", d.noProjek);
    box(L + 100, y, 80, 6.5, "JENIS JANGKA:", d.jenisJangka || "1PH / 3PH");
    y += 6.5;
    box(L, y, W, 8.5, "PROJEK:", d.projek);
    y += 8.5;
    box(L, y, 100, 6.5, "JENIS PENGGUNA:", d.jenisPengguna);
    box(L + 100, y, 80, 6.5, "MD:", d.md);
    y += 6.5;

    doc.rect(L, y, W, 9.5);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.text("PEMERIKSAAN:", L + 2, y + 4.8);
    var pw = doc.getTextWidth("PEMERIKSAAN:") + 1.5;
    doc.setFont("helvetica", "normal");
    doc.text(d.pemeriksaan ? d.pemeriksaan.replace(/\//g, " / ") : "1 / 2 / 3", L + 2 + pw, y + 4.8);
    doc.setFontSize(7);
    doc.text("(WAJIB DISERTAKAN BERSAMA LUKISAN YANG TELAH DILULUSKAN)", L + 2, y + 8);
    y += 12.5;

    // Senarai semak
    var body = O.PERKARA.map(function (p, i) {
      return [String(i + 1), clean(p), "", "", ""];
    });

    doc.autoTable({
      startY: y,
      margin: { left: L, right: 15 },
      tableWidth: W,
      head: [["BIL", "PERKARA", "LULUS", "GAGAL", "TIADA KAITAN /\nULASAN"]],
      body: body,
      theme: "grid",
      rowPageBreak: "avoid",
      styles: {
        font: "helvetica",
        fontSize: 7.6,
        cellPadding: { top: 0.9, bottom: 0.9, left: 1.5, right: 1.5 },
        lineColor: [0, 0, 0],
        lineWidth: 0.2,
        textColor: 0,
        valign: "middle",
        minCellHeight: 5.2
      },
      headStyles: {
        fillColor: [235, 235, 235],
        textColor: 0,
        fontStyle: "bold",
        halign: "center",
        fontSize: 7.5
      },
      columnStyles: {
        0: { cellWidth: 10, halign: "center" },
        1: { cellWidth: 110 },
        2: { cellWidth: 18 },
        3: { cellWidth: 18 },
        4: { cellWidth: 24 }
      },
      didDrawCell: function (h) {
        if (h.section !== "body" || h.column.index < 2) return;
        var s = d.statuses[h.row.index];
        var want = h.column.index === 2 ? "lulus" : h.column.index === 3 ? "gagal" : "tiada";
        if (s !== want) return;
        drawMark(doc, h.cell.x + h.cell.width / 2, h.cell.y + h.cell.height / 2, want === "gagal" ? "x" : "tick");
      }
    });

    y = doc.lastAutoTable.finalY + 6;

    function ensureSpace(h) {
      if (y + h > 285) {
        doc.addPage();
        y = 15;
      }
    }

    // Keputusan
    ensureSpace(12);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(0);
    doc.text("KEPUTUSAN PEMERIKSAAN:", L, y);
    var kx = L + doc.getTextWidth("KEPUTUSAN PEMERIKSAAN:") + 6;
    ["LULUS", "GAGAL"].forEach(function (word) {
      var tw = doc.getTextWidth(word);
      if (d.keputusan === word) {
        doc.setLineWidth(0.6);
        doc.rect(kx - 2, y - 4.4, tw + 4, 6.4);
        doc.setLineWidth(0.2);
      }
      doc.setFont("helvetica", d.keputusan === word ? "bold" : "normal");
      doc.text(word, kx, y);
      kx += tw + 10;
    });
    y += 7;

    if (d.catatan && d.catatan.trim()) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.text("CATATAN / ULASAN:", L, y);
      doc.setFont("helvetica", "normal");
      var cl = doc.splitTextToSize(clean(d.catatan.trim()), W).slice(0, 4);
      doc.text(cl, L, y + 4);
      y += 4 + cl.length * 3.5 + 2;
    }

    // Tandatangan & cop
    ensureSpace(50);
    y += 1;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("WAKIL TNB", L, y);
    doc.text("WAKIL KONTRAKTOR", L + 100, y);

    var areaY = y + 3;
    drawCop(doc, profile, L, areaY, 80, 24);

    var lineY = areaY + 27;
    doc.setLineWidth(0.3);
    doc.line(L, lineY, L + 80, lineY);
    doc.line(L + 100, lineY, L + 180, lineY);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    var ty = lineY + 4.5;
    var tnb = [
      "Nama : " + clean(profile.nama),
      "No. Pekerja : " + clean(profile.noStaff),
      "Jawatan : " + clean(profile.jawatan),
      "Cawangan : " + clean(profile.cawangan)
    ];
    tnb.forEach(function (t, i) {
      doc.text(doc.splitTextToSize(t, 80)[0], L, ty + i * 4.2);
    });
    var kon = ["Nama : " + clean(d.namaKontraktor), "No. H/P : " + clean(d.hpKontraktor), "Tarikh : " + O.fmtDate(d.tarikh)];
    kon.forEach(function (t, i) {
      doc.text(doc.splitTextToSize(t, 80)[0], L + 100, ty + i * 4.2);
    });

    return doc;
  }

  window.OPC.buildPdf = build;
})();
