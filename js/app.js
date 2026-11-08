(function () {
  'use strict';
  var GROUPS = AH_DATA.GROUPS, ITEMS = AH_DATA.ITEMS;
  var ITEM = {}; ITEMS.forEach(function (it) { ITEM[it.id] = it; });
  var WAJIB = ITEMS.filter(function (i) { return i.wajib; }).map(function (i) { return i.id; });
  var DZIKIR = ITEMS.filter(function (i) { return i.group === 'dzikir'; }).map(function (i) { return i.id; });
  var PETANG = ITEMS.filter(function (i) { return i.group === 'petang'; }).map(function (i) { return i.id; });
  var DZ_SHOLAT = ITEMS.filter(function (i) { return i.phases; }).map(function (i) { return i.id; });
  var G = AH_GUIDE, HAFAL_DATE = '2000-01-01';
  G.READ.dz_salam = ITEM.dzikir_subuh.parts[1]; G.READ.dz_kursi = ITEM.dzikir_subuh.parts[2]; G.READ.dz_penutup = ITEM.dzikir_subuh.parts[4];
  function isFriday(k) { return parse(k).getDay() === 5; }
  // item versi tanggal tertentu (hari Jumat: Zuhur → Jumat, dst.)
  function itemDef(k, id) {
    var it = ITEM[id];
    if (it && it.friday && isFriday(k)) { var x = {}; for (var p in it) x[p] = it[p]; for (var q in it.friday) x[q] = it.friday[q]; return x; }
    return it;
  }
  function itemsFor(k) {
    var dow = parse(k).getDay();
    return ITEMS.filter(function (it) {
      if (it.days && it.days.indexOf(dow) < 0) return false;
      if (it.notFriday && dow === 5) return false;
      return true;
    }).map(function (it) { return itemDef(k, it.id); });
  }
  function knownId(id) { return !!ITEM[id] || id.indexOf('hafal:') === 0; }
  var HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  var HARI3 = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
  var BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

  // ---------- penyimpanan lokal ----------
  function load(k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  var data = load('ah-data', {});      // { 'YYYY-MM-DD': { itemId: { d:1|0, n:'catatan', ts } } }
  var queue = load('ah-queue', []);    // perubahan yang belum terkirim ke Google Sheets
  var counts = load('ah-count', {});   // { 'YYYY-MM-DD': { itemId: n } }
  var sheetUrl = load('ah-url', '');   // cara lama: link Apps Script ditempel manual
  var pin = load('ah-pin', '');        // cara baru: link disimpan di Vercel, HP cukup ingat PIN
  var server = load('ah-server', false); // true kalau Vercel sudah diisi SHEET_URL + APP_PIN
  var firstDay = load('ah-first', null);

  // ---------- tanggal ----------
  function key(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function parse(k) { var p = k.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function addDays(d, n) { var x = new Date(d); x.setDate(x.getDate() + n); return x; }
  function nowMin() { var d = new Date(); return d.getHours() * 60 + d.getMinutes(); }
  function todayKey() { return key(new Date()); }
  if (!firstDay) { firstDay = todayKey(); save('ah-first', firstDay); }
  function hijri(d) {
    try { return new Intl.DateTimeFormat('id-u-ca-islamic-umalqura', { day: 'numeric', month: 'long', year: 'numeric' }).format(d).replace(/\s?AH$/, ' H'); }
    catch (e) { return ''; }
  }
  function longDate(d) { return HARI[d.getDay()] + ', ' + d.getDate() + ' ' + BULAN[d.getMonth()] + ' ' + d.getFullYear(); }

  // ---------- status amalan ----------
  function isDone(k, id) { return !!(data[k] && data[k][id] && data[k][id].d); }
  function groupOf(id) { for (var i = 0; i < GROUPS.length; i++) if (GROUPS[i].id === ITEM[id].group) return GROUPS[i]; }
  function status(k, id) {
    if (isDone(k, id)) return 'done';
    var t = todayKey();
    if (k < t) return 'late';
    if (k > t) return 'belum';
    var g = groupOf(id), pt = Prayer.times(parse(k)), m = nowMin();
    var end = ITEM[id].end ? ITEM[id].end(pt) : g.end(pt);
    if (m < g.start(pt)) return 'belum';
    if (m >= end) return 'late';
    return 'now';
  }
  function dayStats(k) {
    var done = 0, wajib = 0, missed = [], list = itemsFor(k);
    list.forEach(function (it) {
      var s = status(k, it.id);
      if (s === 'done') { done++; if (it.wajib) wajib++; }
      if (s === 'late') missed.push(it.id);
    });
    return { done: done, total: list.length, wajib: wajib, missed: missed, pct: list.length ? done / list.length : 0 };
  }

  function setDone(k, id, val, note) {
    var cur = (data[k] && data[k][id]) || {};
    var rec = { d: val ? 1 : 0, n: note !== undefined ? note : (cur.n || ''), ts: Date.now() };
    data[k] = data[k] || {}; data[k][id] = rec; save('ah-data', data);
    queue = queue.filter(function (o) { return !(o.date === k && o.id === id); });
    queue.push({ date: k, id: id, name: opName(k, id), done: rec.d, note: rec.n, ts: rec.ts });
    save('ah-queue', queue);
    flush();
  }

  function opName(k, id) {
    if (id.indexOf('hafal:') === 0) { var r = G.READ[id.slice(6)]; return 'Hafalan: ' + (r ? r.label : id.slice(6)); }
    return itemDef(k, id).name;
  }

  // ---------- sinkron Google Sheets ----------
  var syncState = 'wait', syncing = false;
  function connected() { return server ? !!pin : !!sheetUrl; }
  function api(method, body, extra) {
    if (server) {
      var h = { 'x-pin': pin }; if (body) h['Content-Type'] = 'application/json';
      return fetch('/api/sheets' + (extra || ''), { method: method, headers: h, body: body, cache: 'no-store' }).then(function (r) {
        if (r.status === 401) { pinOk = false; askPin('PIN tidak cocok. Coba lagi.'); throw new Error('pin'); }
        return r.json();
      });
    }
    if (method === 'POST') return fetch(sheetUrl, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: body }).then(function (r) { return r.json(); });
    return fetch(sheetUrl + (sheetUrl.indexOf('?') < 0 ? '?' : '&') + 't=' + Date.now()).then(function (r) { return r.json(); });
  }
  function queueAllLocal() {
    Object.keys(data).forEach(function (d) { Object.keys(data[d]).forEach(function (id) {
      if (!knownId(id)) return; var r = data[d][id];
      if (!queue.some(function (o) { return o.date === d && o.id === id; })) queue.push({ date: d, id: id, name: opName(d, id), done: r.d, note: r.n || '', ts: r.ts || Date.now() });
    }); });
    save('ah-queue', queue);
  }
  function flush() {
    if (!connected()) { syncState = 'off'; renderSync(); return Promise.resolve(); }
    if (!queue.length) { syncState = 'ok'; renderSync(); return Promise.resolve(); }
    if (syncing) return Promise.resolve();
    syncing = true; syncState = 'wait'; renderSync();
    var batch = queue.slice();
    return api('POST', JSON.stringify({ ops: batch }))
      .then(function (j) {
        if (!j.ok) throw new Error(j.error || 'gagal');
        queue = queue.filter(function (o) { return !batch.some(function (b) { return b.date === o.date && b.id === o.id && b.ts === o.ts; }); });
        save('ah-queue', queue); syncState = queue.length ? 'wait' : 'ok';
      })
      .catch(function () { syncState = 'wait'; })
      .then(function () { syncing = false; renderSync(); });
  }
  function pull() {
    if (!connected()) return Promise.resolve(false);
    return api('GET')
      .then(function (j) {
        if (!j.ok) throw new Error(j.error || 'gagal');
        var changed = false;
        (j.rows || []).forEach(function (r) {
          var k = r[0], id = r[1]; if (!knownId(id)) return;
          var local = data[k] && data[k][id];
          if (!local || (r[4] || 0) > (local.ts || 0)) {
            data[k] = data[k] || {}; data[k][id] = { d: r[2] ? 1 : 0, n: r[3] || '', ts: r[4] || 0 }; changed = true;
            if (k !== HAFAL_DATE && k < firstDay) { firstDay = k; save('ah-first', firstDay); }
          }
        });
        if (changed) save('ah-data', data);
        return changed;
      });
  }
  function syncAll(showToast) {
    return flush().then(pull).then(function (changed) {
      if (connected() && !queue.length) syncState = 'ok';
      renderSync(); if (changed) render();
      if (showToast) toast('Tersinkron dengan Google Sheets');
    }).catch(function () { syncState = 'wait'; renderSync(); if (showToast) toast('Belum bisa tersambung. Cek sinyal atau link.'); });
  }
  function renderSync() {
    var el = document.querySelector('#view-' + view + ' .sync'); if (!el) return;
    var txt = syncState === 'ok' ? 'Tersimpan di Google Sheets'
      : syncState === 'wait' ? (queue.length ? queue.length + ' perubahan menunggu dikirim' : 'Menyambungkan…')
      : (server ? 'Masukkan PIN untuk menyambungkan' : 'Belum tersambung ke Google Sheets');
    el.className = 'sync ' + syncState;
    el.innerHTML = '<i></i><span>' + txt + '</span>' + (syncState === 'off' ? (server ? ' <button id="enter-pin">Masukkan PIN</button>' : ' <button data-go="settings">Sambungkan</button>') : '');
  }

  // ---------- PIN ----------
  var pinOk = true;
  function askPin(msg) {
    sheetCtx = { type: 'pin' };
    showSheet('<div class="eyebrow" id="sheet-title">Google Sheets</div><h1 style="font-size:26px;margin:0">Masukkan PIN</h1>' +
      '<p class="note">' + esc(msg || 'Data di HP ini kosong. Masukkan PIN untuk menyambungkan lagi ke Google Sheets dan memulihkan riwayat Anda.') + '</p>' +
      '<div class="field"><label for="pin">PIN</label><input id="pin" type="password" inputmode="numeric" autocomplete="current-password" maxlength="32"></div>' +
      '<button class="btn p" id="pin-go">Sambungkan</button><button class="btn s" data-close>Nanti saja</button>');
    setTimeout(function () { var i = $('pin'); if (i) i.focus(); }, 50);
  }
  function tryPin() {
    var v = ($('pin').value || '').trim(); if (!v) return;
    var btn = $('pin-go'); btn.textContent = 'Memeriksa…'; btn.disabled = true;
    fetch('/api/sheets?check=1', { headers: { 'x-pin': v }, cache: 'no-store' }).then(function (r) {
      if (r.status === 401) { askPin('PIN tidak cocok. Coba lagi.'); return; }
      if (!r.ok) throw new Error('x');
      pin = v; save('ah-pin', v); pinOk = true;
      queueAllLocal(); closeSheet();
      syncAll(true);
    }).catch(function () { btn.textContent = 'Sambungkan'; btn.disabled = false; toast('Belum bisa tersambung. Cek sinyal.'); });
  }
  function checkServer() {
    if (location.protocol !== 'https:' && location.hostname !== '127.0.0.1') return Promise.resolve();
    return fetch('/api/sheets?status=1', { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : { configured: false }; })
      .then(function (j) {
        server = !!j.configured; save('ah-server', server);
        if (server && !pin && $('sheet').hidden) askPin();
      }).catch(function () {});
  }

  // ---------- tampilan ----------
  var view = 'today';
  var $ = function (id) { return document.getElementById(id); };
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  function header() {
    var d = new Date(), titles = { today: 'Hari Ini', bacaan: 'Bacaan', panduan: 'Panduan', riwayat: 'Riwayat', settings: 'Pengaturan' };
    $('title').textContent = titles[view];
    var h = hijri(d);
    $('date').textContent = longDate(d) + (h ? ' · ' + h : '');
    $('btn-settings').classList.toggle('on', view === 'settings');
  }

  function rowHtml(k, it) {
    var s = status(k, it.id);
    var tags = '';
    if (it.wajib) tags += '<span class="tag w">Wajib</span>';
    if (s === 'late') tags += '<span class="tag l">Terlewat</span>';
    if (s === 'now') tags += '<span class="tag c">Waktunya</span>';
    var note = data[k] && data[k][it.id] && data[k][it.id].n;
    return '<div class="row ' + s + '">' +
      '<button class="cb" data-toggle="' + it.id + '" data-date="' + k + '" aria-label="Centang ' + esc(it.name) + '"><span>' + (s === 'done' ? '✓' : '') + '</span></button>' +
      '<button class="name" data-open="' + it.id + '" data-date="' + k + '">' + esc(it.name) +
        (it.rakaat ? '<span class="sub-note">' + esc(it.rakaat) + '</span>' : '') +
        (note ? '<span class="sub-note">' + esc(note) + '</span>' : '') + '</button>' +
      (tags ? '<span class="tags">' + tags + '</span>' : '') + '</div>';
  }

  function checklistHtml(k, highlight) {
    var pt = Prayer.times(parse(k)), m = nowMin(), html = '', list = itemsFor(k), fri = isFriday(k);
    GROUPS.forEach(function (g) {
      var items = list.filter(function (i) { return i.group === g.id; });
      if (!items.length) return;
      var done = items.filter(function (i) { return isDone(k, i.id); }).length;
      var isNow = highlight && g.id !== 'harian' && g.id !== 'puasa' && m >= g.start(pt) && m < g.end(pt) && done < items.length;
      var label = (fri && g.fridayTitle ? g.fridayTitle : g.title) + ' · ' + g.when(pt);
      var right = (highlight && m < g.start(pt) && g.id !== 'malam') ? 'belum waktunya' : done + '/' + items.length;
      html += '<div class="group' + (isNow ? ' now' : '') + '" id="g-' + g.id + '"><div class="ghead"><span>' + esc(label) + '</span><span class="n">' + right + '</span></div>' +
        items.map(function (it) { return rowHtml(k, it); }).join('') + '</div>';
    });
    return html;
  }

  function streak(test) {
    var d = new Date(), n = 0, k = key(d);
    if (!test(k)) d = addDays(d, -1);
    while (true) { k = key(d); if (k < firstDay || !test(k)) break; n++; d = addDays(d, -1); }
    return n;
  }
  var allWajib = function (k) { return WAJIB.every(function (id) { return isDone(k, id); }); };
  var tahajudDone = function (k) { return isDone(k, 'tahajud'); };
  var dzikirDone = function (k) { return DZIKIR.every(function (id) { return isDone(k, id); }); };
  var sedekahDone = function (k) { return isDone(k, 'sedekah'); };
  var petangDone = function (k) { return PETANG.every(function (id) { return isDone(k, id); }); };

  function renderToday() {
    var k = todayKey(), st = dayStats(k);
    var wajibDue = WAJIB.filter(function (id) { return status(k, id) !== 'belum'; }).length;
    var tj = streak(tahajudDone);
    $('view-today').innerHTML =
      '<div class="hero"><div class="ring" style="--p:' + Math.round(st.pct * 100) + '"><div><span><b>' + st.done + '/' + st.total + '</b><small>selesai</small></span></div></div>' +
      '<div class="chips"><div>🕌 Sholat wajib <b>' + st.wajib + '/' + (wajibDue || 5) + '</b> ' + (wajibDue < 5 ? 'sejauh ini' : 'hari ini') + '</div>' +
      '<div>🔥 Tahajud <b>' + tj + ' hari</b> berturut-turut</div>' +
      (st.missed.length ? '<div class="miss">● ' + st.missed.length + ' amalan terlewat hari ini</div>' : '<div>✨ Belum ada yang terlewat</div>') +
      '</div></div><div class="sync"></div>' + checklistHtml(k, true);
    renderSync();
  }

  function renderBacaan() {
    var pt = Prayer.times(new Date());
    var html = '<p class="note">Ketuk "Buka" untuk menandai selesai atau memakai penghitung dzikir. Kalau berjamaah sebagai makmum, tambahkan <i>ma\'muuman</i> sebelum <i>lillaahi ta\'aalaa</i>.</p>';
    var tk = todayKey(), dow = new Date().getDay();
    GROUPS.forEach(function (g) {
      html += '<div class="read-group" id="r-' + g.id + '"><h2>' + esc(g.title) + '<small>' + esc(g.when(pt)) + '</small></h2>';
      ITEMS.filter(function (i) { return i.group === g.id; }).forEach(function (it) {
        if (it.phases) {
          html += '<div class="part"><span class="label">' + esc(it.name) + '</span><p class="arti">Istighfar, doa keselamatan, Ayat Kursi, tasbih-tahmid-takbir 33×, dan penutup.</p>' +
            '<div class="btn-row"><button class="open-btn" data-open="' + it.id + '" data-date="' + tk + '">Buka penghitung</button><button class="open-btn" data-guide="dzikir">Lihat bacaan lengkap</button></div></div>';
          return;
        }
        var parts = it.parts.slice();
        if (it.friday) parts = parts.concat(it.friday.parts.map(function (p) { return { label: 'Hari Jumat · ' + p.label, lafaz: p.lafaz, arti: p.arti, note: p.note }; }));
        var today = !it.days || it.days.indexOf(dow) >= 0;
        parts.forEach(function (p, idx) {
          html += '<div class="part"><span class="label">' + esc(p.label) + (it.rakaat && idx === 0 ? ' · ' + esc(it.rakaat) : '') + '</span>' +
            (it.id === 'sedekah' || it.id === 'kahfi' ? '' : '<p class="lafaz">' + esc(p.lafaz) + '</p>') +
            '<p class="arti">' + esc(p.arti) + '</p>' + (p.note ? '<p class="note">' + esc(p.note) + '</p>' : '') +
            (idx === parts.length - 1 ? '<div class="btn-row">' +
              (today ? '<button class="open-btn" data-open="' + it.id + '" data-date="' + tk + '">' + (it.count ? 'Buka penghitung' : 'Buka') + '</button>' : '') +
              (it.link ? '<a class="open-btn" href="' + it.link + '" target="_blank" rel="noopener">Buka surat (latin + arti)</a>' : '') +
              (it.guide ? '<button class="open-btn" data-guide="sholat" data-sholat="' + it.guide + '">Panduan sholat</button>' : '') + '</div>' : '') + '</div>';
        });
      });
      html += '</div>';
    });
    $('view-bacaan').innerHTML = html;
  }

  // ---------- panduan ----------
  var gTab = load('ah-gtab', 'sholat'), gSholat = 'subuh', qunut = load('ah-qunut', true), hafalMode = false, revealed = {};
  function hafal(key) { return isDone(HAFAL_DATE, 'hafal:' + key); }
  function readBlock(key, opts) {
    var r = G.READ[key]; opts = opts || {};
    var blur = hafalMode && !revealed[key];
    var canHafal = G.HAFALAN.indexOf(key) >= 0;
    return '<div class="read' + (blur ? ' hide' : '') + '">' + (opts.noLabel ? '' : '<span class="label">' + esc(r.label) + '</span>') +
      '<p class="lafaz" data-reveal="' + key + '">' + esc(r.lafaz) + '</p>' +
      (blur ? '<p class="note">Ketuk untuk melihat bacaan</p>' : '') +
      '<p class="arti">' + esc(r.arti) + '</p>' + (r.note ? '<p class="note">' + esc(r.note) + '</p>' : '') +
      (canHafal ? '<button class="hafal-btn' + (hafal(key) ? ' on' : '') + '" data-hafal="' + key + '">' + (hafal(key) ? '✓ Sudah hafal' : 'Tandai sudah hafal') + '</button>' : '') + '</div>';
  }
  function renderPanduan() {
    var hafalCount = G.HAFALAN.filter(hafal).length;
    var html = '<div class="seg">' + [['sholat', 'Sholat'], ['wudhu', 'Wudhu'], ['dzikir', 'Dzikir']].map(function (t) {
      return '<button class="' + (gTab === t[0] ? 'on' : '') + '" data-gtab="' + t[0] + '">' + t[1] + '</button>'; }).join('') + '</div>' +
      '<div class="hafal-bar"><button class="switch' + (hafalMode ? ' on' : '') + '" id="hafal-mode" role="switch" aria-checked="' + hafalMode + '"><i></i></button>' +
      '<div><b>Mode hafalan</b><span>Sembunyikan bacaan latin untuk menguji hafalan · ' + hafalCount + '/' + G.HAFALAN.length + ' sudah hafal</span></div></div>';

    if (gTab === 'sholat') {
      var sh = G.SHOLAT.filter(function (x) { return x.id === gSholat; })[0];
      html += '<div class="chips-row">' + G.SHOLAT.map(function (x) {
        return '<button class="chip' + (x.id === gSholat ? ' on' : '') + '" data-sholat="' + x.id + '">' + x.name + ' <small>' + x.n + '</small></button>'; }).join('') + '</div>';
      if (sh.id === 'subuh') html += '<label class="check-row"><input type="checkbox" id="qunut"' + (qunut ? ' checked' : '') + '> Pakai doa qunut di rakaat ke-2</label>';
      html += '<p class="note">' + (sh.jahr ? 'Al-Fatihah dan surat di rakaat 1–2 dibaca keras kalau sholat sendiri atau menjadi imam; rakaat 3–4 dibaca pelan.' : sh.id === 'sunnah' ? 'Sholat sunnah dikerjakan 2 rakaat sekali salam dan dibaca pelan. Niatnya ada di tab Bacaan.' : 'Semua bacaan dibaca pelan.') +
        ' Panduan ini untuk belajar dan menghafal sebelum sholat.</p>';
      var seq = G.sequence(sh.n, sh.id === 'subuh' && qunut), seen = {};
      seq.forEach(function (steps, i) {
        html += '<div class="card rakaat"><h3>Rakaat ' + (i + 1) + (i === seq.length - 1 ? ' <small>terakhir</small>' : '') + '</h3><ol class="gsteps">';
        steps.forEach(function (sid) {
          var g = G.GERAK[sid], body = '';
          if (sid === 'niat') {
            if (sh.item) { var p = ITEM[sh.item].parts[0]; body = '<div class="read"><p class="lafaz">' + esc(p.lafaz) + '</p><p class="arti">' + esc(p.arti) + '</p></div>'; }
            else body = '<p class="note">Niat sesuai sholat sunnah yang dikerjakan (lihat tab Bacaan).</p>';
          } else if (g.surat) {
            body = ['ikhlas', 'falaq', 'nas', 'kafirun'].map(function (s) {
              return '<details' + (!seen['s_' + s] && s === 'ikhlas' && i === 0 ? ' open' : '') + '><summary>' + esc(G.READ[s].label) + (hafal(s) ? ' ✓' : '') + '</summary>' + readBlock(s, { noLabel: true }) + '</details>';
            }).join('');
            seen.s_ikhlas = true;
          } else if (g.read) {
            if (seen[g.read]) body = '<details><summary>' + esc(G.READ[g.read].label) + ' · sama seperti sebelumnya</summary>' + readBlock(g.read, { noLabel: true }) + '</details>';
            else { body = readBlock(g.read); seen[g.read] = true; }
          }
          html += '<li><b>' + esc(g.name) + '</b><span class="how">' + esc(g.how) + '</span>' + body + '</li>';
        });
        html += '</ol></div>';
      });
      html += '<p class="note" style="margin-top:12px">Setelah salam, lanjutkan dengan dzikir setelah sholat (tab Dzikir).</p>';
    }

    if (gTab === 'wudhu') {
      html += '<div class="card"><h3>Urutan wudhu</h3><ol class="gsteps">' + G.WUDHU.map(function (w) {
        return '<li><b>' + esc(w.name) + '</b>' + (w.wajib ? '<span class="tag w" style="margin-left:0;align-self:flex-start">Wajib</span>' : '<span class="how">Sunnah</span>') + (w.read ? readBlock(w.read) : '') + '</li>';
      }).join('') + '</ol><p class="note">Urutannya harus tertib. Yang bertanda wajib tidak boleh terlewat.</p></div>' +
        '<div class="card"><h3>Yang membatalkan wudhu</h3><ul class="plain">' + G.PEMBATAL.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></div>';
    }

    if (gTab === 'dzikir') {
      var parts = ITEM.dzikir_subuh.parts;
      html += '<div class="card"><h3>Dzikir setelah sholat wajib</h3><p class="note">Dibaca setelah salam di setiap sholat wajib. Penghitung 33× ada di checklist Hari Ini (ketuk "Dzikir setelah …").</p><ol class="gsteps">' +
        '<li><b>' + esc(parts[0].label) + '</b><div class="read"><p class="lafaz">' + esc(parts[0].lafaz) + '</p><p class="arti">' + esc(parts[0].arti) + '</p></div></li>' +
        '<li><b>' + esc(parts[1].label) + '</b>' + readBlock('dz_salam', { noLabel: true }) + '</li>' +
        '<li><b>' + esc(parts[2].label) + '</b>' + readBlock('dz_kursi', { noLabel: true }) + '</li>' +
        '<li><b>' + esc(parts[3].label) + '</b><div class="read"><p class="lafaz">' + esc(parts[3].lafaz) + '</p><p class="arti">' + esc(parts[3].arti) + '</p></div></li>' +
        '<li><b>' + esc(parts[4].label) + '</b>' + readBlock('dz_penutup', { noLabel: true }) + '</li></ol></div>';
    }
    $('view-panduan').innerHTML = html;
  }

  var weekOffset = 0, monthOffset = 0;
  function mondayOf(d) { var x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); var dow = (x.getDay() + 6) % 7; return addDays(x, -dow); }
  function renderRiwayat() {
    var today = new Date(), tk = todayKey();
    var mon = addDays(mondayOf(today), weekOffset * 7), days = [];
    for (var i = 0; i < 7; i++) days.push(addDays(mon, i));
    var counted = days.filter(function (d) { var k = key(d); return k >= firstDay && k <= tk; });
    var sum = function (fn) { return counted.reduce(function (a, d) { return a + fn(key(d)); }, 0); };
    var wajibDone = sum(function (k) { return WAJIB.filter(function (id) { return isDone(k, id); }).length; });
    var miss = {};
    counted.forEach(function (d) { dayStats(key(d)).missed.forEach(function (id) { miss[id] = (miss[id] || 0) + 1; }); });
    var top = Object.keys(miss).sort(function (a, b) { return miss[b] - miss[a]; }).slice(0, 3);
    var bars = days.map(function (d) {
      var k = key(d), inRange = k >= firstDay && k <= tk, p = inRange ? dayStats(k).pct : 0;
      return '<div class="bar' + (k === tk ? ' today' : '') + (inRange ? '' : ' empty') + '"><span class="v">' + (inRange ? Math.round(p * 100) + '%' : '') + '</span>' +
        '<i style="height:' + Math.max(2, Math.round(p * 86)) + 'px"></i><span>' + HARI3[d.getDay()] + '</span></div>';
    }).join('');
    var n = counted.length || 1, end = days[6];
    var weekLabel = weekOffset === 0 ? 'Minggu ini' : (weekOffset === -1 ? 'Minggu lalu' : 'Minggu');
    var range = mon.getDate() + (mon.getMonth() !== end.getMonth() ? ' ' + BULAN[mon.getMonth()].slice(0, 3) : '') + '–' + end.getDate() + ' ' + BULAN[end.getMonth()].slice(0, 3);
    var html = '<div class="card"><div class="week-nav"><button class="nav-btn" data-week="-1" aria-label="Minggu sebelumnya">‹</button><h3>' + weekLabel + ' · ' + range + '</h3>' +
      '<button class="nav-btn" data-week="1" aria-label="Minggu berikutnya"' + (weekOffset >= 0 ? ' disabled' : '') + '>›</button></div>' +
      '<div class="bars">' + bars + '</div>' +
      '<div class="stats"><div class="stat"><b>' + wajibDone + '/' + (counted.length * 5) + '</b>Sholat wajib</div>' +
      '<div class="stat"><b>' + sum(function (k) { return tahajudDone(k) ? 1 : 0; }) + '/' + counted.length + '</b>Tahajud</div>' +
      '<div class="stat"><b>' + sum(function (k) { return DZ_SHOLAT.filter(function (id) { return isDone(k, id); }).length; }) + '/' + (counted.length * 5) + '</b>Dzikir setelah sholat</div>' +
      '<div class="stat"><b>' + sum(function (k) { return dzikirDone(k) ? 1 : 0; }) + '/' + counted.length + '</b>Dzikir pagi lengkap</div>' +
      '<div class="stat"><b>' + sum(function (k) { return petangDone(k) ? 1 : 0; }) + '/' + counted.length + '</b>Dzikir petang lengkap</div>' +
      '<div class="stat"><b>' + sum(function (k) { return sedekahDone(k) ? 1 : 0; }) + '/' + counted.length + '</b>Sedekah</div></div>' +
      '<div class="missed">' + (top.length ? 'Paling sering terlewat: ' + top.map(function (id) { return '<span>' + esc(ITEM[id].name) + ' (' + miss[id] + '×)</span>'; }).join(', ') : (counted.length ? 'Belum ada yang terlewat minggu ini.' : 'Belum ada data untuk minggu ini.')) + '</div></div>';

    html += '<div class="card"><h3>Rangkaian berturut-turut</h3><div class="streaks">' +
      '<div class="stat"><b>' + streak(allWajib) + ' hari</b>Sholat 5 waktu lengkap</div>' +
      '<div class="stat"><b>' + streak(tahajudDone) + ' hari</b>Tahajud</div>' +
      '<div class="stat"><b>' + streak(dzikirDone) + ' hari</b>Dzikir pagi lengkap</div>' +
      '<div class="stat"><b>' + streak(petangDone) + ' hari</b>Dzikir petang lengkap</div>' +
      '<div class="stat"><b>' + streak(sedekahDone) + ' hari</b>Sedekah</div>' +
      '<div class="stat"><b>' + G.HAFALAN.filter(hafal).length + '/' + G.HAFALAN.length + '</b>Bacaan sudah hafal</div></div></div>';

    var base = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
    var startPad = (base.getDay() + 6) % 7, dim = new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate();
    var cal = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map(function (h) { return '<span class="h">' + h + '</span>'; }).join('');
    for (var p = 0; p < startPad; p++) cal += '<span></span>';
    for (var dd = 1; dd <= dim; dd++) {
      var dk = key(new Date(base.getFullYear(), base.getMonth(), dd)), cls = 'd';
      if (dk > tk) cls += ' future';
      else if (dk >= firstDay) { var pc = dayStats(dk).pct; cls += pc === 0 ? '' : pc < .4 ? ' l1' : pc < .7 ? ' l2' : pc < 1 ? ' l3' : ' l4'; }
      if (dk === tk) cls += ' today';
      cal += dk > tk ? '<span class="' + cls + '">' + dd + '</span>' : '<button class="' + cls + '" data-day="' + dk + '">' + dd + '</button>';
    }
    html += '<div class="card"><div class="month-nav"><button class="nav-btn" data-month="-1" aria-label="Bulan sebelumnya">‹</button><h3>' + BULAN[base.getMonth()] + ' ' + base.getFullYear() + '</h3>' +
      '<button class="nav-btn" data-month="1" aria-label="Bulan berikutnya"' + (monthOffset >= 0 ? ' disabled' : '') + '>›</button></div>' +
      '<div class="cal">' + cal + '</div><div class="legend">sedikit <i style="background:var(--l1)"></i><i style="background:var(--l2)"></i><i style="background:var(--l3)"></i><i style="background:var(--l4)"></i> lengkap</div>' +
      '<p class="hint">Ketuk tanggal untuk melihat dan mengubah amalan hari itu.</p></div>';
    $('view-riwayat').innerHTML = html;
  }

  var scriptCode = '';
  function renderSettings() {
    var pt = Prayer.times(new Date());
    var html;
    if (server) {
      html = '<div class="card"><h3>Google Sheets</h3><div class="stack">' +
        '<div class="sync"></div>' +
        '<p class="note">Link Google Sheets tersimpan aman di Vercel. Kalau data Safari dihapus, aplikasi cukup meminta PIN Anda, lalu semua riwayat kembali.</p>' +
        (pin ? '<button class="btn s" id="sync-now">Sinkronkan sekarang</button><button class="btn s" id="enter-pin">Ganti PIN di HP ini</button>'
             : '<button class="btn p" id="enter-pin">Masukkan PIN</button>') +
        '</div></div>';
    } else {
      html = '<div class="card"><h3>Google Sheets</h3><div class="stack">' +
        '<div class="sync"></div>' +
        '<p class="note"><b style="color:var(--gold)">Supaya tidak perlu menempel link lagi setelah data Safari dihapus:</b> di Vercel buka proyek <b>amalan-harian</b> → <b>Settings → Environment Variables</b>. Tambahkan <b>SHEET_URL</b> berisi link Apps Script (berakhiran /exec) dan <b>APP_PIN</b> berisi PIN pilihan Anda. Lalu buka <b>Deployments</b> → titik tiga di deployment teratas → <b>Redeploy</b>.</p>' +
        '<div class="field"><label for="url">Atau tempel link Apps Script di sini (cara lama)</label><input id="url" type="url" inputmode="url" autocomplete="off" placeholder="https://script.google.com/macros/s/…/exec" value="' + esc(sheetUrl) + '"></div>' +
        '<button class="btn p" id="save-url">Simpan &amp; sambungkan</button>' +
        (sheetUrl ? '<button class="btn s" id="sync-now">Sinkronkan sekarang</button>' : '') +
        '</div></div>';
    }
    html += '<div class="card"><h3>Cara membuat Google Sheet</h3><ol class="steps">' +
      '<li>Buka <b>sheets.new</b> di Safari untuk membuat Google Sheet baru, beri nama <b>Amalan Harian</b>.</li>' +
      '<li>Di Safari, ketuk <b>aA</b> → <b>Minta Situs Web Desktop</b>.</li>' +
      '<li>Buka menu <b>Ekstensi → Apps Script</b>.</li>' +
      '<li>Hapus isi yang ada, lalu tempel kode di bawah (tombol <b>Salin kode</b>). Simpan.</li>' +
      '<li>Klik <b>Terapkan → Deployment baru</b>. Pilih jenis <b>Aplikasi web</b>. Jalankan sebagai: <b>Saya</b>. Yang memiliki akses: <b>Siapa saja</b>. Klik <b>Terapkan</b>.</li>' +
      '<li>Izinkan akses: pilih akun Anda → <b>Lanjutan</b> → <b>Buka Amalan Harian (tidak aman)</b> → <b>Izinkan</b>. Ini aman karena kodenya milik Anda sendiri.</li>' +
      '<li>Salin <b>URL aplikasi web</b> (berakhiran /exec), lalu simpan di Vercel sebagai <b>SHEET_URL</b>.</li></ol>' +
      '<div class="stack" style="margin-top:12px"><button class="btn s" id="copy-code">Salin kode</button><div class="code-box" id="code-box">Memuat kode…</div></div></div>';
    html += '<div class="card"><h3>Jadwal sholat hari ini</h3><div class="times">' +
      [['Subuh', pt.subuh], ['Terbit', pt.terbit], ['Zuhur', pt.zuhur], ['Ashar', pt.ashar], ['Maghrib', pt.maghrib], ['Isya', pt.isya]].map(function (x) { return '<div><b>' + Prayer.hhmm(x[1]) + '</b>' + x[0] + '</div>'; }).join('') +
      '</div><p class="hint">Dihitung otomatis untuk Tanjung Morawa dengan metode Kemenag. Bisa berbeda ±1 menit dari jadwal resmi.</p></div>';
    $('view-settings').innerHTML = html;
    renderSync();
    var box = $('code-box');
    if (scriptCode) box.textContent = scriptCode;
    else fetch('apps-script.gs').then(function (r) { return r.text(); }).then(function (t) { scriptCode = t; box.textContent = t; }).catch(function () { box.textContent = 'Kode tidak bisa dimuat. Buka file apps-script.gs di GitHub.'; });
  }

  function render() {
    header();
    ['today', 'bacaan', 'panduan', 'riwayat', 'settings'].forEach(function (v) { $('view-' + v).hidden = v !== view; });
    document.querySelectorAll('.tab').forEach(function (t) { t.classList.toggle('on', t.dataset.view === view); });
    if (view === 'today') renderToday();
    if (view === 'bacaan') renderBacaan();
    if (view === 'panduan') renderPanduan();
    if (view === 'riwayat') renderRiwayat();
    if (view === 'settings') renderSettings();
  }
  function go(v, scroll) {
    view = v; render();
    if (scroll === false) return;
    window.scrollTo(0, 0);
    if (v === 'today') { var now = document.querySelector('.group.now'); if (now) now.scrollIntoView({ block: 'start' }); }
  }

  // ---------- lembar detail ----------
  var sheetCtx = null;
  function counterHtml(it, c) {
    var sub;
    if (it.phases) {
      var left = c, ph = it.phases[0], idx = 0;
      while (idx < it.phases.length - 1 && left >= it.phases[idx][0]) { left -= it.phases[idx][0]; idx++; }
      ph = it.phases[idx];
      sub = (c >= it.count ? 'selesai · ' : Math.min(left, ph[0]) + '/' + ph[0] + ' · ') + ph[1];
    } else sub = 'dari ' + it.count + ' · ketuk';
    return '<b id="cnum">' + c + '</b><small id="csub">' + esc(sub) + '</small>';
  }
  function openItem(id, k) {
    var it = itemDef(k, id); sheetCtx = { type: 'item', id: id, date: k };
    var done = isDone(k, id), g = groupOf(id), isToday = k === todayKey();
    var html = '<div class="eyebrow" id="sheet-title">' + esc(g.title) + ' · ' + esc(it.name) + (it.rakaat ? ' · ' + esc(it.rakaat) : '') + (isToday ? '' : ' · ' + esc(longDate(parse(k)))) + '</div>';
    it.parts.forEach(function (p) {
      html += '<div class="part">' + (it.parts.length > 1 ? '<span class="label">' + esc(p.label) + '</span>' : '') +
        (it.id === 'kahfi' || it.id === 'sedekah' ? '<p class="lafaz">' + esc(p.label) + '</p>' : '<p class="lafaz">' + esc(p.lafaz) + '</p>') +
        '<p class="arti">' + esc(p.arti) + '</p>' + (p.note ? '<p class="note">' + esc(p.note) + '</p>' : '') + '</div>';
    });
    if (it.count && isToday) {
      var c = (counts[k] && counts[k][id]) || 0;
      html += '<div class="counter"><button class="round" id="round" style="--p:' + Math.min(100, c / it.count * 100) + '" aria-label="Tambah hitungan"><div>' + counterHtml(it, c) + '</div></button>' +
        '<div class="row-btns"><button class="mini" id="cminus">− 1</button><button class="mini" id="creset">Ulang</button></div>' +
        '<p class="note">Otomatis tercentang saat mencapai ' + it.count + (it.phases ? ' (33 + 33 + 33)' : '') + '.</p></div>';
    }
    if (it.link) html += '<a class="btn s" href="' + it.link + '" target="_blank" rel="noopener">Buka Surat Al-Kahfi (latin + arti)</a>';
    if (it.guide && !(ITEM[id].friday && isFriday(k))) html += '<button class="btn s" data-guide="sholat" data-sholat="' + it.guide + '">Lihat panduan sholat ' + esc(it.rakaat) + '</button>';
    if (it.noteField) {
      var nv = (data[k] && data[k][id] && data[k][id].n) || '';
      html += '<div class="field"><label for="note">Catatan (opsional)</label><textarea id="note" placeholder="Misalnya: kotak amal masjid">' + esc(nv) + '</textarea></div>';
    }
    html += done ? '<button class="btn r" id="mark">Batalkan centang</button>' : '<button class="btn p" id="mark">✓ Tandai selesai</button>';
    html += '<button class="btn s" data-close>Tutup</button>';
    showSheet(html);
  }
  function openDay(k) {
    if (k === todayKey()) { go('today'); return; }
    sheetCtx = { type: 'day', date: k };
    var st = dayStats(k);
    var html = '<div class="eyebrow" id="sheet-title">Riwayat</div><h1 style="font-size:26px;margin:0">' + esc(longDate(parse(k))) + '</h1>' +
      '<p class="note">' + st.done + ' dari ' + st.total + ' selesai · ' + st.wajib + '/5 sholat wajib' + (st.missed.length ? ' · ' + st.missed.length + ' terlewat' : '') + '. Centang kalau ternyata sudah dikerjakan atau diqadha.</p>' +
      '<div>' + checklistHtml(k, false) + '</div><button class="btn s" data-close>Tutup</button>';
    showSheet(html);
  }
  function showSheet(html) { $('sheet-body').innerHTML = html; $('sheet').hidden = false; document.body.style.overflow = 'hidden'; }
  function closeSheet() { $('sheet').hidden = true; document.body.style.overflow = ''; sheetCtx = null; render(); }

  function bump(delta, reset) {
    var c = sheetCtx, it = itemDef(c.date, c.id), k = c.date;
    counts = load('ah-count', counts);
    Object.keys(counts).forEach(function (d) { if (d < key(addDays(new Date(), -7))) delete counts[d]; });
    counts[k] = counts[k] || {};
    var v = reset ? 0 : Math.max(0, (counts[k][c.id] || 0) + delta);
    counts[k][c.id] = v; save('ah-count', counts);
    $('round').firstChild.innerHTML = counterHtml(it, v); $('round').style.setProperty('--p', Math.min(100, v / it.count * 100));
    if (delta > 0 && v === it.count && !isDone(k, c.id)) { setDone(k, c.id, true); toast('Alhamdulillah, ' + it.name + ' selesai'); openItem(c.id, k); }
  }

  function toast(msg) {
    var t = $('toast'); t.textContent = msg; t.hidden = false;
    clearTimeout(toast._t); toast._t = setTimeout(function () { t.hidden = true; }, 2200);
  }

  function renderPanduanKeep() { var y = window.scrollY; renderPanduan(); window.scrollTo(0, y); }
  document.addEventListener('change', function (e) {
    if (e.target && e.target.id === 'qunut') { qunut = e.target.checked; save('ah-qunut', qunut); renderPanduanKeep(); }
  });

  // ---------- event ----------
  document.addEventListener('click', function (e) {
    var el = e.target.closest('button, [data-close], [data-reveal]'); if (!el) return;
    if (el.dataset.reveal) { if (hafalMode) { revealed[el.dataset.reveal] = !revealed[el.dataset.reveal]; renderPanduanKeep(); } return; }
    if (el.hasAttribute('data-close')) { closeSheet(); return; }
    if (el.dataset.view) { go(el.dataset.view); return; }
    if (el.dataset.go) { go(el.dataset.go); return; }
    if (el.id === 'btn-settings') { go(view === 'settings' ? 'today' : 'settings'); return; }
    if (el.dataset.toggle) {
      var k = el.dataset.date, id = el.dataset.toggle, nowDone = !isDone(k, id);
      setDone(k, id, nowDone);
      if (sheetCtx && sheetCtx.type === 'day') openDay(k); else render();
      if (nowDone && id === 'isya' && WAJIB.every(function (w) { return isDone(k, w); })) toast('Alhamdulillah, sholat 5 waktu lengkap');
      return;
    }
    if (el.dataset.open) { openItem(el.dataset.open, el.dataset.date); return; }
    if (el.dataset.guide) {
      if (!$('sheet').hidden) { $('sheet').hidden = true; document.body.style.overflow = ''; sheetCtx = null; }
      gTab = el.dataset.guide; save('ah-gtab', gTab); if (el.dataset.sholat) gSholat = el.dataset.sholat; go('panduan'); return;
    }
    if (el.dataset.gtab) { gTab = el.dataset.gtab; save('ah-gtab', gTab); renderPanduan(); return; }
    if (el.dataset.sholat) { gSholat = el.dataset.sholat; renderPanduanKeep(); return; }
    if (el.id === 'hafal-mode') { hafalMode = !hafalMode; revealed = {}; renderPanduanKeep(); return; }
    if (el.dataset.hafal) { var hk = el.dataset.hafal; setDone(HAFAL_DATE, 'hafal:' + hk, !hafal(hk)); if (hafal(hk)) toast('Alhamdulillah, tercatat sudah hafal'); renderPanduanKeep(); return; }
    if (el.dataset.day) { openDay(el.dataset.day); return; }
    if (el.dataset.week) { weekOffset = Math.min(0, weekOffset + +el.dataset.week); renderRiwayat(); return; }
    if (el.dataset.month) { monthOffset = Math.min(0, monthOffset + +el.dataset.month); renderRiwayat(); return; }
    if (el.id === 'round') { bump(1); return; }
    if (el.id === 'cminus') { bump(-1); return; }
    if (el.id === 'creset') { bump(0, true); return; }
    if (el.id === 'mark' && sheetCtx) {
      var c = sheetCtx, noteEl = $('note');
      setDone(c.date, c.id, !isDone(c.date, c.id), noteEl ? noteEl.value.trim() : undefined);
      closeSheet(); return;
    }
    if (el.id === 'save-url') {
      var v = $('url').value.trim();
      if (v && !/^https:\/\/script\.google(usercontent)?\.com\//.test(v)) { toast('Link harus diawali https://script.google.com/'); return; }
      sheetUrl = v; save('ah-url', v);
      if (v) { queueAllLocal(); syncAll(true).then(renderSettings); }
      else { syncState = 'off'; renderSettings(); }
      return;
    }
    if (el.id === 'enter-pin') { askPin('Masukkan PIN yang Anda simpan di Vercel (APP_PIN).'); return; }
    if (el.id === 'pin-go') { tryPin(); return; }
    if (el.id === 'sync-now') { syncAll(true); return; }
    if (el.id === 'copy-code') {
      var txt = scriptCode;
      if (navigator.clipboard && txt) navigator.clipboard.writeText(txt).then(function () { toast('Kode tersalin'); }, selectCode);
      else selectCode();
      return;
    }
  });
  function selectCode() { var r = document.createRange(); r.selectNodeContents($('code-box')); var s = getSelection(); s.removeAllRanges(); s.addRange(r); toast('Kode terpilih, ketuk Salin'); }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !$('sheet').hidden) closeSheet();
    if (e.key === 'Enter' && e.target && e.target.id === 'pin') tryPin();
  });

  // perbarui status tiap menit & saat aplikasi dibuka lagi
  var lastDay = todayKey();
  setInterval(function () {
    if (!$('sheet').hidden) return;
    if (todayKey() !== lastDay) { lastDay = todayKey(); weekOffset = 0; monthOffset = 0; }
    if (view === 'today') { var y = window.scrollY; render(); window.scrollTo(0, y); }
  }, 60000);
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') { if ($('sheet').hidden) render(); syncAll(false); }
  });
  window.addEventListener('online', function () { syncAll(false); });

  // mulai
  // #today, #bacaan, #riwayat, #settings, atau #subuh dll (langsung ke bacaan waktu itu)
  function route() {
    var h = (location.hash || '').replace('#', '');
    var g = GROUPS.filter(function (x) { return x.id === h; })[0];
    if (g) { if (!$('sheet').hidden) closeSheet(); go('bacaan', false); var el = $('r-' + g.id); if (el) el.scrollIntoView(); return; }
    go(['today', 'bacaan', 'panduan', 'riwayat', 'settings'].indexOf(h) >= 0 ? h : view);
  }
  window.addEventListener('hashchange', route);
  route();
  checkServer().then(function () { syncAll(false); });

  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(function () {});
})();
