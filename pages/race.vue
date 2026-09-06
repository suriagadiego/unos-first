<script setup lang="ts">
definePageMeta({ layout: false })

// Destination for the code. Set NUXT_PUBLIC_RACE_QR_URL to point it somewhere
// else without touching the source; otherwise it falls back to the constant in
// utils/raceQr.ts.
const config = useRuntimeConfig()
const target = (config.public.raceQrUrl as string) || RACE_QR_DEFAULT_TARGET

const title = "Uno's First Fast Run"
const description = 'Tap the car, watch the racetrack become a QR code, then scan it to open the camera and snap your Uno memories.'
const url = 'https://unosfirst.com/race'
const image = 'https://unosfirst.com/uno-preview.jpg'

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
  ogType: 'website',
  ogUrl: url,
  ogImage: image,
  ogImageWidth: 1200,
  ogImageHeight: 630,
  twitterCard: 'summary_large_image',
  twitterTitle: title,
  twitterDescription: description,
  twitterImage: image,
})

useHead({
  link: [{ rel: 'canonical', href: url }],
  // The stage is full-bleed and drives its own layout; nothing here should scroll.
  bodyAttrs: { class: 'race-page-body' },
})
</script>

<template>
  <main>
    <RaceStage :target="target" />
  </main>
</template>

<style>
/* Global on purpose: the site body carries a paper texture and scroll behaviour
   that would fight a fixed, full-bleed canvas. Scoped to this page via bodyAttrs. */
body.race-page-body {
  background-image: none;
  background-color: #0d0d0d;
  overflow: hidden;
  overscroll-behavior: none;
}
</style>
