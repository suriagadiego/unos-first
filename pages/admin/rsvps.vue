<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-900">RSVPs</h1>
      <div class="flex gap-2">
        <button class="btn-secondary text-sm" @click="exportCsv">Export CSV</button>
        <button class="btn-primary text-sm" @click="openCreate">+ Add RSVP</button>
      </div>
    </div>

    <!-- Toolbar -->
    <div class="bg-white rounded-xl border border-gray-200 mb-4 p-4 flex flex-wrap gap-3 items-center">
      <input
        v-model="search"
        type="text"
        placeholder="Search by name…"
        class="input flex-1 min-w-48"
      />
      <select v-model="filterStatus" class="input w-36">
        <option value="">All</option>
        <option value="pending">Pending</option>
        <option value="confirmed">Confirmed</option>
        <option value="declined">Declined</option>
      </select>
      <template v-if="selected.size > 0">
        <span class="text-sm text-gray-500">{{ selected.size }} selected</span>
        <button class="btn-secondary text-sm" @click="bulkAction('confirm')">Confirm</button>
        <button class="btn-secondary text-sm" @click="bulkAction('hide')">Hide</button>
        <button class="btn-secondary text-sm" @click="bulkAction('show')">Show</button>
      </template>
    </div>

    <!-- Table -->
    <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-gray-100 bg-gray-50">
              <th class="px-4 py-3 text-left w-8">
                <input type="checkbox" :checked="allSelected" @change="toggleAll" class="rounded" />
              </th>
              <th class="th" @click="setSort('displayName')">Name <SortIcon :active="sort === 'displayName'" :dir="sortDir" /></th>
              <th class="th" @click="setSort('headcount')">Guests <SortIcon :active="sort === 'headcount'" :dir="sortDir" /></th>
              <th class="th">Dietary</th>
              <th class="th" @click="setSort('createdAt')">Date <SortIcon :active="sort === 'createdAt'" :dir="sortDir" /></th>
              <th class="th">Status</th>
              <th class="th">Public</th>
              <th class="th">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in paginated"
              :key="row.id"
              class="border-b border-gray-50 hover:bg-gray-50 transition-colors"
            >
              <td class="px-4 py-3">
                <input type="checkbox" :checked="selected.has(row.id)" @change="toggleSelect(row.id)" class="rounded" />
              </td>
              <td class="px-4 py-3">
                <div class="font-medium text-gray-900">{{ row.displayName }}</div>
                <div v-if="row.guestNames?.length" class="mt-1 flex flex-wrap gap-1">
                  <span
                    v-for="name in row.guestNames"
                    :key="name"
                    class="text-xs px-2 py-0.5 rounded-full"
                    :class="row.kidsNames?.includes(name) ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'"
                  >{{ name }}{{ row.kidsNames?.includes(name) ? ' 👶' : '' }}</span>
                </div>
              </td>
              <td class="px-4 py-3 text-center text-gray-700">{{ row.headcount }}</td>
              <td class="px-4 py-3 text-gray-500 max-w-36 truncate">{{ row.dietaryNotes || '—' }}</td>
              <td class="px-4 py-3 text-gray-500 whitespace-nowrap">{{ formatDate(row.createdAt) }}</td>
              <td class="px-4 py-3">
                <span :class="statusClass(row.status)" class="badge">{{ row.status }}</span>
              </td>
              <td class="px-4 py-3 text-center">
                <button
                  :class="row.showOnPublic ? 'toggle-on' : 'toggle-off'"
                  @click="togglePublic(row)"
                  title="Toggle public visibility"
                >
                  {{ row.showOnPublic ? 'On' : 'Off' }}
                </button>
              </td>
              <td class="px-4 py-3">
                <div class="flex gap-1">
                  <button class="btn-xs" @click="openEdit(row)">Edit</button>
                  <button class="btn-xs text-red-600 hover:bg-red-50" @click="confirmDelete(row)">Del</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

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

    <!-- Edit / Create Modal -->
    <Teleport to="body">
      <div v-if="modal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" @mousedown.self="modal = null">
        <div class="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">{{ editing ? 'Edit RSVP' : 'Add RSVP' }}</h2>
          <form @submit.prevent="saveRsvp" class="space-y-3">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="label">Display Name</label>
                <input v-model="form.displayName" class="input" required />
              </div>
              <div>
                <label class="label">Headcount</label>
                <input v-model.number="form.headcount" type="number" min="1" class="input" />
              </div>
            </div>
            <div v-if="form.guestNames?.length">
              <label class="label">Attendees</label>
              <div class="flex flex-wrap gap-1 p-2 border border-gray-200 rounded-lg bg-gray-50 min-h-8">
                <span
                  v-for="name in form.guestNames"
                  :key="name"
                  class="text-xs px-2 py-0.5 rounded-full"
                  :class="form.kidsNames?.includes(name) ? 'bg-amber-100 border border-amber-200 text-amber-700' : 'bg-white border border-gray-200 text-gray-600'"
                >{{ name }}{{ form.kidsNames?.includes(name) ? ' 👶' : '' }}</span>
              </div>
            </div>
            <div>
              <label class="label">Dietary Notes</label>
              <textarea v-model="form.dietaryNotes" class="input h-20" />
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="label">Status</label>
                <select v-model="form.status" class="input">
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="declined">Declined</option>
                </select>
              </div>
              <div class="flex items-center gap-2 pt-6">
                <input v-model="form.showOnPublic" type="checkbox" id="showPublic" class="rounded" />
                <label for="showPublic" class="text-sm text-gray-700">Show on public site</label>
              </div>
            </div>
            <div class="flex justify-end gap-2 pt-2">
              <button type="button" class="btn-secondary" @click="modal = null">Cancel</button>
              <button type="submit" class="btn-primary" :disabled="saving">{{ saving ? 'Saving…' : 'Save' }}</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Delete confirm -->
      <div v-if="deleteTarget" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" @mousedown.self="deleteTarget = null">
        <div class="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-2">Delete RSVP?</h2>
          <p class="text-sm text-gray-500 mb-4">This will permanently remove <strong>{{ deleteTarget.displayName }}</strong>.</p>
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
const { data: rawData, refresh } = await useFetch<any[]>('/api/admin/rsvps')

