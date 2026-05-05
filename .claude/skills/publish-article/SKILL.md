---
name: publish-article
description: Publish, update, list, or delete blog posts on the UniClipboard marketing site via the token-authenticated /api/v1/articles endpoint. Use when the user asks to "publish a blog post", "update an article", "ship a post to the site", or supplies markdown content to be posted.
user-invokable: true
args:
  - name: action
    description: One of "create", "update", "list", "get", "delete" (defaults to create when markdown content is provided)
    required: false
---

Publish blog posts to the UniClipboard site by calling its token-authenticated REST API. Only the `blog` category is supported by this endpoint — comparison and use-case articles still go through the admin UI.

## Configuration

The skill needs two environment variables to be set in the user's shell. Prompt the user for them if they're missing.

| Variable | Example | Where it comes from |
| --- | --- | --- |
| `UC_API_BASE` | `https://uniclipboard.app` (prod) or `http://localhost:3000` (dev) | The site origin without a trailing slash |
| `UC_API_TOKEN` | `uct_xxxxxxxx...` | Created at `/admin/tokens` in the UniClipboard admin. Plaintext is shown once on creation — store it in a password manager / .env file |

If `UC_API_TOKEN` is missing, tell the user to sign in to `${UC_API_BASE}/admin/tokens` and click "New token", then export it.

## Article shape

A blog article has two locale payloads (`en` and `zh`), both of which are required. The schema is enforced by Zod on the server — every field listed below is required unless marked optional.

```jsonc
{
  "slug": "my-post",                 // lowercase letters, digits, hyphens; ≤ 96 chars
  "category": "blog",                // must be exactly "blog"
  "datePublished": "2026-05-05",     // YYYY-MM-DD
  "status": "draft",                 // "draft" or "published"; default "draft"
  "translations": {
    "en": {
      "contentType": "markdown",     // must be "markdown" for blog
      "seo": {
        "title": "...",              // <title> + og:title
        "description": "...",        // meta description
        "keywords": "comma, separated, keywords",
        "ogAlt": "alt text for the og image"
      },
      "hero": {
        "title": "Display title",    // required
        "subtitle": ""               // optional, can be empty string
      },
      "meta": {
        "breadcrumbCurrent": "Blog post title",
        "lastUpdatedLabel": "Last updated",
        "lastUpdatedDate": "2026-05-05"
      },
      "body": "## First section\n\nBody as GitHub-flavored markdown..."
    },
    "zh": { /* same shape, Chinese copy */ }
  }
}
```

Notes when constructing the payload:

- `body` is GFM markdown. `## h2` headings populate the right-rail table of contents on the rendered post; `### h3` and below do not. Use fenced code blocks (` ```ts `) — they are syntax-highlighted with Shiki on the server.
- Both `en` and `zh` translations are required. If the user only gave you English copy, ask whether to translate to Chinese before publishing, or default to a placeholder Chinese version that mirrors the English structure.
- Default `status` to `draft` unless the user explicitly says "publish" / "ship live".

## Endpoints

All endpoints require `Authorization: Bearer $UC_API_TOKEN`. Errors come back as JSON with `{ error, details? }`.

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/v1/articles` | List all blog articles |
| POST | `/api/v1/articles` | Create a new article |
| GET | `/api/v1/articles/{id}` | Fetch one article with all translations |
| PUT | `/api/v1/articles/{id}` | Update an article (full upsert; resend the entire payload) |
| DELETE | `/api/v1/articles/{id}` | Delete an article |

Status codes: `201` create / `200` other success / `400` invalid payload / `401` bad token / `404` not found / `409` slug already taken.

## Workflow

### Create a post

1. Confirm with the user: slug, status (draft vs published), and that both locales are intended.
2. Build the payload (a single JSON file is easier to debug than inline `-d`):
   ```bash
   cat > /tmp/post.json <<'JSON'
   { ...full payload as above... }
   JSON
   curl -sS -X POST "$UC_API_BASE/api/v1/articles" \
     -H "Authorization: Bearer $UC_API_TOKEN" \
     -H "content-type: application/json" \
     --data @/tmp/post.json
   ```
3. On `201`, report back the returned `id` and `slug`, plus the live URL: `${UC_API_BASE}/blog/{slug}` (or `/zh/blog/{slug}`).

### Update a post

`PUT` is a full replacement, not a patch. Fetch the current article first, mutate the fields you want to change, then PUT the whole object back:

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

### List / inspect / delete

```bash
curl -sS "$UC_API_BASE/api/v1/articles" -H "Authorization: Bearer $UC_API_TOKEN" | jq
curl -sS "$UC_API_BASE/api/v1/articles/$ID" -H "Authorization: Bearer $UC_API_TOKEN" | jq
curl -sS -X DELETE "$UC_API_BASE/api/v1/articles/$ID" -H "Authorization: Bearer $UC_API_TOKEN"
```

## Common errors

- **`401 Invalid or missing API token`** — the token is wrong, revoked, or `Authorization` header isn't being sent. Re-export `UC_API_TOKEN` from a fresh shell.
- **`400 Invalid payload`** — Zod parse failure. The `details` field is a stringified Zod error; read it carefully — usually a missing `seo` field, an empty string in a required field, or `contentType` mismatch.
- **`409 An article with this category and slug already exists`** — pick a different slug or PUT against the existing article's id.
- **`400 Only category="blog" is supported via this endpoint`** — comparison/use-case articles must be edited in the admin UI; this endpoint won't accept them.

## Don't

- Don't paste the plaintext token in commit messages, PR descriptions, or shared chat. It's a server-side write capability.
- Don't run `POST` more than once on a retry without checking — the second one will likely 409, but if the slug differs you'll create a duplicate.
- Don't set `status: "published"` unless the user explicitly asked. Default to `draft` and let them flip the switch in the admin UI.
