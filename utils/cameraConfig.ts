// Soft feature switch. Keep this in source control; it is not deployment configuration.
export const CAMERA_MODERATION_ENABLED = false

// Public gallery starts at midnight on September 6, 2026 in Asia/Manila (UTC+8).
// Older test photos remain available to admins but are never returned publicly.
export const CAMERA_GALLERY_START_AT = '2026-09-05T16:00:00.000Z'

// Camera closes at midnight after the party (September 7 in Asia/Manila).
export const CAMERA_EVENT_END_AT = '2026-09-06T16:00:00.000Z'
