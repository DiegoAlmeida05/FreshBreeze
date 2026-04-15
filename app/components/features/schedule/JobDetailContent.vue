
<template>
  <section class="space-y-5">
    <BaseFeedbackBanner
      v-if="errorMessage"
      tone="error"
      title="Job detail error"
      :message="errorMessage"
      dismissible
      @dismiss="errorMessage = ''"
    />

    <BaseFeedbackBanner
      v-if="successMessage"
      tone="success"
      title="Done"
      :message="successMessage"
      dismissible
      @dismiss="successMessage = ''"
    />

    <div v-if="isLoading" class="flex items-center justify-center py-16">
      <div class="h-6 w-6 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
      <span class="ml-3 text-sm text-muted">Loading job detail...</span>
    </div>

    <div
      v-else-if="!jobDetail"
      class="rounded-xl border border-primary-100 bg-primary-50/40 px-5 py-8 text-center text-sm text-muted dark:border-white/10 dark:bg-white/5"
    >
      Job not found for this route stop.
    </div>

    <template v-else>
      <div class="flex flex-wrap items-center justify-between gap-3">
        <NuxtLink :to="backTo" class="btn-outline !px-3 !py-1.5 text-xs">
          Back to schedule
        </NuxtLink>
        <span class="inline-flex rounded-full bg-primary-100 px-2.5 py-1 text-xs font-semibold text-primary-700 dark:bg-white/10 dark:text-white">
          Team {{ jobDetail.groupLabel }} · #{{ jobDetail.orderIndex + 1 }}
        </span>
      </div>

      <section class="rounded-xl border border-border bg-surface p-4 shadow-card">
        <h3 class="text-sm font-semibold text-foreground">Property Overview</h3>

        <div class="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-3">
          <article class="rounded-lg border border-primary-100 bg-primary-50/35 p-3 dark:border-white/10 dark:bg-white/5">
            <p class="text-[11px] font-semibold uppercase tracking-wide text-muted">Property name</p>
            <p class="mt-1 text-sm font-semibold text-foreground">{{ jobDetail.propertyName }}</p>
          </article>

          <article class="rounded-lg border border-primary-100 bg-primary-50/35 p-3 dark:border-white/10 dark:bg-white/5">
            <p class="text-[11px] font-semibold uppercase tracking-wide text-muted">Client</p>
            <p class="mt-1 text-sm font-semibold text-foreground">{{ jobDetail.clientName }}</p>
          </article>

          <article class="rounded-lg border border-primary-100 bg-primary-50/35 p-3 dark:border-white/10 dark:bg-white/5 lg:col-span-1">
            <p class="text-[11px] font-semibold uppercase tracking-wide text-muted">Address</p>
            <p class="mt-1 text-sm font-semibold text-foreground">{{ jobDetail.address }}</p>
            <div class="mt-2 flex items-center gap-2">
              <button
                type="button"
                class="inline-flex h-7 gap-1 items-center rounded px-2 py-1 text-[11px] font-medium text-primary-600 transition hover:bg-primary-100/50 dark:text-primary-400 dark:hover:bg-white/10"
                title="Open navigation options"
                :disabled="(jobDetail.lat === null || jobDetail.lng === null) && !jobDetail.address.trim()"
                @click="openNavigationSheet({ address: jobDetail.address, lat: jobDetail.lat, lng: jobDetail.lng })"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-3 w-3">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
                </svg>
                Go
              </button>
              <button
                type="button"
                class="inline-flex h-7 gap-1 items-center rounded px-2 py-1 text-[11px] font-medium text-primary-600 transition hover:bg-primary-100/50 dark:text-primary-400 dark:hover:bg-white/10"
                title="Copy address"
                @click="copyToClipboard(jobDetail.address)"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-3 w-3">
                  <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" />
                </svg>
                Copy
              </button>
            </div>
          </article>
        </div>

        <div class="mt-3 overflow-x-auto pb-1">
          <div class="grid min-w-[660px] grid-cols-6 gap-2">
            <article class="rounded-lg border border-border bg-background px-2 py-1.5 text-center">
              <p class="text-[9px] uppercase tracking-wide text-muted">Bathrooms</p>
              <p class="mt-0.5 text-base font-semibold leading-none text-foreground">{{ jobDetail.bathrooms }}</p>
            </article>
            <article class="rounded-lg border border-border bg-background px-2 py-1.5 text-center">
              <p class="text-[9px] uppercase tracking-wide text-muted">Single beds</p>
              <p class="mt-0.5 text-base font-semibold leading-none text-foreground">{{ jobDetail.bedsSingle }}</p>
            </article>
            <article class="rounded-lg border border-border bg-background px-2 py-1.5 text-center">
              <p class="text-[9px] uppercase tracking-wide text-muted">Queen beds</p>
              <p class="mt-0.5 text-base font-semibold leading-none text-foreground">{{ jobDetail.bedsQueen }}</p>
            </article>
            <article class="rounded-lg border border-border bg-background px-2 py-1.5 text-center">
              <p class="text-[9px] uppercase tracking-wide text-muted">King beds</p>
              <p class="mt-0.5 text-base font-semibold leading-none text-foreground">{{ jobDetail.bedsKing }}</p>
            </article>
            <article class="rounded-lg border border-border bg-background px-2 py-1.5 text-center">
              <p class="text-[9px] uppercase tracking-wide text-muted">Has key</p>
              <p class="mt-0.5 text-base font-semibold leading-none text-foreground">{{ jobDetail.hasKey ? 'Yes' : 'No' }}</p>
            </article>
            <article class="rounded-lg border border-border bg-background px-2 py-1.5 text-center">
              <p class="text-[9px] uppercase tracking-wide text-muted">Task type</p>
              <p class="mt-0.5 text-base font-semibold leading-none text-foreground">{{ jobDetail.taskType }}</p>
            </article>
          </div>
        </div>

        <div class="mt-4 rounded-lg border border-primary-100 bg-primary-50/35 p-3 dark:border-white/10 dark:bg-white/5">
          <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Keys</p>

          <div class="space-y-1.5 text-xs text-muted">
            <p><span class="font-medium text-foreground/80">Has key:</span> {{ jobDetail.hasKey ? 'Yes' : 'No' }}</p>
            <p v-if="jobDetail.keyPickupAddress">
              <span class="font-medium text-foreground/80">Key pickup address:</span> {{ jobDetail.keyPickupAddress }}
            </p>
            <p v-if="!jobDetail.hasKey && jobDetail.propertyKeys.length === 0 && keyPhotoUrls.length === 0 && !jobDetail.keyPhotoUrl">No key details available.</p>
          </div>

          <div v-if="jobDetail.propertyKeys.length > 0" class="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <article
              v-for="(item, index) in jobDetail.propertyKeys"
              :key="`${jobDetail.propertyId}-key-${index}`"
              class="rounded-lg border border-border/70 bg-background px-3 py-2"
            >
              <p class="text-xs font-semibold text-foreground">{{ item.label || `Key ${index + 1}` }}</p>
              <p v-if="item.pickupAddress" class="mt-1 text-xs text-muted">Pickup: {{ item.pickupAddress }}</p>
              <div v-if="item.pickupAddress" class="mt-1.5 flex flex-wrap gap-1">
                <button
                  type="button"
                  class="inline-flex h-6 gap-1 items-center rounded px-1.5 py-0.5 text-[10px] font-medium text-primary-600 transition hover:bg-primary-100/50 dark:text-primary-400 dark:hover:bg-white/10"
                  title="Open navigation options"
                  @click="openNavigationSheet({ address: item.pickupAddress })"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-3 w-3">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
                  </svg>
                  Go
                </button>
                <button
                  type="button"
                  class="inline-flex h-6 gap-1 items-center rounded px-1.5 py-0.5 text-[10px] font-medium text-primary-600 transition hover:bg-primary-100/50 dark:text-primary-400 dark:hover:bg-white/10"
                  title="Copy address"
                  @click="copyToClipboard(item.pickupAddress)"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-3 w-3">
                    <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" />
                  </svg>
                  Copy
                </button>
              </div>
              <p v-if="item.note" class="mt-1 text-xs text-muted">Note: {{ item.note }}</p>
              <button
                v-if="item.attachmentUrl"
                type="button"
                class="mt-2 overflow-hidden rounded-md border border-primary-100 transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary-400"
                :aria-label="`View key attachment ${index + 1}`"
                @click="openLightbox(item.attachmentUrl)"
              >
                <img :src="item.attachmentUrl" :alt="`Key attachment ${index + 1}`" class="h-12 w-12 object-cover" />
              </button>
            </article>
          </div>

          <div v-if="keyPhotoUrls.length > 0" class="mt-3">
            <p class="mb-2 text-xs font-semibold text-foreground">Key photos</p>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="(url, idx) in keyPhotoUrls"
                :key="idx"
                type="button"
                class="overflow-hidden rounded-md border border-primary-100 transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary-400"
                :aria-label="`View key photo ${idx + 1}`"
                @click="openLightbox(url)"
              >
                <img :src="url" :alt="`Key photo ${idx + 1}`" class="h-12 w-12 object-cover" />
              </button>
            </div>
          </div>

          <div v-else-if="jobDetail.keyPhotoUrl" class="mt-3">
            <p class="mb-2 text-xs font-semibold text-foreground">Key photo</p>
            <button
              type="button"
              class="overflow-hidden rounded-md border border-primary-100 transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary-400"
              aria-label="View key photo"
              @click="openLightbox(jobDetail.keyPhotoUrl!)"
            >
              <img :src="jobDetail.keyPhotoUrl" alt="Property key photo" class="h-12 w-12 object-cover" />
            </button>
          </div>
        </div>
      </section>

      <div class="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <section class="rounded-xl border border-border bg-surface p-4 shadow-card">
          <h3 class="text-sm font-semibold text-foreground">Task Notes, Extras & Guest</h3>

          <div class="mt-3 space-y-2 text-sm text-muted">
            <p><span class="font-medium text-foreground/80">Guest name:</span> {{ jobDetail.guestName || 'N/A' }}</p>
            <p><span class="font-medium text-foreground/80">Guest check-in:</span> {{ jobDetail.guestCheckinDate || 'N/A' }}</p>
            <p><span class="font-medium text-foreground/80">Extras:</span> {{ extrasSummary }}</p>
            <p><span class="font-medium text-foreground/80">Property notes:</span> {{ jobDetail.propertyNotes || 'N/A' }}</p>
            <div v-if="jobDetail.link1 || jobDetail.link2" class="space-y-1">
              <p class="font-medium text-foreground/80">Property links:</p>
              <div class="flex flex-wrap gap-2">
                <a
                  v-if="jobDetail.link1"
                  :href="jobDetail.link1"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary-700 transition hover:bg-primary/15 dark:text-primary-300"
                >
                  Link 1
                </a>
                <a
                  v-if="jobDetail.link2"
                  :href="jobDetail.link2"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary-700 transition hover:bg-primary/15 dark:text-primary-300"
                >
                  Link 2
                </a>
              </div>
            </div>
            <p><span class="font-medium text-foreground/80">Task notes:</span> {{ jobDetail.taskNotes || 'N/A' }}</p>
          </div>

          <div class="mt-3">
            <p class="text-[11px] font-semibold uppercase tracking-wide text-muted">Tags</p>
            <div v-if="jobDetail.tags.length > 0" class="mt-2 flex flex-wrap gap-1.5">
              <span
                v-for="tag in jobDetail.tags"
                :key="tag"
                class="inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-primary-700 dark:text-primary-300"
              >
                {{ tag }}
              </span>
            </div>
            <p v-else class="mt-2 text-xs text-muted">No tags for this task.</p>
          </div>
        </section>

        <section class="rounded-xl border border-border bg-surface p-4 shadow-card">
          <div class="mb-3 flex items-center justify-between gap-2">
            <h3 class="text-sm font-semibold text-foreground">Team Members</h3>
            <span class="inline-flex rounded-full bg-primary-100 px-2.5 py-1 text-xs font-semibold text-primary-700 dark:bg-white/10 dark:text-white">{{ teamMembers.length }}</span>
          </div>

          <div v-if="isLoadingTeam" class="space-y-2">
            <div class="h-12 animate-pulse rounded-lg border border-primary-100 bg-primary-100/40" />
            <div class="h-12 animate-pulse rounded-lg border border-primary-100 bg-primary-100/40" />
          </div>

          <div v-else-if="teamMembers.length === 0" class="rounded-lg border border-dashed border-primary-200/80 px-4 py-6 text-center text-sm text-muted">
            No team members found for this route group.
          </div>

          <div v-else class="space-y-2">
            <article
              v-for="member in teamMembers"
              :key="member.id"
              class="flex items-center gap-3 rounded-lg border border-primary-100 bg-primary-50/35 px-3 py-2 dark:border-white/10 dark:bg-white/5"
            >
              <img v-if="member.photoUrl" :src="member.photoUrl" :alt="member.fullName" class="h-10 w-10 rounded-full object-cover" />
              <div v-else class="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary-700">
                {{ getInitials(member.fullName) }}
              </div>

              <div class="min-w-0">
                <p class="truncate text-sm font-semibold text-foreground">{{ member.fullName }}</p>
                <p class="truncate text-xs text-muted">{{ member.email || 'No email' }}</p>
              </div>
            </article>
          </div>
        </section>
      </div>

      <section class="rounded-xl border border-border bg-surface p-4 shadow-card">
        <div class="mb-3 flex items-center justify-between gap-2">
          <h3 class="text-sm font-semibold text-foreground">Reports</h3>
          <div class="flex items-center gap-2">
            <span class="inline-flex rounded-full bg-primary-100 px-2.5 py-1 text-xs font-semibold text-primary-700 dark:bg-white/10 dark:text-white">{{ reports.length }}</span>
            <button
              type="button"
              class="btn-primary !px-3 !py-1.5 text-xs"
              :disabled="isCreatingReport || isUploadingReportPhotos"
              @click="openCreateReportModal"
            >
              New report
            </button>
          </div>
        </div>

        <ReportCreateModal
          v-model="isCreateReportModalOpen"
          mode="create"
          :loading="isCreatingReport || isUploadingReportPhotos"
          :initial-value="createReportInitialValue"
          :report-photos-error="reportPhotosError"
          :pending-report-photos="createPendingReportPhotos"
          @update:model-value="onCreateModalModelValueChange"
          @submit="onCreateReport"
          @photos-change="onCreateReportPhotosChange"
          @remove-photo="removeCreatePendingReportPhoto"
        />

        <div v-if="isLoadingReports" class="space-y-3">
          <div class="h-20 animate-pulse rounded-xl border border-primary-100 bg-primary-100/40" />
          <div class="h-20 animate-pulse rounded-xl border border-primary-100 bg-primary-100/40" />
        </div>

        <div v-else-if="reports.length === 0" class="rounded-lg border border-dashed border-primary-200/80 px-4 py-8 text-center text-sm text-muted">
          No reports for this property.
        </div>

        <div v-else>
          <div class="space-y-3 md:hidden">
            <article
              v-for="report in openReports"
              :key="report.id"
              class="rounded-xl border border-primary-100 bg-primary-50/30 p-3 dark:border-white/10 dark:bg-white/5"
            >
              <div class="min-w-0">
                <div class="flex flex-wrap items-center gap-2">
                  <p class="max-w-full break-words text-sm font-semibold text-foreground" :title="report.title">{{ report.title }}</p>
                  <span class="inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold" :class="statusBadgeClass(report.status)">
                    {{ report.status === 'resolved' ? 'Resolved' : 'Open' }}
                  </span>
                </div>

                <p class="mt-2 line-clamp-2 break-all text-xs text-muted" :title="report.description_pt || 'No description'">{{ report.description_pt || 'No description' }}</p>

                <div class="mt-3 grid grid-cols-1 gap-1.5 break-words text-[11px] text-muted sm:grid-cols-2">
                  <p><span class="font-medium text-foreground/80">Report date:</span> {{ formatDate(report.report_date) }}</p>
                  <p><span class="font-medium text-foreground/80">Created by:</span> {{ displayUserName(report.created_by_name) }}</p>
                  <p><span class="font-medium text-foreground/80">Created at:</span> {{ formatDateTime(report.created_at) }}</p>
                  <p v-if="report.status === 'resolved'"><span class="font-medium text-foreground/80">Resolved by:</span> {{ displayUserName(report.resolved_by_name) }}</p>
                  <p v-if="report.status === 'resolved'"><span class="font-medium text-foreground/80">Resolved at:</span> {{ formatDateTime(report.resolved_at || '') }}</p>
                </div>
              </div>

              <div class="mt-3 flex flex-col gap-2">
                <div class="flex items-center gap-2">
                  <button
                    type="button"
                    class="btn-outline flex-1 !px-2 !py-1.5 text-xs"
                    @click="openReportDetail(report)"
                  >
                    View
                  </button>

                  <button
                    type="button"
                    class="inline-flex h-8 w-8 items-center justify-center rounded-md text-success transition hover:bg-success/15 dark:text-success"
                    :title="report.status === 'resolved' ? 'Reopen report' : 'Mark as resolved'"
                    :aria-label="report.status === 'resolved' ? 'Reopen report' : 'Mark as resolved'"
                    :disabled="statusUpdatingReportIds.has(report.id) || isUpdatingReport || deletingReportIds.has(report.id)"
                    @click="promptToggleReportStatus(report.id)"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-4 w-4">
                      <path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                    </svg>
                  </button>

                  <button
                    type="button"
                    class="btn-outline !px-2 !py-1.5 text-xs text-error-600 dark:text-error-400 disabled:opacity-50 disabled:cursor-not-allowed"
                    :disabled="!canDeleteReport(report) || deletingReportIds.has(report.id) || statusUpdatingReportIds.has(report.id)"
                    @click="promptDeleteReport(report.id)"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-4 w-4">
                      <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-9l-1 1H5v2h14V4z" />
                    </svg>
                  </button>
                </div>
              </div>
            </article>
          </div>

          <div class="hidden overflow-x-auto md:block">
            <table class="w-full">
              <thead>
                <tr class="border-b border-primary-100 bg-primary-50/50 dark:bg-black/20">
                  <th class="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted">Created date</th>
                  <th class="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted">Title</th>
                  <th class="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted">Description</th>
                  <th class="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted">Status</th>
                  <th class="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted">Created by / when</th>
                  <th class="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted">Resolved</th>
                  <th class="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider text-muted">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-primary-100">
                <tr
                  v-for="report in openReports"
                  :key="`desktop-${report.id}`"
                  class="transition hover:bg-primary-50/30 dark:hover:bg-white/5"
                >
                  <td class="px-3 py-3 align-top text-xs text-muted">
                    <p>{{ formatDateTime(report.created_at) }}</p>
                  </td>

                  <td class="px-3 py-3 align-top">
                    <p class="w-32 truncate text-sm font-semibold text-foreground" :title="report.title">
                      {{ report.title }}
                    </p>
                  </td>

                  <td class="px-3 py-3 align-top">
                    <p class="w-[13rem] truncate text-xs text-muted" :title="report.description_pt || 'No description'">
                      {{ report.description_pt || 'No description' }}
                    </p>
                  </td>

                  <td class="px-3 py-3 align-top">
                    <span class="inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold" :class="statusBadgeClass(report.status)">
                      {{ report.status === 'resolved' ? 'Resolved' : 'Open' }}
                    </span>
                  </td>

                  <td class="px-3 py-3 align-top text-xs text-muted">
                    <p>{{ displayUserName(report.created_by_name) }}</p>
                    <p class="mt-1">{{ formatDateTime(report.created_at) }}</p>
                  </td>

                  <td class="px-3 py-3 align-top text-xs text-muted">
                    <p>{{ report.status === 'resolved' ? displayUserName(report.resolved_by_name) : '—' }}</p>
                    <p class="mt-1">{{ report.status === 'resolved' ? formatDateTime(report.resolved_at || '') : '—' }}</p>
                  </td>

                  <td class="px-3 py-3 align-middle">
                    <div class="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        class="btn-outline !h-8 !px-2 !py-1 text-xs"
                        @click="openReportDetail(report)"
                      >
                        View
                      </button>

                      <button
                        type="button"
                        class="inline-flex h-8 w-8 items-center justify-center rounded-md text-success transition hover:bg-success/15 dark:text-success"
                        :title="report.status === 'resolved' ? 'Reopen report' : 'Mark as resolved'"
                        :aria-label="report.status === 'resolved' ? 'Reopen report' : 'Mark as resolved'"
                        :disabled="statusUpdatingReportIds.has(report.id) || isLoadingProfile || deletingReportIds.has(report.id)"
                        @click="promptToggleReportStatus(report.id)"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-4 w-4">
                          <path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                        </svg>
                      </button>

                      <button
                        type="button"
                        class="inline-flex h-8 w-8 items-center justify-center rounded-md text-error-600 transition hover:bg-error-100/50 dark:text-error-400 dark:hover:bg-error-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Delete report"
                        aria-label="Delete report"
                        :disabled="!canDeleteReport(report) || deletingReportIds.has(report.id) || statusUpdatingReportIds.has(report.id)"
                        @click="promptDeleteReport(report.id)"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-4 w-4">
                          <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-9l-1 1H5v2h14V4z" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <ReportCreateModal
        :model-value="editingReportId !== null"
        mode="edit"
        :loading="isUpdatingReport || isUploadingEditReportPhotos"
        :initial-value="editReportInitialValue"
        :report-photos-error="editReportPhotosError"
        :pending-report-photos="editPendingReportPhotos"
        :existing-photos="editingExistingReportPhotos"
        :allow-existing-photo-removal="editingReportId !== null"
        @update:model-value="onEditModalModelValueChange"
        @submit="onUpdateReport"
        @photos-change="onEditReportPhotosChange"
        @remove-photo="removeEditPendingReportPhoto"
        @remove-existing-photo="markExistingReportPhotoForRemoval"
      />

      <BaseConfirmModal
        :model-value="reportIdPendingDelete !== null"
        title="Delete report"
        message="This action permanently removes the report. Only the creator or an admin can do this."
        confirm-label="Delete report"
        cancel-label="Cancel"
        danger
        :loading="reportIdPendingDelete !== null && deletingReportIds.has(reportIdPendingDelete)"
        @cancel="closeDeleteReportModal"
        @confirm="confirmDeleteReport"
        @update:model-value="(value) => { if (!value) closeDeleteReportModal() }"
      />

      <BaseConfirmModal
        :model-value="reportIdPendingStatusChange !== null"
        :title="reportIdPendingStatusChange?.targetStatus === 'resolved' ? 'Mark as resolved' : 'Reopen report'"
        :message="reportIdPendingStatusChange?.targetStatus === 'resolved' ? 'Are you sure you want to mark this report as resolved?' : 'Are you sure you want to reopen this report?'"
        :confirm-label="reportIdPendingStatusChange?.targetStatus === 'resolved' ? 'Mark as resolved' : 'Reopen'"
        cancel-label="Cancel"
        :loading="reportIdPendingStatusChange !== null && statusUpdatingReportIds.has(reportIdPendingStatusChange.id)"
        @cancel="closeStatusChangeModal"
        @confirm="confirmStatusChange"
        @update:model-value="(value) => { if (!value) closeStatusChangeModal() }"
      />

      <Teleport to="body">
        <Transition
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="opacity-0"
          enter-to-class="opacity-100"
          leave-active-class="transition duration-150 ease-in"
          leave-from-class="opacity-100"
          leave-to-class="opacity-0"
        >
          <div
            v-if="lightboxUrl"
            class="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4"
            @click="closeLightbox"
          >
            <button
              type="button"
              class="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
              aria-label="Close photo viewer"
              @click="closeLightbox"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-5 w-5">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
              </svg>
            </button>
            <img
              :src="lightboxUrl"
              alt="Photo"
              class="max-h-[90vh] max-w-full rounded-lg object-contain shadow-elevated"
              @click.stop
            />
          </div>
        </Transition>

        <ReportDetailModal
          v-model="isReportDetailModalOpen"
          :report="selectedReportForDetail"
          :photo-urls="selectedReportForDetail ? reportGallery(selectedReportForDetail) : []"
          :can-edit="selectedReportForDetail ? canEditReport(selectedReportForDetail) : false"
          :loading="isUpdatingReport"
          @update:model-value="(value) => { if (!value) { isReportDetailModalOpen = false; selectedReportForDetail = null } }"
          @save="onSaveReportDetail"
        />

        <Transition
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="opacity-0"
          enter-to-class="opacity-100"
          leave-active-class="transition duration-150 ease-in"
          leave-from-class="opacity-100"
          leave-to-class="opacity-0"
        >
          <div
            v-if="isNavigationSheetOpen"
            class="fixed inset-0 z-[110]"
            role="dialog"
            aria-modal="true"
            aria-label="Open with"
          >
            <button
              type="button"
              class="absolute inset-0 bg-black/45"
              aria-label="Close navigation options"
              @click="closeNavigationSheet"
            />

            <Transition
              enter-active-class="transition duration-250 ease-out"
              enter-from-class="translate-y-full"
              enter-to-class="translate-y-0"
              leave-active-class="transition duration-200 ease-in"
              leave-from-class="translate-y-0"
              leave-to-class="translate-y-full"
            >
              <div
                v-if="isNavigationSheetOpen"
                class="absolute inset-x-0 bottom-0 w-full rounded-t-2xl border border-border/90 bg-surface px-4 pb-5 pt-3 shadow-elevated sm:mx-auto sm:max-w-md"
              >
                <div class="mx-auto h-1.5 w-12 rounded-full bg-border/90" />
                <h4 class="mt-3 text-base font-semibold text-foreground">Open with</h4>

                <div class="mt-3 space-y-2">
                  <button
                    type="button"
                    class="btn-primary w-full !justify-center !px-4 !py-3 text-sm"
                    :disabled="!canOpenGoogleMaps"
                    @click="openGoogleMaps"
                  >
                    Google Maps
                  </button>

                  <button
                    type="button"
                    class="btn-outline w-full !justify-center !px-4 !py-3 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                    :disabled="!canOpenWaze"
                    @click="openWaze"
                  >
                    Waze
                  </button>
                  <p v-if="!canOpenWaze" class="px-1 text-xs text-muted">Waze requires coordinates.</p>

                  <button
                    type="button"
                    class="btn-outline w-full !justify-center !px-4 !py-3 text-sm"
                    @click="closeNavigationSheet"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </Transition>
          </div>
        </Transition>
      </Teleport>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import ReportCreateModal from './ReportCreateModal.vue'
