export const FOUNDER_PLATFORMS = [
  "github",
  "bilibili",
  "twitter",
  "weibo",
  "xiaohongshu",
  "douyin",
  "youtube",
  "email",
  "other",
] as const;

export type FounderPlatform = (typeof FOUNDER_PLATFORMS)[number];
