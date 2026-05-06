import {
  classifySectionTone,
  parseStableJson,
  splitNotesByLocale,
  summarizeNotes,
} from "@/lib/changelog-parser";

describe("splitNotesByLocale", () => {
  it("splits notes by the <!-- zh --> marker", () => {
    const result = splitNotesByLocale(
      "## 1.0.0\n\n- english one\n\n<!-- zh -->\n\n## 1.0.0\n\n- 中文一",
    );
    expect(result.en).toContain("english one");
    expect(result.zh).toContain("中文一");
    expect(result.en).not.toContain("中文一");
    expect(result.zh).not.toContain("english one");
  });

  it("falls back to using the same notes for both locales when marker missing", () => {
    const result = splitNotesByLocale("## 1.0.0\n\n- english only");
    expect(result.en).toBe(result.zh);
    expect(result.en).toContain("english only");
  });

  it("is case-insensitive and tolerant of whitespace inside the marker", () => {
    const result = splitNotesByLocale(
      "english side\n<!--   ZH  -->\nchinese side",
    );
    expect(result.en).toBe("english side");
    expect(result.zh).toBe("chinese side");
  });
});

describe("parseStableJson", () => {
  const valid = {
    version: "0.6.0",
    notes:
      "## 0.6.0\n\n### Features\n\n- en feat\n\n<!-- zh -->\n\n## 0.6.0\n\n### Features\n\n- 中文功能",
    pub_date: "2026-05-02T17:35:00Z",
    platforms: {
      "darwin-aarch64": {
        signature: "sig",
        url: "https://example.com/UniClipboard_aarch64-apple-darwin.app.tar.gz",
      },
      "windows-x86_64": {
        signature: "sig",
        url: "https://example.com/UniClipboard_0.6.0_x64-setup.exe",
      },
    },
  };

  it("parses a valid payload and exposes locale-split notes", () => {
    const parsed = parseStableJson(valid);
    expect(parsed.version).toBe("0.6.0");
    expect(parsed.pubDate).toBeInstanceOf(Date);
    expect(parsed.pubDate.getUTCFullYear()).toBe(2026);
    expect(parsed.notesEn).toContain("en feat");
    expect(parsed.notesZh).toContain("中文功能");
    expect(parsed.assets).toHaveLength(2);
    expect(parsed.platforms["darwin-aarch64"].url).toContain(
      "darwin.app.tar.gz",
    );
  });

  it("rejects payloads missing required fields", () => {
    expect(() => parseStableJson({ version: "1.0.0" })).toThrow();
  });

  it("rejects payloads with invalid pub_date", () => {
    expect(() => parseStableJson({ ...valid, pub_date: "not-a-date" })).toThrow(
      /pub_date/i,
    );
  });
});

describe("summarizeNotes", () => {
  it("extracts sections by ### headings and counts list items", () => {
    const summary = summarizeNotes(
      "## 0.6.0\n\n### Breaking Changes\n\n- one\n\n### Features\n\n- a\n- b\n- c\n\n### Fixes\n\n- x\n- y",
    );
    expect(summary.versionHeading).toBe("0.6.0");
    expect(summary.sections.map((s) => s.title)).toEqual([
      "Breaking Changes",
      "Features",
      "Fixes",
    ]);
    expect(summary.sections.map((s) => s.itemCount)).toEqual([1, 3, 2]);
  });

  it("handles notes without a version heading", () => {
    const summary = summarizeNotes("### Fixes\n\n- a\n- b");
    expect(summary.versionHeading).toBeNull();
    expect(summary.sections).toHaveLength(1);
    expect(summary.sections[0].itemCount).toBe(2);
  });
});

describe("classifySectionTone", () => {
  it.each([
    ["Breaking Changes", "breaking"],
    ["破坏性变更", "breaking"],
    ["Features", "feature"],
    ["新增功能", "feature"],
    ["Fixes", "fix"],
    ["Bug Fixes", "fix"],
    ["修复", "fix"],
    ["Notes", "neutral"],
  ] as const)("classifies %s as %s", (title, expected) => {
    expect(classifySectionTone(title)).toBe(expected);
  });
});