import ReportDetailModal from '../reports/ReportDetailModal.vue'
import BaseConfirmModal from '../../ui/BaseConfirmModal.vue'
import BaseFeedbackBanner from '../../ui/BaseFeedbackBanner.vue'
import { useAuth } from '../../../composables/useAuth'
import { useSupabaseClient } from '../../../composables/useSupabaseClient'
import { usePropertyReports } from '../../../composables/usePropertyReports'
import { usePropertyReportPhotos } from '../../../composables/usePropertyReportPhotos'
import { usePropertyKeyPhotos } from '../../../composables/usePropertyKeyPhotos'
import { useUploadReportPhoto } from '../../../composables/useUploadReportPhoto'
import { assertAllowedImageType } from '../../../utils/optimizeImage'
import { buildVisibleTaskTags } from '../../../utils/visualTaskTags'
import type { ProfileDTO } from '../../../../shared/types/ProfileDTO'
import type { PropertyReportDTO, PropertyReportAdminListItemDTO, PropertyReportStatus } from '../../../../shared/types/PropertyReportDTO'

interface PendingPhotoItem {
  id: string
  file: File
  previewUrl: string
}

interface ExistingReportPhotoItem {
  id: string
  url: string
  source: 'gallery' | 'legacy'
}

interface ReportFormPayload {
  reportDate: string
  title: string
  descriptionPt: string
}

