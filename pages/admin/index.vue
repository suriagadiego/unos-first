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
          <div class="lg:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div class="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
              <p class="text-sm font-bold text-gray-800">Recent Activity</p>
              <button v-if="stats?.recentActivity?.length" @click="actLogOpen = true"
                class="text-xs text-blue-500 hover:text-blue-700 transition-colors">View all</button>
            </div>
            <div v-if="!stats?.recentActivity?.length" class="py-10 text-center text-sm text-gray-400">No activity yet</div>
            <ul v-else class="divide-y divide-gray-50">
              <li v-for="item in stats.recentActivity.slice(0, 5)" :key="item.id"
                class="px-5 py-3 flex items-center gap-3 hover:bg-gray-50/60 transition-colors">
                <div :class="actMeta(item).bg" class="w-8 h-8 rounded-xl flex items-center justify-center text-base flex-shrink-0">
                  {{ actMeta(item).icon }}
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm text-gray-800 truncate leading-snug">{{ item.description }}</p>
                  <p class="text-[11px] text-gray-400 mt-0.5">{{ relTime(item.createdAt) }}</p>
                </div>
                <span :class="actMeta(item).chip" class="text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 uppercase tracking-wide">
                  {{ actMeta(item).label }}
                </span>
              </li>
            </ul>
            <button v-if="stats?.recentActivity?.length > 5" @click="actLogOpen = true"
              class="w-full px-5 py-2.5 text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors text-center border-t border-gray-50">
              + {{ stats.recentActivity.length - 5 }} more
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
              :style="rs.trashedOnly ? 'background:#fee2e2;color:#991b1b;border-color:#fecaca' : 'background:white;color:#374151;border-color:#d1d5db'"
              @click="toggleRsvpTrash"
            >{{ rs.trashedOnly ? '← Active' : 'Trash' }}</button>
            <button
              v-if="!rs.trashedOnly"
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
            {{ rs.trashedOnly ? 'Trash is empty' : 'No RSVPs yet' }}
          </div>
          <div v-for="r in rsvpPaged" :key="r.id"
            class="bg-white rounded-xl border border-gray-100 shadow-sm px-3 py-2.5"
            :class="r.deletedAt ? 'border-l-4 border-l-gray-300 opacity-60' : r.status === 'confirmed' ? 'border-l-4 border-l-green-400' : r.status === 'declined' ? 'border-l-4 border-l-red-300' : 'border-l-4 border-l-amber-300'">

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
              <button v-if="r.deletedAt"
                class="flex-shrink-0 px-3 py-1.5 rounded-lg bg-blue-500 text-white text-xs font-semibold active:bg-blue-600 transition-colors"
                @click="restoreRsvp(r)">
                Restore
              </button>
              <button v-else-if="r.status !== 'confirmed'"
                class="flex-shrink-0 px-3 py-1.5 rounded-lg bg-green-500 text-white text-xs font-semibold active:bg-green-600 transition-colors"
                @click="rsvpPatch(r.id, { status: 'confirmed', showOnPublic: true })">
                Confirm
              </button>
              <button v-else
                class="flex-shrink-0 px-3 py-1.5 rounded-lg bg-green-100 text-green-700 text-xs font-semibold active:bg-green-200 transition-colors"
                @click="rsvpPatch(r.id, { status: 'pending', showOnPublic: false })">
                ✓ Done
              </button>
              <button v-if="!r.deletedAt" class="flex-shrink-0 px-2.5 py-1.5 rounded-lg bg-gray-100 text-gray-500 text-xs"
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
                <tr v-for="r in rsvpPaged" :key="r.id" class="border-b border-gray-50 hover:bg-gray-50" :class="r.deletedAt ? 'opacity-60' : ''">
                  <td class="px-4 py-3">
                    <input v-if="!r.deletedAt" type="checkbox" :checked="rs.selected.has(r.id)" @change="rsvpToggleSel(r.id)" class="rounded" />
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
                  <td class="px-4 py-3"><span :class="r.deletedAt ? 'badge-red' : statusBadge(r.status)" class="badge">{{ r.deletedAt ? 'trashed' : r.status }}</span></td>
                  <td class="px-4 py-3">
                    <div class="flex gap-1">
                      <button v-if="r.deletedAt" class="btn-xs text-blue-600 hover:bg-blue-50" @click="restoreRsvp(r)">Restore</button>
                      <template v-else>
                        <button class="btn-xs" @click="openRsvp(r)">Edit</button>
                        <button class="btn-xs text-red-600 hover:bg-red-50" @click="rm.rsvp=r">Del</button>
                      </template>
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
          <div class="flex items-center gap-2">
            <button class="btn-secondary text-sm" @click="togglePhotoTrash">{{ photoTrash ? '← Active' : 'Trash' }}</button>
            <button class="btn-secondary text-sm" :disabled="ph.refreshing" @click="rBucket()">
              {{ ph.refreshing ? 'Loading…' : 'Refresh' }}
            </button>
          </div>
        </div>

        <div v-if="bucketError" class="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          {{ (bucketError as any)?.data?.message ?? 'Could not connect to bucket. Check RUSTFS_* env vars.' }}
        </div>
        <div v-else-if="!bucketPhotos" class="bg-white rounded-xl border border-gray-100 shadow-sm py-14 text-center text-sm text-gray-400">
          Loading…
        </div>
        <div v-else-if="!bucketPhotos.length" class="bg-white rounded-xl border border-gray-100 shadow-sm py-14 text-center text-sm text-gray-400">
          {{ photoTrash ? 'Photo trash is empty' : 'No photos in bucket yet' }}
        </div>
        <div v-else class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
          <div v-for="(p, i) in bucketPhotos" :key="p.key"
            class="relative group rounded-xl overflow-hidden bg-gray-100 aspect-square cursor-pointer"
            @click="lb.open(i)">
            <img :src="p.url" class="w-full h-full object-cover" loading="lazy" />
            <div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
              <button v-if="photoTrash" class="photo-btn bg-blue-600 w-full justify-center" @click.stop="restoreBucketPhoto(p.key)">Restore</button>
              <button v-else class="photo-btn bg-red-700 w-full justify-center" @click.stop="rm.bucketKey = p.key">🗑 Trash</button>
            </div>
          </div>
        </div>
      </section>

      <hr class="border-gray-200" />

      <!-- ═══ POVs ════════════════════════════════════════ -->
      <section id="povs" class="scroll-mt-20">
        <div class="flex items-center justify-between mb-4">
          <h2 class="section-title mb-0">POVs <span v-if="povs?.length" class="text-sm font-normal text-gray-400">({{ povs.length }} guests)</span></h2>
          <button class="btn-secondary text-sm" @click="rPovs()">Refresh</button>
        </div>

        <div v-if="!povs?.length" class="bg-white rounded-xl border border-gray-100 shadow-sm py-14 text-center text-sm text-gray-400">
          No guest cameras yet
        </div>

        <div v-else class="space-y-3">
          <div v-for="g in povs" :key="g.guestId" class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <button class="w-full px-5 py-3.5 flex items-center justify-between hover:bg-gray-50 transition-colors"
              @click="pov.expanded.has(g.guestId) ? pov.expanded.delete(g.guestId) : pov.expanded.add(g.guestId)">
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-base">📷</div>
                <div class="text-left">
                  <p class="text-sm font-bold text-gray-800">{{ g.guestName || 'Anonymous' }}'s POV</p>
                  <p class="text-[11px] text-gray-400">{{ g.photos.length }} {{ g.photos.length === 1 ? 'shot' : 'shots' }}</p>
                </div>
              </div>
              <span class="text-gray-400 text-sm">{{ pov.expanded.has(g.guestId) ? '▲' : '▼' }}</span>
            </button>

            <div v-if="pov.expanded.has(g.guestId)" class="px-5 pb-5 pt-1">
              <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                <div v-for="p in g.photos" :key="p.id"
                  class="relative rounded-lg overflow-hidden bg-gray-100 aspect-square cursor-pointer"
                  @click="povLb.open(g, p.id)">
                  <img :src="p.url" class="w-full h-full object-cover" loading="lazy" />
                </div>
              </div>
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
          <div class="flex items-center gap-2">
            <button class="btn-secondary text-sm" @click="toggleFundTrash">{{ fd.trashedOnly ? '← Active' : 'Trash' }}</button>
            <button v-if="!fd.trashedOnly" class="btn-primary text-sm" @click="openFund()">+ Add</button>
          </div>
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
                  <th class="th">Proof</th>
                  <th class="th">Date</th>
                  <th class="th">Public</th>
                  <th class="th"></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="c in fundPaged" :key="c.id" class="border-b border-gray-50 hover:bg-gray-50" :class="c.deletedAt ? 'opacity-60' : ''">
                  <td class="px-4 py-3 font-medium text-gray-900">{{ c.submitterName }}</td>
                  <td class="px-4 py-3 font-semibold">₱{{ Number(c.amount).toLocaleString() }}</td>
                  <td class="px-4 py-3 text-gray-500">
                    <button
                      v-if="c.message"
                      type="button"
                      class="block max-w-48 truncate text-left text-blue-600 underline decoration-blue-200 underline-offset-2 transition-colors hover:text-blue-800 hover:decoration-blue-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                      :aria-label="`Read full message from ${c.submitterName}`"
                      :title="c.message"
                      @click="fundMessage = { name: c.submitterName, message: c.message }"
                    >{{ c.message }}</button>
                    <span v-else>—</span>
                  </td>
                  <td class="px-4 py-2 whitespace-nowrap">
                    <button
                      v-if="c.proofUrl"
                      type="button"
                      class="group relative block rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                      :aria-label="`Zoom donation proof from ${c.submitterName}`"
                      @click="proofLb.open(c)"
                    >
                      <img
                        :src="`/api/admin/fund/${c.id}/proof`"
                        :alt="`Donation proof from ${c.submitterName}`"
                        class="h-12 w-12 rounded-lg border border-gray-200 bg-gray-50 object-cover transition group-hover:brightness-75"
                      />
                      <span class="pointer-events-none absolute inset-0 flex items-center justify-center text-lg text-white opacity-0 transition-opacity group-hover:opacity-100" aria-hidden="true">⌕</span>
                    </button>
                    <span v-else class="text-gray-400">—</span>
                  </td>
                  <td class="px-4 py-3 text-gray-500 whitespace-nowrap">{{ fmtDate(c.createdAt) }}</td>
                  <td class="px-4 py-3 text-center">
                    <button v-if="!c.deletedAt" :class="c.showOnPublic?'toggle-on':'toggle-off'" @click="fundPatch(c.id,{showOnPublic:!c.showOnPublic})">
                      {{ c.showOnPublic ? 'On' : 'Off' }}
                    </button>
                    <span v-else class="badge badge-red">trashed</span>
                  </td>
                  <td class="px-4 py-3">
                    <div class="flex gap-1">
                      <button v-if="c.deletedAt" class="btn-xs text-blue-600 hover:bg-blue-50" @click="restoreContrib(c)">Restore</button>
                      <template v-else>
                        <button class="btn-xs" @click="openFund(c)">Edit</button>
                        <button class="btn-xs text-red-600 hover:bg-red-50" @click="rm.contribution=c">Del</button>
                      </template>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-if="!fundContribs.length" class="py-10 text-center text-sm text-gray-400">{{ fd.trashedOnly ? 'Contribution trash is empty' : 'No contributions yet' }}</div>
          <Pagination :total="fundContribs.length" :per-page="25" v-model:page="fd.page" />
        </div>
      </section>

      <div class="h-10" />
    </div>

    <!-- ═══ MODALS ════════════════════════════════════════ -->
    <Teleport to="body">

      <!-- RSVP edit/create -->
      <Modal v-if="rs.modal" @close="rs.modal=null" :title="rs.editing ? 'Edit RSVP' : 'Add RSVP'">
        <form @submit.prevent="saveRsvp" class="space-y-4">
          <div>
            <label class="label">Full Name *</label>
            <input v-model="rs.form.displayName" class="input" placeholder="Full name" required />
          </div>

          <div>
            <label class="label">Grid Name <span class="normal-case font-normal text-gray-400">(optional)</span></label>
            <input v-model="rs.form.gridName" class="input" placeholder="e.g. Sherifa" />
            <p class="mt-1.5 text-xs text-gray-400">Overrides the name used in the “On the Grid” team title only.</p>
          </div>

          <div>
            <label class="label">Status</label>
            <div class="flex gap-2">
              <button v-for="s in ['confirmed','pending','declined']" :key="s" type="button"
                class="flex-1 py-2 text-sm rounded-lg border transition-colors capitalize"
                :class="rs.form.status === s
                  ? s === 'confirmed' ? 'bg-green-500 text-white border-green-500'
                  : s === 'declined'  ? 'bg-red-400 text-white border-red-400'
                  : 'bg-gray-700 text-white border-gray-700'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'"
                @click="rs.form.status = s">
                {{ s }}
              </button>
            </div>
          </div>

          <div v-if="rs.form.status !== 'declined'">
            <label class="label">Guests <span class="normal-case font-normal text-gray-400">(optional)</span></label>
            <div class="flex flex-col gap-2 mb-2">
              <div v-for="(name, i) in rs.form.guestNames" :key="i" class="flex gap-2 items-center">
                <button type="button"
                  class="text-xs font-bold uppercase tracking-widest px-3 py-2 border transition-all rounded"
                  :class="rs.form.kidsNames.includes(name) ? 'bg-amber-400 border-amber-400 text-black' : 'border-gray-200 text-gray-300 hover:border-gray-400 hover:text-gray-400'"
                  @click="rs.form.kidsNames.includes(name) ? rs.form.kidsNames.splice(rs.form.kidsNames.indexOf(name),1) : rs.form.kidsNames.push(name)">
                  kid
                </button>
                <input v-model="rs.form.guestNames[i]" type="text" :placeholder="`Guest ${i + 1}`" class="input flex-1" />
                <button type="button" class="text-gray-300 hover:text-red-400 text-lg leading-none px-1 transition-colors" @click="removeGuest(name)">×</button>
              </div>
            </div>
            <button type="button" class="text-xs text-blue-500 hover:text-blue-700 transition-colors" @click="addGuest">+ Add guest</button>
          </div>

          <div v-if="rs.form.status !== 'declined'">
            <label class="label">Dietary notes <span class="normal-case font-normal text-gray-400">(optional)</span></label>
            <input v-model="rs.form.dietaryNotes" class="input" placeholder="Allergies, restrictions, etc." />
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

      <!-- Full contribution message -->
      <Modal v-if="fundMessage" @close="fundMessage=null" title="Contribution Message">
        <div class="space-y-3">
          <p class="text-xs font-semibold uppercase tracking-wide text-gray-400">From {{ fundMessage.name }}</p>
          <p class="max-h-[60vh] overflow-y-auto whitespace-pre-wrap break-words text-base leading-relaxed text-gray-800">{{ fundMessage.message }}</p>
        </div>
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

      <!-- Lightbox -->
      <Teleport to="body">
        <div v-if="lb.index !== null && bucketPhotos"
          class="fixed inset-0 z-[60] bg-black/95 flex flex-col"
          @keydown.left="lb.prev()" @keydown.right="lb.next()" @keydown.esc="lb.close()" tabindex="0" ref="lbEl">

          <!-- Top bar -->
          <div class="flex items-center justify-between px-5 py-3 flex-shrink-0">
            <span class="text-white/40 text-sm">{{ lb.index + 1 }} / {{ bucketPhotos.length }}</span>
            <button class="text-white/50 hover:text-white text-2xl leading-none transition-colors" @click="lb.close()">×</button>
          </div>

          <!-- Main image -->
          <div class="flex-1 flex items-center justify-center relative min-h-0 px-14">
            <button class="absolute left-3 text-white/40 hover:text-white text-4xl leading-none transition-colors select-none" @click="lb.prev()">‹</button>
            <img :src="bucketPhotos[lb.index].url" class="max-h-full max-w-full object-contain rounded-lg" />
            <button class="absolute right-3 text-white/40 hover:text-white text-4xl leading-none transition-colors select-none" @click="lb.next()">›</button>
          </div>

          <!-- Thumbnail strip -->
          <div class="flex-shrink-0 flex gap-2 overflow-x-auto px-5 py-3 scrollbar-hide">
            <div v-for="(p, i) in bucketPhotos" :key="p.key"
              class="flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden cursor-pointer transition-all"
              :class="i === lb.index ? 'ring-2 ring-white opacity-100' : 'opacity-40 hover:opacity-70'"
              @click="lb.index = i">
              <img :src="p.url" class="w-full h-full object-cover" loading="lazy" />
            </div>
          </div>
        </div>
      </Teleport>

      <!-- Fund proof lightbox -->
      <Teleport to="body">
        <div
          v-if="proofLb.url"
          ref="proofLbEl"
          tabindex="0"
          class="fixed inset-0 z-[70] flex flex-col bg-black/95 outline-none"
          role="dialog"
          aria-modal="true"
          :aria-label="`Donation proof from ${proofLb.name}`"
          @click.self="proofLb.close()"
          @keydown.esc="proofLb.close()"
        >
          <div class="flex flex-shrink-0 items-center justify-between px-5 py-3">
            <span class="text-sm font-medium text-white/70">Proof from {{ proofLb.name }}</span>
            <button
              type="button"
              class="text-3xl leading-none text-white/60 transition-colors hover:text-white"
              aria-label="Close proof preview"
              @click="proofLb.close()"
            >×</button>
          </div>
          <div class="flex min-h-0 flex-1 items-center justify-center p-5" @click.self="proofLb.close()">
            <img :src="proofLb.url" :alt="`Donation proof from ${proofLb.name}`" class="max-h-full max-w-full rounded-lg object-contain shadow-2xl" />
          </div>
        </div>
      </Teleport>

      <!-- POV Lightbox -->
      <Teleport to="body">
        <div v-if="povLb.index !== null"
          class="fixed inset-0 z-[60] bg-black/95 flex flex-col"
          @keydown.left="povLb.prev()" @keydown.right="povLb.next()" @keydown.esc="povLb.close()" tabindex="0" ref="povLbEl">
          <div class="flex items-center justify-between px-5 py-3 flex-shrink-0">
            <span class="text-white/60 text-sm font-medium">{{ povLb.guestName }}'s POV · {{ povLb.index + 1 }} / {{ povLb.photos.length }}</span>
            <button class="text-white/50 hover:text-white text-2xl leading-none transition-colors" @click="povLb.close()">×</button>
          </div>
          <div class="flex-1 flex items-center justify-center relative min-h-0 px-14">
            <button class="absolute left-3 text-white/40 hover:text-white text-4xl leading-none transition-colors select-none" @click="povLb.prev()">‹</button>
            <img :src="povLb.photos[povLb.index].url" class="max-h-full max-w-full object-contain rounded-lg" />
            <button class="absolute right-3 text-white/40 hover:text-white text-4xl leading-none transition-colors select-none" @click="povLb.next()">›</button>
          </div>
          <div class="flex-shrink-0 flex gap-2 overflow-x-auto px-5 py-3 scrollbar-hide">
            <div v-for="(p, i) in povLb.photos" :key="p.id"
              class="flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden cursor-pointer transition-all"
              :class="i === povLb.index ? 'ring-2 ring-white opacity-100' : 'opacity-40 hover:opacity-70'"
              @click="povLb.index = i">
              <img :src="p.url" class="w-full h-full object-cover" loading="lazy" />
            </div>
          </div>
        </div>
      </Teleport>

      <Confirm v-if="rm.rsvp" @cancel="rm.rsvp=null" @confirm="deleteRsvp"
        :message="`Move RSVP for ${rm.rsvp.displayName} to trash? You can restore it later.`" />
      <Confirm v-if="rm.activity" @cancel="rm.activity=null" @confirm="deleteActivity"
        :message="`Move activity ${rm.activity.label} to trash? It can be restored later.`" />
      <Confirm v-if="rm.bucketKey" @cancel="rm.bucketKey=null" @confirm="deleteBucketPhoto"
        message="Move this photo to trash? The original file will be kept and can be restored." />
      <Confirm v-if="rm.contribution" @cancel="rm.contribution=null" @confirm="deleteContrib"
        :message="`Move contribution from ${rm.contribution.submitterName} to trash? You can restore it later.`" />

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
  { id: 'povs',        label: 'POVs' },
  { id: 'capsule',     label: 'Time Capsule' },
  { id: 'fund',        label: "Fund" },
]

