<script setup lang="ts">
const UNLOCK_DATE = new Date('2044-09-06')
const { days } = useCountdown(UNLOCK_DATE)

const form = reactive({ name: '', message: '' })
const submitted = ref(false)
const error = ref('')

function submit() {
  if (!form.name || !form.message) {
    error.value = 'Please write your name and a message for Uno.'
    return
  }
  error.value = ''
  submitted.value = true
}
</script>

<template>
  <section id="timecapsule" class="py-20 px-4 bg-gray-50">
    <div class="max-w-lg mx-auto text-center">
      <!-- Lock icon -->
      <div class="flex justify-center mb-4">
        <div class="w-16 h-16 rounded-full bg-race-blue-light/30 flex items-center justify-center text-3xl">
          🔒
        </div>
      </div>

      <h2 class="font-racing text-5xl text-race-black mb-2 tracking-wide">Time Capsule</h2>
      <p class="font-sans text-sm text-race-gray mb-1">
        Leave a message for Uno — he'll read it on his 18th birthday.
      </p>
      <p class="font-sans text-xs uppercase tracking-widest text-race-blue mb-2">
        Sealed until September 6, 2044
      </p>
      <p class="font-sans text-xs text-race-gray/60 mb-10">
        {{ days }} days from now
      </p>

      <Transition name="fade">
        <div v-if="submitted" class="py-10">
          <p class="font-racing text-3xl text-race-blue mb-2">Message Sealed!</p>
          <p class="font-sans text-sm text-race-gray">
            Uno will read your note in 2044, {{ form.name }}.
          </p>
        </div>

        <form v-else class="flex flex-col gap-4 text-left" @submit.prevent="submit">
          <div>
            <label class="block font-sans text-xs uppercase tracking-widest text-race-gray mb-2">Your Name</label>
            <input
              v-model="form.name"
              type="text"
              placeholder="Who's leaving this message?"
              class="w-full border border-race-blue-light bg-white text-race-black font-sans text-sm px-4 py-3 rounded focus:outline-none focus:border-race-blue transition-colors placeholder:text-race-gray/40"
            />
          </div>

          <div>
            <label class="block font-sans text-xs uppercase tracking-widest text-race-gray mb-2">Your Message</label>
            <textarea
              v-model="form.message"
              rows="5"
              placeholder="Dear Uno, when you read this you'll be 18..."
              class="w-full border border-race-blue-light bg-white text-race-black font-sans text-sm px-4 py-3 rounded focus:outline-none focus:border-race-blue transition-colors placeholder:text-race-gray/40 resize-none"
            />
          </div>

          <p v-if="error" class="font-sans text-xs text-red-500">{{ error }}</p>

          <button
            type="submit"
            class="bg-race-blue text-white font-sans text-sm uppercase tracking-widest py-4 rounded hover:bg-race-blue/80 transition-colors"
          >
            Seal Message
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
