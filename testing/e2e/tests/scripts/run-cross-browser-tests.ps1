# Cross-Browser Testing Script untuk Statify
# Script ini menjalankan tes secara sequential di semua browser yang didukung

Write-Host "=== Statify Cross-Browser Testing ==="
Write-Host "Menjalankan tes secara sequential di Chromium, Firefox, dan WebKit"
Write-Host ""

# Jalankan semua tes di semua browser
Write-Host "Menjalankan semua tes descriptive analysis..."
npx playwright test descriptive-analysis.spec.ts --reporter=line

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Semua tes berhasil dijalankan!"
    Write-Host "📊 Laporan HTML tersedia di: playwright-report/index.html"
    Write-Host ""
    Write-Host "Untuk melihat laporan:"
    Write-Host "npx playwright show-report"
} else {
    Write-Host ""
    Write-Host "❌ Beberapa tes gagal. Periksa output di atas untuk detail."
    Write-Host "📊 Laporan HTML tersedia di: playwright-report/index.html"
    Write-Host ""
    Write-Host "Untuk debugging:"
    Write-Host "npx playwright show-report"
}

Write-Host ""
Write-Host "=== Opsi Tambahan ==="
Write-Host "Jalankan tes di browser spesifik:"
Write-Host "  npx playwright test --project=chromium"
Write-Host "  npx playwright test --project=firefox"
Write-Host "  npx playwright test --project=webkit"
Write-Host ""
Write-Host "Jalankan tes dengan UI mode:"
Write-Host "  npx playwright test --ui"
Write-Host ""
Write-Host "Jalankan tes dengan headed mode:"
Write-Host "  npx playwright test --headed"