# PILAR: Malam Terakhir Debat

## Judul
PILAR: Malam Terakhir Debat

## Karakter
- Arga Pratama: analis muda, tokoh pemain
- Nadira Wicaksana: kandidat reformis
- Seno Adiprana: ketua tim kampanye
- Raka Mahendra: rival populis
- Maya Lestari: moderator debat / jurnalis
- Dimas Fadli: relawan muda, suara akar rumput

## Catatan Implementasi
- Node dengan `speaker: Narrator` bisa dipakai untuk narasi dan pikiran Arga.
- Score impact ada di tiap pilihan.
- Struktur percabangan memakai label seperti `3A`, `4B`, dan seterusnya.
- Totalnya cukup padat untuk permainan sekitar 40 menit.

---

## Node 1

**Speaker:** Narrator  
**Scene:** Ruang strategi, sore hari sebelum debat final

**Text:**  
Hujan mengetuk jendela kantor kampanye seperti seseorang yang tak sabar masuk. Di layar televisi yang digantung miring di sudut ruangan, pembawa acara terus mengulang kalimat yang sama: "Debat final malam ini akan menentukan arah Balana lima tahun ke depan."

Aku berdiri di dekat papan data, memandangi tiga kolom angka yang sejak pagi tidak banyak berubah: transportasi, harga pangan, kepercayaan publik. Tiga luka yang sama, tiga janji yang terus diucapkan dengan kata-kata berbeda.

Di meja utama, Nadira menutup map berisi catatan kebijakan. Wajahnya tenang, tapi jarinya mengetuk pelan sampul map itu. Di seberangnya, Seno sudah berjalan mondar-mandir sejak lima menit lalu. Dimas duduk di sofa kecil, lututnya bergetar, ponselnya penuh pesan dari relawan lapangan.

"Aku tidak peduli berapa kali survei berubah," kata Seno akhirnya. "Malam ini kita harus menang narasi."

Nadira mengangkat mata. "Aku lebih khawatir kita kalah arah."

Aku belum genap dua minggu masuk tim ini, tapi bahkan aku bisa merasakan bahwa mereka tidak sedang berdebat soal kalimat pembuka. Mereka sedang berdebat soal seperti apa politik harus dijalankan saat seluruh kota menuntut jawaban cepat.

Seno menoleh kepadaku. "Arga. Ini giliranmu. Kalau kamu ada di kursi kami, nada apa yang kamu pilih untuk malam ini?"

**Choices:**
- Pegang data, transparansi, dan keberanian mengakui batas kebijakan. `(+2)` -> `Node 2A`
- Susun jawaban yang aman, hangat, dan mudah diterima penonton. `(+1)` -> `Node 2B`
- Serang balik lawan dengan janji yang lebih keras dan lebih cepat. `(-2)` -> `Node 2C`

---

## Node 2A

**Speaker:** Arga  
**Scene:** Ruang strategi

**Text:**  
"Aku akan pilih kejujuran yang bisa dipertanggungjawabkan," kataku. "Kalau kita ikut menjual kemudahan palsu, orang mungkin tepuk tangan malam ini. Tapi besok pagi mereka bangun dengan masalah yang sama."

Seno mengembuskan napas pendek, seperti menahan komentar yang lebih tajam.  
"Politik bukan ruang kuliah, Arga."

"Justru karena ini politik," jawabku, "setiap kalimat akan punya akibat."

Nadira menatapku beberapa detik, lalu mengangguk pelan.  
"Kalau begitu kita pakai bahasa yang jelas. Tidak defensif. Tidak berpura-pura semua bisa selesai besok."

Dimas menurunkan ponselnya. "Relawan di luar capek dengar orang bilang 'proses'. Kalau Mbak Nadira mau bicara jujur, jangan terdengar dingin."

Nadira menoleh ke arahnya. "Kalau aku bicara jujur, aku harus bicara pada rasa takut mereka, bukan hanya angka."

Seno menyandarkan kedua tangan di meja.  
"Baik. Kita coba jalan ini. Tapi begitu Raka mulai memukul dengan slogan, jangan kaget kalau ruangan tidak memberi kita waktu panjang."

