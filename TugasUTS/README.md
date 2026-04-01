# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

## Quran Foundation (opsional)

Fitur Hizb/Ruku bisa memakai Quran Foundation Content API jika kamu punya kredensial:

- Copy `.env.example` menjadi `.env`
- Isi `VITE_QF_CLIENT_ID` dan `VITE_QF_AUTH_TOKEN`
- Jalankan ulang dev server

Kalau tidak diisi, aplikasi otomatis memakai endpoint publik dari `api.quran.com`.

## Troubleshooting Deploy (Netlify)

Jika build Netlify gagal di tahap “Preparing repo” dengan error seperti:

`fatal: No url found for submodule path 'TugasUTS' in .gitmodules`

Artinya repository yang kamu deploy masih mengandung konfigurasi Git submodule yang tidak lengkap.

Solusi yang umum:

- Jika kamu tidak butuh submodule: hapus submodule dari repository root (hapus entri `TugasUTS` di `.gitmodules`, remove gitlink/submodule, lalu commit).
- Jika kamu memang butuh submodule: pastikan `.gitmodules` punya `url = ...` untuk submodule `TugasUTS`, dan URL tersebut bisa diakses Netlify (public atau sudah diset deploy key/token).
- Jika project ini berada di folder `TugasUTS` di dalam repo parent: pastikan Netlify “Base directory” menunjuk ke `TugasUTS`, dan repo parent tidak memakai submodule yang rusak.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript and enable type-aware lint rules. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