interface JobDetailData {
  routeStopId: string
  groupLabel: string
  orderIndex: number
  dailyTaskId: string
  taskDate: string
  propertyId: string
  propertyName: string
  clientName: string
  address: string
  lat: number | null
  lng: number | null
  keyPickupAddress: string | null
  propertyKeys: Array<{
    label: string | null
    pickupAddress: string | null
    note: string | null
    attachmentUrl: string | null
  }>
  propertyNotes: string | null
  link1: string | null
  link2: string | null
  hasKey: boolean
  keyPhotoUrl: string | null
  bathrooms: number
  bedsSingle: number
  bedsQueen: number
  bedsKing: number
  guestName: string | null
  guestCheckinDate: string | null
  tags: string[]
  taskType: 'BSB' | 'NORMAL'
  taskNotes: string | null
  extraTowelsQty: number
  extraBedsSingle: number
  extraBedsQueen: number
  extraBedsKing: number
  extraChocolatesQty: number
}

interface Props {
  routeStopId: string
  mode: 'worker' | 'admin'
}

interface RouteStopRow {
  id: string
  route_group_id: string
  daily_task_id: string
  order_index: number | null
}

interface RouteGroupRow {
  id: string
  group_label: string
}

interface DailyTaskRow {
  id: string
  date: string
  property_id: string
  guest_name: string | null
  guest_checkin_date: string | null
  tags: unknown
  task_type: string | null
  notes: string | null
  extra_towels_qty: number | null
  extra_beds_single: number | null
  extra_beds_queen: number | null
  extra_beds_king: number | null
  extra_chocolates_qty: number | null
}