**Choices:**
- Masuk ke debat dengan keyakinan bahwa publik masih bisa diajak berpikir jernih. `(+1)` -> `Node 3A`

---

## Node 2B

**Speaker:** Arga  
**Scene:** Ruang strategi

**Text:**  
"Kita tetap harus substantif," kataku, "tapi jangan bicara seperti laporan kebijakan. Orang harus merasa Nadira paham hidup mereka."

Seno langsung berhenti berjalan. "Nah. Itu baru berguna."

Nadira menyilangkan tangan. "Aku tidak mau terdengar seperti iklan."

"Bukan iklan," kataku. "Jembatan. Kita mulai dari keresahan mereka, baru masuk ke kebijakan."

Dimas mengangguk cepat. "Kalau bahasa Mbak Nadira terlalu teknis, potongannya gampang dipelintir. Orang di lapangan cuma dengar setengah kalimat."

Nadira diam sejenak, lalu tersenyum tipis.  
"Jadi maksudmu bukan mengurangi isi. Mengubah pintu masuknya."

"Ya," jawabku. "Jangan menyerah pada populisme. Tapi jangan memaksa publik masuk lewat pintu yang salah."

Seno menepuk meja pelan.  
"Bagus. Kita buat dia terdengar hangat, tegas, dan tetap aman."

Entah kenapa kata `aman` itu membuat bahuku terasa lebih berat.

**Choices:**
- Masuk ke debat dengan strategi kompromi: tetap waras, tapi harus terdengar menang. `(+1)` -> `Node 3B`

---

## Node 2C

**Speaker:** Arga  
**Scene:** Ruang strategi

**Text:**  
"Kalau malam ini lawan main emosi," kataku pelan, "kita tidak bisa datang hanya dengan folder angka. Kita butuh pukulan balik."

Seno berhenti, lalu tersenyum untuk pertama kalinya sore itu.  
"Akhirnya."

Nadira menatapku tajam. "Pukulan balik seperti apa?"

"Bukan fitnah," jawabku cepat. "Tapi kita dorong narasi yang lebih keras. Kalau mereka janji cepat, kita tunjukkan bahwa mereka takut perubahan yang nyata. Kita paksa perdebatan jadi soal keberanian."

Dimas tampak ragu. "Itu bisa bikin relawan semangat. Tapi juga bikin orang lupa isi."

Seno mengangkat bahu. "Orang memang sering lupa isi. Yang mereka ingat adalah siapa yang terdengar paling yakin."

Nadira memalingkan wajah ke jendela.  
"Aku mencalonkan diri bukan untuk jadi versi lain dari dia."

"Tapi kalau kita kalah malam ini," kata Seno, "tak ada yang peduli alasanmu."

Aku melihat rahang Nadira mengeras. Pada saat itu, aku tahu: apa pun yang kami bawa ke panggung malam ini, sebagian dari kami akan menyesalinya.

**Choices:**
- Masuk ke debat dengan strategi serangan: jangan beri lawan ruang menguasai emosi publik. `(-1)` -> `Node 3C`

---

## Node 3A

**Speaker:** Maya Lestari  
**Scene:** Panggung debat, ronde pertama

**Text:**  
Lampu studio terlalu terang. Dari balik podium, Nadira tampak tegak, sementara Raka berdiri dengan senyum yang sudah disiapkan untuk kamera.

Maya membuka ronde pertama tanpa basa-basi.  
"Balana menghadapi krisis transportasi. Bus sering terlambat, tarif menekan buruh, dan proyek integrasi moda tersendat. Ibu Nadira, apa janji pertama Anda pada warga yang ingin perubahan sekarang, bukan lima tahun lagi?"

Nadira menarik napas.  
"Janji pertama saya bukan janji tercepat. Janji pertama saya adalah perubahan yang benar-benar terjadi. Kita akan membenahi armada, jalur, dan manajemen secara bertahap, dimulai dari koridor paling padat, sambil melindungi warga yang paling terbebani oleh tarif."

Raka tertawa kecil ke mikrofonnya.  
"Warga tidak naik bus 'bertahap', Bu Nadira. Mereka berdiri berdesakan hari ini. Anak sekolah terlambat hari ini. Buruh pulang malam hari ini. Kalau Anda tidak berani menggratiskan transportasi sekarang, jangan bilang Anda paham penderitaan mereka."

