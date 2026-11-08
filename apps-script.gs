/**
 * Amalan Harian — penghubung ke Google Sheets
 * Tempel kode ini di Ekstensi → Apps Script, lalu Terapkan sebagai Aplikasi web
 * (Jalankan sebagai: Saya, Akses: Siapa saja).
 * Data tersimpan di tab "Log": satu baris per amalan per tanggal.
 */
const SHEET_NAME = 'Log';
const TZ = 'Asia/Jakarta';

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(['Tanggal', 'ID Amalan', 'Amalan', 'Selesai', 'Catatan', 'Diubah']);
    sh.setFrozenRows(1);
    sh.getRange('A:A').setNumberFormat('yyyy-mm-dd');
    sh.getRange('F:F').setNumberFormat('yyyy-mm-dd hh:mm');
    sh.getRange('1:1').setFontWeight('bold');
  }
  return sh;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function dateKey_(v) {
  if (v instanceof Date) return Utilities.formatDate(v, TZ, 'yyyy-MM-dd');
  return String(v).slice(0, 10);
}

function readAll_(sh) {
  const last = sh.getLastRow();
  if (last < 2) return [];
  return sh.getRange(2, 1, last - 1, 6).getValues();
}

// Aplikasi mengambil semua data saat dibuka
function doGet() {
  const rows = readAll_(getSheet_())
    .filter(r => r[0] && r[1])
    .map(r => [dateKey_(r[0]), String(r[1]), r[3] === true ? 1 : 0, String(r[4] || ''),
               r[5] instanceof Date ? r[5].getTime() : Number(r[5]) || 0]);
  return json_({ ok: true, rows: rows });
}

// Aplikasi mengirim perubahan centang
function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    const latest = {};
    (body.ops || []).forEach(op => {
      if (!op || !op.date || !op.id) return;
      const k = op.date + '|' + op.id;
      if (!latest[k] || (op.ts || 0) >= (latest[k].ts || 0)) latest[k] = op;
    });

    const sh = getSheet_();
    const index = {};
    readAll_(sh).forEach((r, i) => {
      if (r[0] && r[1]) index[dateKey_(r[0]) + '|' + r[1]] = { row: i + 2, ts: r[5] instanceof Date ? r[5].getTime() : 0 };
    });

    const appends = [];
    Object.keys(latest).forEach(k => {
      const op = latest[k];
      const values = [Utilities.parseDate(op.date, TZ, 'yyyy-MM-dd'), op.id, op.name || op.id,
                      !!op.done, op.note || '', new Date(op.ts || Date.now())];
      const found = index[k];
      if (found) {
        if ((op.ts || 0) >= found.ts) sh.getRange(found.row, 1, 1, 6).setValues([values]);
      } else {
        appends.push(values);
      }
    });
    if (appends.length) sh.getRange(sh.getLastRow() + 1, 1, appends.length, 6).setValues(appends);
    return json_({ ok: true, saved: Object.keys(latest).length });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}
