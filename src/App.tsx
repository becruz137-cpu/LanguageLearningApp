import { useState, useEffect, useCallback, useRef } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

type Lang = 'en' | 'ru' | 'uz'
type Screen = 'home' | 'levels' | 'game' | 'result'

interface LangMeta { code: Lang; label: string; flag: string; color: string }
interface Card { src: string; tgt: string; note?: string }
interface LevelConfig { label: string; roundSize: number; timerSec: number; emoji: string; desc: string }

// ─── Language meta ────────────────────────────────────────────────────────────

const LANGUAGES: LangMeta[] = [
  { code: 'en', label: 'English', flag: '🇬🇧', color: '#4361ee' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺', color: '#e63946' },
  { code: 'uz', label: "O'zbek", flag: '🇺🇿', color: '#2dc653' },
]

// ─── Level configs ────────────────────────────────────────────────────────────

const LEVELS: LevelConfig[] = [
  { label: 'Новичок',   emoji: '🌱', roundSize: 6,  timerSec: 14, desc: '6 слов · 14 сек · 4 варианта' },
  { label: 'Базовый',   emoji: '🔥', roundSize: 8,  timerSec: 12, desc: '8 слов · 12 сек · 4 варианта' },
  { label: 'Средний',   emoji: '⚡', roundSize: 8,  timerSec: 9,  desc: '8 слов · 9 сек · 4 варианта' },
  { label: 'Сложный',   emoji: '💎', roundSize: 10, timerSec: 7,  desc: '10 слов · 7 сек · 4 варианта' },
  { label: 'Эксперт',   emoji: '🏆', roundSize: 10, timerSec: 5,  desc: '10 слов · 5 сек · 4 варианта' },
]

// ─── Word data (5 tiers × 3 langs) ───────────────────────────────────────────

const WORDS: Record<Lang, Card[][]> = {
  en: [
    // Level 1 – super basic
    [
      { src: 'Cat',    tgt: 'Кошка',   note: '🐱' },
      { src: 'Dog',    tgt: 'Собака',  note: '🐶' },
      { src: 'Apple',  tgt: 'Яблоко',  note: '🍎' },
      { src: 'Water',  tgt: 'Вода',    note: '💧' },
      { src: 'House',  tgt: 'Дом',     note: '🏠' },
      { src: 'Sun',    tgt: 'Солнце',  note: '☀️' },
      { src: 'Moon',   tgt: 'Луна',    note: '🌙' },
      { src: 'Book',   tgt: 'Книга',   note: '📖' },
      { src: 'Tree',   tgt: 'Дерево',  note: '🌳' },
      { src: 'Fire',   tgt: 'Огонь',   note: '🔥' },
    ],
    // Level 2 – everyday
    [
      { src: 'Road',   tgt: 'Дорога',  note: '🛣' },
      { src: 'Sky',    tgt: 'Небо',    note: '🌤' },
      { src: 'Rain',   tgt: 'Дождь',   note: '🌧' },
      { src: 'Bread',  tgt: 'Хлеб',    note: '🍞' },
      { src: 'Hand',   tgt: 'Рука',    note: '✋' },
      { src: 'Heart',  tgt: 'Сердце',  note: '💙' },
      { src: 'Night',  tgt: 'Ночь',    note: '🌃' },
      { src: 'Star',   tgt: 'Звезда',  note: '⭐' },
      { src: 'Wind',   tgt: 'Ветер',   note: '🌬' },
      { src: 'Stone',  tgt: 'Камень',  note: '🪨' },
    ],
    // Level 3 – intermediate
    [
      { src: 'Bridge',   tgt: 'Мост',      note: '🌉' },
      { src: 'Shadow',   tgt: 'Тень',      note: '🌑' },
      { src: 'Silence',  tgt: 'Тишина',    note: '🔇' },
      { src: 'Dream',    tgt: 'Мечта',     note: '💭' },
      { src: 'Mirror',   tgt: 'Зеркало',   note: '🪞' },
      { src: 'Feather',  tgt: 'Перо',      note: '🪶' },
      { src: 'Thunder',  tgt: 'Гром',      note: '⛈' },
      { src: 'Honey',    tgt: 'Мёд',       note: '🍯' },
      { src: 'Smoke',    tgt: 'Дым',       note: '💨' },
      { src: 'Shore',    tgt: 'Берег',     note: '🏖' },
    ],
    // Level 4 – advanced
    [
      { src: 'Dusk',       tgt: 'Сумерки',    note: '🌆' },
      { src: 'Grief',      tgt: 'Горе',       note: '😔' },
      { src: 'Burden',     tgt: 'Бремя',      note: '⚖️' },
      { src: 'Wanderer',   tgt: 'Странник',   note: '🚶' },
      { src: 'Threshold',  tgt: 'Порог',      note: '🚪' },
      { src: 'Blizzard',   tgt: 'Метель',     note: '❄️' },
      { src: 'Abyss',      tgt: 'Бездна',     note: '🕳' },
      { src: 'Cradle',     tgt: 'Колыбель',   note: '🛏' },
      { src: 'Remnant',    tgt: 'Остаток',    note: '🧩' },
      { src: 'Twilight',   tgt: 'Закат',      note: '🌇' },
    ],
    // Level 5 – expert phrases
    [
      { src: 'Where is the hotel?',       tgt: 'Где гостиница?',           note: '🏨' },
      { src: 'How much does it cost?',    tgt: 'Сколько стоит?',           note: '💰' },
      { src: 'I need a doctor',           tgt: 'Мне нужен врач',           note: '🏥' },
      { src: 'Call the police!',          tgt: 'Вызовите полицию!',        note: '🚔' },
      { src: 'What time is it?',          tgt: 'Который час?',             note: '🕐' },
      { src: 'I do not understand',       tgt: 'Я не понимаю',             note: '🤔' },
      { src: 'The bill please',           tgt: 'Счёт, пожалуйста',         note: '🧾' },
      { src: 'Where is the toilet?',      tgt: 'Где туалет?',              note: '🚻' },
      { src: 'I am lost',                 tgt: 'Я заблудился',             note: '🗺' },
      { src: 'Good morning',              tgt: 'Доброе утро',              note: '🌅' },
    ],
  ],

  ru: [
    [
      { src: 'Кошка',  tgt: 'Cat',    note: '🐱' },
      { src: 'Собака', tgt: 'Dog',    note: '🐶' },
      { src: 'Яблоко', tgt: 'Apple',  note: '🍎' },
      { src: 'Вода',   tgt: 'Water',  note: '💧' },
      { src: 'Дом',    tgt: 'House',  note: '🏠' },
      { src: 'Солнце', tgt: 'Sun',    note: '☀️' },
      { src: 'Луна',   tgt: 'Moon',   note: '🌙' },
      { src: 'Книга',  tgt: 'Book',   note: '📖' },
      { src: 'Дерево', tgt: 'Tree',   note: '🌳' },
      { src: 'Огонь',  tgt: 'Fire',   note: '🔥' },
    ],
    [
      { src: 'Дорога',  tgt: 'Road',    note: '🛣' },
      { src: 'Небо',    tgt: 'Sky',     note: '🌤' },
      { src: 'Дождь',   tgt: 'Rain',    note: '🌧' },
      { src: 'Хлеб',    tgt: 'Bread',   note: '🍞' },
      { src: 'Рука',    tgt: 'Hand',    note: '✋' },
      { src: 'Сердце',  tgt: 'Heart',   note: '💙' },
      { src: 'Ночь',    tgt: 'Night',   note: '🌃' },
      { src: 'Звезда',  tgt: 'Star',    note: '⭐' },
      { src: 'Ветер',   tgt: 'Wind',    note: '🌬' },
      { src: 'Камень',  tgt: 'Stone',   note: '🪨' },
    ],
    [
      { src: 'Мост',     tgt: 'Bridge',   note: '🌉' },
      { src: 'Тень',     tgt: 'Shadow',   note: '🌑' },
      { src: 'Тишина',   tgt: 'Silence',  note: '🔇' },
      { src: 'Мечта',    tgt: 'Dream',    note: '💭' },
      { src: 'Зеркало',  tgt: 'Mirror',   note: '🪞' },
      { src: 'Перо',     tgt: 'Feather',  note: '🪶' },
      { src: 'Гром',     tgt: 'Thunder',  note: '⛈' },
      { src: 'Мёд',      tgt: 'Honey',    note: '🍯' },
      { src: 'Дым',      tgt: 'Smoke',    note: '💨' },
      { src: 'Берег',    tgt: 'Shore',    note: '🏖' },
    ],
    [
      { src: 'Сумерки',   tgt: 'Dusk',       note: '🌆' },
      { src: 'Горе',      tgt: 'Grief',      note: '😔' },
      { src: 'Бремя',     tgt: 'Burden',     note: '⚖️' },
      { src: 'Странник',  tgt: 'Wanderer',   note: '🚶' },
      { src: 'Порог',     tgt: 'Threshold',  note: '🚪' },
      { src: 'Метель',    tgt: 'Blizzard',   note: '❄️' },
      { src: 'Бездна',    tgt: 'Abyss',      note: '🕳' },
      { src: 'Колыбель',  tgt: 'Cradle',     note: '🛏' },
      { src: 'Остаток',   tgt: 'Remnant',    note: '🧩' },
      { src: 'Закат',     tgt: 'Twilight',   note: '🌇' },
    ],
    [
      { src: 'Где гостиница?',      tgt: 'Where is the hotel?',     note: '🏨' },
      { src: 'Сколько стоит?',      tgt: 'How much?',               note: '💰' },
      { src: 'Мне нужен врач',      tgt: 'I need a doctor',         note: '🏥' },
      { src: 'Вызовите полицию!',   tgt: 'Call the police!',        note: '🚔' },
      { src: 'Который час?',        tgt: 'What time is it?',        note: '🕐' },
      { src: 'Я не понимаю',        tgt: 'I do not understand',     note: '🤔' },
      { src: 'Счёт, пожалуйста',    tgt: 'The bill please',         note: '🧾' },
      { src: 'Где туалет?',         tgt: 'Where is the toilet?',    note: '🚻' },
      { src: 'Я заблудился',        tgt: 'I am lost',               note: '🗺' },
      { src: 'Доброе утро',         tgt: 'Good morning',            note: '🌅' },
    ],
  ],

  uz: [
    [
      { src: 'Mushuk',  tgt: 'Кошка',  note: '🐱' },
      { src: 'It',      tgt: 'Собака', note: '🐶' },
      { src: 'Olma',    tgt: 'Яблоко', note: '🍎' },
      { src: 'Suv',     tgt: 'Вода',   note: '💧' },
      { src: 'Uy',      tgt: 'Дом',    note: '🏠' },
      { src: 'Quyosh',  tgt: 'Солнце', note: '☀️' },
      { src: 'Oy',      tgt: 'Луна',   note: '🌙' },
      { src: 'Kitob',   tgt: 'Книга',  note: '📖' },
      { src: 'Daraxt',  tgt: 'Дерево', note: '🌳' },
      { src: 'Olov',    tgt: 'Огонь',  note: '🔥' },
    ],
    [
      { src: "Yo'l",    tgt: 'Дорога', note: '🛣' },
      { src: 'Osmon',   tgt: 'Небо',   note: '🌤' },
      { src: "Yomg'ir", tgt: 'Дождь',  note: '🌧' },
      { src: 'Non',     tgt: 'Хлеб',   note: '🍞' },
      { src: "Qo'l",   tgt: 'Рука',   note: '✋' },
      { src: 'Yurak',   tgt: 'Сердце', note: '💙' },
      { src: 'Kecha',   tgt: 'Ночь',   note: '🌃' },
      { src: 'Yulduz',  tgt: 'Звезда', note: '⭐' },
      { src: 'Shamol',  tgt: 'Ветер',  note: '🌬' },
      { src: 'Tosh',    tgt: 'Камень', note: '🪨' },
    ],
    [
      { src: "Ko'prik",  tgt: 'Мост',     note: '🌉' },
      { src: 'Soya',     tgt: 'Тень',     note: '🌑' },
      { src: 'Sukunat',  tgt: 'Тишина',   note: '🔇' },
      { src: 'Orzu',     tgt: 'Мечта',    note: '💭' },
      { src: 'Ko\'zgu',  tgt: 'Зеркало',  note: '🪞' },
      { src: 'Pat',      tgt: 'Перо',     note: '🪶' },
      { src: 'Momaqaldiroq', tgt: 'Гром', note: '⛈' },
      { src: 'Asal',     tgt: 'Мёд',      note: '🍯' },
      { src: 'Tutun',    tgt: 'Дым',      note: '💨' },
      { src: 'Qirg\'oq', tgt: 'Берег',   note: '🏖' },
    ],
    [
      { src: 'Alachakarlik', tgt: 'Сумерки',  note: '🌆' },
      { src: 'Qayg\'u',     tgt: 'Горе',      note: '😔' },
      { src: 'Yuk',          tgt: 'Бремя',     note: '⚖️' },
      { src: 'Sayyoh',       tgt: 'Странник',  note: '🚶' },
      { src: 'Ostonа',       tgt: 'Порог',     note: '🚪' },
      { src: 'Bo\'ron',      tgt: 'Метель',    note: '❄️' },
      { src: 'Tubsizlik',    tgt: 'Бездна',    note: '🕳' },
      { src: 'Beshik',       tgt: 'Колыбель',  note: '🛏' },
      { src: 'Qoldiq',       tgt: 'Остаток',   note: '🧩' },
      { src: 'Shom',         tgt: 'Закат',     note: '🌇' },
    ],
    [
      { src: 'Mehmonxona qayerda?',   tgt: 'Где гостиница?',      note: '🏨' },
      { src: 'Narxi qancha?',         tgt: 'Сколько стоит?',      note: '💰' },
      { src: 'Menga shifokor kerak',  tgt: 'Мне нужен врач',      note: '🏥' },
      { src: 'Politsiya chaqiring!',  tgt: 'Вызовите полицию!',   note: '🚔' },
      { src: 'Soat necha?',           tgt: 'Который час?',        note: '🕐' },
      { src: 'Tushunmayapman',        tgt: 'Я не понимаю',        note: '🤔' },
      { src: 'Hisob-kitob, iltimos',  tgt: 'Счёт, пожалуйста',   note: '🧾' },
      { src: 'Hojatxona qayerda?',    tgt: 'Где туалет?',         note: '🚻' },
      { src: "Yo'lni yo'qotdim",      tgt: 'Я заблудился',        note: '🗺' },
      { src: 'Xayrli tong',           tgt: 'Доброе утро',         note: '🌅' },
    ],
  ],
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] { return [...arr].sort(() => Math.random() - 0.5) }

function buildOptions(correct: Card, pool: Card[]): string[] {
  const wrong = shuffle(pool.filter(c => c.tgt !== correct.tgt)).slice(0, 3)
  return shuffle([correct, ...wrong]).map(c => c.tgt)
}

function starsForScore(score: number, total: number): number {
  const p = score / total
  if (p >= 0.9) return 3
  if (p >= 0.6) return 2
  if (p > 0) return 1
  return 0
}

function xpForLevel(lv: number) { return lv * 100 }

const PROGRESS_KEY = 'lf_progress_v2'
const XP_KEY = 'lf_xp_v2'
const STREAK_KEY = 'lf_streak_v2'

type Progress = Record<Lang, Record<number, number>> // lang → levelIdx(0-4) → stars

function loadProgress(): Progress {
  try { return JSON.parse(localStorage.getItem(PROGRESS_KEY) ?? 'null') ?? { en: {}, ru: {}, uz: {} } }
  catch { return { en: {}, ru: {}, uz: {} } }
}
function saveProgress(p: Progress) { localStorage.setItem(PROGRESS_KEY, JSON.stringify(p)) }
function loadXP(): { xp: number; level: number } {
  try { return JSON.parse(localStorage.getItem(XP_KEY) ?? 'null') ?? { xp: 0, level: 1 } }
  catch { return { xp: 0, level: 1 } }
}
function saveXP(xp: number, level: number) { localStorage.setItem(XP_KEY, JSON.stringify({ xp, level })) }
function loadStreak(): number {
  try { return JSON.parse(localStorage.getItem(STREAK_KEY) ?? '0') } catch { return 0 }
}
function saveStreak(s: number) { localStorage.setItem(STREAK_KEY, JSON.stringify(s)) }

// ─── Game state ───────────────────────────────────────────────────────────────

interface GS {
  lang: Lang; levelIdx: number
  round: Card[]; index: number; options: string[]
  selected: string | null; correct: boolean | null
  score: number; combo: number; maxCombo: number
  timeLeft: number; timedOut: boolean; results: boolean[]
}

const KEY_MAP = ['1', '2', '3', '4']

// ─── Components ───────────────────────────────────────────────────────────────

function Stars({ count, size = 16 }: { count: number; size?: number }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1, 2, 3].map(i => (
        <span key={i} style={{ fontSize: size, opacity: i <= count ? 1 : 0.2 }}>⭐</span>
      ))}
    </div>
  )
}

