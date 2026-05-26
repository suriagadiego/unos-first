<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Photos</h1>
    </div>

    <!-- Filter bar -->
    <div class="bg-white rounded-xl border border-gray-200 mb-4 p-4 flex flex-wrap gap-3 items-center">
      <div class="flex gap-1">
        <button
          v-for="f in ['all', 'pending', 'approved', 'rejected']"
          :key="f"
          :class="filterStatus === f ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
          class="px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-colors"
          @click="filterStatus = f; selected.clear()"
        >
          {{ f }}
          <span v-if="counts[f]" class="ml-1 opacity-70">({{ counts[f] }})</span>
        </button>
      </div>
      <template v-if="selected.size > 0">
        <span class="text-sm text-gray-500 ml-2">{{ selected.size }} selected</span>
        <button class="btn-secondary text-sm" @click="bulkAction('approve')">Approve</button>
        <button class="btn-secondary text-sm" @click="bulkAction('reject')">Reject</button>
      </template>
    </div>

    <!-- Grid -->
    <div v-if="!filtered.length" class="bg-white rounded-xl border border-gray-200 py-16 text-center text-sm text-gray-400">
      No photos
    </div>
    <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
      <div
        v-for="photo in filtered"
        :key="photo.id"
        class="relative group rounded-xl overflow-hidden border-2 bg-gray-100 aspect-square cursor-pointer"
        :class="selected.has(photo.id) ? 'border-blue-500' : 'border-transparent'"
        @click="toggleSelect(photo.id)"
      >
        <img :src="photo.url" :alt="photo.caption || ''" class="w-full h-full object-cover" loading="lazy" />

        <!-- Status ribbon -->
        <div class="absolute top-1.5 left-1.5">
          <span :class="statusClass(photo.status)" class="badge text-[10px]">{{ photo.status }}</span>
        </div>

        <!-- Featured star -->
        <div v-if="photo.isFeatured" class="absolute top-1.5 right-1.5 text-yellow-400 text-sm">★</div>

        <!-- Hover overlay -->
        <div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
          <div>
            <p class="text-white text-xs font-medium truncate">{{ photo.uploaderName || 'Unknown' }}</p>
            <p class="text-white/60 text-[10px]">{{ formatDate(photo.createdAt) }}</p>
          </div>
          <div class="flex flex-wrap gap-1" @click.stop>
            <button v-if="photo.status !== 'approved'" class="photo-btn bg-green-600" @click="updatePhoto(photo.id, { status: 'approved' })">✓</button>
            <button v-if="photo.status !== 'rejected'" class="photo-btn bg-red-600" @click="updatePhoto(photo.id, { status: 'rejected' })">✗</button>
            <button :class="photo.isFeatured ? 'bg-yellow-500' : 'bg-gray-600'" class="photo-btn" @click="updatePhoto(photo.id, { isFeatured: !photo.isFeatured })">★</button>
            <button class="photo-btn bg-blue-600" @click="openCaption(photo)">✎</button>
            <button class="photo-btn bg-red-800" @click="confirmDelete(photo)">🗑</button>
          </div>
        </div>

        <!-- Caption below if set -->
        <div v-if="photo.caption" class="absolute bottom-0 inset-x-0 bg-black/50 px-2 py-1">
          <p class="text-white text-[10px] truncate">{{ photo.caption }}</p>
        </div>
      </div>
    </div>

    <!-- Caption modal -->
    <Teleport to="body">
      <div v-if="captionTarget" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" @mousedown.self="captionTarget = null">
        <div class="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
          <h2 class="text-lg font-semibold mb-3">Edit Caption</h2>
          <textarea v-model="captionText" class="input h-24 w-full" placeholder="Photo caption…" />
          <div class="flex justify-end gap-2 mt-3">
            <button class="btn-secondary" @click="captionTarget = null">Cancel</button>
            <button class="btn-primary" @click="saveCaption">Save</button>
          </div>
        </div>
      </div>

      <div v-if="deleteTarget" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" @mousedown.self="deleteTarget = null">
        <div class="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
          <h2 class="text-lg font-semibold mb-2">Delete Photo?</h2>
          <p class="text-sm text-gray-500 mb-4">This cannot be undone.</p>
          <div class="flex justify-end gap-2">
            <button class="btn-secondary" @click="deleteTarget = null">Cancel</button>
            <button class="btn-danger" @click="doDelete">Delete</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin' })

const toast = useToast()
const filterStatus = ref('all')
const { data, refresh } = await useFetch<any[]>('/api/admin/photos')

const selected = ref(new Set<number>())
const captionTarget = ref<any>(null)
const captionText = ref('')
const deleteTarget = ref<any>(null)

const all = computed(() => data.value ?? [])
const filtered = computed(() =>
  filterStatus.value === 'all' ? all.value : all.value.filter((p: any) => p.status === filterStatus.value)
)
const counts = computed(() => ({
  all: all.value.length,
  pending: all.value.filter((p: any) => p.status === 'pending').length,
  approved: all.value.filter((p: any) => p.status === 'approved').length,
  rejected: all.value.filter((p: any) => p.status === 'rejected').length,
}))

function toggleSelect(id: number) {
  if (selected.value.has(id)) selected.value.delete(id)
  else selected.value.add(id)
}

async function updatePhoto(id: number, patch: Record<string, unknown>) {
  try {
    await $fetch(`/api/admin/photos/${id}`, { method: 'PATCH', body: patch })
    await refresh()
    toast.success('Photo updated')
  } catch { toast.error('Failed to update') }
}

async function bulkAction(action: string) {
  const ids = [...selected.value]
  try {
    await $fetch('/api/admin/photos/bulk', { method: 'POST', body: { ids, action } })
    selected.value.clear()
    await refresh()
    toast.success(`${ids.length} photos ${action}d`)
  } catch { toast.error('Bulk action failed') }
}

function openCaption(photo: any) {
  captionTarget.value = photo
  captionText.value = photo.caption ?? ''
}
async function saveCaption() {
  await updatePhoto(captionTarget.value.id, { caption: captionText.value })
  captionTarget.value = null
}

function confirmDelete(photo: any) { deleteTarget.value = photo }
async function doDelete() {
  try {
    await $fetch(`/api/admin/photos/${deleteTarget.value.id}`, { method: 'DELETE' })
    deleteTarget.value = null
    await refresh()
    toast.success('Photo deleted')
  } catch { toast.error('Failed to delete') }
}

function statusClass(s: string) {
  if (s === 'approved') return 'badge-green'
  if (s === 'rejected') return 'badge-red'
  return 'badge-gray'
}
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })
}
</script>

<style scoped>
.photo-btn {
  @apply text-white text-xs px-2 py-1 rounded-md transition-opacity hover:opacity-90;
}
</style>
