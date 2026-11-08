// Perhitungan waktu sholat (metode Kemenag RI: Subuh 20°, Isya 18°, Ashar mazhab Syafi'i,
// ihtiyat +2 menit). Lokasi: Tanjung Morawa, Deli Serdang.
(function (root) {
  var LOC = { lat: 3.5194, lng: 98.7808, tz: 7 };
  var IHTIYAT = 2; // menit

  var rad = function (d) { return d * Math.PI / 180; };
  var deg = function (r) { return r * 180 / Math.PI; };
  var fix = function (a, b) { a = a - b * Math.floor(a / b); return a < 0 ? a + b : a; };

  function julian(y, m, d) {
    if (m <= 2) { y -= 1; m += 12; }
    var A = Math.floor(y / 100), B = 2 - A + Math.floor(A / 4);
    return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + B - 1524.5;
  }

  function sun(jd) {
    var D = jd - 2451545.0;
    var g = fix(357.529 + 0.98560028 * D, 360);
    var q = fix(280.459 + 0.98564736 * D, 360);
    var L = fix(q + 1.915 * Math.sin(rad(g)) + 0.020 * Math.sin(rad(2 * g)), 360);
    var e = 23.439 - 0.00000036 * D;
    var RA = fix(deg(Math.atan2(Math.cos(rad(e)) * Math.sin(rad(L)), Math.cos(rad(L)))) / 15, 24);
    return { decl: deg(Math.asin(Math.sin(rad(e)) * Math.sin(rad(L)))), eqt: q / 15 - RA };
  }

  // Mengembalikan menit sejak tengah malam (waktu lokal WIB)
  function times(date) {
    var lat = LOC.lat, lng = LOC.lng, tz = LOC.tz;
    var jd = julian(date.getFullYear(), date.getMonth() + 1, date.getDate()) - lng / (15 * 24);
    function noon(t) { return fix(12 - sun(jd + t).eqt, 24); }
    function angleTime(angle, t, before) {
      var decl = sun(jd + t).decl, n = noon(t);
      var x = (-Math.sin(rad(angle)) - Math.sin(rad(decl)) * Math.sin(rad(lat))) /
              (Math.cos(rad(decl)) * Math.cos(rad(lat)));
      var T = deg(Math.acos(Math.max(-1, Math.min(1, x)))) / 15;
      return n + (before ? -T : T);
    }
    function asr(t) {
      var decl = sun(jd + t).decl;
      var angle = -deg(Math.atan(1 / (1 + Math.tan(rad(Math.abs(lat - decl))))));
      return angleTime(angle, t, false);
    }
    var adj = tz - lng / 15;
    var raw = {
      subuh: angleTime(20, 5 / 24, true),
      terbit: angleTime(0.833, 6 / 24, true),
      zuhur: noon(12 / 24),
      ashar: asr(13 / 24),
      maghrib: angleTime(0.833, 18 / 24, false),
      isya: angleTime(18, 18 / 24, false)
    };
    var out = {};
    Object.keys(raw).forEach(function (k) {
      var m = (raw[k] + adj) * 60;
      m = k === 'terbit' ? Math.floor(m) - IHTIYAT : Math.ceil(m) + IHTIYAT;
      out[k] = m;
    });
    out.dhuha = out.terbit + 15;
    return out;
  }

  function hhmm(min) {
    var h = Math.floor(min / 60), m = Math.round(min % 60);
    return (h < 10 ? '0' : '') + h + '.' + (m < 10 ? '0' : '') + m;
  }

  root.Prayer = { times: times, hhmm: hhmm, LOC: LOC };
  if (typeof module !== 'undefined') module.exports = root.Prayer;
})(typeof window !== 'undefined' ? window : globalThis);
