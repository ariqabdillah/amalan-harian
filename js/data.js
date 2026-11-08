// Daftar amalan harian: kelompok waktu + item checklist + bacaan (latin & arti)
(function (root) {
  // start/end: fungsi yang menerima jadwal sholat hari itu (menit) dan mengembalikan menit
  var GROUPS = [
    { id: 'malam', title: 'Taubat & Tahajud', when: function () { return '03.45'; },
      start: function () { return 0; }, end: function (t) { return t.subuh; } },
    { id: 'puasa', title: 'Puasa Sunnah', when: function () { return 'sampai Maghrib'; },
      start: function () { return 0; }, end: function (t) { return t.maghrib; } },
    { id: 'subuh', title: 'Subuh', when: function (t) { return Prayer.hhmm(t.subuh); },
      start: function (t) { return t.subuh; }, end: function (t) { return t.terbit; } },
    { id: 'dzikir', title: 'Dzikir Pagi', when: function () { return 'setelah Subuh'; },
      start: function (t) { return t.subuh; }, end: function (t) { return t.zuhur; } },
    { id: 'dhuha', title: 'Dhuha', when: function (t) { return Prayer.hhmm(t.dhuha); },
      start: function (t) { return t.dhuha; }, end: function (t) { return t.zuhur; } },
    { id: 'zuhur', title: 'Zuhur', fridayTitle: 'Jumat', when: function (t) { return Prayer.hhmm(t.zuhur); },
      start: function (t) { return t.zuhur; }, end: function (t) { return t.ashar; } },
    { id: 'ashar', title: 'Ashar', when: function (t) { return Prayer.hhmm(t.ashar); },
      start: function (t) { return t.ashar; }, end: function (t) { return t.maghrib; } },
    { id: 'petang', title: 'Dzikir Petang', when: function () { return 'setelah Ashar'; },
      start: function (t) { return t.ashar; }, end: function (t) { return t.maghrib; } },
    { id: 'maghrib', title: 'Maghrib', when: function (t) { return Prayer.hhmm(t.maghrib); },
      start: function (t) { return t.maghrib; }, end: function (t) { return t.isya; } },
    { id: 'isya', title: 'Isya', when: function (t) { return Prayer.hhmm(t.isya); },
      start: function (t) { return t.isya; }, end: function () { return 1440; } },
    { id: 'harian', title: 'Sepanjang Hari', when: function () { return 'kapan saja'; },
      start: function () { return 0; }, end: function () { return 1440; } }
  ];

  // ---- bacaan yang dipakai berulang ----
  var SAYYIDUL = { label: 'Sayyidul Istighfar (1×)', lafaz: "Allohumma anta robbii, laa ilaaha illaa anta, kholaqtanii wa ana 'abduka, wa ana 'alaa 'ahdika wa wa'dika mastatho'tu, a'uudzu bika min syarri maa shona'tu, abuu-u laka bini'matika 'alayya, wa abuu-u bidzambii, faghfirlii, fa innahuu laa yaghfirudz dzunuuba illaa anta",
    arti: 'Ya Allah, Engkau Tuhanku, tidak ada tuhan selain Engkau. Engkau menciptakanku dan aku hamba-Mu. Aku berpegang pada janji-Mu semampuku. Aku berlindung kepada-Mu dari keburukan perbuatanku. Aku mengakui nikmat-Mu kepadaku dan mengakui dosaku, maka ampunilah aku, karena tidak ada yang mengampuni dosa selain Engkau.',
    note: 'Penghulu istighfar, dibaca pagi dan petang (HR. Bukhari).' };
  var TASBIH = { label: 'Tasbih (100×)', lafaz: 'Subhaanallohi wa bihamdihi', arti: 'Maha Suci Allah dan segala puji bagi-Nya.',
    note: 'Dibaca 100× pagi dan petang (HR. Bukhari dan Muslim).' };

  var DZIKIR_SHOLAT = [
    { label: '1 · Istighfar (3×)', lafaz: 'Astaghfirullohal \'azhiim', arti: 'Aku memohon ampun kepada Allah Yang Maha Agung.' },
    { label: '2 · Doa keselamatan (1×)', lafaz: "Allohumma antas salaam, wa minkas salaam, tabaarokta yaa dzal jalaali wal ikroom",
      arti: 'Ya Allah, Engkaulah As-Salam (Maha Pemberi keselamatan), dan dari-Mu keselamatan. Maha Berkah Engkau, wahai Pemilik keagungan dan kemuliaan.', note: 'HR. Muslim.' },
    { label: '3 · Ayat Kursi (QS. Al-Baqarah: 255)', lafaz: "Allohu laa ilaaha illaa huwal hayyul qoyyuum, laa ta'khudzuhuu sinatuw wa laa naum, lahuu maa fis samaawaati wa maa fil ardh, man dzal ladzii yasyfa'u 'indahuu illaa bi-idznih, ya'lamu maa baina aidiihim wa maa kholfahum, wa laa yuhiithuuna bisyai-im min 'ilmihii illaa bimaa syaa', wasi'a kursiyyuhus samaawaati wal ardh, wa laa ya-uuduhuu hifzhuhumaa, wa huwal 'aliyyul 'azhiim",
      arti: 'Allah, tidak ada tuhan selain Dia, Yang Mahahidup, Yang terus-menerus mengurus makhluk-Nya, tidak mengantuk dan tidak tidur. Milik-Nya apa yang ada di langit dan di bumi. Tidak ada yang dapat memberi syafaat di sisi-Nya tanpa izin-Nya. Dia mengetahui apa yang di hadapan dan di belakang mereka, dan mereka tidak mengetahui sedikit pun ilmu-Nya kecuali yang Dia kehendaki. Kursi-Nya meliputi langit dan bumi, dan Dia tidak merasa berat memelihara keduanya. Dia Mahatinggi, Mahabesar.' },
    { label: '4 · Tasbih, tahmid, takbir (33× masing-masing)', lafaz: 'Subhaanalloh (33×) · Alhamdulillaah (33×) · Allohu akbar (33×)',
      arti: 'Maha Suci Allah · Segala puji bagi Allah · Allah Maha Besar.' },
    { label: '5 · Penutup (1×, genap 100)', lafaz: "Laa ilaaha illallohu wahdahuu laa syariika lah, lahul mulku wa lahul hamdu wa huwa 'alaa kulli syai-in qodiir",
      arti: 'Tidak ada tuhan selain Allah Yang Maha Esa, tidak ada sekutu bagi-Nya. Milik-Nya kerajaan dan milik-Nya segala puji, dan Dia Maha Kuasa atas segala sesuatu.', note: 'HR. Muslim.' }
  ];
  var PHASES = [[33, 'Subhaanalloh'], [33, 'Alhamdulillaah'], [33, 'Allohu akbar']];
  function dzikirSholat(id, group, after) {
    return { id: id, group: group, name: 'Dzikir setelah ' + after, count: 99, phases: PHASES, parts: DZIKIR_SHOLAT };
  }

  var ITEMS = [
    { id: 'taubat', group: 'malam', name: 'Sholat Taubat', rakaat: '2 rakaat',
      parts: [
        { label: 'Niat sholat taubat (2 rakaat)', lafaz: "Usholli sunnatat taubati rok'ataini lillaahi ta'aalaa",
          arti: 'Saya niat sholat sunnah taubat dua rakaat karena Allah Ta\'ala.' },
        { label: 'Setelah salam · istighfar 3×', lafaz: "Astaghfirullohal 'azhiimal ladzii laa ilaaha illaa huwal hayyul qoyyuumu wa atuubu ilaih",
          arti: 'Aku memohon ampun kepada Allah Yang Maha Agung, tidak ada tuhan selain Dia, Yang Maha Hidup lagi terus mengurus makhluk-Nya, dan aku bertaubat kepada-Nya.',
          note: 'Lalu sesali dosa, minta ampun dengan bahasa sendiri, dan bertekad tidak mengulanginya.' }
      ] },
    { id: 'tahajud', group: 'malam', name: 'Tahajud', rakaat: '2 rakaat, boleh diulang',
      parts: [{ label: 'Niat sholat tahajud (2 rakaat, boleh diulang)', lafaz: "Usholli sunnatat tahajjudi rok'ataini lillaahi ta'aalaa",
        arti: 'Saya niat sholat sunnah tahajud dua rakaat karena Allah Ta\'ala.' }] },
    { id: 'witir', group: 'malam', name: 'Witir', rakaat: '2 + 1 rakaat',
      parts: [
        { label: 'Niat witir 2 rakaat', lafaz: "Usholli sunnatan minal witri rok'ataini lillaahi ta'aalaa",
          arti: 'Saya niat sholat sunnah bagian dari witir dua rakaat karena Allah Ta\'ala.' },
        { label: 'Lalu witir 1 rakaat', lafaz: "Usholli sunnatal witri rok'atan lillaahi ta'aalaa",
          arti: 'Saya niat sholat sunnah witir satu rakaat karena Allah Ta\'ala.',
          note: 'Kalau sudah witir setelah Isya, centang saja di sini.' }
      ] },

    { id: 'qobliyah_subuh', group: 'subuh', name: 'Qobliyah Subuh', rakaat: '2 rakaat',
      parts: [{ label: 'Niat qobliyah Subuh (2 rakaat)', lafaz: "Usholli sunnatash shubhi rok'ataini qobliyyatan lillaahi ta'aalaa",
        arti: 'Saya niat sholat sunnah sebelum Subuh dua rakaat karena Allah Ta\'ala.',
        note: 'Rakaat pertama Al-Kafirun, rakaat kedua Al-Ikhlas. Dikerjakan ringkas.' }] },
    { id: 'subuh', group: 'subuh', name: 'Sholat Subuh', wajib: true, rakaat: '2 rakaat', guide: 'subuh',
      parts: [{ label: 'Niat sholat Subuh (2 rakaat)', lafaz: "Usholli fardhosh shubhi rok'ataini mustaqbilal qiblati adaa'an lillaahi ta'aalaa",
        arti: 'Saya niat sholat fardhu Subuh dua rakaat menghadap kiblat, tepat waktu, karena Allah Ta\'ala.' }] },
    dzikirSholat('dzikir_subuh', 'subuh', 'Subuh'),

    { id: 'istighfar', group: 'dzikir', name: 'Sayyidul Istighfar', parts: [SAYYIDUL] },
    { id: 'doa_rezeki', group: 'dzikir', name: 'Doa Rezeki',
      parts: [{ label: 'Doa rezeki setelah Subuh (1×)', lafaz: "Allohumma innii as-aluka 'ilman naafi'an, wa rizqon thoyyiban, wa 'amalan mutaqobbalaa",
        arti: 'Ya Allah, aku memohon kepada-Mu ilmu yang bermanfaat, rezeki yang baik, dan amal yang diterima.',
        note: 'HR. Ibnu Majah.' }] },
    { id: 'seribu_dinar', group: 'dzikir', name: 'Ayat Seribu Dinar',
      parts: [{ label: 'QS. At-Talaq: 2–3', lafaz: "Wa may yattaqillaaha yaj'al lahuu makhrojaa. Wa yarzuqhu min haitsu laa yahtasib. Wa may yatawakkal 'alallohi fahuwa hasbuh. Innallooha baalighu amrih. Qod ja'alallohu likulli syai-in qodroo",
        arti: 'Barang siapa bertakwa kepada Allah, niscaya Dia membukakan jalan keluar baginya, dan memberinya rezeki dari arah yang tidak disangka-sangka. Barang siapa bertawakal kepada Allah, niscaya Allah mencukupkan keperluannya. Sesungguhnya Allah melaksanakan urusan-Nya. Allah telah menetapkan ukuran bagi setiap sesuatu.' }] },
    { id: 'adrikni', group: 'dzikir', name: 'Sholawat Adrikni', count: 11,
      parts: [{ label: 'Sholawat Adrikni', lafaz: "Allohumma sholli 'ala sayyidina Muhammad, qod dhoqot hilati, adrikni ya Rosulalloh",
        arti: 'Ya Allah, limpahkan sholawat kepada junjungan kami Nabi Muhammad. Sungguh telah sempit daya upayaku, tolonglah aku wahai Rasulullah.',
        note: 'Tidak ada jumlah wajib. Target di sini 11×, boleh terus sampai 100×.' }] },
    { id: 'tasbih', group: 'dzikir', name: 'Tasbih 100×', count: 100, parts: [TASBIH] },

    { id: 'dhuha', group: 'dhuha', name: 'Sholat Dhuha', rakaat: '2–8 rakaat',
      parts: [{ label: 'Niat sholat Dhuha (2 rakaat, boleh sampai 8)', lafaz: "Usholli sunnatadh dhuhaa rok'ataini lillaahi ta'aalaa",
        arti: 'Saya niat sholat sunnah Dhuha dua rakaat karena Allah Ta\'ala.', note: 'Dikerjakan 2 rakaat sekali salam, boleh diulang.' }] },

    { id: 'qobliyah_zuhur', group: 'zuhur', name: 'Qobliyah Zuhur', rakaat: '2 rakaat', notFriday: true,
      parts: [{ label: 'Niat qobliyah Zuhur (2 rakaat)', lafaz: "Usholli sunnatazh zhuhri rok'ataini qobliyyatan lillaahi ta'aalaa",
        arti: 'Saya niat sholat sunnah sebelum Zuhur dua rakaat karena Allah Ta\'ala.' }] },
    { id: 'zuhur', group: 'zuhur', name: 'Sholat Zuhur', wajib: true, rakaat: '4 rakaat', guide: 'zuhur',
      parts: [{ label: 'Niat sholat Zuhur (4 rakaat)', lafaz: "Usholli fardhozh zhuhri arba'a roka'aatin mustaqbilal qiblati adaa'an lillaahi ta'aalaa",
        arti: 'Saya niat sholat fardhu Zuhur empat rakaat menghadap kiblat, tepat waktu, karena Allah Ta\'ala.' }],
      friday: { name: 'Sholat Jumat', rakaat: '2 rakaat, berjamaah',
        parts: [{ label: 'Niat sholat Jumat (2 rakaat, sebagai makmum)', lafaz: "Usholli fardhol jumu'ati rok'ataini mustaqbilal qiblati adaa'an ma'muuman lillaahi ta'aalaa",
          arti: 'Saya niat sholat fardhu Jumat dua rakaat menghadap kiblat, tepat waktu, sebagai makmum, karena Allah Ta\'ala.',
          note: 'Datang lebih awal, dengarkan khutbah dengan tenang. Sholat Jumat menggantikan Zuhur.' }] } },
    dzikirSholat('dzikir_zuhur', 'zuhur', 'Zuhur'),
    { id: 'badiyah_zuhur', group: 'zuhur', name: "Ba'diyah Zuhur", rakaat: '2 rakaat',
      parts: [{ label: "Niat ba'diyah Zuhur (2 rakaat)", lafaz: "Usholli sunnatazh zhuhri rok'ataini ba'diyyatan lillaahi ta'aalaa",
        arti: 'Saya niat sholat sunnah sesudah Zuhur dua rakaat karena Allah Ta\'ala.' }],
      friday: { name: "Ba'diyah Jumat", rakaat: '2 rakaat',
        parts: [{ label: "Niat ba'diyah Jumat (2 rakaat)", lafaz: "Usholli sunnatal jumu'ati rok'ataini ba'diyyatan lillaahi ta'aalaa",
          arti: 'Saya niat sholat sunnah sesudah Jumat dua rakaat karena Allah Ta\'ala.' }] } },

    { id: 'qobliyah_ashar', group: 'ashar', name: 'Qobliyah Ashar', rakaat: '2 rakaat',
      parts: [{ label: 'Niat qobliyah Ashar (2 rakaat)', lafaz: "Usholli sunnatal 'ashri rok'ataini qobliyyatan lillaahi ta'aalaa",
        arti: 'Saya niat sholat sunnah sebelum Ashar dua rakaat karena Allah Ta\'ala.' }] },
    { id: 'ashar', group: 'ashar', name: 'Sholat Ashar', wajib: true, rakaat: '4 rakaat', guide: 'ashar',
      parts: [{ label: 'Niat sholat Ashar (4 rakaat)', lafaz: "Usholli fardhol 'ashri arba'a roka'aatin mustaqbilal qiblati adaa'an lillaahi ta'aalaa",
        arti: 'Saya niat sholat fardhu Ashar empat rakaat menghadap kiblat, tepat waktu, karena Allah Ta\'ala.' }] },
    dzikirSholat('dzikir_ashar', 'ashar', 'Ashar'),

    { id: 'istighfar_petang', group: 'petang', name: 'Sayyidul Istighfar', parts: [SAYYIDUL] },
    { id: 'bismillah_petang', group: 'petang', name: 'Doa Perlindungan 3×', count: 3,
      parts: [{ label: 'Doa perlindungan (3×)', lafaz: "Bismillaahil ladzii laa yadhurru ma'asmihii syai-un fil ardhi wa laa fis samaa-i wa huwas samii'ul 'aliim",
        arti: 'Dengan nama Allah, yang bersama nama-Nya tidak ada sesuatu pun di bumi maupun di langit yang dapat membahayakan. Dialah Yang Maha Mendengar lagi Maha Mengetahui.',
        note: 'Dibaca 3× pagi dan petang (HR. Abu Dawud dan Tirmidzi).' }] },
    { id: 'tasbih_petang', group: 'petang', name: 'Tasbih 100×', count: 100, parts: [TASBIH] },

    { id: 'maghrib', group: 'maghrib', name: 'Sholat Maghrib', wajib: true, rakaat: '3 rakaat', guide: 'maghrib',
      parts: [{ label: 'Niat sholat Maghrib (3 rakaat)', lafaz: "Usholli fardhol maghribi tsalaatsa roka'aatin mustaqbilal qiblati adaa'an lillaahi ta'aalaa",
        arti: 'Saya niat sholat fardhu Maghrib tiga rakaat menghadap kiblat, tepat waktu, karena Allah Ta\'ala.' }] },
    dzikirSholat('dzikir_maghrib', 'maghrib', 'Maghrib'),
    { id: 'badiyah_maghrib', group: 'maghrib', name: "Ba'diyah Maghrib", rakaat: '2 rakaat',
      parts: [{ label: "Niat ba'diyah Maghrib (2 rakaat)", lafaz: "Usholli sunnatal maghribi rok'ataini ba'diyyatan lillaahi ta'aalaa",
        arti: 'Saya niat sholat sunnah sesudah Maghrib dua rakaat karena Allah Ta\'ala.' }] },

    { id: 'isya', group: 'isya', name: 'Sholat Isya', wajib: true, rakaat: '4 rakaat', guide: 'isya',
      parts: [{ label: 'Niat sholat Isya (4 rakaat)', lafaz: "Usholli fardhol 'isyaa-i arba'a roka'aatin mustaqbilal qiblati adaa'an lillaahi ta'aalaa",
        arti: 'Saya niat sholat fardhu Isya empat rakaat menghadap kiblat, tepat waktu, karena Allah Ta\'ala.' }] },
    dzikirSholat('dzikir_isya', 'isya', 'Isya'),
    { id: 'badiyah_isya', group: 'isya', name: "Ba'diyah Isya", rakaat: '2 rakaat',
      parts: [{ label: "Niat ba'diyah Isya (2 rakaat)", lafaz: "Usholli sunnatal 'isyaa-i rok'ataini ba'diyyatan lillaahi ta'aalaa",
        arti: 'Saya niat sholat sunnah sesudah Isya dua rakaat karena Allah Ta\'ala.',
        note: 'Sebelum tidur, pasang niat bangun untuk tahajud.' }] },

    { id: 'puasa_senin', group: 'puasa', name: 'Puasa Senin', days: [1],
      parts: [
        { label: 'Niat puasa Senin', lafaz: "Nawaitu shouma yaumil itsnaini sunnatan lillaahi ta'aalaa",
          arti: 'Saya niat puasa sunnah hari Senin karena Allah Ta\'ala.',
          note: 'Niat sejak malam, atau pagi hari sebelum Zuhur selama belum makan dan minum.' },
        { label: 'Doa berbuka', lafaz: "Dzahabazh zhoma-u wabtallatil 'uruuqu wa tsabatal ajru in syaa-alloh",
          arti: 'Telah hilang rasa haus, urat-urat telah basah, dan pahala telah tetap, insya Allah.', note: 'HR. Abu Dawud.' }
      ] },
    { id: 'puasa_kamis', group: 'puasa', name: 'Puasa Kamis', days: [4],
      parts: [
        { label: 'Niat puasa Kamis', lafaz: "Nawaitu shouma yaumil khomiisi sunnatan lillaahi ta'aalaa",
          arti: 'Saya niat puasa sunnah hari Kamis karena Allah Ta\'ala.',
          note: 'Niat sejak malam, atau pagi hari sebelum Zuhur selama belum makan dan minum.' },
        { label: 'Doa berbuka', lafaz: "Dzahabazh zhoma-u wabtallatil 'uruuqu wa tsabatal ajru in syaa-alloh",
          arti: 'Telah hilang rasa haus, urat-urat telah basah, dan pahala telah tetap, insya Allah.', note: 'HR. Abu Dawud.' }
      ] },

    { id: 'kahfi', group: 'harian', name: 'Membaca Al-Kahfi', days: [5], end: function (t) { return t.maghrib; },
      link: 'https://quran.com/id/al-kahf',
      parts: [{ label: 'Surat Al-Kahfi (110 ayat)', lafaz: 'Surat Al-Kahfi',
        arti: 'Disunnahkan dibaca pada hari Jumat, sejak Kamis malam sampai sebelum Maghrib hari Jumat. Boleh dicicil sepanjang hari.',
        note: 'Bacaan latin dan artinya bisa dibuka lewat tombol di bawah.' }] },
    { id: 'sedekah', group: 'harian', name: 'Sedekah', noteField: true,
      parts: [{ label: 'Sedekah hari ini', lafaz: 'Sedekah hari ini',
        arti: 'Tidak harus uang: senyum, membantu orang, atau berbagi makanan juga sedekah.' }] }
  ];

  root.AH_DATA = { GROUPS: GROUPS, ITEMS: ITEMS };
})(window);
