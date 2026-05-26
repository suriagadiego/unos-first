<template>
  <div>
    <h1 class="text-2xl font-bold text-gray-900 mb-6">Time Capsule</h1>

    <!-- Toolbar -->
    <div class="bg-white rounded-xl border border-gray-200 mb-4 p-4 flex flex-wrap gap-3 items-center">
      <input
        v-model="search"
        type="text"
        placeholder="Search submitter or message…"
        class="input flex-1 min-w-48"
        @input="debouncedSearch"
      />
      <select v-model="filterStatus" class="input w-36">
        <option value="">All</option>
        <option value="pending">Pending</option>
        <option value="approved">Approved</option>
        <option value="hidden">Hidden</option>
      </select>
    </div>

    <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-gray-100 bg-gray-50">
            <th class="th" @click="setSort('submitterName')">Submitter <SortIcon :active="sort==='submitterName'" :dir="sortDir" /></th>
            <th class="th" @click="setSort('createdAt')">Date <SortIcon :active="sort==='createdAt'" :dir="sortDir" /></th>
            <th class="th">Message Preview</th>
            <th class="th">Status</th>
            <th class="th">Actions</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="row in sorted" :key="row.id">
            <tr
              class="border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer"
              @click="expanded.has(row.id) ? expanded.delete(row.id) : expanded.add(row.id)"
            >
              <td class="px-4 py-3 font-medium text-gray-900">{{ row.submitterName }}</td>
              <td class="px-4 py-3 text-gray-500 whitespace-nowrap">{{ formatDate(row.createdAt) }}</td>
              <td class="px-4 py-3 text-gray-500 max-w-80">
                <span class="line-clamp-1">{{ row.message }}</span>
              </td>
              <td class="px-4 py-3">
                <span :class="statusClass(row.status)" class="badge">{{ row.status }}</span>
              </td>
              <td class="px-4 py-3" @click.stop>
                <div class="flex gap-1">
                  <button
                    v-if="row.status !== 'approved'"
                    class="btn-xs text-green-700 hover:bg-green-50"
                    @click="setStatus(row, 'approved')"
                  >Approve</button>
                  <button
                    v-if="row.status !== 'hidden'"
                    class="btn-xs text-gray-600 hover:bg-gray-100"
                    @click="setStatus(row, 'hidden')"
                  >Hide</button>
                  <button
                    v-if="row.status !== 'pending'"
                    class="btn-xs"
                    @click="setStatus(row, 'pending')"
                  >Reset</button>
                </div>
              </td>
            </tr>
            <!-- Expanded full message -->
            <tr v-if="expanded.has(row.id)" :key="`${row.id}-expanded`" class="bg-blue-50">
              <td colspan="5" class="px-6 py-4">
                <p class="text-sm text-gray-700 whitespace-pre-wrap">{{ row.message }}</p>
                <p class="text-xs text-gray-400 mt-2">— {{ row.submitterName }} · {{ formatDate(row.createdAt) }}</p>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
      <div v-if="!sorted.length" class="py-12 text-center text-sm text-gray-400">No entries found</div>

      <!-- Pagination -->
      <div class="px-4 py-3 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
        <span>{{ filtered.length }} total</span>
        <div class="flex gap-2">
          <button :disabled="page === 1" class="btn-xs" @click="page--">‹ Prev</button>
          <span>{{ page }} / {{ totalPages || 1 }}</span>
          <button :disabled="page >= totalPages" class="btn-xs" @click="page++">Next ›</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin' })

const toast = useToast()
const search = ref('')
const filterStatus = ref('')
const sort = ref('createdAt')
const sortDir = ref<'asc' | 'desc'>('desc')
const page = ref(1)
const perPage = 25
const expanded = ref(new Set<number>())

const { data, refresh } = await useFetch<any[]>('/api/admin/capsule')

const filtered = computed(() => {
  let rows = data.value ?? []
  if (filterStatus.value) rows = rows.filter((r: any) => r.status === filterStatus.value)
  if (search.value) {
    const q = search.value.toLowerCase()
    rows = rows.filter((r: any) =>
      r.submitterName?.toLowerCase().includes(q) ||
      r.message?.toLowerCase().includes(q)
    )
  }
  return rows
})

const totalPages = computed(() => Math.ceil(filtered.value.length / perPage))
const sorted = computed(() => {
  const rows = [...filtered.value].sort((a: any, b: any) => {
    const av = a[sort.value] ?? ''
    const bv = b[sort.value] ?? ''
    return sortDir.value === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av))
  })
  return rows.slice((page.value - 1) * perPage, page.value * perPage)
})

function setSort(field: string) {
  if (sort.value === field) sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  else { sort.value = field; sortDir.value = 'asc' }
}

let debounceTimer: ReturnType<typeof setTimeout>
function debouncedSearch() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => { page.value = 1 }, 300)
}

async function setStatus(row: any, status: string) {
  try {
    await $fetch(`/api/admin/capsule/${row.id}`, { method: 'PATCH', body: { status } })
    await refresh()
    toast.success(`Entry marked as ${status}`)
  } catch { toast.error('Failed to update') }
}

function statusClass(s: string) {
  if (s === 'approved') return 'badge-green'
  if (s === 'hidden') return 'badge-red'
  return 'badge-gray'
}
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
}

const SortIcon = defineComponent({
  props: { active: Boolean, dir: String },
  template: `<span class="ml-1 text-xs opacity-40" :class="{ 'opacity-100': active }">{{ active ? (dir === 'asc' ? '↑' : '↓') : '↕' }}</span>`,
})
</script>
