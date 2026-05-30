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

async function submit() {
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
  const allGuests = form.attending === 'yes' ? [form.name.trim(), ...extraGuests] : []
  error.value = ''
  loading.value = true

  try {
    await $fetch('/api/public/rsvps', {
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
    submitted.value = true
    refreshNuxtData('public-rsvps')
  } catch {
    error.value = 'Something went wrong. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <section id="rsvp" class="py-20 px-4 bg-race-black/[0.97]">
    <div class="max-w-lg mx-auto">
      <h2 class="font-racing text-5xl text-center mb-2 tracking-wide" style="color: #f5f0eb;">RSVP</h2>
      <p class="font-sans text-xs uppercase tracking-widest text-race-gray text-center mb-10">
        Deadline: August 30, 2026
      </p>

      <Transition name="fade">
        <div v-if="submitted" class="text-center py-12">
          <p class="font-racing text-3xl text-race-blue mb-2">You're on the grid!</p>
          <p class="font-sans text-sm text-race-gray">See you at the starting line, {{ form.name }}.</p>
        </div>

        <form v-else class="flex flex-col gap-5" @submit.prevent="submit">
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
            <div class="flex flex-col gap-2">
              <div v-for="(_, i) in form.attendees" :key="i" class="flex gap-2 items-stretch">
                <button
                  type="button"
                  class="font-sans text-[10px] font-bold uppercase tracking-widest px-3 transition-all border"
                  :class="form.isKid[i]
                    ? 'bg-amber-400 border-amber-400 text-black'
                    : 'bg-transparent border-white/10 text-white/25 hover:border-white/30 hover:text-white/40'"
                  :title="form.isKid[i] ? 'Mark as adult' : 'Mark as kid'"
                  @click="form.isKid[i] = !form.isKid[i]"
                >kid</button>
                <input
                  v-model="form.attendees[i]"
                  type="text"
                  :placeholder="`Guest ${i + 1}`"
                  class="flex-1 bg-white/5 border border-white/10 font-sans text-sm px-4 py-3 focus:outline-none focus:border-race-blue transition-colors placeholder:text-white/30"
                  style="color: #f5f0eb;"
                />
                <button
                  type="button"
                  class="text-white/30 hover:text-white/60 transition-colors px-2 font-sans text-lg leading-none"
                  @click="removeAttendee(i)"
                >×</button>
              </div>
            </div>
            <button
              v-if="form.attendees.length < 9"
              type="button"
              class="mt-2 font-sans text-[10px] uppercase tracking-widest text-race-blue hover:text-race-blue/70 transition-colors"
              @click="addAttendee"
            >
              + Add another guest
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
  </section>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.4s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