Beberapa tepuk tangan terdengar.

Maya menoleh ke Nadira lagi.  
"Pertanyaannya sederhana: mengapa warga harus memilih rencana yang lebih lambat?"

Nadira melirik ke arah kami di bangku tim.

**Choices:**
- Jawab dengan jujur soal biaya, prioritas, dan siapa yang dilindungi lebih dulu. `(+3)` -> `Node 4A`
- Ringkas jawaban jadi janji yang lebih mudah dijual, tanpa terlalu detail. `(+1)` -> `Node 4B`
- Balik serang Raka sebagai penjual harapan kosong tanpa menjawab inti pertanyaan. `(-3)` -> `Node 4C`

---

## Node 3B

**Speaker:** Maya Lestari  
**Scene:** Panggung debat, ronde pertama

**Text:**  
Maya memandang kedua kandidat dengan sorot mata yang membuat panggung terasa lebih sempit.

"Balana lelah menunggu," katanya. "Soal transportasi, warga ingin tahu siapa yang memberi solusi, bukan slogan. Ibu Nadira?"

Nadira mengangguk.  
"Warga tidak butuh pidato yang terdengar besar. Warga butuh perjalanan yang lebih singkat, tarif yang lebih masuk akal, dan kepastian bahwa proyek kota tidak menggusur kehidupan mereka. Saya akan mulai dari rute yang paling menekan pekerja dan pelajar, lalu menata tarif dengan subsidi yang lebih tepat."

Raka menyela dengan cepat.  
"Artinya tetap tidak gratis. Tetap mahal. Tetap lambat. Lalu Anda minta rakyat percaya?"

Suara penonton mulai bergerak.

Maya menatap Nadira.  
"Kalau masyarakat menginginkan jawaban yang tegas malam ini, apa kalimat terjelas yang bisa Anda berikan?"

Nadira menunggu sepersekian detik. Ia sedang memilih: menjelaskan, menyederhanakan, atau menyerang.

**Choices:**
- Tegaskan prioritas dan keterbatasan anggaran secara terbuka. `(+2)` -> `Node 4A`
- Buat kalimat yang aman, hangat, dan cukup meyakinkan untuk publik. `(+1)` -> `Node 4B`
- Gunakan panggung untuk membentur Raka dengan retorika tandingan. `(-2)` -> `Node 4C`

---

## Node 3C

**Speaker:** Maya Lestari  
**Scene:** Panggung debat, ronde pertama

**Text:**  
Maya membuka sesi transportasi, dan untuk sesaat aku bisa melihat Seno condong ke depan seperti seorang petaruh yang baru meletakkan seluruh uangnya.

Nadira menjawab lebih cepat dari latihan.  
"Balana tidak bisa terus dipimpin oleh politik yang takut mengambil keputusan. Transportasi publik macet bukan karena rakyat meminta terlalu banyak, tapi karena terlalu lama kota ini dipelihara oleh orang-orang yang ahli bicara, bukan bekerja."

Raka tersenyum lebar.  
"Bagus. Jadi sekarang lawan saya adalah semua orang kecuali Anda? Menarik."

Beberapa penonton tertawa.

Maya tidak ikut tersenyum.  
"Serangan politik tidak menjawab pertanyaan kebijakan, Bu Nadira. Apa solusi Anda?"

Nadira menahan jeda yang terlalu panjang untuk televisi langsung.

Di belakang panggung, Dimas menunduk. Seno justru terlihat puas. Panggung malam ini mulai condong ke arah yang berbahaya: sorak-sorai mungkin naik, tapi pijakan kebijakan mulai licin.

**Choices:**
- Tarik kembali ke substansi: jelaskan biaya dan prioritas secara tegas. `(+1)` -> `Node 4A`
- Pilih jawaban singkat yang terdengar aman agar kerusakan tidak melebar. `(0)` -> `Node 4B`
- Teruskan serangan dan dorong emosi penonton lebih jauh. `(-3)` -> `Node 4C`

---

## Node 4A