interface PropertyRow {
  id: string
  client_id: string
  name: string
  address: string
  lat: number | null
  lng: number | null
  default_tags: unknown
  notes: string | null
  has_keys: boolean
  bathrooms: number | string | null
  beds_single: number | null
  beds_queen: number | null
  beds_king: number | null
}

interface PropertyKeyRow {
  property_id: string
  label: string | null
  pickup_address: string | null
  note: string | null
  attachment_url: string | null
}

interface PropertyResourceRow {
  property_id: string
  resource_type: string | null
  url: string | null
}

interface ClientRow {
  id: string
  name: string
}

interface RouteGroupMemberRow {
  employee_id: string
}

interface EmployeeRow {
  id: string
  full_name: string
  email: string | null
  photo_url: string | null
}

interface TeamMemberItem {
  id: string
  fullName: string
  email: string | null
  photoUrl: string | null
}

const props = defineProps<Props>()

const supabase = useSupabaseClient()
const { getProfile } = useAuth()
const { getReportsByProperty, createReport, deleteReport, resolveReport, updateReportStatus, updateReport, setReportPrimaryPhoto } = usePropertyReports()
const { getPhotosByReportIds, createPhotos, deletePhotos } = usePropertyReportPhotos()
const { getPhotosByPropertyId } = usePropertyKeyPhotos()
const { uploadReportPhotos, deleteReportPhoto } = useUploadReportPhoto()

