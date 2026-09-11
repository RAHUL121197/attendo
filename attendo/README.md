# Attendo - Employee Attendance Management System

A modern, responsive employee attendance management system built with React and Vite. Track attendance, manage employees, generate reports, and handle leave requests — all in a clean SaaS-style dashboard.

## Features

- **Authentication & Roles** — Admin and Employee login flows with persistent sessions.
- **Dashboard** — Live stat cards, quick attendance summary, shift-wise and department-wise summaries, and device sync status.
- **Employee Management** — Full CRUD with search, filters, and validation.
- **WhatsApp App Invite** — After adding an employee, a personalized app download/install link is sent to the employee's registered WhatsApp number (`wa.me` deep link + a public `/install?employee=<id>&name=<name>` landing page that each employee can use to install the app on their phone).
- **Attendance Management** — Check-in, check-out, break tracking, and leave requests.
- **Reports** — Attendance rate, working hours, lateness stats, and CSV export.
- **Time Off** — Leave request workflow with approve/reject by admin.
- **Settings** — Dark mode, default shift, late-after time, working hours, notification toggles, and leave approvals.
- **Responsive Design** — Works on desktop, tablet, and mobile.

## Technology

- **Frontend:** React 19, Vite, React Router, CSS3 (CSS variables, Flexbox, Grid)
- **Persistence:** localStorage (no backend required)
- **No runtime framework** beyond React — everything is client-side.

## Folder Structure

```
attendo/
├── index.html
├── package.json
├── vite.config.js
├── src/
│   ├── main.jsx              # App entry point
│   ├── App.jsx               # Routes + providers
│   ├── index.css             # Global styles (light/dark themes)
│   ├── context/
│   │   ├── AuthContext.jsx   # Login/logout state
│   │   └── AppContext.jsx    # Employees/attendance/leaves/settings state
│   ├── utils/
│   │   ├── storage.js        # localStorage helpers
│   │   ├── demoData.js       # Demo employees, users, settings
│   │   ├── helpers.js        # Date/time formatting & calculations
│   │   └── whatsapp.js       # wa.me link + personalized install-link builder
│   ├── components/
│   │   ├── ui/               # Modal, Toast, ConfirmDialog
│   │   └── layout/           # Sidebar, Header, Layout
│   └── pages/
│       ├── LoginPage.jsx
│       ├── InstallPage.jsx   # Public personalized app-install landing page
│       ├── DashboardPage.jsx
│       ├── EmployeesPage.jsx
│       ├── AttendancePage.jsx
│       ├── ReportsPage.jsx
│       └── SettingsPage.jsx
└── tests/
    ├── attendo-test.cjs       # Playwright E2E test suite
    └── screenshots/           # Generated test screenshots (gitignored)
```

## How to Run

1. Open the project in VS Code.
2. Run `npm install` to install dependencies.
3. Run `npm run dev` and open the shown URL (default `http://localhost:5173`).
   - Or, use the Vite `preview` script after building: `npm run build` then `npm run preview`.

## Testing

Playwright (Chromium) end-to-end tests cover the full user journey: admin + employee
login, role restrictions, employee CRUD with validation, check-in/break/check-out,
leave approval (Time Off), reports + CSV export, dark mode persistence, mobile
responsive layout, and data persistence after re-login.

```bash
# 1. Start the app (dev on 5173, or build + preview on 4000)
npm run dev

# 2. Run the suite against the target URL (default: preview at http://localhost:4000)
npm run test
# or point at a different running instance:
BASE_URL=http://localhost:5173 npm test
```

`npx playwright install chromium` is required once after `npm install` to download
the Chromium browser binary.

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
2. Import the repository into Vercel.
3. Keep the default settings — Vercel auto-detects Vite (`build: vite build`, `output: dist`).
4. The app uses relative paths and works with static hosting as-is.

### Netlify / GitHub Pages

Set the build command to `npm run build` and the publish directory to `dist`.

> Note: because sessions rely on `localStorage`, each browser on a device keeps its own data. Share/reset data via the devtools as needed.