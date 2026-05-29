<template>
  <div class="overflow-x-hidden">
    <NavBar />
    <HeroSection />
    <div class="relative h-0 z-10">
      <img src="~/assets/images/dividers/4.png" class="w-full absolute left-0 -translate-y-1/2 scale-[2.5] md:scale-[1.2]" alt="" />
    </div>
    <EventDetailsV2 />
    <CheckeredDivider height="40px" />
    <WhosComing />
    <div class="bg-race-black/[0.97] w-full flex">
      <img src="~/assets/images/dividers/1.png" class="w-full md:hidden" alt="" />
      <img src="~/assets/images/dividers/3.png" class="w-full hidden md:block" alt="" />
    </div>
    <RsvpForm />
    <CheckeredDivider height="40px" />
    <GiftGuide />
  </div>
</template>
