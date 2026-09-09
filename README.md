# Toko Kopi

Coffee shop website, guest ordering PWA, table QR ordering, QRIS payments, and operational CMS. Built on the existing React/Vite and Express/Sequelize starters. Indonesian (`id`) is the default; English (`en`) and Malay (`ms`, shown as MY) are included.

## Run locally on Windows

Requires Node 24, npm, and Docker Desktop running Linux containers.

```powershell
./scripts/local.ps1 setup
```

Then run these in three terminals:

```powershell
./scripts/local.ps1 api
./scripts/local.ps1 worker
./scripts/local.ps1 web
```

- Website and ordering: http://127.0.0.1:5173
- CMS: http://127.0.0.1:5173/admin
- API: http://127.0.0.1:3000/api
- Swagger: http://127.0.0.1:3000/docs — choose **Coffee Module**
- Coffee OpenAPI: http://127.0.0.1:3000/docs/specs/coffee.json

Local test login: `admin@ruangseduh.test` / `Coffee-local-test-2026`. These credentials only belong to the isolated demo/test setup, not production. Mock payments never receive money. Settlement fixtures run only from isolated automated tests; there is no payment simulation button or HTTP endpoint.

The setup uses `coffee_test` on MySQL port **13308** and Redis **16379**, in project `ruang-seduh-test`. MySQL storage is ephemeral (`tmpfs`): stopping/recreating that database container discards the test data. Existing project databases are not used. Seed records are preserved when setup is run again against the same running database.

## Verification

```powershell
./scripts/local.ps1 test
cd frontend
npx playwright install chromium
npm run test:e2e
```

Browser tests require API, worker, and frontend running. The separate backend `npm run test:worker` smoke test requires the same API/worker and the explicit test environment from `scripts/local.ps1`. Production PWA verification:

```powershell
npm run build
npm run preview -- --host 127.0.0.1 --port 4173
# In another frontend terminal:
$env:E2E_BASE_URL='http://127.0.0.1:4173'
$env:E2E_PWA='1'
npm run test:e2e
```

See [implementation and operational notes](docs/IMPLEMENTATION.md) for contracts, database changes, finance rules, Midtrans setup, validation results, and production requirements. Original starter documentation remains in each application folder; this README describes the coffee application that replaces their demo flows.
