import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import SearchBox from './SearchBox';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import { getStats } from './lib/readingProgress';

export default function SurahList() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const searchRef = useRef(null);
  const [chapters, setChapters] = useState([]);
  const [juzs, setJuzs] = useState([]);
  const [query, setQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');
  const [displayMode, setDisplayMode] = useState('surah');
  const [lastRead, setLastRead] = useState(null);
  const [bookmarks, setBookmarks] = useState(() => new Set());
  const [notice, setNotice] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [onlyBookmarked, setOnlyBookmarked] = useState(false);
  const [selectedSegmentType, setSelectedSegmentType] = useState(null);
  const [selectedSegmentNumber, setSelectedSegmentNumber] = useState(null);
  const [segmentChapterIds, setSegmentChapterIds] = useState([]);
  const [segmentLoading, setSegmentLoading] = useState(false);
  const [pickerPage, setPickerPage] = useState(1);
  const [daily, setDaily] = useState(null);
  const [dailyLoading, setDailyLoading] = useState(false);
  const [asma, setAsma] = useState([]);
  const [asmaLoading, setAsmaLoading] = useState(false);
  const [doa, setDoa] = useState([]);
  const [doaLoading, setDoaLoading] = useState(false);
  const [openDoaId, setOpenDoaId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [chapterRes, juzRes] = await Promise.all([
          fetch('https://api.quran.com/api/v4/chapters?language=id').then((res) => res.json()),
          fetch('https://api.quran.com/api/v4/juzs').then((res) => res.json()),
        ]);
        setChapters(chapterRes.chapters);
        setJuzs(juzRes.juzs);
      } catch (err) {
        console.error('Gagal fetch data:', err);
      }
    };

    fetchData();
    try {
      const lr = localStorage.getItem('lastRead');
      if(lr) setLastRead(JSON.parse(lr));
    } catch (e) {
      void e;
    }
    try {
      const raw = localStorage.getItem('bookmarks');
      if (raw) setBookmarks(new Set(JSON.parse(raw)));
    } catch (e) {
      void e;
    }

    const today = (() => {
      const d = new Date();
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    })();

    let shouldFetchDaily = true;
    const cachedRaw = localStorage.getItem('dailyVerse');
    if (cachedRaw) {
      try {
        const cached = JSON.parse(cachedRaw);
        if (cached?.verse_key) {
          setDaily(cached);
          if (cached?.date === today) shouldFetchDaily = false;
        }
      } catch (e) { void e; }
    }

    const loadDaily = async () => {
      setDailyLoading(true);
      try {
        const rand = await fetch('https://api.quran.com/api/v4/verses/random').then(r => r.json());
        const verseKey = rand?.verse?.verse_key;
        if (!verseKey) throw new Error('no verse_key');
        const detail = await fetch(`https://api.quran.com/api/v4/verses/by_key/${verseKey}?language=id&translations=33&fields=text_uthmani,verse_key,verse_number`).then(r => r.json());
        const v = detail?.verse;
        const payload = {
          date: (() => {
            const d = new Date();
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${y}-${m}-${day}`;
          })(),
          verse_key: v?.verse_key,
          verse_number: v?.verse_number,
          text_uthmani: v?.text_uthmani,
          translation: v?.translations?.[0]?.text || '',
        };
        localStorage.setItem('dailyVerse', JSON.stringify(payload));
        setDaily(payload);
      } catch (e) {
        void e;
      } finally {
        setDailyLoading(false);
      }
    };

    if (shouldFetchDaily) loadDaily();

    const loadAsma = async () => {
      setAsmaLoading(true);
      try {
        const cachedRaw = localStorage.getItem('asmaulHusna');
        if (cachedRaw) {
          const cached = JSON.parse(cachedRaw);
          if (Array.isArray(cached)) {
            setAsma(cached);
            setAsmaLoading(false);
            return;
          }
        }
      } catch (e) { void e; }
      try {
        const res = await fetch('https://asmaul-husna-api.vercel.app/api/all').then(r => r.json());
        const list = Array.isArray(res?.data) ? res.data : [];
        setAsma(list);
        try { localStorage.setItem('asmaulHusna', JSON.stringify(list)); } catch (e) { void e; }
      } catch (e) {
        void e;
      } finally {
        setAsmaLoading(false);
      }
    };

    const loadDoa = async () => {
      setDoaLoading(true);
      try {
        const cachedRaw = localStorage.getItem('doaList');
        if (cachedRaw) {
          const cached = JSON.parse(cachedRaw);
          if (Array.isArray(cached)) {
            setDoa(cached);
            setDoaLoading(false);
            return;
          }
        }
      } catch (e) { void e; }
      try {
        const list = await fetch('https://open-api.my.id/api/doa').then(r => r.json());
        if (Array.isArray(list)) {
          setDoa(list);
          try { localStorage.setItem('doaList', JSON.stringify(list)); } catch (e) { void e; }
        }
      } catch (e) {
        void e;
      } finally {
        setDoaLoading(false);
      }
    };

    loadAsma();
    loadDoa();
  }, []);

  const baseChapters = useMemo(() => {
    const q = query.trim().toLowerCase();
    return chapters
      .filter((surah) => {
        const byQuery = !q ||
          surah.name_simple.toLowerCase().includes(q) ||
          surah.translated_name.name.toLowerCase().includes(q);
        const byBookmark = !onlyBookmarked || bookmarks.has(surah.id);
        return byQuery && byBookmark;
      })
      .sort((a, b) => sortOrder === 'asc' ? a.id - b.id : b.id - a.id);
  }, [bookmarks, chapters, onlyBookmarked, query, sortOrder]);

  const sortedJuzs = useMemo(() => {
    const dedup = new Map();
    for (const j of juzs) dedup.set(j.juz_number, j);
    return [...dedup.values()].sort((a, b) =>
      sortOrder === 'asc' ? a.juz_number - b.juz_number : b.juz_number - a.juz_number
    );
  }, [juzs, sortOrder]);

  const tabs = [
    { key: 'surah', label: 'Surah', enabled: true },
    { key: 'page', label: 'Page', enabled: true },
    { key: 'juz', label: 'Juz', enabled: true },
    { key: 'asma', label: 'Asma', enabled: true },
    { key: 'doa', label: 'Doa', enabled: true },
  ];

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['surah', 'page', 'juz', 'asma', 'doa'].includes(tab)) {
      setSelectedSegmentType(null);
      setSelectedSegmentNumber(null);
      setSegmentChapterIds([]);
      setPickerPage(1);
      setDisplayMode(tab);
    }
  }, [searchParams]);

  const segmentLabel = (key) => {
    if (key === 'juz') return 'Nomor juz';
    if (key === 'page') return 'Nomor page';
    return 'Nomor surah';
  };

  const sortByLabel = ['juz', 'page'].includes(displayMode) && !selectedSegmentNumber
    ? segmentLabel(displayMode)
    : 'Nomor surah';

  const persistBookmarks = (nextSet) => {
    setBookmarks(nextSet);
    try {
      localStorage.setItem('bookmarks', JSON.stringify([...nextSet]));
    } catch (e) {
      void e;
    }
  };

  const toggleBookmark = (id) => {
    const next = new Set(bookmarks);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    persistBookmarks(next);
  };

  const openSearch = () => {
    setNotice('');
    try {
      searchRef.current?.focus();
      searchRef.current?.scrollIntoView({ block: 'center' });
    } catch (e) {
      void e;
    }
  };

  const fetchSegmentChapterIds = async (segmentType, segmentNumber) => {
    const unique = new Set();
    let page = 1;
    let totalPages = 1;
    while (page <= totalPages && page <= 20) {
      const res = await fetch(`https://api.quran.com/api/v4/verses/by_${segmentType}/${segmentNumber}?per_page=300&page=${page}`).then(r => r.json());
      const verses = res?.verses || res?.data || [];
      for (const v of verses) {
        const vk = v?.verse_key || v?.verseKey;
        if (vk) {
          const chap = parseInt(String(vk).split(':')[0]);
          if (Number.isFinite(chap)) unique.add(chap);
          continue;
        }
        if (v?.chapter_id && Number.isFinite(v.chapter_id)) unique.add(v.chapter_id);
      }
      const pagination = res?.pagination || res?.meta?.pagination || res?.meta;
      totalPages = pagination?.total_pages || pagination?.totalPages || 1;
      page += 1;
    }
    return [...unique].sort((a, b) => a - b);
  };

  const openSegment = async (segmentType, segmentNumber) => {
    setNotice('');
    setSegmentLoading(true);
    try {
      const ids = await fetchSegmentChapterIds(segmentType, segmentNumber);
      setSegmentChapterIds(ids);
      setSelectedSegmentType(segmentType);
      setSelectedSegmentNumber(segmentNumber);
    } catch (e) {
      void e;
      setNotice('Gagal memuat surah untuk segmen ini. Coba lagi.');
    } finally {
      setSegmentLoading(false);
    }
  };

  const segmentFilteredChapters = useMemo(() => {
    if (!selectedSegmentNumber) return [];
    if (selectedSegmentType !== displayMode) return [];
    const allowed = new Set(segmentChapterIds);
    return baseChapters.filter(c => allowed.has(c.id));
  }, [baseChapters, displayMode, segmentChapterIds, selectedSegmentNumber, selectedSegmentType]);

  const bookmarkedChapters = useMemo(() => {
    if (bookmarks.size === 0) return [];
    const set = new Set(bookmarks);
    return chapters.filter(c => set.has(c.id)).sort((a,b)=>a.id-b.id);
  }, [bookmarks, chapters]);

  const stats = getStats();

  const stripHtml = (s) => String(s || '').replace(/<[^>]*>/g, '');

  const filteredAsma = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = Array.isArray(asma) ? asma : [];
    if (!q) return list;
    return list.filter(a => {
      return String(a?.latin || '').toLowerCase().includes(q) ||
        String(a?.arab || '').toLowerCase().includes(q) ||
        String(a?.arti || '').toLowerCase().includes(q) ||
        String(a?.urutan || '').toLowerCase().includes(q);
    });
  }, [asma, query]);

  const filteredDoa = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = Array.isArray(doa) ? doa : [];
    if (!q) return list;
    return list.filter(d => {
      return String(d?.judul || '').toLowerCase().includes(q) ||
        String(d?.latin || '').toLowerCase().includes(q) ||
        String(d?.arab || '').toLowerCase().includes(q) ||
        String(d?.terjemah || '').toLowerCase().includes(q) ||
        String(d?.id || '').toLowerCase().includes(q);
    });
  }, [doa, query]);

  const copyText = async (text, okMsg) => {
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(text);
      setNotice(okMsg || 'Disalin');
      setTimeout(() => setNotice(''), 1200);
    } catch (e) {
      void e;
      setNotice('Gagal menyalin');
      setTimeout(() => setNotice(''), 1200);
    }
  };

  return (
    <div className="min-h-screen pb-24">
      <Header
        title="Al Quran"
        onMenu={() => setMenuOpen(true)}
        onSearch={openSearch}
        onTools={() => setToolsOpen(true)}
      />
      <div className="w-full px-4 py-5 lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-6">
        <div className="order-2 lg:order-1">
          <div className="pill p-1.5 flex gap-1.5 text-sm mb-4 w-full">
            {tabs.map(t => (
              <button
                key={t.key}
                onClick={() => {
                  if (!t.enabled) {
                    setNotice(`Tab ${t.label} belum tersedia`);
                    return;
                  }
                  setNotice('');
                  setSelectedSegmentType(null);
                  setSelectedSegmentNumber(null);
                  setSegmentChapterIds([]);
                  setPickerPage(1);
                  setDisplayMode(t.key);
                }}
                className={`flex-1 py-2.5 rounded-full transition ${displayMode===t.key ? 'btn-brown' : 'text-[var(--brown)]'} ${t.enabled ? '' : 'opacity-45'}`}
              >
                <span className={`${displayMode===t.key ? 'font-semibold' : ''}`}>{t.label}</span>
              </button>
            ))}
          </div>

          {notice && <div className="text-sm text-[var(--brown)] mb-3">{notice}</div>}

          <div className="flex items-end justify-between mb-2">
            <div>
              <div className="text-sm text-gray-700 font-semibold">Urutkan</div>
              <div className="text-xs text-gray-500">Berdasarkan: {sortByLabel}</div>
            </div>
            <select
              className="pill px-3 py-2"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            >
              <option value="asc">Naik (Ascending)</option>
              <option value="desc">Turun (Descending)</option>
            </select>
          </div>
          <SearchBox
            query={query}
            setQuery={setQuery}
            inputRef={searchRef}
            placeholder={displayMode === 'juz' && !selectedSegmentNumber ? 'Cari juz...' : displayMode === 'page' && !selectedSegmentNumber ? 'Cari page...' : displayMode === 'asma' ? 'Cari asmaul husna...' : displayMode === 'doa' ? 'Cari doa...' : 'Cari surah...'}
          />

        {/* SURAH MODE */}
        {displayMode === 'surah' && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-2">
            {baseChapters.map((surah) => (
              <button
                type="button"
                key={surah.id}
                onClick={() => {
                  const nextLastRead = { id: surah.id, name: surah.name_simple, verse: 1 };
                  setLastRead(nextLastRead);
                  try {
                    localStorage.setItem('lastRead', JSON.stringify(nextLastRead));
                  } catch (e) {
                    void e;
                  }
                  navigate(`/surah/${surah.id}`);
                }}
                className="card p-4 w-full flex items-center justify-between hover:-translate-y-[1px] transition text-left"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl pill grid place-items-center text-[var(--brown)] font-semibold">{surah.id}</div>
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="font-semibold text-[var(--text)] truncate">{surah.name_simple}</div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleBookmark(surah.id);
                        }}
                        className="pill w-9 h-9 grid place-items-center text-[var(--brown)]"
                        aria-label="bookmark"
                        title="Bookmark"
                      >
                        {bookmarks.has(surah.id) ? '🔖' : '📑'}
                      </button>
                    </div>
                    <div className="text-xs text-gray-500">{surah.revelation_place} • {surah.verses_count} ayat</div>
                  </div>
                </div>
                <div className="text-2xl font-arabic text-[var(--brown)]">{surah.name_arabic}</div>
              </button>
            ))}
          </div>
        )}

        {/* JUZ MODE */}
        {displayMode === 'juz' && (
          <>
            {selectedSegmentType === 'juz' && selectedSegmentNumber ? (
              <div className="mt-2">
                <div className="flex items-center justify-between mb-3">
                  <button className="pill px-4 py-2 text-[var(--brown)]" onClick={() => { setSelectedSegmentType(null); setSelectedSegmentNumber(null); setSegmentChapterIds([]); }}>Kembali</button>
                  <div className="font-semibold">Juz {selectedSegmentNumber}</div>
                </div>
                {segmentLoading ? (
                  <div className="text-sm text-gray-600">Memuat surah...</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {segmentFilteredChapters.map((surah) => (
                      <button
                        type="button"
                        key={surah.id}
                        onClick={() => navigate(`/surah/${surah.id}`)}
                        className="card p-4 w-full flex items-center justify-between hover:-translate-y-[1px] transition text-left"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl pill grid place-items-center text-[var(--brown)] font-semibold">{surah.id}</div>
                          <div className="min-w-0">
                            <div className="font-semibold truncate">{surah.name_simple}</div>
                            <div className="text-xs text-gray-500">{surah.revelation_place} • {surah.verses_count} ayat</div>
                          </div>
                        </div>
                        <div className="text-2xl font-arabic text-[var(--brown)]">{surah.name_arabic}</div>
                      </button>
                    ))}
                    {!segmentLoading && segmentFilteredChapters.length === 0 && (
                      <div className="text-sm text-gray-600">Tidak ada surah ditemukan untuk juz ini.</div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-2">
                {sortedJuzs
                  .filter(j => {
                    const q = query.trim().toLowerCase();
                    if (!q) return true;
                    return `juz ${j.juz_number}`.includes(q) || String(j.juz_number).includes(q);
                  })
                  .map((juz) => (
                    <button
                      key={juz.juz_number}
                      className="card p-4 flex items-center justify-between hover:-translate-y-[1px] transition text-left"
                      onClick={() => openSegment('juz', juz.juz_number)}
                      type="button"
                    >
                      <div className="font-semibold">Juz {juz.juz_number}</div>
                      <div className="text-xs text-gray-500">Ayat {juz.first_verse_id} - {juz.last_verse_id}</div>
                    </button>
                  ))}
              </div>
            )}
          </>
        )}

        {displayMode === 'page' && (
          <>
            {selectedSegmentType === displayMode && selectedSegmentNumber ? (
              <div className="mt-2">
                <div className="flex items-center justify-between mb-3">
                  <button className="pill px-4 py-2 text-[var(--brown)]" onClick={() => { setSelectedSegmentType(null); setSelectedSegmentNumber(null); setSegmentChapterIds([]); }}>Kembali</button>
                  <div className="font-semibold">{displayMode.toUpperCase()} {selectedSegmentNumber}</div>
                </div>
                {segmentLoading ? (
                  <div className="text-sm text-gray-600">Memuat surah...</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {segmentFilteredChapters.map((surah) => (
                      <button
                        type="button"
                        key={surah.id}
                        onClick={() => navigate(`/surah/${surah.id}`)}
                        className="card p-4 w-full flex items-center justify-between hover:-translate-y-[1px] transition text-left"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl pill grid place-items-center text-[var(--brown)] font-semibold">{surah.id}</div>
                          <div className="min-w-0">
                            <div className="font-semibold truncate">{surah.name_simple}</div>
                            <div className="text-xs text-gray-500">{surah.revelation_place} • {surah.verses_count} ayat</div>
                          </div>
                        </div>
                        <div className="text-2xl font-arabic text-[var(--brown)]">{surah.name_arabic}</div>
                      </button>
                    ))}
                    {!segmentLoading && segmentFilteredChapters.length === 0 && (
                      <div className="text-sm text-gray-600">Tidak ada surah ditemukan untuk segmen ini.</div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              (() => {
                const max = 604;
                const per = 24;
                const totalPages = Math.max(1, Math.ceil(max / per));
                const safePage = Math.min(totalPages, Math.max(1, pickerPage));
                const start = (safePage - 1) * per + 1;
                const end = Math.min(max, start + per - 1);
                const items = Array.from({ length: end - start + 1 }, (_, i) => start + i);
                const q = query.trim();
                const inputValue = q && /^\d+$/.test(q) ? Number(q) : null;
                const canJump = inputValue && inputValue >= 1 && inputValue <= max;
                return (
                  <div className="mt-2">
                    <div className="card p-4 mb-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="font-semibold">Pilih {displayMode}</div>
                          <div className="text-xs text-gray-500">Masukkan angka 1 - {max}, lalu klik Buka</div>
                        </div>
                        <button
                          type="button"
                          className={`pill px-4 py-2 ${canJump ? 'btn-brown' : 'opacity-50 text-[var(--brown)]'}`}
                          disabled={!canJump}
                          onClick={() => openSegment(displayMode, inputValue)}
                        >
                          Buka
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mb-3">
                      <button
                        type="button"
                        className="pill px-4 py-2 text-[var(--brown)]"
                        disabled={safePage <= 1}
                        onClick={() => setPickerPage(p => Math.max(1, p - 1))}
                      >
                        Prev
                      </button>
                      <div className="text-sm text-gray-600">{safePage} / {totalPages}</div>
                      <button
                        type="button"
                        className="pill px-4 py-2 text-[var(--brown)]"
                        disabled={safePage >= totalPages}
                        onClick={() => setPickerPage(p => Math.min(totalPages, p + 1))}
                      >
                        Next
                      </button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                      {items.map((n) => (
                        <button
                          key={n}
                          type="button"
                          className="card p-4 text-left hover:-translate-y-[1px] transition"
                          onClick={() => openSegment(displayMode, n)}
                        >
                          <div className="font-semibold">{displayMode.toUpperCase()} {n}</div>
                          <div className="text-xs text-gray-500">Tap untuk lihat surah</div>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })()
            )}
          </>
        )}

        {displayMode === 'asma' && (
          <div className="mt-2">
            {asmaLoading ? (
              <div className="text-sm text-gray-600">Memuat Asmaul Husna...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredAsma.map((a) => (
                  <button
                    key={a.urutan}
                    type="button"
                    className="card p-4 text-left hover:-translate-y-[1px] transition"
                    onClick={() => copyText(`${a.arab} — ${a.latin} — ${a.arti}`, 'Asma disalin')}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-xs text-gray-500">#{a.urutan}</div>
                        <div className="font-semibold text-[var(--text)] truncate">{a.latin}</div>
                        <div className="text-sm text-gray-600">{a.arti}</div>
                      </div>
                      <div className="text-3xl font-arabic text-[var(--brown)]">{a.arab}</div>
                    </div>
                    <div className="text-xs text-gray-500 mt-3">Tap untuk salin</div>
                  </button>
                ))}
                {!asmaLoading && filteredAsma.length === 0 && (
                  <div className="text-sm text-gray-600">Tidak ada hasil.</div>
                )}
              </div>
            )}
          </div>
        )}

        {displayMode === 'doa' && (
          <div className="mt-2">
            {doaLoading ? (
              <div className="text-sm text-gray-600">Memuat Doa...</div>
            ) : (
              <div className="space-y-3">
                {filteredDoa.map((d) => {
                  const opened = openDoaId === d.id;
                  return (
                    <div key={d.id} className="card p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-xs text-gray-500">Doa #{d.id}</div>
                          <div className="font-semibold text-[var(--text)]">{d.judul}</div>
                        </div>
                        <button
                          type="button"
                          className="pill px-3 py-1 text-[var(--brown)]"
                          onClick={() => setOpenDoaId(opened ? null : d.id)}
                        >
                          {opened ? 'Tutup' : 'Buka'}
                        </button>
                      </div>
                      {opened && (
                        <>
                          <div className="text-end font-arabic text-[var(--brown)] text-2xl mt-3 leading-relaxed">{d.arab}</div>
                          <div className="text-sm text-gray-600 mt-2 italic">{d.latin}</div>
                          <div className="text-sm text-gray-700 mt-2">{stripHtml(d.terjemah)}</div>
                          <div className="flex flex-wrap gap-2 mt-3">
                            <button type="button" className="pill px-4 py-2 text-[var(--brown)]" onClick={() => copyText(d.arab, 'Arab disalin')}>Salin Arab</button>
                            <button type="button" className="pill px-4 py-2 text-[var(--brown)]" onClick={() => copyText(d.latin, 'Latin disalin')}>Salin Latin</button>
                            <button type="button" className="pill px-4 py-2 text-[var(--brown)]" onClick={() => copyText(stripHtml(d.terjemah), 'Terjemah disalin')}>Salin Terjemah</button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
                {!doaLoading && filteredDoa.length === 0 && (
                  <div className="text-sm text-gray-600">Tidak ada hasil.</div>
                )}
              </div>
            )}
          </div>
        )}
        </div>

        <aside className="order-1 lg:order-2 space-y-4">
          <div className="card p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold">Ringkasan</div>
              <button className="pill px-3 py-1 text-[var(--brown)] text-sm" onClick={() => navigate('/settings')} type="button">Atur</button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="pill px-3 py-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-gray-500">Surah dibaca</div>
                    <div className="font-semibold">{stats.surahReadCount}</div>
                  </div>
                  <div className="w-9 h-9 rounded-2xl bg-white border border-black/5 grid place-items-center">📖</div>
                </div>
              </div>
              <div className="pill px-3 py-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-gray-500">Ayat ditandai</div>
                    <div className="font-semibold">{stats.ayahReadCount}</div>
                  </div>
                  <div className="w-9 h-9 rounded-2xl bg-white border border-black/5 grid place-items-center">✅</div>
                </div>
              </div>
              <div className="pill px-3 py-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-gray-500">Streak</div>
                    <div className="font-semibold">{stats.streak} hari</div>
                  </div>
                  <div className="w-9 h-9 rounded-2xl bg-white border border-black/5 grid place-items-center">🔥</div>
                </div>
              </div>
              <div className="pill px-3 py-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-gray-500">Hari aktif</div>
                    <div className="font-semibold">{stats.daysCount}</div>
                  </div>
                  <div className="w-9 h-9 rounded-2xl bg-white border border-black/5 grid place-items-center">📅</div>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-4" style={{background:'linear-gradient(180deg, var(--brown) 0%, #8a624a 100%)', color:'#fff'}}>
            <div className="text-xs opacity-90 mb-1">Last Read</div>
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <div className="font-semibold truncate">{lastRead?.name || 'Belum ada'}</div>
                <div className="text-sm opacity-90">{lastRead ? `Ayat ${lastRead.verse || 1}` : 'Mulai dari Al-Fatihah'}</div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="pill px-3 py-2 text-sm"
                  disabled={!lastRead}
                  onClick={() => {
                    if (!lastRead?.id) return;
                    navigate(`/surah/${lastRead.id}?ayah=${lastRead.verse || 1}`);
                  }}
                >
                  Lanjutkan
                </button>
                <div className="text-3xl">📖</div>
              </div>
            </div>
          </div>

          <div className="card p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold">Ayat Harian</div>
              <div className="text-xs text-gray-500">{daily?.date || ''}</div>
            </div>
            {dailyLoading ? (
              <div className="text-sm text-gray-600">Memuat...</div>
            ) : daily ? (
              <>
                <div className="text-end font-arabic text-[var(--brown)] text-xl leading-relaxed">{daily.text_uthmani}</div>
                <div className="text-sm text-gray-700 mt-2">{String(daily.translation).replace(/<[^>]*>/g, '')}</div>
                <div className="flex items-center justify-between mt-3">
                  <div className="text-xs text-gray-500">{daily.verse_key}</div>
                  <button
                    type="button"
                    className="pill px-4 py-2 text-[var(--brown)]"
                    onClick={() => {
                      const [sid, ay] = String(daily.verse_key).split(':').map(Number)
                      if (sid && ay) navigate(`/surah/${sid}?ayah=${ay}`)
                    }}
                  >
                    Baca
                  </button>
                </div>
              </>
            ) : (
              <div className="text-sm text-gray-600">Belum tersedia.</div>
            )}
          </div>

          <div className="card p-4">
            <div className="font-semibold mb-2">Bookmark</div>
            {bookmarks.size === 0 ? (
              <div className="text-sm text-gray-500">Belum ada surah yang di-bookmark</div>
            ) : (
              <>
                <div className="text-sm text-gray-700 mb-2">{bookmarks.size} surah tersimpan</div>
                <div className="space-y-2 max-h-64 overflow-auto pr-1">
                  {bookmarkedChapters.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => navigate(`/surah/${c.id}`)}
                      className="w-full text-left pill px-3 py-2 text-[var(--brown)] hover:opacity-90"
                      title={`Buka ${c.name_simple}`}
                    >
                      {c.id}. {c.name_simple}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </aside>
      </div>
      <BottomNav />

      {menuOpen && (
        <div className="fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/35" onClick={() => setMenuOpen(false)}></div>
          <div className="absolute left-0 top-0 h-full w-[86%] max-w-sm drawer-panel shadow-2xl">
            <div className="p-4 border-b border-black/5">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <div className="text-xs text-gray-500">Menu</div>
                  <div className="font-semibold text-[var(--text)] truncate">AI Quran</div>
                </div>
                <button className="pill w-10 h-10 grid place-items-center text-[var(--brown)]" onClick={() => setMenuOpen(false)} type="button">✕</button>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <div className="pill px-3 py-2">
                  <div className="text-xs text-gray-500">Streak</div>
                  <div className="font-semibold">{stats.streak} hari</div>
                </div>
                <div className="pill px-3 py-2">
                  <div className="text-xs text-gray-500">Bookmark</div>
                  <div className="font-semibold">{bookmarks.size}</div>
                </div>
              </div>
            </div>

            <div className="p-4 space-y-3">
              {[
                { to: '/', label: 'Home', desc: 'Halaman pembuka', icon: '🏠' },
                { to: '/surah', label: 'Surah', desc: 'Surah, Juz, Page, Asma, Doa', icon: '📖', match: (p) => p.startsWith('/surah') },
                { to: '/audio', label: 'Audio', desc: 'Shortcut audio & ayat terakhir', icon: '🎧' },
                { to: '/settings', label: 'Tools', desc: 'Pengaturan tampilan', icon: '⚙️' },
              ].map((it) => {
                const active = it.match ? it.match(pathname) : pathname === it.to
                return (
                  <button
                    key={it.to}
                    className={`menu-item w-full p-4 flex items-center justify-between text-left ${active ? 'menu-item-active' : ''}`}
                    type="button"
                    onClick={() => { setMenuOpen(false); navigate(it.to); }}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-2xl pill grid place-items-center text-xl">{it.icon}</div>
                      <div className="min-w-0">
                        <div className="font-semibold text-[var(--text)] truncate">{it.label}</div>
                        <div className="text-xs text-gray-500 truncate">{it.desc}</div>
                      </div>
                    </div>
                    <div className="text-[var(--brown)] text-lg">›</div>
                  </button>
                )
              })}

              {lastRead?.id && (
                <button
                  className="btn-brown w-full px-4 py-3 rounded-2xl flex items-center justify-between"
                  type="button"
                  onClick={() => { setMenuOpen(false); navigate(`/surah/${lastRead.id}?ayah=${lastRead.verse || 1}`); }}
                >
                  <div className="text-left">
                    <div className="text-xs opacity-90">Lanjutkan membaca</div>
                    <div className="font-semibold truncate">{lastRead.name} • Ayat {lastRead.verse || 1}</div>
                  </div>
                  <div className="text-xl">▶</div>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {toolsOpen && (
        <div className="fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/35" onClick={() => setToolsOpen(false)}></div>
          <div className="absolute right-0 top-0 h-full w-[86%] max-w-sm drawer-panel shadow-2xl">
            <div className="p-4 border-b border-black/5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-gray-500">Quick Tools</div>
                  <div className="font-semibold">Filter & Tampilan</div>
                </div>
                <button className="pill w-10 h-10 grid place-items-center text-[var(--brown)]" onClick={() => setToolsOpen(false)} type="button">✕</button>
              </div>
            </div>
            <div className="p-4 space-y-3 text-sm">
              <div className="menu-item p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">Hanya Bookmark</div>
                    <div className="text-xs text-gray-500">Tampilkan surah yang tersimpan saja</div>
                  </div>
                  <input type="checkbox" checked={onlyBookmarked} onChange={(e) => setOnlyBookmarked(e.target.checked)} />
                </div>
              </div>
              <div className="menu-item p-4">
                <div className="font-semibold mb-1">Tips</div>
                <div className="text-xs text-gray-500">Tab Asma dan Doa bisa dicari lewat kolom pencarian.</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