const isLoading = ref(false)
const isLoadingReports = ref(false)
const isLoadingTeam = ref(false)
const isCreatingReport = ref(false)
const isUpdatingReport = ref(false)
const isUploadingReportPhotos = ref(false)
const isUploadingEditReportPhotos = ref(false)
const isLoadingProfile = ref(false)
const deletingReportIds = ref<Set<string>>(new Set())
const statusUpdatingReportIds = ref<Set<string>>(new Set())

const errorMessage = ref('')
const successMessage = ref('')
const reportPhotosError = ref('')
const editReportPhotosError = ref('')

const jobDetail = ref<JobDetailData | null>(null)
const currentProfile = ref<ProfileDTO | null>(null)
const reports = ref<PropertyReportAdminListItemDTO[]>([])
const teamMembers = ref<TeamMemberItem[]>([])
const editingReportId = ref<string | null>(null)
const createPendingReportPhotos = ref<PendingPhotoItem[]>([])
const editPendingReportPhotos = ref<PendingPhotoItem[]>([])
const editingExistingReportPhotos = ref<ExistingReportPhotoItem[]>([])
const removedExistingReportPhotos = ref<ExistingReportPhotoItem[]>([])
const reportPhotosByReportId = ref<Record<string, ExistingReportPhotoItem[]>>({})
const keyPhotoUrls = ref<string[]>([])
const lightboxUrl = ref<string | null>(null)
const isNavigationSheetOpen = ref(false)
const navigationTarget = ref<{ address: string; lat: number | null; lng: number | null } | null>(null)
const reportIdPendingDelete = ref<string | null>(null)
const reportIdPendingStatusChange = ref<{ id: string; targetStatus: PropertyReportStatus } | null>(null)
const isCreateReportModalOpen = ref(false)
const isReportDetailModalOpen = ref(false)
const selectedReportForDetail = ref<PropertyReportAdminListItemDTO | null>(null)
const errorFeedbackTimer = ref<ReturnType<typeof setTimeout> | null>(null)
const successFeedbackTimer = ref<ReturnType<typeof setTimeout> | null>(null)

watch(errorMessage, (message) => {
  if (errorFeedbackTimer.value) {
    clearTimeout(errorFeedbackTimer.value)
    errorFeedbackTimer.value = null
  }

  if (!message) {
    return
  }

  errorFeedbackTimer.value = setTimeout(() => {
    errorMessage.value = ''
    errorFeedbackTimer.value = null
  }, 4000)
})

watch(successMessage, (message) => {
  if (successFeedbackTimer.value) {
    clearTimeout(successFeedbackTimer.value)
    successFeedbackTimer.value = null
  }

  if (!message) {
    return
  }

  successFeedbackTimer.value = setTimeout(() => {
    successMessage.value = ''
    successFeedbackTimer.value = null
  }, 4000)
})

onBeforeUnmount(() => {
  if (errorFeedbackTimer.value) {
    clearTimeout(errorFeedbackTimer.value)
  }
  if (successFeedbackTimer.value) {
    clearTimeout(successFeedbackTimer.value)
  }
})

const createReportInitialValue = computed<ReportFormPayload>(() => ({
  reportDate: jobDetail.value?.taskDate ?? new Date().toISOString().slice(0, 10),
  title: '',
  descriptionPt: '',
}))

const editReportInitialValue = computed<ReportFormPayload | null>(() => {
  if (!editingReportId.value) {
    return null
  }

  const report = reports.value.find((item) => item.id === editingReportId.value)

  if (!report) {
    return null
  }

  return {
    reportDate: report.report_date,
    title: report.title,
    descriptionPt: report.description_pt,
  }
})

const backTo = computed(() => (props.mode === 'admin' ? '/admin/schedule' : '/worker/schedule'))
const isAdmin = computed(() => currentProfile.value?.role === 'admin')
const openReports = computed(() => reports.value.filter((report) => report.status === 'open'))
const canOpenGoogleMaps = computed(() => {
  const target = navigationTarget.value

  if (!target) {
    return false
  }

  const hasCoordinates = target.lat !== null && target.lng !== null
  return hasCoordinates || target.address.trim().length > 0
})
const canOpenWaze = computed(() => {
  const target = navigationTarget.value
  return Boolean(target && target.lat !== null && target.lng !== null)
})

function isReportOwner(report: PropertyReportListItemDTO): boolean {
  return currentProfile.value?.id === report.created_by_profile_id
}

function canEditReport(report: PropertyReportListItemDTO): boolean {
  return report.status === 'open' && (isAdmin.value || isReportOwner(report))
}

function canDeleteReport(report: PropertyReportListItemDTO): boolean {
  return isAdmin.value || isReportOwner(report)
}

function canResolveReport(report: PropertyReportListItemDTO): boolean {
  return report.status === 'open' && (isAdmin.value || isReportOwner(report))
}

function canAdminChangeStatus(): boolean {
  return isAdmin.value
}

function shouldShowResolveButton(report: PropertyReportListItemDTO): boolean {
  return canResolveReport(report) && !canAdminChangeStatus()
}

function displayUserName(name: string | null): string {
  return name?.trim() || 'Unknown user'
}

function statusBadgeClass(status: PropertyReportStatus): string {
  return status === 'resolved'
    ? 'bg-success/15 text-success border border-success/25'
    : 'bg-warning/15 text-warning border border-warning/25'
}

async function loadCurrentProfile(): Promise<void> {
  isLoadingProfile.value = true

  try {
    currentProfile.value = await getProfile()
  } catch (err) {
    currentProfile.value = null
    errorMessage.value = err instanceof Error ? err.message : 'Failed to load current profile.'
  } finally {
    isLoadingProfile.value = false
  }
}

function reportGallery(report: PropertyReportDTO): string[] {
  const photos = reportPhotosByReportId.value[report.id]
  if (photos && photos.length > 0) {
    return photos.map((item) => item.url)
  }
  if (report.photo_url) {
    return [report.photo_url]
  }
  return []
}

function openLightbox(url: string): void {
  lightboxUrl.value = url
}

function closeLightbox(): void {
  lightboxUrl.value = null
}

function promptDeleteReport(reportId: string): void {
  reportIdPendingDelete.value = reportId
}

function closeDeleteReportModal(): void {
  reportIdPendingDelete.value = null
}

function openReportDetail(report: PropertyReportAdminListItemDTO): void {
  selectedReportForDetail.value = report
  isReportDetailModalOpen.value = true
}