function TimerArc({ t, total }: { t: number; total: number }) {
  const r = 24, c = 2 * Math.PI * r, pct = t / total
  const col = pct > 0.5 ? '#00f5d4' : pct > 0.25 ? '#ffd60a' : '#ff4d6d'
  return (
    <div style={{ position: 'relative', width: 64, height: 64, flexShrink: 0 }}>
      <svg width="64" height="64" style={{ transform: 'rotate(-90deg)', position: 'absolute' }}>
        <circle cx="32" cy="32" r={r} fill="none" stroke="#2e2856" strokeWidth="4" />
        <circle cx="32" cy="32" r={r} fill="none" stroke={col} strokeWidth="4"
          strokeDasharray={`${pct * c} ${c}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.25s linear, stroke 0.3s' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '1.2rem', color: col }}>
        {t}
      </div>
    </div>
  )
}

// ─── Home Screen ──────────────────────────────────────────────────────────────

function Home({ progress, xp, level, streak, onPickLang }: {
  progress: Progress; xp: number; level: number; streak: number
  onPickLang: (lang: Lang) => void
}) {
  const needed = xpForLevel(level)
  const pct = Math.min((xp / needed) * 100, 100)

  function totalStars(lang: Lang) {
    return Object.values(progress[lang] ?? {}).reduce((a, b) => a + b, 0)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0d0b1e', display: 'flex', flexDirection: 'column' }}>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.6} }`}</style>

      {/* header */}
      <div style={{ padding: '24px 20px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 900, color: '#f0ecff', lineHeight: 1 }}>LinguaFlash</div>
          <div style={{ color: '#8b82b8', fontSize: '0.72rem', marginTop: 2 }}>без зубрёжки</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6,
          background: streak > 0 ? '#ff4d6d18' : '#1a1630', border: `1.5px solid ${streak > 0 ? '#ff4d6d44' : '#2e2856'}`,
          borderRadius: 20, padding: '6px 14px', color: streak > 0 ? '#ff4d6d' : '#8b82b8', fontWeight: 700, fontSize: '0.9rem' }}>
          🔥 {streak}
        </div>
      </div>

      {/* xp */}
      <div style={{ padding: '0 20px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ background: '#a78bfa22', border: '1px solid #a78bfa44', borderRadius: 6,
          padding: '2px 8px', color: '#a78bfa', fontWeight: 700, fontSize: '0.78rem', flexShrink: 0 }}>
          Lv {level}
        </div>
        <div style={{ flex: 1, height: 6, borderRadius: 99, background: '#2e2856', overflow: 'hidden' }}>
          <div style={{ height: '100%', borderRadius: 99, background: 'linear-gradient(90deg,#a78bfa,#00f5d4)', width: `${pct}%`, transition: 'width 0.6s ease' }} />
        </div>
        <div style={{ color: '#8b82b8', fontSize: '0.72rem', flexShrink: 0 }}>{xp}/{needed} XP</div>
      </div>

      {/* pick lang */}
      <div style={{ padding: '0 20px' }}>
        <div style={{ color: '#8b82b8', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12, fontWeight: 600 }}>
          Выбери язык
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {LANGUAGES.map(l => {
            const stars = totalStars(l.code)
            const maxStars = 15
            const done = Object.keys(progress[l.code] ?? {}).length
            return (
              <button key={l.code} onClick={() => onPickLang(l.code)} style={{
                background: '#1a1630', border: `1.5px solid #2e2856`, borderRadius: 22,
                padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 16,
                cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left',
              }}
                onMouseEnter={e => { e.currentTarget.style.background = '#231e42'; e.currentTarget.style.borderColor = l.color + '66' }}
                onMouseLeave={e => { e.currentTarget.style.background = '#1a1630'; e.currentTarget.style.borderColor = '#2e2856' }}
              >
                <div style={{ fontSize: '2.4rem', flexShrink: 0 }}>{l.flag}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.1rem', color: '#f0ecff' }}>{l.label}</div>
                  <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Stars count={Math.round(stars / maxStars * 3)} size={13} />
                    <span style={{ color: '#8b82b8', fontSize: '0.72rem' }}>{done}/5 уровней</span>
                  </div>
                </div>
                <div style={{ color: l.color, fontSize: '1.2rem' }}>›</div>
              </button>
            )
          })}
        </div>
      </div>

      <div style={{ padding: '20px', marginTop: 'auto' }}>
        <div style={{ color: '#4a4460', fontSize: '0.75rem', textAlign: 'center' }}>
          Проходи уровни — сложность растёт с каждым 🔓
        </div>
      </div>
    </div>
  )
}

