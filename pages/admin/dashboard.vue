<template>
  <div class="space-y-6">

    <!-- Page title -->
    <div>
      <h1 class="text-xl font-bold text-gray-900">Dashboard</h1>
      <p class="text-sm text-gray-400 mt-0.5">Event: September 6, 2026 · RSVP deadline August 30</p>
    </div>

    <!-- Stat cards -->
    <div class="grid grid-cols-2 xl:grid-cols-4 gap-4">
      <div
        v-for="card in statCards"
        :key="card.label"
        class="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-start gap-4"
      >
        <div :class="card.iconBg" class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg">
          {{ card.icon }}
        </div>
        <div class="min-w-0">
          <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide truncate">{{ card.label }}</p>
          <p class="text-3xl font-bold text-gray-900 mt-0.5 leading-none">{{ card.value }}</p>
          <p v-if="card.sub" class="text-xs text-gray-400 mt-1">{{ card.sub }}</p>
        </div>
      </div>
    </div>

    <!-- Bottom row: fund + activity -->
    <div class="grid grid-cols-1 lg:grid-cols-5 gap-4">

      <!-- Fund progress (wider) -->
      <div class="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h2 class="text-sm font-bold text-gray-800">Uno's Fund</h2>
            <p class="text-xs text-gray-400">Goal: ₱{{ data?.fund.goal.toLocaleString() }}</p>
          </div>
          <NuxtLink to="/admin/fund" class="text-xs text-blue-600 hover:underline font-medium">Manage →</NuxtLink>
        </div>

        <!-- Big total -->
        <p class="text-4xl font-bold text-gray-900 mb-1">
          ₱{{ data?.fund.total.toLocaleString() }}
        </p>
        <p class="text-sm text-gray-400 mb-4">raised of ₱{{ data?.fund.goal.toLocaleString() }} goal</p>

        <!-- Progress bar -->
        <div class="h-3 bg-gray-100 rounded-full overflow-hidden mb-2">
          <div
            class="h-full rounded-full transition-all duration-700"
            :class="fundPct >= 100 ? 'bg-green-500' : fundPct >= 60 ? 'bg-blue-500' : 'bg-blue-400'"
            :style="{ width: `${Math.min(fundPct, 100)}%` }"
          />
        </div>
        <div class="flex items-center justify-between text-xs text-gray-400">
          <span>{{ fundPct }}% funded</span>
          <span>₱{{ ((data?.fund.goal ?? 0) - (data?.fund.total ?? 0)).toLocaleString() }} to go</span>
        </div>
      </div>

      <!-- Recent activity -->
      <div class="lg:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col">
        <div class="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 class="text-sm font-bold text-gray-800">Recent Activity</h2>
          <span class="text-xs text-gray-400">Last 10 actions</span>
        </div>

        <div v-if="!data?.recentActivity.length" class="flex-1 flex items-center justify-center py-12">
          <div class="text-center">
            <p class="text-2xl mb-2">📭</p>
            <p class="text-sm text-gray-400">No activity yet</p>
          </div>
        </div>

        <ul v-else class="flex-1 divide-y divide-gray-50 overflow-y-auto">
          <li
            v-for="item in data?.recentActivity"
            :key="item.id"
            class="px-5 py-3 flex items-start gap-3"
          >
            <span
              :class="actionDot(item.action)"
              class="mt-1.5 w-2 h-2 rounded-full flex-shrink-0"
            />
            <div class="flex-1 min-w-0">
              <p class="text-sm text-gray-700 truncate">{{ item.description }}</p>
              <p class="text-xs text-gray-400 mt-0.5">{{ formatDate(item.createdAt) }}</p>
            </div>
            <span
              :class="actionChip(item.action)"
              class="text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 capitalize"
            >{{ item.action.replace(/_/g, ' ') }}</span>
          </li>
        </ul>
      </div>
    </div>

    <!-- Quick links -->
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      <NuxtLink
        v-for="item in quickLinks"
        :key="item.path"
        :to="item.path"
        class="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col items-center gap-2 hover:border-blue-200 hover:shadow-md transition-all group"
      >
        <span class="text-2xl">{{ item.icon }}</span>
        <span class="text-xs font-semibold text-gray-500 group-hover:text-blue-600 transition-colors">{{ item.label }}</span>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin' })

const { data, refresh } = await useFetch<any>('/api/admin/stats')

const statCards = computed(() => [
  {
    label: 'Total RSVPs',
    value: data.value?.rsvps.total ?? 0,
    icon: '✉',
    iconBg: 'bg-blue-50',
  },
  {
    label: 'Confirmed',
    value: data.value?.rsvps.confirmed ?? 0,
    sub: `${data.value?.rsvps.confirmedHeadcount ?? 0} attendees`,
    icon: '✓',
    iconBg: 'bg-green-50',
  },
  {
    label: 'Photos',
    value: data.value?.photos.total ?? 0,
    icon: '📷',
    iconBg: 'bg-purple-50',
  },
  {
    label: 'Time Capsule',
    value: data.value?.capsule.total ?? 0,
    icon: '💌',
    iconBg: 'bg-amber-50',
  },
])

const quickLinks = [
  { path: '/admin/rsvps',      icon: '✉',  label: 'RSVPs' },
  { path: '/admin/activities', icon: '⏱', label: 'Activities' },
  { path: '/admin/photos',     icon: '📷', label: 'Photos' },
  { path: '/admin/capsule',    icon: '💌', label: 'Time Capsule' },
  { path: '/admin/fund',       icon: '💰', label: "Fund" },
]

const fundPct = computed(() => {
  if (!data.value?.fund?.goal) return 0
  return Math.round((data.value.fund.total / data.value.fund.goal) * 100)
})

function actionDot(action: string) {
  if (action.includes('delet')) return 'bg-red-400'
  if (action.includes('creat')) return 'bg-green-400'
  return 'bg-blue-400'
}
function actionChip(action: string) {
  if (action.includes('delet')) return 'bg-red-50 text-red-600'
  if (action.includes('creat')) return 'bg-green-50 text-green-600'
  return 'bg-blue-50 text-blue-600'
}
function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}
</script>
