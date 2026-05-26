<template>
  <div class="admin-layout flex h-screen overflow-hidden bg-gray-50">

    <!-- Sidebar -->
    <aside
      :class="[
        'flex-shrink-0 flex flex-col bg-slate-900 transition-all duration-200 z-40',
        sidebarOpen ? 'w-56' : 'w-0 overflow-hidden',
        'md:w-56',
      ]"
    >
      <!-- Brand -->
      <div class="flex items-center gap-2.5 px-5 py-5 border-b border-slate-700/60">
        <div class="w-7 h-7 rounded-lg bg-blue-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">U</div>
        <div class="min-w-0">
          <p class="text-white text-sm font-semibold leading-none">Uno's First</p>
          <p class="text-slate-400 text-xs mt-0.5">Admin Panel</p>
        </div>
      </div>

      <!-- Nav -->
      <nav class="flex-1 py-3 px-2 overflow-y-auto space-y-0.5">
        <NuxtLink
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all"
          :class="
            route.path === item.path
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-400 hover:bg-slate-800 hover:text-white'
          "
        >
          <span class="text-base w-5 text-center flex-shrink-0">{{ item.icon }}</span>
          <span>{{ item.label }}</span>
          <span
            v-if="item.badge"
            class="ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-slate-700 text-slate-300"
          >{{ item.badge }}</span>
        </NuxtLink>
      </nav>

      <!-- Bottom -->
      <div class="px-2 py-3 border-t border-slate-700/60">
        <button
          class="flex items-center gap-3 w-full px-3 py-2 text-sm text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-all"
          @click="logout"
        >
          <span class="text-base w-5 text-center">↩</span>
          <span>Log out</span>
        </button>
      </div>
    </aside>

    <!-- Main column -->
    <div class="flex-1 flex flex-col min-w-0 overflow-hidden">

      <!-- Top bar -->
      <header class="flex-shrink-0 flex items-center gap-3 px-5 py-3.5 bg-white border-b border-gray-200">
        <!-- Mobile hamburger -->
        <button class="md:hidden p-1.5 text-gray-500 hover:text-gray-800 rounded" @click="sidebarOpen = !sidebarOpen">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
        </button>

        <!-- Breadcrumb -->
        <div class="flex items-center gap-1.5 text-sm">
          <span class="text-gray-400">Admin</span>
          <span class="text-gray-300">/</span>
          <span class="text-gray-800 font-medium">{{ currentLabel }}</span>
        </div>

        <div class="flex-1" />

        <span class="text-xs text-gray-400 hidden sm:block">Uno's First Birthday · Sep 6, 2026</span>
      </header>

      <!-- Scrollable content -->
      <main class="flex-1 overflow-y-auto p-6">
        <slot />
      </main>
    </div>

    <!-- Mobile overlay -->
    <div
      v-if="sidebarOpen"
      class="fixed inset-0 z-30 bg-black/50 md:hidden"
      @click="sidebarOpen = false"
    />

    <!-- Toasts -->
    <div class="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none">
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium min-w-72 max-w-sm"
          :class="toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-slate-900 text-white'"
        >
          <span class="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs"
            :class="toast.type === 'error' ? 'bg-red-500' : 'bg-green-500'">
            {{ toast.type === 'error' ? '✕' : '✓' }}
          </span>
          {{ toast.message }}
        </div>
      </TransitionGroup>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const { logout } = useAdminAuth()
const sidebarOpen = ref(false)

const navItems = [
  { path: '/admin/dashboard', icon: '◈', label: 'Dashboard' },
  { path: '/admin/rsvps',     icon: '✉', label: 'RSVPs' },
  { path: '/admin/activities',icon: '⏱', label: 'Activities' },
  { path: '/admin/photos',    icon: '📷', label: 'Photos' },
  { path: '/admin/capsule',   icon: '💌', label: 'Time Capsule' },
  { path: '/admin/fund',      icon: '💰', label: "Uno's Fund" },
]

const currentLabel = computed(
  () => navItems.find(n => n.path === route.path)?.label ?? 'Admin'
)

const toasts = useState<{ id: number; message: string; type: 'success' | 'error' }[]>('toasts', () => [])

// Kill the public-site paper background when in admin
onMounted(() => document.body.classList.add('admin-mode'))
onUnmounted(() => document.body.classList.remove('admin-mode'))
</script>

<style>
/* Override public-site body styles for admin */
body.admin-mode {
  background-image: none !important;
  background-color: #f8fafc !important;
}

/* Don't use the racing font in admin */
.admin-layout h1,
.admin-layout h2,
.admin-layout h3 {
  font-family: "Plus Jakarta Sans", sans-serif !important;
}
</style>

<style scoped>
.toast-enter-active,
.toast-leave-active { transition: all 0.2s ease; }
.toast-enter-from   { opacity: 0; transform: translateY(6px); }
.toast-leave-to     { opacity: 0; transform: translateX(100%); }
</style>
