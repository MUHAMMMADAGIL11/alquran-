import { Link, useLocation } from 'react-router-dom'

const items = [
  { to: '/', label: 'Home', icon: '🏠' },
  { to: '/surah', label: 'Surah', icon: '📖' },
  { to: '/audio', label: 'Audio', icon: '🎧' },
  { to: '/settings', label: 'Tools', icon: '⚙️' },
]

export default function BottomNav(){
  const { pathname } = useLocation()
  return (
    <nav className="fixed bottom-4 left-0 right-0 z-30 px-4">
      <div className="w-full bg-white/92 backdrop-blur border border-black/10 shadow-2xl rounded-2xl px-4 py-2 flex justify-between">
        {items.map(it => (
          it.disabled ? (
            <div key={it.label} className="flex flex-col items-center text-gray-400">
              <span className="text-xl">{it.icon}</span>
              <span className="text-[11px]">{it.label}</span>
            </div>
          ) : (
            <Link key={it.label} to={it.to} className={`flex flex-col items-center px-2 py-1 rounded-xl ${pathname===it.to?'text-[var(--brown)] bg-[var(--beige-2)]':'text-gray-600'}`}>
              <span className="text-xl">{it.icon}</span>
              <span className="text-[11px]">{it.label}</span>
            </Link>
          )
        ))}
      </div>
    </nav>
  )
}