async function onSaveReportDetail(payload: { reportDate: string; title: string; descriptionPt: string; status: PropertyReportStatus }): Promise<void> {
  if (!selectedReportForDetail.value || !canEditReport(selectedReportForDetail.value)) {
    return
  }

  isUpdatingReport.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    await updateReport(selectedReportForDetail.value.id, {
      report_date: payload.reportDate,
      title: payload.title,
      description_pt: payload.descriptionPt,
    })

    if (selectedReportForDetail.value.status !== payload.status) {
      await updateReportStatus(selectedReportForDetail.value.id, payload.status)
    }

    successMessage.value = 'Report updated successfully.'
    await loadReports()

    const refreshed = reports.value.find((item) => item.id === selectedReportForDetail.value?.id) ?? null
    selectedReportForDetail.value = refreshed

    if (!refreshed) {
      isReportDetailModalOpen.value = false
    }
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : 'Failed to update report.'
  } finally {
    isUpdatingReport.value = false
  }
}

function buildPendingPhotoItem(file: File): PendingPhotoItem {
  return {
    id: `${Date.now()}-${Math.random()}`,
    file,
    previewUrl: URL.createObjectURL(file),
  }
}

function handleReportPhotosSelection(
  event: Event,
  pendingPhotos: typeof createPendingReportPhotos,
  errorRef: typeof reportPhotosError,
  existingPhotoCount = 0,
): void {
  const input = event.target as HTMLInputElement
  const files = Array.from(input.files ?? [])
  input.value = ''

  if (files.length === 0) {
    return
  }

  errorRef.value = ''

  for (const file of files) {
    try {
      assertAllowedImageType(file)
    } catch (err) {
      errorRef.value = err instanceof Error ? err.message : 'Invalid file type.'
      return
    }
  }

  const remaining = Math.max(0, 5 - existingPhotoCount - pendingPhotos.value.length)
  const toAdd = files.slice(0, remaining)

  if (files.length > remaining) {
    errorRef.value = remaining > 0
      ? `Maximum 5 photos. Only the first ${remaining} were added.`
      : 'Maximum 5 photos allowed.'
  }

  for (const file of toAdd) {
    pendingPhotos.value.push(buildPendingPhotoItem(file))
  }
}

function removePendingPhoto(pendingPhotos: typeof createPendingReportPhotos, id: string): void {
  const idx = pendingPhotos.value.findIndex((item) => item.id === id)
  if (idx !== -1) {
    const item = pendingPhotos.value[idx]
    if (item) {
      URL.revokeObjectURL(item.previewUrl)
    }
    pendingPhotos.value.splice(idx, 1)
  }
}

function clearPendingPhotos(pendingPhotos: typeof createPendingReportPhotos): void {
  for (const item of pendingPhotos.value) {
    URL.revokeObjectURL(item.previewUrl)
  }

  pendingPhotos.value = []
}

function onCreateReportPhotosChange(event: Event): void {
  handleReportPhotosSelection(event, createPendingReportPhotos, reportPhotosError)
}

function onEditReportPhotosChange(event: Event): void {
  handleReportPhotosSelection(event, editPendingReportPhotos, editReportPhotosError, editingExistingReportPhotos.value.length)
}

function removeCreatePendingReportPhoto(id: string): void {
  removePendingPhoto(createPendingReportPhotos, id)
}

function removeEditPendingReportPhoto(id: string): void {
  removePendingPhoto(editPendingReportPhotos, id)
}

function resetCreateReportState(): void {
  clearPendingPhotos(createPendingReportPhotos)
  reportPhotosError.value = ''
}

function resetEditReportState(): void {
  clearPendingPhotos(editPendingReportPhotos)
  editingExistingReportPhotos.value = []
  removedExistingReportPhotos.value = []
  editReportPhotosError.value = ''
}

function openCreateReportModal(): void {
  resetCreateReportState()
  isCreateReportModalOpen.value = true
}

function onCreateModalModelValueChange(value: boolean): void {
  isCreateReportModalOpen.value = value

  if (!value) {
    resetCreateReportState()
  }
}

// Modal open/close handled by v-model

const extrasSummary = computed(() => {
  if (!jobDetail.value) return 'N/A'

  const parts: string[] = []

  if (jobDetail.value.extraTowelsQty > 0) {
    parts.push(`${jobDetail.value.extraTowelsQty} extra towel${jobDetail.value.extraTowelsQty > 1 ? 's' : ''}`)
  }

  const extraBeds = jobDetail.value.extraBedsSingle + jobDetail.value.extraBedsQueen + jobDetail.value.extraBedsKing
  if (extraBeds > 0) {
    parts.push(`${extraBeds} extra bed${extraBeds > 1 ? 's' : ''}`)
  }

  if (jobDetail.value.extraChocolatesQty > 0) {
    parts.push(`${jobDetail.value.extraChocolatesQty} extra chocolate${jobDetail.value.extraChocolatesQty > 1 ? 's' : ''}`)
  }

  return parts.length > 0 ? parts.join(' · ') : 'No extras'
})

function normalizeTags(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
}