**Speaker:** Nadira Wicaksana  
**Scene:** Panggung debat, sesaat setelah serangan pertama

**Text:**  
Nadira berdiri lebih tegak. Ketika berbicara lagi, suaranya tidak meninggi, tapi justru membuat studio lebih hening.

"Karena saya tidak mau membohongi warga Balana," katanya. "Transportasi gratis terdengar indah. Tapi kalau armadanya rusak, sopirnya kurang, dan subsidi tidak jelas, yang gratis hanya kekecewaan. Saya memilih memulai dari koridor buruh dan pelajar, menekan tarif bagi yang paling rentan, dan membuka seluruh angka pembiayaan ke publik. Kalau saya gagal menjelaskan dan mempertanggungjawabkannya, warga berhak menagih saya."

Maya menatapnya tanpa berkedip.

Raka mencoba menyela.  
"Jadi tetap saja rakyat harus menunggu."

Nadira menoleh ke arahnya.  
"Rakyat sudah terlalu sering disuruh menunggu oleh janji yang Anda tahu sendiri tak punya dasar."

Untuk pertama kalinya malam itu, tepuk tangan datang tanpa terdengar seperti belas kasihan.

Di jeda iklan, Dimas langsung mendekat ke pinggir panggung.  
"Itu bagus," bisiknya pada kami. "Relawan mulai kirim pesan. Mereka bilang Mbak Nadira terdengar berani."

Seno tetap tidak tersenyum.  
"Bagus tidak cukup. Kita lihat ronde berikutnya."

**Choices:**
- Tetap pegang garis kebijakan yang jujur dan terukur untuk isu berikutnya. `(+2)` -> `Node 5A`
- Mulai lunakkan garis agar lebih aman secara elektoral. `(+1)` -> `Node 5B`

---

## Node 4B

**Speaker:** Nadira Wicaksana  
**Scene:** Panggung debat, sesaat setelah serangan pertama

**Text:**  
Nadira menatap kamera sebelum menjawab, seperti sadar bahwa malam ini sebagian warga Balana menonton dari warung, halte, ruang tamu sempit, dan pos ronda.

"Saya ingin satu hal jelas," katanya. "Setiap keluarga di Balana berhak pulang lebih cepat, lebih murah, dan lebih aman. Saya akan mulai dari jalur yang paling menekan pekerja dan pelajar, menata tarif agar lebih ringan, dan memastikan tidak ada proyek yang dibayar dengan penggusuran diam-diam."

Itu bukan jawaban paling rinci. Tapi cukup rapi untuk dipotong jadi klip pendek.

Raka menggeleng, seolah baru mendengar iklan sabun.  
"Kata-kata yang bagus. Tapi warga tidak bisa naik simpati."

Maya mengangkat tangan kecil, menghentikan interupsi.  
"Publik akan menilai sendiri mana yang terasa nyata."

Di bangku tim, Seno mengangguk puas.  
"Ini masih bisa dimenangkan," katanya.

Dimas tidak menjawab. Ia menatap layar ponselnya terlalu lama.

**Choices:**
- Dorong Nadira kembali lebih jujur dan spesifik di ronde berikutnya. `(+1)` -> `Node 5A`
- Pertahankan pendekatan aman dan emosional agar tidak kehilangan pemilih tengah. `(+1)` -> `Node 5B`

---

## Node 4C

**Speaker:** Nadira Wicaksana  
**Scene:** Panggung debat, sesaat setelah serangan pertama

**Text:**  
Nadira melangkah setengah inci lebih maju. Cukup untuk terlihat oleh kamera.

"Yang membuat warga Balana menderita," katanya, "adalah politik yang menjual keajaiban semalam. Saudara Raka bisa berdiri di sini dan membagikan mimpi gratis kepada semua orang. Tapi saya percaya warga Balana sudah cukup sering diperlakukan seperti penonton, bukan seperti orang dewasa."

Raka tertawa.  
"Kalau Anda memanggil harapan sebagai mimpi, mungkin memang Anda tidak pernah berniat memberi apa-apa."

Sorak penonton pecah. Bukan sorak yang sepenuhnya berpihak, tapi cukup untuk membuat panggung terasa seperti arena.

