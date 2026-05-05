---
name: publish-article
description: Publish, update, list, or delete articles on the UniClipboard marketing site via the token-authenticated /api/v1/articles endpoint. Supports all categories — blog (markdown), compare and use-cases (template). Use when the user asks to "publish a blog post", "ship a comparison page", "add a use-cases landing page", "update an article", or supplies content to be posted.
user-invokable: true
args:
  - name: action
    description: One of "create", "update", "list", "get", "delete" (defaults to create when content is provided)
    required: false
---

Publish articles to the UniClipboard site by calling its token-authenticated REST API. The endpoint accepts all three article categories — `blog`, `compare`, and `use-cases`.

Once an article is `status: "published"`, it is automatically included in `/sitemap.xml` and `/llms.txt`. You do **not** need to edit `sitemap.ts`, `llms.txt`, `messages/*.json`, or create any `page.tsx` file. The dynamic `[slug]` route reads content directly from the database.

## Configuration

The skill needs two environment variables. Prompt the user for them if they're missing.

| Variable | Example | Where it comes from |
| --- | --- | --- |
| `UC_API_BASE` | `https://uniclipboard.app` (prod) or `http://localhost:3000` (dev) | The site origin without a trailing slash |
| `UC_API_TOKEN` | `uct_xxxxxxxx...` | Created at `/admin/tokens` in the UniClipboard admin. Plaintext is shown once on creation — store it in a password manager / .env file |

If `UC_API_TOKEN` is missing, tell the user to sign in to `${UC_API_BASE}/admin/tokens` and click "New token", then export it.

## Categories and content types

Each category maps to one content type, enforced by Zod on the server. `translations.en.contentType` and `translations.zh.contentType` must match the category's expected value.

| Category | URL pattern | `contentType` | Used for |
| --- | --- | --- | --- |
| `blog` | `/blog/{slug}` | `markdown` | Long-form posts, release notes, narrative SEO |
| `compare` | `/compare/{slug}` | `template` | "X vs UniClipboard" head-to-head landing pages |
| `use-cases` | `/use-cases/{slug}` | `template` | "How to do X with UniClipboard" use-case landing pages |

## Common payload shape

Every article (regardless of category) has this top-level envelope:

```jsonc
{
  "slug": "my-post",                 // lowercase letters, digits, hyphens; ≤ 96 chars
  "category": "blog",                // "blog" | "compare" | "use-cases"
  "datePublished": "2026-05-05",     // YYYY-MM-DD
  "status": "draft",                 // "draft" or "published"; default "draft"
  "translations": {
    "en": { /* see content-type sections below */ },
    "zh": { /* same shape, Chinese copy */ }
  }
}
```

Both `en` and `zh` translations are required. If the user only gave you English copy, ask whether to translate to Chinese before publishing, or default to a placeholder Chinese version that mirrors the English structure.

Default `status` to `draft` unless the user explicitly says "publish" / "ship live".

## Markdown content (category: `blog`)

Each translation must be:

```jsonc
{
  "contentType": "markdown",
  "seo": {
    "title": "...",                  // <title> + og:title
    "description": "...",            // meta description
    "keywords": "comma, separated, keywords",
    "ogAlt": "alt text for the og image"
  },
  "hero": {
    "title": "Display title",        // required
    "subtitle": ""                   // optional, can be empty string
  },
  "meta": {
    "breadcrumbCurrent": "Blog post title",
    "lastUpdatedLabel": "Last updated",
    "lastUpdatedDate": "2026-05-05"
  },
  "body": "## First section\n\nBody as GitHub-flavored markdown..."
}
```

