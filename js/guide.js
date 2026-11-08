// Panduan sholat & wudhu: bacaan latin + arti, dan urutan gerakan per rakaat
(function (root) {
  var READ = {
    takbir: { label: 'Takbiratul ihram', lafaz: 'Allohu akbar', arti: 'Allah Maha Besar.' },
    iftitah: { label: 'Doa iftitah', lafaz: "Allohu akbar kabiiroo, walhamdu lillaahi katsiiroo, wa subhaanallohi bukrotaw wa ashiilaa. Innii wajjahtu wajhiya lilladzii fathoros samaawaati wal ardho haniifam muslimaw wa maa ana minal musyrikiin. Inna sholaatii wa nusukii wa mahyaaya wa mamaatii lillaahi robbil 'aalamiin. Laa syariika lahuu wa bidzaalika umirtu wa ana minal muslimiin",
      arti: 'Allah Maha Besar dengan sebesar-besarnya, segala puji bagi Allah dengan pujian yang banyak, Maha Suci Allah pagi dan petang. Sesungguhnya aku hadapkan wajahku kepada Dzat yang menciptakan langit dan bumi dengan lurus dan berserah diri, dan aku bukan termasuk orang-orang musyrik. Sesungguhnya sholatku, ibadahku, hidupku, dan matiku hanya untuk Allah, Tuhan semesta alam. Tidak ada sekutu bagi-Nya. Dengan itulah aku diperintahkan, dan aku termasuk orang-orang muslim.' },
    taawudz: { label: "Ta'awudz", lafaz: "A'uudzu billaahi minasy syaithoonir rojiim", arti: 'Aku berlindung kepada Allah dari setan yang terkutuk.' },
    fatihah: { label: 'Al-Fatihah', lafaz: "Bismillaahir rohmaanir rohiim. Alhamdu lillaahi robbil 'aalamiin. Ar-rohmaanir rohiim. Maaliki yaumid diin. Iyyaaka na'budu wa iyyaaka nasta'iin. Ihdinash shiroothol mustaqiim. Shiroothol ladziina an'amta 'alaihim, ghoiril maghdhuubi 'alaihim wa ladh dhoolliin. Aamiin",
      arti: 'Dengan nama Allah Yang Maha Pengasih, Maha Penyayang. Segala puji bagi Allah, Tuhan seluruh alam. Yang Maha Pengasih, Maha Penyayang. Pemilik hari pembalasan. Hanya kepada Engkaulah kami menyembah dan hanya kepada Engkaulah kami memohon pertolongan. Tunjukilah kami jalan yang lurus, yaitu jalan orang-orang yang telah Engkau beri nikmat, bukan jalan mereka yang dimurkai dan bukan pula jalan mereka yang sesat. Aamiin.' },
    ikhlas: { label: 'Al-Ikhlas', lafaz: 'Qul huwallohu ahad. Allohush shomad. Lam yalid wa lam yuulad. Wa lam yakul lahuu kufuwan ahad',
      arti: 'Katakanlah, Dialah Allah, Yang Maha Esa. Allah tempat meminta segala sesuatu. Dia tidak beranak dan tidak diperanakkan. Dan tidak ada sesuatu pun yang setara dengan Dia.' },
    falaq: { label: 'Al-Falaq', lafaz: "Qul a'uudzu birobbil falaq. Min syarri maa kholaq. Wa min syarri ghoosiqin idzaa waqob. Wa min syarrin naffaatsaati fil 'uqod. Wa min syarri haasidin idzaa hasad",
      arti: 'Katakanlah, aku berlindung kepada Tuhan yang menguasai subuh, dari kejahatan makhluk yang Dia ciptakan, dari kejahatan malam apabila telah gelap gulita, dari kejahatan penyihir yang meniup pada buhul-buhul, dan dari kejahatan orang yang dengki apabila dia dengki.' },
    nas: { label: 'An-Nas', lafaz: "Qul a'uudzu birobbin naas. Malikin naas. Ilaahin naas. Min syarril waswaasil khonnaas. Alladzii yuwaswisu fii shuduurin naas. Minal jinnati wan naas",
      arti: 'Katakanlah, aku berlindung kepada Tuhannya manusia, Raja manusia, sembahan manusia, dari kejahatan bisikan setan yang bersembunyi, yang membisikkan kejahatan ke dalam dada manusia, dari golongan jin dan manusia.' },
    kafirun: { label: 'Al-Kafirun', lafaz: "Qul yaa ayyuhal kaafiruun. Laa a'budu maa ta'buduun. Wa laa antum 'aabiduuna maa a'bud. Wa laa ana 'aabidum maa 'abattum. Wa laa antum 'aabiduuna maa a'bud. Lakum diinukum wa liya diin",
      arti: 'Katakanlah, wahai orang-orang kafir! Aku tidak akan menyembah apa yang kamu sembah, dan kamu bukan penyembah apa yang aku sembah. Aku tidak pernah menjadi penyembah apa yang kamu sembah, dan kamu tidak pernah menjadi penyembah apa yang aku sembah. Untukmu agamamu, dan untukku agamaku.' },
    rukuk: { label: 'Bacaan rukuk (3×)', lafaz: "Subhaana robbiyal 'azhiimi wa bihamdih", arti: 'Maha Suci Tuhanku Yang Maha Agung, dan dengan memuji-Nya.' },
    itidal: { label: "Bacaan i'tidal", lafaz: "Sami'allohu liman hamidah. Robbanaa lakal hamdu mil-us samaawaati wa mil-ul ardhi wa mil-u maa syi'ta min syai-in ba'du",
      arti: 'Allah mendengar orang yang memuji-Nya. Ya Tuhan kami, bagi-Mu segala puji, sepenuh langit, sepenuh bumi, dan sepenuh apa yang Engkau kehendaki sesudah itu.' },
    qunut: { label: 'Doa qunut', lafaz: "Allohummahdinii fiiman hadait, wa 'aafinii fiiman 'aafait, wa tawallanii fiiman tawallait, wa baarik lii fiimaa a'thoit, wa qinii syarro maa qodhoit, fa innaka taqdhii wa laa yuqdhoo 'alaik, wa innahuu laa yadzillu man waalait, wa laa ya'izzu man 'aadait, tabaarokta robbanaa wa ta'aalait",
      arti: 'Ya Allah, berilah aku petunjuk bersama orang yang Engkau beri petunjuk, berilah aku kesehatan bersama orang yang Engkau beri kesehatan, uruslah aku bersama orang yang Engkau urus, berkahilah apa yang Engkau berikan kepadaku, dan lindungilah aku dari keburukan yang Engkau tetapkan. Sesungguhnya Engkaulah yang menetapkan dan tidak ada yang menetapkan atas-Mu. Tidak akan hina orang yang Engkau lindungi, dan tidak akan mulia orang yang Engkau musuhi. Maha Berkah Engkau, wahai Tuhan kami, dan Maha Tinggi Engkau.',
      note: 'Kalau berjamaah, imam yang membaca, makmum mengucap "aamiin".' },
    sujud: { label: 'Bacaan sujud (3×)', lafaz: "Subhaana robbiyal a'laa wa bihamdih", arti: 'Maha Suci Tuhanku Yang Maha Tinggi, dan dengan memuji-Nya.' },
    duduk: { label: 'Bacaan duduk di antara dua sujud', lafaz: "Robbighfirlii warhamnii wajburnii warfa'nii warzuqnii wahdinii wa 'aafinii wa'fu 'annii",
      arti: 'Ya Tuhanku, ampunilah aku, rahmatilah aku, cukupkanlah kekuranganku, angkatlah derajatku, berilah aku rezeki, berilah aku petunjuk, berilah aku kesehatan, dan maafkanlah aku.' },
    tasyahud_awal: { label: 'Tasyahud awal', lafaz: "Attahiyyaatul mubaarokaatush sholawaatuth thoyyibaatu lillaah. Assalaamu 'alaika ayyuhan nabiyyu wa rohmatullohi wa barokaatuh. Assalaamu 'alainaa wa 'alaa 'ibaadillaahish shoolihiin. Asyhadu allaa ilaaha illalloh, wa asyhadu anna Muhammadar rosuululloh. Allohumma sholli 'alaa sayyidinaa Muhammad",
      arti: 'Segala penghormatan, keberkahan, sholawat, dan kebaikan hanya bagi Allah. Semoga keselamatan, rahmat Allah, dan berkah-Nya tercurah kepadamu wahai Nabi. Semoga keselamatan tercurah kepada kami dan hamba-hamba Allah yang saleh. Aku bersaksi bahwa tidak ada tuhan selain Allah, dan aku bersaksi bahwa Muhammad adalah utusan Allah. Ya Allah, limpahkanlah sholawat kepada junjungan kami Nabi Muhammad.' },
    tasyahud_akhir: { label: 'Tasyahud akhir', lafaz: "Attahiyyaatul mubaarokaatush sholawaatuth thoyyibaatu lillaah. Assalaamu 'alaika ayyuhan nabiyyu wa rohmatullohi wa barokaatuh. Assalaamu 'alainaa wa 'alaa 'ibaadillaahish shoolihiin. Asyhadu allaa ilaaha illalloh, wa asyhadu anna Muhammadar rosuululloh. Allohumma sholli 'alaa sayyidinaa Muhammad, wa 'alaa aali sayyidinaa Muhammad, kamaa shollaita 'alaa sayyidinaa Ibroohiim wa 'alaa aali sayyidinaa Ibroohiim. Wa baarik 'alaa sayyidinaa Muhammad wa 'alaa aali sayyidinaa Muhammad, kamaa baarokta 'alaa sayyidinaa Ibroohiim wa 'alaa aali sayyidinaa Ibroohiim. Fil 'aalamiina innaka hamiidum majiid",
      arti: 'Sama seperti tasyahud awal, dilanjutkan: Ya Allah, limpahkanlah sholawat kepada junjungan kami Nabi Muhammad dan keluarganya, sebagaimana Engkau telah melimpahkan sholawat kepada junjungan kami Nabi Ibrahim dan keluarganya. Limpahkanlah keberkahan kepada junjungan kami Nabi Muhammad dan keluarganya, sebagaimana Engkau telah melimpahkan keberkahan kepada junjungan kami Nabi Ibrahim dan keluarganya. Di seluruh alam, sesungguhnya Engkau Maha Terpuji lagi Maha Mulia.' },
    salam: { label: 'Salam', lafaz: "Assalaamu 'alaikum wa rohmatulloh", arti: 'Semoga keselamatan dan rahmat Allah tercurah kepada kalian.' },
    niat_wudhu: { label: 'Niat wudhu', lafaz: "Nawaitul wudhuu-a liraf'il hadatsil ashghori fardhol lillaahi ta'aalaa",
      arti: 'Saya niat berwudhu untuk menghilangkan hadas kecil, fardhu karena Allah Ta\'ala.', note: 'Niat di dalam hati, saat mulai membasuh wajah.' },
    doa_wudhu: { label: 'Doa setelah wudhu', lafaz: "Asyhadu allaa ilaaha illallohu wahdahuu laa syariika lah, wa asyhadu anna Muhammadan 'abduhuu wa rosuuluh. Allohummaj'alnii minat tawwaabiina waj'alnii minal mutathohhiriin",
      arti: 'Aku bersaksi bahwa tidak ada tuhan selain Allah Yang Maha Esa, tidak ada sekutu bagi-Nya, dan aku bersaksi bahwa Muhammad adalah hamba dan utusan-Nya. Ya Allah, jadikanlah aku termasuk orang-orang yang bertaubat dan orang-orang yang menyucikan diri.',
      note: 'HR. Muslim dan Tirmidzi.' }
  };

  var GERAK = {
    niat: { name: 'Niat', how: 'Berdiri tegak menghadap kiblat. Niat di dalam hati.' },
    takbir: { name: 'Takbiratul ihram', how: 'Angkat kedua tangan sejajar telinga sambil mengucap takbir, lalu letakkan tangan kanan di atas tangan kiri di dada.', read: 'takbir' },
    iftitah: { name: 'Doa iftitah', how: 'Dibaca pelan, hanya di rakaat pertama (sunnah).', read: 'iftitah' },
    taawudz: { name: "Ta'awudz", how: 'Dibaca pelan sebelum Al-Fatihah (sunnah).', read: 'taawudz' },
    fatihah: { name: 'Al-Fatihah', how: 'Wajib di setiap rakaat.', read: 'fatihah' },
    surat: { name: 'Surat pendek', how: 'Sunnah di rakaat 1 dan 2. Pilih salah satu.', surat: true },
    rukuk: { name: 'Rukuk', how: 'Ucapkan "Allohu akbar", lalu membungkuk. Punggung lurus, kedua tangan memegang lutut.', read: 'rukuk' },
    itidal: { name: "I'tidal", how: 'Bangkit dari rukuk sambil mengangkat kedua tangan, lalu berdiri tegak.', read: 'itidal' },
    qunut: { name: 'Qunut (khusus Subuh)', how: "Setelah i'tidal di rakaat ke-2, sambil mengangkat kedua tangan. Sunnah menurut mazhab Syafi'i.", read: 'qunut' },
    sujud: { name: 'Sujud', how: 'Ucapkan "Allohu akbar", lalu sujud: dahi, hidung, kedua telapak tangan, kedua lutut, dan ujung jari kaki menyentuh lantai.', read: 'sujud' },
    duduk: { name: 'Duduk di antara dua sujud', how: 'Ucapkan "Allohu akbar", bangun dari sujud lalu duduk di atas kaki kiri, kaki kanan ditegakkan.', read: 'duduk' },
    sujud2: { name: 'Sujud kedua', how: 'Ucapkan "Allohu akbar", lalu sujud lagi.', read: 'sujud' },
    bangkit: { name: 'Berdiri ke rakaat berikutnya', how: 'Ucapkan "Allohu akbar", lalu berdiri.' },
    tasyahud_awal: { name: 'Tasyahud awal', how: 'Duduk di atas kaki kiri, kaki kanan ditegakkan. Telunjuk kanan diangkat saat "illalloh".', read: 'tasyahud_awal' },
    tasyahud_akhir: { name: 'Tasyahud akhir', how: 'Duduk tawarruk: pantat kiri di lantai, kaki kiri dikeluarkan ke bawah kaki kanan. Telunjuk kanan diangkat saat "illalloh".', read: 'tasyahud_akhir' },
    salam: { name: 'Salam', how: 'Menoleh ke kanan sambil mengucap salam, lalu ke kiri.', read: 'salam' }
  };

  function sequence(n, qunut) {
    var out = [];
    for (var r = 1; r <= n; r++) {
      var s = [];
      if (r === 1) s.push('niat', 'takbir', 'iftitah', 'taawudz');
      s.push('fatihah');
      if (r <= 2) s.push('surat');
      s.push('rukuk', 'itidal');
      if (qunut && r === 2) s.push('qunut');
      s.push('sujud', 'duduk', 'sujud2');
      if (r === n) s.push('tasyahud_akhir', 'salam');
      else if (r === 2) s.push('tasyahud_awal', 'bangkit');
      else s.push('bangkit');
      out.push(s);
    }
    return out;
  }

  var SHOLAT = [
    { id: 'subuh', name: 'Subuh', n: 2, item: 'subuh', jahr: true },
    { id: 'zuhur', name: 'Zuhur', n: 4, item: 'zuhur' },
    { id: 'ashar', name: 'Ashar', n: 4, item: 'ashar' },
    { id: 'maghrib', name: 'Maghrib', n: 3, item: 'maghrib', jahr: true },
    { id: 'isya', name: 'Isya', n: 4, item: 'isya', jahr: true },
    { id: 'sunnah', name: 'Sunnah', n: 2 }
  ];

  var WUDHU = [
    { name: 'Membaca basmalah dan mencuci kedua telapak tangan 3×', wajib: false },
    { name: 'Berkumur 3×', wajib: false },
    { name: 'Memasukkan air ke hidung lalu mengeluarkannya 3×', wajib: false },
    { name: 'Membasuh wajah 3×, sambil niat di dalam hati', wajib: true, read: 'niat_wudhu' },
    { name: 'Membasuh kedua tangan sampai siku 3×, kanan dulu', wajib: true },
    { name: 'Mengusap sebagian kepala', wajib: true },
    { name: 'Mengusap kedua telinga', wajib: false },
    { name: 'Membasuh kedua kaki sampai mata kaki 3×, kanan dulu', wajib: true },
    { name: 'Membaca doa setelah wudhu', wajib: false, read: 'doa_wudhu' }
  ];
  var PEMBATAL = ['Keluar sesuatu dari qubul atau dubur (buang air, kentut)', 'Tidur nyenyak yang tidak dalam posisi duduk rapat',
    'Hilang akal, misalnya pingsan', 'Bersentuhan kulit dengan lawan jenis yang bukan mahram (mazhab Syafi\'i)', 'Menyentuh kemaluan dengan telapak tangan'];

  // bacaan yang bisa ditandai "sudah hafal"
  var HAFALAN = ['takbir', 'iftitah', 'taawudz', 'fatihah', 'ikhlas', 'falaq', 'nas', 'kafirun', 'rukuk', 'itidal', 'qunut', 'sujud', 'duduk',
    'tasyahud_awal', 'tasyahud_akhir', 'salam', 'niat_wudhu', 'doa_wudhu', 'dz_salam', 'dz_kursi', 'dz_penutup'];

  root.AH_GUIDE = { READ: READ, GERAK: GERAK, sequence: sequence, SHOLAT: SHOLAT, WUDHU: WUDHU, PEMBATAL: PEMBATAL, HAFALAN: HAFALAN };
})(window);
