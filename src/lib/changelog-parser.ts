import { z } from "zod";

export const stableJsonSchema = z.object({
  version: z.string().min(1),
  notes: z.string(),
  pub_date: z.string(),
  platforms: z
    .record(
      z.string(),
      z.object({
        signature: z.string().optional(),
        url: z.string().url(),
      }),
    )
    .default({}),
});

export type StableJson = z.infer<typeof stableJsonSchema>;

export type PlatformAsset = {
  key: string;
  url: string;
};

export type ParsedRelease = {
  version: string;
  pubDate: Date;
  notesEn: string;
  notesZh: string;
  platforms: Record<string, { url: string; signature?: string }>;
  assets: PlatformAsset[];
  raw: StableJson;
};

const ZH_MARKER = /<!--\s*zh\s*-->/i;

export function splitNotesByLocale(notes: string): {
  en: string;
  zh: string;
} {
  const parts = notes.split(ZH_MARKER);
  if (parts.length < 2) {
    return { en: notes.trim(), zh: notes.trim() };
  }
  const [first, ...rest] = parts;
  return {
    en: first.trim(),
    zh: rest.join("").trim(),
  };
}

export function parseStableJson(input: unknown): ParsedRelease {
  const data = stableJsonSchema.parse(input);
  const pubDate = new Date(data.pub_date);
  if (Number.isNaN(pubDate.getTime())) {
    throw new Error(`Invalid pub_date: ${data.pub_date}`);
  }
  const { en, zh } = splitNotesByLocale(data.notes);
  const assets: PlatformAsset[] = Object.entries(data.platforms).map(
    ([key, value]) => ({ key, url: value.url }),
  );
  return {
    version: data.version,
    pubDate,
    notesEn: en,
    notesZh: zh,
    platforms: data.platforms,
    assets,
    raw: data,
  };
}

export type ReleaseSection = {
  title: string;
  body: string;
  itemCount: number;
};

export type ReleaseSummary = {
  versionHeading: string | null;
  sections: ReleaseSection[];
};

const HEADING_RE = /^###\s+(.+)\s*$/;
const VERSION_HEADING_RE = /^##\s+(.+)\s*$/;
const LIST_ITEM_RE = /^\s*[-*]\s+/;

export function summarizeNotes(notes: string): ReleaseSummary {
  const lines = notes.split(/\r?\n/);
  const sections: ReleaseSection[] = [];
  let versionHeading: string | null = null;
  let current: ReleaseSection | null = null;
  let bodyLines: string[] = [];

  const flush = () => {
    if (current) {
      current.body = bodyLines.join("\n").trim();
      current.itemCount = bodyLines.filter((l) => LIST_ITEM_RE.test(l)).length;
      sections.push(current);
    }
    current = null;
    bodyLines = [];
  };

  for (const line of lines) {
    const versionMatch = !current && line.match(VERSION_HEADING_RE);
    if (versionMatch && versionHeading === null) {
      versionHeading = versionMatch[1].trim();
      continue;
    }
    const headingMatch = line.match(HEADING_RE);
    if (headingMatch) {
      flush();
      current = {
        title: headingMatch[1].trim(),
        body: "",
        itemCount: 0,
      };
      continue;
    }
    if (current) {
      bodyLines.push(line);
    }
  }
  flush();
  return { versionHeading, sections };
}

const SECTION_TONE_RULES: Array<{
  match: RegExp;
  tone: "breaking" | "feature" | "fix" | "neutral";
}> = [
  { match: /breaking|破坏|破壞/i, tone: "breaking" },
  {
    match: /feature|新增|改进|改進|enhancement|added|improvement/i,
    tone: "feature",
  },
  { match: /fix|bug|修复|修復/i, tone: "fix" },
];

export type SectionTone = "breaking" | "feature" | "fix" | "neutral";

export function classifySectionTone(title: string): SectionTone {
  for (const rule of SECTION_TONE_RULES) {
    if (rule.match.test(title)) return rule.tone;
  }
  return "neutral";
}
