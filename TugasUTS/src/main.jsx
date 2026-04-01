import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import './index.css';

import Home from './Home';
import Surah from './Surah';
import DetailSurah from './DetailSurah'; 
import Header from './components/Header';
import BottomNav from './components/BottomNav';

export function AudioPage(){
  const navigate = useNavigate();
  const [lastRead, setLastRead] = useState(null);
  const [bookmarksCount, setBookmarksCount] = useState(0);

  useEffect(() => {
    try {
      const lr = localStorage.getItem('lastRead');
      if (lr) setLastRead(JSON.parse(lr));
    } catch (e) { void e; }
    try {
      const raw = localStorage.getItem('bookmarks');
      const list = raw ? JSON.parse(raw) : [];
      setBookmarksCount(Array.isArray(list) ? list.length : 0);
    } catch (e) { void e; }
  }, []);

  return (
    <div className="min-h-screen pb-24">
      <Header title="Audio" onMenu={() => navigate(-1)} />
      <div className="w-full px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="card p-4 lg:col-span-2">
            <div className="font-semibold mb-1">Audio Per Ayat</div>
            <div className="text-sm text-gray-600 mb-4">Masuk ke Detail Surah untuk memutar audio per ayat (tombol ▶).</div>
            <div className="flex flex-wrap gap-3">
              <button
                className={`pill px-4 py-2 text-[var(--brown)] ${lastRead ? '' : 'opacity-50'}`}
                disabled={!lastRead}
                onClick={() => lastRead && navigate(`/surah/${lastRead.id}?ayah=${lastRead.verse || 1}`)}
                type="button"
              >
                Lanjutkan Ayat Terakhir
              </button>
              <button
                className="btn-brown px-4 py-2 rounded-2xl"
                onClick={() => navigate('/surah')}
                type="button"
              >
                Buka Daftar Surah
              </button>
            </div>
          </div>

          <div className="card p-4">
            <div className="font-semibold mb-2">Ringkasan</div>
            <div className="text-sm text-gray-700">Bookmark: {bookmarksCount} surah</div>
            <div className="text-sm text-gray-700">Terakhir baca: {lastRead ? `${lastRead.name} (Ayat ${lastRead.verse || 1})` : 'Belum ada'}</div>
          </div>

          <div className="card p-4 lg:col-span-3">
            <div className="font-semibold mb-1">Tips</div>
            <div className="text-sm text-gray-600">Gunakan tab Juz/Page/Hizb/Ruku untuk mencari surah berdasarkan segmen.</div>
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  )
}

export function SettingsPage(){
  const navigate = useNavigate();
  const [prefs, setPrefs] = useState({
    showArabic: true,
    showTranslation: true,
    arabicFontSize: 24,
    translationFontSize: 16,
  });

  useEffect(() => {
    try {
      const raw = localStorage.getItem('prefs');
      if (!raw) return;
      const p = JSON.parse(raw);
      setPrefs((prev) => ({
        ...prev,
        ...p,
        arabicFontSize: Number.isFinite(Number(p?.arabicFontSize)) ? Number(p.arabicFontSize) : prev.arabicFontSize,
        translationFontSize: Number.isFinite(Number(p?.translationFontSize)) ? Number(p.translationFontSize) : prev.translationFontSize,
      }));
    } catch (e) { void e; }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('prefs', JSON.stringify(prefs));
    } catch (e) { void e; }
  }, [prefs]);

  return (
    <div className="min-h-screen pb-24">
      <Header title="Settings" onMenu={() => navigate(-1)} />
      <div className="w-full px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="card p-4 lg:col-span-2">
            <div className="font-semibold mb-3">Tampilan Default Detail Surah</div>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between py-2 border-b">
                <span>Tampilkan Arabic</span>
                <input type="checkbox" checked={prefs.showArabic} onChange={(e) => setPrefs(p => ({ ...p, showArabic: e.target.checked }))} />
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <span>Tampilkan Translation</span>
                <input type="checkbox" checked={prefs.showTranslation} onChange={(e) => setPrefs(p => ({ ...p, showTranslation: e.target.checked }))} />
              </div>
              <div className="py-2 border-b">
                <div className="flex items-center justify-between">
                  <span>Arabic Font Size</span>
                  <span className="text-gray-600">{prefs.arabicFontSize}</span>
                </div>
                <input type="range" min="16" max="36" value={prefs.arabicFontSize} onChange={(e) => setPrefs(p => ({ ...p, arabicFontSize: parseInt(e.target.value) }))} className="w-full" />
              </div>
              <div className="py-2">
                <div className="flex items-center justify-between">
                  <span>Translation Size</span>
                  <span className="text-gray-600">{prefs.translationFontSize}</span>
                </div>
                <input type="range" min="12" max="24" value={prefs.translationFontSize} onChange={(e) => setPrefs(p => ({ ...p, translationFontSize: parseInt(e.target.value) }))} className="w-full" />
              </div>
            </div>
          </div>

          <div className="card p-4">
            <div className="font-semibold mb-2">Aksi Cepat</div>
            <button
              type="button"
              className="pill px-4 py-2 w-full text-[var(--brown)]"
              onClick={() => setPrefs({ showArabic: true, showTranslation: true, arabicFontSize: 24, translationFontSize: 16 })}
            >
              Reset Default
            </button>
          </div>

          <div className="card p-4 lg:col-span-3">
            <div className="font-semibold mb-1">Catatan</div>
            <div className="text-sm text-gray-600">Pengaturan ini otomatis diterapkan di halaman Detail Surah.</div>
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/surah" element={<Surah />} /> 
        <Route path="/surah/:id" element={<DetailSurah />} />
        <Route path="/audio" element={<AudioPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
