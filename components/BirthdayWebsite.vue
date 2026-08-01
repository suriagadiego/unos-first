<template>
  <div class="overflow-x-hidden">
    <NavBar />
    <HeroSection />
    <div class="relative h-0 z-10">
      <img src="~/assets/images/optimized/dividers/4.webp" class="w-full absolute left-0 -translate-y-1/2 scale-[2.5] md:scale-[1.2]" alt="" loading="lazy" decoding="async" />
    </div>
    <EventDetailsV2 />
    <CheckeredDivider height="40px" />
    <WhosComing />
    <div class="bg-race-black/[0.97] w-full flex">
      <img src="~/assets/images/optimized/dividers/1.webp" class="w-full md:hidden" alt="" loading="lazy" decoding="async" />
      <img src="~/assets/images/optimized/dividers/3.webp" class="w-full hidden md:block" alt="" loading="lazy" decoding="async" />
    </div>
    <RsvpForm />
    <CheckeredDivider height="40px" />
    <GiftGuideV2 />
    <SiteFooter />
  </div>
</template>
