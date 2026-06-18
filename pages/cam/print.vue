<script setup lang="ts">
definePageMeta({ layout: false })

const qrDataUrl = ref<string | null>(null)
const camUrl = ref('')

onMounted(async () => {
  camUrl.value = `${window.location.origin}/cam`
  const QRCode = (await import('qrcode')).default
  qrDataUrl.value = await QRCode.toDataURL(camUrl.value, {
    width: 400,
    margin: 2,
    color: { dark: '#080808', light: '#ffffff' },
  })
})
</script>

<template>
  <div class="min-h-[100dvh] bg-white flex flex-col items-center justify-center p-10 gap-8 print:p-4">

    <!-- Header -->
    <div class="text-center">
      <p class="font-racing text-4xl text-race-black tracking-widest">UNO CAM</p>
      <p class="font-sans text-race-gray text-sm uppercase tracking-widest mt-1">FAST ONE · SEPT 6 2026</p>
    </div>

    <!-- QR Code -->
    <div class="p-5 border-4 border-race-black rounded-2xl">
      <img v-if="qrDataUrl" :src="qrDataUrl" class="w-60 h-60" alt="QR code" />
      <div v-else class="w-60 h-60 flex items-center justify-center">
        <div class="w-8 h-8 rounded-full border-2 border-race-blue border-t-transparent animate-spin" />
      </div>
    </div>

    <!-- Instructions -->
    <div class="text-center max-w-xs">
      <p class="font-racing text-race-blue text-xl tracking-widest mb-3">SCAN TO SHOOT</p>
      <ol class="font-sans text-race-gray text-sm space-y-1.5 text-left list-decimal list-inside">
        <li>Point your camera at the QR code</li>
        <li>Tap to open the camera in Safari or Chrome</li>
        <li>Allow camera access and start shooting</li>
        <li>Your shots appear in the shared gallery</li>
      </ol>
    </div>

    <!-- URL fallback -->
    <p class="font-sans text-race-gray/50 text-xs text-center">
      Or type: <span class="font-mono text-race-black font-semibold">{{ camUrl }}</span>
    </p>

    <!-- Print button -->
    <button
      class="print:hidden px-6 py-3 rounded-xl bg-race-black text-white font-sans text-sm font-medium hover:bg-race-gray transition-colors"
      onclick="window.print()">
      Print this page
    </button>
  </div>
</template>

<style scoped>
@media print {
  button { display: none !important; }
}
</style>
