# Zuntra Blogs: Feature Spec for AI Content Studio

## Goal

Add a new top-nav tab called **Zuntra Blogs** next to **Generator** (top left area of the header, alongside "Generator" and "My Blogs"). It manages blog posts stored in a **new, separate Supabase table** called `zuntra_blogs`.

## Hard Rules

1. **Do NOT modify** the existing Generator page, its generation logic, its prompts, or any existing Supabase tables (including the one behind "My Blogs").
2. Only **add** new files, routes, components, and one new table.
3. If a shared file must be touched (for example the nav bar or router), make the smallest possible change: just add the new link and route.
4. Reuse the existing design language: same fonts, card style, blue-to-purple gradient, rounded corners, shadows, and spacing.

---

## 1. Navigation

Header currently: `AI Content Studio ... Generator | My Blogs`

Change to: `Generator | Zuntra Blogs | My Blogs`

- Use an icon consistent with the others (for example a newspaper or layout icon).
- Highlight the active tab the same way "Generator" is highlighted.
- Route: `/zuntra-blogs`

---

## 2. Database: new table `zuntra_blogs`

Run in the Supabase SQL Editor:

```sql
create table public.zuntra_blogs (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  slug        text not null unique,
  subtitle    text,
  category    text not null
              check (category in ('FEATURES','INDUSTRY INSIGHT','ARTICLES','USE CASES')),
  subtopics   text,                 -- comma-separated, e.g. 'Enterprise Scale, System Architecture, Reliability'
  author      text default 'Zuntra Engineering',
  date        text,                 -- display format: 'Sep 02, 2026'
  time        text,                 -- display format: '8 MIN READ'
  color       text default '#10b981',
  image_url   text,
  tags        text,                 -- comma-separated
  content     text,                 -- markdown
  featured    boolean not null default false,
  published   boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index on public.zuntra_blogs (published, featured);
create index on public.zuntra_blogs (category);

alter table public.zuntra_blogs enable row level security;

create policy "public read published"
  on public.zuntra_blogs for select
  using (published = true);

create policy "authenticated full access"
  on public.zuntra_blogs for all
  to authenticated
  using (true) with check (true);
```

> If the tool uses the anon key without login, adjust the write policy (or use the service-role key server-side) so inserts and updates work.

Auto-update `updated_at`:

```sql
create or replace function set_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create trigger zuntra_blogs_updated_at
before update on public.zuntra_blogs
for each row execute function set_updated_at();
```

---

## 3. Categories (fixed list)

Exactly these four, stored in uppercase:

| Value | Default color (suggestion) |
|---|---|
| `FEATURES` | `#8b5cf6` |
| `INDUSTRY INSIGHT` | `#10b981` |
| `ARTICLES` | `#3b82f6` |
| `USE CASES` | `#f59e0b` |

- Display them as **pill buttons** (same style as the existing category chips: the selected one is purple-outlined).
- Picking a category auto-fills the **color** field with its default. The user can still override it.
- Also provide an **All** filter pill on the list page.

---

## 4. Zuntra Blogs page: layout

### 4.1 List view (default)

- Page title: **Zuntra Blogs**, with the subtitle "Manage posts for the Zuntra website."
- Top bar:
  - Search box (title, slug, tags)
  - Category filter pills: `ALL | FEATURES | INDUSTRY INSIGHT | ARTICLES | USE CASES`
  - Status filter: `All | Published | Draft | Featured`
  - Button: **+ New Post**
