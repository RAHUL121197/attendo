# Attendo - Employee Attendance Management System

A modern, responsive employee attendance management system built with React and Vite. Track attendance, manage employees, generate reports, and handle leave requests — all in a clean SaaS-style dashboard.

## Features

- **Authentication & Roles** — Admin and Employee login flows with persistent sessions.
- **Dashboard** — Live stat cards, quick attendance summary, shift-wise and department-wise summaries, and device sync status.
- **Employee Management** — Full CRUD with search, filters, and validation.
- **WhatsApp App Invite** — After adding an employee, a personalized app download/install link is sent to the employee's registered WhatsApp number (`wa.me` deep link + a public `/install?employee=<id>&name=<name>` landing page that each employee can use to install the app on their phone).
- **Attendance Management** — Check-in, check-out, break tracking, and leave requests.
- **Reports** — Attendance rate, working hours, lateness stats, and CSV export.
- **AI Report** — One-click AI performance reports per employee (summary, strengths, weaknesses, suggestions, rating) powered by AgentRouter through a secure server-side endpoint.
- **Time Off** — Leave request workflow with approve/reject by admin.
- **Settings** — Dark mode, default shift, late-after time, working hours, notification toggles, and leave approvals.
- **Responsive Design** — Works on desktop, tablet, and mobile.

## Technology

- **Frontend:** React 19, Vite, React Router, CSS3 (CSS variables, Flexbox, Grid)
- **Persistence:** localStorage (no backend required)
- **Backend:** Vercel serverless function (`api/ai/ask`) that proxies to AgentRouter's OpenAI-compatible API. The AgentRouter API key lives only on the server.

## Folder Structure

```
attendo/
├── index.html
├── package.json
├── vite.config.js
├── vercel.json
├── .env.example
├── api/
│   └── ai/ask.mjs            # Serverless endpoint POST /api/ai/ask (AgentRouter proxy)
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── index.css
│   ├── context/
│   ├── utils/
│   │   ├── storage.js        # localStorage helpers
│   │   ├── demoData.js       # Demo employees, users, settings
│   │   ├── helpers.js        # Date/time formatting & calculations
│   │   ├── whatsapp.js       # wa.me link + personalized install-link builder
│   │   └── aiReport.js       # AI report prompt/context builder + API client
│   ├── components/
│   └── pages/
└── tests/
    ├── attendo-test.cjs       # Playwright E2E test suite
    ├── ai-api-test.cjs        # Backend endpoint unit tests (stubbed upstream)
    └── screenshots/           # Generated test screenshots (gitignored)
```

## How to Run

1. Open the project in VS Code.
2. Run `npm install` to install dependencies.
3. (AI Report only) Copy `.env.example` to `.env` and set **`AGENTROUTER_API_KEY`** to your key from https://agentrouter.org. The AI backend also reads an optional `AGENTROUTER_MODEL` (default `gpt-5.5`).
4. Run `npm run dev` and open the shown URL (default `http://localhost:5173`).
   - Or, use the Vite `preview` script after building: `npm run build` then `npm run preview`.
   - For the AI Report frontend-to-backend flow locally, use `npx vercel dev` (runs the Vite app **and** the `api/` function together on `http://localhost:3000`). `npm run dev`/`preview` serve the UI only, so the AI button will show a backend-error state there.

## AI Report (AgentRouter)

The Reports page has an **AI Report** panel. Pick an employee and click **Generate AI Report**:

1. The frontend collects the employee's profile plus attendance metrics for the currently selected date range (present/late/absent/time-off days, total hours, attendance %).
2. It POSTs a prompt to `/api/ai/ask` (our endpoint, same origin — the AgentRouter API key never reaches the browser).
3. `api/ai/ask.mjs` calls `https://agentrouter.org/v1/chat/completions` with `Authorization: Bearer $AGENTROUTER_API_KEY`.
4. The response is shown in a report card/modal (summary, strengths, weaknesses, suggestions, rating).

Error handling covers: empty input, missing API key, invalid API key (401), model unavailable (404), rate limiting (429), upstream API errors (5xx), and network failures — each maps to a friendly message.

