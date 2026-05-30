<template>
  <div>
    <!-- ── Sticky navbar ─────────────────────────────── -->
    <nav class="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-200">
      <div class="max-w-6xl mx-auto px-6 flex items-center gap-6 h-14">
        <span class="font-bold text-gray-900 text-sm flex-shrink-0">🏎 Uno Admin</span>

        <div class="flex gap-0.5 overflow-x-auto flex-1">
          <a v-for="s in sections" :key="s.id" :href="`#${s.id}`"
            class="px-3 py-1.5 rounded-md text-sm font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors whitespace-nowrap flex-shrink-0">
            {{ s.label }}
          </a>
        </div>

        <button @click="logout"
          class="flex-shrink-0 text-sm text-gray-500 hover:text-red-600 px-3 py-1.5 rounded-md hover:bg-red-50 transition-colors">
          Log out
        </button>
      </div>
    </nav>

    <!-- ── Page content ──────────────────────────────── -->
    <div class="max-w-6xl mx-auto px-6 py-10 space-y-14">

      <!-- ═══ OVERVIEW ════════════════════════════════ -->
      <section id="overview" class="scroll-mt-20">
        <h2 class="section-title">Overview</h2>

        <div class="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          <div v-for="card in statCards" :key="card.label"
            class="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-start gap-4">
            <div :class="card.bg" class="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0">
              {{ card.icon }}
            </div>
            <div>
              <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide">{{ card.label }}</p>
              <p class="text-3xl font-bold text-gray-900 mt-0.5 leading-none">{{ card.value }}</p>
              <p v-if="card.sub" class="text-xs text-gray-400 mt-1">{{ card.sub }}</p>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <!-- Fund card -->
          <div class="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p class="text-sm font-bold text-gray-800 mb-1">Uno's Fund</p>
            <p class="text-3xl font-bold text-gray-900">₱{{ stats?.fund.total.toLocaleString() ?? 0 }}</p>
            <p class="text-xs text-gray-400 mb-4">of ₱{{ stats?.fund.goal.toLocaleString() ?? 100000 }} goal</p>
            <div class="h-3 bg-gray-100 rounded-full overflow-hidden mb-1.5">
              <div class="h-full rounded-full transition-all duration-500 bg-blue-500"
                :style="{ width: `${Math.min(fundPct, 100)}%` }" />
            </div>
            <div class="flex justify-between text-xs text-gray-400">
              <span>{{ fundPct }}% funded</span>
              <span>₱{{ ((stats?.fund.goal ?? 100000) - (stats?.fund.total ?? 0)).toLocaleString() }} to go</span>
            </div>
          </div>

          <!-- Activity feed -->
          <div class="lg:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div class="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
              <p class="text-sm font-bold text-gray-800">Recent Activity</p>
              <button v-if="stats?.recentActivity?.length" @click="actLogOpen = true"
                class="text-xs text-blue-500 hover:text-blue-700 transition-colors">View all</button>
            </div>
            <div v-if="!stats?.recentActivity.length" class="py-10 text-center text-sm text-gray-400">No activity yet</div>
            <ul v-else class="divide-y divide-gray-50">
              <li v-for="item in stats.recentActivity.slice(0, 3)" :key="item.id" class="px-5 py-2.5 flex items-start gap-3">
                <span :class="item.action.includes('delet') ? 'bg-red-400' : item.action.includes('creat') ? 'bg-green-400' : 'bg-blue-400'"
                  class="mt-1.5 w-2 h-2 rounded-full flex-shrink-0" />
                <div class="flex-1 min-w-0">
                  <p class="text-sm text-gray-700 truncate">{{ item.description }}</p>
                  <p class="text-xs text-gray-400">{{ fmt(item.createdAt) }}</p>
                </div>
              </li>
            </ul>
            <button v-if="stats?.recentActivity?.length > 3" @click="actLogOpen = true"
              class="w-full px-5 py-2.5 text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors text-center border-t border-gray-50">
              + {{ stats.recentActivity.length - 3 }} more
            </button>
          </div>
        </div>
      </section>

      <hr class="border-gray-200" />

      <!-- ═══ RSVPs ═════════════════════════════════════ -->
      <section id="rsvps" class="scroll-mt-20">
        <div class="flex items-center justify-between mb-3">
          <h2 class="section-title mb-0">RSVPs</h2>
          <div class="flex items-center gap-2">
            <button
              class="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg border transition-colors"
              :style="rs.kidsOnly ? 'background:#fef3c7;color:#92400e;border-color:#fcd34d' : 'background:white;color:#374151;border-color:#d1d5db'"
              @click="rs.kidsOnly = !rs.kidsOnly"
            >Kids</button>
            <button class="btn-primary text-sm" @click="openRsvp()">+ Add</button>
          </div>
        </div>
        <div class="flex gap-2 mb-4">
          <input v-model="rs.search" placeholder="Search name…" class="input flex-1" />
          <select v-model="rs.status" class="input w-28 flex-shrink-0">
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="declined">Declined</option>
          </select>
        </div>

        <div v-if="rs.selected.size > 0" class="bg-white rounded-xl border border-gray-100 shadow-sm mb-3 px-4 py-2.5 flex items-center gap-3">
          <span class="text-sm text-gray-500 flex-1">{{ rs.selected.size }} selected</span>
          <button class="btn-secondary text-sm" @click="rsvpBulk('confirm')">Confirm</button>
          <button class="btn-secondary text-sm" @click="rsvpBulk('hide')">Hide</button>
        </div>

        <!-- Mobile cards -->
        <div class="md:hidden space-y-2">
          <div v-if="!rsvpPaged.length" class="bg-white rounded-xl border border-gray-100 shadow-sm py-10 text-center text-sm text-gray-400">
            No RSVPs yet
          </div>
          <div v-for="r in rsvpPaged" :key="r.id"
            class="bg-white rounded-xl border border-gray-100 shadow-sm px-3 py-2.5"
            :class="r.status === 'confirmed' ? 'border-l-4 border-l-green-400' : r.status === 'declined' ? 'border-l-4 border-l-red-300' : 'border-l-4 border-l-amber-300'">

            <div class="flex items-center gap-2">
              <div class="flex-1 min-w-0">
                <p class="font-semibold text-gray-900 text-sm truncate">{{ r.displayName }}</p>
                <div v-if="r.guestNames?.length" class="mt-1 flex flex-wrap gap-1">
                  <span
                    v-for="name in r.guestNames"
                    :key="name"
                    class="text-xs px-2 py-0.5 rounded-full"
                    :style="r.kidsNames?.includes(name) ? 'background:#fef3c7;color:#92400e;font-weight:600' : 'background:#f3f4f6;color:#6b7280'"
                  >{{ name }}</span>
                </div>
                <p class="text-xs text-gray-400 mt-1">{{ fmtDate(r.createdAt) }}{{ r.dietaryNotes ? ' · 🥗 ' + r.dietaryNotes : '' }}</p>
              </div>
              <span class="text-sm font-bold text-gray-700 flex-shrink-0 text-right leading-none">{{ r.headcount }}<br><span class="text-[10px] font-normal text-gray-400">{{ r.headcount === 1 ? 'guest' : 'guests' }}</span></span>
              <button v-if="r.status !== 'confirmed'"
                class="flex-shrink-0 px-3 py-1.5 rounded-lg bg-green-500 text-white text-xs font-semibold active:bg-green-600 transition-colors"
                @click="rsvpPatch(r.id, { status: 'confirmed', showOnPublic: true })">
                Confirm
              </button>
              <button v-else
                class="flex-shrink-0 px-3 py-1.5 rounded-lg bg-green-100 text-green-700 text-xs font-semibold active:bg-green-200 transition-colors"
                @click="rsvpPatch(r.id, { status: 'pending', showOnPublic: false })">
                ✓ Done
              </button>
              <button class="flex-shrink-0 px-2.5 py-1.5 rounded-lg bg-gray-100 text-gray-500 text-xs"
                @click="openRsvp(r)">
                ···
              </button>
            </div>
          </div>
          <div class="py-2">
            <Pagination :total="rsvpFiltered.length" :per-page="20" v-model:page="rs.page" />
          </div>
        </div>

        <!-- Desktop table -->
        <div class="hidden md:block bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-gray-100 bg-gray-50">
                  <th class="px-4 py-3 w-8">
                    <input type="checkbox" :checked="rsvpAllSel" @change="rsvpToggleAll" class="rounded" />
                  </th>
                  <th class="th">Name</th>
                  <th class="th">Guests</th>
                  <th class="th">Dietary</th>
                  <th class="th">Date</th>
                  <th class="th">Status</th>
                  <th class="th"></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="r in rsvpPaged" :key="r.id" class="border-b border-gray-50 hover:bg-gray-50">
                  <td class="px-4 py-3">
                    <input type="checkbox" :checked="rs.selected.has(r.id)" @change="rsvpToggleSel(r.id)" class="rounded" />
                  </td>
                  <td class="px-4 py-3 font-medium text-gray-900">
                    {{ r.displayName }}
                    <div v-if="r.guestNames?.length" class="mt-1 flex flex-wrap gap-1">
                      <span
                        v-for="name in r.guestNames"
                        :key="name"
                        class="text-xs px-2 py-0.5 rounded-full font-normal"
                        :style="r.kidsNames?.includes(name) ? 'background:#fef3c7;color:#92400e;font-weight:600' : 'background:#f3f4f6;color:#6b7280'"
                      >{{ name }}</span>
                    </div>
                  </td>
                  <td class="px-4 py-3 text-center">{{ r.headcount }}</td>
                  <td class="px-4 py-3 text-gray-500 max-w-36 truncate">{{ r.dietaryNotes || '—' }}</td>
                  <td class="px-4 py-3 text-gray-500 whitespace-nowrap">{{ fmtDate(r.createdAt) }}</td>
                  <td class="px-4 py-3"><span :class="statusBadge(r.status)" class="badge">{{ r.status }}</span></td>
                  <td class="px-4 py-3">
                    <div class="flex gap-1">
                      <button class="btn-xs" @click="openRsvp(r)">Edit</button>
                      <button class="btn-xs text-red-600 hover:bg-red-50" @click="rm.rsvp=r">Del</button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <Pagination :total="rsvpFiltered.length" :per-page="20" v-model:page="rs.page" />
        </div>
      </section>

      <hr class="border-gray-200" />

      <!-- ═══ PHOTOS ═════════════════════════════════════ -->
      <section id="photos" class="scroll-mt-20">
        <div class="flex items-center justify-between mb-4">
          <h2 class="section-title mb-0">Photos <span v-if="bucketPhotos?.length" class="text-sm font-normal text-gray-400">({{ bucketPhotos.length }})</span></h2>
          <button class="btn-secondary text-sm" :disabled="ph.refreshing" @click="rBucket()">
            {{ ph.refreshing ? 'Loading…' : 'Refresh' }}
          </button>
        </div>

        <div v-if="bucketError" class="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          {{ (bucketError as any)?.data?.message ?? 'Could not connect to bucket. Check RUSTFS_* env vars.' }}
        </div>
        <div v-else-if="!bucketPhotos" class="bg-white rounded-xl border border-gray-100 shadow-sm py-14 text-center text-sm text-gray-400">
          Loading…
        </div>
        <div v-else-if="!bucketPhotos.length" class="bg-white rounded-xl border border-gray-100 shadow-sm py-14 text-center text-sm text-gray-400">
          No photos in bucket yet
        </div>
        <div v-else class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
          <div v-for="p in bucketPhotos" :key="p.key"
            class="relative group rounded-xl overflow-hidden bg-gray-100 aspect-square">
            <img :src="p.url" class="w-full h-full object-cover" loading="lazy" />
            <div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
              <p class="text-white/60 text-[10px] truncate mb-1">{{ p.key }}</p>
              <button class="photo-btn bg-red-700 w-full justify-center" @click="rm.bucketKey = p.key">🗑 Delete</button>
            </div>
          </div>
        </div>
      </section>

      <hr class="border-gray-200" />

      <!-- ═══ TIME CAPSULE ═══════════════════════════════ -->
      <section id="capsule" class="scroll-mt-20">
        <h2 class="section-title mb-3">Time Capsule</h2>

        <div class="flex gap-2 mb-4">
          <input v-model="cap.search" placeholder="Search submitter or message…" class="input flex-1" />
          <select v-model="cap.status" class="input w-28 flex-shrink-0">
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="hidden">Hidden</option>
          </select>
        </div>

        <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-gray-100 bg-gray-50">
                <th class="th">Submitter</th>
                <th class="th">Date</th>
                <th class="th">Message Preview</th>
                <th class="th">Status</th>
                <th class="th">Actions</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="e in capPaged" :key="e.id">
                <tr class="border-b border-gray-50 hover:bg-gray-50 cursor-pointer"
                  @click="cap.expanded.has(e.id) ? cap.expanded.delete(e.id) : cap.expanded.add(e.id)">
                  <td class="px-4 py-3 font-medium text-gray-900">{{ e.submitterName }}</td>
                  <td class="px-4 py-3 text-gray-500 whitespace-nowrap">{{ fmtDate(e.createdAt) }}</td>
                  <td class="px-4 py-3 text-gray-500 max-w-80">
                    <span class="line-clamp-1">{{ e.message }}</span>
                  </td>
                  <td class="px-4 py-3"><span :class="capsuleBadge(e.status)" class="badge">{{ e.status }}</span></td>
                  <td class="px-4 py-3" @click.stop>
                    <div class="flex gap-1">
                      <button v-if="e.status!=='approved'" class="btn-xs text-green-700 hover:bg-green-50" @click="capPatch(e.id,'approved')">Approve</button>
                      <button v-if="e.status!=='hidden'" class="btn-xs" @click="capPatch(e.id,'hidden')">Hide</button>
                      <button v-if="e.status!=='pending'" class="btn-xs" @click="capPatch(e.id,'pending')">Reset</button>
                    </div>
                  </td>
                </tr>
                <tr v-if="cap.expanded.has(e.id)" :key="`${e.id}-exp`" class="bg-blue-50">
                  <td colspan="5" class="px-6 py-4">
                    <p class="text-sm text-gray-700 whitespace-pre-wrap">{{ e.message }}</p>
                    <p class="text-xs text-gray-400 mt-2">— {{ e.submitterName }} · {{ fmtDate(e.createdAt) }}</p>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
          <div v-if="!capFiltered.length" class="py-10 text-center text-sm text-gray-400">No entries</div>
          <Pagination :total="capFiltered.length" :per-page="25" v-model:page="cap.page" />
        </div>
      </section>

      <hr class="border-gray-200" />

      <!-- ═══ FUND ═══════════════════════════════════════ -->
      <section id="fund" class="scroll-mt-20">
        <div class="flex items-center justify-between mb-4">
          <h2 class="section-title mb-0">Uno's Fund</h2>
          <button class="btn-primary text-sm" @click="openFund()">+ Add</button>
        </div>

        <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-4">
          <div class="flex flex-wrap gap-8 items-start">
            <div>
              <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Goal (₱)</p>
              <div class="flex gap-2 items-center">
                <input v-model.number="fd.goal" type="number" class="input w-36 text-xl font-bold" />
                <button class="btn-primary text-sm" @click="saveGoal">Save</button>
              </div>
            </div>
            <div>
              <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Grand Total</p>
              <p class="text-3xl font-bold text-gray-900">₱{{ fundData?.grandTotal.toLocaleString() ?? 0 }}</p>
            </div>
            <div>
              <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Visible Total</p>
              <p class="text-3xl font-bold text-blue-600">₱{{ fundData?.visibleTotal.toLocaleString() ?? 0 }}</p>
              <p class="text-xs text-gray-400">public list only</p>
            </div>
            <div class="flex-1 min-w-56">
              <div class="flex justify-between text-xs text-gray-500 mb-2">
                <span>Progress</span><span class="font-semibold">{{ fundGoalPct }}%</span>
              </div>
              <div class="h-4 bg-gray-100 rounded-full overflow-hidden">
                <div class="h-full bg-blue-500 rounded-full transition-all" :style="{width:`${Math.min(fundGoalPct,100)}%`}" />
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-gray-100 bg-gray-50">
                  <th class="th">Name</th>
                  <th class="th">Amount</th>
                  <th class="th">Message</th>
                  <th class="th">Date</th>
                  <th class="th">Public</th>
                  <th class="th"></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="c in fundPaged" :key="c.id" class="border-b border-gray-50 hover:bg-gray-50">
                  <td class="px-4 py-3 font-medium text-gray-900">{{ c.submitterName }}</td>
                  <td class="px-4 py-3 font-semibold">₱{{ Number(c.amount).toLocaleString() }}</td>
                  <td class="px-4 py-3 text-gray-500 max-w-48 truncate">{{ c.message || '—' }}</td>
                  <td class="px-4 py-3 text-gray-500 whitespace-nowrap">{{ fmtDate(c.createdAt) }}</td>
                  <td class="px-4 py-3 text-center">
                    <button :class="c.showOnPublic?'toggle-on':'toggle-off'" @click="fundPatch(c.id,{showOnPublic:!c.showOnPublic})">
                      {{ c.showOnPublic ? 'On' : 'Off' }}
                    </button>
                  </td>
                  <td class="px-4 py-3">
                    <div class="flex gap-1">
                      <button class="btn-xs" @click="openFund(c)">Edit</button>
                      <button class="btn-xs text-red-600 hover:bg-red-50" @click="rm.contribution=c">Del</button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-if="!fundContribs.length" class="py-10 text-center text-sm text-gray-400">No contributions yet</div>
          <Pagination :total="fundContribs.length" :per-page="25" v-model:page="fd.page" />
        </div>
      </section>

      <div class="h-10" />
    </div>

    <!-- ═══ MODALS ════════════════════════════════════════ -->
    <Teleport to="body">

      <!-- RSVP edit/create -->
      <Modal v-if="rs.modal" @close="rs.modal=null" :title="rs.editing ? 'Edit RSVP' : 'Add RSVP'">
        <form @submit.prevent="saveRsvp" class="space-y-3">
          <div class="grid grid-cols-2 gap-3">
            <div><label class="label">Display Name *</label><input v-model="rs.form.displayName" class="input" required /></div>
            <div><label class="label">Submitter Name *</label><input v-model="rs.form.submitterName" class="input" required /></div>
            <div><label class="label">Headcount</label><input v-model.number="rs.form.headcount" type="number" min="1" class="input" /></div>
            <div class="col-span-2">
              <label class="label">Guests <span class="normal-case font-normal text-gray-400">(tap name to mark as kid)</span></label>
              <div class="flex flex-wrap gap-1.5 p-2.5 border border-gray-200 rounded-lg bg-gray-50 min-h-10">
                <div v-for="name in rs.form.guestNames" :key="name" class="flex items-center gap-0.5">
                  <button
                    type="button"
                    class="text-xs px-2.5 py-1 rounded-full border transition-colors"
                    :style="rs.form.kidsNames.includes(name) ? 'background:#fef3c7;color:#92400e;border-color:#fcd34d;font-weight:600' : 'background:white;color:#374151;border-color:#e5e7eb'"
                    @click="rs.form.kidsNames.includes(name) ? rs.form.kidsNames.splice(rs.form.kidsNames.indexOf(name),1) : rs.form.kidsNames.push(name)"
                  >{{ name }}</button>
                  <button type="button" class="text-gray-300 hover:text-red-400 text-sm leading-none px-0.5 transition-colors" @click="removeGuest(name)">×</button>
                </div>
              </div>
              <div class="flex gap-2 mt-2">
                <input
                  v-model="newGuestName"
                  type="text"
                  placeholder="Add guest name…"
                  class="input flex-1"
                  @keydown.enter.prevent="addGuest"
                />
                <button type="button" class="btn-secondary text-sm" @click="addGuest">Add</button>
              </div>
            </div>
            <div class="col-span-2"><label class="label">Dietary Notes</label><textarea v-model="rs.form.dietaryNotes" class="input h-20" /></div>
            <div class="col-span-2">
              <label class="label">Status</label>
              <select v-model="rs.form.status" class="input">
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="declined">Declined</option>
              </select>
            </div>
          </div>
          <ModalActions @cancel="rs.modal=null" :saving="rs.saving" />
        </form>
      </Modal>

      <!-- Activity edit/create -->
      <Modal v-if="act.modal" @close="act.modal=null" :title="act.editing ? 'Edit Activity' : 'Add Activity'">
        <form @submit.prevent="saveActivity" class="space-y-3">
          <div class="grid grid-cols-2 gap-3">
            <div class="col-span-2"><label class="label">Label *</label><input v-model="act.form.label" class="input" required /></div>
            <div><label class="label">Time *</label><input v-model="act.form.time" class="input" placeholder="10:30 AM" required /></div>
            <div><label class="label">Venue</label><input v-model="act.form.venueName" class="input" /></div>
            <div class="col-span-2"><label class="label">Address</label><input v-model="act.form.address" class="input" /></div>
            <div class="col-span-2"><label class="label">Italic Note</label><input v-model="act.form.note" class="input" /></div>
            <div class="flex items-center gap-2">
              <input v-model="act.form.isVisible" type="checkbox" id="av" class="rounded" />
              <label for="av" class="text-sm text-gray-700">Visible on public site</label>
            </div>
          </div>
          <ModalActions @cancel="act.modal=null" :saving="act.saving" />
        </form>
      </Modal>