- Table or card list with columns:
  - Thumbnail (`image_url`)
  - Title and subtitle
  - Category chip (tinted with the row's `color`)
  - Author
  - Date
  - Read time
  - **Featured** toggle (inline, updates immediately)
  - **Published** toggle (inline, updates immediately)
  - Actions: Edit, Preview, Duplicate, Delete (with a confirm dialog)
- Empty state with a "Create your first post" button.
- Loading skeletons and error toasts.

### 4.2 Create / Edit form

A card-based form matching the Generator's numbered-section style:

**1. Basic Info**
- Title (required)
- Slug (auto-generated from the title, editable, with a live uniqueness check)
- Subtitle

**2. Category and Display**
- Category: 4 pill buttons (required)
- Color: color picker plus hex input (auto-filled from the category)
- Author (default `Zuntra Engineering`)
- Date (date picker, saved as `Sep 02, 2026` format; default today)
- Read time (auto-calculated from the content as `ceil(words / 200)` → `N MIN READ`, editable)

**3. Metadata**
- Image URL (with a live thumbnail preview)
- Subtopics (tag-input; saved as comma-separated text)
- Tags (tag-input; saved as comma-separated text)

**4. Content**
- Markdown editor with a live side-by-side preview
- Supports `###` headings, bullet lists, bold, links, and code blocks

**5. Publishing**
- Featured checkbox (default false)
- Published checkbox (default false)
- Buttons: **Save Draft**, **Save and Publish**, **Cancel**

Validation: title, slug, category, and content are required. Slug must be unique.

---

## 5. AI generation inside Zuntra Blogs (optional but recommended)

Add a **"Generate with AI"** button on the create form that fills the fields:

- Reuse the **existing** generation function by importing and calling it. Do not edit it.
- Ask it to return `{ title, subtitle, subtopics, tags, content }`, with content in markdown using `###` headings.
- The user can review and edit everything before saving.
- Category comes from the selected pill.

Also add per-field **"Regenerate"** buttons for subtitle, tags, and subtopics.

---

## 6. Sample row (for seeding and testing)

| Column | Value |
|---|---|
| title | Building enterprise technology systems that survive contact with reality |
| slug | building-enterprise-tech |
| subtitle | Enterprise development is less about code and more about organizational dynamics and scale. |
| category | INDUSTRY INSIGHT |
| subtopics | Enterprise Scale, System Architecture, Reliability |
| author | Zuntra Engineering |
| date | Sep 02, 2026 |
| time | 8 MIN READ |
| color | #10b981 |
| image_url | https://images.unsplash.com/photo-1558494949-ef010cbdcc31?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80 |
| tags | Enterprise Scale, System Architecture, Reliability |
| content | (markdown below) |
| featured | false |
| published | false |

Content:

```md
### Overview

Designing scalable distributed architectures for enterprise reliability.

### Core Tenets

- Resilient fallback modes
- Zero single point of failure
```

Seed this row so the list page has data on first load.

---

## 7. Behavior details

- **Slug:** lowercase, hyphens, strip special characters. If it already exists, append `-2`, `-3`, and so on.
- **Date format:** `Mon DD, YYYY` (for example `Nov 18, 2026`).
- **Inline toggles:** optimistic UI update, revert and show a toast on failure.
- **Delete:** confirmation dialog, then a success toast.
- **Duplicate:** copies the post with title `"<title> (Copy)"`, a new slug, `published = false`, and `featured = false`.
- **Preview:** modal that renders the post like the public site (image, category chip in its color, title, subtitle, author, date, read time, markdown content).
- **Responsive:** works on mobile, and the table collapses into cards.

---

## 8. Acceptance checklist

- [ ] "Zuntra Blogs" appears in the header next to "Generator"
- [ ] The Generator and My Blogs pages work exactly as before
- [ ] The `zuntra_blogs` table exists with all 14 columns plus `id`, `created_at`, `updated_at`
- [ ] Only four categories are selectable: FEATURES, INDUSTRY INSIGHT, ARTICLES, USE CASES
- [ ] Create, edit, delete, and duplicate all work
- [ ] Featured and Published toggles update inline
- [ ] Slug is unique and auto-generated
- [ ] Read time and date auto-fill
- [ ] The sample row is seeded and displays correctly
- [ ] No existing tables or generation code were changed

---

## 9. Suggested build order

1. Create the table and policies, then seed the sample row.
2. Add the nav link and an empty `/zuntra-blogs` route.
3. Build the list view with filters and inline toggles.
4. Build the create and edit form.
5. Add the markdown preview, duplicate, and delete.
6. Add the AI generate button (reusing the existing function).
7. Test the Generator and My Blogs pages to confirm nothing regressed.
