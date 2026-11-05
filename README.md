# Alárinà admin

The app for Alárinà staff: Vite, React and TypeScript. It runs on `:5174` and calls the API under `/api/admin`. What staff can do, the first staff account and deployment are in the [root README](../README.md#admin-app-staff).

```bash
nvm use
yarn install
yarn dev     # http://localhost:5174
yarn lint
yarn build   # needs VITE_API_URL
```

The API only serves this app when `ADMIN_ORIGIN` is set in `be/.env`.

| Folder | What's in it |
|---|---|
| `src/pages` | Overview, Couples, Payments, Activity, Staff, and sign-in and setup |
| `src/components` | Shared components (`Field`, `Select`, `Pill`, `BarChart`, …) |
| `src/auth` | Sign-in state |
| `src/lib` | API client, formatting, types and hooks |

`src/base.css` is a copy of the tokens and base styles in `fe/src/index.css`, so keep the tokens in step with that file. Admin-only styles are in `src/admin.css`.