<!-- Fund edit/create -->
      <Modal v-if="fd.modal" @close="fd.modal=null" :title="fd.editing ? 'Edit Contribution' : 'Add Contribution'">
        <form @submit.prevent="saveFund" class="space-y-3">
          <div class="grid grid-cols-2 gap-3">
            <div class="col-span-2"><label class="label">Name *</label><input v-model="fd.form.submitterName" class="input" required /></div>
            <div><label class="label">Amount (₱) *</label><input v-model.number="fd.form.amount" type="number" min="0" class="input" required /></div>
            <div class="flex items-center gap-2 pt-5">
              <input v-model="fd.form.showOnPublic" type="checkbox" id="fp" class="rounded" />
              <label for="fp" class="text-sm text-gray-700">Show on public list</label>
            </div>
            <div class="col-span-2"><label class="label">Message</label><textarea v-model="fd.form.message" class="input h-20" /></div>
          </div>
          <ModalActions @cancel="fd.modal=null" :saving="fd.saving" />
        </form>
      </Modal>

      <!-- Delete confirms -->
      <!-- Activity log modal -->
      <Modal v-if="actLogOpen" @close="actLogOpen = false" title="Activity Log">
        <div v-if="!stats?.recentActivity?.length" class="py-8 text-center text-sm text-gray-400">No activity yet</div>
        <ul v-else class="divide-y divide-gray-100 -mx-6 max-h-[60vh] overflow-y-auto">
          <li v-for="item in stats.recentActivity" :key="item.id" class="px-6 py-3 flex items-start gap-3">
            <span :class="item.action.includes('delet') ? 'bg-red-400' : item.action.includes('creat') ? 'bg-green-400' : 'bg-blue-400'"
              class="mt-1.5 w-2 h-2 rounded-full flex-shrink-0" />
            <div class="flex-1 min-w-0">
              <p class="text-sm text-gray-700">{{ item.description }}</p>
              <p class="text-xs text-gray-400">{{ fmt(item.createdAt) }}</p>
            </div>
          </li>
        </ul>
      </Modal>

      <Confirm v-if="rm.rsvp" @cancel="rm.rsvp=null" @confirm="deleteRsvp"
        :message="`Delete RSVP for ${rm.rsvp.displayName}?`" />
      <Confirm v-if="rm.activity" @cancel="rm.activity=null" @confirm="deleteActivity"
        :message="`Delete activity: ${rm.activity.label}?`" />
      <Confirm v-if="rm.bucketKey" @cancel="rm.bucketKey=null" @confirm="deleteBucketPhoto"
        message="Delete this photo from the bucket? This cannot be undone." />
      <Confirm v-if="rm.contribution" @cancel="rm.contribution=null" @confirm="deleteContrib"
        :message="`Delete contribution from ${rm.contribution.submitterName}?`" />

    </Teleport>

    <!-- Toasts -->
    <div class="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none">
      <TransitionGroup name="toast">
        <div v-for="t in toasts" :key="t.id"
          class="pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium min-w-72"
          :class="t.type==='error' ? 'bg-red-600 text-white' : 'bg-slate-900 text-white'">
          <span class="w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0"
            :class="t.type==='error' ? 'bg-red-500' : 'bg-green-500'">
            {{ t.type==='error' ? '✕' : '✓' }}
          </span>
          {{ t.message }}
        </div>
      </TransitionGroup>
    </div>
  </div>
