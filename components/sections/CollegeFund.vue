<script setup lang="ts">

const FUND_DEADLINE = new Date('2026-09-13T00:00:00')
const { days } = useCountdown(FUND_DEADLINE)

const { data, refresh } = useFetch<{ contributions: any[]; total: number; goal: number }>('/api/public/fund')

const realPct = computed(() => {
  if (!data.value?.goal) return 0
  return Math.min(Math.round((data.value.total / data.value.goal) * 100), 100)
})
const realContributors = computed(() => data.value?.contributions.length ?? 0)

const displayContributors = ref(0)

onMounted(() => {
  const cTimer = setInterval(() => {
    if (displayContributors.value < realContributors.value) displayContributors.value++
    else clearInterval(cTimer)
  }, 30)
})

// Drawer
const drawerOpen = ref(false)
const openDrawer = () => { drawerOpen.value = true }
const closeDrawer = () => {
  drawerOpen.value = false
  resetForm()
}

// Form state
const form = reactive({ name: '', amount: '', message: '' })
const screenshotFile = ref<File | null>(null)
const screenshotPreview = ref<string | null>(null)
const submitting = ref(false)
const submitted = ref(false)
const error = ref('')

function resetForm() {
  form.name = ''
  form.amount = ''
  form.message = ''
  screenshotFile.value = null
  screenshotPreview.value = null
  submitting.value = false
  submitted.value = false
  error.value = ''
}

function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  screenshotFile.value = file
  screenshotPreview.value = URL.createObjectURL(file)
}

