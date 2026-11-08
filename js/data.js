// Daftar amalan harian: kelompok waktu + item checklist + bacaan (latin & arti)
(function (root) {
  // start/end: fungsi yang menerima jadwal sholat hari itu (menit) dan mengembalikan menit
  var GROUPS = [
    { id: 'malam', title: 'Taubat & Tahajud', when: function () { return '03.45'; },
      start: function () { return 0; }, end: function (t) { return t.subuh; } },
    { id: 'subuh', title: 'Subuh', when: function (t) { return Prayer.hhmm(t.subuh); },
      start: function (t) { return t.subuh; }, end: function (t) { return t.terbit; } },
    { id: 'dzikir', title: 'Dzikir Pagi', when: function () { return 'setelah Subuh'; },
      start: function (t) { return t.subuh; }, end: function (t) { return t.zuhur; } },
    { id: 'dhuha', title: 'Dhuha', when: function (t) { return Prayer.hhmm(t.dhuha); },
      start: function (t) { return t.dhuha; }, end: function (t) { return t.zuhur; } },
    { id: 'zuhur', title: 'Zuhur', when: function (t) { return Prayer.hhmm(t.zuhur); },
      start: function (t) { return t.zuhur; }, end: function (t) { return t.ashar; } },
    { id: 'ashar', title: 'Ashar', when: function (t) { return Prayer.hhmm(t.ashar); },
      start: function (t) { return t.ashar; }, end: function (t) { return t.maghrib; } },
    { id: 'maghrib', title: 'Maghrib', when: function (t) { return Prayer.hhmm(t.maghrib); },
      start: function (t) { return t.maghrib; }, end: function (t) { return t.isya; } },
    { id: 'isya', title: 'Isya', when: function (t) { return Prayer.hhmm(t.isya); },
      start: function (t) { return t.isya; }, end: function () { return 1440; } },
    { id: 'harian', title: 'Sepanjang Hari', when: function () { return 'kapan saja'; },
      start: function () { return 0; }, end: function () { return 1440; } }
  ];

  var ITEMS = [
    { id: 'taubat', group: 'malam', name: 'Sholat Taubat',
      parts: [
        { label: 'Niat sholat taubat (2 rakaat)', lafaz: "Usholli sunnatat taubati rok'ataini lillaahi ta'aalaa",
          arti: 'Saya niat sholat sunnah taubat dua rakaat karena Allah Ta\'ala.' },
        { label: 'Setelah salam · istighfar 3×', lafaz: "Astaghfirullohal 'azhiimal ladzii laa ilaaha illaa huwal hayyul qoyyuumu wa atuubu ilaih",
          arti: 'Aku memohon ampun kepada Allah Yang Maha Agung, tidak ada tuhan selain Dia, Yang Maha Hidup lagi terus mengurus makhluk-Nya, dan aku bertaubat kepada-Nya.',
          note: 'Lalu sesali dosa, minta ampun dengan bahasa sendiri, dan bertekad tidak mengulanginya.' }
      ] },
    { id: 'tahajud', group: 'malam', name: 'Tahajud',
      parts: [{ label: 'Niat sholat tahajud (2 rakaat, boleh diulang)', lafaz: "Usholli sunnatat tahajjudi rok'ataini lillaahi ta'aalaa",
        arti: 'Saya niat sholat sunnah tahajud dua rakaat karena Allah Ta\'ala.' }] },
    { id: 'witir', group: 'malam', name: 'Witir',
      parts: [
        { label: 'Niat witir 2 rakaat', lafaz: "Usholli sunnatan minal witri rok'ataini lillaahi ta'aalaa",
          arti: 'Saya niat sholat sunnah bagian dari witir dua rakaat karena Allah Ta\'ala.' },
        { label: 'Lalu witir 1 rakaat', lafaz: "Usholli sunnatal witri rok'atan lillaahi ta'aalaa",
          arti: 'Saya niat sholat sunnah witir satu rakaat karena Allah Ta\'ala.',
          note: 'Kalau sudah witir setelah Isya, centang saja di sini.' }
      ] },

    { id: 'qobliyah_subuh', group: 'subuh', name: 'Qobliyah Subuh',
      parts: [{ label: 'Niat qobliyah Subuh (2 rakaat)', lafaz: "Usholli sunnatash shubhi rok'ataini qobliyyatan lillaahi ta'aalaa",
        arti: 'Saya niat sholat sunnah sebelum Subuh dua rakaat karena Allah Ta\'ala.',
        note: 'Rakaat pertama Al-Kafirun, rakaat kedua Al-Ikhlas. Dikerjakan ringkas.' }] },
    { id: 'subuh', group: 'subuh', name: 'Sholat Subuh', wajib: true,
      parts: [{ label: 'Niat sholat Subuh (2 rakaat)', lafaz: "Usholli fardhosh shubhi rok'ataini mustaqbilal qiblati adaa'an lillaahi ta'aalaa",
        arti: 'Saya niat sholat fardhu Subuh dua rakaat menghadap kiblat, tepat waktu, karena Allah Ta\'ala.' }] },

    { id: 'istighfar', group: 'dzikir', name: 'Sayyidul Istighfar',
      parts: [{ label: 'Sayyidul Istighfar (1×)', lafaz: "Allohumma anta robbii, laa ilaaha illaa anta, kholaqtanii wa ana 'abduka, wa ana 'alaa 'ahdika wa wa'dika mastatho'tu, a'uudzu bika min syarri maa shona'tu, abuu-u laka bini'matika 'alayya, wa abuu-u bidzambii, faghfirlii, fa innahuu laa yaghfirudz dzunuuba illaa anta",
        arti: 'Ya Allah, Engkau Tuhanku, tidak ada tuhan selain Engkau. Engkau menciptakanku dan aku hamba-Mu. Aku berpegang pada janji-Mu semampuku. Aku berlindung kepada-Mu dari keburukan perbuatanku. Aku mengakui nikmat-Mu kepadaku dan mengakui dosaku, maka ampunilah aku, karena tidak ada yang mengampuni dosa selain Engkau.',
        note: 'Penghulu istighfar (HR. Bukhari).' }] },
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
    { id: 'tasbih', group: 'dzikir', name: 'Tasbih 100×', count: 100,
      parts: [{ label: 'Tasbih (100×)', lafaz: 'Subhaanallohi wa bihamdihi',
        arti: 'Maha Suci Allah dan segala puji bagi-Nya.',
        note: 'Dibaca 100× sehari, dosa diampuni walau sebanyak buih di lautan (HR. Bukhari dan Muslim).' }] },

    { id: 'dhuha', group: 'dhuha', name: 'Sholat Dhuha',
      parts: [{ label: 'Niat sholat Dhuha (2 rakaat, boleh sampai 8)', lafaz: "Usholli sunnatadh dhuhaa rok'ataini lillaahi ta'aalaa",
        arti: 'Saya niat sholat sunnah Dhuha dua rakaat karena Allah Ta\'ala.' }] },

    { id: 'qobliyah_zuhur', group: 'zuhur', name: 'Qobliyah Zuhur',
      parts: [{ label: 'Niat qobliyah Zuhur (2 rakaat)', lafaz: "Usholli sunnatazh zhuhri rok'ataini qobliyyatan lillaahi ta'aalaa",
        arti: 'Saya niat sholat sunnah sebelum Zuhur dua rakaat karena Allah Ta\'ala.' }] },
    { id: 'zuhur', group: 'zuhur', name: 'Sholat Zuhur', wajib: true,
      parts: [
        { label: 'Niat sholat Zuhur (4 rakaat)', lafaz: "Usholli fardhozh zhuhri arba'a roka'aatin mustaqbilal qiblati adaa'an lillaahi ta'aalaa",
          arti: 'Saya niat sholat fardhu Zuhur empat rakaat menghadap kiblat, tepat waktu, karena Allah Ta\'ala.' },
        { label: 'Hari Jumat · niat sholat Jumat (2 rakaat)', lafaz: "Usholli fardhol jumu'ati rok'ataini mustaqbilal qiblati adaa'an ma'muuman lillaahi ta'aalaa",
          arti: 'Saya niat sholat fardhu Jumat dua rakaat menghadap kiblat, tepat waktu, sebagai makmum, karena Allah Ta\'ala.' }
      ] },
    { id: 'badiyah_zuhur', group: 'zuhur', name: "Ba'diyah Zuhur",
      parts: [{ label: "Niat ba'diyah Zuhur (2 rakaat)", lafaz: "Usholli sunnatazh zhuhri rok'ataini ba'diyyatan lillaahi ta'aalaa",
        arti: 'Saya niat sholat sunnah sesudah Zuhur dua rakaat karena Allah Ta\'ala.' }] },

    { id: 'qobliyah_ashar', group: 'ashar', name: 'Qobliyah Ashar',
      parts: [{ label: 'Niat qobliyah Ashar (2 rakaat)', lafaz: "Usholli sunnatal 'ashri rok'ataini qobliyyatan lillaahi ta'aalaa",
        arti: 'Saya niat sholat sunnah sebelum Ashar dua rakaat karena Allah Ta\'ala.' }] },
    { id: 'ashar', group: 'ashar', name: 'Sholat Ashar', wajib: true,
      parts: [{ label: 'Niat sholat Ashar (4 rakaat)', lafaz: "Usholli fardhol 'ashri arba'a roka'aatin mustaqbilal qiblati adaa'an lillaahi ta'aalaa",
        arti: 'Saya niat sholat fardhu Ashar empat rakaat menghadap kiblat, tepat waktu, karena Allah Ta\'ala.' }] },

    { id: 'maghrib', group: 'maghrib', name: 'Sholat Maghrib', wajib: true,
      parts: [{ label: 'Niat sholat Maghrib (3 rakaat)', lafaz: "Usholli fardhol maghribi tsalaatsa roka'aatin mustaqbilal qiblati adaa'an lillaahi ta'aalaa",
        arti: 'Saya niat sholat fardhu Maghrib tiga rakaat menghadap kiblat, tepat waktu, karena Allah Ta\'ala.' }] },
    { id: 'badiyah_maghrib', group: 'maghrib', name: "Ba'diyah Maghrib",
      parts: [{ label: "Niat ba'diyah Maghrib (2 rakaat)", lafaz: "Usholli sunnatal maghribi rok'ataini ba'diyyatan lillaahi ta'aalaa",
        arti: 'Saya niat sholat sunnah sesudah Maghrib dua rakaat karena Allah Ta\'ala.' }] },

    { id: 'isya', group: 'isya', name: 'Sholat Isya', wajib: true,
      parts: [{ label: 'Niat sholat Isya (4 rakaat)', lafaz: "Usholli fardhol 'isyaa-i arba'a roka'aatin mustaqbilal qiblati adaa'an lillaahi ta'aalaa",
        arti: 'Saya niat sholat fardhu Isya empat rakaat menghadap kiblat, tepat waktu, karena Allah Ta\'ala.' }] },
    { id: 'badiyah_isya', group: 'isya', name: "Ba'diyah Isya",
      parts: [{ label: "Niat ba'diyah Isya (2 rakaat)", lafaz: "Usholli sunnatal 'isyaa-i rok'ataini ba'diyyatan lillaahi ta'aalaa",
        arti: 'Saya niat sholat sunnah sesudah Isya dua rakaat karena Allah Ta\'ala.',
        note: 'Sebelum tidur, pasang niat bangun untuk tahajud.' }] },

    { id: 'sedekah', group: 'harian', name: 'Sedekah', noteField: true,
      parts: [{ label: 'Sedekah hari ini', lafaz: 'Sedekah hari ini',
        arti: 'Tidak harus uang: senyum, membantu orang, atau berbagi makanan juga sedekah.' }] }
  ];

  root.AH_DATA = { GROUPS: GROUPS, ITEMS: ITEMS };
})(window);
