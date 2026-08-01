<script setup lang="ts">

const FUND_DEADLINE = new Date('2026-09-13T00:00:00')
const QR_CODE_URL = '/images/uno-college-fund-qr.jpg'
const QR_CODE_FILENAME = 'uno-college-fund-qr.jpg'
const { days } = useCountdown(FUND_DEADLINE)

const { data, refresh } = useFetch<{
  contributions: any[]
  contributorCount: number
  total: number
  goal: number
}>('/api/public/fund')

const realPct = computed(() => {
  if (!data.value?.goal) return 0
  return Math.min(Math.round((data.value.total / data.value.goal) * 100), 100)
})
const collectedAmount = computed(() => new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  maximumFractionDigits: 0,
}).format(data.value?.total ?? 0))
const targetAmount = computed(() => new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  maximumFractionDigits: 0,
}).format(data.value?.goal ?? 100000))
const ctaLabel = computed(() => (data.value?.total ?? 0) > 0
  ? 'Join the Pit Crew'
  : 'Be the First Pit Crew Member')
onMounted(() => {
  if (import.meta.client) {
    const qrImage = new Image()
    qrImage.onload = () => { qrCodeAvailable.value = true }
    qrImage.onerror = () => { qrCodeAvailable.value = false }
    qrImage.src = QR_CODE_URL
  }
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
const qrCodeAvailable = ref(false)
const submitting = ref(false)
const submitted = ref(false)
const error = ref('')
const submittedDate = ref('')
const contributionNumber = ref(0)

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

function downloadQrCode() {
  if (!qrCodeAvailable.value || !import.meta.client) return

  const link = document.createElement('a')
  link.href = QR_CODE_URL
  link.download = QR_CODE_FILENAME
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
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
    submittedDate.value = new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })
    await refresh()
    contributionNumber.value = data.value?.contributions.length ?? 0
  } catch (e: any) {
    error.value = e?.data?.message ?? 'Something went wrong. Please try again.'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="min-h-[100svh] relative overflow-x-hidden flex flex-col">
    <!-- Fading sky -->
    <div aria-hidden="true"
      class="pointer-events-none absolute inset-x-0 top-0 h-1/5 z-0 opacity-90"
      style="background-image:
        radial-gradient(ellipse at top left, rgba(255,255,255,0.45), transparent 55%),
        radial-gradient(ellipse at top right, rgba(255,255,255,0.28), transparent 50%),
        linear-gradient(to bottom, #b9d4ea 0%, #d6e6f2 68%, rgba(214,230,242,0) 100%),
        url('~/assets/images/paperbg.png');
        background-size: auto, auto, 100% 100%, cover;
        background-position: top left, top right, center, center;
        background-repeat: no-repeat, no-repeat, no-repeat, no-repeat;
        background-blend-mode: screen, screen, normal, multiply;"
    />

    <!-- Watercolor backgrounds — leading the vibe -->
    <img src="~/assets/images/upperright-watercolor.png" alt="" aria-hidden="true"
      class="pointer-events-none absolute -top-8 -right-8 w-[78vw] md:w-[50vw] opacity-65 select-none" />
    <img src="~/assets/images/lowerleft-watercolor.png" alt="" aria-hidden="true"
      class="pointer-events-none absolute bottom-0 left-0 w-[65vw] md:w-[42vw] opacity-55 select-none" />

    <!-- Floating clouds -->
    <img src="~/assets/images/clouds/4.png" alt="" aria-hidden="true"
      class="cloud-float-slow pointer-events-none absolute z-[1] top-6 right-[1rem] md:right-[2rem] w-[10rem] md:w-[28rem] opacity-70 select-none" />
    <img src="~/assets/images/clouds/2.png" alt="" aria-hidden="true"
      class="cloud-float pointer-events-none absolute z-[1] top-[2rem] md:top-12 left-[2vw] w-[12rem] md:w-[28rem] opacity-50 select-none" />

    <!-- Main content: single centered column -->
    <div class="flex-1 flex flex-col items-center justify-center px-6 relative z-10 gap-3 md:gap-5">

      <!-- Illustration: college building with tireflag flanking it like a scene -->
      <div class="flex items-end justify-center">
        <img src="~/assets/images/tireflag.png" alt="" aria-hidden="true"
          class="w-[5rem] md:w-[8rem] select-none opacity-70 mb-1 -scale-x-100" />
        <img src="~/assets/images/college.png" alt="Uno heading to college"
          class="w-[12rem] md:w-[18rem] select-none drop-shadow-sm" />
        <img src="~/assets/images/tireflag.png" alt="" aria-hidden="true"
          class="w-[5rem] md:w-[8rem] select-none opacity-70 mb-1" />
      </div>

      <!-- Eyebrow + title + tagline -->
      <div class="text-center">
        <p class="font-script text-base md:text-lg text-race-blue/75 mb-0.5 leading-none mt-4">His most important finish line</p>
        <h1 class="font-racing text-[clamp(2.4rem,8vw,5rem)] text-race-black leading-none my-2">
          Uno's College Fund
        </h1>
        <p class="font-sans text-sm md:text-base font-medium text-race-gray/80 max-w-[320px] mx-auto leading-relaxed">
          Every peso goes into Uno's PSSLAI college fund,
          safely invested until he reaches his own finish line.
        </p>
      </div>

      <!-- Stats row -->
      <div class="grid grid-cols-2 w-full max-w-[240px] md:max-w-xs divide-x divide-race-blue/20">
        <div class="text-center px-4 md:px-6">
          <p class="font-racing text-[clamp(1.9rem,7vw,3rem)] text-race-black leading-none">{{ data?.contributorCount ?? 0 }}</p>
          <p class="font-sans text-[9px] uppercase tracking-wider text-race-gray/50 mt-0.5">Contributors</p>
        </div>
        <div class="text-center px-4 md:px-6">
          <p class="font-racing text-[clamp(1.9rem,7vw,3rem)] text-race-black leading-none">{{ days }}</p>
          <p class="font-sans text-[9px] uppercase tracking-wider text-race-gray/50 mt-0.5">Days to Go</p>
        </div>
      </div>

      <!-- Race-track progress -->
      <div style="width:100%;max-width:560px;margin:0 auto;">
        <RaceProgress
          :percent="realPct"
          car-src="/images/uno-car.png"
          :readout-value="collectedAmount"
          :readout-target="targetAmount"
          readout-caption="Fuel Collected"
          :aria-label="`Uno's college fund — ${collectedAmount} collected out of ${targetAmount}`"
        />
      </div>

      <!-- CTA -->
      <button
        @click="openDrawer"
        class="bg-race-blue text-white font-sans text-xs uppercase tracking-widest px-12 py-3.5 rounded-full hover:bg-race-blue/80 transition-colors"
      >
        {{ ctaLabel }}
      </button>
      <p class="font-sans text-xs text-race-gray/65 -mt-1">Help fuel Uno's journey to college.</p>

    </div>

    <!-- Footer image -->
    <img src="~/assets/images/footer.png" alt="" aria-hidden="true"
      class="pointer-events-none fixed bottom-0 left-0 right-0 w-full select-none"
      style="transform: scale(1.10); opacity: 75%;" />

    <!-- Back link -->
    <div class="text-center pb-12 relative z-10">
      <NuxtLink
        to="/"
        class="inline-flex min-h-11 items-center justify-center px-4 font-racing text-[10px] uppercase tracking-[0.18em] text-race-blue transition-colors hover:text-race-black focus:outline-none focus-visible:ring-2 focus-visible:ring-race-blue focus-visible:ring-offset-2"
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
        class="fixed top-0 right-0 h-full w-full md:w-1/2 bg-white z-50 flex flex-col overflow-hidden shadow-2xl"
      >
        <!-- Drawer header -->
        <div class="bg-race-black px-6 py-5 flex items-center justify-between flex-shrink-0">
          <div>
            <p class="font-racing text-[10px] text-race-blue tracking-[0.4em] uppercase mb-0.5">Pit Stop</p>
            <p class="font-racing text-white text-xl tracking-wide">Join the Pit Crew</p>
          </div>
          <div class="flex items-center gap-3">
            <button
              @click="closeDrawer"
              class="text-white/50 hover:text-white transition-colors text-2xl leading-none"
              aria-label="Close"
            >✕</button>
          </div>
        </div>

        <!-- Pit Crew Pass -->
        <div v-if="submitted" class="receipt-bg flex-1 min-h-0 overflow-y-auto">
          <div class="min-h-full px-5 py-8 flex flex-col items-center justify-center gap-6">

            <!-- Thank you message -->
            <div class="text-center flex-shrink-0">
              <p class="font-sans text-[11px] text-race-gray/55 leading-relaxed max-w-[260px] mx-auto">
                You didn't just give a gift — you gave Uno a head start. Here's your official pass to the crew. 🏁<br/>
                
              </p>
            </div>

            <!-- Pass card -->
            <div ref="passCardEl" class="relative w-full flex-shrink-0 rounded-2xl border-2 border-dashed border-race-blue/25 bg-[#fffdf7] shadow-xl overflow-hidden">

              <!-- Watercolor top wash -->
              <div class="absolute inset-x-0 top-0 h-36 opacity-20 pointer-events-none"
                style="background: radial-gradient(ellipse at 20% 0%, #b9d4ea 0%, transparent 60%), radial-gradient(ellipse at 85% 0%, #d6e6f2 0%, transparent 55%);"></div>

              <!-- Confetti dots -->
              <div aria-hidden="true" class="absolute inset-0 pointer-events-none overflow-hidden">
                <span class="absolute top-4 left-8 w-1.5 h-1.5 rounded-full bg-race-blue/25"></span>
                <span class="absolute top-10 left-20 w-1 h-1 rounded-full bg-yellow-300/50"></span>
                <span class="absolute top-3 right-12 w-2 h-1 rounded-full bg-race-blue/15"></span>
                <span class="absolute top-14 right-8 w-1 h-1 rounded-full bg-yellow-400/40"></span>
              </div>

              <!-- Header -->
              <div class="relative px-6 pt-6 pb-3 flex items-center justify-between">
                <div>
                  <p class="font-racing text-[9px] uppercase tracking-[0.4em] text-race-blue/60">Uno's First · 2026</p>
                  <p class="font-racing text-race-black text-lg leading-tight tracking-wide mt-0.5">Pit Crew Pass</p>
                </div>
                <img src="~/assets/images/icons/trophy.svg" aria-hidden="true" class="w-10 h-10" />
              </div>

              <!-- Divider -->
              <div class="mx-6 h-px bg-race-blue/20"></div>


              <!-- Member name hero -->
              <div class="px-6 py-6 text-center">
                <img src="~/assets/images/flag5.png" alt="" aria-hidden="true" class="w-18 h-12 mx-auto mb-2 select-none" />
                <p class="font-racing text-[9px] uppercase tracking-[0.35em] text-race-gray/40 mb-1">Certified Race Driver</p>
                <p class="font-racing text-race-black leading-tight" style="font-size: clamp(1.6rem, 8vw, 2.4rem);">{{ form.name || 'Pit Crew Member' }}</p>
                <p class="font-script text-race-blue/60 text-xl mt-1 leading-none">Uno's Pit Crew</p>
              </div>

              <!-- Stats row -->
              <div class="mx-6 mb-5 grid grid-cols-3 divide-x divide-race-blue/15 bg-race-blue/5 rounded-xl overflow-hidden border border-race-blue/15">
                <div class="px-3 py-3 text-center">
                  <p class="font-racing text-[8px] uppercase tracking-[0.2em] text-race-gray/40 mb-0.5">Fuel</p>
                  <p class="font-racing text-race-black text-sm leading-tight">₱{{ Number(form.amount || 0).toLocaleString('en-PH') }}</p>
                </div>
                <div class="px-3 py-3 text-center">
                  <p class="font-racing text-[8px] uppercase tracking-[0.2em] text-race-gray/40 mb-0.5">Pass No.</p>
                  <p class="font-racing text-race-black text-sm leading-tight">#{{ String(contributionNumber || 1).padStart(3, '0') }}</p>
                </div>
                <div class="px-3 py-3 text-center">
                  <p class="font-racing text-[8px] uppercase tracking-[0.2em] text-race-gray/40 mb-0.5">Season</p>
                  <p class="font-racing text-race-black text-sm leading-tight">'26</p>
                </div>
              </div>

              <!-- Bottom bar -->
              <div class="bg-race-black/5 px-6 py-3 flex items-center justify-between">
                <p class="font-sans text-[9px] text-race-gray/40 leading-tight">{{ submittedDate || 'July 31, 2026' }}</p>
                <p class="font-script text-race-blue/50 text-base leading-none">Uno's First</p>
              </div>

            </div>

            <!-- Closing note -->
            <p class="font-sans text-[10px] text-race-gray/45 text-center leading-relaxed max-w-[260px] flex-shrink-0">
              Every lap begins with a little fuel. Thank you for helping Uno race toward his biggest finish line.
            </p>

            <!-- Back button -->
            <button
              @click="closeDrawer"
              class="flex-shrink-0 font-racing text-xs uppercase tracking-widest text-race-blue border border-race-blue/40 px-8 py-2.5 rounded-full hover:bg-race-blue hover:text-white transition-colors"
            >Back to the race</button>

          </div>
        </div>

        <!-- Form -->
        <div v-else class="flex-1 min-h-0 overflow-y-auto px-6 py-8 flex flex-col gap-6">
          <div class="text-center">
            <div class="flex items-center justify-center gap-2">
              <img src="~/assets/images/left-flag.svg" alt="" aria-hidden="true" class="w-7 h-7 select-none" />
              <p class="font-racing text-2xl tracking-wide w-fit">Fuel Uno's Journey</p>
              <img src="~/assets/images/right-flag.svg" alt="" aria-hidden="true" class="w-7 h-7 select-none" />
            </div>
            <p class="font-sans text-xs text-race-gray/60 text-center">Scan the QR with GCash, then tell us about your gift below.</p>
          </div>

          <!-- QR code -->
          <div class="relative w-full flex flex-col items-center">

            <!-- Scene container -->
            <div class="relative w-full flex items-end justify-center pt-4 pb-0">

              <!-- Cone: overlaps QR left -->
              <img src="~/assets/images/qr-elements/13.png" alt="" aria-hidden="true"
                class="relative z-20 w-16 -mr-5 select-none" />

              <!-- QR frame -->
              <div class="relative z-10 flex flex-col items-center">
                <!-- Tape strip -->
                <div class="absolute -top-3 left-1/2 -translate-x-1/2 w-12 h-5 rounded-sm bg-race-blue/30 rotate-[-2deg] z-30 pointer-events-none"></div>

                <!-- Outer rounded dashed border -->
                <div class="border-2 border-dashed border-race-blue/50 rounded-2xl p-2.5 bg-white shadow-md">
                  <img
                    v-if="qrCodeAvailable"
                    :src="QR_CODE_URL"
                    alt="GCash QR code for Uno's college fund"
                    class="w-44 h-44 object-contain"
                  />
                  <div v-else class="w-44 h-44 bg-race-gray/8 border border-race-gray/20 flex items-center justify-center">
                    <p class="font-sans text-[10px] text-race-gray/50 text-center uppercase tracking-wider leading-relaxed">GCash QR<br/>coming soon</p>
                  </div>
                </div>
              </div>

              <!-- Tires: overlaps QR right -->
              <img src="~/assets/images/qr-elements/14.png" alt="" aria-hidden="true"
                class="relative z-20 w-20 -ml-3 select-none" />

            </div>

            <!-- Road background -->
            <img src="~/assets/images/qr-elements/12.png" alt="" aria-hidden="true"
              class="w-full select-none -mt-[3rem] relative z-0" />

            <!-- Download button -->
            <button
              v-if="qrCodeAvailable"
              type="button"
              @click="downloadQrCode"
              class="mt-2 font-sans text-[10px] uppercase tracking-[0.2em] text-race-blue hover:text-race-black transition-colors"
            >
              Download QR Code
            </button>
          </div>
          <!-- Name -->
          <div class="flex flex-col gap-1.5">
            <label class="flex items-center gap-1.5 font-racing text-[10px] uppercase tracking-[0.3em] text-race-gray">
              <img src="~/assets/images/icons/helment-icon.svg" aria-hidden="true" class="w-6 h-6" />
              Your Name
            </label>
            <input
              v-model="form.name"
              type="text"
              placeholder="e.g. Tito Boy"
              class="border border-race-gray/25 px-4 py-3 font-sans text-sm text-race-black placeholder:text-race-gray/35 focus:outline-none focus:border-race-blue transition-colors"
            />
          </div>

          <!-- Amount -->
          <div class="flex flex-col gap-1.5">
            <label class="flex items-center gap-1.5 font-racing text-[10px] uppercase tracking-[0.3em] text-race-gray">
              <img src="~/assets/images/icons/fuel-icon.svg" aria-hidden="true" class="w-6 h-6" />
              Race Fuel Amount (₱)
            </label>
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
            <p class="font-sans text-xs text-race-gray/50">Any amount helps fuel Uno reach his finish line!</p>
          </div>

          <!-- Screenshot -->
          <div class="flex flex-col gap-1.5">
            <label class="flex items-center gap-1.5 font-racing text-[10px] uppercase tracking-[0.3em] text-race-gray">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
              Proof of Transfer
            </label>
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
                <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
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
            <label class="flex items-center gap-1.5 font-racing text-[10px] uppercase tracking-[0.3em] text-race-gray">
              <img src="~/assets/images/icons/message-icon.svg" aria-hidden="true" class="w-6 h-6" />
              Message <span class="text-race-gray/40 normal-case font-sans tracking-normal ml-1">(optional)</span>
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
            <img v-if="!submitting" src="~/assets/images/icons/trophy.svg" aria-hidden="true" class="w-6 h-8 inline-block mr-2 -mt-0.5" />
            {{ submitting ? 'Sending Gift...' : `I've Sent My Gift` }}
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

.receipt-bg {
  background-color: #f5f5f0;
  background-image: url('~/assets/images/paperbg.png');
  background-size: cover;
  background-repeat: no-repeat;
  background-blend-mode: multiply;
}
</style>
