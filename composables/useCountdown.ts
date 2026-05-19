export function useCountdown(target: Date) {
  const days = ref(0)
  const hours = ref(0)
  const minutes = ref(0)
  const seconds = ref(0)
  const expired = ref(false)

  function tick() {
    const now = Date.now()
    const diff = target.getTime() - now

    if (diff <= 0) {
      expired.value = true
      days.value = hours.value = minutes.value = seconds.value = 0
      return
    }

    days.value = Math.floor(diff / (1000 * 60 * 60 * 24))
    hours.value = Math.floor((diff / (1000 * 60 * 60)) % 24)
    minutes.value = Math.floor((diff / (1000 * 60)) % 60)
    seconds.value = Math.floor((diff / 1000) % 60)
  }

  let timer: ReturnType<typeof setInterval>

  onMounted(() => {
    tick()
    timer = setInterval(tick, 1000)
  })

  onUnmounted(() => clearInterval(timer))

  return { days, hours, minutes, seconds, expired }
}