function formatDateTime(value: string): string {
  if (!value) return 'N/A'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDate(value: string): string {
  if (!value) return 'N/A'

  const date = new Date(`${value}T00:00:00`)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function getInitials(fullName: string): string {
  return fullName
    .split(' ')
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || 'N/A'
}

function getEditableExistingPhotos(report: PropertyReportListItemDTO): ExistingReportPhotoItem[] {
  const galleryPhotos = reportPhotosByReportId.value[report.id] ?? []

  if (galleryPhotos.length > 0) {
    return galleryPhotos.map((photo) => ({
      ...photo,
      source: 'gallery',
    }))
  }

  if (report.photo_url) {
    return [
      {
        id: `${report.id}:legacy:0`,
        url: report.photo_url,
        source: 'legacy',
      },
    ]
  }

  return []
}

function startEditReport(report: PropertyReportListItemDTO): void {
  if (!canEditReport(report)) {
    return
  }

  resetEditReportState()
  editingReportId.value = report.id
  editingExistingReportPhotos.value = getEditableExistingPhotos(report)
}

function cancelEditReport(): void {
  editingReportId.value = null
  resetEditReportState()
}

function onEditModalModelValueChange(value: boolean): void {
  if (!value) {
    cancelEditReport()
  }
}

function markExistingReportPhotoForRemoval(photoId: string): void {
  const index = editingExistingReportPhotos.value.findIndex((item) => item.id === photoId)

  if (index === -1) {
    return
  }

  const photo = editingExistingReportPhotos.value[index]

  if (!photo) {
    return
  }

  removedExistingReportPhotos.value.push(photo)
  editingExistingReportPhotos.value.splice(index, 1)
}

async function onUpdateReport(payload: ReportFormPayload): Promise<void> {
  if (!editingReportId.value) {
    return
  }

  isUpdatingReport.value = true
  isUploadingEditReportPhotos.value = editPendingReportPhotos.value.length > 0
  errorMessage.value = ''
  successMessage.value = ''

  try {
    await updateReport(editingReportId.value, {
      report_date: payload.reportDate,
      title: payload.title,
      description_pt: payload.descriptionPt,
    })

    const removedGalleryPhotos = removedExistingReportPhotos.value.filter((item) => item.source === 'gallery')
    const removedLegacyPhotos = removedExistingReportPhotos.value.filter((item) => item.source === 'legacy')

    for (const photo of removedLegacyPhotos) {
      await deleteReportPhoto(photo.url)
    }

    if (removedLegacyPhotos.length > 0) {
      await setReportPrimaryPhoto(editingReportId.value, null)
    }

    if (removedGalleryPhotos.length > 0) {
      for (const photo of removedGalleryPhotos) {
        await deleteReportPhoto(photo.url)
      }

      await deletePhotos(editingReportId.value, removedGalleryPhotos.map((photo) => photo.id))
    }

    if (editPendingReportPhotos.value.length > 0) {
      const filesToUpload = editPendingReportPhotos.value.map((item) => item.file)
      const uploadedUrls = await uploadReportPhotos(filesToUpload)
      await createPhotos(editingReportId.value, uploadedUrls)
    }

    successMessage.value = 'Report updated successfully.'
    cancelEditReport()
    await loadReports()
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : 'Failed to update report.'
  } finally {
    isUpdatingReport.value = false
    isUploadingEditReportPhotos.value = false
  }
}

async function loadKeyPhotos(): Promise<void> {
  if (!jobDetail.value) {
    return
  }

  try {
    const photos = await getPhotosByPropertyId(jobDetail.value.propertyId)
    keyPhotoUrls.value = photos.map((p) => p.photo_url)
  } catch {
    keyPhotoUrls.value = []
  }
}

async function loadReportPhotos(): Promise<void> {
  if (reports.value.length === 0) {
    reportPhotosByReportId.value = {}
    return
  }

  try {
    const reportIds = reports.value.map((r) => r.id)
    const photoMap = await getPhotosByReportIds(reportIds)
    const mappedPhotos: Record<string, ExistingReportPhotoItem[]> = {}
    for (const [reportId, photos] of Object.entries(photoMap)) {
      mappedPhotos[reportId] = photos.map((photo) => ({
        id: photo.id,
        url: photo.photo_url,
        source: 'gallery',
      }))
    }
    reportPhotosByReportId.value = mappedPhotos
  } catch {
    reportPhotosByReportId.value = {}
  }
}

async function loadTeamMembers(routeGroupId: string): Promise<void> {
  isLoadingTeam.value = true

  try {
    const { data: memberData, error: memberError } = await supabase
      .from('route_group_members')
      .select('employee_id')
      .eq('route_group_id', routeGroupId)

    if (memberError) {
      throw new Error(memberError.message)
    }

    const employeeIds = [...new Set(((memberData ?? []) as RouteGroupMemberRow[]).map((item) => item.employee_id))]

    if (employeeIds.length === 0) {
      teamMembers.value = []
      return
    }

    const { data: employeeData, error: employeeError } = await supabase
      .from('employees')
      .select('id, full_name, email, photo_url')
      .in('id', employeeIds)

    if (employeeError) {
      throw new Error(employeeError.message)
    }

    teamMembers.value = ((employeeData ?? []) as EmployeeRow[])
      .map((employee) => ({
        id: employee.id,
        fullName: employee.full_name,
        email: employee.email,
        photoUrl: employee.photo_url,
      }))
      .sort((a, b) => a.fullName.localeCompare(b.fullName))
  } catch (err) {
    teamMembers.value = []
    errorMessage.value = err instanceof Error ? err.message : 'Failed to load team members.'
  } finally {
    isLoadingTeam.value = false
  }
}

async function loadJobDetail(): Promise<void> {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const { data: stopData, error: stopError } = await supabase
      .from('route_stops')
      .select('id, route_group_id, daily_task_id, order_index')
      .eq('id', props.routeStopId)
      .maybeSingle()

    if (stopError) {
      throw new Error(stopError.message)
    }

    if (!stopData) {
      jobDetail.value = null
      return
    }

    const routeStop = stopData as RouteStopRow

    const [{ data: groupData, error: groupError }, { data: taskData, error: taskError }] = await Promise.all([
      supabase
        .from('route_groups')
        .select('id, group_label')
        .eq('id', routeStop.route_group_id)
        .maybeSingle(),
      supabase
        .from('daily_tasks')
        .select('id, date, property_id, guest_name, guest_checkin_date, tags, task_type, notes, extra_towels_qty, extra_beds_single, extra_beds_queen, extra_beds_king, extra_chocolates_qty')
        .eq('id', routeStop.daily_task_id)
        .maybeSingle(),
    ])

    if (groupError) {
      throw new Error(groupError.message)
    }

    if (taskError) {
      throw new Error(taskError.message)
    }

    if (!taskData) {
      jobDetail.value = null
      return
    }

    const task = taskData as DailyTaskRow

    const [{ data: propertyData, error: propertyError }] = await Promise.all([
      supabase
        .from('properties')
        .select('id, client_id, name, address, lat, lng, default_tags, notes, has_keys, bathrooms, beds_single, beds_queen, beds_king')
        .eq('id', task.property_id)
        .maybeSingle(),
    ])

    if (propertyError) {
      throw new Error(propertyError.message)
    }

    if (!propertyData) {
      jobDetail.value = null
      return
    }

    const property = propertyData as PropertyRow

    const [{ data: propertyKeyData, error: propertyKeyError }, { data: propertyResourceData, error: propertyResourceError }] = await Promise.all([
      supabase
        .from('property_keys')
        .select('property_id, label, pickup_address, note, attachment_url')
        .eq('property_id', property.id)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true }),
      supabase
        .from('property_resources')
        .select('property_id, resource_type, url')
        .eq('property_id', property.id)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true }),
    ])

    if (propertyKeyError) {
      throw new Error(propertyKeyError.message)
    }

    if (propertyResourceError) {
      throw new Error(propertyResourceError.message)
    }

    const propertyKeys = (propertyKeyData ?? []) as PropertyKeyRow[]
    const propertyResources = ((propertyResourceData ?? []) as PropertyResourceRow[])
      .filter((item) => item.resource_type === 'link' && typeof item.url === 'string' && item.url.trim().length > 0)

    const { data: clientData, error: clientError } = await supabase
      .from('clients')
      .select('id, name')
      .eq('id', property.client_id)
      .maybeSingle()

    if (clientError) {
      throw new Error(clientError.message)
    }

    const client = (clientData as ClientRow | null)

    jobDetail.value = {
      routeStopId: routeStop.id,
      groupLabel: (groupData as RouteGroupRow | null)?.group_label ?? '-',
      orderIndex: routeStop.order_index ?? 0,
      dailyTaskId: task.id,
      taskDate: task.date,
      propertyId: property.id,
      propertyName: property.name,
      clientName: client?.name ?? 'N/A',
      address: property.address,
      lat: property.lat ?? null,
      lng: property.lng ?? null,
      keyPickupAddress: propertyKeys[0]?.pickup_address ?? null,
      propertyKeys: propertyKeys.map((item) => ({
        label: item.label?.trim() || null,
        pickupAddress: item.pickup_address?.trim() || null,
        note: item.note?.trim() || null,
        attachmentUrl: item.attachment_url?.trim() || null,
      })),
      propertyNotes: property.notes,
      link1: propertyResources[0]?.url?.trim() ?? null,
      link2: propertyResources[1]?.url?.trim() ?? null,
      hasKey: Boolean(property.has_keys) || propertyKeys.length > 0,
      keyPhotoUrl: null,
      bathrooms: Number(property.bathrooms ?? 0),
      bedsSingle: Number(property.beds_single ?? 0),
      bedsQueen: Number(property.beds_queen ?? 0),
      bedsKing: Number(property.beds_king ?? 0),
      guestName: task.guest_name,
      guestCheckinDate: task.guest_checkin_date,
      tags: buildVisibleTaskTags(normalizeTags(task.tags), normalizeTags(property.default_tags)),
      taskType: task.task_type === 'BSB' ? 'BSB' : 'NORMAL',
      taskNotes: task.notes,
      extraTowelsQty: Number(task.extra_towels_qty ?? 0),
      extraBedsSingle: Number(task.extra_beds_single ?? 0),
      extraBedsQueen: Number(task.extra_beds_queen ?? 0),
      extraBedsKing: Number(task.extra_beds_king ?? 0),
      extraChocolatesQty: Number(task.extra_chocolates_qty ?? 0),
    }

    await Promise.all([
      loadTeamMembers(routeStop.route_group_id),
      loadReports(),
      loadKeyPhotos(),
    ])
  } catch (err) {
    teamMembers.value = []
    errorMessage.value = err instanceof Error ? err.message : 'Failed to load job detail.'
  } finally {
    isLoading.value = false
  }
}