function fmt(iso: string) {
  return new Date(iso).toLocaleString('en-PH', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' })
}

function relTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return fmt(iso)
}

function actMeta(item: any) {
  const t = item.entityType
  if (t === 'rsvp')         return { icon: '✉️',  bg: 'bg-blue-50',   chip: 'bg-blue-50 text-blue-600',   label: 'RSVP' }
  if (t === 'contribution') return { icon: '💰',  bg: 'bg-amber-50',  chip: 'bg-amber-50 text-amber-600', label: 'Fund' }
  if (t === 'photo')        return { icon: '📷',  bg: 'bg-purple-50', chip: 'bg-purple-50 text-purple-600', label: 'Photo' }
  if (t === 'capsule')      return { icon: '💌',  bg: 'bg-pink-50',   chip: 'bg-pink-50 text-pink-600',   label: 'Capsule' }
  return                           { icon: '📋',  bg: 'bg-gray-50',   chip: 'bg-gray-100 text-gray-500',  label: item.action }
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
const photoTrash = ref(false)
const bucketPhotosUrl = computed(() => photoTrash.value ? '/api/admin/photos/bucket?trashed=true' : '/api/admin/photos/bucket')
const { data: bucketPhotos, error: bucketError, refresh: rBucket } = useFetch<any[]>(bucketPhotosUrl)
const { data: povs, refresh: rPovs } = useFetch<any[]>('/api/admin/cam/povs')
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
  search: '', status: '', kidsOnly: false, trashedOnly: false, page: 1,
  selected: new Set<number>(),
  modal: null as null | true,
  editing: null as any,
  saving: false,
  form: { displayName:'', gridName:'', submitterName:'', contact:'', headcount:1, dietaryNotes:'', status:'pending', guestNames:[] as string[], kidsNames:[] as string[] },
})
const rm = reactive({ rsvp: null as any, activity: null as any, bucketKey: null as string | null, contribution: null as any })
const actLogOpen = ref(false)

