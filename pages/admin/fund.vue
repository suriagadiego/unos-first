<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Uno's Fund</h1>
      <div class="flex gap-2">
        <button class="btn-secondary text-sm" @click="exportCsv">Export CSV</button>
        <button class="btn-primary text-sm" @click="openCreate">+ Add Contribution</button>
      </div>
    </div>

    <!-- Fund summary card -->
    <div class="bg-white rounded-xl border border-gray-200 p-6 mb-6">
      <div class="flex flex-wrap gap-6 items-start">
        <!-- Goal edit -->
        <div class="flex-1 min-w-48">
          <p class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Fund Goal</p>
          <div class="flex gap-2 items-center">
            <span class="text-gray-500 text-sm">₱</span>
            <input
              v-model.number="goalInput"
              type="number"
              class="input w-40 text-lg font-semibold"
              @blur="saveGoal"
            />
          </div>
          <p class="text-xs text-gray-400 mt-1">Click amount to edit, then click away to save</p>
        </div>

        <!-- Totals -->
        <div class="text-center">
          <p class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Grand Total</p>
          <p class="text-3xl font-bold text-gray-900">₱{{ data?.grandTotal.toLocaleString() }}</p>
        </div>
        <div class="text-center">
          <p class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Visible Total</p>
          <p class="text-3xl font-bold text-blue-600">₱{{ data?.visibleTotal.toLocaleString() }}</p>
          <p class="text-xs text-gray-400">public list only</p>
        </div>

        <!-- Progress bar -->
        <div class="flex-1 min-w-64">
          <div class="flex items-center justify-between mb-2">
            <p class="text-xs font-medium text-gray-500 uppercase tracking-wide">Progress</p>
            <p class="text-sm font-semibold text-gray-700">{{ fundPct }}%</p>
          </div>
          <div class="h-4 bg-gray-100 rounded-full overflow-hidden">
            <div
              class="h-full bg-blue-500 rounded-full transition-all duration-500"
              :style="{ width: `${Math.min(fundPct, 100)}%` }"
            />
          </div>
          <p class="text-xs text-gray-400 mt-1">₱{{ data?.grandTotal.toLocaleString() }} of ₱{{ goalInput?.toLocaleString() }}</p>
        </div>
      </div>
    </div>

    <!-- Contributions table -->
    <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-gray-100 bg-gray-50">
              <th class="th" @click="setSort('submitterName')">Name <SortIcon :active="sort==='submitterName'" :dir="sortDir" /></th>
              <th class="th" @click="setSort('amount')">Amount <SortIcon :active="sort==='amount'" :dir="sortDir" /></th>
              <th class="th">Message</th>
              <th class="th" @click="setSort('createdAt')">Date <SortIcon :active="sort==='createdAt'" :dir="sortDir" /></th>
              <th class="th">Public</th>
              <th class="th">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in paginated"
              :key="row.id"
              class="border-b border-gray-50 hover:bg-gray-50"
            >
              <td class="px-4 py-3 font-medium text-gray-900">{{ row.submitterName }}</td>
              <td class="px-4 py-3 font-semibold text-gray-900">₱{{ Number(row.amount).toLocaleString() }}</td>
              <td class="px-4 py-3 text-gray-500 max-w-48 truncate">{{ row.message || '—' }}</td>
              <td class="px-4 py-3 text-gray-500 whitespace-nowrap">{{ formatDate(row.createdAt) }}</td>
              <td class="px-4 py-3 text-center">
                <button
                  :class="row.showOnPublic ? 'toggle-on' : 'toggle-off'"
                  @click="togglePublic(row)"
                >{{ row.showOnPublic ? 'On' : 'Off' }}</button>
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
        <span>{{ sorted.length }} contributions</span>
        <div class="flex gap-2">
          <button :disabled="page === 1" class="btn-xs" @click="page--">‹ Prev</button>
          <span>{{ page }} / {{ totalPages || 1 }}</span>
          <button :disabled="page >= totalPages" class="btn-xs" @click="page++">Next ›</button>
        </div>
      </div>
    </div>

    <!-- Add / Edit Modal -->
    <Teleport to="body">
      <div v-if="modal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" @mousedown.self="modal = null">
        <div class="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
          <h2 class="text-lg font-semibold mb-4">{{ editing ? 'Edit Contribution' : 'Add Contribution' }}</h2>
          <form @submit.prevent="save" class="space-y-3">
            <div class="grid grid-cols-2 gap-3">
              <div class="col-span-2">
                <label class="label">Name <span class="text-red-500">*</span></label>
                <input v-model="form.submitterName" class="input" required />
              </div>
              <div>
                <label class="label">Amount (₱) <span class="text-red-500">*</span></label>
                <input v-model.number="form.amount" type="number" min="0" class="input" required />
              </div>
              <div class="flex items-center gap-2 pt-6">
                <input v-model="form.showOnPublic" type="checkbox" id="pub" class="rounded" />
                <label for="pub" class="text-sm">Show on public list</label>
              </div>
              <div class="col-span-2">
                <label class="label">Message (optional)</label>
                <textarea v-model="form.message" class="input h-20" />
              </div>
            </div>
            <div class="flex justify-end gap-2 pt-2">
              <button type="button" class="btn-secondary" @click="modal = null">Cancel</button>
              <button type="submit" class="btn-primary" :disabled="saving">{{ saving ? 'Saving…' : 'Save' }}</button>
            </div>
          </form>
        </div>
      </div>

      <div v-if="deleteTarget" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" @mousedown.self="deleteTarget = null">
        <div class="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
          <h2 class="text-lg font-semibold mb-2">Delete Contribution?</h2>
          <p class="text-sm text-gray-500 mb-4">Remove contribution from <strong>{{ deleteTarget.submitterName }}</strong>?</p>
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

