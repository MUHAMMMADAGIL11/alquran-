export default function SearchBox({ query, setQuery, inputRef, placeholder = "Cari surah..." }) {
  return (
    <div className="relative mb-3">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--brown)] text-lg">🔎</div>
      <input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full pl-11 pr-4 py-3 pill focus:outline-none focus:ring-2 focus:ring-[var(--brown)]"
      />
    </div>
  );
}
  