Maya memotong dengan nada dingin.  
"Kita sedang membahas kebijakan, bukan keberanian berbalas sindiran."

Saat lampu jeda menyala, Seno menepuk bahuku.  
"Lihat itu? Ruangan hidup."

Dimas justru mendekat dengan wajah tegang.  
"Ruangan hidup, iya. Tapi orang jadi bicara siapa paling galak, bukan siapa paling benar."

Nadira tidak berkata apa-apa. Ia hanya membuka botol air, lalu menutupnya lagi tanpa minum.

**Choices:**
- Tarik Nadira kembali ke substansi sebelum semuanya lepas kendali. `(+0)` -> `Node 5B`
- Manfaatkan momentum dan teruskan permainan emosi. `(-3)` -> `Node 5C`

---

## Node 5A

**Speaker:** Maya Lestari  
**Scene:** Ronde kedua, isu harga pangan

**Text:**  
"Sekarang kita bicara soal harga pangan," kata Maya. "Warga Balana tidak bisa menunggu teori saat harga beras dan minyak naik minggu demi minggu. Apa yang Anda lakukan dalam seratus hari pertama?"

Raka menjawab lebih dulu malam ini.  
"Saya akan turunkan harga lewat operasi besar dan pembukaan impor cepat. Rakyat tidak peduli teori distribusi kalau dapur mereka kosong."

Lalu giliran Nadira.

Aku bisa melihat napasnya lebih teratur sekarang. Jalur ini lebih sulit, tapi ia tampak berdiri di tanah yang lebih kokoh.

"Saya akan mulai dari data distribusi, gudang, dan titik kebocoran," kata Nadira. "Bantuan harus sampai ke keluarga yang paling terpukul. Kalau kita hanya melempar subsidi tanpa pembenahan pasokan, kita membayar mahal untuk rasa lega yang pendek."

Seno mencondongkan tubuh ke arahku.  
"Jawaban seperti ini bagus untuk laporan, bukan untuk ibu-ibu yang belanja besok pagi."

Dimas berbisik lebih pelan.  
"Atau justru ini pertama kalinya ada yang bicara seolah warga bisa diajak jujur."

Maya memberi kesempatan satu kalimat penutup. Panggung menunggu: keberanian, kompromi, atau emosi.

**Choices:**
- Tegaskan bantuan terarah, transparansi distribusi, dan pengawasan publik. `(+3)` -> `Node 6A`
- Tambahkan janji bantuan luas agar terdengar lebih menenangkan. `(+1)` -> `Node 6B`
- Geser isu menjadi serangan moral pada lawan dan elite lama. `(-2)` -> `Node 6C`

---

## Node 5B

**Speaker:** Narrator  
**Scene:** Belakang panggung, jeda sebelum ronde kedua

**Text:**  
Di sela pergantian segmen, seorang staf menyerahkan secarik kertas kepada Seno. Ia membacanya cepat, lalu menatap Nadira.

"Donor utama minta satu hal," katanya. "Jangan terlalu keras bicara soal audit distribusi dan kontrak logistik. Mereka bilang itu bikin pasar panik."

Nadira langsung mengangkat kepala.  
"Pasar atau sponsor?"

Seno tidak menjawab. Itu sudah cukup sebagai jawaban.

Di sisi lain, ponsel Dimas terus berbunyi.  
"Relawan di pasar utara bilang warga cuma ingin dengar satu hal: besok ada bantuan atau tidak."

Maya memanggil kandidat kembali ke panggung. Waktunya tinggal sedikit, dan semua yang rumit mendadak harus masuk ke satu menit jawaban.

Nadira memandangku seperti meminta izin untuk menjadi siapa.

**Choices:**
- Dorong Nadira bicara jujur: bantuan harus tepat sasaran dan bersih. `(+2)` -> `Node 6A`
- Sarankan formula tengah: bantu dulu, detailkan nanti. `(+1)` -> `Node 6B`
- Anjurkan narasi emosional yang menutup pertanyaan sumber anggaran. `(-3)` -> `Node 6C`

---

## Node 5C

**Speaker:** Raka Mahendra  
**Scene:** Ronde kedua, panggung debat memanas