async function loadReports(): Promise<void> {
  if (!jobDetail.value) {
    reports.value = []
    return
  }

  isLoadingReports.value = true

  try {
    const loadedReports = await getReportsByProperty(jobDetail.value.propertyId)
    // Enrich reports with property_name and client_name for ReportDetailModal
    reports.value = loadedReports.map((report) => ({
      ...report,
      property_name: jobDetail.value!.propertyName,
      client_name: jobDetail.value!.clientName,
    })) as any
    await loadReportPhotos()
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : 'Failed to load reports.'
    reports.value = []
  } finally {
    isLoadingReports.value = false
  }
}

async function onCreateReport(payload: ReportFormPayload): Promise<void> {
  if (!jobDetail.value) {
    return
  }

  isCreatingReport.value = true
  isUploadingReportPhotos.value = createPendingReportPhotos.value.length > 0
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const newReport = await createReport({
      property_id: jobDetail.value.propertyId,
      daily_task_id: jobDetail.value.dailyTaskId,
      report_date: payload.reportDate,
      title: payload.title,
      description_pt: payload.descriptionPt,
    })

    if (createPendingReportPhotos.value.length > 0) {
      const filesToUpload = createPendingReportPhotos.value.map((item) => item.file)
      const uploadedUrls = await uploadReportPhotos(filesToUpload)
      await createPhotos(newReport.id, uploadedUrls)
    }

    resetCreateReportState()
    isCreateReportModalOpen.value = false

    successMessage.value = 'Report created successfully.'
    await loadReports()
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : 'Failed to create report.'
  } finally {
    isCreatingReport.value = false
    isUploadingReportPhotos.value = false
  }
}

async function onResolveReport(reportId: string): Promise<void> {
  const current = new Set(statusUpdatingReportIds.value)
  current.add(reportId)
  statusUpdatingReportIds.value = current
  errorMessage.value = ''
  successMessage.value = ''

  try {
    await resolveReport(reportId)
    successMessage.value = 'Report marked as resolved.'
    await loadReports()
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : 'Failed to resolve report.'
  } finally {
    const next = new Set(statusUpdatingReportIds.value)
    next.delete(reportId)
    statusUpdatingReportIds.value = next
  }
}

function promptToggleReportStatus(reportId: string): void {
  const report = reports.value.find((item) => item.id === reportId)
  if (!report) return
  errorMessage.value = ''
  successMessage.value = ''
  const targetStatus = report.status === 'resolved' ? 'open' : 'resolved'
  reportIdPendingStatusChange.value = { id: reportId, targetStatus }
}

function closeStatusChangeModal(): void {
  reportIdPendingStatusChange.value = null
}

async function confirmStatusChange(): Promise<void> {
  if (!reportIdPendingStatusChange.value) return

  const { id: reportId, targetStatus } = reportIdPendingStatusChange.value
  const nextStatusIds = new Set(statusUpdatingReportIds.value)
  nextStatusIds.add(reportId)
  statusUpdatingReportIds.value = nextStatusIds
  errorMessage.value = ''
  successMessage.value = ''

  try {
    if (!isAdmin.value && targetStatus === 'resolved') {
      await resolveReport(reportId)
    } else {
      await updateReportStatus(reportId, targetStatus)
    }
    successMessage.value = targetStatus === 'resolved' ? 'Report marked as resolved.' : 'Report reopened successfully.'
    closeStatusChangeModal()
    await loadReports()
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : 'Failed to update report status.'
  } finally {
    const next = new Set(statusUpdatingReportIds.value)
    next.delete(reportId)
    statusUpdatingReportIds.value = next
  }
}

async function confirmDeleteReport(): Promise<void> {
  if (!reportIdPendingDelete.value) {
    return
  }

  const reportId = reportIdPendingDelete.value
  const nextDeletingIds = new Set(deletingReportIds.value)
  nextDeletingIds.add(reportId)
  deletingReportIds.value = nextDeletingIds
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const report = reports.value.find((item) => item.id === reportId)
    const photoUrls = report ? reportGallery(report) : []

    for (const photoUrl of photoUrls) {
      await deleteReportPhoto(photoUrl)
    }

    await deleteReport(reportId)
    successMessage.value = 'Report deleted successfully.'
    closeDeleteReportModal()
    await loadReports()
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : 'Failed to delete report.'
  } finally {
    const remainingDeletingIds = new Set(deletingReportIds.value)
    remainingDeletingIds.delete(reportId)
    deletingReportIds.value = remainingDeletingIds
  }
}

async function onAdminStatusChange(reportId: string, status: PropertyReportStatus): Promise<void> {
  const report = reports.value.find((item) => item.id === reportId)

  if (!report || report.status === status) {
    return
  }

  const nextStatusIds = new Set(statusUpdatingReportIds.value)
  nextStatusIds.add(reportId)
  statusUpdatingReportIds.value = nextStatusIds
  errorMessage.value = ''
  successMessage.value = ''

  try {
    await updateReportStatus(reportId, status)
    successMessage.value = status === 'resolved'
      ? 'Report marked as resolved.'
      : 'Report reopened successfully.'
    await loadReports()
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : 'Failed to update report status.'
  } finally {
    const remainingStatusIds = new Set(statusUpdatingReportIds.value)
    remainingStatusIds.delete(reportId)
    statusUpdatingReportIds.value = remainingStatusIds
  }
}

function copyToClipboard(text: string): void {
  navigator.clipboard.writeText(text).catch((err) => {
    errorMessage.value = 'Failed to copy to clipboard.'
    console.error(err)
  })
}

function openNavigationSheet(target: { address?: string | null; lat?: number | null; lng?: number | null }): void {
  const address = target.address?.trim() ?? ''
  const lat = target.lat ?? null
  const lng = target.lng ?? null

  if (lat === null && lng === null && !address) {
    return
  }

  navigationTarget.value = {
    address,
    lat,
    lng,
  }
  isNavigationSheetOpen.value = true
}

function closeNavigationSheet(): void {
  isNavigationSheetOpen.value = false
  navigationTarget.value = null
}

function openGoogleMaps(): void {
  const target = navigationTarget.value

  if (!target) {
    return
  }

  const hasCoordinates = target.lat !== null && target.lng !== null
  let url = ''

  if (hasCoordinates) {
    const latLng = `${target.lat},${target.lng}`
    url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(latLng)}`
  } else if (target.address.trim()) {
    url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(target.address.trim())}`
  }

  if (!url) {
    return
  }

  window.open(url, '_blank', 'noopener,noreferrer')
  closeNavigationSheet()
}

function openWaze(): void {
  const target = navigationTarget.value

  if (!target || target.lat === null || target.lng === null) {
    errorMessage.value = 'Waze requires coordinates.'
    return
  }

  const latLng = `${target.lat},${target.lng}`
  const url = `https://waze.com/ul?ll=${encodeURIComponent(latLng)}&navigate=yes`
  window.open(url, '_blank', 'noopener,noreferrer')
  closeNavigationSheet()
}

onMounted(async () => {
  await Promise.all([
    loadCurrentProfile(),
    loadJobDetail(),
  ])
})
</script>
