import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStats } from './lib/readingProgress';

const Home = () => {
  const navigate = useNavigate();
  const [daily, setDaily] = useState(null);
  const [dailyLoading, setDailyLoading] = useState(true);
  const [dailyDoa, setDailyDoa] = useState(null);
  const [dailyDoaLoading, setDailyDoaLoading] = useState(true);
  const [toast, setToast] = useState('');
  const [lastRead, setLastRead] = useState(null);
  const [lastAudio, setLastAudio] = useState(null);
  const [bookmarksCount, setBookmarksCount] = useState(0);
  const [chaptersMeta, setChaptersMeta] = useState(null);
  const [chaptersLoading, setChaptersLoading] = useState(false);

  const stats = useMemo(() => getStats(), []);

  useEffect(() => {
    try {
      const lr = localStorage.getItem('lastRead');
      if (lr) setLastRead(JSON.parse(lr));
    } catch (e) { void e; }
    try {
      const la = localStorage.getItem('lastAudio');
      if (la) setLastAudio(JSON.parse(la));
    } catch (e) { void e; }
    try {
      const raw = localStorage.getItem('bookmarks');
      const list = raw ? JSON.parse(raw) : [];
      setBookmarksCount(Array.isArray(list) ? list.length : 0);
    } catch (e) { void e; }
  }, []);

  useEffect(() => {
    const key = (() => {
      const d = new Date();
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    })();

    const cachedRaw = localStorage.getItem('dailyDoa');
    if (cachedRaw) {
      try {
        const cached = JSON.parse(cachedRaw);
        if (cached?.date === key && cached?.id) {
          setDailyDoa(cached);
          setDailyDoaLoading(false);
          return;
        }
      } catch (e) { void e; }
    }

    const run = async () => {
      setDailyDoaLoading(true);
      try {
        const list = await fetch('https://open-api.my.id/api/doa').then(r => r.json());
        if (!Array.isArray(list) || list.length === 0) throw new Error('no doa');
        const dayIndex = Math.floor(Date.now() / 86400000);
        const picked = list[dayIndex % list.length];
        const payload = { date: key, ...picked };
        localStorage.setItem('dailyDoa', JSON.stringify(payload));
        setDailyDoa(payload);
      } catch (e) {
        void e;
        setDailyDoa(null);
      } finally {
        setDailyDoaLoading(false);
      }
    };
    run();
  }, []);

  useEffect(() => {
    const key = (() => {
      const d = new Date();
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    })();

    const cachedRaw = localStorage.getItem('dailyVerse');
    if (cachedRaw) {
      try {
        const cached = JSON.parse(cachedRaw);
        if (cached?.date === key && cached?.verse_key) {
          setDaily(cached);
          setDailyLoading(false);
          return;
        }
      } catch (e) { void e; }
    }

    const run = async () => {
      setDailyLoading(true);
      try {
        const rand = await fetch('https://api.quran.com/api/v4/verses/random').then(r => r.json());
        const verseKey = rand?.verse?.verse_key;
        if (!verseKey) throw new Error('no verse_key');
        const detail = await fetch(`https://api.quran.com/api/v4/verses/by_key/${verseKey}?language=id&translations=33&fields=text_uthmani,verse_key,verse_number`).then(r => r.json());
        const v = detail?.verse;
        const payload = {
          date: key,
          verse_key: v?.verse_key,
          verse_number: v?.verse_number,
          text_uthmani: v?.text_uthmani,
          translation: v?.translations?.[0]?.text || '',
        };
        localStorage.setItem('dailyVerse', JSON.stringify(payload));
        setDaily(payload);
      } catch (e) {
        void e;
        setDaily(null);
      } finally {
        setDailyLoading(false);
      }
    };
    run();
  }, []);

  const stripHtml = (s) => String(s || '').replace(/<[^>]*>/g, '');

  const copyText = async (text, okMsg) => {
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(text);
      if (okMsg) setToast(okMsg);
      setTimeout(() => setToast(''), 1200);
    } catch (e) {
      void e;
      setToast('Gagal menyalin');
      setTimeout(() => setToast(''), 1200);
    }
  };

  const recommended = [
    { id: 1, label: 'Al-Fatihah' },
    { id: 36, label: 'Yasin' },
    { id: 55, label: 'Ar-Rahman' },
    { id: 67, label: 'Al-Mulk' },
    { id: 112, label: 'Al-Ikhlas' },
    { id: 113, label: 'Al-Falaq' },
    { id: 114, label: 'An-Nas' },
  ];

  useEffect(() => {
    const run = async () => {
      setChaptersLoading(true);
      try {
        const res = await fetch('https://api.quran.com/api/v4/chapters?language=id').then(r => r.json());
        const list = Array.isArray(res?.chapters) ? res.chapters : [];
        const map = {};
        for (const c of list) map[c.id] = c;
        setChaptersMeta(map);
      } catch (e) {
        void e;
      } finally {
        setChaptersLoading(false);
      }
    };
    run();
  }, []);

  const formatPlace = (p) => {
    const s = String(p || '').toLowerCase();
    if (!s) return '';
    if (s === 'makkah' || s === 'makkiyah') return 'Makkiyah';
    if (s === 'madinah' || s === 'madaniyah') return 'Madaniyah';
    return p;
  };

  return (
    <div className="min-h-screen w-full px-4 md:px-8 py-10">
      <div className="w-full grid grid-cols-1 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] gap-5 lg:gap-6 items-start">
        <div className="order-2 lg:order-1">
          <div className="card p-5">
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="pill px-4 py-2 text-[var(--brown)] text-sm font-semibold">AI Quran</div>
              <button onClick={() => navigate('/settings')} type="button" className="pill w-11 h-11 grid place-items-center text-[var(--brown)]" title="Pengaturan">⚙️</button>
            </div>
            <h1 className="text-4xl md:text-5xl font-semibold text-[var(--text)] mb-3 leading-tight">Selamat Datang</h1>
            <p className="text-gray-700 mb-6 leading-relaxed">Temukan ketenangan melalui ayat-ayat suci Al-Qur'an.</p>
            <div className="flex flex-wrap gap-3">
              <button onClick={() => navigate('/surah')} className="btn-brown px-7 py-3.5 rounded-2xl text-base font-semibold flex items-center gap-2" type="button">
                <span>Mulai</span>
                <span className="text-lg">›</span>
              </button>
              <button onClick={() => navigate('/surah')} className="px-7 py-3.5 rounded-2xl text-base font-semibold border border-[rgba(107,79,58,.25)] bg-white text-[var(--brown)] shadow-[0_10px_22px_rgba(0,0,0,.06)]" type="button">
                Lihat Surah
              </button>
              <button
                onClick={() => lastRead && navigate(`/surah/${lastRead.id}?ayah=${lastRead.verse || 1}`)}
                className={`px-7 py-3.5 rounded-2xl text-base font-semibold border border-[rgba(107,79,58,.25)] bg-[var(--beige-2)] text-[var(--brown)] shadow-[0_10px_22px_rgba(0,0,0,.06)] ${lastRead ? '' : 'opacity-50'}`}
                disabled={!lastRead}
                type="button"
              >
                Lanjutkan
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-7">
              <div className="pill p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-gray-500">Surah dibaca</div>
                    <div className="text-2xl font-semibold text-[var(--text)]">{stats.surahReadCount}</div>
                  </div>
                  <div className="w-10 h-10 rounded-2xl bg-white border border-black/5 grid place-items-center text-xl">📖</div>
                </div>
              </div>
              <div className="pill p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-gray-500">Ayat ditandai</div>
                    <div className="text-2xl font-semibold text-[var(--text)]">{stats.ayahReadCount}</div>
                  </div>
                  <div className="w-10 h-10 rounded-2xl bg-white border border-black/5 grid place-items-center text-xl">✅</div>
                </div>
              </div>
              <div className="pill p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-gray-500">Streak</div>
                    <div className="text-2xl font-semibold text-[var(--text)]">{stats.streak} hari</div>
                  </div>
                  <div className="w-10 h-10 rounded-2xl bg-white border border-black/5 grid place-items-center text-xl">🔥</div>
                </div>
              </div>
              <div className="pill p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-gray-500">Bookmark</div>
                    <div className="text-2xl font-semibold text-[var(--text)]">{bookmarksCount}</div>
                  </div>
                  <div className="w-10 h-10 rounded-2xl bg-white border border-black/5 grid place-items-center text-xl">🔖</div>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-5 mt-6">
            <div className="flex items-center justify-between mb-3">
              <div className="font-semibold">Rekomendasi Surah</div>
              <button onClick={() => navigate('/surah')} className="pill px-3 py-1 text-[var(--brown)] text-sm" type="button">Lihat semua</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {recommended.map(s => (
                <button key={s.id} onClick={() => navigate(`/surah/${s.id}`)} className="menu-item p-4 text-left" type="button">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-xs text-gray-500">Surah {s.id}</div>
                      <div className="font-semibold text-[var(--text)] truncate">{s.label}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {chaptersMeta?.[s.id]
                          ? `${formatPlace(chaptersMeta[s.id].revelation_place)} • ${chaptersMeta[s.id].verses_count} ayat`
                          : chaptersLoading ? 'Memuat info...' : ''}
                      </div>
                    </div>
                    <div className="w-11 h-11 rounded-2xl pill grid place-items-center text-xl">📜</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="card p-5 mt-6">
            <div className="flex items-center justify-between mb-3">
              <div className="font-semibold">Doa Harian</div>
              <button onClick={() => navigate('/surah?tab=doa')} className="pill px-3 py-1 text-[var(--brown)] text-sm" type="button">Lihat semua</button>
            </div>
            {dailyDoaLoading ? (
              <div className="text-sm text-gray-600">Memuat doa harian...</div>
            ) : dailyDoa ? (
              <>
                <div className="text-sm text-gray-700 font-semibold">{dailyDoa.judul}</div>
                <div className="text-end font-arabic text-[var(--brown)] text-3xl leading-[3rem] mt-3">{dailyDoa.arab}</div>
                <div className="text-sm text-gray-600 italic mt-2">{dailyDoa.latin}</div>
                <div className="text-sm text-gray-700 mt-2">{stripHtml(dailyDoa.terjemah)}</div>
                <div className="flex flex-wrap gap-2 mt-4">
                  <button type="button" className="pill px-4 py-2 text-[var(--brown)]" onClick={() => copyText(dailyDoa.arab, 'Arab disalin')}>Salin Arab</button>
                  <button type="button" className="pill px-4 py-2 text-[var(--brown)]" onClick={() => copyText(dailyDoa.latin, 'Latin disalin')}>Salin Latin</button>
                  <button type="button" className="pill px-4 py-2 text-[var(--brown)]" onClick={() => copyText(stripHtml(dailyDoa.terjemah), 'Terjemah disalin')}>Salin Terjemah</button>
                </div>
              </>
            ) : (
              <div className="text-sm text-gray-600">Doa harian belum tersedia.</div>
            )}
          </div>
        </div>

        <div className="order-1 lg:order-2">
          <div className="card p-4 w-full shadow-[0_18px_45px_rgba(0,0,0,.10)]">
            <img src="/alquran.png" alt="Al-Qur'an" className="w-full h-auto rounded-xl" />
          </div>

          <div className="card p-5 mt-6 w-full">
            <div className="flex items-center justify-between mb-3">
              <div className="font-semibold">Ayat Harian</div>
              <div className="text-xs text-gray-500">{daily?.date || ''}</div>
            </div>
            {dailyLoading ? (
              <div className="text-sm text-gray-600">Memuat ayat harian...</div>
            ) : daily ? (
              <>
                <div className="text-end font-arabic text-[var(--brown)] text-3xl md:text-4xl leading-[2.8rem] md:leading-[3.2rem]">{daily.text_uthmani}</div>
                <div className="text-sm text-gray-700 mt-3">{String(daily.translation).replace(/<[^>]*>/g, '')}</div>
                <div className="flex items-center justify-between mt-4">
                  <div className="text-xs text-gray-500">{daily.verse_key}</div>
                  <button
                    className="btn-brown px-5 py-2.5 rounded-2xl font-semibold"
                    type="button"
                    onClick={() => {
                      const [sid, ay] = String(daily.verse_key).split(':').map(Number)
                      if (sid && ay) navigate(`/surah/${sid}?ayah=${ay}`)
                    }}
                  >
                    Baca ›
                  </button>
                </div>
              </>
            ) : (
              <div className="text-sm text-gray-600">Ayat harian belum tersedia.</div>
            )}
          </div>

          <div className="card p-5 mt-6 w-full">
            <div className="font-semibold mb-3">Shortcut Cepat</div>
            <div className="grid grid-cols-2 gap-3">
              <button
                className={`pill px-4 py-3 text-left ${lastRead ? '' : 'opacity-50'}`}
                disabled={!lastRead}
                onClick={() => lastRead && navigate(`/surah/${lastRead.id}?ayah=${lastRead.verse || 1}`)}
                type="button"
              >
                <div className="text-xs text-gray-500">Lanjutkan</div>
                <div className="font-semibold text-[var(--brown)]">{lastRead?.name || '-'}</div>
              </button>
              <button
                className={`pill px-4 py-3 text-left ${lastAudio ? '' : 'opacity-50'}`}
                disabled={!lastAudio}
                onClick={() => lastAudio && navigate(`/surah/${lastAudio.id}?ayah=${lastAudio.verse || 1}&autoplay=1`)}
                type="button"
              >
                <div className="text-xs text-gray-500">Putar terakhir</div>
                <div className="font-semibold text-[var(--brown)]">{lastAudio ? `Ayat ${lastAudio.verse}` : '-'}</div>
              </button>
              <button
                className="pill px-4 py-3 text-left"
                onClick={() => navigate('/surah')}
                type="button"
              >
                <div className="text-xs text-gray-500">Buka</div>
                <div className="font-semibold text-[var(--brown)]">Daftar Surah</div>
              </button>
              <button
                className="pill px-4 py-3 text-left"
                onClick={() => navigate('/settings')}
                type="button"
              >
                <div className="text-xs text-gray-500">Atur</div>
                <div className="font-semibold text-[var(--brown)]">Tampilan</div>
              </button>
            </div>
          </div>
        </div>
      </div>
      {toast && (
        <div className="fixed left-1/2 -translate-x-1/2 bottom-24 z-50 card px-4 py-2 text-sm">
          {toast}
        </div>
      )}
    </div>
  );
};

export default Home;
