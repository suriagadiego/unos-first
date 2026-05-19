<script setup lang="ts">
const form = reactive({
  name: '',
  guests: 1,
  attending: '' as 'yes' | 'no' | '',
  dietary: '',
})

const submitted = ref(false)
const error = ref('')

function submit() {
  if (!form.name || !form.attending) {
    error.value = 'Please fill in your name and RSVP status.'
    return
  }
  error.value = ''
  submitted.value = true
}
</script>

<template>
  <section id="rsvp" class="py-20 px-4 bg-race-black">
    <div class="max-w-lg mx-auto">
      <h2 class="font-racing text-5xl text-white text-center mb-2 tracking-wide">RSVP</h2>
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
            <label class="block font-sans text-xs uppercase tracking-widest text-race-gray mb-2">Full Name</label>
            <input
              v-model="form.name"
              type="text"
              placeholder="Your name"
              class="w-full bg-white/5 border border-white/10 text-white font-sans text-sm px-4 py-3 rounded focus:outline-none focus:border-race-blue transition-colors placeholder:text-white/30"
            />
          </div>

          <!-- Attending -->
          <div>
            <label class="block font-sans text-xs uppercase tracking-widest text-race-gray mb-2">Will you attend?</label>
            <div class="flex gap-3">
              <button
                type="button"
                class="flex-1 py-3 rounded font-sans text-sm uppercase tracking-widest transition-all"
                :class="form.attending === 'yes'
                  ? 'bg-race-blue text-white'
                  : 'bg-white/5 text-white/60 border border-white/10 hover:border-race-blue/50'"
                @click="form.attending = 'yes'"
              >
                Vroom, I'm in!
              </button>
              <button
                type="button"
                class="flex-1 py-3 rounded font-sans text-sm uppercase tracking-widest transition-all"
                :class="form.attending === 'no'
                  ? 'bg-race-gray text-white'
                  : 'bg-white/5 text-white/60 border border-white/10 hover:border-white/30'"
                @click="form.attending = 'no'"
              >
                Can't make it
              </button>
            </div>
          </div>

          <!-- Guest count -->
          <div v-if="form.attending === 'yes'">
            <label class="block font-sans text-xs uppercase tracking-widest text-race-gray mb-2">Number of guests</label>
            <select
              v-model="form.guests"
              class="w-full bg-white/5 border border-white/10 text-white font-sans text-sm px-4 py-3 rounded focus:outline-none focus:border-race-blue transition-colors"
            >
              <option v-for="n in 8" :key="n" :value="n">{{ n }}</option>
            </select>
          </div>

          <!-- Dietary -->
          <div v-if="form.attending === 'yes'">
            <label class="block font-sans text-xs uppercase tracking-widest text-race-gray mb-2">Dietary notes <span class="normal-case">(optional)</span></label>
            <input
              v-model="form.dietary"
              type="text"
              placeholder="Allergies, restrictions, etc."
              class="w-full bg-white/5 border border-white/10 text-white font-sans text-sm px-4 py-3 rounded focus:outline-none focus:border-race-blue transition-colors placeholder:text-white/30"
            />
          </div>

          <p v-if="error" class="font-sans text-xs text-red-400">{{ error }}</p>

          <button
            type="submit"
            class="mt-2 bg-race-blue text-white font-sans text-sm uppercase tracking-widest py-4 rounded hover:bg-race-blue/80 transition-colors"
          >
            Submit RSVP
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

select option {
  background: #1a1a1a;
}
</style>
