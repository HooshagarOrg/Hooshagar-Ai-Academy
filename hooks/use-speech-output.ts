'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

interface UseSpeechOutputOptions {
  lang?: string
  enabled?: boolean
}

export function useSpeechOutput({ lang = 'fa-IR', enabled = false }: UseSpeechOutputOptions = {}) {
  const [supported, setSupported] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const enabledRef = useRef(enabled)

  useEffect(() => {
    enabledRef.current = enabled
  }, [enabled])

  useEffect(() => {
    setSupported(typeof window !== 'undefined' && 'speechSynthesis' in window)
  }, [])

  const stop = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
    setSpeaking(false)
  }, [])

  const speak = useCallback(
    (text: string) => {
      if (!enabledRef.current || !text.trim()) return
      if (typeof window === 'undefined' || !window.speechSynthesis) return

      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = lang
      utterance.rate = 0.95
      utterance.pitch = 1

      const voices = window.speechSynthesis.getVoices()
      const faVoice = voices.find((v) => v.lang.startsWith('fa') || v.lang.startsWith('ar'))
      if (faVoice) utterance.voice = faVoice

      utterance.onend = () => setSpeaking(false)
      utterance.onerror = () => setSpeaking(false)

      setSpeaking(true)
      window.speechSynthesis.speak(utterance)
    },
    [lang]
  )

  useEffect(() => () => stop(), [stop])

  return { supported, speaking, speak, stop }
}