async function submit() {
  error.value = ''
  if (!form.name.trim() || !form.amount) {
    error.value = 'Name and amount are required.'
    return
  }

  submitting.value = true
  try {
    let proofUrl: string | null = null

    if (screenshotFile.value) {
      const fd = new FormData()
      fd.append('file', screenshotFile.value)
      fd.append('uploaderName', form.name)
      const uploadRes = await $fetch<{ url: string }>('/api/upload', { method: 'POST', body: fd })
      proofUrl = uploadRes.url
    }

    await $fetch('/api/public/fund', {
      method: 'POST',
      body: {
        submitterName: form.name,
        amount: Number(form.amount),
        message: form.message || undefined,
        proofUrl,
      },
    })

    submitted.value = true
    await refresh()
  } catch (e: any) {
    error.value = e?.data?.message ?? 'Something went wrong. Please try again.'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="h-[100svh] relative overflow-hidden flex flex-col">

    <!-- Checkered top strip -->
    <div class="w-full h-3 checker-strip opacity-40 flex-shrink-0" />

    <!-- Watercolor backgrounds — leading the vibe -->
    <img src="~/assets/images/upperright-watercolor.png" alt="" aria-hidden="true"
      class="pointer-events-none absolute -top-8 -right-8 w-[78vw] md:w-[50vw] opacity-65 select-none" />
    <img src="~/assets/images/lowerleft-watercolor.png" alt="" aria-hidden="true"
      class="pointer-events-none absolute bottom-0 left-0 w-[65vw] md:w-[42vw] opacity-55 select-none" />

    <!-- Floating clouds -->
    <img src="~/assets/images/clouds/4.png" alt="" aria-hidden="true"
      class="cloud-float-slow pointer-events-none absolute top-6 right-[10vw] w-[44vw] md:w-[16vw] opacity-70 select-none" />
    <img src="~/assets/images/clouds/2.png" alt="" aria-hidden="true"
      class="cloud-float pointer-events-none absolute top-14 left-[2vw] w-[36vw] md:w-[13vw] opacity-50 select-none" />

    <!-- Main content: single centered column -->
    <div class="flex-1 flex flex-col items-center justify-center px-6 relative z-10 gap-3 md:gap-5">

      <!-- Illustration: college building with tireflag flanking it like a scene -->
      <div class="relative flex items-end justify-center gap-2 md:gap-4">
        <img src="~/assets/images/tireflag.png" alt="" aria-hidden="true"
          class="w-14 md:w-20 select-none opacity-70 mb-1 -scale-x-100" />
        <img src="~/assets/images/college.png" alt="Uno heading to college"
          class="w-36 md:w-52 select-none drop-shadow-sm" />
        <img src="~/assets/images/tireflag.png" alt="" aria-hidden="true"
          class="w-14 md:w-20 select-none opacity-70 mb-1" />
      </div>

      <!-- Eyebrow + title + tagline -->
      <div class="text-center">
        <p class="font-script text-base md:text-lg text-race-blue/75 mb-0.5 leading-none">His most important finish line</p>
        <h1 class="font-racing text-[clamp(2.4rem,8vw,5rem)] text-race-black leading-none mb-2">
          Uno's College Fund
        </h1>
        <p class="font-sans text-[11px] text-race-gray/60 max-w-[260px] mx-auto leading-relaxed">
          Every peso goes directly into Uno's PSSLAI fund —
          locked and invested until he reaches college.
        </p>
      </div>

      <!-- Stats row -->
      <div class="grid grid-cols-2 w-full max-w-[240px] md:max-w-xs divide-x divide-race-blue/20">
        <div class="text-center px-4 md:px-6">
          <p class="font-racing text-[clamp(1.9rem,7vw,3rem)] text-race-black leading-none">{{ displayContributors }}</p>
          <p class="font-sans text-[9px] uppercase tracking-wider text-race-gray/50 mt-0.5">Contributors</p>
        </div>
        <div class="text-center px-4 md:px-6">
          <p class="font-racing text-[clamp(1.9rem,7vw,3rem)] text-race-black leading-none">{{ days }}</p>
          <p class="font-sans text-[9px] uppercase tracking-wider text-race-gray/50 mt-0.5">Days to Go</p>
        </div>
      </div>

      <!-- Race-track progress -->
      <div style="width:100%;max-width:560px;margin:0 auto;">
        <RaceProgress :percent="realPct" car-src="/images/uno-car.png" />
      </div>

      <!-- CTA -->
      <button
        @click="openDrawer"
        class="bg-race-blue text-white font-sans text-xs uppercase tracking-widest px-12 py-3.5 rounded-full hover:bg-race-blue/80 transition-colors"
      >
        Join the Pit Crew
      </button>
      <p class="font-sans text-[10px] text-race-gray/35 -mt-1">Scan · Send · Submit proof</p>

    </div>

    <!-- Back link -->
    <div class="text-center pb-5 relative z-10">
      <NuxtLink
        to="/"
        class="font-sans text-[10px] uppercase tracking-widest text-race-gray/40 hover:text-race-gray transition-colors"
      >
        ← Back to the race
      </NuxtLink>
    </div>

    <!-- Drawer backdrop -->
    <Transition name="fade">
      <div
        v-if="drawerOpen"
        class="fixed inset-0 bg-black/40 z-40"
        @click="closeDrawer"
      />
    </Transition>

    <!-- Drawer -->
    <Transition name="slide-right">
      <div
        v-if="drawerOpen"
        class="fixed top-0 right-0 h-full w-full md:w-1/2 bg-white z-50 flex flex-col overflow-y-auto shadow-2xl"
      >
        <!-- Drawer header -->
        <div class="bg-race-black px-6 py-5 flex items-center justify-between flex-shrink-0">
          <div>
            <p class="font-racing text-[10px] text-race-blue tracking-[0.4em] uppercase mb-0.5">Pit Stop</p>
            <p class="font-racing text-white text-xl tracking-wide">Join the Pit Crew</p>
          </div>
          <button
            @click="closeDrawer"
            class="text-white/50 hover:text-white transition-colors text-2xl leading-none"
            aria-label="Close"
          >✕</button>
        </div>

        <!-- Success state -->
        <div v-if="submitted" class="flex flex-col items-center justify-center flex-1 px-8 text-center gap-4 py-16">
          <img src="~/assets/images/flag.png" alt="" class="w-20 select-none" />
          <p class="font-racing text-3xl text-race-black">You're in the crew!</p>
          <p class="font-sans text-sm text-race-gray max-w-xs leading-relaxed">
            We've received your contribution. Diego will review and confirm it shortly. Thank you for investing in Uno's future!
          </p>
          <button
            @click="closeDrawer"
            class="mt-4 font-racing text-xs uppercase tracking-widest text-race-blue border border-race-blue/40 px-6 py-2 hover:bg-race-blue hover:text-white transition-colors"
          >Back to the race</button>
        </div>

        <!-- Form -->
        <div v-else class="flex-1 px-6 py-8 flex flex-col gap-6">

          <!-- QR code -->
          <div class="flex flex-col items-center gap-3">
            <div class="border border-race-gray/20 p-4 inline-block">
              <!-- Swap this img src for your actual GCash QR when ready -->
              <div class="w-40 h-40 bg-race-gray/10 flex items-center justify-center">
                <p class="font-sans text-[10px] text-race-gray/50 text-center uppercase tracking-wider leading-relaxed">GCash QR<br/>coming soon</p>
              </div>
            </div>
            <p class="font-sans text-xs text-race-gray/60 text-center">Scan with GCash to send, then fill out the form below.</p>
          </div>

          <div class="h-px bg-race-gray/15" />

          <!-- Name -->
          <div class="flex flex-col gap-1.5">
            <label class="font-racing text-[10px] uppercase tracking-[0.3em] text-race-gray">Your Name</label>
            <input
              v-model="form.name"
              type="text"
              placeholder="e.g. Tito Boy"
              class="border border-race-gray/25 px-4 py-3 font-sans text-sm text-race-black placeholder:text-race-gray/35 focus:outline-none focus:border-race-blue transition-colors"
            />
          </div>

          <!-- Amount -->
          <div class="flex flex-col gap-1.5">
            <label class="font-racing text-[10px] uppercase tracking-[0.3em] text-race-gray">Amount (₱)</label>
            <div class="flex items-center border border-race-gray/25 focus-within:border-race-blue transition-colors">
              <span class="px-3 font-racing text-sm text-race-gray/50 border-r border-race-gray/25">₱</span>
              <input
                v-model="form.amount"
                type="number"
                min="1"
                placeholder="500"
                class="flex-1 px-4 py-3 font-sans text-sm text-race-black placeholder:text-race-gray/35 focus:outline-none bg-transparent"
              />
            </div>
          </div>

          <!-- Screenshot -->
          <div class="flex flex-col gap-1.5">
            <label class="font-racing text-[10px] uppercase tracking-[0.3em] text-race-gray">GCash Screenshot</label>
            <label
              class="border border-dashed border-race-gray/30 hover:border-race-blue transition-colors cursor-pointer flex flex-col items-center justify-center gap-2 py-5 px-4"
              :class="screenshotPreview ? 'border-race-blue/50' : ''"
            >
              <img
                v-if="screenshotPreview"
                :src="screenshotPreview"
                class="max-h-32 object-contain"
                alt="GCash screenshot preview"
              />
              <template v-else>
                <span class="text-2xl">📎</span>
                <p class="font-sans text-xs text-race-gray/50 text-center">Attach your GCash screenshot<br/>as proof of your transfer</p>
              </template>
              <input type="file" accept="image/*" class="hidden" @change="onFileChange" />
            </label>
            <button
              v-if="screenshotPreview"
              @click="screenshotFile = null; screenshotPreview = null"
              class="font-sans text-[10px] text-race-gray/50 hover:text-race-gray self-start transition-colors"
            >Remove</button>
          </div>

          <!-- Message (optional) -->
          <div class="flex flex-col gap-1.5">
            <label class="font-racing text-[10px] uppercase tracking-[0.3em] text-race-gray">
              Message <span class="text-race-gray/40 normal-case font-sans tracking-normal">(optional)</span>
            </label>
            <textarea
              v-model="form.message"
              rows="2"
              placeholder="A note for Uno..."
              class="border border-race-gray/25 px-4 py-3 font-sans text-sm text-race-black placeholder:text-race-gray/35 focus:outline-none focus:border-race-blue transition-colors resize-none"
            />
          </div>

          <!-- Error -->
          <p v-if="error" class="font-sans text-xs text-red-500">{{ error }}</p>

          <!-- Submit -->
          <button
            @click="submit"
            :disabled="submitting"
            class="bg-race-blue text-white font-racing text-sm uppercase tracking-widest py-4 hover:bg-race-blue/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {{ submitting ? 'Submitting…' : 'Submit Proof' }}
          </button>

          <p class="font-sans text-[10px] text-race-gray/40 text-center -mt-2">
            Diego will confirm your contribution before it appears on the board.
          </p>

        </div>
      </div>
    </Transition>

  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.25s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.slide-right-enter-active, .slide-right-leave-active { transition: transform 0.3s ease; }
.slide-right-enter-from, .slide-right-leave-to { transform: translateX(100%); }
</style>
