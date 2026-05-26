<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Activities</h1>
      <button class="btn-primary text-sm" @click="openCreate">+ Add Activity</button>
    </div>

    <p class="text-sm text-gray-500 mb-4">Drag rows to reorder. Lap numbers update automatically.</p>

    <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-gray-100 bg-gray-50">
            <th class="w-8 px-4 py-3"></th>
            <th class="th">Lap</th>
            <th class="th">Label</th>
            <th class="th">Time</th>
            <th class="th">Venue</th>
            <th class="th">Note</th>
            <th class="th">Visible</th>
            <th class="th">Actions</th>
          </tr>
        </thead>
        <tbody ref="dragContainer">
          <tr
            v-for="row in items"
            :key="row.id"
            :data-id="row.id"
            class="border-b border-gray-50 hover:bg-gray-50 cursor-grab active:cursor-grabbing"
          >
            <td class="px-4 py-3 text-gray-300 select-none">⠿</td>
            <td class="px-4 py-3 font-mono font-bold text-gray-500">{{ row.lapNumber }}</td>
            <td class="px-4 py-3 font-medium text-gray-900">{{ row.label }}</td>
            <td class="px-4 py-3 text-gray-600 whitespace-nowrap">{{ row.time }}</td>
            <td class="px-4 py-3 text-gray-500 max-w-40 truncate">{{ row.venueName || '—' }}</td>
            <td class="px-4 py-3 text-gray-400 italic max-w-40 truncate">{{ row.note || '—' }}</td>
            <td class="px-4 py-3 text-center">
              <button
                :class="row.isVisible ? 'toggle-on' : 'toggle-off'"
                @click="toggleVisible(row)"
              >{{ row.isVisible ? 'On' : 'Off' }}</button>
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
      <div v-if="!items.length" class="py-12 text-center text-sm text-gray-400">No activities yet</div>
    </div>

    <!-- Edit / Create Modal -->
    <Teleport to="body">
      <div v-if="modal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" @mousedown.self="modal = null">
        <div class="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
          <h2 class="text-lg font-semibold mb-4">{{ editing ? 'Edit Activity' : 'Add Activity' }}</h2>
          <form @submit.prevent="save" class="space-y-3">
            <div class="grid grid-cols-2 gap-3">
              <div class="col-span-2">
                <label class="label">Label <span class="text-red-500">*</span></label>
                <input v-model="form.label" class="input" required />
              </div>
              <div>
                <label class="label">Time <span class="text-red-500">*</span></label>
                <input v-model="form.time" class="input" placeholder="10:30 AM" required />
              </div>
              <div>
                <label class="label">Venue Name</label>
                <input v-model="form.venueName" class="input" />
              </div>
              <div class="col-span-2">
                <label class="label">Address</label>
                <input v-model="form.address" class="input" />
              </div>
              <div class="col-span-2">
                <label class="label">Italic Note</label>
                <input v-model="form.note" class="input" placeholder="e.g. Dress code: smart casual" />
              </div>
              <div class="flex items-center gap-2">
                <input v-model="form.isVisible" type="checkbox" id="vis" class="rounded" />
                <label for="vis" class="text-sm text-gray-700">Visible on public site</label>
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
          <h2 class="text-lg font-semibold mb-2">Delete Activity?</h2>
          <p class="text-sm text-gray-500 mb-4">Remove <strong>{{ deleteTarget.label }}</strong>?</p>
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
import Sortable from 'sortablejs'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const toast = useToast()
const { data, refresh } = await useFetch<any[]>('/api/admin/activities')
const items = computed(() => data.value ?? [])

const dragContainer = ref<HTMLElement>()
const modal = ref<null | 'create' | 'edit'>(null)
const editing = ref<any>(null)
const deleteTarget = ref<any>(null)
const saving = ref(false)

const form = reactive({ label: '', time: '', venueName: '', address: '', note: '', isVisible: true })

onMounted(() => {
  if (!dragContainer.value) return
  Sortable.create(dragContainer.value, {
    animation: 150,
    handle: 'td:first-child',
    onEnd: async (_evt) => {
      const rows = dragContainer.value!.querySelectorAll('tr[data-id]')
      const order = [...rows].map(r => Number((r as HTMLElement).dataset.id))
      try {
        await $fetch('/api/admin/activities/reorder', { method: 'POST', body: { order } })
        await refresh()
      } catch { toast.error('Reorder failed') }
    },
  })
})

function openCreate() {
  editing.value = null
  Object.assign(form, { label: '', time: '', venueName: '', address: '', note: '', isVisible: true })
  modal.value = 'create'
}
function openEdit(row: any) {
  editing.value = row
  Object.assign(form, { label: row.label, time: row.time, venueName: row.venueName ?? '', address: row.address ?? '', note: row.note ?? '', isVisible: row.isVisible })
  modal.value = 'edit'
}

async function save() {
  saving.value = true
  try {
    if (editing.value) {
      await $fetch(`/api/admin/activities/${editing.value.id}`, { method: 'PATCH', body: { ...form } })
    } else {
      await $fetch('/api/admin/activities', { method: 'POST', body: { ...form } })
    }
    modal.value = null
    await refresh()
    toast.success(editing.value ? 'Activity updated' : 'Activity created')
  } catch { toast.error('Failed to save') }
  finally { saving.value = false }
}

async function toggleVisible(row: any) {
  try {
    await $fetch(`/api/admin/activities/${row.id}`, { method: 'PATCH', body: { isVisible: !row.isVisible } })
    await refresh()
  } catch { toast.error('Failed to update') }
}

function confirmDelete(row: any) { deleteTarget.value = row }
async function doDelete() {
  try {
    await $fetch(`/api/admin/activities/${deleteTarget.value.id}`, { method: 'DELETE' })
    deleteTarget.value = null
    await refresh()
    toast.success('Activity deleted')
  } catch { toast.error('Failed to delete') }
}
</script>
