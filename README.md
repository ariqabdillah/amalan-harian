# Amalan Harian

Aplikasi web (PWA) untuk mencatat amalan harian: sholat wajib dan sunnah, taubat, tahajud, dzikir pagi, dan sedekah. Setiap amalan dilengkapi niat atau bacaan dalam tulisan latin yang mudah diucapkan beserta artinya.

## Fitur

- **Checklist harian per amalan (21 item)**, dikelompokkan per waktu sholat. Status setiap item: selesai, waktunya, terlewat, atau belum waktunya.
- **Jadwal sholat otomatis** untuk Tanjung Morawa (metode Kemenag: Subuh 20°, Isya 18°, ihtiyat 2 menit).
- **Penghitung dzikir bulat** untuk Sholawat Adrikni dan tasbih 100×. Item tercentang otomatis saat target tercapai.
- **Riwayat**: rekap mingguan, rangkaian berturut-turut (streak), kalender bulanan, dan daftar amalan yang paling sering terlewat.
- **Data tersimpan di Google Sheets** pribadi lewat Apps Script. Checklist tetap bisa dipakai saat offline, lalu tersinkron otomatis begitu online.
- Bisa dipasang di layar utama iPhone: Safari → Bagikan → Tambahkan ke Layar Utama.

## Struktur

| File | Isi |
|---|---|
| `index.html` | Kerangka halaman |
| `css/style.css` | Tampilan (tema hitam-emas) |
| `js/prayer.js` | Perhitungan waktu sholat |
| `js/data.js` | Daftar amalan, niat, bacaan, dan artinya |
| `js/app.js` | Checklist, riwayat, penghitung, sinkron Google Sheets |
| `apps-script.gs` | Kode penghubung Google Sheets (ditempel di Apps Script) |
| `sw.js`, `manifest.webmanifest` | Supaya bisa dipasang dan dipakai offline |

## Data di Google Sheets

Tab `Log` berisi satu baris per amalan per tanggal: `Tanggal | ID Amalan | Amalan | Selesai | Catatan | Diubah`. Data ini bisa dianalisis langsung dengan pivot table.

Dibuat dengan HTML, CSS, dan JavaScript murni, tanpa framework. Di-deploy di Vercel.
