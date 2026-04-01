function todayKey(){
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function getProgress(){
  try {
    const raw = localStorage.getItem('readingProgress')
    return raw ? JSON.parse(raw) : { bySurah: {}, days: [] }
  } catch (e) {
    void e
    return { bySurah: {}, days: [] }
  }
}

export function saveProgress(next){
  try {
    localStorage.setItem('readingProgress', JSON.stringify(next))
  } catch (e) {
    void e
  }
}

export function markRead(surahId, ayahNumber){
  const p = getProgress()
  const bySurah = { ...(p.bySurah || {}) }
  const prev = Number(bySurah[String(surahId)] || 0)
  bySurah[String(surahId)] = Math.max(prev, Number(ayahNumber) || 0)

  const day = todayKey()
  const set = new Set(Array.isArray(p.days) ? p.days : [])
  set.add(day)

  const next = { bySurah, days: [...set].sort() }
  saveProgress(next)
  return next
}

export function getStats(){
  const p = getProgress()
  const bySurah = p.bySurah || {}
  const entries = Object.entries(bySurah).filter(([, v]) => Number(v) > 0)
  const surahReadCount = entries.length
  const ayahReadCount = entries.reduce((sum, [, v]) => sum + (Number(v) || 0), 0)

  const days = Array.isArray(p.days) ? p.days.slice().sort() : []
  const set = new Set(days)
  const streak = (() => {
    let count = 0
    const d = new Date()
    for (;;) {
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      const key = `${y}-${m}-${day}`
      if (!set.has(key)) break
      count += 1
      d.setDate(d.getDate() - 1)
    }
    return count
  })()

  return { surahReadCount, ayahReadCount, streak, daysCount: set.size }
}

