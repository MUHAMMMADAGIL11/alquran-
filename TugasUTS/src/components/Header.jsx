import { Link } from 'react-router-dom'

export default function Header({ title = 'Al Quran', rightSlot, onMenu, onSearch, onTools, maxWidthClass = 'max-w-none w-full' }) {
  return (
    <div className="sticky top-0 z-30 px-4 pt-6 bg-[var(--beige)]/80 backdrop-blur border-b border-black/5">
      <div className={`mx-auto ${maxWidthClass} flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <button onClick={onMenu} aria-label="menu" className="w-11 h-11 rounded-full pill flex items-center justify-center">
            <span className="block w-5 h-[2px] bg-[var(--brown)] relative">
              <span className="absolute -top-2 left-0 w-5 h-[2px] bg-[var(--brown)]"></span>
              <span className="absolute top-2 left-0 w-3 h-[2px] bg-[var(--brown)]"></span>
            </span>
          </button>
          <Link to="/" className="text-xl font-semibold text-[var(--brown)]">{title}</Link>
        </div>
        <div className="flex items-center gap-2">
          {onSearch && (
            <button onClick={onSearch} aria-label="search" className="w-11 h-11 rounded-full pill grid place-items-center text-[var(--brown)] text-lg">🔎</button>
          )}
          {onTools && (
            <button onClick={onTools} aria-label="tools" className="w-11 h-11 rounded-full pill grid place-items-center text-[var(--brown)] text-xl">⚙️</button>
          )}
          {rightSlot}
        </div>
      </div>
    </div>
  )
}