**Text:**  
Begitu isu harga pangan dibuka, Raka langsung mengambil panggung dengan suara yang hampir seperti seruan rapat umum.

"Orang tidak makan transparansi," katanya. "Orang makan nasi. Pemerintah yang baik adalah pemerintah yang berani bertindak, bukan duduk menghitung sambil rakyat lapar."

Penonton merespons lebih keras dari sebelumnya.

Nadira mendapat giliran. Tapi kali ini, kalau ia salah melangkah sedikit saja, seluruh malam akan berubah menjadi pertandingan gaya, bukan pertanggungjawaban.

Seno berbisik tanpa menatapku.  
"Kalau kita mau selamat, kita harus lebih keras dari dia."

Aku menatap Nadira. Untuk pertama kalinya malam ini, ada sesuatu di wajahnya yang mirip kelelahan moral.

**Choices:**
- Minta Nadira tarik rem dan kembali ke solusi nyata, meski terlambat. `(+0)` -> `Node 6B`
- Dorong Nadira mengangkat emosi penonton dan janji bantuan besar tanpa detail. `(-4)` -> `Node 6C`

---

## Node 6A

**Speaker:** Maya Lestari  
**Scene:** Ronde penutup, pertanyaan terakhir

**Text:**  
Maya menurunkan kartu pertanyaannya dan menatap kedua kandidat tanpa senyum.

"Pertanyaan terakhir," katanya. "Apa yang lebih penting bagi Anda malam ini: terdengar meyakinkan, atau tetap jujur tentang apa yang bisa dan tidak bisa Anda lakukan?"

Studio hening. Bahkan Raka tidak menyela.

Nadira memegang podium seperti seseorang yang akhirnya berhenti berlari.

"Apa pun hasil pemilu ini," katanya, "saya tidak mau memimpin Balana dengan kebohongan yang sengaja dibuat mudah dicerna. Saya tidak menjanjikan kota yang selesai dalam semalam. Saya menjanjikan pemerintah yang berani membuka angka, membuka prioritas, dan membuka dirinya untuk diawasi. Kalau itu tidak terdengar semenarik keajaiban, saya rela. Karena warga bukan penonton iklan. Warga adalah pemilik kota ini."

Aku melihat beberapa orang di baris tengah berdiri untuk bertepuk tangan. Bukan semua. Tapi cukup untuk terasa jujur.

Maya memandangnya lama, lalu berkata pelan,  
"Terima kasih. Itu jawaban yang jelas."

**Choices:**
- Biarkan Nadira menutup malam ini dengan integritas penuh. `(+3)` -> `Ending 1`
- Minta satu kalimat terakhir yang lebih aman agar tetap kompetitif. `(+1)` -> `Ending 2`

---

## Node 6B

**Speaker:** Nadira Wicaksana  
**Scene:** Ronde penutup, garis tengah yang rapuh

**Text:**  
Nadira berbicara dengan suara yang lebih lembut dari sebelumnya.

"Saya ingin Balana melihat bahwa kebijakan yang baik tidak harus memilih antara hati dan akal sehat. Kita bisa bertindak cepat untuk yang paling rentan, sambil memastikan kota ini tidak diwarisi lubang baru lima tahun ke depan."

Itu kalimat yang baik. Cukup benar. Cukup aman. Cukup bisa diterima.

Tapi juga terasa seperti jembatan yang dibangun terlalu hati-hati di atas sungai yang sedang banjir.

Maya mengangguk tipis.  
"Baik. Setidaknya Anda memilih menjawab, bukan berteriak."

Raka tersenyum ke kamera. Ia tahu malam ini bukan cuma soal siapa paling masuk akal, tapi siapa paling mudah diingat.

Di bangku tim, Seno akhirnya duduk tenang. Dimas justru tampak makin sulit membaca apakah ia lega atau kecewa.

**Choices:**
- Pertahankan garis tengah ini sampai akhir. `(+1)` -> `Ending 2`
- Ubah penutupan jadi lebih keras dan lebih bombastis di detik terakhir. `(-3)` -> `Ending 3`

---

## Node 6C

**Speaker:** Narrator  
**Scene:** Menjelang penutupan debat

