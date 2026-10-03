# Rohingya Modern Dictionary v6 — AI Studio React/Vite Edition

This version is rebuilt as a **standard Vite + React project** so Google AI Studio's Create Your App flow can recognize it.

## Included

- English → Burmese → Rohingya → Rohingya Hanifi dictionary
- 1,000 Burmese vocabulary entries included in the starter database seed
- Mobile-first modern UI
- Search across English, Burmese, Rohingya, Hanifi, definitions, examples and notes
- Tap a word to reveal full details
- Category filter
- Dark mode
- US / UK English speech
- Fixed three-line menu
- Admin login
- Dictionary add / edit / delete
- Import / export JSON
- Rohingya + Hanifi editing
- Voice upload per word
- Browser microphone recording for Hanifi voice
- Offline voice recording queue using IndexedDB; queued recordings can sync after reconnecting while logged in
- Developer profile with replaceable photo
- About the Developer section
- Fully editable site text, menu labels, field labels and accent colors
- Editable quiz questions
- Daily Speaking Practice with folders and lessons
- Changeable admin password
- SQLite persistent server database
- CORS-enabled API for a separate AI Studio frontend
- Service-worker shell caching for offline-friendly use

## Project structure

```text
rmd_v6/
├── index.html
├── package.json
├── vite.config.js
├── dictionary.json
├── src/
│   ├── App.jsx
│   ├── main.jsx
│   └── styles.css
├── public/
│   └── sw.js
└── server/
    ├── server.cjs
    └── seed-entries.json
```

## AI Studio

AI Studio should now recognize this as a normal React/Vite app because the root contains:

- `package.json` with `react`, `react-dom`, `vite`, and `@vitejs/plugin-react`
- root `index.html`
- `src/main.jsx`
- `src/App.jsx`
- `vite.config.js`

Use this ZIP as the **frontend/app ZIP** in the screen shown in your screenshot.

The app still needs its Node/SQLite API server for shared editing, login, recordings, quiz, lessons and persistent data. The server is in `server/server.cjs`.

## Run locally

```bash
npm install
npm run dev
```

For the full server-backed version:

```bash
npm install
npm run build
npm start
```

The Node server serves the built React app from `dist/` and exposes `/api/*`.

## Admin

Default first-install password:

`165229`

Change it immediately from **Admin → Security**.

For production, set:

```text
ADMIN_PASSWORD=your-first-password
JWT_SECRET=a-long-random-secret
```

Use HTTPS for microphone recording and public deployment.

## Separate frontend/server

If AI Studio hosts the React frontend separately, open the app's menu → **Server connection** and enter the deployed Node server URL, for example:

```text
https://your-server.example.com
```

The same URL can also be supplied at build time with:

```text
VITE_API_URL=https://your-server.example.com
```

## Important vocabulary note

The 1,000 Burmese starter entries are a source-based draft vocabulary set. Rohingya and Hanifi fields should be verified by qualified/native-language reviewers before public publication. The Admin panel is designed so these fields can be corrected and expanded.
