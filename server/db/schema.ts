import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'

export const rsvps = sqliteTable('rsvps', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  displayName: text('display_name').notNull(),
  submitterName: text('submitter_name').notNull(),
  contact: text('contact'),
  headcount: integer('headcount').default(1),
  dietaryNotes: text('dietary_notes'),
  status: text('status').default('pending'), // pending | confirmed | declined
  showOnPublic: integer('show_on_public', { mode: 'boolean' }).default(false),
  sortOrder: integer('sort_order').default(0),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
})

export const activities = sqliteTable('activities', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  lapNumber: text('lap_number'),
  label: text('label').notNull(),
  time: text('time').notNull(),
  venueName: text('venue_name'),
  address: text('address'),
  note: text('note'),
  isVisible: integer('is_visible', { mode: 'boolean' }).default(true),
  sortOrder: integer('sort_order').default(0),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
})

export const photos = sqliteTable('photos', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  url: text('url').notNull(),
  storageKey: text('storage_key').notNull(),
  uploaderName: text('uploader_name'),
  caption: text('caption'),
  status: text('status').default('pending'), // pending | approved | rejected
  isFeatured: integer('is_featured', { mode: 'boolean' }).default(false),
  showOnPublic: integer('show_on_public', { mode: 'boolean' }).default(false),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
})

export const timeCapsuleEntries = sqliteTable('time_capsule_entries', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  submitterName: text('submitter_name').notNull(),
  message: text('message').notNull(),
  status: text('status').default('pending'), // pending | approved | hidden
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
})

export const contributions = sqliteTable('contributions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  submitterName: text('submitter_name').notNull(),
  amount: real('amount').notNull(),
  message: text('message'),
  showOnPublic: integer('show_on_public', { mode: 'boolean' }).default(true),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
})

export const fundSettings = sqliteTable('fund_settings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  goal: real('goal').notNull().default(100000),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
})

export const activityLog = sqliteTable('activity_log', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  action: text('action').notNull(),
  entityType: text('entity_type').notNull(),
  entityId: integer('entity_id'),
  description: text('description').notNull(),
  createdAt: text('created_at').notNull(),
})