**Text:**  
Ada momen ketika sebuah kampanye masih bisa berbalik, dan ada momen ketika semua orang di dalamnya tahu bahwa mereka sedang menunda pengakuan.

Nadira berdiri di podium, tapi kata-kata yang keluar malam ini tak lagi sepenuhnya miliknya. Sebagian milik ketakutan kami, sebagian milik tekanan Seno, sebagian lagi milik tepuk tangan yang terlalu mudah membuat orang lupa alasan mereka datang.

Maya menatapnya dengan wajah yang tidak lagi netral.  
"Publik butuh jawaban yang bisa diperiksa, Bu Nadira. Bukan sekadar keyakinan."

Di sisi panggung, Dimas memegang kepalanya.  
"Kalau kita menang begini," bisiknya, "apa sebenarnya yang menang?"

Seno menjawab tanpa menoleh,  
"Yang menang tetap yang bisa memerintah."

Aku tidak lagi yakin.

**Choices:**
- Minta Nadira mengakui kekacauan ini dan kembali ke kejujuran, walau mungkin sudah terlambat. `(+0)` -> `Ending 4`
- Biarkan malam ini selesai dalam sorak-sorai dan janji yang tak bisa dibuktikan. `(-4)` -> `Ending 3`

---

## Ending 1: Reformis

**Speaker:** Narrator  
**Scene:** Pagi setelah debat

**Text:**  
Pagi datang dengan hujan tipis dan tajuk berita yang tidak sepenuhnya seragam. Ada media yang menyebut Nadira terlalu kaku. Ada yang menulis bahwa ia satu-satunya kandidat yang berani bicara seperti pejabat yang akan benar-benar bekerja.

Relawan tidak merayakan dengan histeris. Mereka bekerja lebih sunyi dari sebelumnya. Tapi pesan-pesan yang masuk terasa berbeda. Bukan sekadar dukungan. Banyak yang menulis: "Akhirnya ada yang tidak menganggap kami bodoh."

Hasil cepat menunjukkan Nadira tidak menang telak. Bahkan mungkin tidak unggul penuh malam itu. Namun kota ini bergerak sedikit. Bukan karena terpukau, melainkan karena percaya.

Di kantor kampanye yang kini lebih sepi, Nadira berdiri di samping jendela yang sama seperti kemarin.

"Kita mungkin belum mengubah semuanya," katanya.

"Tidak," jawabku. "Tapi kita mengubah cara sebagian orang mendengar politik."

Ia menoleh dan tersenyum letih.  
"Kadang itu cukup untuk membuat kota mulai bergerak."

**Tone ending:** bermartabat, idealis, memberi harapan

---

## Ending 2: Pragmatis Menang

**Speaker:** Narrator  
**Scene:** Malam hasil cepat

**Text:**  
Studio televisi ramai oleh grafik dan warna. Angka bergerak pelan, lalu berhenti pada sesuatu yang bisa disebut kemenangan, asalkan orang tidak bertanya terlalu lama dengan cara apa kemenangan itu diraih.

Seno adalah orang pertama yang mengulurkan tangan padaku.  
"Politik," katanya, "selalu milik mereka yang tahu kapan harus mengalah."

Tapi malam ini aku tidak yakin siapa yang mengalah.

Nadira berdiri di depan kamera dengan wajah tenang. Ia menang, atau setidaknya cukup dekat untuk disebut berhasil. Pidatonya rapi. Pendukung bersorak. Relawan menangis lega.

Namun di sela kerumunan, Dimas hanya berkata pelan,  
"Semoga kita masih ingat janji mana yang benar-benar mau ditepati."

Nadira mendengar itu. Ia tidak membantah.

Di kota Balana, kemenangan malam itu terasa nyata. Tapi di baliknya, sebuah pertanyaan mulai tumbuh: apakah kekuasaan yang diperoleh lewat kompromi masih bisa dipakai untuk memperbaiki hal-hal yang dulu nyaris dikorbankan demi meraihnya?

**Tone ending:** menang, tetapi pahit-manis dan ambigu

---

## Ending 3: Populis Runtuh