const search = ref('')
const filterStatus = ref('')
const sort = ref('createdAt')
const sortDir = ref<'asc' | 'desc'>('desc')
const page = ref(1)
const perPage = 20
const selected = ref(new Set<number>())
const modal = ref<'create' | 'edit' | null>(null)
const editing = ref<any>(null)
const deleteTarget = ref<any>(null)
const saving = ref(false)

const form = reactive({
  displayName: '', submitterName: '', contact: '', headcount: 1,
  guestNames: [] as string[], kidsNames: [] as string[], dietaryNotes: '', status: 'pending', showOnPublic: false,
})

const filtered = computed(() => {
  let rows = rawData.value ?? []
  if (search.value) {
    const q = search.value.toLowerCase()
    rows = rows.filter((r: any) =>
      r.displayName?.toLowerCase().includes(q) ||
      r.submitterName?.toLowerCase().includes(q) ||
      r.contact?.toLowerCase().includes(q)
    )
  }
  if (filterStatus.value) rows = rows.filter((r: any) => r.status === filterStatus.value)
  rows = [...rows].sort((a: any, b: any) => {
    const av = a[sort.value] ?? ''
    const bv = b[sort.value] ?? ''
    return sortDir.value === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av))
  })
  return rows
})

const totalPages = computed(() => Math.ceil(filtered.value.length / perPage))
const paginated = computed(() => filtered.value.slice((page.value - 1) * perPage, page.value * perPage))
const allSelected = computed(() => paginated.value.length > 0 && paginated.value.every((r: any) => selected.value.has(r.id)))

function setSort(field: string) {
  if (sort.value === field) sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  else { sort.value = field; sortDir.value = 'asc' }
}
function toggleAll() {
  if (allSelected.value) paginated.value.forEach((r: any) => selected.value.delete(r.id))
  else paginated.value.forEach((r: any) => selected.value.add(r.id))
}
function toggleSelect(id: number) {
  if (selected.value.has(id)) selected.value.delete(id)
  else selected.value.add(id)
}

function openCreate() {
  editing.value = null
  Object.assign(form, { displayName: '', submitterName: '', contact: '', headcount: 1, dietaryNotes: '', status: 'pending', showOnPublic: false })
  modal.value = 'create'
}
function openEdit(row: any) {
  editing.value = row
  Object.assign(form, { displayName: row.displayName, submitterName: row.submitterName, contact: row.contact ?? '', headcount: row.headcount ?? 1, guestNames: row.guestNames ?? [], kidsNames: row.kidsNames ?? [], dietaryNotes: row.dietaryNotes ?? '', status: row.status, showOnPublic: row.showOnPublic })
  modal.value = 'edit'
}

async function saveRsvp() {
  saving.value = true
  try {
    if (editing.value) {
      await $fetch(`/api/admin/rsvps/${editing.value.id}`, { method: 'PATCH', body: { ...form } })
    } else {
      await $fetch('/api/admin/rsvps', { method: 'POST', body: { ...form } })
    }
    modal.value = null
    await refresh()
    toast.success(editing.value ? 'RSVP updated' : 'RSVP created')
  } catch {
    toast.error('Failed to save')
  } finally {
    saving.value = false
  }
}

async function togglePublic(row: any) {
  try {
    await $fetch(`/api/admin/rsvps/${row.id}`, { method: 'PATCH', body: { showOnPublic: !row.showOnPublic } })
    await refresh()
  } catch { toast.error('Failed to update') }
}

function confirmDelete(row: any) { deleteTarget.value = row }
async function doDelete() {
  try {
    await $fetch(`/api/admin/rsvps/${deleteTarget.value.id}`, { method: 'DELETE' })
    deleteTarget.value = null
    await refresh()
    toast.success('RSVP deleted')
  } catch { toast.error('Failed to delete') }
}

async function bulkAction(action: string) {
  const ids = [...selected.value]
  try {
    await $fetch('/api/admin/rsvps/bulk', { method: 'POST', body: { ids, action } })
    selected.value.clear()
    await refresh()
    toast.success(`Bulk ${action} applied`)
  } catch { toast.error('Bulk action failed') }
}

async function exportCsv() {
  window.open('/api/admin/rsvps/export', '_blank')
}

function statusClass(s: string) {
  if (s === 'confirmed') return 'badge-green'
  if (s === 'declined') return 'badge-red'
  return 'badge-gray'
}
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
}

// SortIcon inline component
const SortIcon = defineComponent({
  props: { active: Boolean, dir: String },
  template: `<span class="ml-1 text-xs opacity-40" :class="{ 'opacity-100': active }">{{ active ? (dir === 'asc' ? '↑' : '↓') : '↕' }}</span>`,
})
</script>
