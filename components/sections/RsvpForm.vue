<script setup lang="ts">
const form = reactive({
  name: '',
  attending: '' as 'yes' | 'no' | '',
  attendees: [] as string[],
  isKid: [] as boolean[],
  dietary: '',
})

const submitted = ref(false)
const loading = ref(false)
const error = ref('')
const soloConfirmOpen = ref(false)
const submissionResult = ref<{
  id: string | number
  attending: boolean
  displayName: string
  gridPosition?: number
  teamName?: string
} | null>(null)
const nameTouched = ref(false)
const nameInvalid = computed(() => nameTouched.value && form.name.trim().split(/\s+/).filter(Boolean).length < 2)

function addAttendee() {
  if (form.attendees.length < 9) {
    form.attendees.push('')
    form.isKid.push(false)
  }
}

function removeAttendee(i: number) {
  form.attendees.splice(i, 1)
  form.isKid.splice(i, 1)
}

function addGuestFromConfirmation() {
  soloConfirmOpen.value = false
  if (form.attendees.length === 0) addAttendee()
}

function viewTeamOnGrid() {
  if (!submissionResult.value?.id) return
  window.dispatchEvent(new CustomEvent('rsvp:reveal-team', {
    detail: { id: submissionResult.value.id },
  }))
}

async function submit(soloConfirmed = false) {
  nameTouched.value = true
  if (!form.name || !form.attending) {
    error.value = 'Please fill in your name and RSVP status.'
    return
  }
  if (nameInvalid.value) {
    error.value = 'Please enter your full name.'
    return
  }
  const extraGuests = form.attendees.map(n => n.trim()).filter(Boolean)
  const filledKids = form.attendees
    .map((n, i) => (form.isKid[i] ? n.trim() : ''))
    .filter(Boolean)
  if (form.attending === 'yes' && extraGuests.length === 0 && !soloConfirmed) {
    soloConfirmOpen.value = true
    return
  }
  const allGuests = form.attending === 'yes' ? [form.name.trim(), ...extraGuests] : []
  error.value = ''
  loading.value = true

  try {
    const result = await $fetch<{
      id: string | number
      attending: boolean
      displayName: string
      gridPosition?: number
      teamName?: string
    }>('/api/public/rsvps', {
      method: 'POST',
      body: {
        displayName: form.name,
        submitterName: form.name,
        guestNames: allGuests,
        kidsNames: form.attending === 'yes' ? filledKids : [],
        headcount: allGuests.length,
        dietaryNotes: form.dietary || null,
        attending: form.attending,
      },
    })
    submissionResult.value = result
    submitted.value = true
    await refreshNuxtData('public-rsvps')
  } catch {
    error.value = 'Something went wrong. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <section id="rsvp" class="relative overflow-hidden py-20 px-4 bg-race-black/[0.97]">
    <!-- Tire mark overlay -->
    <div aria-hidden="true" class="absolute inset-0 pointer-events-none select-none overflow-hidden">
      <!-- Mobile: single S-curve, zoomed -->
      <img
        src="~/assets/images/optimized/tiremarks/tiremarks.webp"
        alt=""
        loading="lazy"
        decoding="async"
        class="md:hidden absolute top-0 left-1/2 h-[130%] w-auto opacity-[0.03]"
        style="filter: invert(1); mix-blend-mode: screen; transform: translateX(-50%) rotate(45deg) scale(1.35);"
      />
      <!-- Desktop: left S-curve -->
      <img
        src="~/assets/images/optimized/tiremarks/tiremarks.webp"
        alt=""
        loading="lazy"
        decoding="async"
        class="hidden md:block absolute top-0 -left-16 h-[105%] w-auto opacity-[0.03]"
        style="filter: invert(1); mix-blend-mode: screen; transform: rotate(5deg);"
      />
      <!-- Desktop: right S-curve, mirrored — offset vertically to break symmetry -->
      <img
        src="~/assets/images/optimized/tiremarks/tiremarks.webp"
        alt=""
        loading="lazy"
        decoding="async"
        class="hidden md:block absolute top-0 -right-16 h-[120%] w-auto opacity-[0.03]"
        style="filter: invert(1); mix-blend-mode: screen; transform: scaleX(-1) rotate(180deg);"
      />
    </div>

    <div class="max-w-lg mx-auto relative">
      <h2 class="font-racing text-5xl text-center mb-2 tracking-wide" style="color: #f5f0eb;">RSVP</h2>
      <p class="font-sans text-xs uppercase tracking-widest text-race-gray text-center mb-10">
        Deadline: August 30, 2026
      </p>

      <Transition name="fade">
        <div v-if="submitted" class="rsvp-success relative overflow-hidden border border-white/10 bg-white/[0.035] px-5 py-9 text-center sm:px-8">
          <div class="checkered-sweep absolute inset-x-0 top-0 h-2" aria-hidden="true" />

          <template v-if="submissionResult?.attending">
            <p class="success-eyebrow font-sans text-[9px] font-semibold uppercase tracking-[0.42em] text-race-blue">
              Entry confirmed
            </p>
            <p class="success-title mt-3 font-racing text-4xl leading-none text-[#f5f0eb] sm:text-5xl">
              You're on the grid!
            </p>

            <div class="success-details mx-auto mt-7 flex max-w-xs items-center justify-center gap-5">
              <div v-if="submissionResult.gridPosition" class="shrink-0 text-left">
                <p class="font-racing text-4xl leading-none text-race-blue">
                  P{{ String(submissionResult.gridPosition).padStart(2, '0') }}
                </p>
                <p class="mt-1 font-sans text-[8px] uppercase tracking-[0.28em] text-white/35">Starting position</p>
              </div>
              <div v-if="submissionResult.gridPosition && submissionResult.teamName" class="h-12 w-px bg-white/10" />
              <div v-if="submissionResult.teamName" class="min-w-0 text-left">
                <p class="font-racing text-xl leading-tight text-[#f5f0eb]">{{ submissionResult.teamName }}</p>
                <p class="mt-1 font-sans text-[8px] uppercase tracking-[0.28em] text-white/35">Official team</p>
              </div>
            </div>

            <p class="success-copy mt-6 font-sans text-sm text-race-gray">
              See you at the starting line, {{ submissionResult.displayName }}.
            </p>
            <button
              type="button"
              class="success-action mt-7 min-h-12 w-full bg-race-blue px-5 font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-white transition-colors hover:bg-race-blue/80"
              @click="viewTeamOnGrid"
            >
              See my team on the grid ↓
            </button>
          </template>

          <template v-else>
            <p class="font-sans text-[9px] font-semibold uppercase tracking-[0.42em] text-race-blue">Response received</p>
            <p class="mt-3 font-racing text-4xl leading-none text-[#f5f0eb]">We'll miss you!</p>
            <p class="mt-5 font-sans text-sm leading-relaxed text-race-gray">
              Thanks for letting us know, {{ submissionResult?.displayName || form.name }}.
            </p>
          </template>
        </div>

        <form v-else class="flex flex-col gap-5" @submit.prevent="submit()">
          <!-- Name -->
          <div>
            <label class="block font-sans text-xs uppercase tracking-widest text-white/70 mb-2">Your Full Name</label>
            <input
              v-model="form.name"
              type="text"
              placeholder="Your Full Name"
              class="w-full bg-white/5 font-sans text-sm px-4 py-3 focus:outline-none transition-colors placeholder:text-white/30 border"
              :class="nameInvalid ? 'border-red-500 focus:border-red-500' : 'border-white/10 focus:border-race-blue'"
              style="color: #f5f0eb;"
              @blur="nameTouched = true"
            />
            <p v-if="nameInvalid" class="mt-1 font-sans text-xs text-red-400">Please enter your full name.</p>
          </div>

          <!-- Attending -->
          <div>
            <label class="block font-sans text-xs uppercase tracking-widest text-white/70 mb-2">Will you attend?</label>
            <div class="flex gap-3">
              <button
                type="button"
                class="flex-1 py-3 font-sans text-sm uppercase tracking-widest transition-all"
                :class="form.attending === 'yes'
                  ? 'bg-race-blue text-white'
                  : 'bg-white/5 text-white/60 border border-white/10 hover:border-race-blue/50'"
                @click="form.attending = 'yes'"
              >
                Vroom, I'm in!
              </button>
              <button
                type="button"
                class="flex-1 py-3 font-sans text-sm uppercase tracking-widest transition-all"
                :class="form.attending === 'no'
                  ? 'bg-race-gray text-white'
                  : 'bg-white/5 text-white/60 border border-white/10 hover:border-white/30'"
                @click="form.attending = 'no'"
              >
                Can't make it
              </button>
            </div>
          </div>

          <!-- Additional guests -->
          <div v-if="form.attending === 'yes'">
            <label class="block font-sans text-xs uppercase tracking-widest text-white/70 mb-2">
              Who else is coming? <span class="normal-case">(optional)</span>
            </label>
            <div class="flex flex-col gap-3">
              <div v-for="(_, i) in form.attendees" :key="i">
                <div class="flex items-center gap-2">
                  <input
                    v-model="form.attendees[i]"
                    type="text"
                    :placeholder="`Guest ${i + 1} name`"
                    class="min-w-0 flex-1 bg-white/5 border border-white/10 font-sans text-sm px-4 py-3 focus:outline-none focus:border-race-blue transition-colors placeholder:text-white/30"
                    style="color: #f5f0eb;"
                  />
                  <div
                    class="relative grid h-10 w-[7.25rem] shrink-0 grid-cols-2 rounded-full border border-white/15 bg-black/20 p-1"
                    role="group"
                    :aria-label="`Guest ${i + 1} type`"
                  >
                    <span
                      aria-hidden="true"
                      class="absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-full bg-race-blue shadow-sm transition-transform duration-300 ease-out motion-reduce:transition-none"
                      :class="form.isKid[i] ? 'translate-x-full' : 'translate-x-0'"
                    />
                    <button
                      type="button"
                      class="relative z-10 rounded-full font-sans text-[9px] font-semibold uppercase tracking-wider transition-colors duration-200"
                      :class="!form.isKid[i] ? 'text-white' : 'text-white/45 hover:text-white/70'"
                      :aria-pressed="!form.isKid[i]"
                      @click="form.isKid[i] = false"
                    >Adult</button>
                    <button
                      type="button"
                      class="relative z-10 rounded-full font-sans text-[9px] font-semibold uppercase tracking-wider transition-colors duration-200"
                      :class="form.isKid[i] ? 'text-white' : 'text-white/45 hover:text-white/70'"
                      :aria-pressed="form.isKid[i]"
                      @click="form.isKid[i] = true"
                    >Kid</button>
                  </div>
                  <button
                    type="button"
                    class="min-h-11 min-w-11 text-white/40 hover:text-white/70 transition-colors font-sans text-xl leading-none"
                    :aria-label="`Remove guest ${i + 1}`"
                    @click="removeAttendee(i)"
                  >×</button>
                </div>
              </div>
            </div>
            <button
              v-if="form.attendees.length < 9"
              type="button"
              class="mt-3 flex min-h-12 w-full items-center justify-center gap-2 border border-race-blue/50 bg-race-blue/10 px-4 font-sans text-xs font-semibold uppercase tracking-[0.16em] text-race-blue transition-all hover:border-race-blue hover:bg-race-blue hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-race-blue"
              @click="addAttendee"
            >
              <span aria-hidden="true" class="text-lg font-normal leading-none">+</span>
              <span>Add another guest</span>
            </button>
          </div>

          <!-- Dietary -->
          <div v-if="form.attending === 'yes'">
            <label class="block font-sans text-xs uppercase tracking-widest text-white/70 mb-2">
              Dietary notes <span class="normal-case">(optional)</span>
            </label>
            <input
              v-model="form.dietary"
              type="text"
              placeholder="Allergies, restrictions, etc."
              class="w-full bg-white/5 border border-white/10 font-sans text-sm px-4 py-3 focus:outline-none focus:border-race-blue transition-colors placeholder:text-white/30"
              style="color: #f5f0eb;"
            />
          </div>

          <p v-if="error" class="font-sans text-xs text-red-400">{{ error }}</p>

          <button
            type="submit"
            :disabled="loading"
            class="mt-2 bg-race-blue font-sans text-sm uppercase tracking-widest py-4 hover:bg-race-blue/80 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            style="color: #f5f0eb;"
          >
            {{ loading ? 'Submitting…' : 'Submit RSVP' }}
          </button>
        </form>
      </Transition>
    </div>

    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="soloConfirmOpen"
          class="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="solo-confirm-title"
          @click.self="soloConfirmOpen = false"
          @keydown.esc="soloConfirmOpen = false"
        >
          <div class="w-full max-w-sm border border-white/15 bg-[#171717] p-6 shadow-2xl">
            <p class="mb-2 font-sans text-[9px] font-semibold uppercase tracking-[0.4em] text-race-blue">Solo Entry</p>
            <h3 id="solo-confirm-title" class="font-racing text-3xl leading-none text-[#f5f0eb]">Racing solo?</h3>
            <p class="mt-3 font-sans text-sm leading-relaxed text-white/55">
              You haven't added another guest. Are you sure you're coming to Uno's birthday party on your own?
            </p>

            <div class="mt-6 flex flex-col gap-2">
              <button
                type="button"
                class="min-h-12 bg-race-blue px-4 font-sans text-xs font-semibold uppercase tracking-[0.16em] text-white transition-colors hover:bg-race-blue/80"
                @click="soloConfirmOpen = false; submit(true)"
              >
                Yes, just me
              </button>
              <button
                type="button"
                class="min-h-12 border border-white/15 bg-white/5 px-4 font-sans text-xs font-semibold uppercase tracking-[0.16em] text-white/70 transition-colors hover:border-race-blue/60 hover:text-white"
                @click="addGuestFromConfirmation"
              >
                Go back & add a guest
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </section>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.4s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

.checkered-sweep {
  background-color: #f5f0eb;
  background-image:
    linear-gradient(45deg, #171717 25%, transparent 25%, transparent 75%, #171717 75%),
    linear-gradient(45deg, #171717 25%, transparent 25%, transparent 75%, #171717 75%);
  background-position: 0 0, 8px 8px;
  background-size: 16px 16px;
  transform-origin: left;
  animation: flag-sweep 850ms cubic-bezier(0.22, 1, 0.36, 1) both;
}

.success-eyebrow,
.success-title,
.success-details,
.success-copy,
.success-action {
  opacity: 0;
  animation: success-rise 480ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
}

.success-eyebrow { animation-delay: 180ms; }
.success-title { animation-delay: 260ms; }
.success-details { animation-delay: 390ms; }
.success-copy { animation-delay: 500ms; }
.success-action { animation-delay: 610ms; }

@keyframes flag-sweep {
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
}

@keyframes success-rise {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .checkered-sweep,
  .success-eyebrow,
  .success-title,
  .success-details,
  .success-copy,
  .success-action {
    animation: none;
    opacity: 1;
  }
}
</style>
