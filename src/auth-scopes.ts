export const SCOPE_DESCRIPTIONS = {
  'owner:read': 'Read private drafts, reading material, media, and settings',
  'owner:draft': 'Create and edit drafts, upload media, and use configured AI generation',
  'owner:publish': 'Publish, withdraw, refresh, pin, and change public item responses or media',
  'owner:manage': 'Change settings, subscriptions, signals, collections, and response moderation',
  'reading:state': 'Mark reading entries read or unread',
} as const;
export type OwnerScope = keyof typeof SCOPE_DESCRIPTIONS;
export const OWNER_SCOPES = Object.keys(SCOPE_DESCRIPTIONS) as OwnerScope[];
