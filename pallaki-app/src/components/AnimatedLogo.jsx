import { useState, useEffect } from 'react'

const SCRIPTS = [
  { text: 'पल्लकी', font: "'Tiro Devanagari Hindi', serif" },   // Hindi
  { text: 'పల్లకి', font: "'Noto Sans Telugu', serif" },         // Telugu
  { text: 'ಪಲ್ಲಕಿ', font: "'Noto Sans Kannada', serif" },        // Kannada
  { text: 'பல்லக்கு', font: "'Noto Sans Tamil', serif" },        // Tamil
  { text: 'ਪਾਲਕੀ', font: "'Noto Sans Gurmukhi', serif" },        // Punjabi
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
        fontSize: size,
        color,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'opacity 0.2s ease',
        opacity: fade ? 1 : 0,
        display: 'inline-block',
        lineHeight: 1,
        letterSpacing: '0.02em',
      }}
    >
      {current.text}
    </span>
  )
}
