# Database Migrations

This project uses **Prisma** to manage the PostgreSQL schema. Every change to `prisma/schema.prisma` must be accompanied by a migration file that is committed to git, so that deployments apply the exact same changes to the remote database.

## TL;DR

1. Edit `prisma/schema.prisma`.
2. Run `npx prisma migrate dev --name <descriptive_name>` against your **local** DB.
3. Commit both the updated `schema.prisma` and the new folder under `prisma/migrations/`.
4. On deploy, the remote service runs `prisma migrate deploy` (already wired into `npm run start:prod`) and applies any pending migrations in order.

---

## Prerequisites

- Local PostgreSQL running (see `docker-compose.dev.yml`). If you don't have one, see [No local DB?](#no-local-db) below.
- `.env` file with `DATABASE_URL` pointing to your **local** database — never point it at a shared/remote DB when generating migrations.
- Dependencies installed: `npm install`.

### No local DB?

You have two options.

#### Option A (recommended): start the bundled Postgres via Docker

The repo ships a ready-to-use Postgres in `docker-compose.dev.yml`.

```bash
docker compose -f docker-compose.dev.yml up -d
```

Then set `DATABASE_URL` in your `.env` to match:

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/newpot_hbny?schema=public"
```

Now `prisma migrate dev` works as described above. This is the path you want 99% of the time — it mirrors what runs in production and lets Prisma apply/verify the migration end-to-end.

#### Option B: generate migration SQL without any database

If you truly can't run a DB (e.g. on a locked-down machine), you can still generate a migration file by diffing the previous schema state against the new one. Prisma won't apply it anywhere — you're just producing the `.sql` file for others/CI to run.

```bash
# 1. Create the migration folder manually
mkdir -p prisma/migrations/$(date -u +%Y%m%d%H%M%S)_<short_description>

# 2. Diff the committed migrations (from-migrations) against your edited schema (to-schema-datamodel)
npx prisma migrate diff \
  --from-migrations prisma/migrations \
  --to-schema-datamodel prisma/schema.prisma \
  --script \
  > prisma/migrations/<the_folder_you_just_created>/migration.sql
```

Caveats with Option B:

- **You have not tested the migration.** Nothing applied it, nothing verified it works. Someone with a DB must run `prisma migrate dev` or apply it to a dev environment before merging.
- You must hand-maintain the folder name / timestamp; `migrate dev` normally does this for you.
- Destructive or data-preserving edits (renames, type changes) still need manual SQL review — same as Option A.
- Prisma client types won't regenerate until you run `npx prisma generate` (which does not need a DB).

Prefer Option A whenever possible.

---

## Workflow: changing the schema

### 1. Edit the schema

Modify `prisma/schema.prisma` — add a model, change a column, add a relation, etc.

### 2. Generate a migration locally

```bash
npx prisma migrate dev --name <short_snake_case_description>
```

Example:

```bash
npx prisma migrate dev --name add_order_status_column
```

What this does:

- Diffs the schema against your local DB.
- Creates a new folder `prisma/migrations/<timestamp>_<name>/` containing a `migration.sql` file.
- Applies the migration to your local DB.
- Regenerates the Prisma client (`@prisma/client`).

### 3. Review the generated SQL

Open `prisma/migrations/<timestamp>_<name>/migration.sql` and make sure:

- The SQL matches your intent.
- Destructive changes (dropping columns/tables, renaming, changing types) are explicit and intentional.
- For renames or data-preserving type changes, you may need to hand-edit the SQL — Prisma defaults to DROP + ADD which loses data.

### 4. Commit everything

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "migrate: <what changed and why>"
```

Both the schema and the migration folder must be committed together. Do **not** commit one without the other.

---

## Deployment

The production start script already runs migrations before booting the app:

```json
"start:prod": "prisma migrate deploy && node dist/src/main"
```

`prisma migrate deploy`:

- Applies any migration folders in `prisma/migrations/` that have not yet been applied to the target DB.
- Runs them in timestamp order.
- Does **not** generate new migrations and does **not** touch the schema — it only executes pending SQL.
- Fails fast if a migration is missing or the history has drifted.

So the remote DB converges to the exact state described by the committed migration history.

---

## Common scenarios

### I only want to try out a schema change without committing

Use `npx prisma db push` — it syncs the schema to your local DB without creating a migration file. Great for prototyping, **never** use it for changes that will ship.

### I made a mistake in a migration that I haven't pushed yet

If the migration is only on your machine (not yet merged to `main`):

```bash
# 1. Reset local DB (destroys local data)
npx prisma migrate reset

# 2. Delete the bad migration folder
rm -rf prisma/migrations/<timestamp>_<bad_name>

# 3. Re-edit schema.prisma and re-run migrate dev
npx prisma migrate dev --name <better_name>
```

### The migration was already merged / deployed

Never edit or delete a migration that has run on a shared environment. Instead, create a **new** migration that corrects the problem:

```bash
npx prisma migrate dev --name fix_<whatever>
```

### Pulling teammate's changes that include new migrations

```bash
git pull
npm install
npx prisma migrate dev   # applies any new pending migrations to your local DB
```

### Seeding

After a reset, re-seed local data with:

```bash
npm run prisma:seed
```

---

## Do / Don't

**Do**

- Always run `prisma migrate dev` locally before deploying schema changes.
- Review the generated SQL.
- Commit the schema and migration folder together in the same PR.
- Use descriptive migration names (`add_user_phone`, not `update`).

**Don't**

- Don't run `prisma migrate dev` against a shared/remote database — it can create drift and destroy data.
- Don't use `prisma db push` for changes that ship to production.
- Don't edit or delete a migration that has already been applied to a remote environment — write a new one instead.
- Don't hand-write migration folders; let Prisma generate them.
