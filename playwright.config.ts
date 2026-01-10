import { defineConfig, devices } from "@playwright/test";

/**
 * Konfigurasi Playwright untuk testing end-to-end
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  // Direktori tempat test files berada
  testDir: './tests',
  
  // Jalankan tests secara sequential untuk cross-browser testing
  fullyParallel: false,
  
  // Gagalkan build jika ada test yang gagal di CI
  forbidOnly: !!process.env.CI,
  
  // Retry pada CI saja
  retries: process.env.CI ? 2 : 0,
  
  // Gunakan 1 worker untuk memastikan eksekusi sequential
  workers: 1,
  
  // Reporter untuk menampilkan hasil test
  reporter: 'html',
  
  // Timeout untuk setiap test (diperpanjang untuk cross-browser testing)
  timeout: 60 * 1000, // 60 detik per test
  
  // Timeout untuk expect assertions
  expect: {
    timeout: 10 * 1000, // 10 detik untuk assertions
  },
  
  // Pengaturan global untuk semua tests
  use: {
    // Base URL untuk aplikasi yang akan ditest
    baseURL: 'http://localhost:3000',
    
    // Collect trace ketika retry test yang gagal
    trace: 'on-first-retry',
    
    // Screenshot ketika test gagal
    screenshot: 'only-on-failure',
    
    // Video recording untuk debugging cross-browser issues
    video: 'retain-on-failure',
    
    // Timeout untuk navigasi dan loading
    navigationTimeout: 30 * 1000,
    actionTimeout: 15 * 1000,
  },

    // Jalankan tests secara sequential untuk cross-browser testing
    fullyParallel: false,

    // Gagalkan build jika ada test yang gagal di CI
    forbidOnly: !!process.env.CI,

    // Retry pada CI saja
    retries: process.env.CI ? 2 : 0,

    // Gunakan 1 worker untuk memastikan eksekusi sequential
    workers: 1,

    // Reporter untuk menampilkan hasil test
    reporter: "html",

    // Timeout untuk setiap test (diperpanjang untuk cross-browser testing)
    timeout: 60 * 1000, // 60 detik per test

    // Timeout untuk expect assertions
    expect: {
        timeout: 10 * 1000, // 10 detik untuk assertions
    },

    // Pengaturan global untuk semua tests
    use: {
        // Base URL untuk aplikasi yang akan ditest
        baseURL: "http://localhost:3000",

        // Collect trace ketika retry test yang gagal
        trace: "on-first-retry",

        // Screenshot ketika test gagal
        screenshot: "only-on-failure",

        // Video recording untuk debugging cross-browser issues
        video: "retain-on-failure",

        // Timeout untuk navigasi dan loading
        navigationTimeout: 30 * 1000,
        actionTimeout: 15 * 1000,
    },

    // Konfigurasi untuk cross-browser testing sequential
    projects: [
        {
            name: "chromium",
            use: {
                ...devices["Desktop Chrome"],
                // Pengaturan khusus untuk Chromium
                launchOptions: {
                    args: [
                        "--disable-web-security",
                        "--disable-features=VizDisplayCompositor",
                    ],
                },
            },
            metadata: {
                platform: "chromium",
                engine: "blink",
            },
        },

  // Konfigurasi webServer untuk menjalankan development server secara otomatis
  webServer: {
    command: 'npm run dev',
    port: 3000,
    cwd: './frontend',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
