import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./e2e",
  workers: 1,
  projects: [{ name: "desktop", use: { ...devices["Desktop Chrome"] } }, { name: "mobile", use: { ...devices["iPhone 13"], defaultBrowserType: "chromium" } }],
  // The studio registers a service worker (PWA). page.route() cannot see requests a
  // worker handles, so suites run with workers blocked; pwa-chrome.spec.ts allows
  // them where the worker itself is under test.
  use: { baseURL: "http://127.0.0.1:8787", trace: "retain-on-failure", serviceWorkers: "block" },
  // Ready only once the mounted proxy (8789) answers. e2e-server.ts starts it last,
  // after the 8787 instance is already serving, so gating on 8787 let early tests
  // race the proxy (ECONNREFUSED on CI, run 37085553974).
  webServer: { command: "BLYG_EXTENSIONS=all npm run build && node --import tsx scripts/e2e-server.ts", url: "http://127.0.0.1:8789/notes/b/studio/login", reuseExistingServer: false },
});
