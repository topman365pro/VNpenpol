function withTimestamps(timestamp, record) {
  return {
    ...record,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function node(timestamp, record) {
  return withTimestamps(timestamp, {
    audioUrl: null,
    isStartNode: false,
    isEndNode: false,
    musicTrackId: null,
    ...record,
  });
}

function choice(timestamp, record) {
  return withTimestamps(timestamp, {
    scoreImpact: 0,
    ...record,
  });
}

const STORY_ID = 'story-pilar-tiga-jam-balana';
const MIN_CHUNK_WORDS = 80;
const MAX_CHUNK_WORDS = 120;
const MAX_MERGED_CHUNK_WORDS = 120;

const FLAVOR_TEXT = {
  intro: `Tidak ada orang di ruangan itu yang benar-benar berbicara tentang angka semata. Yang dipertaruhkan oleh tiga jam terakhir ini adalah apakah kampanye Nadira akan tetap memakai politik sebagai cara menjelaskan kenyataan, atau menyerah menjadikannya sekadar alat untuk menaklukkan malam. Dari awal sudah terasa bahwa setiap keputusan kecil malam ini akan hidup lebih lama daripada durasi siarannya sendiri.`,
  prep: {
    a: `Aku bisa merasakan ruangan menegang setiap kali kebenaran dibiarkan tetap utuh. Bukan karena semua orang menolaknya, melainkan karena semua orang tahu kejujuran seperti itu membuat kemenangan terasa kurang pasti sekaligus lebih layak diperjuangkan. Dalam kampanye, ketegangan semacam ini sering menjadi tanda bahwa isi dan keberanian sedang benar-benar saling menuntut.`,
    b: `Versi tengah seperti ini selalu terdengar paling masuk akal di kepala orang dewasa yang lelah. Justru itu bahayanya: sedikit demi sedikit ia dapat berubah dari jembatan menuju substansi menjadi alasan untuk menunda bagian tersulitnya. Jika dibiarkan terlalu lama, kompromi tidak lagi berfungsi sebagai penghubung, melainkan sebagai kabut yang menunda penjelasan.`,
    c: `Setiap kali kami memilih nada yang lebih keras, ruangan memang bergerak lebih cepat. Tapi aku juga melihat detail-detail kebijakan mulai tertinggal di belakang, seperti orang yang kalah lari dari slogan yang terlalu pandai memancing tepuk tangan. Semakin besar tepuknya, semakin sulit mengajak semua orang kembali berjalan pelan melewati konsekuensi nyata.`,
  },
  stage: {
    a: `Dari bangku tim, aku bisa merasakan perbedaan antara penonton yang tersentuh dan penonton yang sungguh-sungguh diyakinkan. Jalur ini tidak memberi ledakan mudah, tetapi justru di situlah bobot politiknya terasa: orang mulai mendengar sambil menimbang, bukan sekadar bereaksi. Beratnya bukan pada volume, melainkan pada keberanian mempertahankan penjelasan ketika semua orang meminta ringkasan.`,
    b: `Semakin lama segmen berjalan, semakin jelas bahwa jalur kompromi hidup dari keseimbangan yang rapuh. Sedikit terlalu rinci, ia terdengar kaku. Sedikit terlalu halus, ia terdengar seperti orang yang sedang menyembunyikan sesuatu yang belum siap dibela di depan umum. Tak ada lampu peringatan yang jelas; yang ada hanya perasaan pelan bahwa satu kalimat lagi bisa membuat semuanya miring.`,
    c: `Energi studio memang naik setiap kali benturan diperkeras. Namun dari dekat, aku melihat biaya yang tidak tertangkap kamera: setiap sorak membuat kebutuhan untuk menjelaskan mengecil, dan setiap kebutuhan yang mengecil membuat pijakan kampanye ikut menipis. Di televisi itu tampak seperti keberanian; di dalam kepala, aku tahu sebagian darinya hanyalah ketakutan yang diberi mikrofon.`,
  },
  late: {
    a: `Semakin dekat malam berakhir, semakin jelas bahwa kejujuran bukan sekadar pilihan moral, melainkan cara menjaga cerita kampanye tetap utuh dari awal sampai akhir. Tanpa itu, semua memo, debat, dan janji tadi hanya akan tinggal sebagai potongan yang tidak saling menanggung. Yang sedang dipertahankan bukan cuma citra, melainkan hubungan sebab-akibat yang membuat politik masih masuk akal bagi warga biasa.`,
    b: `Di fase akhir seperti ini, jalan tengah terasa seperti jembatan yang dibangun sambil dilewati. Ia masih bisa menyelamatkan banyak hal, tetapi setiap papan yang kurang kokoh membuatku bertanya apakah kami sedang menjaga keseimbangan atau hanya menunda keputusan paling penting. Orang sering menyebutnya realistis, padahal kadang ia hanya nama lain dari rasa takut memilih bentuk yang tegas.`,
    c: `Jalur ini memberi ilusi bahwa selalu ada satu ledakan lagi yang bisa memperbaiki keadaan. Justru karena itu ia paling berbahaya: kampanye mulai percaya bahwa arah bisa diganti kapan saja, padahal publik biasanya lebih cepat mencium kepanikan daripada ketegasan. Bila dibiarkan, ilusi itu membuat setiap langkah berikutnya terasa mendesak sekaligus semakin kosong.`,
  },
};

function withFlavor(record) {
  if (record.isEndNode) {
    return record;
  }

  if (record.id === 'pilar-tiga-jam-node-1') {
    return {
      ...record,
      text: `${record.text}\n\n${FLAVOR_TEXT.intro}`,
    };
  }

  const route = record.id.slice(-1);
  const group = record.editorDepth <= 4 ? 'prep' : record.editorDepth <= 9 ? 'stage' : 'late';
  const extra = FLAVOR_TEXT[group]?.[route];

  if (!extra) {
    return record;
  }

  return {
    ...record,
    text: `${record.text}\n\n${extra}`,
  };
}

function storyNode(timestamp, record) {
  return node(timestamp, withFlavor({ storyId: STORY_ID, ...record }));
}

function countWords(text) {
  return String(text).trim().split(/\s+/).filter(Boolean).length;
}

function sentenceSplit(text) {
  const matches = text.match(/[^.!?]+(?:[.!?]+["']?)?|[^.!?]+$/g);
  return (matches ?? [text]).map((part) => part.trim()).filter(Boolean);
}

function splitSentenceFallback(text, maxWords) {
  const words = String(text).trim().split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) {
    return [text.trim()];
  }

  const chunks = [];
  for (let index = 0; index < words.length; index += maxWords) {
    chunks.push(words.slice(index, index + maxWords).join(' '));
  }
  return chunks;
}

function expandUnit(text, maxWords) {
  if (countWords(text) <= maxWords) {
    return [text.trim()];
  }

  const sentences = sentenceSplit(text);
  if (sentences.length === 1) {
    return splitSentenceFallback(text, maxWords);
  }

  const units = [];
  let current = [];
  let currentWords = 0;

  for (const sentence of sentences) {
    const sentenceWords = countWords(sentence);
    if (sentenceWords > maxWords) {
      if (current.length > 0) {
        units.push(current.join(' ').trim());
        current = [];
        currentWords = 0;
      }
      units.push(...splitSentenceFallback(sentence, maxWords));
      continue;
    }

    if (currentWords > 0 && currentWords + sentenceWords > maxWords) {
      units.push(current.join(' ').trim());
      current = [sentence];
      currentWords = sentenceWords;
      continue;
    }

    current.push(sentence);
    currentWords += sentenceWords;
  }

  if (current.length > 0) {
    units.push(current.join(' ').trim());
  }

  return units;
}

function chunkText(text, minWords = MIN_CHUNK_WORDS, maxWords = MAX_CHUNK_WORDS) {
  const paragraphs = String(text)
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  const units = paragraphs.flatMap((paragraph) => expandUnit(paragraph, maxWords));
  const chunkUnits = [];
  let current = [];
  let currentWords = 0;

  for (const unit of units) {
    const unitWords = countWords(unit);
    if (currentWords === 0) {
      current.push(unit);
      currentWords = unitWords;
      continue;
    }

    if (currentWords + unitWords <= maxWords || (currentWords < minWords && currentWords + unitWords <= MAX_MERGED_CHUNK_WORDS)) {
      current.push(unit);
      currentWords += unitWords;
      continue;
    }

    chunkUnits.push([...current]);
    current = [unit];
    currentWords = unitWords;
  }

  if (current.length > 0) {
    chunkUnits.push([...current]);
  }

  if (chunkUnits.length > 1) {
    const lastChunkUnits = chunkUnits[chunkUnits.length - 1];
    const previousChunkUnits = chunkUnits[chunkUnits.length - 2];

    while (
      countWords(lastChunkUnits.join('\n\n')) < minWords
      && previousChunkUnits.length > 1
    ) {
      const previousWithoutCandidateWords = countWords(previousChunkUnits.slice(0, -1).join('\n\n'));
      if (previousWithoutCandidateWords < minWords - 10) {
        break;
      }

      lastChunkUnits.unshift(previousChunkUnits.pop());
    }

    const lastChunk = lastChunkUnits.join('\n\n').trim();
    const previousChunk = previousChunkUnits.join('\n\n').trim();
    if (countWords(lastChunk) < minWords && countWords(previousChunk) + countWords(lastChunk) <= MAX_MERGED_CHUNK_WORDS) {
      chunkUnits.splice(chunkUnits.length - 2, 2, [...previousChunkUnits, ...lastChunkUnits]);
    }
  }

  return chunkUnits.map((units) => units.join('\n\n').trim()).filter(Boolean);
}

function chunkedNodeId(baseId, index) {
  return index === 0 ? baseId : `${baseId}__${index + 1}`;
}

function expandStoryIntoContinuationNodes(timestamp, storyData) {
  const finalNodeIds = new Map();
  const nodes = [];
  const continuationChoices = [];

  for (const originalNode of storyData.nodes) {
    const chunks = chunkText(originalNode.text);
    if (chunks.length === 1) {
      nodes.push(originalNode);
      finalNodeIds.set(originalNode.id, originalNode.id);
      continue;
    }

    const orderBase = Number(originalNode.editorOrder ?? 0) * 10;
    for (let index = 0; index < chunks.length; index += 1) {
      const id = chunkedNodeId(originalNode.id, index);
      const isFinalChunk = index === chunks.length - 1;
      nodes.push({
        ...originalNode,
        id,
        text: chunks[index],
        isStartNode: index === 0 ? originalNode.isStartNode : false,
        isEndNode: isFinalChunk ? originalNode.isEndNode : false,
        editorOrder: orderBase + index,
      });

      if (!isFinalChunk) {
        continuationChoices.push(
          choice(timestamp, {
            id: `${originalNode.id}__continue_${index + 1}`,
            nodeId: id,
            targetNodeId: chunkedNodeId(originalNode.id, index + 1),
            text: 'Lanjut',
            scoreImpact: 0,
          }),
        );
      }
    }

    finalNodeIds.set(originalNode.id, chunkedNodeId(originalNode.id, chunks.length - 1));
  }

  const choices = [
    ...continuationChoices,
    ...storyData.choices.map((originalChoice) => ({
      ...originalChoice,
      nodeId: finalNodeIds.get(originalChoice.nodeId) ?? originalChoice.nodeId,
    })),
  ];

  return {
    ...storyData,
    nodes,
    choices,
  };
}

export function buildPilarLongStoryData(timestamp) {
  const storyData = {
    stories: [
      withTimestamps(timestamp, {
        id: STORY_ID,
        title: 'PILAR: Tiga Jam Sebelum Balana Memilih',
        description:
          'Tiga jam terakhir sebelum kota memilih memaksa kamu menilai memo kebijakan, pidato, dan serangan politik demi menjaga kampanye Nadira tetap berpijak pada warga.',
        defaultMusicTrackId: 'music-pilar-briefing',
      }),
    ],
    characters: [],
    characterSprites: [],
    backgrounds: [],
    musicTracks: [],
    nodes: [
      storyNode(timestamp, {
        id: 'pilar-tiga-jam-node-1',
        characterId: null,
        characterSpriteId: null,
        backgroundId: 'bg-pilar-strategy-room',
        musicTrackId: 'music-pilar-briefing',
        editorDepth: 0,
        editorOrder: 0,
        isStartNode: true,
        text: `Tiga jam lagi Balana memasuki masa tenang. Debat final sudah selesai, tetapi kota belum benar-benar memutuskan apa-apa. Layar besar di ruang strategi memperlihatkan angka yang membuat semua orang bicara lebih pelan: selisih elektabilitas Nadira dan Raka tinggal dua koma satu poin, dan mayoritas pemilih yang belum menentukan pilihan justru berada di kantong buruh, pelajar, dan keluarga muda yang paling terpukul oleh ongkos hidup.

Di meja utama, map transportasi dan harga pangan menumpuk seperti tuduhan yang belum selesai dijawab. Nadira membaca lagi catatan penutup yang nanti akan ia bawa ke wawancara malam. Seno sudah menandai bagian-bagian yang menurutnya terlalu hati-hati. Dimas baru pulang dari lapangan dengan lusinan pesan suara dari relawan, ketua RT, pedagang pasar, dan pengemudi angkot yang semuanya mengatakan hal berbeda dengan nada yang sama-sama mendesak.

"Tiga jam ini cukup untuk menyelamatkan kampanye atau merusaknya sendiri," kata Seno tanpa menoleh dari grafik.

Nadira mengangkat mata. "Kalau kita selamat dengan cara yang salah, belum tentu kota ikut selamat."

Ia memandangku. Di ruangan yang dipenuhi orang lebih senior, tatapan itu terasa seperti penyerahan beban. "Arga, mulai dari kamu. Arah dasarnya apa?"`,
      }),
      storyNode(timestamp, {
        id: 'pilar-tiga-jam-node-2a',
        characterId: 'char-arga-pratama',
        characterSpriteId: null,
        backgroundId: 'bg-pilar-strategy-room',
        editorDepth: 1,
        editorOrder: 0,
        text: `"Kalau kita mau meyakinkan orang yang masih ragu, kita harus bicara seolah mereka berhak tahu konsekuensi kebijakan kita," kataku. "Bukan cuma manfaat yang enak didengar."

Seno berhenti memutar spidol di jarinya. "Kalau kamu mulai dengan konsekuensi, orang bisa pindah kanal sebelum sempat dengar maksudmu."

"Kalau kita mulai dengan kebohongan yang rapi, mereka bisa pindah keyakinan begitu angka pertama dibuka," balasku.

Nadira menutup mapnya. "Aku bisa hidup dengan jawaban yang tidak populer. Yang tidak bisa kutanggung adalah menang karena mendorong orang mempercayai sesuatu yang kita sendiri tahu rapuh."

Dimas mengangguk pelan. "Di lapangan, orang capek dibohongi. Tapi mereka juga capek diceramahi. Kalau kita ambil jalur jujur, bahasanya harus terasa seperti menolong, bukan menggurui."

Aku menangkap perubahan kecil di wajah Nadira: bukan lega, melainkan keputusan untuk menanggung risiko tertentu. Itu selalu langkah pertama dari malam-malam politik yang panjang.`,
      }),
      storyNode(timestamp, {
        id: 'pilar-tiga-jam-node-2b',
        characterId: 'char-arga-pratama',
        characterSpriteId: null,
        backgroundId: 'bg-pilar-strategy-room',
        editorDepth: 1,
        editorOrder: 1,
        text: `"Kita tetap harus jujur," kataku, "tapi pintu masuknya jangan dari angka. Mulai dari rasa takut orang: ongkos naik, proyek masuk kampung, gaji tidak ikut bergerak. Baru dari sana kita tunjukkan kenapa kebijakan Nadira lebih masuk akal."

Seno mengangguk pendek. "Akhirnya ada kalimat yang tahu televisi itu apa."

Nadira menatapku beberapa saat. "Berarti bukan mengurangi isi. Kita hanya mengubah cara membuka percakapan."

"Iya," jawabku. "Kalau kita bicara seperti memo kebijakan, orang akan merasa sedang disalahkan karena hidupnya rumit. Kalau kita bicara seperti tetangga yang ikut menanggung masalahnya, mereka mungkin mau bertahan lebih lama mendengar sisanya."

Dimas meletakkan ponselnya di meja. "Relawan juga minta itu. Mereka bilang warga belum tentu menolak isi kita. Mereka cuma sering berhenti mendengar sebelum sampai ke bagian penting."

Seno tersenyum tipis, cukup untuk terasa berbahaya. "Baik. Hangat, tegas, dan tetap bisa menang. Jangan sampai bagian terakhir hilang."`,
      }),
      storyNode(timestamp, {
        id: 'pilar-tiga-jam-node-2c',
        characterId: 'char-arga-pratama',
        characterSpriteId: null,
        backgroundId: 'bg-pilar-strategy-room',
        editorDepth: 1,
        editorOrder: 2,
        text: `"Kalau kita masuk tiga jam terakhir ini hanya dengan niat baik, Raka akan menelan ruangnya sebelum kita sempat menjelaskan apa pun," kataku. "Kita butuh garis serang yang jelas."

Seno langsung menoleh. "Itu baru terdengar seperti orang yang mengerti waktu."

Nadira menyipitkan mata. "Serang dari mana?"

"Dari kontradiksi mereka sendiri," jawabku. "Raka bicara soal keberanian, tapi semua angka di timnya berdiri di atas asumsi yang tak pernah dia buka ke publik. Kita paksa percakapan ke sana. Kita buat dia terlihat menjual keberanian palsu."

Dimas tampak tidak nyaman. "Kalau nadanya terlalu keras, relawan kita mungkin semangat. Tapi orang yang bimbang bisa merasa semua kandidat sama saja."

Seno mengangkat bahu. "Pemilih bimbang sering baru bergerak kalau ada benturan."

Nadira memandang layar survei, lalu ke arahku. "Kalau kita ambil jalur ini, pastikan ada jalan pulang ke substansi. Aku tidak mau malam ini selesai hanya sebagai adu volume."`,
      }),
      storyNode(timestamp, {
        id: 'pilar-tiga-jam-node-3a',
        characterId: 'char-arga-pratama',
        characterSpriteId: null,
        backgroundId: 'bg-pilar-strategy-room',
        editorDepth: 2,
        editorOrder: 0,
        text: `Tumpukan memo transportasi kubuka lagi. Catatan paling atas menjelaskan tiga hal yang tidak pernah muat di spanduk kampanye: subsidi tarif hanya bisa menekan ongkos jika audit operator berjalan, proyek koridor baru berisiko menggusur penyewa kecil di sekitar stasiun, dan janji "gratis total" hanya mungkin kalau kota mengorbankan anggaran pemeliharaan dalam enam bulan pertama.

Aku membacakan poin-poin itu keras-keras. Nadira mendengarkan dengan tenang. Seno tampak seperti sedang menghitung berapa banyak kalimat yang harus dipotong agar semuanya bisa masuk ke dua puluh detik televisi. Dimas justru meminta kertas itu untuk difoto; ia bilang relawan sering kalah saat berhadapan dengan slogan karena mereka sendiri tidak memegang struktur argumen.

"Kalau kita buka semuanya," kata Seno, "orang akan dengar kata audit, penggusuran, dan pemeliharaan. Tiga kata itu tidak pernah menang melawan kata gratis."

"Justru itu alasannya harus dibuka," jawabku. "Supaya pilihan orang bukan pilihan yang dimanipulasi."

Ruangan hening sejenak. Pilihannya sederhana di atas kertas, tetapi mahal di panggung.`,
      }),
      storyNode(timestamp, {
        id: 'pilar-tiga-jam-node-3b',
        characterId: 'char-arga-pratama',
        characterSpriteId: null,
        backgroundId: 'bg-pilar-strategy-room',
        editorDepth: 2,
        editorOrder: 1,
        text: `Memo yang sama terlihat berbeda ketika dibaca dengan niat menenangkan orang. Di satu sisi ada risiko anggaran dan potensi kenaikan biaya pemeliharaan. Di sisi lain ada ruang untuk subsidi bertahap, perlindungan penyewa, dan pemotongan ongkos bagi koridor yang paling padat pekerja.

"Kalau kita buka semuanya mentah-mentah, orang akan merasa kita datang membawa masalah baru," kataku. "Tapi kalau kita sembunyikan semua, kita hanya mengulangi cara kampanye lain bekerja."

Nadira mengetuk kolom rent-protection dengan kukunya. "Jadi kita harus pilih bagian mana yang menjadi jembatan."

Dimas mengirim foto memo ke koordinator lapangan. "Warga pasar bilang yang mereka takutkan bukan cuma tarif. Mereka takut proyek besar selalu berakhir dengan orang kecil diminta pindah lebih dulu."

Seno bersandar dan mendesah. "Bagus. Berarti kita punya narasi. Pertanyaannya: narasi yang tetap cukup jujur, atau narasi yang cukup ringan untuk dibawa pulang penonton?"

Di depan kami, memo kebijakan mulai terasa seperti cermin kecil: siapa pun bisa melihat dirinya sendiri di dalamnya, tergantung bagian mana yang dipilih untuk disinari.`,
      }),
      storyNode(timestamp, {
        id: 'pilar-tiga-jam-node-3c',
        characterId: 'char-arga-pratama',
        characterSpriteId: null,
        backgroundId: 'bg-pilar-strategy-room',
        editorDepth: 2,
        editorOrder: 2,
        text: `Aku membalik memo transportasi ke halaman yang paling berguna untuk menyerang lawan. Ada tabel perbandingan yang menunjukkan janji tiket gratis tim Raka tidak pernah menjelaskan sumber subsidi, tidak memasukkan biaya perawatan armada, dan sengaja menaruh proyeksi pendapatan iklan paling optimistis seolah-olah itu kepastian.

Seno mendekat begitu melihat kolom merah yang kutandai. "Nah. Itu yang orang paham. Kontradiksi. Angka yang bisa dibenturkan."

Nadira membaca pelan, lalu menutup map. "Kalau kita pakai ini, kita harus tetap siap menjawab model kita sendiri. Aku tidak mau sekadar menunjuk lubang orang lain tanpa membuka rumah kita."

Dimas menyela dari sofa. "Di lapangan, orang memang marah pada janji gratis. Tapi mereka juga marah kalau politisi cuma saling menyebut bohong tanpa memberi peta keluar."

Aku memandangi tabel itu lebih lama. Dokumen kebijakan bisa menjadi alat pendidikan. Bisa juga menjadi pisau. Malam ini, perbedaan keduanya mungkin cuma soal urutan kalimat yang dipilih.`,
      }),
      storyNode(timestamp, {
        id: 'pilar-tiga-jam-node-4a',
        characterId: 'char-dimas-fadli',
        characterSpriteId: 'sprite-dimas-hopeful',
        backgroundId: 'bg-pilar-newsroom',
        editorDepth: 3,
        editorOrder: 0,
        text: `Dimas menyambungkan ponselnya ke speaker dan satu per satu pesan suara lapangan memenuhi ruangan. Seorang perawat malam meminta koridor pagi tetap jalan bahkan saat subsidi belum penuh. Seorang siswa SMK bercerita tentang dua kali pindah angkot sebelum sampai sekolah. Seorang ibu yang menyewa kamar dekat pasar takut jalur baru justru membuat pemilik kontrakan menaikkan harga sewa.

"Mereka tidak meminta keajaiban," kata Dimas setelah rekaman terakhir berhenti. "Mereka cuma mau diyakinkan bahwa perubahan ini tidak datang dengan menukar mereka sebagai korban."

Nadira berdiri di dekat layar, kedua tangannya menyilang, lalu melepaskannya lagi. "Kalau aku bicara soal transportasi tanpa menyebut sewa dan jam kerja, aku hanya sedang menjual proyek."

Seno belum sepenuhnya setuju, tetapi ia juga tahu suara lapangan sulit dibantah ketika terdengar langsung. Untuk sesaat, kampanye terasa seperti apa yang selalu dijanjikannya: ruang di mana warga hadir bukan sebagai penonton, melainkan sebagai ukuran benar-salah dari setiap kalimat.`,
      }),
      storyNode(timestamp, {
        id: 'pilar-tiga-jam-node-4b',
        characterId: 'char-dimas-fadli',
        characterSpriteId: 'sprite-dimas-anxious',
        backgroundId: 'bg-pilar-newsroom',
        editorDepth: 3,
        editorOrder: 1,
        text: `Dimas memutar beberapa pesan suara, tetapi kali ini reaksinya lebih gelisah daripada lega. Ada pedagang yang ingin ongkos dipotong sekarang juga. Ada mahasiswa yang bicara soal rumah susun dekat stasiun. Ada buruh pabrik yang hanya bertanya apakah besok ia akan tetap tiba tepat waktu tanpa harus mengorbankan satu kali makan.

"Masalahnya bukan kita tidak punya jawaban," katanya. "Masalahnya warga mendengar tiga kekhawatiran sekaligus dan tidak punya waktu memilah mana yang dijawab dulu."

Aku memahami maksudnya. Pesan lapangan yang kaya mudah berubah jadi kekacauan bila dibawa mentah ke panggung. Seno justru menggunakan itu untuk argumennya. "Karena itu kita butuh satu kalimat yang menenangkan semuanya sekaligus."

Nadira menoleh. "Tidak ada satu kalimat yang jujur untuk semua rasa takut."

"Mungkin tidak," jawabku. "Tapi ada kalimat yang cukup baik untuk menjaga orang tetap mendengarkan sampai penjelasan kedua."

Di layar, gelombang sentimen media sosial bergerak naik turun seperti detak jantung yang tidak pernah stabil.`,
      }),
      storyNode(timestamp, {
        id: 'pilar-tiga-jam-node-4c',
        characterId: 'char-dimas-fadli',
        characterSpriteId: 'sprite-dimas-anxious',
        backgroundId: 'bg-pilar-newsroom',
        editorDepth: 3,
        editorOrder: 2,
        text: `Pesan suara yang dipilih Dimas kali ini semuanya tajam. Pengemudi yang merasa pendapatannya digerus. Pedagang yang marah pada janji proyek. Orang tua murid yang mengaku lelah mendengar kata "transisi". Ruangan mendadak penuh oleh kemarahan warga, dan aku bisa melihat Seno mulai menyusun kalimat-kalimat yang bisa menjadikan kemarahan itu bahan bakar kampanye.

"Kalau kita potong jadi tiga klip pendek, semuanya akan viral sebelum sejam," katanya.

Dimas langsung menggeleng. "Kalau cuma klip marah yang kita pakai, seolah-olah warga cuma berguna saat sedang kecewa."

Nadira tidak segera menjawab. Ia tampak terbelah antara kebutuhan menjaga daya pukul dan keengganan memperlakukan keresahan publik sebagai properti panggung.

Aku sendiri tahu satu hal: kemarahan selalu lebih mudah dikemas daripada penjelasan. Justru karena itu, keputusan tentang bagaimana memakai suara lapangan akan menentukan apakah kampanye ini masih pantas menyebut dirinya berbeda.`,
      }),
      storyNode(timestamp, {
        id: 'pilar-tiga-jam-node-5a',
        characterId: 'char-seno-adiprana',
        characterSpriteId: 'sprite-seno-pressing',
        backgroundId: 'bg-pilar-strategy-room',
        musicTrackId: 'music-pilar-briefing',
        editorDepth: 4,
        editorOrder: 0,
        text: `Seno memulai simulasi seperti pelatih yang tahu pertandingan akan ditentukan oleh satu kesalahan kecil. Ia memainkan peran Maya dan melempar pertanyaan paling sulit: siapa yang membayar perlindungan sewa, siapa yang menanggung subsidi awal, dan bagaimana Nadira memastikan audit operator tidak berubah jadi drama birokrasi yang menunda perbaikan.

Nadira menjawab tanpa melihat catatan. Kali ini, ia memasukkan pekerja shift malam, siswa lintas kecamatan, dan penyewa kecil ke dalam satu jawaban yang sama. Bukan jawaban singkat, tetapi utuh.

Seno mengangkat tangan. "Kuat. Tapi televisi langsung memakan waktu seperti pemungut pajak. Kamu harus bisa menyisakan inti yang tidak jatuh."

Ia menoleh kepadaku. "Arga, sekarang tentukan: Nadira berangkat ke panggung dengan struktur penuh, atau dengan versi yang dipadatkan agar tetap bisa memukul?"

Ruangan menunggu. Perbedaan dua pilihan itu mungkin hanya belasan kata. Akibatnya bisa mengubah seluruh malam.`,
      }),
      storyNode(timestamp, {
        id: 'pilar-tiga-jam-node-5b',
        characterId: 'char-seno-adiprana',
        characterSpriteId: 'sprite-seno-composed',
        backgroundId: 'bg-pilar-strategy-room',
        musicTrackId: 'music-pilar-briefing',
        editorDepth: 4,
        editorOrder: 1,
        text: `Simulasi berjalan lebih halus dari yang kuduga. Nadira mencoba kalimat pembuka yang lebih hangat, menyebut pulang kerja, ongkos sekolah, dan kontrakan yang makin sempit sebelum masuk ke tabel biaya. Hasilnya tidak sekuat versi paling jujur, tetapi juga tidak terdengar seperti iklan kosong.

Seno justru memanfaatkan ruang abu-abu itu. "Ini bisa kerja kalau dia disiplin. Jangan tergoda menjelaskan terlalu banyak ketika dipotong. Penonton harus merasa dia memegang kendali."

Nadira menoleh kepadaku. "Masalahnya, kalau aku terlalu disiplin, aku bisa terdengar menahan sesuatu."

Dimas menggeser kursinya mendekat. "Relawan suka versi ini. Tapi mereka bilang jangan sampai kita terdengar seperti menjanjikan ketenangan. Orang tidak hidup tenang. Mereka hidup dengan hitungan yang mepet."

Itu inti dari jalur tengah: cukup dekat pada kebenaran untuk dipercaya, cukup sederhana untuk diingat. Pertanyaannya tinggal satu. Seberapa banyak bagian yang rela kita lepaskan agar sisanya tetap hidup di kepala publik?`,
      }),
      storyNode(timestamp, {
        id: 'pilar-tiga-jam-node-5c',
        characterId: 'char-seno-adiprana',
        characterSpriteId: 'sprite-seno-pressing',
        backgroundId: 'bg-pilar-strategy-room',
        musicTrackId: 'music-pilar-briefing',
        editorDepth: 4,
        editorOrder: 2,
        text: `Versi latihan yang paling agresif membuat ruangan tiba-tiba terasa kecil. Seno sengaja melempar pertanyaan sebagai tuduhan, bukan undangan menjawab. Nadira menanggapinya dengan tempo cepat: menyebut ketidakjujuran angka lawan, kontraktor yang bersembunyi di balik slogan, dan risiko kota dipimpin oleh kampanye yang menganggap keberanian bisa dipalsukan.

Kekuatan kalimat itu tidak bisa disangkal. Bahkan Dimas, yang paling khawatir pada gaya seperti ini, mengakui ruangan mendadak "hidup". Tetapi sesudahnya selalu ada jeda canggung. Jeda ketika semua orang menyadari bahwa yang paling diingat nanti mungkin bukan isi, melainkan benturan.

"Kita bisa pakai ini untuk memaksa Raka bertahan," kata Seno.

"Atau kita bisa terjebak di permainan yang dia kuasai," jawab Nadira.

Aku melihat catatan substansi masih terbuka di meja, tetapi dalam suasana seperti ini, kertas-kertas itu mulai tampak seperti penonton yang tidak lagi diajak bicara.`,
      }),
      storyNode(timestamp, {
        id: 'pilar-tiga-jam-node-6a',
        characterId: 'char-maya-lestari',
        characterSpriteId: 'sprite-maya-probing',
        backgroundId: 'bg-pilar-debate-stage',
        musicTrackId: 'music-pilar-debate',
        editorDepth: 5,
        editorOrder: 0,
        text: `Ketika siaran langsung dimulai lagi, Maya memilih sudut yang paling sulit lebih dulu. "Banyak warga mendukung perbaikan transportasi, tetapi khawatir proyek kota selalu berakhir dengan penyewa kecil dan pekerja informal yang membayar harga sosialnya. Bagaimana Anda menjamin reformasi Anda tidak memindahkan beban dari jalan ke kontrakan?"

Nadira menerima pertanyaan itu tanpa kelihatan terkejut. Ia bicara tentang perlindungan sewa, prioritas koridor buruh dan pelajar, audit operator, dan hak warga untuk melihat seluruh skema pembiayaan. Bukan jawaban yang pendek, tetapi cukup jelas untuk membedakan proyek dari kebijakan publik.

Raka segera masuk dengan senyum yang hampir santai. "Warga tidak bisa makan audit, Bu Nadira. Mereka ingin ongkos turun sekarang, bukan lima rapat lagi."

Penonton bergeser. Maya tidak menolong siapa pun. Ia hanya menatap Nadira lagi, menunggu apakah jawaban berikutnya akan tetap berdiri di atas pijakan yang sama atau mulai dikorbankan demi tepuk tangan.`,
      }),
      storyNode(timestamp, {
        id: 'pilar-tiga-jam-node-6b',
        characterId: 'char-maya-lestari',
        characterSpriteId: 'sprite-maya-probing',
        backgroundId: 'bg-pilar-debate-stage',
        musicTrackId: 'music-pilar-debate',
        editorDepth: 5,
        editorOrder: 1,
        text: `Maya membuka dengan pertanyaan yang sama, tetapi malam ini suasananya lebih cair. Nadira menjawab dengan menempatkan keluarga pekerja dan penyewa kecil di depan, lalu baru menjelaskan bahwa perlindungan tarif dan pengendalian sewa harus berjalan berdampingan. Jawaban itu cukup hangat untuk tidak terasa teknokratis, cukup terstruktur untuk belum kehilangan tulang.

Raka, seperti yang diperkirakan, menertawakannya. "Jadi warga harus percaya pada lapisan demi lapisan? Orang yang besok berangkat jam lima pagi tidak punya waktu menghafal skema."

Tawa kecil muncul di beberapa sudut studio. Bukan cibiran penuh, tapi cukup untuk menggoda siapa pun yang ada di podium agar memotong penjelasan dan memilih kalimat paling aman.

Maya mengangkat alis tipis. "Kalau memang skema itu penting, jelaskan bagian mana yang harus dipercaya publik lebih dulu."

Dari bangku tim, aku tahu jawaban berikutnya akan menentukan apakah jalur tengah ini masih bisa dipertahankan, atau justru retak karena terlalu ingin terdengar tenang.`,
      }),
      storyNode(timestamp, {
        id: 'pilar-tiga-jam-node-6c',
        characterId: 'char-maya-lestari',
        characterSpriteId: 'sprite-maya-neutral',
        backgroundId: 'bg-pilar-debate-stage',
        musicTrackId: 'music-pilar-debate',
        editorDepth: 5,
        editorOrder: 2,
        text: `Begitu transportasi dibuka, Nadira mengambil jalan keras lebih cepat dari perkiraan. Ia menuduh lawan menjual keberanian sintetis, menyinggung kontraktor yang bersembunyi di balik janji gratis, dan menekan satu hal terus-menerus: kota tidak bisa diserahkan pada orang yang sengaja menyembunyikan ongkos sesungguhnya.

Studio langsung hidup. Raka tersenyum seperti orang yang justru senang didorong ke arena. "Silakan serang saya," katanya. "Tapi warga Balana akan tetap bertanya siapa yang menurunkan ongkos mereka besok pagi."

Kalimat itu memukul tepat ke bagian yang belum selesai kami ikat. Maya menunggu, tidak terburu-buru, seolah tahu jeda sesaat bisa lebih mematikan daripada interupsi.

Di belakang kamera, Seno terlihat hampir puas. Dimas justru memejam sebentar. Aku paham kenapa. Bila jawaban berikutnya tidak kembali ke tanah, semua energi yang tadi tampak seperti kemenangan bisa berubah jadi bukti bahwa kami tak punya rem ketika sorot mulai menyala.`,
      }),
      storyNode(timestamp, {
        id: 'pilar-tiga-jam-node-7a',
        characterId: 'char-nadira-wicaksana',
        characterSpriteId: 'sprite-nadira-resolute',
        backgroundId: 'bg-pilar-backstage',
        musicTrackId: 'music-pilar-briefing',
        editorDepth: 6,
        editorOrder: 0,
        text: `Lampu panggung belum padam ketika seorang staf membawa ponsel satelit kecil ke belakang panggung. Seno membaca pesan yang masuk lalu mendecakkan lidah. Donor utama ingin satu perubahan sebelum sesi wawancara malam: hentikan kalimat tentang audit operator dan jangan lagi menyebut perlindungan sewa terlalu keras. Menurut mereka, itu menakutkan pemilik modal yang dibutuhkan kota.

Nadira nyaris tertawa, tetapi bukan karena lucu. "Setelah tadi aku bicara soal membuka angka ke publik?"

"Mereka bilang sekarang saatnya mengunci pemilih, bukan memancing kepanikan," jawab Seno.

Dimas menatapku, lalu ke Nadira. "Kalau kita mundur di bagian ini, relawan akan tahu. Mereka mungkin tidak punya istilah ekonominya, tapi mereka tahu kapan janji dipreteli."

Lorong belakang panggung terasa makin sempit. Di depan, kamera menunggu segmen berikutnya. Di belakang, uang dan pengaruh sudah mengirim catatan koreksinya sendiri. Aku harus memutuskan siapa yang berhak mengoreksi apa.`,
      }),
      storyNode(timestamp, {
        id: 'pilar-tiga-jam-node-7b',
        characterId: 'char-nadira-wicaksana',
        characterSpriteId: 'sprite-nadira-calm',
        backgroundId: 'bg-pilar-backstage',
        musicTrackId: 'music-pilar-briefing',
        editorDepth: 6,
        editorOrder: 1,
        text: `Tekanan datang dengan nada yang lebih halus, tapi bukan berarti lebih ringan. Donor tidak meminta kami berbohong. Mereka hanya meminta agar bagian tentang audit dan perlindungan penyewa "ditempatkan secara lebih bijak" sampai momentum kemenangan aman.

Seno mengutip pesan mereka kata demi kata, seolah itu alasan yang dapat diterima. "Kalau mereka mundur sekarang, kita kehilangan saluran iklan malam terakhir."

Nadira menatap lorong yang memisahkan ruang wawancara dan panggung utama. "Aneh sekali. Setiap kali kita bicara tentang rakyat yang takut digeser, selalu ada orang yang bilang tunggu dulu."

Dimas mengangkat ponselnya. Di layar, koordinator relawan pasar mengirim foto papan sewa kios yang baru naik lagi. "Lapangan tidak akan menunggu."

Aku tahu kompromi seperti ini selalu dibungkus sebagai penundaan, bukan pembatalan. Justru karena itu ia berbahaya. Sulit dilawan, karena bentuknya tidak pernah cukup kasar untuk langsung disebut pengkhianatan.`,
      }),
      storyNode(timestamp, {
        id: 'pilar-tiga-jam-node-7c',
        characterId: 'char-nadira-wicaksana',
        characterSpriteId: 'sprite-nadira-resolute',
        backgroundId: 'bg-pilar-backstage',
        musicTrackId: 'music-pilar-briefing',
        editorDepth: 6,
        editorOrder: 2,
        text: `Pesan dari donor kali ini bahkan terdengar seperti pujian. Mereka menyukai energi konfrontatif barusan dan siap menambah anggaran media asalkan kampanye tetap fokus pada satu hal: membuat Raka tampak seperti simbol semua kebusukan lama, tanpa terlalu lama membuka model kebijakan kami sendiri.

Seno tidak menyembunyikan ketertarikannya. "Dengan suntikan ini, kita bisa menguasai potongan malam sampai subuh."

Nadira bersandar ke dinding koridor. "Dan dengan itu kita menjual apa?"

"Momentum," jawab Seno singkat.

Dimas memotong, lebih cepat dari biasanya. "Momentum yang dibangun dari setengah cerita gampang ambruk. Relawan tidak bisa membela sesuatu yang mereka sendiri tidak diberi ruang untuk jelaskan."

Lorong itu mendadak terasa seperti ringkas sekali merangkum politik: uang menawarkan pengeras suara, sementara kebenaran diminta bicara lebih pendek agar tidak mengganggu strategi. Yang tersisa hanyalah keputusan tentang suara mana yang diberi hak hidup lebih lama.`,
      }),
      storyNode(timestamp, {
        id: 'pilar-tiga-jam-node-8a',
        characterId: 'char-arga-pratama',
        characterSpriteId: null,
        backgroundId: 'bg-pilar-strategy-room',
        editorDepth: 7,
        editorOrder: 0,
        text: `Kembali ke ruang strategi, map pangan menunggu seperti masalah yang sengaja menahan napas. Angka-angkanya lebih kusut daripada transportasi: kebocoran distribusi tinggi di dua gudang utama, pasokan minyak goreng ditahan pedagang besar menjelang akhir pekan, dan program subsidi lama terlalu banyak bocor ke keluarga yang sebenarnya paling mampu menalangi harga.

Aku membacakan ringkasannya sambil menandai tiga titik yang benar-benar menentukan: pengawasan rantai pasok, bantuan tunai terarah untuk rumah tangga paling rentan, dan perlindungan dapur sekolah agar anak-anak tidak langsung menanggung shock harga.

Nadira mengangguk. "Ini lebih sulit dijual, tapi lebih dekat pada problemnya."

Dimas menyodorkan catatan dari pasar utara. "Pedagang bilang warga tidak lagi tanya teori. Mereka tanya mana yang turun duluan: harga, panik, atau kepercayaan."

Seno memandang jam dinding. "Kita tidak punya cukup waktu untuk menjelaskan seluruh sistem pangan kota. Pilih bagian yang jadi tulang punggung. Sisanya hanya akan ikut hidup kalau panggungnya selamat."`,
      }),
      storyNode(timestamp, {
        id: 'pilar-tiga-jam-node-8b',
        characterId: 'char-arga-pratama',
        characterSpriteId: null,
        backgroundId: 'bg-pilar-strategy-room',
        editorDepth: 7,
        editorOrder: 1,
        text: `Memo pangan itu tidak menawarkan jawaban heroik. Ia hanya memberi peta tentang sumber kebocoran, gudang yang harus dibuka, dan kelompok keluarga yang akan paling dulu jatuh kalau harga dibiarkan naik dua minggu lagi. Masalahnya, semua bagian terpenting terdengar seperti kerja sunyi, bukan tindakan besar yang mudah jadi headline.

"Kalau kita rangkum terlalu banyak, orang akan dengar daftar," kataku.

"Kalau kita rangkum terlalu sedikit, kita terdengar seperti lawan," sahut Nadira.

Dimas memperlihatkan foto antrean minyak goreng dari relawan. Tidak panjang, tetapi cukup untuk membuat semua orang di ruangan paham bahwa kesabaran warga tidak bisa terus dianggap elastis. Seno memanfaatkan momen itu. "Berarti jawabannya bukan penjelasan lebih rinci. Jawabannya kalimat yang memberi rasa tertolong."

Aku tidak sepenuhnya setuju, tetapi juga tahu satu hal: rasa tertolong dan benar secara kebijakan tidak selalu datang dalam paket yang sama. Malam ini, kami sedang memutuskan seberapa jauh dua hal itu boleh dipisahkan.`,
      }),
      storyNode(timestamp, {
        id: 'pilar-tiga-jam-node-8c',
        characterId: 'char-arga-pratama',
        characterSpriteId: null,
        backgroundId: 'bg-pilar-strategy-room',
        editorDepth: 7,
        editorOrder: 2,
        text: `Kalau dilihat dari sudut paling oportunis, memo pangan ini justru hadiah. Ada cukup banyak kebocoran untuk menyalahkan birokrasi lama, cukup banyak kelalaian pengawasan untuk menuduh lawan memelihara jaringan lama, dan cukup banyak ketakutan publik untuk membuat janji stabilisasi harga terdengar seperti kemenangan bahkan sebelum dijelaskan caranya.

Seno membaca peluang itu dengan cepat. "Ini bisa jadi ronde paling mudah kalau kita berani menyederhanakan."

Nadira menatap grafik distribusi yang kusut. "Atau ronde paling mahal kalau kita menukar struktur masalah dengan satu janji yang tak bisa dibayar."

Dimas, yang biasanya paling emosional, justru terdengar paling tenang. "Di pasar, orang tidak marah karena semua mahal. Mereka marah karena merasa tidak ada yang jujur tentang kenapa mahal."

Kalimat itu membuat ruangan berhenti sebentar. Bahkan di jalur yang paling menggoda untuk dibawa ke populisme, selalu ada pintu kecil kembali ke kejujuran. Masalahnya, pintu itu hampir selalu lebih sempit dan lebih sepi.`,
      }),
      storyNode(timestamp, {
        id: 'pilar-tiga-jam-node-9a',
        characterId: 'char-maya-lestari',
        characterSpriteId: 'sprite-maya-probing',
        backgroundId: 'bg-pilar-debate-stage',
        musicTrackId: 'music-pilar-debate',
        editorDepth: 8,
        editorOrder: 0,
        text: `Maya memulai ronde pangan dengan nada yang bahkan lebih tajam dari sesi transportasi. "Keluarga di Balana tidak bisa menunggu teori distribusi. Dalam seratus hari pertama, apa yang berubah secara nyata di meja makan mereka?"

Nadira menjawab dengan ritme yang tidak terburu-buru. Ia menyebut pembukaan data gudang, inspeksi distribusi, bantuan tunai terarah untuk rumah tangga paling terdampak, dan perlindungan dapur sekolah agar anak-anak tidak menjadi penyangga pertama dari kenaikan harga. Untuk pertama kalinya malam ini, substansi terdengar seperti tindakan, bukan seperti lampiran.

Raka menimpali dengan senyum tipis. "Warga mau harga turun, Bu Nadira. Mereka tidak datang ke warung sambil membawa dashboard."

Beberapa penonton tertawa. Maya tidak. "Kalau dashboard itu penting, jelaskan hubungan paling langsung antara kebocoran data dan panci yang harus tetap mendidih."

Pertanyaan itu bagus justru karena menolak dua jebakan sekaligus: teknokrasi kosong dan slogan kosong. Aku tahu jawaban berikutnya harus menjaga keduanya tetap jauh.`,
      }),
      storyNode(timestamp, {
        id: 'pilar-tiga-jam-node-9b',
        characterId: 'char-maya-lestari',
        characterSpriteId: 'sprite-maya-probing',
        backgroundId: 'bg-pilar-debate-stage',
        musicTrackId: 'music-pilar-debate',
        editorDepth: 8,
        editorOrder: 1,
        text: `Ronde pangan dibuka dengan pertanyaan yang sama, tetapi suasana studio lebih lembek daripada yang terlihat di televisi. Nadira mengawali dengan keluarga yang harus memilih lauk atau ongkos sekolah, lalu baru masuk ke rantai pasok, gudang, dan bantuan terarah. Jawabannya cukup menenangkan untuk tidak terasa dingin, tetapi belum sepenuhnya kebal terhadap godaan menyederhanakan.

Raka memanfaatkan ruang itu. "Jadi tetap saja warga harus percaya bahwa sistem akan jadi baik dulu. Sementara saya menawarkan tindakan segera."

Maya memotong sebelum tepuk tangan sempat terbentuk penuh. "Tindakan segera tanpa akuntabilitas sering berakhir sebagai krisis berikutnya. Saya minta jawaban yang bisa diuji, bukan hanya dibandingkan."

Nadira menahan napas sepersekian detik. Di bangku tim, aku bisa merasakan semua pilihan tadi berkumpul di tenggorokan: menjelaskan lebih jauh, menenangkan lebih dulu, atau memukul balik dengan bahasa moral. Tiga jalan itu tidak akan membawa kami ke tempat yang sama.`,
      }),
      storyNode(timestamp, {
        id: 'pilar-tiga-jam-node-9c',
        characterId: 'char-maya-lestari',
        characterSpriteId: 'sprite-maya-neutral',
        backgroundId: 'bg-pilar-debate-stage',
        musicTrackId: 'music-pilar-debate',
        editorDepth: 8,
        editorOrder: 2,
        text: `Malam mulai condong ke arah yang berbahaya. Begitu pangan dibuka, Nadira terdorong memakai nada yang lebih keras: menyebut jaringan lama, gudang-gudang yang dilindungi kepentingan, dan keberanian politik yang katanya tak akan dimiliki lawan.

Raka tampak malah nyaman. "Berarti Anda masih belum menjawab berapa cepat harga turun."

Maya mengunci dengan pertanyaan sederhana yang selalu sulit bagi kampanye yang terlalu bersemangat. "Satu kebijakan. Satu dampak yang bisa dicek warga dalam seratus hari. Apa?"

Studio mendadak terasa jauh lebih dingin. Pada titik ini, bahasa moral yang terlalu besar bisa berbalik menjadi bukti bahwa kami sendiri tak punya pijakan operasional. Dari kursi tim, aku tahu satu-satunya jalan keluar adalah memilih: merendahkan tempo dan kembali ke kenyataan, atau menerima bahwa permainan malam ini sedang digeser seluruhnya ke panggung simbolik.`,
      }),
      storyNode(timestamp, {
        id: 'pilar-tiga-jam-node-10a',
        characterId: 'char-maya-lestari',
        characterSpriteId: 'sprite-maya-probing',
        backgroundId: 'bg-pilar-newsroom',
        musicTrackId: 'music-pilar-debate',
        editorDepth: 9,
        editorOrder: 0,
        text: `Segmen berikutnya belum mulai, tetapi potongan video sudah lebih cepat beredar daripada kami bisa menarik napas. Klip yang viral hanya menampilkan satu kalimat Nadira: "Tidak semua bisa murah sekaligus." Tanpa konteks, terdengar seperti pengakuan dingin dari orang yang tidak mengerti dapur rumah tangga.

Di layar newsroom, tim digital panik, relawan meminta penjelasan, dan akun pendukung Raka menempelkan kalimat itu di atas gambar antrean pasar. Maya, yang akan memoderasi wawancara lanjutan, justru mengirim pesan singkat melalui produser: "Kalau ingin menjernihkan, datang dengan jawaban penuh, bukan slogan tandingan."

Dimas memandangku nyaris putus asa. "Kalau potongan ini dibiarkan sendiri, semua kerja dari tadi berubah jadi satu kalimat yang paling tidak kita maksud."

Seno sudah mengusulkan counter-clip emosional. Nadira ingin memuat konteks utuh. Aku tahu keputusan ini bukan cuma soal komunikasi. Ini soal apakah kita masih percaya publik sanggup menerima penjelasan yang lebih panjang dari lima detik.`,
      }),
      storyNode(timestamp, {
        id: 'pilar-tiga-jam-node-10b',
        characterId: 'char-maya-lestari',
        characterSpriteId: 'sprite-maya-neutral',
        backgroundId: 'bg-pilar-newsroom',
        musicTrackId: 'music-pilar-debate',
        editorDepth: 9,
        editorOrder: 1,
        text: `Klip viral itu tidak sepenuhnya mematikan, tetapi cukup merusak. Sebagian relawan sudah mencoba menjelaskan konteksnya di grup warga, namun semakin banyak yang menjelaskan, semakin besar risiko orang hanya membaca defensifnya dan bukan isinya.

Dimas menaruh ponselnya keras di meja. "Kalau kita jawab ini dengan kalimat yang lebih pendek lagi, orang akan merasa kita panik."

Seno membalas cepat. "Kalau kita jawab dengan video panjang, separuh publik tidak akan pernah klik sampai selesai."

Nadira memandang monitor yang memutar ulang wajahnya sendiri. "Masalahnya bukan cuma klip. Masalahnya orang memang sedang hidup dalam kondisi di mana semua harus murah sekaligus, atau mereka yang jatuh dulu."

Aku mengerti itu. Jalur tengah selalu paling rentan pada potongan video karena ia hidup dari nuansa. Dan nuansa adalah barang pertama yang mati ketika politik berubah jadi unggahan malam terakhir.`,
      }),
      storyNode(timestamp, {
        id: 'pilar-tiga-jam-node-10c',
        characterId: 'char-maya-lestari',
        characterSpriteId: 'sprite-maya-neutral',
        backgroundId: 'bg-pilar-newsroom',
        musicTrackId: 'music-pilar-debate',
        editorDepth: 9,
        editorOrder: 2,
        text: `Potongan yang viral kali ini bertumpuk dengan potongan-potongan lain yang sudah lebih dulu memanas. Klip transportasi, klip harga pangan, potongan serangan ke Raka, semuanya beredar sebagai serpihan tanpa hubungan. Kampanye kami mulai terlihat seperti kumpulan ledakan kecil yang masing-masing keras, tetapi tidak lagi jelas menyusun cerita apa.

Seno melihat itu sebagai alasan untuk menyerang lebih brutal. "Kalau medan sudah kacau, yang menang adalah pihak yang suaranya paling dominan."

Dimas justru semakin muram. "Kalau suara dominan tapi isinya berubah-ubah, warga mungkin dengar kita. Tapi mereka tidak tahu sedang mendengar siapa."

Nadira berdiri lama di depan layar, menonton dirinya sendiri dipecah menjadi beberapa versi. Mungkin itu gambaran terbaik dari risiko jalur ini: bukan sekadar dikalahkan lawan, melainkan terpecah oleh strategi sendiri sampai wajah kampanye tak lagi punya satu bentuk yang bisa dikenali.`,
      }),
      storyNode(timestamp, {
        id: 'pilar-tiga-jam-node-11a',
        characterId: 'char-seno-adiprana',
        characterSpriteId: 'sprite-seno-composed',
        backgroundId: 'bg-pilar-backstage',
        editorDepth: 10,
        editorOrder: 0,
        text: `Belum selesai membereskan klip viral, kami sudah dihantam tuntutan lain. Serikat pengemudi meminta jaminan tarif dan keselamatan kerja masuk ke pernyataan penutup. Forum penyewa menuntut perlindungan sewa disebut jelas. Tim usaha kecil ingin kepastian bahwa inspeksi pangan tidak berubah jadi beban tambahan buat pedagang pasar.

"Kalau kita coba menyenangkan semuanya, penutup kita akan terdengar seperti daftar belanja," kata Seno.

Nadira membalas tanpa nada tinggi. "Kalau kita pilih salah satu saja, yang lain tahu persis siapa yang ditinggalkan."

Dimas membuka beberapa pesan dari relawan. Anehnya, tak satu pun meminta slogan baru. Mereka hanya ingin tahu apakah kampanye ini berani berkata jujur tentang siapa yang diprioritaskan dan mengapa.

Aku menyadari konflik yang sesungguhnya bukan antara kelompok-kelompok itu. Konfliknya adalah apakah kami cukup berani menjelaskan prioritas, atau terlalu takut kehilangan dukungan sehingga akhirnya menjanjikan kehadiran kepada semua orang tanpa sanggup tinggal bersama siapa pun.`,
      }),
      storyNode(timestamp, {
        id: 'pilar-tiga-jam-node-11b',
        characterId: 'char-seno-adiprana',
        characterSpriteId: 'sprite-seno-pressing',
        backgroundId: 'bg-pilar-backstage',
        editorDepth: 10,
        editorOrder: 1,
        text: `Tuntutan dari berbagai sisi datang hampir bersamaan, tetapi kali ini semuanya terasa seperti versi berbeda dari kompromi yang belum selesai kami sepakati. Seno ingin fokus pada dua kelompok yang paling strategis secara suara. Dimas menolak logika itu mentah-mentah. Nadira berdiri di tengah, tahu bahwa setiap prioritas yang dipilih akan dibaca sebagai janji dan setiap janji yang dikecilkan akan dibaca sebagai mundur.

"Kita tidak mungkin memuat semua kelompok dalam satu penutup," kata Seno.

"Tapi kita bisa menunjukkan cara memilih prioritasnya," jawabku.

Nadira menoleh cepat. Ia tahu itulah perdebatan sebenarnya: apakah penutup kampanye seharusnya mengumumkan siapa yang menang duluan, atau menjelaskan mekanisme agar warga bisa mengawasi siapa yang dilindungi lebih dulu.

Lorong itu kembali hening. Dalam politik, keheningan seperti ini sering berarti semua orang tahu jawaban yang paling benar, tetapi belum tentu mau menanggung harga elektoralnya.`,
      }),
      storyNode(timestamp, {
        id: 'pilar-tiga-jam-node-11c',
        characterId: 'char-seno-adiprana',
        characterSpriteId: 'sprite-seno-pressing',
        backgroundId: 'bg-pilar-backstage',
        editorDepth: 10,
        editorOrder: 2,
        text: `Pada jalur yang makin pragmatis, tuntutan berbagai kelompok berubah jadi bahan segmentasi. Tim digital menyarankan satu penutup untuk serikat, satu versi wawancara untuk pemilik usaha kecil, dan satu paket konten lain untuk pemilih muda. Secara teknis semua itu mungkin. Secara moral, aku tidak yakin.

Seno justru paling tenang dalam kekacauan seperti ini. "Bukan berbohong," katanya. "Hanya menyesuaikan pintu masuk tiap audiens."

Dimas menatapnya tajam. "Kalau isi pintunya berbeda-beda, itu bukan pintu masuk. Itu lorong labirin."

Nadira mengusap wajahnya. Keletihan bukan lagi soal tubuh, melainkan soal harus memutuskan berapa banyak versi diri yang bisa dipakai kampanye sebelum kampanye itu kehilangan inti.

Aku merasa malam bergerak lebih cepat dari jam. Bukan menuju kemenangan atau kekalahan, melainkan menuju titik ketika pilihan strategis tak lagi bisa dipisahkan dari jenis orang seperti apa kami memilih menjadi.`,
      }),
      storyNode(timestamp, {
        id: 'pilar-tiga-jam-node-12a',
        characterId: 'char-nadira-wicaksana',
        characterSpriteId: 'sprite-nadira-resolute',
        backgroundId: 'bg-pilar-strategy-room',
        musicTrackId: 'music-pilar-briefing',
        editorDepth: 11,
        editorOrder: 0,
        text: `Di ruang strategi yang mulai berantakan, Nadira memintaku duduk tepat di seberangnya. Tidak ada kamera, tidak ada relawan, tidak ada donor. Hanya kami, sisa map, dan satu pertanyaan yang rupanya ia simpan untuk momen paling akhir.

"Kalau aku kalah malam ini," katanya, "kalimat apa yang masih bisa kubawa pulang tanpa malu melihat orang-orang yang tadi menitipkan hidupnya lewat pesan suara?"

Pertanyaan itu membuat semua teknik kampanye terasa kecil. Seno diam, mungkin karena tahu ia tidak sedang ditanya tentang strategi. Dimas menunggu tanpa berkedip.

Di luar, hujan mulai pelan. Di dalam, kami akhirnya sampai pada inti yang sering tertutup perdebatan teknis: bukan sekadar bagaimana membuat orang memilih, melainkan janji macam apa yang sanggup diucapkan seseorang ketika kemungkinan kalah terasa nyata tetapi tanggung jawab moral justru paling jelas.

Jawaban yang kupilih di sini akan masuk ke tulang penutup kampanye. Bukan cuma ke bunyinya, tetapi ke watak akhirnya.`,
      }),
      storyNode(timestamp, {
        id: 'pilar-tiga-jam-node-12b',
        characterId: 'char-nadira-wicaksana',
        characterSpriteId: 'sprite-nadira-calm',
        backgroundId: 'bg-pilar-strategy-room',
        musicTrackId: 'music-pilar-briefing',
        editorDepth: 11,
        editorOrder: 1,
        text: `Nadira tidak terdengar putus asa. Ia justru terdengar seperti seseorang yang sedang mencari ukuran terakhir agar tidak terseret terlalu jauh oleh kompromi-krompromi kecil yang tadi tampak masuk akal.

"Aku tidak butuh kalimat yang paling indah," katanya pelan. "Aku butuh kalimat yang cukup jujur untuk bertahan, tapi cukup bisa dibawa orang pulang."

Seno mengangguk, seolah itulah titik kompromi yang sejak awal ia cari. Dimas tampak lebih sulit diyakinkan. "Jangan sampai ‘cukup jujur’ berarti kita sengaja mengosongkan bagian paling mahalnya."

Aku memandang draft penutup yang penuh coretan. Ada versi yang aman. Ada versi yang kuat. Ada versi yang hampir terlalu telanjang untuk dunia politik. Semuanya mungkin diucapkan. Tidak semuanya akan terasa sama saat matahari naik dan angka mulai dibuka.

Pada momen seperti ini, strategi dan hati nurani tidak selalu bertempur langsung. Sering kali, mereka hanya saling menggeser beberapa sentimeter. Tapi beberapa sentimeter itu bisa menjadi jurang.`,
      }),
      storyNode(timestamp, {
        id: 'pilar-tiga-jam-node-12c',
        characterId: 'char-nadira-wicaksana',
        characterSpriteId: 'sprite-nadira-calm',
        backgroundId: 'bg-pilar-strategy-room',
        musicTrackId: 'music-pilar-briefing',
        editorDepth: 11,
        editorOrder: 2,
        text: `Ruang strategi malam itu berubah jadi tempat orang bicara dalam versi-versi pendek. Satu versi untuk warga yang lelah. Satu versi untuk pelaku usaha. Satu versi untuk relawan yang butuh semangat. Satu versi lagi untuk media yang hanya mengutip sepuluh detik terbaik. Semua terdengar berguna. Bersama-sama, semuanya terdengar seperti ancaman bagi satu hal: konsistensi.

Nadira memegang naskah yang sudah terlalu sering direvisi. "Aku tidak tahu lagi mana yang benar-benar mau kita bilang, dan mana yang cuma takut tidak didengar."

Seno menjawab cepat. "Dalam tiga jam terakhir, didengar dulu."

Dimas menggeleng. "Kalau orang mendengar tiga hal berbeda, kita memang didengar. Tapi bukan dipercaya."

Aku melihat Nadira menutup mata sebentar. Bukan untuk mencari kalimat puitis, melainkan untuk mencari satu garis yang masih bisa disebut miliknya. Bila garis itu hilang, kampanye ini mungkin tetap punya tenaga. Yang tidak lagi jelas hanya arah dan alasannya.`,
      }),
      storyNode(timestamp, {
        id: 'pilar-tiga-jam-node-13a',
        characterId: 'char-arga-pratama',
        characterSpriteId: null,
        backgroundId: 'bg-pilar-newsroom',
        musicTrackId: 'music-pilar-debate',
        editorDepth: 12,
        editorOrder: 0,
        text: `Beberapa menit sebelum penutup, newsroom mengirim bahan baru: sebuah lembaga independen merilis fact-check lengkap. Angkanya menguatkan serangan terhadap model gratis total Raka, tetapi juga mencatat bahwa skema Nadira sendiri baru aman bila audit operator benar-benar dijalankan dan pengendalian sewa tak ditarik mundur sesudah pemilu.

"Ini justru bagus," kataku. "Kita bisa pakai seluruh dokumen. Tunjukkan bahwa bahkan kritik terhadap kita sendiri tetap kita buka."

Seno mengusap pelipisnya. "Kamu sadar ini sama saja mengundang orang mempertanyakan detail kita di menit terakhir?"

"Lebih baik dipertanyakan sekarang daripada dibela dengan setengah kebenaran," jawab Nadira sebelum aku sempat menambahkan.

Dimas tampak lega untuk pertama kali malam itu. Di atas kertas, keputusan ini terdengar berisiko. Di dalam ruangan, aku justru merasa untuk pertama kalinya kami tidak sedang melarikan diri dari konsekuensi pengetahuan yang kami punya sendiri.`,
      }),
      storyNode(timestamp, {
        id: 'pilar-tiga-jam-node-13b',
        characterId: 'char-arga-pratama',
        characterSpriteId: null,
        backgroundId: 'bg-pilar-newsroom',
        musicTrackId: 'music-pilar-debate',
        editorDepth: 12,
        editorOrder: 1,
        text: `Fact-check yang datang dari newsroom terasa seperti ujian terakhir untuk jalur tengah. Di satu sisi, ia memberi bukti bahwa angka Raka memang rapuh. Di sisi lain, ia juga menulis dengan jelas bahwa model Nadira membutuhkan pengawasan publik yang tidak bisa diperlakukan sebagai aksesori kampanye.

"Kalau kita kutip semua, penutup akan terdengar terlalu teknis," kata Seno.

"Kalau kita kutip setengah, kita tahu persis bagian mana yang kita sembunyikan," balas Dimas.

Nadira membaca halaman ringkasan beberapa kali. "Mungkin yang harus dibawa bukan semua angka. Mungkin yang harus dibawa adalah keberanian mengakui bahwa bahkan rencana kita perlu diawasi."

Aku menyukai gagasan itu, tetapi juga tahu publik yang lelah sering tidak memberi hadiah pada nuansa. Di sinilah kampanye diuji bukan oleh seberapa banyak data yang dimiliki, melainkan oleh seberapa besar keberanian untuk tidak memelintir data saat keadaan justru paling menggoda.`,
      }),
      storyNode(timestamp, {
        id: 'pilar-tiga-jam-node-13c',
        characterId: 'char-arga-pratama',
        characterSpriteId: null,
        backgroundId: 'bg-pilar-newsroom',
        musicTrackId: 'music-pilar-debate',
        editorDepth: 12,
        editorOrder: 2,
        text: `Bahan fact-check yang masuk sebenarnya cukup jelas, tetapi dalam mode kampanye yang sudah terlalu panas, kejelasan itu sendiri terasa seperti beban. Bagian yang paling merusak Raka bisa dijadikan peluru sempurna. Bagian yang meminta model Nadira tetap diawasi adalah penghalang yang mudah sekali dibuang diam-diam.

Seno tidak perlu berkata panjang. "Ini momen terakhir. Kalau mau memukul, pakai bagian yang paling tajam. Sisanya urusan pemerintahan nanti."

Dimas hampir memotong sebelum ia selesai. "Justru karena nanti ada pemerintahan, kita tidak boleh memulai dengan cara itu."

Nadira memegang halaman ringkasan cukup lama sampai ujung kertasnya sedikit bengkok. Aku tahu apa yang dipertaruhkan di sini bukan hanya efektivitas penutup, melainkan kebiasaan. Sekali kampanye belajar bahwa setengah kebenaran bekerja, akan semakin sulit memintanya kembali hidup utuh.`,
      }),
      storyNode(timestamp, {
        id: 'pilar-tiga-jam-node-14a',
        characterId: 'char-nadira-wicaksana',
        characterSpriteId: 'sprite-nadira-resolute',
        backgroundId: 'bg-pilar-debate-stage',
        musicTrackId: 'music-pilar-debate',
        editorDepth: 13,
        editorOrder: 0,
        text: `Lampu penutup menyala. Maya mempersilakan masing-masing kandidat memberi pernyataan terakhir. Tidak ada lagi ruang untuk tabel panjang. Hanya beberapa napas, beberapa kalimat, dan keputusan tentang jenis kepercayaan apa yang ingin diminta dari publik.

Nadira berdiri tegak. Kali ini ia tidak terdengar sedang menjual kemenangan. Ia terdengar seperti seseorang yang memahami kota hanya bisa dipulihkan lewat warga yang diberi hak untuk memeriksa, menagih, dan ikut menentukan siapa yang dilindungi lebih dulu.

Raka menunggu di podium sebelah dengan senyum yang sudah sangat terlatih. Studio hening. Bahkan Seno tidak bergerak. Kami semua tahu momen ini akan menentukan bukan sekadar siapa yang tampak unggul, tetapi versi akhir dari kampanye seperti apa yang sampai ke layar orang.

Kalimat terakhir Nadira bisa menutup seluruh malam dengan integritas yang mahal, atau dengan jembatan yang lebih aman agar ia tetap kompetitif sampai hitungan terakhir.`,
      }),
      storyNode(timestamp, {
        id: 'pilar-tiga-jam-node-14b',
        characterId: 'char-nadira-wicaksana',
        characterSpriteId: 'sprite-nadira-calm',
        backgroundId: 'bg-pilar-debate-stage',
        musicTrackId: 'music-pilar-debate',
        editorDepth: 13,
        editorOrder: 1,
        text: `Penutup Nadira malam itu tidak kosong, tetapi juga tidak setajam jalur paling berani. Ia bicara tentang menjaga biaya hidup tetap masuk akal, melindungi warga dari proyek yang memindahkan beban, dan memimpin dengan cara yang tidak memperlakukan kebijakan sebagai sulap satu malam.

Maya mendengarkan tanpa memotong. Raka memilih tetap diam. Dalam kesunyian seperti ini, kalimat yang terlalu hati-hati bisa terdengar matang, tetapi bisa juga terdengar seperti pagar yang dibangun terlalu banyak.

Aku berdiri di belakang kamera, mendengarkan apakah penutup itu masih menyisakan tulang. Bukan karena semua harus keras, melainkan karena penutup yang terlalu sibuk menenangkan kadang lupa memberi alasan mengapa orang harus berani memilih.

Satu dorongan kecil lagi dapat membuat jalur ini berakhir sebagai kemenangan yang penuh tanda tanya, atau sebagai malam ketika kampanye kehilangan definisinya sendiri tepat di depan garis.`,
      }),
      storyNode(timestamp, {
        id: 'pilar-tiga-jam-node-14c',
        characterId: 'char-nadira-wicaksana',
        characterSpriteId: 'sprite-nadira-resolute',
        backgroundId: 'bg-pilar-debate-stage',
        musicTrackId: 'music-pilar-debate',
        editorDepth: 13,
        editorOrder: 2,
        text: `Pada jalur yang paling tegang, penutup terasa seperti pertarungan terakhir untuk mendominasi ruang. Nada Nadira masih kuat, tetapi terlalu banyak lapisan malam ini ikut menempel di dalamnya: amarah warga, tekanan donor, klip viral, dorongan membalas lawan, dan rasa takut kalah beberapa jam sebelum kota memutuskan.

Maya menatap lurus, seakan tahu bahwa satu kalimat terakhir bisa menjadi pintu pulang atau justru tembok terakhir yang memerangkap kami di dalam gaya yang sudah terlanjur mengambil alih isi.

Di bangku tim, Dimas memegang ponselnya terlalu erat. Seno justru tampak paling tenang. Mungkin karena di titik seperti ini, perbedaan antara strategi cerdas dan kebiasaan merusak diri sendiri memang sangat tipis.

Kalimat terakhir Nadira bisa berubah menjadi pengakuan bahwa kampanye ini sempat kehilangan arah namun masih mau pulang. Bisa juga menjadi ledakan terakhir yang nyaring, memabukkan, dan nyaris mustahil dipertanggungjawabkan saat lampu studio padam.`,
      }),
      storyNode(timestamp, {
        id: 'pilar-tiga-jam-ending-reformis',
        characterId: null,
        characterSpriteId: null,
        backgroundId: 'bg-pilar-dawn-office',
        musicTrackId: 'music-pilar-afterglow',
        editorDepth: 14,
        editorOrder: 0,
        isEndNode: true,
        text: `Subuh datang pelan, seperti kota yang belum sepenuhnya percaya bahwa politik masih bisa berbicara jujur. Hasil cepat belum memastikan kemenangan telak, tetapi satu hal terlihat jelas dari pesan yang masuk: banyak orang memilih Nadira bukan karena dijanjikan keajaiban, melainkan karena untuk sekali ini mereka merasa diperlakukan seperti warga yang sanggup memahami harga dari sebuah kebijakan.

Di kantor kampanye, relawan tidak berteriak berlebihan. Mereka justru bekerja dengan ketenangan yang aneh, seolah kepercayaan yang lahir malam tadi menuntut sikap yang lebih dewasa daripada euforia.

Nadira berdiri di dekat jendela yang menghadap langit pucat. "Kalau kita benar-benar diberi mandat," katanya, "aku ingin rasa lega ini cepat diganti oleh rasa diawasi."

Aku tersenyum tipis. "Mungkin itu tanda kita tidak salah memilih kata-kata terakhir."

Balana belum selesai disembuhkan. Tapi pagi itu, kota tampak sedikit lebih mungkin diajak berjalan tanpa ditipu lagi.`,
      }),
      storyNode(timestamp, {
        id: 'pilar-tiga-jam-ending-pragmatis',
        characterId: null,
        characterSpriteId: null,
        backgroundId: 'bg-pilar-newsroom',
        musicTrackId: 'music-pilar-afterglow',
        editorDepth: 14,
        editorOrder: 1,
        isEndNode: true,
        text: `Ketika angka awal mulai dibuka, tim kampanye langsung tahu malam ini bisa disebut sukses. Nadira bertahan, bahkan mungkin unggul tipis, dan penutupnya cukup aman untuk memeluk banyak jenis pemilih sekaligus. Kamera menyukai ketenangannya. Pendukung menyukai kemungkinan menangnya.

Tetapi kemenangan seperti ini tidak datang sendirian. Ia membawa daftar catatan kecil yang nanti harus dibayar satu per satu: bagian yang diperlunak, bagian yang sengaja ditunda, bagian yang dibiarkan cukup kabur agar bisa menampung terlalu banyak harapan.

Seno tampak puas tanpa perlu menyembunyikannya. Dimas tidak marah, hanya lebih diam dari biasanya. Nadira sendiri menerima ucapan selamat seperti orang yang paham bahwa politik sering memaksa keberhasilan dan kegelisahan datang dalam paket yang sama.

Di balik lampu berita dan grafik yang ramah, pertanyaan yang tersisa bukan lagi apakah kampanye ini menang, melainkan apakah kemenangan yang lahir dari banyak kompromi masih cukup utuh untuk dipakai memperbaiki kota.`,
      }),
      storyNode(timestamp, {
        id: 'pilar-tiga-jam-ending-populis',
        characterId: 'char-maya-lestari',
        characterSpriteId: 'sprite-maya-neutral',
        backgroundId: 'bg-pilar-newsroom',
        musicTrackId: 'music-pilar-afterglow',
        editorDepth: 14,
        editorOrder: 2,
        isEndNode: true,
        text: `Pagi harinya, klip-klip kampanye masih beredar dengan energi yang tampak seperti kemenangan. Serangan paling tajam, janji paling keras, potongan wajah lawan yang terlihat goyah, semuanya bekerja sempurna di layar pendek. Untuk beberapa jam, bahkan kami nyaris percaya bahwa volume bisa menggantikan struktur.

Lalu pertanyaan-pertanyaan susulan datang. Dari mana uangnya? Mengapa janji tadi bertentangan dengan kalimat satu jam sebelumnya? Kenapa model kebijakan berubah tergantung panggung dan audiens? Tidak ada satu jawaban yang cukup rapi untuk menjahit semua serpihan itu kembali.

Maya membacakan rekap di siaran pagi dengan nada nyaris datar, dan justru karena itu terasa kejam. Kampanye Nadira berhasil membuat dirinya terdengar keras, tetapi gagal membuat dirinya terdengar dapat dipercaya.

Di ruang strategi yang kini terlalu sunyi, bahkan Seno tidak punya kalimat penutup. Politik malam itu tidak tumbang karena kurang energi. Ia tumbang karena terlalu sering memilih gema ketimbang pijakan.`,
      }),
      storyNode(timestamp, {
        id: 'pilar-tiga-jam-ending-hilang-arah',
        characterId: 'char-arga-pratama',
        characterSpriteId: null,
        backgroundId: 'bg-pilar-dawn-office',
        musicTrackId: 'music-pilar-afterglow',
        editorDepth: 14,
        editorOrder: 3,
        isEndNode: true,
        text: `Tidak ada ledakan besar setelah malam itu. Tidak ada pula satu momen tunggal yang bisa ditunjuk sebagai sebab runtuhnya semuanya. Yang ada justru sesuatu yang lebih sulit diperbaiki: kami terdengar seperti terlalu banyak orang dalam satu kampanye.

Di beberapa menit, kami jujur. Di menit lain, kami terlalu aman. Lalu tiba-tiba terlalu marah. Warga yang menonton mungkin tetap mengingat beberapa kalimat baik, tetapi mereka tidak lagi yakin semua kalimat itu berasal dari satu arah yang sama.

Nadira duduk di meja rapat ketika subuh datang, naskah penutup yang sudah tak terpakai masih di tangannya. "Aku merasa seperti meminjam terlalu banyak suara," katanya pelan.

Tak ada yang membantah. Seno terlalu lelah. Dimas terlalu kecewa. Aku sendiri hanya bisa menatap jendela dan menyadari bahwa kadang politik tidak kalah karena argumennya lemah, melainkan karena ia kehilangan keberanian untuk memilih bentuk dirinya sendiri.

Balana tetap menunggu pemimpin. Malam kami hanya gagal memastikan siapa sebenarnya yang sedang berbicara kepadanya.`,
      }),
    ],
    choices: [
      choice(timestamp, { id: 'pilar-tiga-jam-choice-1-a', nodeId: 'pilar-tiga-jam-node-1', targetNodeId: 'pilar-tiga-jam-node-2a', text: 'Mulai dari kejujuran penuh soal trade-off kebijakan.', scoreImpact: 2 }),
      choice(timestamp, { id: 'pilar-tiga-jam-choice-1-b', nodeId: 'pilar-tiga-jam-node-1', targetNodeId: 'pilar-tiga-jam-node-2b', text: 'Mulai dari empati warga lalu masuk ke substansi.', scoreImpact: 1 }),
      choice(timestamp, { id: 'pilar-tiga-jam-choice-1-c', nodeId: 'pilar-tiga-jam-node-1', targetNodeId: 'pilar-tiga-jam-node-2c', text: 'Mulai dari garis serang pada kontradiksi lawan.', scoreImpact: -1 }),

      choice(timestamp, { id: 'pilar-tiga-jam-choice-2a-a', nodeId: 'pilar-tiga-jam-node-2a', targetNodeId: 'pilar-tiga-jam-node-3a', text: 'Buka memo apa adanya dan ajari tim membelanya.', scoreImpact: 2 }),
      choice(timestamp, { id: 'pilar-tiga-jam-choice-2a-b', nodeId: 'pilar-tiga-jam-node-2a', targetNodeId: 'pilar-tiga-jam-node-3b', text: 'Pilih bagian inti yang tetap jujur tetapi lebih mudah dipahami.', scoreImpact: 1 }),
      choice(timestamp, { id: 'pilar-tiga-jam-choice-2b-a', nodeId: 'pilar-tiga-jam-node-2b', targetNodeId: 'pilar-tiga-jam-node-3a', text: 'Tetap buka risiko transportasi sambil menjaga bahasa tetap hangat.', scoreImpact: 2 }),
      choice(timestamp, { id: 'pilar-tiga-jam-choice-2b-c', nodeId: 'pilar-tiga-jam-node-2b', targetNodeId: 'pilar-tiga-jam-node-3c', text: 'Pakai memo terutama untuk menunjukkan lubang janji lawan.', scoreImpact: -1 }),
      choice(timestamp, { id: 'pilar-tiga-jam-choice-2c-b', nodeId: 'pilar-tiga-jam-node-2c', targetNodeId: 'pilar-tiga-jam-node-3b', text: 'Sisakan jalan pulang ke versi yang lebih bertanggung jawab.', scoreImpact: 0 }),
      choice(timestamp, { id: 'pilar-tiga-jam-choice-2c-c', nodeId: 'pilar-tiga-jam-node-2c', targetNodeId: 'pilar-tiga-jam-node-3c', text: 'Prioritaskan tabel yang paling merusak kredibilitas Raka.', scoreImpact: -2 }),

      choice(timestamp, { id: 'pilar-tiga-jam-choice-3a-a', nodeId: 'pilar-tiga-jam-node-3a', targetNodeId: 'pilar-tiga-jam-node-4a', text: 'Gunakan suara warga untuk memperjelas siapa yang harus dilindungi.', scoreImpact: 2 }),
      choice(timestamp, { id: 'pilar-tiga-jam-choice-3a-b', nodeId: 'pilar-tiga-jam-node-3a', targetNodeId: 'pilar-tiga-jam-node-4b', text: 'Ringkas poin lapangan agar tetap bisa dibawa ke televisi.', scoreImpact: 1 }),
      choice(timestamp, { id: 'pilar-tiga-jam-choice-3b-a', nodeId: 'pilar-tiga-jam-node-3b', targetNodeId: 'pilar-tiga-jam-node-4a', text: 'Dengar seluruh suara lapangan sebelum memilih framing.', scoreImpact: 2 }),
      choice(timestamp, { id: 'pilar-tiga-jam-choice-3b-c', nodeId: 'pilar-tiga-jam-node-3b', targetNodeId: 'pilar-tiga-jam-node-4c', text: 'Ambil hanya potongan keresahan yang paling mudah menggerakkan emosi.', scoreImpact: -2 }),
      choice(timestamp, { id: 'pilar-tiga-jam-choice-3c-b', nodeId: 'pilar-tiga-jam-node-3c', targetNodeId: 'pilar-tiga-jam-node-4b', text: 'Masukkan kembali suara warga sebagai rem atas strategi serang.', scoreImpact: 0 }),
      choice(timestamp, { id: 'pilar-tiga-jam-choice-3c-c', nodeId: 'pilar-tiga-jam-node-3c', targetNodeId: 'pilar-tiga-jam-node-4c', text: 'Paketkan kemarahan warga sebagai amunisi panggung.', scoreImpact: -3 }),

      choice(timestamp, { id: 'pilar-tiga-jam-choice-4a-a', nodeId: 'pilar-tiga-jam-node-4a', targetNodeId: 'pilar-tiga-jam-node-5a', text: 'Bangun jawaban debat dari perlindungan warga yang paling rentan.', scoreImpact: 2 }),
      choice(timestamp, { id: 'pilar-tiga-jam-choice-4a-b', nodeId: 'pilar-tiga-jam-node-4a', targetNodeId: 'pilar-tiga-jam-node-5b', text: 'Padatkan temuan lapangan jadi satu narasi yang lebih aman.', scoreImpact: 1 }),
      choice(timestamp, { id: 'pilar-tiga-jam-choice-4b-a', nodeId: 'pilar-tiga-jam-node-4b', targetNodeId: 'pilar-tiga-jam-node-5a', text: 'Tahan diri dan kembali pada struktur jawaban yang utuh.', scoreImpact: 2 }),
      choice(timestamp, { id: 'pilar-tiga-jam-choice-4b-c', nodeId: 'pilar-tiga-jam-node-4b', targetNodeId: 'pilar-tiga-jam-node-5c', text: 'Pilih satu kalimat yang paling mudah jadi momen televisi.', scoreImpact: -1 }),
      choice(timestamp, { id: 'pilar-tiga-jam-choice-4c-b', nodeId: 'pilar-tiga-jam-node-4c', targetNodeId: 'pilar-tiga-jam-node-5b', text: 'Tarik energi marah itu ke versi yang masih bisa dijelaskan.', scoreImpact: 0 }),
      choice(timestamp, { id: 'pilar-tiga-jam-choice-4c-c', nodeId: 'pilar-tiga-jam-node-4c', targetNodeId: 'pilar-tiga-jam-node-5c', text: 'Biarkan kemarahan lapangan menentukan nada kampanye.', scoreImpact: -3 }),

      choice(timestamp, { id: 'pilar-tiga-jam-choice-5a-a', nodeId: 'pilar-tiga-jam-node-5a', targetNodeId: 'pilar-tiga-jam-node-6a', text: 'Bawa struktur penuh ke panggung dan jawab sampai tuntas.', scoreImpact: 3 }),
      choice(timestamp, { id: 'pilar-tiga-jam-choice-5a-b', nodeId: 'pilar-tiga-jam-node-5a', targetNodeId: 'pilar-tiga-jam-node-6b', text: 'Pilih versi padat yang tetap menjaga inti argumen.', scoreImpact: 1 }),
      choice(timestamp, { id: 'pilar-tiga-jam-choice-5b-a', nodeId: 'pilar-tiga-jam-node-5b', targetNodeId: 'pilar-tiga-jam-node-6a', text: 'Saat ditantang, buka lagi lapisan yang paling jujur.', scoreImpact: 2 }),
      choice(timestamp, { id: 'pilar-tiga-jam-choice-5b-c', nodeId: 'pilar-tiga-jam-node-5b', targetNodeId: 'pilar-tiga-jam-node-6c', text: 'Ubah simulasi jadi kesempatan menekan lawan lebih keras.', scoreImpact: -2 }),
      choice(timestamp, { id: 'pilar-tiga-jam-choice-5c-b', nodeId: 'pilar-tiga-jam-node-5c', targetNodeId: 'pilar-tiga-jam-node-6b', text: 'Rem gaya serang sebelum siaran langsung mulai liar.', scoreImpact: 0 }),
      choice(timestamp, { id: 'pilar-tiga-jam-choice-5c-c', nodeId: 'pilar-tiga-jam-node-5c', targetNodeId: 'pilar-tiga-jam-node-6c', text: 'Masuk ke panggung dengan niat menguasai benturan.', scoreImpact: -3 }),

      choice(timestamp, { id: 'pilar-tiga-jam-choice-6a-a', nodeId: 'pilar-tiga-jam-node-6a', targetNodeId: 'pilar-tiga-jam-node-7a', text: 'Jawab interupsi Raka dengan audit, perlindungan sewa, dan prioritas pekerja.', scoreImpact: 3 }),
      choice(timestamp, { id: 'pilar-tiga-jam-choice-6a-b', nodeId: 'pilar-tiga-jam-node-6a', targetNodeId: 'pilar-tiga-jam-node-7b', text: 'Tambahkan janji keringanan tarif yang lebih mudah diingat.', scoreImpact: 1 }),
      choice(timestamp, { id: 'pilar-tiga-jam-choice-6b-a', nodeId: 'pilar-tiga-jam-node-6b', targetNodeId: 'pilar-tiga-jam-node-7a', text: 'Kembalikan jawaban ke detail siapa yang dibela lebih dulu.', scoreImpact: 2 }),
      choice(timestamp, { id: 'pilar-tiga-jam-choice-6b-c', nodeId: 'pilar-tiga-jam-node-6b', targetNodeId: 'pilar-tiga-jam-node-7c', text: 'Gunakan ejekan Raka sebagai alasan untuk menyerang balik.', scoreImpact: -2 }),
      choice(timestamp, { id: 'pilar-tiga-jam-choice-6c-b', nodeId: 'pilar-tiga-jam-node-6c', targetNodeId: 'pilar-tiga-jam-node-7b', text: 'Tarik jawaban kembali ke tanah sebelum donor ikut campur.', scoreImpact: 0 }),
      choice(timestamp, { id: 'pilar-tiga-jam-choice-6c-c', nodeId: 'pilar-tiga-jam-node-6c', targetNodeId: 'pilar-tiga-jam-node-7c', text: 'Biarkan benturan menjadi identitas utama malam ini.', scoreImpact: -3 }),

      choice(timestamp, { id: 'pilar-tiga-jam-choice-7a-a', nodeId: 'pilar-tiga-jam-node-7a', targetNodeId: 'pilar-tiga-jam-node-8a', text: 'Tolak donor dan pertahankan audit serta perlindungan sewa.', scoreImpact: 3 }),
      choice(timestamp, { id: 'pilar-tiga-jam-choice-7a-b', nodeId: 'pilar-tiga-jam-node-7a', targetNodeId: 'pilar-tiga-jam-node-8b', text: 'Tunda konflik donor agar sesi berikutnya tetap aman.', scoreImpact: 1 }),
      choice(timestamp, { id: 'pilar-tiga-jam-choice-7b-a', nodeId: 'pilar-tiga-jam-node-7b', targetNodeId: 'pilar-tiga-jam-node-8a', text: 'Gunakan memo pangan untuk kembali ke jalur yang lebih bersih.', scoreImpact: 2 }),
      choice(timestamp, { id: 'pilar-tiga-jam-choice-7b-c', nodeId: 'pilar-tiga-jam-node-7b', targetNodeId: 'pilar-tiga-jam-node-8c', text: 'Ikuti phrasing donor dan fokus pada rasa aman pemilih.', scoreImpact: -1 }),
      choice(timestamp, { id: 'pilar-tiga-jam-choice-7c-b', nodeId: 'pilar-tiga-jam-node-7c', targetNodeId: 'pilar-tiga-jam-node-8b', text: 'Pakai jeda memo pangan untuk menurunkan tensi kampanye.', scoreImpact: 0 }),
      choice(timestamp, { id: 'pilar-tiga-jam-choice-7c-c', nodeId: 'pilar-tiga-jam-node-7c', targetNodeId: 'pilar-tiga-jam-node-8c', text: 'Ambil tambahan media dan terus dorong narasi benturan.', scoreImpact: -3 }),

      choice(timestamp, { id: 'pilar-tiga-jam-choice-8a-a', nodeId: 'pilar-tiga-jam-node-8a', targetNodeId: 'pilar-tiga-jam-node-9a', text: 'Utamakan bantuan terarah, inspeksi distribusi, dan dapur sekolah.', scoreImpact: 3 }),
      choice(timestamp, { id: 'pilar-tiga-jam-choice-8a-b', nodeId: 'pilar-tiga-jam-node-8a', targetNodeId: 'pilar-tiga-jam-node-9b', text: 'Lapisi jawaban dengan subsidi sementara yang lebih mudah diterima.', scoreImpact: 1 }),
      choice(timestamp, { id: 'pilar-tiga-jam-choice-8b-a', nodeId: 'pilar-tiga-jam-node-8b', targetNodeId: 'pilar-tiga-jam-node-9a', text: 'Saat dipaksa memilih, tetap buka struktur kebocoran ke publik.', scoreImpact: 2 }),
      choice(timestamp, { id: 'pilar-tiga-jam-choice-8b-c', nodeId: 'pilar-tiga-jam-node-8b', targetNodeId: 'pilar-tiga-jam-node-9c', text: 'Sederhanakan jadi janji stabilisasi harga yang besar.', scoreImpact: -2 }),
      choice(timestamp, { id: 'pilar-tiga-jam-choice-8c-b', nodeId: 'pilar-tiga-jam-node-8c', targetNodeId: 'pilar-tiga-jam-node-9b', text: 'Selamatkan jawabannya dengan satu program spesifik yang masih realistis.', scoreImpact: 0 }),
      choice(timestamp, { id: 'pilar-tiga-jam-choice-8c-c', nodeId: 'pilar-tiga-jam-node-8c', targetNodeId: 'pilar-tiga-jam-node-9c', text: 'Janji turunkan harga dulu, pikirkan mekanismenya belakangan.', scoreImpact: -4 }),

      choice(timestamp, { id: 'pilar-tiga-jam-choice-9a-a', nodeId: 'pilar-tiga-jam-node-9a', targetNodeId: 'pilar-tiga-jam-node-10a', text: 'Jelaskan hubungan data gudang dengan harga dapur secara terbuka.', scoreImpact: 3 }),
      choice(timestamp, { id: 'pilar-tiga-jam-choice-9a-b', nodeId: 'pilar-tiga-jam-node-9a', targetNodeId: 'pilar-tiga-jam-node-10b', text: 'Akhiri dengan janji perlindungan keluarga agar lebih membekas.', scoreImpact: 1 }),
      choice(timestamp, { id: 'pilar-tiga-jam-choice-9b-a', nodeId: 'pilar-tiga-jam-node-9b', targetNodeId: 'pilar-tiga-jam-node-10a', text: 'Saat Maya menekan, kembalikan jawaban pada mekanisme yang bisa dicek.', scoreImpact: 2 }),
      choice(timestamp, { id: 'pilar-tiga-jam-choice-9b-c', nodeId: 'pilar-tiga-jam-node-9b', targetNodeId: 'pilar-tiga-jam-node-10c', text: 'Geser ke serangan pada jaringan lama dan elite pangan.', scoreImpact: -2 }),
      choice(timestamp, { id: 'pilar-tiga-jam-choice-9c-b', nodeId: 'pilar-tiga-jam-node-9c', targetNodeId: 'pilar-tiga-jam-node-10b', text: 'Akui jawaban tadi terlalu panas lalu beri satu contoh yang nyata.', scoreImpact: 0 }),
      choice(timestamp, { id: 'pilar-tiga-jam-choice-9c-c', nodeId: 'pilar-tiga-jam-node-9c', targetNodeId: 'pilar-tiga-jam-node-10c', text: 'Teruskan permainan simbolik dan lawan dengan tempo yang sama.', scoreImpact: -3 }),

      choice(timestamp, { id: 'pilar-tiga-jam-choice-10a-a', nodeId: 'pilar-tiga-jam-node-10a', targetNodeId: 'pilar-tiga-jam-node-11a', text: 'Unggah konteks penuh dan ajak publik memeriksa seluruh jawaban.', scoreImpact: 3 }),
      choice(timestamp, { id: 'pilar-tiga-jam-choice-10a-b', nodeId: 'pilar-tiga-jam-node-10a', targetNodeId: 'pilar-tiga-jam-node-11b', text: 'Jernihkan secukupnya lalu kembali ke pesan inti kampanye.', scoreImpact: 1 }),
      choice(timestamp, { id: 'pilar-tiga-jam-choice-10b-a', nodeId: 'pilar-tiga-jam-node-10b', targetNodeId: 'pilar-tiga-jam-node-11a', text: 'Kirim penjelasan lengkap melalui relawan dan forum warga.', scoreImpact: 2 }),
      choice(timestamp, { id: 'pilar-tiga-jam-choice-10b-c', nodeId: 'pilar-tiga-jam-node-10b', targetNodeId: 'pilar-tiga-jam-node-11c', text: 'Balas dengan klip yang lebih pendek dan lebih manis.', scoreImpact: -1 }),
      choice(timestamp, { id: 'pilar-tiga-jam-choice-10c-b', nodeId: 'pilar-tiga-jam-node-10c', targetNodeId: 'pilar-tiga-jam-node-11b', text: 'Hentikan perang klip dan susun ulang pesan inti.', scoreImpact: 0 }),
      choice(timestamp, { id: 'pilar-tiga-jam-choice-10c-c', nodeId: 'pilar-tiga-jam-node-10c', targetNodeId: 'pilar-tiga-jam-node-11c', text: 'Lawan montase lawan dengan montase kita sendiri.', scoreImpact: -3 }),

      choice(timestamp, { id: 'pilar-tiga-jam-choice-11a-a', nodeId: 'pilar-tiga-jam-node-11a', targetNodeId: 'pilar-tiga-jam-node-12a', text: 'Tutup malam dengan prioritas yang terang dan bisa diawasi.', scoreImpact: 3 }),
      choice(timestamp, { id: 'pilar-tiga-jam-choice-11a-b', nodeId: 'pilar-tiga-jam-node-11a', targetNodeId: 'pilar-tiga-jam-node-12b', text: 'Rangkum tuntutan jadi janji yang lebih halus tetapi masih utuh.', scoreImpact: 1 }),
      choice(timestamp, { id: 'pilar-tiga-jam-choice-11b-a', nodeId: 'pilar-tiga-jam-node-11b', targetNodeId: 'pilar-tiga-jam-node-12a', text: 'Pilih mekanisme pengawasan warga sebagai inti penutup.', scoreImpact: 2 }),
      choice(timestamp, { id: 'pilar-tiga-jam-choice-11b-c', nodeId: 'pilar-tiga-jam-node-11b', targetNodeId: 'pilar-tiga-jam-node-12c', text: 'Bagi penutup sesuai audiens agar semua tetap merasa diajak.', scoreImpact: -2 }),
      choice(timestamp, { id: 'pilar-tiga-jam-choice-11c-b', nodeId: 'pilar-tiga-jam-node-11c', targetNodeId: 'pilar-tiga-jam-node-12b', text: 'Tarik lagi kampanye ke satu wajah yang lebih stabil.', scoreImpact: 0 }),
      choice(timestamp, { id: 'pilar-tiga-jam-choice-11c-c', nodeId: 'pilar-tiga-jam-node-11c', targetNodeId: 'pilar-tiga-jam-node-12c', text: 'Teruskan segmentasi dan biarkan tiap audiens mendengar versinya sendiri.', scoreImpact: -3 }),

      choice(timestamp, { id: 'pilar-tiga-jam-choice-12a-a', nodeId: 'pilar-tiga-jam-node-12a', targetNodeId: 'pilar-tiga-jam-node-13a', text: 'Bangun penutup dari janji pemerintah yang siap diawasi.', scoreImpact: 3 }),
      choice(timestamp, { id: 'pilar-tiga-jam-choice-12a-b', nodeId: 'pilar-tiga-jam-node-12a', targetNodeId: 'pilar-tiga-jam-node-13b', text: 'Buat janji yang tetap manusiawi dan lebih mudah dibawa pulang.', scoreImpact: 1 }),
      choice(timestamp, { id: 'pilar-tiga-jam-choice-12b-a', nodeId: 'pilar-tiga-jam-node-12b', targetNodeId: 'pilar-tiga-jam-node-13a', text: 'Pertajam lagi kejujuran tentang siapa yang diprioritaskan lebih dulu.', scoreImpact: 2 }),
      choice(timestamp, { id: 'pilar-tiga-jam-choice-12b-c', nodeId: 'pilar-tiga-jam-node-12b', targetNodeId: 'pilar-tiga-jam-node-13c', text: 'Ganti penutup jadi janji stabilitas yang lebih longgar.', scoreImpact: -1 }),
      choice(timestamp, { id: 'pilar-tiga-jam-choice-12c-b', nodeId: 'pilar-tiga-jam-node-12c', targetNodeId: 'pilar-tiga-jam-node-13b', text: 'Potong versi-versi berlebih dan sisakan satu garis yang masih bisa dibela.', scoreImpact: 0 }),
      choice(timestamp, { id: 'pilar-tiga-jam-choice-12c-c', nodeId: 'pilar-tiga-jam-node-12c', targetNodeId: 'pilar-tiga-jam-node-13c', text: 'Pertahankan semua versi dan mainkan mana yang paling efektif.', scoreImpact: -3 }),

      choice(timestamp, { id: 'pilar-tiga-jam-choice-13a-a', nodeId: 'pilar-tiga-jam-node-13a', targetNodeId: 'pilar-tiga-jam-node-14a', text: 'Pakai fact-check penuh, termasuk syarat yang membatasi diri sendiri.', scoreImpact: 3 }),
      choice(timestamp, { id: 'pilar-tiga-jam-choice-13a-b', nodeId: 'pilar-tiga-jam-node-13a', targetNodeId: 'pilar-tiga-jam-node-14b', text: 'Ambil inti yang merugikan Raka tanpa mengubah nada dasar kampanye.', scoreImpact: 1 }),
      choice(timestamp, { id: 'pilar-tiga-jam-choice-13b-a', nodeId: 'pilar-tiga-jam-node-13b', targetNodeId: 'pilar-tiga-jam-node-14a', text: 'Akui bahwa rencanamu juga perlu pengawasan dan justru itu kekuatannya.', scoreImpact: 2 }),
      choice(timestamp, { id: 'pilar-tiga-jam-choice-13b-c', nodeId: 'pilar-tiga-jam-node-13b', targetNodeId: 'pilar-tiga-jam-node-14c', text: 'Biarkan nuansa memudar dan tutup malam dengan klaim yang lebih kabur.', scoreImpact: -1 }),
      choice(timestamp, { id: 'pilar-tiga-jam-choice-13c-b', nodeId: 'pilar-tiga-jam-node-13c', targetNodeId: 'pilar-tiga-jam-node-14b', text: 'Tahan setengah kebenaran dan kembali ke kalimat yang masih bisa dipertanggungjawabkan.', scoreImpact: 0 }),
      choice(timestamp, { id: 'pilar-tiga-jam-choice-13c-c', nodeId: 'pilar-tiga-jam-node-13c', targetNodeId: 'pilar-tiga-jam-node-14c', text: 'Pilih potongan fact-check yang paling tajam dan lupakan sisanya.', scoreImpact: -4 }),

      choice(timestamp, { id: 'pilar-tiga-jam-choice-14a-reform', nodeId: 'pilar-tiga-jam-node-14a', targetNodeId: 'pilar-tiga-jam-ending-reformis', text: 'Tutup dengan janji pemerintahan yang terbuka untuk diawasi warga.', scoreImpact: 3 }),
      choice(timestamp, { id: 'pilar-tiga-jam-choice-14a-prag', nodeId: 'pilar-tiga-jam-node-14a', targetNodeId: 'pilar-tiga-jam-ending-pragmatis', text: 'Lunakkan kalimat akhir agar tetap lebar menjangkau pemilih tengah.', scoreImpact: 1 }),
      choice(timestamp, { id: 'pilar-tiga-jam-choice-14b-prag', nodeId: 'pilar-tiga-jam-node-14b', targetNodeId: 'pilar-tiga-jam-ending-pragmatis', text: 'Pertahankan nada stabil dan kompetitif sampai akhir.', scoreImpact: 1 }),
      choice(timestamp, { id: 'pilar-tiga-jam-choice-14b-lost', nodeId: 'pilar-tiga-jam-node-14b', targetNodeId: 'pilar-tiga-jam-ending-hilang-arah', text: 'Biarkan penutup tetap kabur agar tidak mengecewakan siapa pun.', scoreImpact: 0 }),
      choice(timestamp, { id: 'pilar-tiga-jam-choice-14c-lost', nodeId: 'pilar-tiga-jam-node-14c', targetNodeId: 'pilar-tiga-jam-ending-hilang-arah', text: 'Akui kampanye sempat goyah dan minta publik menilai dengan hati-hati.', scoreImpact: -1 }),
      choice(timestamp, { id: 'pilar-tiga-jam-choice-14c-pop', nodeId: 'pilar-tiga-jam-node-14c', targetNodeId: 'pilar-tiga-jam-ending-populis', text: 'Dorong satu ledakan terakhir yang paling nyaring dan paling mudah viral.', scoreImpact: -4 }),
    ],
  };

  return expandStoryIntoContinuationNodes(timestamp, storyData);
}