// ─── Level Select ─────────────────────────────────────────────────────────────

function LevelSelect({ lang, progress, onStart, onBack }: {
  lang: LangMeta; progress: Progress
  onStart: (levelIdx: number) => void; onBack: () => void
}) {
  const prog = progress[lang.code] ?? {}

  function isUnlocked(idx: number) {
    if (idx === 0) return true
    return (prog[idx - 1] ?? 0) >= 1
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0d0b1e', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '24px 20px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <button onClick={onBack} style={{ background: '#1a1630', border: '1px solid #2e2856', borderRadius: 10,
          padding: '7px 13px', color: '#8b82b8', fontSize: '0.85rem', cursor: 'pointer' }}>←</button>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '1.3rem', color: '#f0ecff', display: 'flex', alignItems: 'center', gap: 8 }}>
            {lang.flag} {lang.label}
          </div>
          <div style={{ color: '#8b82b8', fontSize: '0.75rem' }}>5 уровней сложности</div>
        </div>
      </div>

      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {LEVELS.map((lv, idx) => {
          const unlocked = isUnlocked(idx)
          const stars = prog[idx] ?? 0
          const completed = stars > 0
          return (
            <button key={idx} disabled={!unlocked} onClick={() => unlocked && onStart(idx)}
              style={{
                borderRadius: 20, padding: '18px 20px', textAlign: 'left', cursor: unlocked ? 'pointer' : 'default',
                background: completed ? '#1d1a38' : unlocked ? '#1a1630' : '#14112a',
                border: `1.5px solid ${completed ? lang.color + '55' : unlocked ? '#2e2856' : '#1e1b33'}`,
                opacity: unlocked ? 1 : 0.5, transition: 'all 0.15s',
                display: 'flex', alignItems: 'center', gap: 16,
              }}
              onMouseEnter={e => { if (unlocked) e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none' }}
            >
              {/* level icon */}
              <div style={{ width: 48, height: 48, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', flexShrink: 0,
                background: completed ? lang.color + '22' : '#2e2856' }}>
                {unlocked ? lv.emoji : '🔒'}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1rem', color: '#f0ecff' }}>
                    {idx + 1}. {lv.label}
                  </span>
                  {completed && <Stars count={stars} size={12} />}
                </div>
                <div style={{ color: '#8b82b8', fontSize: '0.75rem' }}>{lv.desc}</div>
              </div>

              {unlocked && <div style={{ color: '#8b82b8', fontSize: '1rem' }}>›</div>}
            </button>
          )
        })}
      </div>

      {/* legend */}
      <div style={{ padding: '20px', marginTop: 'auto' }}>
        <div style={{ borderRadius: 14, padding: '12px 14px', background: '#1a1630', border: '1px solid #2e2856' }}>
          <div style={{ color: '#8b82b8', fontSize: '0.72rem', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Условия звёзд</div>
          <div style={{ display: 'flex', gap: 12 }}>
            {[['⭐', '>0%'], ['⭐⭐', '≥60%'], ['⭐⭐⭐', '≥90%']].map(([s, p]) => (
              <div key={p} style={{ color: '#8b82b8', fontSize: '0.72rem' }}>{s} {p}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Game ─────────────────────────────────────────────────────────────────────

function Game({ gs, langMeta, onAnswer, onQuit }: {
  gs: GS; langMeta: LangMeta; onAnswer: (opt: string) => void; onQuit: () => void
}) {
  const lv = LEVELS[gs.levelIdx]
  const card = gs.round[gs.index]
  const progress = gs.index / lv.roundSize

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const idx = KEY_MAP.indexOf(e.key)
      if (idx >= 0 && idx < gs.options.length && gs.selected === null && !gs.timedOut) onAnswer(gs.options[idx])
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [gs.options, gs.selected, gs.timedOut, onAnswer])

  const stateOf = (opt: string) => {
    if (gs.selected === null && !gs.timedOut) return 'idle'
    if (opt === card.tgt) return 'correct'
    if (opt === gs.selected) return 'wrong'
    return 'dim'
  }

  const S = {
    idle:    { bg: '#1a1630', border: '#2e2856', text: '#f0ecff' },
    correct: { bg: '#4ade8022', border: '#4ade80', text: '#4ade80' },
    wrong:   { bg: '#ff4d6d22', border: '#ff4d6d', text: '#ff4d6d' },
    dim:     { bg: '#1a1630', border: '#1e1b33', text: '#3d3660' },
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0d0b1e', display: 'flex', flexDirection: 'column' }}>
      <style>{`@keyframes cardIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}`}</style>

      {/* top bar */}
      <div style={{ padding: '18px 16px 6px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={onQuit} style={{ background: '#1a1630', border: '1px solid #2e2856', borderRadius: 10,
          padding: '6px 12px', color: '#8b82b8', fontSize: '0.8rem', cursor: 'pointer' }}>✕</button>
        <div style={{ flex: 1, height: 6, borderRadius: 99, background: '#2e2856', overflow: 'hidden' }}>
          <div style={{ height: '100%', borderRadius: 99, width: `${progress * 100}%`,
            background: `linear-gradient(90deg, ${langMeta.color}, #00f5d4)`, transition: 'width 0.3s' }} />
        </div>
        <div style={{ color: '#8b82b8', fontSize: '0.78rem', flexShrink: 0 }}>{gs.index}/{lv.roundSize}</div>
      </div>

      {/* result pips */}
      <div style={{ padding: '4px 16px 8px', display: 'flex', gap: 5 }}>
        {Array.from({ length: lv.roundSize }).map((_, i) => (
          <div key={i} style={{ flex: 1, height: 4, borderRadius: 99,
            background: i < gs.results.length ? (gs.results[i] ? '#4ade80' : '#ff4d6d') : '#2e2856',
            transition: 'background 0.3s' }} />
        ))}
      </div>

      {/* status */}
      <div style={{ padding: '2px 16px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.2rem', color: '#4ade80' }}>{gs.score}✓</span>
          {gs.combo >= 2 && (
            <span style={{ background: '#ffd60a22', border: '1px solid #ffd60a44', borderRadius: 7,
              padding: '2px 7px', color: '#ffd60a', fontSize: '0.75rem', fontWeight: 700 }}>
              ×{gs.combo} COMBO
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ color: '#8b82b8', fontSize: '0.75rem' }}>{lv.emoji} {lv.label}</span>
        </div>
        <TimerArc t={gs.timeLeft} total={lv.timerSec} />
      </div>

      {/* card */}
      <div style={{ padding: '0 16px 14px' }}>
        <div key={gs.index} style={{
          borderRadius: 24, minHeight: 130, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          background: 'linear-gradient(135deg, #1d1840, #13102b)', border: '1.5px solid #2e2856',
          padding: '20px', position: 'relative', overflow: 'hidden', animation: 'cardIn 0.2s ease-out',
        }}>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% -20%, #a78bfa0d, transparent 70%)', pointerEvents: 'none' }} />
          {card.note && <div style={{ color: '#8b82b8', fontSize: '1.1rem', marginBottom: 6 }}>{card.note}</div>}
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 'clamp(1.4rem, 6vw, 2.8rem)',
            color: '#f0ecff', textAlign: 'center', lineHeight: 1.2 }}>
            {card.src}
          </div>
          {gs.timedOut && gs.selected === null && (
            <div style={{ marginTop: 8, color: '#ffd60a', fontSize: '0.85rem', fontWeight: 700 }}>⏰ Время вышло</div>
          )}
        </div>
      </div>

      {/* options */}
      <div style={{ padding: '0 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {gs.options.map((opt, i) => {
          const s = S[stateOf(opt)]
          const disabled = gs.selected !== null || gs.timedOut
          return (
            <button key={opt} disabled={disabled} onClick={() => onAnswer(opt)}
              style={{ background: s.bg, border: `1.5px solid ${s.border}`, borderRadius: 16,
                padding: '14px 10px', textAlign: 'center', cursor: disabled ? 'default' : 'pointer',
                color: s.text, transition: 'all 0.12s' }}
              onMouseEnter={e => { if (!disabled) { e.currentTarget.style.background = '#231e42'; e.currentTarget.style.transform = 'translateY(-2px)' } }}
              onMouseLeave={e => { e.currentTarget.style.background = s.bg; e.currentTarget.style.transform = 'none' }}
            >
              <span style={{ display: 'block', color: '#8b82b8', fontSize: '0.65rem', marginBottom: 4 }}>{KEY_MAP[i]}</span>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'clamp(0.8rem, 3vw, 0.95rem)' }}>{opt}</span>
            </button>
          )
        })}
      </div>
      <div style={{ height: 24 }} />
    </div>
  )
}

// ─── Result ───────────────────────────────────────────────────────────────────

function Result({ gs, langMeta, xpGained, newStars, prevStars, onHome, onNext, onRetry }: {
  gs: GS; langMeta: LangMeta; xpGained: number; newStars: number; prevStars: number
  onHome: () => void; onNext: (() => void) | null; onRetry: () => void
}) {
  const lv = LEVELS[gs.levelIdx]
  const pct = gs.score / lv.roundSize
  const [grade, col] = pct >= 0.9 ? ['🏆 Идеально!', '#ffd60a'] : pct >= 0.6 ? ['⚡ Отлично!', '#00f5d4'] : pct > 0 ? ['👍 Неплохо', '#a78bfa'] : ['😤 Ещё раз!', '#ff4d6d']
  const improved = newStars > prevStars

  return (
    <div style={{ minHeight: '100vh', background: '#0d0b1e', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 20px 28px' }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 900, color: col, marginBottom: 2 }}>{grade}</div>
      <div style={{ color: '#8b82b8', fontSize: '0.8rem', marginBottom: 24 }}>
        {langMeta.flag} {lv.emoji} {lv.label}
      </div>

      {/* score card */}
      <div style={{ borderRadius: 28, width: '100%', maxWidth: 360, padding: '24px',
        background: 'linear-gradient(135deg, #1d1840, #13102b)', border: '1.5px solid #2e2856',
        display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '5rem', color: col, lineHeight: 1 }}>{gs.score}</div>
        <div style={{ color: '#8b82b8', marginBottom: 12 }}>из {lv.roundSize} слов</div>
        <Stars count={newStars} size={22} />
        {improved && <div style={{ marginTop: 8, color: '#4ade80', fontSize: '0.8rem', fontWeight: 600 }}>+1 звезда!</div>}

        <div style={{ display: 'flex', gap: 28, borderTop: '1px solid #2e2856', paddingTop: 16, marginTop: 16, width: '100%', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.4rem', color: '#a78bfa' }}>+{xpGained}</div>
            <div style={{ color: '#8b82b8', fontSize: '0.7rem' }}>XP</div>
          </div>
          <div style={{ width: 1, background: '#2e2856' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.4rem', color: '#ffd60a' }}>×{gs.maxCombo}</div>
            <div style={{ color: '#8b82b8', fontSize: '0.7rem' }}>комбо</div>
          </div>
        </div>
      </div>

      {/* review */}
      <div style={{ width: '100%', maxWidth: 360, marginBottom: 20 }}>
        <div style={{ color: '#8b82b8', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8, fontWeight: 600 }}>Разбор</div>
        {gs.round.map((card, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 12px', borderRadius: 10, marginBottom: 5,
            background: gs.results[i] ? '#4ade8010' : '#ff4d6d10', border: `1px solid ${gs.results[i] ? '#4ade8022' : '#ff4d6d22'}` }}>
            <span>{gs.results[i] ? '✅' : '❌'}</span>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.85rem', color: '#f0ecff' }}>{card.src}</div>
              <div style={{ color: '#8b82b8', fontSize: '0.72rem' }}>{card.tgt}</div>
            </div>
          </div>
        ))}
      </div>

      {/* buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 360 }}>
        {onNext && (
          <button onClick={onNext} style={{ padding: '15px', borderRadius: 18, border: 'none', cursor: 'pointer',
            background: `linear-gradient(90deg, ${langMeta.color}, #00f5d4)`,
            fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '1rem', color: '#0d0b1e' }}>
            Уровень {gs.levelIdx + 2} →
          </button>
        )}
        <button onClick={onRetry} style={{ padding: '14px', borderRadius: 18, border: '1.5px solid #2e2856', cursor: 'pointer',
          background: '#1a1630', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem', color: '#f0ecff' }}>
          Повторить ⚡
        </button>
        <button onClick={onHome} style={{ padding: '14px', borderRadius: 18, border: '1px solid #2e2856', cursor: 'pointer',
          background: 'transparent', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem', color: '#8b82b8' }}>
          На главную
        </button>
      </div>
    </div>
  )
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const [activeLang, setActiveLang] = useState<LangMeta>(LANGUAGES[0])
  const [activeLevelIdx, setActiveLevelIdx] = useState(0)
  const [progress, setProgress] = useState<Progress>(loadProgress)
  const [{ xp, level }, setXpState] = useState(loadXP)
  const [streak, setStreak] = useState(loadStreak)
  const [gs, setGs] = useState<GS | null>(null)
  const [lastXp, setLastXp] = useState(0)
  const [lastStars, setLastStars] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const clearTimer = () => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null } }

  const startGame = useCallback((lang: LangMeta, levelIdx: number) => {
    clearTimer()
    const lv = LEVELS[levelIdx]
    const pool = WORDS[lang.code][levelIdx]
    const round = shuffle(pool).slice(0, lv.roundSize)
    setActiveLang(lang); setActiveLevelIdx(levelIdx)
    setGs({ lang: lang.code, levelIdx, round, index: 0, options: buildOptions(round[0], pool),
      selected: null, correct: null, score: 0, combo: 0, maxCombo: 0,
      timeLeft: lv.timerSec, timedOut: false, results: [] })
    setScreen('game')
  }, [])

  // timer
  useEffect(() => {
    if (screen !== 'game' || !gs || gs.selected !== null || gs.timedOut) return
    clearTimer()
    timerRef.current = setInterval(() => {
      setGs(p => {
        if (!p || p.selected !== null || p.timedOut) { clearTimer(); return p }
        if (p.timeLeft <= 1) { clearTimer(); return { ...p, timeLeft: 0, timedOut: true } }
        return { ...p, timeLeft: p.timeLeft - 1 }
      })
    }, 1000)
    return clearTimer
  }, [screen, gs?.index])

  // advance
  useEffect(() => {
    if (!gs) return
    const done = gs.selected !== null || gs.timedOut
    if (!done) return
    const lv = LEVELS[gs.levelIdx]
    const isLast = gs.index + 1 >= lv.roundSize

    const t = setTimeout(() => {
      if (isLast) {
        const stars = starsForScore(gs.score, lv.roundSize)
        const gained = gs.score * 12 + gs.maxCombo * 4
        setLastXp(gained)
        setLastStars(stars)

        // save progress
        const prev = progress[gs.lang]?.[gs.levelIdx] ?? 0
        const newProg = { ...progress, [gs.lang]: { ...progress[gs.lang], [gs.levelIdx]: Math.max(prev, stars) } }
        setProgress(newProg); saveProgress(newProg)

        // xp + level
        setXpState(cur => {
          let nx = cur.xp + gained, nl = cur.level
          while (nx >= xpForLevel(nl)) { nx -= xpForLevel(nl); nl++ }
          saveXP(nx, nl)
          return { xp: nx, level: nl }
        })

        // streak
        if (gs.score > 0) { const ns = streak + 1; setStreak(ns); saveStreak(ns) }
        setScreen('result')
      } else {
        setGs(p => {
          if (!p) return p
          const ni = p.index + 1
          const pool = WORDS[p.lang][p.levelIdx]
          return { ...p, index: ni, options: buildOptions(p.round[ni], pool),
            selected: null, correct: null, timeLeft: LEVELS[p.levelIdx].timerSec, timedOut: false }
        })
      }
    }, isLast ? 700 : 750)

    return () => clearTimeout(t)
  }, [gs?.selected, gs?.timedOut, gs?.index])

  const handleAnswer = useCallback((opt: string) => {
    setGs(p => {
      if (!p || p.selected !== null || p.timedOut) return p
      clearTimer()
      const correct = opt === p.round[p.index].tgt
      const nc = correct ? p.combo + 1 : 0
      return { ...p, selected: opt, correct, timedOut: false,
        score: correct ? p.score + 1 : p.score,
        combo: nc, maxCombo: Math.max(p.maxCombo, nc),
        results: [...p.results, correct] }
    })
  }, [])

  const prevStars = gs ? (progress[gs.lang]?.[gs.levelIdx - 1] ?? 0) : 0
  const hasNext = gs && gs.levelIdx < 4 && (progress[gs.lang]?.[gs.levelIdx] ?? 0) >= 1

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', minHeight: '100vh', background: '#0d0b1e' }}>
      {screen === 'home' && (
        <Home progress={progress} xp={xp} level={level} streak={streak}
          onPickLang={code => { setActiveLang(LANGUAGES.find(l => l.code === code)!); setScreen('levels') }} />
      )}
      {screen === 'levels' && (
        <LevelSelect lang={activeLang} progress={progress}
          onStart={idx => startGame(activeLang, idx)}
          onBack={() => setScreen('home')} />
      )}
      {screen === 'game' && gs && (
        <Game gs={gs} langMeta={activeLang} onAnswer={handleAnswer}
          onQuit={() => { clearTimer(); setScreen('levels') }} />
      )}
      {screen === 'result' && gs && (
        <Result gs={gs} langMeta={activeLang} xpGained={lastXp}
          newStars={lastStars} prevStars={prevStars}
          onHome={() => setScreen('home')}
          onRetry={() => startGame(activeLang, gs.levelIdx)}
          onNext={hasNext ? () => startGame(activeLang, gs.levelIdx + 1) : null} />
      )}
    </div>
  )
}
