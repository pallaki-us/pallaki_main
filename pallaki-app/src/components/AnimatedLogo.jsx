import { useState, useEffect } from 'react'

const SCRIPTS = [
  { text: 'Pallaki',   font: "'Cormorant Garamond', serif",   lineHeight: 1 },         // English
  { text: 'पल्लकी',   font: "'Tiro Devanagari Hindi', serif", lineHeight: 1 },         // Hindi
  { text: 'పల్లకి',   font: "'Noto Sans Telugu', serif",      lineHeight: 1 },         // Telugu
  { text: 'ಪಲ್ಲಕಿ',  font: "'Noto Sans Kannada', serif",     lineHeight: 1 },         // Kannada
  { text: 'பல்லக்கு', font: "'Noto Sans Tamil', serif",       lineHeight: 1 },         // Tamil
  { text: 'ਪਾਲਕੀ',   font: "'Noto Sans Gurmukhi', serif",    lineHeight: 1 },         // Punjabi
  { text: 'پالکی',    font: "'Noto Nastaliq Urdu', serif",    lineHeight: 1.8, scale: 0.6 }, // Urdu — Nastaliq glyphs are tall
]

export default function AnimatedLogo({ size = '2rem', color = 'var(--v)', onClick }) {
  const [index, setIndex] = useState(0)
  const [fade, setFade] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false)
      setTimeout(() => {
        setIndex(i => (i + 1) % SCRIPTS.length)
        setFade(true)
      }, 200)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  const current = SCRIPTS[index]

  return (
    <span
      onClick={onClick}
      style={{
        fontFamily: current.font,
        fontSize: current.scale ? `calc(${size} * ${current.scale})` : size,
        color,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'opacity 0.2s ease',
        opacity: fade ? 1 : 0,
        display: 'inline-block',
        lineHeight: current.lineHeight,
        letterSpacing: '0.02em',
      }}
    >
      {current.text}
    </span>
  )
}
