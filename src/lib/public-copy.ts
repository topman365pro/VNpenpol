export type PublicLocale = 'id' | 'en';

export interface PublicCopy {
    metadata: {
        title: string;
        description: string;
    };
    brand: {
        name: string;
        expansion: string;
        badge: string;
    };
    home: {
        description: string;
        playTitle: string;
        playDescription: string;
        leaderboardTitle: string;
        leaderboardDescription: string;
        adminTitle: string;
        adminDescription: string;
        footer: string;
    };
    playList: {
        backHome: string;
        heading: string;
        subheading: string;
        fallbackDescription: string;
        emptyTitle: string;
        emptyDescription: string;
        playButton: string;
        sceneCount: (count: number) => string;
    };
    game: {
        loading: string;
        noNodes: string;
        backToStories: string;
        scoreLabel: string;
        exit: string;
        tapToSkip: string;
        completeTitle: string;
        finalScoreLabel: string;
        namePlaceholder: string;
        submitScore: string;
        submitted: string;
        playAnother: string;
        leaderboard: string;
        anonymousFallbackName: string;
        spriteAltFallback: string;
    };
    leaderboard: {
        backHome: string;
        heading: string;
        subheading: string;
        emptyTitle: string;
        emptyDescription: string;
        playNow: string;
        rank: string;
        player: string;
        score: string;
        date: string;
        playStory: string;
    };
}

const publicCopyByLocale: Record<PublicLocale, PublicCopy> = {
    id: {
        metadata: {
            title: 'PILAR',
            description: 'Pilihan Interaktif Belajar Arah Rakyat, novel visual interaktif untuk edukasi politik.',
        },
        brand: {
            name: 'PILAR',
            expansion: 'Pilihan Interaktif Belajar Arah Rakyat',
            badge: 'Novel Visual Edukasi Politik',
        },
        home: {
            description: 'Jelajahi isu publik, ambil keputusan sulit, dan lihat bagaimana pilihanmu membentuk arah cerita dan pandangan politik.',
            playTitle: 'Mulai',
            playDescription: 'Masuk ke skenario, ambil keputusan, dan lihat bagaimana sikap politikmu berkembang.',
            leaderboardTitle: 'Leaderboard',
            leaderboardDescription: 'Lihat bagaimana skor dan ketajaman analisismu dibanding pemain lain.',
            adminTitle: 'Dashboard Admin',
            adminDescription: 'Kelola cerita, karakter, aset, dan percabangan dialog untuk pengalaman PILAR.',
            footer: 'PILAR menghadirkan pembelajaran politik lewat cerita interaktif yang mudah diakses siswa.',
        },
        playList: {
            backHome: '← Kembali ke Beranda',
            heading: 'Pilih Cerita',
            subheading: 'Tentukan skenario politik yang ingin kamu hadapi, lalu putuskan langkahmu.',
            fallbackDescription: 'Sebuah skenario interaktif menunggumu.',
            emptyTitle: 'Belum ada cerita yang tersedia.',
            emptyDescription: 'Coba lagi nanti atau minta admin menambahkan cerita baru.',
            playButton: 'Play →',
            sceneCount: (count) => `${count} adegan`,
        },
        game: {
            loading: 'Memuat cerita...',
            noNodes: 'Cerita ini belum memiliki node.',
            backToStories: '← Kembali ke Daftar Cerita',
            scoreLabel: 'Skor',
            exit: '← Keluar',
            tapToSkip: 'Ketuk atau klik untuk melewati animasi teks',
            completeTitle: 'Cerita Selesai',
            finalScoreLabel: 'Skor Politikmu',
            namePlaceholder: 'Masukkan namamu...',
            submitScore: 'Kirim ke Leaderboard',
            submitted: 'Skor berhasil dikirim.',
            playAnother: 'Play Another Story',
            leaderboard: 'Leaderboard',
            anonymousFallbackName: 'Pemilih Anonim',
            spriteAltFallback: 'Sprite karakter',
        },
        leaderboard: {
            backHome: '← Kembali ke Beranda',
            heading: 'Leaderboard',
            subheading: 'Lihat pemain dengan skor tertinggi dalam membaca dan merespons situasi politik.',
            emptyTitle: 'Belum ada skor yang masuk.',
            emptyDescription: 'Jadilah pemain pertama yang menyelesaikan cerita dan memuncaki leaderboard.',
            playNow: 'Mulai',
            rank: 'Peringkat',
            player: 'Pemain',
            score: 'Skor',
            date: 'Tanggal',
            playStory: 'Play a Story',
        },
    },
    en: {
        metadata: {
            title: 'PILAR',
            description: 'Pilihan Interaktif Belajar Arah Rakyat, an interactive visual novel for political education.',
        },
        brand: {
            name: 'PILAR',
            expansion: 'Pilihan Interaktif Belajar Arah Rakyat',
            badge: 'Interactive Political Learning',
        },
        home: {
            description: 'Explore public issues, make hard decisions, and see how your choices shape both the story and your political perspective.',
            playTitle: 'Play Now',
            playDescription: 'Jump into a scenario, make choices, and see how your political stance unfolds.',
            leaderboardTitle: 'Leaderboard',
            leaderboardDescription: 'See how your score and judgment compare with other players.',
            adminTitle: 'Admin Dashboard',
            adminDescription: 'Manage stories, characters, assets, and dialogue branches for the PILAR experience.',
            footer: 'PILAR brings political learning to students through accessible interactive storytelling.',
        },
        playList: {
            backHome: '← Back to Home',
            heading: 'Choose Your Story',
            subheading: 'Pick the political scenario you want to face, then decide your next move.',
            fallbackDescription: 'An interactive scenario is waiting for you.',
            emptyTitle: 'No stories are available yet.',
            emptyDescription: 'Check back later or ask an admin to add a new story.',
            playButton: 'Play →',
            sceneCount: (count) => `${count} ${count === 1 ? 'scene' : 'scenes'}`,
        },
        game: {
            loading: 'Loading story...',
            noNodes: 'This story has no nodes yet.',
            backToStories: '← Back to Stories',
            scoreLabel: 'Score',
            exit: '← Exit',
            tapToSkip: 'Tap or click to skip',
            completeTitle: 'Story Complete',
            finalScoreLabel: 'Your Political Score',
            namePlaceholder: 'Enter your name...',
            submitScore: 'Submit to Leaderboard',
            submitted: 'Score submitted.',
            playAnother: 'Play Another',
            leaderboard: 'Leaderboard',
            anonymousFallbackName: 'Anonymous Voter',
            spriteAltFallback: 'Character sprite',
        },
        leaderboard: {
            backHome: '← Back to Home',
            heading: 'Leaderboard',
            subheading: 'See which players earned the highest scores in reading and responding to political situations.',
            emptyTitle: 'No scores have been submitted yet.',
            emptyDescription: 'Be the first player to finish a story and top the leaderboard.',
            playNow: 'Play Now',
            rank: 'Rank',
            player: 'Player',
            score: 'Score',
            date: 'Date',
            playStory: 'Play a Story',
        },
    },
};

export function getPublicCopy(locale: PublicLocale): PublicCopy {
    return publicCopyByLocale[locale];
}

export function formatPublicDate(value: string, locale: PublicLocale) {
    return new Intl.DateTimeFormat(locale === 'id' ? 'id-ID' : 'en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    }).format(new Date(value));
}
