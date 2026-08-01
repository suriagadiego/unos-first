<script setup lang="ts">
const title = 'Uno is turning ONE! 🏁'
const description = 'View the invitation and RSVP for Uno’s first birthday celebration.'
const url = 'https://unosfirst.com/invite'
const image = 'https://unosfirst.com/uno-preview-v2.jpg'
const imageAlt = 'Uno is turning one — September 6, 2026, at Santo Domingo Church and Steelworld Tower.'

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
  ogType: 'website',
  ogUrl: url,
  ogImage: image,
  ogImageSecureUrl: image,
  ogImageType: 'image/jpeg',
  ogImageWidth: 1200,
  ogImageHeight: 630,
  ogImageAlt: imageAlt,
  twitterCard: 'summary_large_image',
  twitterTitle: title,
  twitterDescription: description,
  twitterImage: image,
})

useHead({
  link: [{ rel: 'canonical', href: url }],
})
</script>

<template>
  <BirthdayWebsite />
</template>
