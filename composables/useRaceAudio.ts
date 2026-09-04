/**
 * Synthesised race-start audio. No assets, no autoplay: the context is only
 * created inside the tap that starts the race, and the whole experience is
 * designed to work with this switched off (which is the default).
 */
export function useRaceAudio() {
  const enabled = ref(false)
  let ctx: AudioContext | null = null

  onMounted(() => {
    enabled.value = localStorage.getItem('uno_race_sound') === 'on'
  })

  function toggle() {
    enabled.value = !enabled.value
    localStorage.setItem('uno_race_sound', enabled.value ? 'on' : 'off')
    if (!enabled.value) dispose()
  }

  function context() {
    if (!enabled.value) return null
    if (!ctx) {
      const Ctor = window.AudioContext || (window as any).webkitAudioContext
      if (!Ctor) return null
      ctx = new Ctor()
    }
    if (ctx.state === 'suspended') ctx.resume().catch(() => {})
    return ctx
  }

  function tone(at: number, freq: number, duration: number, gain: number, type: OscillatorType = 'sine') {
    const audio = context()
    if (!audio) return
    const t = audio.currentTime + at
    const osc = audio.createOscillator()
    const vol = audio.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, t)
    vol.gain.setValueAtTime(0.0001, t)
    vol.gain.exponentialRampToValueAtTime(gain, t + 0.012)
    vol.gain.exponentialRampToValueAtTime(0.0001, t + duration)
    osc.connect(vol).connect(audio.destination)
    osc.start(t)
    osc.stop(t + duration + 0.05)
  }

  /** Five grid beeps, then the engine pulling away. */
  function playStartSequence(lightOn: number[], lightsOut: number, runFor: number) {
    const audio = context()
    if (!audio) return
    for (const ms of lightOn) tone(ms / 1000, 660, 0.16, 0.09, 'square')

    const t = audio.currentTime + lightsOut / 1000
    const osc = audio.createOscillator()
    const vol = audio.createGain()
    const filter = audio.createBiquadFilter()
    osc.type = 'sawtooth'
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(700, t)
    filter.frequency.exponentialRampToValueAtTime(2400, t + 0.6)
    osc.frequency.setValueAtTime(60, t)
    osc.frequency.exponentialRampToValueAtTime(240, t + 0.75)
    osc.frequency.exponentialRampToValueAtTime(120, t + runFor / 1000)
    vol.gain.setValueAtTime(0.0001, t)
    vol.gain.exponentialRampToValueAtTime(0.14, t + 0.09)
    vol.gain.exponentialRampToValueAtTime(0.0001, t + runFor / 1000)
    osc.connect(filter).connect(vol).connect(audio.destination)
    osc.start(t)
    osc.stop(t + runFor / 1000 + 0.1)
  }

  function dispose() {
    ctx?.close().catch(() => {})
    ctx = null
  }

  onBeforeUnmount(dispose)

  return { enabled, toggle, playStartSequence }
}
