<script setup lang="ts">
const MAX_PHOTOS = 10
const slots = ref<Array<{ preview: string | null; uploading: boolean; error: string | null }>>(
  Array.from({ length: MAX_PHOTOS }, () => ({ preview: null, uploading: false, error: null }))
)
const filled = computed(() => slots.value.filter(s => s.preview !== null).length)

async function handleFile(index: number, event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    slots.value[index].preview = e.target?.result as string
  }
  reader.readAsDataURL(file)

  slots.value[index].uploading = true
  slots.value[index].error = null

  try {
    const form = new FormData()
    form.append('file', file)
    await $fetch('/api/upload', { method: 'POST', body: form })
  } catch {
    slots.value[index].error = 'Upload failed'
  } finally {
    slots.value[index].uploading = false
  }
}

function clearSlot(index: number) {
  slots.value[index].preview = null
  slots.value[index].error = null
}
</script>

<template>
  <section id="camera" class="py-20 px-4 bg-white">
    <div class="max-w-3xl mx-auto">
      <h2 class="font-racing text-5xl text-center text-race-black mb-2 tracking-wide">Disposable Camera</h2>
      <p class="font-sans text-xs uppercase tracking-widest text-race-gray text-center mb-2">
        {{ filled }} / {{ MAX_PHOTOS }} shots used
      </p>
      <p class="font-sans text-sm text-race-gray/70 text-center mb-10">
        Snap your favorite moments from the party. Each guest gets {{ MAX_PHOTOS }} shots.
      </p>

      <div class="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div
          v-for="(slot, i) in slots"
          :key="i"
          class="relative aspect-square rounded-lg overflow-hidden border-2 border-dashed transition-all"
          :class="slot.preview ? 'border-transparent' : 'border-race-blue-light hover:border-race-blue'"
        >
          <!-- Filled slot -->
          <template v-if="slot.preview">
            <img :src="slot.preview" class="w-full h-full object-cover" alt="Photo" />
            <div v-if="slot.uploading" class="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span class="font-sans text-white text-[10px] uppercase tracking-widest">Uploading…</span>
            </div>
            <div v-else-if="slot.error" class="absolute inset-0 bg-red-900/70 flex items-center justify-center">
              <span class="font-sans text-white text-[10px] uppercase tracking-widest">Failed</span>
            </div>
            <button
              v-else
              class="absolute top-1 right-1 bg-black/60 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-black"
              @click="clearSlot(i)"
            >
              ×
            </button>
            <span class="absolute bottom-1 left-1 font-racing text-white text-xs opacity-70">#{{ String(i + 1).padStart(2, '0') }}</span>
          </template>

          <!-- Empty slot -->
          <template v-else>
            <label class="w-full h-full flex flex-col items-center justify-center cursor-pointer gap-1">
              <span class="text-2xl text-race-blue-light">+</span>
              <span class="font-sans text-[10px] uppercase tracking-widest text-race-blue-light">{{ String(i + 1).padStart(2, '0') }}</span>
              <input type="file" accept="image/*" class="sr-only" @change="handleFile(i, $event)" />
            </label>
          </template>
        </div>
      </div>

      <p class="font-sans text-[10px] text-race-gray/40 text-center mt-6">
        Photos are uploaded securely and saved for Uno's big day.
      </p>
    </div>
  </section>
</template>
