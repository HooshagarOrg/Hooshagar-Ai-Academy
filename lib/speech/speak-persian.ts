/**
 * پخش متن فارسی با اولویت speechSynthesis و fallback به /api/tts
 */

function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      resolve([])
      return
    }

    const synth = window.speechSynthesis
    const current = synth.getVoices()
    if (current.length > 0) {
      resolve(current)
      return
    }

    const done = () => {
      synth.removeEventListener('voiceschanged', done)
      resolve(synth.getVoices())
    }
    synth.addEventListener('voiceschanged', done)
    // بعضی مرورگرها voiceschanged نمی‌فرستند
    setTimeout(() => {
      synth.removeEventListener('voiceschanged', done)
      resolve(synth.getVoices())
    }, 700)
  })
}

function pickPersianVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  return (
    voices.find((v) => v.lang.toLowerCase().startsWith('fa')) ||
    voices.find((v) => /persian|farsi|iran/i.test(v.name)) ||
    voices.find((v) => v.lang.toLowerCase().startsWith('ar')) ||
    null
  )
}

async function speakWithSynthesis(text: string): Promise<boolean> {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false

  const synth = window.speechSynthesis
  // باگ کروم: گاهی synth در حالت paused گیر می‌کند
  try {
    synth.resume()
  } catch {
    /* ignore */
  }
  synth.cancel()

  const voices = await loadVoices()
  const voice = pickPersianVoice(voices)

  // بدون صدای فارسی معمولاً خروجی خالی/بی‌معنی است → برو سراغ fallback
  if (!voice && voices.length > 0) {
    const hasFaCapable = voices.some((v) => v.lang.toLowerCase().startsWith('fa'))
    if (!hasFaCapable) return false
  }

  return new Promise((resolve) => {
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = voice?.lang || 'fa-IR'
    utterance.rate = 0.85
    utterance.pitch = 1
    if (voice) utterance.voice = voice

    let settled = false
    const finish = (ok: boolean) => {
      if (settled) return
      settled = true
      resolve(ok)
    }

    utterance.onend = () => finish(true)
    utterance.onerror = () => finish(false)

    try {
      synth.speak(utterance)
      // کروم گاهی speak را صف می‌کند ولی پخش نمی‌کند مگر resume
      setTimeout(() => {
        try {
          synth.resume()
        } catch {
          /* ignore */
        }
      }, 50)

      // اگر نه onend و نه onerror آمد، ناموفق فرض کن
      setTimeout(() => {
        if (!settled) {
          if (synth.speaking || synth.pending) {
            // هنوز در حال پخش — موفق
            finish(true)
          } else {
            finish(false)
          }
        }
      }, 2500)
    } catch {
      finish(false)
    }
  })
}

async function speakWithAudioApi(text: string): Promise<boolean> {
  try {
    const url = `/api/tts?lang=fa&text=${encodeURIComponent(text)}`
    const audio = new Audio(url)
    audio.preload = 'auto'

    await new Promise<void>((resolve, reject) => {
      audio.oncanplaythrough = () => resolve()
      audio.onerror = () => reject(new Error('audio load failed'))
      // بعضی موبایل‌ها canplaythrough نمی‌فرستند
      setTimeout(() => resolve(), 4000)
      void audio.load()
    })

    await audio.play()
    await new Promise<void>((resolve) => {
      audio.onended = () => resolve()
      audio.onerror = () => resolve()
      setTimeout(resolve, 12000)
    })
    return true
  } catch {
    return false
  }
}

export async function speakPersian(text: string): Promise<{ ok: boolean; method: 'speech' | 'audio' | 'none' }> {
  const trimmed = text.trim()
  if (!trimmed) return { ok: false, method: 'none' }

  const speechOk = await speakWithSynthesis(trimmed)
  if (speechOk) return { ok: true, method: 'speech' }

  const audioOk = await speakWithAudioApi(trimmed)
  if (audioOk) return { ok: true, method: 'audio' }

  return { ok: false, method: 'none' }
}
