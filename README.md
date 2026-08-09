# Popeye's Sauce Tierlist

A Lakebed capsule that ranks Popeye's sauces across two brand lists (GoWa and KATA).

## Run

```sh
npx lakebed dev
```

Open http://localhost:3000.

## How It Works

- `server/index.ts` defines the `tierlist` table and the `get` query / `save` mutation.
- `shared/tierlist.ts` holds the shared types and the seed state (migrated from the previous Convex deployment).
- `client/index.tsx` is the Preact UI: two drag-and-drop tier lists, a password gate for editing, and debounced autosave.
- `client/TierList.tsx` implements native HTML5 drag-and-drop (no external DnD dependency).

Editing is locked by default. Click any item to unlock with the edit password. Changes autosave to the capsule database.

## Deploy

```sh
npx lakebed deploy
```

## Inspect

```sh
npx lakebed db list --port 3000
npx lakebed db dump --port 3000
npx lakebed db export --port 3000 --out backup.json
npx lakebed logs --port 3000
```
