Quick setup & troubleshooting

1) Install Node.js (LTS)
   - Download: https://nodejs.org/en/download/ (choose LTS)
   - Or on Windows: `winget install OpenJS.NodeJS.LTS -e` or `choco install nodejs-lts -y`

2) Install dependencies
   - `npm install`

3) Run dev server
   - `npm run dev`
   - Open http://localhost:3000 in Chrome or run `start chrome http://localhost:3000`

Notes

- If you see a broken logo, the app will fall back to an inline SVG; to use your own logo, place `mazinlogo.svg` or `mazinlogo.jpeg` in the `public/` folder in the project root.
- The app includes an inline placeholder for broken item images, so missing image links won't break the UI.
- If localStorage is corrupted, the app clears the saved menu items and restores defaults.

Admin access

- Open the app and navigate to `/#admin2001` (the app auto-switches to admin login). Default admin password: `admin123`.
- Admin features include: add / edit / delete items, upload item images (stored inline), reorder items, import/export menu JSON, reset data to defaults, and edit categories (names and images).
