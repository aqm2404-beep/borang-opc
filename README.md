# Borang OPC (Pemeriksaan Jangka OPC)

Senarai semak digital OPC. Tiada backend, semua jalan dalam pelayar. Tiada build step.

## Deploy ke Vercel
1. Letak folder ini dalam repo GitHub (cth. `borang-opc`).
2. Vercel > Add New > Project > pilih repo. Framework: **Other**. Tiada build command, output directory biar kosong.
3. Deploy. Buka URL di telefon, pilih **Add to Home Screen**.

## Cara guna
- **Tetapan** (sekali sahaja): nama, no pekerja, jawatan, cawangan, dan cop (taip teks atau muat naik imej).
- **Borang**: isi maklumat projek, tanda 22 item, kemudian Pratonton / Muat Turun / Kongsi PDF.
- Data disimpan dalam peranti masing-masing (localStorage). Setiap pengguna isi Tetapan sendiri.

## Fail
- `index.html`, `form.js` : halaman borang
- `tetapan.html`, `tetapan.js` : halaman tetapan wakil TNB + cop
- `pdf.js` : susun atur PDF (A4, satu muka surat)
- `common.js` : 22 item semakan, simpanan, utiliti
- `vendor/` : jsPDF + AutoTable (disertakan, tak perlu CDN)
- `sw.js`, `manifest.webmanifest` : boleh guna offline dan pasang di skrin utama

Tukar versi di `common.js` (VERSION) dan `sw.js` (CACHE) bila kemas kini, supaya cache lama diganti.