**Speaker:** Maya Lestari  
**Scene:** Setelah debat, cuplikan berita dan reaksi publik

**Text:**  
"Potongan pidato bisa viral dalam hitungan menit," suara Maya terdengar sebagai narasi dari siaran malam. "Tapi kebijakan yang kosong selalu punya umur yang lebih pendek dari tepuk tangan."

Klip-klip Nadira yang paling keras memang beredar luas. Seruan, sindiran, janji besar. Untuk sesaat, tim kampanye hampir percaya bahwa sorak-sorai adalah bukti kemenangan.

Lalu datang pertanyaan lanjutan.  
Sumber anggaran mana?  
Prioritas yang mana dulu?  
Siapa yang diaudit?  
Apa yang benar-benar akan dilakukan dalam seratus hari?

Tak ada jawaban yang cukup rapi untuk menutup semuanya.

Keesokan paginya, tajuk berita berubah kejam. Bukan lagi soal keberanian, melainkan soal kontradiksi. Raka selamat dari panggung dengan luka lebih sedikit. Nadira keluar dari malam itu dengan sesuatu yang lebih berbahaya daripada kekalahan: kehilangan kredibilitas.

Di kantor yang kini sunyi, Seno akhirnya duduk tanpa kata-kata. Dimas melepaskan pin relawannya dan meletakkannya di meja.

Aku menatap layar yang terus memutar ulang satu kalimat, satu serangan, satu janji berlebihan.  
Untuk pertama kalinya, aku mengerti bahwa politik bisa kalah jauh sebelum pemungutan suara dimulai: saat kebenaran berhenti jadi batas.

**Tone ending:** dramatis, runtuh, ironis

---

## Ending 4: Kehilangan Arah

**Speaker:** Arga  
**Scene:** Kantor kampanye, dini hari setelah debat

**Text:**  
Debat selesai tanpa ledakan. Tidak ada sorak kemenangan yang benar-benar meyakinkan. Tidak ada pula kejatuhan yang jelas dan bersih. Yang tertinggal justru sesuatu yang lebih sunyi: kebingungan.

Kami terlalu sering mengubah langkah di tengah jalan. Saat perlu keberanian, kami berhitung. Saat perlu kehati-hatian, kami terpancing emosi. Saat publik meminta kejelasan, kami memberi campuran antara niat baik, ketakutan, dan strategi yang saling meniadakan.

Nadira duduk sendirian di ruang rapat, jaketnya masih belum dilepas.  
"Aku tidak tahu versi diriku yang muncul di panggung tadi," katanya.

Seno tidak membela diri. Dimas tidak memaki. Semua orang tampak terlalu lelah untuk mencari kambing hitam.

Aku berdiri di ambang pintu, menyadari bahwa kekalahan paling sunyi bukanlah saat orang lain lebih hebat. Kekalahan paling sunyi adalah saat kita sendiri tak lagi tahu apa yang sedang kita bela.

Di luar, hujan sudah berhenti. Kota Balana tetap ada, dengan bus yang masih terlambat, harga yang masih tinggi, dan warga yang besok akan kembali bangun pagi.

Satu-satunya hal yang benar-benar hilang malam itu adalah arah kami sendiri.

**Tone ending:** tenang, tragis, reflektif

---

## Ringkas Peta Percabangan
- `Node 1` -> `2A / 2B / 2C`
- `2A` -> `3A`
- `2B` -> `3B`
- `2C` -> `3C`
- `3A / 3B / 3C` -> `4A / 4B / 4C`
- `4A` -> `5A / 5B`
- `4B` -> `5A / 5B`
- `4C` -> `5B / 5C`
- `5A / 5B / 5C` -> `6A / 6B / 6C`
- `6A / 6B / 6C` -> `Ending 1 / 2 / 3 / 4`

## Fungsi Naratif Tiap Ending
- `Ending 1`: pemain paling tajam membaca kebijakan dan menolak populisme
- `Ending 2`: pemain cukup cerdas, tapi memilih bertahan lewat kompromi
- `Ending 3`: pemain terlalu mengikuti narasi emosional dan slogan
- `Ending 4`: pemain tidak konsisten, terlalu sering setengah mundur setengah maju