</template>

<script setup lang="ts">
import Sortable from 'sortablejs'

definePageMeta({ layout: false, middleware: 'admin' })

// ─── helpers ────────────────────────────────────────────
const toast  = useToast()
const { logout } = useAdminAuth()
const toasts = useState<{ id: number; message: string; type: 'success' | 'error' }[]>('toasts', () => [])
const window = process.client ? globalThis : null as any

const sections = [
  { id: 'overview',    label: 'Overview' },
  { id: 'rsvps',       label: 'RSVPs' },
  { id: 'photos',      label: 'Photos' },
  { id: 'capsule',     label: 'Time Capsule' },
  { id: 'fund',        label: "Fund" },
]

function fmt(iso: string) {
  return new Date(iso).toLocaleString('en-PH', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' })
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-PH', { month:'short', day:'numeric', year:'numeric' })
}
function statusBadge(s: string) {
  if (s === 'confirmed' || s === 'approved') return 'badge-green'
  if (s === 'declined'  || s === 'rejected') return 'badge-red'
  return 'badge-gray'
}
function capsuleBadge(s: string) {
  if (s === 'approved') return 'badge-green'
  if (s === 'hidden')   return 'badge-red'
  return 'badge-gray'
}

// ─── body override ──────────────────────────────────────
onMounted(() => document.body.classList.add('admin-mode'))
onUnmounted(() => document.body.classList.remove('admin-mode'))

// ─── data ───────────────────────────────────────────────
const { data: stats, refresh: rStats } = useFetch<any>('/api/admin/stats')
const { data: rsvpList, refresh: rRsvps } = useFetch<any[]>('/api/admin/rsvps')
const { data: actList,  refresh: rActs  } = useFetch<any[]>('/api/admin/activities')
const { data: bucketPhotos, error: bucketError, refresh: rBucket } = useFetch<any[]>('/api/admin/photos/bucket')
const { data: capsuleList, refresh: rCapsule } = useFetch<any[]>('/api/admin/capsule')
const { data: fundData, refresh: rFund } = useFetch<any>('/api/admin/fund')

// ─── overview ───────────────────────────────────────────
const statCards = computed(() => [
  { label:'Total RSVPs',  value: stats.value?.rsvps.total ?? 0,     icon:'✉',  bg:'bg-blue-50' },
  { label:'Confirmed',    value: stats.value?.rsvps.confirmed ?? 0,  icon:'✓',  bg:'bg-green-50',  sub:`${stats.value?.rsvps.confirmedHeadcount??0} attendees` },
  { label:'Photos',       value: stats.value?.photos.total ?? 0,     icon:'📷', bg:'bg-purple-50' },
  { label:'Time Capsule', value: stats.value?.capsule.total ?? 0,    icon:'💌', bg:'bg-amber-50' },
])
const fundPct = computed(() => {
  if (!stats.value?.fund?.goal) return 0
  return Math.round((stats.value.fund.total / stats.value.fund.goal) * 100)
})

// ─── RSVPs ──────────────────────────────────────────────
const rs = reactive({
  search: '', status: '', kidsOnly: false, page: 1,
  selected: new Set<number>(),
  modal: null as null | true,
  editing: null as any,
  saving: false,
  form: { displayName:'', submitterName:'', contact:'', headcount:1, dietaryNotes:'', status:'pending', guestNames:[] as string[], kidsNames:[] as string[] },
})
const rm = reactive({ rsvp: null as any, activity: null as any, bucketKey: null as string | null, contribution: null as any })
const actLogOpen = ref(false)

const rsvpFiltered = computed(() => {
  let rows = rsvpList.value ?? []
  if (rs.status) rows = rows.filter((r:any) => r.status === rs.status)
  if (rs.search) { const q = rs.search.toLowerCase(); rows = rows.filter((r:any) => r.displayName?.toLowerCase().includes(q) || r.submitterName?.toLowerCase().includes(q)) }
  if (rs.kidsOnly) rows = rows.filter((r:any) => r.kidsNames?.length > 0)
  return rows
})
const rsvpPaged = computed(() => rsvpFiltered.value.slice((rs.page-1)*20, rs.page*20))
const rsvpAllSel = computed(() => rsvpPaged.value.length > 0 && rsvpPaged.value.every((r:any) => rs.selected.has(r.id)))

function rsvpToggleAll() {
  if (rsvpAllSel.value) rsvpPaged.value.forEach((r:any) => rs.selected.delete(r.id))
  else rsvpPaged.value.forEach((r:any) => rs.selected.add(r.id))
}
function rsvpToggleSel(id: number) { rs.selected.has(id) ? rs.selected.delete(id) : rs.selected.add(id) }

const newGuestName = ref('')
function addGuest() {
  const name = newGuestName.value.trim()
  if (!name) return
  rs.form.guestNames.push(name)
  rs.form.headcount = rs.form.guestNames.length
  newGuestName.value = ''
}
function removeGuest(name: string) {
  rs.form.guestNames.splice(rs.form.guestNames.indexOf(name), 1)
  rs.form.kidsNames = rs.form.kidsNames.filter((k: string) => k !== name)
  rs.form.headcount = rs.form.guestNames.length
}

function openRsvp(row?: any) {
  rs.editing = row ?? null
  newGuestName.value = ''
  Object.assign(rs.form, row
    ? { displayName:row.displayName, submitterName:row.submitterName, contact:row.contact??'', headcount:row.headcount??1, dietaryNotes:row.dietaryNotes??'', status:row.status, guestNames:[...(row.guestNames??[])], kidsNames:[...(row.kidsNames??[])] }
    : { displayName:'', submitterName:'', contact:'', headcount:1, dietaryNotes:'', status:'pending', guestNames:[], kidsNames:[] }
  )
  rs.modal = true
}

async function saveRsvp() {
  rs.saving = true
  try {
    const body = { ...rs.form, kidsNames: rs.form.kidsNames, showOnPublic: rs.form.status === 'confirmed' }
    if (rs.editing) await $fetch(`/api/admin/rsvps/${rs.editing.id}`, { method:'PATCH', body })
    else await $fetch('/api/admin/rsvps', { method:'POST', body })
    rs.modal = null; await rRsvps(); await rStats()
    toast.success(rs.editing ? 'RSVP updated' : 'RSVP created')
  } catch { toast.error('Failed to save') }
  finally { rs.saving = false }
}

async function rsvpPatch(id: number, patch: object) {
  try { await $fetch(`/api/admin/rsvps/${id}`, { method:'PATCH', body:patch }); await rRsvps() }
  catch { toast.error('Failed to update') }
}

async function rsvpBulk(action: string) {
  try {
    await $fetch('/api/admin/rsvps/bulk', { method:'POST', body:{ ids:[...rs.selected], action } })
    rs.selected.clear(); await rRsvps(); toast.success(`Bulk ${action} applied`)
  } catch { toast.error('Bulk action failed') }
}

async function deleteRsvp() {
  try { await $fetch(`/api/admin/rsvps/${rm.rsvp.id}`, { method:'DELETE' }); rm.rsvp=null; await rRsvps(); await rStats(); toast.success('Deleted') }
  catch { toast.error('Failed to delete') }
}

// ─── Activities ─────────────────────────────────────────
const actDrag = ref<HTMLElement>()
const act = reactive({
  modal: null as null | true,
  editing: null as any,
  saving: false,
  form: { label:'', time:'', venueName:'', address:'', note:'', isVisible:true },
})

onMounted(() => {
  if (!actDrag.value) return
  Sortable.create(actDrag.value, {
    animation: 150,
    handle: '.drag-handle',
    onEnd: async () => {
      const rows = actDrag.value!.querySelectorAll('[data-id]')
      const order = [...rows].map(r => Number((r as HTMLElement).dataset.id))
      try { await $fetch('/api/admin/activities/reorder', { method:'POST', body:{order} }); await rActs() }
      catch { toast.error('Reorder failed') }
    },
  })
})

function openActivity(row?: any) {
  act.editing = row ?? null
  Object.assign(act.form, row
    ? { label:row.label, time:row.time, venueName:row.venueName??'', address:row.address??'', note:row.note??'', isVisible:row.isVisible }
    : { label:'', time:'', venueName:'', address:'', note:'', isVisible:true }
  )
  act.modal = true
}

async function saveActivity() {
  act.saving = true
  try {
    if (act.editing) await $fetch(`/api/admin/activities/${act.editing.id}`, { method:'PATCH', body:{...act.form} })
    else await $fetch('/api/admin/activities', { method:'POST', body:{...act.form} })
    act.modal = null; await rActs()
    toast.success(act.editing ? 'Updated' : 'Created')
  } catch { toast.error('Failed to save') }
  finally { act.saving = false }
}

async function actPatch(id: number, patch: object) {
  try { await $fetch(`/api/admin/activities/${id}`, { method:'PATCH', body:patch }); await rActs() }
  catch { toast.error('Failed to update') }
}

async function deleteActivity() {
  try { await $fetch(`/api/admin/activities/${rm.activity.id}`, { method:'DELETE' }); rm.activity=null; await rActs(); toast.success('Deleted') }
  catch { toast.error('Failed to delete') }
}

// ─── Photos ─────────────────────────────────────────────
const ph = reactive({ refreshing: false })

async function deleteBucketPhoto() {
  try {
    await $fetch('/api/admin/photos/bucket-delete', { method: 'POST', body: { key: rm.bucketKey } })
    rm.bucketKey = null
    await rBucket()
    toast.success('Photo deleted')
  } catch { toast.error('Failed to delete') }
}

// ─── Time Capsule ───────────────────────────────────────
const cap = reactive({
  search: '', status: '', page: 1,
  expanded: new Set<number>(),
})

const capFiltered = computed(() => {
  let rows = capsuleList.value ?? []
  if (cap.status) rows = rows.filter((e:any) => e.status === cap.status)
  if (cap.search) { const q = cap.search.toLowerCase(); rows = rows.filter((e:any) => e.submitterName?.toLowerCase().includes(q) || e.message?.toLowerCase().includes(q)) }
  return rows
})
const capPaged = computed(() => capFiltered.value.slice((cap.page-1)*25, cap.page*25))

async function capPatch(id: number, status: string) {
  try { await $fetch(`/api/admin/capsule/${id}`, { method:'PATCH', body:{status} }); await rCapsule(); toast.success(`Marked ${status}`) }
  catch { toast.error('Failed') }
}

// ─── Fund ────────────────────────────────────────────────
const fd = reactive({
  goal: 100000, page: 1,
  modal: null as null | true,
  editing: null as any,
  saving: false,
  form: { submitterName:'', amount:0, message:'', showOnPublic:true },
})

watch(() => fundData.value, (v) => { if (v?.goal) fd.goal = v.goal }, { immediate: true })

const fundContribs = computed(() => fundData.value?.contributions ?? [])
const fundPaged = computed(() => fundContribs.value.slice((fd.page-1)*25, fd.page*25))
const fundGoalPct = computed(() => fd.goal ? Math.round(((fundData.value?.grandTotal??0) / fd.goal)*100) : 0)

async function saveGoal() {
  try { await $fetch('/api/admin/fund/settings', { method:'PATCH', body:{ goal:fd.goal } }); await rFund(); await rStats(); toast.success('Goal updated') }
  catch { toast.error('Failed') }
}

function openFund(row?: any) {
  fd.editing = row ?? null
  Object.assign(fd.form, row
    ? { submitterName:row.submitterName, amount:row.amount, message:row.message??'', showOnPublic:row.showOnPublic }
    : { submitterName:'', amount:0, message:'', showOnPublic:true }
  )
  fd.modal = true
}

async function saveFund() {
  fd.saving = true
  try {
    if (fd.editing) await $fetch(`/api/admin/fund/${fd.editing.id}`, { method:'PATCH', body:{...fd.form} })
    else await $fetch('/api/admin/fund', { method:'POST', body:{...fd.form} })
    fd.modal = null; await rFund(); await rStats()
    toast.success(fd.editing ? 'Updated' : 'Added')
  } catch { toast.error('Failed') }
  finally { fd.saving = false }
}

async function fundPatch(id: number, patch: object) {
  try { await $fetch(`/api/admin/fund/${id}`, { method:'PATCH', body:patch }); await rFund() }
  catch { toast.error('Failed') }
}

async function deleteContrib() {
  try { await $fetch(`/api/admin/fund/${rm.contribution.id}`, { method:'DELETE' }); rm.contribution=null; await rFund(); await rStats(); toast.success('Deleted') }
  catch { toast.error('Failed') }
}

// ─── inline components ──────────────────────────────────
const Pagination = defineComponent({
  props: { total: Number, perPage: Number, page: Number },
  emits: ['update:page'],
  setup(props, { emit }) {
    const pages = computed(() => Math.ceil((props.total??0) / (props.perPage??25)))
    return () => pages.value <= 1 ? null : h('div', { class:'px-4 py-3 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500' }, [
      h('span', `${props.total} total`),
      h('div', { class:'flex gap-2' }, [
        h('button', { class:'btn-xs', disabled: props.page===1, onClick:()=>emit('update:page',(props.page??1)-1) }, '‹ Prev'),
        h('span', `${props.page} / ${pages.value}`),
        h('button', { class:'btn-xs', disabled: (props.page??1)>=pages.value, onClick:()=>emit('update:page',(props.page??1)+1) }, 'Next ›'),
      ]),
    ])
  },
})

const Modal = defineComponent({
  props: { title: String },
  emits: ['close'],
  setup(props, { slots, emit }) {
    return () => h('div', { class:'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40', onMousedown:(e:any)=>{ if(e.target===e.currentTarget) emit('close') } },
      h('div', { class:'bg-white rounded-2xl shadow-xl w-full max-w-lg p-6' }, [
        h('h2', { class:'text-base font-bold text-gray-900 mb-4' }, props.title),
        slots.default?.(),
      ])
    )
  },
})

const ModalActions = defineComponent({
  props: { saving: Boolean },
  emits: ['cancel', 'save'],
  setup(props, { emit }) {
    return () => h('div', { class:'flex justify-end gap-2 pt-2' }, [
      h('button', { type:'button', class:'btn-secondary', onClick:()=>emit('cancel') }, 'Cancel'),
      h('button', { type:'submit', class:'btn-primary', disabled:props.saving, onClick:()=>emit('save') }, props.saving ? 'Saving…' : 'Save'),
    ])
  },
})

const Confirm = defineComponent({
  props: { message: String },
  emits: ['cancel', 'confirm'],
  setup(props, { emit }) {
    return () => h('div', { class:'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40', onMousedown:(e:any)=>{ if(e.target===e.currentTarget) emit('cancel') } },
      h('div', { class:'bg-white rounded-2xl shadow-xl w-full max-w-sm p-6' }, [
        h('h2', { class:'text-base font-bold text-gray-900 mb-2' }, 'Are you sure?'),
        h('p', { class:'text-sm text-gray-500 mb-5' }, props.message),
        h('div', { class:'flex justify-end gap-2' }, [
          h('button', { class:'btn-secondary', onClick:()=>emit('cancel') }, 'Cancel'),
          h('button', { class:'btn-danger', onClick:()=>emit('confirm') }, 'Delete'),
        ]),
      ])
    )
  },
})
</script>

<style scoped>
.section-title { @apply text-lg font-bold text-gray-900 mb-4; }
.photo-btn { @apply text-white text-xs px-2 py-1 rounded-md; }
.toast-enter-active, .toast-leave-active { transition: all 0.2s ease; }
.toast-enter-from { opacity: 0; transform: translateY(6px); }
.toast-leave-to   { opacity: 0; transform: translateX(100%); }
</style>

<style>
body.admin-mode {
  background-image: none !important;
  background-color: #f8fafc !important;
}
body.admin-mode h1,
body.admin-mode h2,
body.admin-mode h3 {
  font-family: "Plus Jakarta Sans", sans-serif !important;
}
</style>