const rsvpFiltered = computed(() => {
  let rows = rsvpList.value ?? []
  rows = rows.filter((r:any) => rs.trashedOnly ? Boolean(r.deletedAt) : !r.deletedAt)
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

function toggleRsvpTrash() {
  rs.trashedOnly = !rs.trashedOnly
  rs.page = 1
  rs.selected.clear()
}

function addGuest() {
  rs.form.guestNames.push('')
}
function removeGuest(name: string) {
  const i = rs.form.guestNames.indexOf(name)
  if (i !== -1) rs.form.guestNames.splice(i, 1)
  rs.form.kidsNames = rs.form.kidsNames.filter((k: string) => k !== name)
}

function openRsvp(row?: any) {
  rs.editing = row ?? null
  Object.assign(rs.form, row
    ? { displayName:row.displayName, gridName:row.gridName??'', submitterName:row.submitterName, contact:row.contact??'', headcount:row.headcount??1, dietaryNotes:row.dietaryNotes??'', status:row.status, guestNames:[...(row.guestNames??[])], kidsNames:[...(row.kidsNames??[])] }
    : { displayName:'', gridName:'', submitterName:'', contact:'', headcount:1, dietaryNotes:'', status:'pending', guestNames:[], kidsNames:[] }
  )
  rs.modal = true
}

async function saveRsvp() {
  rs.saving = true
  try {
    const body = {
      ...rs.form,
      submitterName: rs.form.submitterName || rs.form.displayName,
      headcount: rs.form.guestNames.length || 1,
      kidsNames: rs.form.kidsNames,
      showOnPublic: rs.form.status === 'confirmed',
    }
    if (rs.editing) await $fetch(`/api/admin/rsvps/${rs.editing.id}`, { method:'PATCH', body })
    else await $fetch('/api/admin/rsvps', { method:'POST', body })
    rs.modal = null; await rRsvps(); await rStats(); await refreshNuxtData('public-rsvps')
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
  try { await $fetch(`/api/admin/rsvps/${rm.rsvp.id}`, { method:'DELETE' }); rm.rsvp=null; await rRsvps(); await rStats(); toast.success('Moved to trash') }
  catch { toast.error('Failed to move RSVP to trash') }
}

async function restoreRsvp(rsvp: any) {
  try { await $fetch(`/api/admin/rsvps/${rsvp.id}/restore`, { method:'POST' }); await rRsvps(); await rStats(); toast.success('RSVP restored') }
  catch { toast.error('Failed to restore RSVP') }
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
  try { await $fetch(`/api/admin/activities/${rm.activity.id}`, { method:'DELETE' }); rm.activity=null; await rActs(); toast.success('Moved to trash') }
  catch { toast.error('Failed to move activity to trash') }
}

// ─── Photos ─────────────────────────────────────────────
const ph = reactive({ refreshing: false })
const lbEl = ref<HTMLElement>()
const lb = reactive({
  index: null as number | null,
  open(i: number) { this.index = i; nextTick(() => lbEl.value?.focus()) },
  close() { this.index = null },
  prev() { if (this.index === null || !bucketPhotos.value) return; this.index = (this.index - 1 + bucketPhotos.value.length) % bucketPhotos.value.length },
  next() { if (this.index === null || !bucketPhotos.value) return; this.index = (this.index + 1) % bucketPhotos.value.length },
})

async function deleteBucketPhoto() {
  try {
    await $fetch('/api/admin/photos/bucket-delete', { method: 'POST', body: { key: rm.bucketKey } })
    rm.bucketKey = null
    await rBucket()
    await rStats()
    toast.success('Photo moved to trash')
  } catch { toast.error('Failed to move photo to trash') }
}

function togglePhotoTrash() {
  photoTrash.value = !photoTrash.value
  lb.close()
}

async function restoreBucketPhoto(key: string) {
  try {
    await $fetch('/api/admin/photos/bucket-restore', { method: 'POST', body: { key } })
    await rBucket()
    await rStats()
    toast.success('Photo restored')
  } catch { toast.error('Failed to restore photo') }
}

// ─── POVs ───────────────────────────────────────────────
const pov = reactive({ expanded: new Set<string>() })
const povLbEl = ref<HTMLElement>()
const povLb = reactive({
  photos: [] as any[],
  index: null as number | null,
  guestName: '' as string,
  open(group: any, id: any) {
    this.photos = group.photos
    this.guestName = group.guestName || 'Anonymous'
    this.index = group.photos.findIndex((p: any) => p.id === id)
    nextTick(() => povLbEl.value?.focus())
  },
  close() { this.index = null },
  prev() { if (this.index === null) return; this.index = (this.index - 1 + this.photos.length) % this.photos.length },
  next() { if (this.index === null) return; this.index = (this.index + 1) % this.photos.length },
})

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
  goal: 100000, page: 1, trashedOnly: false,
  modal: null as null | true,
  editing: null as any,
  saving: false,
  form: { submitterName:'', amount:0, message:'', showOnPublic:true },
})

watch(() => fundData.value, (v) => { if (v?.goal) fd.goal = v.goal }, { immediate: true })

const fundContribs = computed(() => (fundData.value?.contributions ?? []).filter((c:any) => fd.trashedOnly ? Boolean(c.deletedAt) : !c.deletedAt))
const fundPaged = computed(() => fundContribs.value.slice((fd.page-1)*25, fd.page*25))
const fundGoalPct = computed(() => fd.goal ? Math.round(((fundData.value?.grandTotal??0) / fd.goal)*100) : 0)
const fundMessage = ref<{ name: string; message: string } | null>(null)
const proofLbEl = ref<HTMLElement>()
const proofLb = reactive({
  url: '',
  name: '',
  open(contribution: any) {
    this.url = `/api/admin/fund/${contribution.id}/proof`
    this.name = contribution.submitterName || 'contributor'
    nextTick(() => proofLbEl.value?.focus())
  },
  close() {
    this.url = ''
    this.name = ''
  },
})

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
  try { await $fetch(`/api/admin/fund/${rm.contribution.id}`, { method:'DELETE' }); rm.contribution=null; await rFund(); await rStats(); toast.success('Moved to trash') }
  catch { toast.error('Failed to move contribution to trash') }
}

function toggleFundTrash() {
  fd.trashedOnly = !fd.trashedOnly
  fd.page = 1
}

async function restoreContrib(contribution: any) {
  try { await $fetch(`/api/admin/fund/${contribution.id}/restore`, { method:'POST' }); await rFund(); await rStats(); toast.success('Contribution restored') }
  catch { toast.error('Failed to restore contribution') }
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