## Testing

Playwright (Chromium) end-to-end tests cover the full user journey: admin + employee
login, role restrictions, employee CRUD with validation, check-in/break/check-out,
leave approval (Time Off), reports + CSV export, AI Report success/error UI, dark
mode persistence, mobile responsive layout, and data persistence after re-login.
`tests/ai-api-test.cjs` unit-tests the AI endpoint with a stubbed upstream.

```bash
# 1. Start the app (dev on 5173, or build + preview on 4000)
npm run dev

# 2. Run the suites against the target URL (default: preview at http://localhost:4000)
npm test
# or point at a different running instance:
BASE_URL=http://localhost:5173 npm test
```

`npx playwright install chromium` is required once after `npm install` to download
the Chromium browser binary.

> The E2E suite mocks `/api/ai/ask`, so it passes without a real AgentRouter key.
> To hit the live AgentRouter upstream while testing the endpoint, run:
> `AGENTROUTER_API_KEY=<key> node tests/ai-api-test.cjs` is for behavior checks with
> a stub; for a real call, start `npx vercel dev`, set the key, and click
> "Generate AI Report" in the running app.

## Demo Login

| Role     | Email               | Password |
| -------- | ------------------- | -------- |
| Admin    | `admin@attendo.com` | `123456` |
| Employee | `rahul@attendo.com` | `123456` |
| Employee | `priya@attendo.com` | `123456` |
| Employee | `amit@attendo.com`  | `123456` |
| Employee | `neha@attendo.com`  | `123456` |

All demo accounts use password `123456`.

## How WhatsApp Delivery Works

When an employee is added (or when you click the WhatsApp button on an employee row or
the employee details modal), the app opens a `https://wa.me/<number>?text=<message>`
deep link in a new tab. The pre-filled message contains a **personalized install link**
(`<origin>/install?employee=<id>&name=<name>`), so simply tapping **Send** delivers the
app download link straight to the employee's registered WhatsApp number. The `/install`
page is public — no login needed — and shows the employee their personalized install
steps and a scan-to-install QR code.

> This is the standard client-side `wa.me` flow. For fully automated (no-click) delivery,
> replace the `sendAppDownloadLink` helper in `src/utils/whatsapp.js` with a WhatsApp
> Business API / Twilio call from a backend — the rest of the UI stays unchanged.

## How localStorage Works

All data is persisted in the browser under these keys:

- `attendoUser` — logged-in user session
- `attendoUsers` — registered user accounts
- `attendoEmployees` — employee records
- `attendoAttendance` — attendance records
- `attendoLeaves` — leave requests
- `attendoNotifications` — notification feed
- `attendoSettings` — app settings
- `attendoDarkMode` — theme preference

On first run, demo data is seeded automatically. Clearing the keys (or running `localStorage.clear()` in devtools) resets the app to its demo state.

## Future Backend Architecture

The current build runs entirely client-side. When you're ready to connect a real backend:

1. Add an API layer (e.g., `src/api/` with fetch calls).
2. Replace the `AppContext` actions (check-in, check-out, add employee, etc.) with API calls that update server state, then mirror the returned data into the same context.
3. Keep the UI components unchanged — they only consume context.
4. For biometric sync, replace the simulated `DeviceSync` click handler with a real device/API call.

Suggested stack: Node.js + Express (or Next.js) with PostgreSQL/MongoDB, JWT auth, and RESTful endpoints matching the context actions.

## Deployment

### Vercel

1. Push the project to GitHub.
2. Import the repository into Vercel (Root Directory: `attendo`).
3. Keep the default settings — Vercel auto-detects Vite (`build: vite build`, `output: dist`).
4. Add the environment variable: **`AGENTROUTER_API_KEY`** (Project → Settings → Environment Variables). Optional: `AGENTROUTER_MODEL`. The `api/ai/ask` serverless function is deployed automatically.
5. The app uses relative paths and works with static hosting as-is.

### Netlify / GitHub Pages

Set the build command to `npm run build` and the publish directory to `dist`.

> Note: because sessions rely on `localStorage`, each browser on a device keeps its own data. Share/reset data via the devtools as needed.