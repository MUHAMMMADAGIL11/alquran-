import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useCallback, useEffect, useRef, useState } from 'react';
import Header from './components/Header';
import { markRead } from './lib/readingProgress';

export default function DetailSurah() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const [surah, setSurah] = useState(null);
  const [verses, setVerses] = useState([]);
  const [audioUrl, setAudioUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [toolsOpen, setToolsOpen] = useState(false);
  const readPrefs = () => {
    try {
      const raw = localStorage.getItem('prefs');
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      void e;
      return {};
    }
  };
  const initialPrefs = readPrefs();
  const [showArabic, setShowArabic] = useState(() => initialPrefs.showArabic ?? true);
  const [showTranslation, setShowTranslation] = useState(() => initialPrefs.showTranslation ?? true);
  const [arabicFontSize, setArabicFontSize] = useState(() => Number.isFinite(Number(initialPrefs.arabicFontSize)) ? Number(initialPrefs.arabicFontSize) : 24);
  const [translationFontSize, setTranslationFontSize] = useState(() => Number.isFinite(Number(initialPrefs.translationFontSize)) ? Number(initialPrefs.translationFontSize) : 16);
  const [toast, setToast] = useState('');
  const [lastAyah, setLastAyah] = useState(null);
  const audioRef = useRef(null);

  useEffect(() => {
    const fetchSurahDetails = async () => {
      try {
        const [surahRes, versesRes, transRes, translitRes, audioRes] = await Promise.all([
          fetch(`https://api.quran.com/api/v4/chapters/${id}`).then(res => res.json()),
          fetch(`https://api.quran.com/api/v4/quran/verses/uthmani?chapter_number=${id}`).then(res => res.json()),
          fetch(`https://api.quran.com/api/v4/quran/translations/33?chapter_number=${id}`).then(res => res.json()),
          fetch(`https://api.quran.com/api/v4/quran/translations/40?chapter_number=${id}`).then(res => res.json()),
          fetch(`https://api.quran.com/api/v4/chapter_recitations/1/${id}`).then(res => res.json()),
        ]);

        const formattedVerses = versesRes.verses.map((v, i) => ({
          arabic: v.text_uthmani,
          number: parseInt(v.verse_key.split(':')[1]),
          translation: transRes.translations[i]?.text?.replace(/<sup.*?<\/sup>/g, '') || '',
          transliteration: translitRes.translations[i]?.text || '',
        }));

        setSurah(surahRes.chapter);
        setVerses(formattedVerses);
        setAudioUrl(audioRes.audio_file.audio_url);
        try {
          localStorage.setItem('lastRead', JSON.stringify({ id: surahRes.chapter.id, name: surahRes.chapter.name_simple, verse: formattedVerses[0]?.number || 1 }));
        } catch (e) {
          void e;
        }
        try {
          const raw = localStorage.getItem('lastRead');
          if (raw) {
            const obj = JSON.parse(raw);
            if (obj?.id === surahRes.chapter.id) setLastAyah(obj.verse || null);
          }
        } catch (e) { void e; }
      } catch (err) {
        console.error("Gagal fetch detail surah:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSurahDetails();
  }, [id]);

  useEffect(() => {
    try {
      localStorage.setItem('prefs', JSON.stringify({
        showArabic,
        showTranslation,
        arabicFontSize,
        translationFontSize,
      }));
    } catch (e) {
      void e;
    }
  }, [arabicFontSize, showArabic, showTranslation, translationFontSize]);

  const toggleSurahBookmark = () => {
    if (!surah?.id) return;
    try {
      const raw = localStorage.getItem('bookmarks');
      const set = new Set(raw ? JSON.parse(raw) : []);
      if (set.has(surah.id)) set.delete(surah.id);
      else set.add(surah.id);
      localStorage.setItem('bookmarks', JSON.stringify([...set]));
      setToast(set.has(surah.id) ? 'Disimpan ke bookmark' : 'Dihapus dari bookmark');
      setTimeout(() => setToast(''), 1500);
    } catch (e) {
      void e;
      setToast('Gagal menyimpan bookmark');
      setTimeout(() => setToast(''), 1500);
    }
  };

  const shareSurah = async () => {
    try {
      const url = window.location.href;
      if (navigator.share) {
        await navigator.share({ title: surah?.name_simple || 'Surah', url });
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        setToast('Link disalin');
        setTimeout(() => setToast(''), 1500);
      } else {
        setToast(url);
        setTimeout(() => setToast(''), 2000);
      }
    } catch (e) {
      void e;
      setToast('Gagal membagikan');
      setTimeout(() => setToast(''), 1500);
    }
  };

  const markLastRead = (verseNumber) => {
    try {
      const payload = { id: surah.id, name: surah.name_simple, verse: verseNumber };
      localStorage.setItem('lastRead', JSON.stringify(payload));
      setLastAyah(verseNumber);
      markRead(surah.id, verseNumber);
      setToast(`Ditandai sampai ayat ${verseNumber}`);
      setTimeout(() => setToast(''), 1200);
    } catch (e) {
      void e;
      setToast('Gagal menyimpan penanda');
      setTimeout(() => setToast(''), 1200);
    }
  };

  const playAyah = useCallback(async (verseNumber) => {
    if (!surah?.id) return;
    const verseKey = `${surah.id}:${verseNumber}`;
    try {
      const res = await fetch(`https://api.quran.com/api/v4/recitations/1/by_ayah/${verseKey}?format=audio`).then(r => r.json());
      const url = res?.audio_file?.audio_url || res?.audio_files?.[0]?.url;
      if (url && audioRef.current) {
        audioRef.current.src = url;
        try {
          localStorage.setItem('lastAudio', JSON.stringify({ id: surah.id, name: surah.name_simple, verse: verseNumber }));
        } catch (e) { void e; }
        await audioRef.current.play();
      } else {
        setToast('Audio ayat tidak tersedia');
        setTimeout(() => setToast(''), 1200);
      }
    } catch (e) {
      void e;
      setToast('Gagal memutar audio ayat');
      setTimeout(() => setToast(''), 1200);
    }
  }, [surah?.id, surah?.name_simple]);

  useEffect(() => {
    if (loading) return;
    const ayahParam = Number(searchParams.get('ayah'));
    const target = Number.isFinite(ayahParam) && ayahParam > 0 ? ayahParam : lastAyah;
    if (!target) return;
    const el = document.getElementById(`ayah-${target}`);
    if (el) {
      setTimeout(() => {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 200);
    }
    if (searchParams.get('autoplay') === '1') {
      setTimeout(() => {
        try { playAyah(target) } catch (e) { void e }
      }, 400);
    }
  }, [loading, lastAyah, playAyah, searchParams]);

  return (
    <div className="min-h-screen">
      <Header title={surah?.name_simple || 'Surah'} onMenu={() => navigate(-1)} onTools={() => setToolsOpen(true)} />
      <div className="w-full px-4 py-4 pb-20 relative">
        {loading ? <p>Memuat detail surah...</p> : (
          <>
            <div className="card p-5 mb-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="text-xs text-gray-500">{surah?.revelation_place} • {surah?.verses_count} ayat</div>
                  <div className="text-lg font-semibold">{surah?.name_simple} — {surah?.translated_name?.name}</div>
                </div>
                <div className="flex gap-2 text-[var(--brown)]">
                  <button aria-label="bookmark" title="Bookmark" onClick={toggleSurahBookmark}>🔖</button>
                  <button aria-label="share" title="Share" onClick={shareSurah}>📤</button>
                </div>
              </div>
              <div className="text-center my-2">
                <div className="text-3xl font-arabic text-[var(--brown)]">بِسْمِ ٱللَّٰهِ</div>
              </div>
              {audioUrl && (
                <audio controls className="w-full mt-2">
                  <source src={audioUrl} type="audio/mp3" />
                </audio>
              )}
            </div>

            <div className="space-y-4">
              {verses.map((verse) => (
                <div id={`ayah-${verse.number}`} key={verse.number} className={`card p-4 ${lastAyah===verse.number ? 'ring-2 ring-[var(--brown)]' : ''}`}>
                  <div className="flex items-start justify-between gap-2">
                    <span className="pill px-3 py-1 text-xs text-[var(--brown)]">Ayat {verse.number}</span>
                    <div className="flex items-center gap-2">
                      <button className="pill px-3 py-1 text-[var(--brown)] text-sm" onClick={()=>playAyah(verse.number)} title="Putar ayat">▶</button>
                      <button className="pill px-3 py-1 text-[var(--brown)] text-sm" onClick={()=>markLastRead(verse.number)} title="Tandai terakhir dibaca">Tandai</button>
                    </div>
                  </div>
                  {showArabic && (
                    <div className="text-end font-arabic text-[var(--brown)] mt-2" style={{ fontSize: arabicFontSize }}>
                      {verse.arabic}
                    </div>
                  )}
                  <div className="text-sm text-gray-500 italic">{verse.transliteration}</div>
                  {showTranslation && (
                    <p className="mt-2" style={{ fontSize: translationFontSize }}>{verse.translation}</p>
                  )}
                </div>
              ))}
            </div>
            <audio ref={audioRef} hidden />
          </>
        )}
        {toast && (
          <div className="fixed left-1/2 -translate-x-1/2 bottom-24 z-50 card px-4 py-2 text-sm">
            {toast}
          </div>
        )}
        {/* Quick Tools Panel */}
        {toolsOpen && (
          <div className="fixed inset-0 z-40">
            <div className="absolute inset-0 bg-black/30" onClick={()=>setToolsOpen(false)}></div>
            <div className="absolute right-0 top-0 h-full w-[85%] max-w-sm bg-white shadow-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="font-semibold">Quick Tools</div>
                <button onClick={()=>setToolsOpen(false)} className="pill px-3 py-1">Tutup</button>
              </div>
              <div className="space-y-4 text-sm">
                <div>
                  <div className="text-xs text-gray-500 mb-1">Content</div>
                  <div className="flex justify-between py-2 border-b">
                    <span>Arabic</span><input type="checkbox" checked={showArabic} onChange={(e)=>setShowArabic(e.target.checked)} />
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span>Translation</span><input type="checkbox" checked={showTranslation} onChange={(e)=>setShowTranslation(e.target.checked)} />
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span>Tafsir</span><input type="checkbox" />
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Font Settings</div>
                  <div className="flex items-center justify-between py-2">
                    <span>Arabic Font Size</span>
                    <input type="range" min="16" max="36" value={arabicFontSize} onChange={(e)=>setArabicFontSize(parseInt(e.target.value))} />
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span>Translation Size</span>
                    <input type="range" min="12" max="24" value={translationFontSize} onChange={(e)=>setTranslationFontSize(parseInt(e.target.value))} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