Notes:
- `body` is GFM markdown. `## h2` headings populate the right-rail table of contents; `### h3` and below do not.
- Fenced code blocks (` ```ts `) are syntax-highlighted with Shiki on the server.

## Template content (category: `compare` or `use-cases`)

Each translation must be:

```jsonc
{
  "contentType": "template",
  "seo": {
    "title": "...",
    "description": "...",
    "keywords": "...",
    "ogAlt": "..."
  },
  "hero": {
    "eyebrow": "Comparison",         // small kicker above the H1
    "title": "Full sentence H1",     // a complete answer-shaped question/claim
    "subtitle": "One-line subtitle under the H1",
    "lede": "Self-contained definitional sentence used as the article lede"
  },
  "meta": {
    "breadcrumbCurrent": "Page title in breadcrumb",
    "lastUpdatedLabel": "Last updated",
    "lastUpdatedDate": "2026-05-05"
  },
  "tldr": {
    "eyebrow": "TL;DR",
    "title": "What you need to know",
    "items": [                       // 5–7 declarative facts; first-pass scanners read this
      "Fact one.",
      "Fact two.",
      "..."
    ]
  },
  "twoColumn": {
    "left":  { "eyebrow": "...", "title": "...", "body": "..." },
    "right": { "eyebrow": "...", "title": "...", "body": "..." }
  },
  "comparison": {
    "eyebrow": "Side by side",
    "title": "How they compare",
    "note": "",                      // optional footnote (e.g. data source date)
    "headers": {
      "feature": "Feature",
      "uc": "UniClipboard",
      "other": "iCloud Universal Clipboard"
    },
    "rows": [
      { "feature": "Cross-platform", "uc": "Mac, Windows, Linux", "other": "Apple devices only" }
      // …more rows
    ]
  },
  "steps": {
    "eyebrow": "Switch in 3 steps",
    "title": "Get going in under 5 minutes",
    "items": [                       // 3–5 numbered steps
      "Install UniClipboard on each device.",
      "..."
    ]
  },
  "verdict": {
    "eyebrow": "Verdict",
    "title": "One-line verdict",
    "body": "Single quotable paragraph that answers the page's headline question."
  },
  "faq": {
    "eyebrow": "FAQ",
    "title": "Common questions",
    "items": [                       // 5–8 Q&A pairs; powers FAQPage JSON-LD
      { "q": "Question?", "a": "Answer." }
    ]
  },
  "cta": {
    "eyebrow": "Try it",
    "title": "Ready to switch?",
    "body": "Short paragraph below the CTA buttons.",
    "primary": "Download",           // primary button label (href is fixed to /#download)
    "secondary": "Read the whitepaper" // secondary button label (href is fixed to /whitepaper)
  },
  "about": ["Pastebot", "..."],      // optional — competitor / tool names mentioned for Article schema
  "howTo": {                         // optional — emits HowTo JSON-LD; pair with steps.items
    "tools": ["Mac running macOS 12+", "Windows 10/11 PC", "UniClipboard app"],
    "totalTime": "PT5M"              // optional ISO 8601 duration
  }
}
```

Notes for templates:
- Every `eyebrow`, `title`, `body`, `feature`, `uc`, `other`, `q`, `a`, and `items[]` entry must be a non-empty trimmed string. The Zod schema rejects empty strings everywhere — there are no "leave this blank" fields except `comparison.note`, `about`, and `howTo` which have explicit defaults.
- Keep the `about` array short (1–3 entries) — these surface in the page's structured data as the "thing" the article is about.
- Add `howTo` only if `steps.items` reads as an actual procedure (e.g. setup, migration). For pure narrative pages, omit it.
- The two CTA buttons render with hard-coded hrefs (`/#download` and `/whitepaper`) — the payload only controls the labels.

## Endpoints

All endpoints require `Authorization: Bearer $UC_API_TOKEN`. Errors come back as JSON with `{ error, details? }`.

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/v1/articles` | List all articles (any category). Add `?category=blog` / `compare` / `use-cases` to filter. |
| POST | `/api/v1/articles` | Create a new article in any category |
| GET | `/api/v1/articles/{id}` | Fetch one article with all translations |
| PUT | `/api/v1/articles/{id}` | Update an article (full upsert; resend the entire payload) |
| DELETE | `/api/v1/articles/{id}` | Delete an article |

Status codes: `201` create / `200` other success / `400` invalid payload / `401` bad token / `404` not found / `409` slug already taken (within the same category — different categories may share a slug).

## Workflow

### Create an article

1. Confirm with the user: category, slug, status (draft vs published), and that both locales are intended.
2. Build the payload (a single JSON file is easier to debug than inline `-d`):
   ```bash
   cat > /tmp/article.json <<'JSON'
   { ...full payload... }
   JSON
   curl -sS -X POST "$UC_API_BASE/api/v1/articles" \
     -H "Authorization: Bearer $UC_API_TOKEN" \
     -H "content-type: application/json" \
     --data @/tmp/article.json
   ```
3. On `201`, report back the returned `id` and `slug`, plus the live URL: `${UC_API_BASE}/{category}/{slug}` (or `/zh/{category}/{slug}`). Reminder: drafts are not in `/sitemap.xml` or `/llms.txt` — only `published` articles are.

### List / filter by category

```bash
# All articles
curl -sS "$UC_API_BASE/api/v1/articles" \
  -H "Authorization: Bearer $UC_API_TOKEN" | jq

# Just comparisons
curl -sS "$UC_API_BASE/api/v1/articles?category=compare" \
  -H "Authorization: Bearer $UC_API_TOKEN" | jq
```

### Update an article

`PUT` is a full replacement, not a patch. Fetch the current article, mutate the fields you want to change, then PUT the whole object back. The category may be changed (e.g. blog → use-cases), but if you do, make sure `translations.{en,zh}.contentType` is updated to match the new category's expected content type — otherwise Zod will 400.

```bash
curl -sS "$UC_API_BASE/api/v1/articles/$ID" \
  -H "Authorization: Bearer $UC_API_TOKEN" \
  | jq '.translations.en.body = "new body..." | { slug, category, datePublished, status, translations }' \
  > /tmp/updated.json
curl -sS -X PUT "$UC_API_BASE/api/v1/articles/$ID" \
  -H "Authorization: Bearer $UC_API_TOKEN" \
  -H "content-type: application/json" \
  --data @/tmp/updated.json
```

### Delete

```bash
curl -sS -X DELETE "$UC_API_BASE/api/v1/articles/$ID" \
  -H "Authorization: Bearer $UC_API_TOKEN"
```

## Common errors

- **`401 Invalid or missing API token`** — the token is wrong, revoked, or `Authorization` header isn't being sent. Re-export `UC_API_TOKEN` from a fresh shell.
- **`400 Invalid payload`** — Zod parse failure. The `details` field is a stringified Zod error; read it carefully — usually a missing `seo` field, an empty string in a required field, or a `contentType` that doesn't match the article's category (`blog` → `markdown`, `compare`/`use-cases` → `template`).
- **`409 An article with this category and slug already exists`** — pick a different slug or PUT against the existing article's id.

## Don't

- Don't paste the plaintext token in commit messages, PR descriptions, or shared chat. It's a server-side write capability.
- Don't run `POST` more than once on a retry without checking — the second one will likely 409, but if the slug differs you'll create a duplicate.
- Don't set `status: "published"` unless the user explicitly asked. Default to `draft` and let them flip the switch in the admin UI.
- Don't hand-edit `src/app/sitemap.ts`, `src/app/llms.txt/route.ts`, `messages/*.json`, or `scripts/seed-articles.ts` for new articles — those are no longer the source of truth. Publish via this API instead.