const { data, refresh } = await useFetch<any>('/api/admin/fund')

const goalInput = ref(data.value?.goal ?? 100000)
const sort = ref('createdAt')
const sortDir = ref<'asc' | 'desc'>('desc')
const page = ref(1)
const perPage = 25
const modal = ref<null | 'create' | 'edit'>(null)
const editing = ref<any>(null)
const deleteTarget = ref<any>(null)
const saving = ref(false)

const form = reactive({ submitterName: '', amount: 0, message: '', showOnPublic: true })

const fundPct = computed(() => {
  if (!data.value || !goalInput.value) return 0
  return Math.round((data.value.grandTotal / goalInput.value) * 100)
})

const sorted = computed(() => {
  const rows = [...(data.value?.contributions ?? [])].sort((a: any, b: any) => {
    const av = a[sort.value] ?? ''
    const bv = b[sort.value] ?? ''
    if (sort.value === 'amount') return sortDir.value === 'asc' ? a.amount - b.amount : b.amount - a.amount
    return sortDir.value === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av))
  })
  return rows
})

const totalPages = computed(() => Math.ceil(sorted.value.length / perPage))
const paginated = computed(() => sorted.value.slice((page.value - 1) * perPage, page.value * perPage))

function setSort(field: string) {
  if (sort.value === field) sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  else { sort.value = field; sortDir.value = 'desc' }
}

async function saveGoal() {
  try {
    await $fetch('/api/admin/fund/settings', { method: 'PATCH', body: { goal: goalInput.value } })
    await refresh()
    toast.success('Goal updated')
  } catch { toast.error('Failed to save goal') }
}

async function togglePublic(row: any) {
  try {
    await $fetch(`/api/admin/fund/${row.id}`, { method: 'PATCH', body: { showOnPublic: !row.showOnPublic } })
    await refresh()
  } catch { toast.error('Failed to update') }
}

function openCreate() {
  editing.value = null
  Object.assign(form, { submitterName: '', amount: 0, message: '', showOnPublic: true })
  modal.value = 'create'
}
function openEdit(row: any) {
  editing.value = row
  Object.assign(form, { submitterName: row.submitterName, amount: row.amount, message: row.message ?? '', showOnPublic: row.showOnPublic })
  modal.value = 'edit'
}

async function save() {
  saving.value = true
  try {
    if (editing.value) {
      await $fetch(`/api/admin/fund/${editing.value.id}`, { method: 'PATCH', body: { ...form } })
    } else {
      await $fetch('/api/admin/fund', { method: 'POST', body: { ...form } })
    }
    modal.value = null
    await refresh()
    goalInput.value = data.value?.goal ?? goalInput.value
    toast.success(editing.value ? 'Contribution updated' : 'Contribution added')
  } catch { toast.error('Failed to save') }
  finally { saving.value = false }
}

function confirmDelete(row: any) { deleteTarget.value = row }
async function doDelete() {
  try {
    await $fetch(`/api/admin/fund/${deleteTarget.value.id}`, { method: 'DELETE' })
    deleteTarget.value = null
    await refresh()
    toast.success('Contribution deleted')
  } catch { toast.error('Failed to delete') }
}

async function exportCsv() {
  window.open('/api/admin/fund/export', '_blank')
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
}

const SortIcon = defineComponent({
  props: { active: Boolean, dir: String },
  template: `<span class="ml-1 text-xs opacity-40" :class="{ 'opacity-100': active }">{{ active ? (dir === 'asc' ? '↑' : '↓') : '↕' }}</span>`,
})
</script>
