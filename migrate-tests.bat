@echo off
echo 🚀 Starting test folder consolidation...

REM Create backup directory with timestamp
set backup_dir=testing-backup-%date:~-4%%date:~4,2%%date:~7,2%-%time:~0,2%%time:~3,2%%time:~6,2%
echo 💾 Creating backup in %backup_dir%...

REM Create unified testing directory structure
mkdir testing 2>nul
mkdir testing\e2e\specs 2>nul
mkdir testing\e2e\fixtures 2>nul
mkdir testing\e2e\helpers 2>nul
mkdir testing\performance\scenarios 2>nul
mkdir testing\performance\data 2>nul
mkdir testing\reports\e2e 2>nul
mkdir testing\reports\performance 2>nul
mkdir testing\scripts 2>nul

REM Backup existing folders
if exist tests (
    echo 📦 Backing up tests folder...
    xcopy tests testing-backup\tests /E /I /H /Y >nul
)

if exist tests-minimal (
    echo 📦 Backing up tests-minimal folder...
    xcopy tests-minimal testing-backup\tests-minimal /E /I /H /Y >nul
)

if exist load-tests (
    echo 📦 Backing up load-tests folder...
    xcopy load-tests testing-backup\load-tests /E /I /H /Y >nul
)

if exist test-results (
    echo 📦 Backing up test-results folder...
    xcopy test-results testing-backup\test-results /E /I /H /Y >nul
)

REM Move existing content to new structure
echo 📂 Moving content to unified structure...

if exist tests\specs (
    move tests\specs testing\e2e\specs >nul
)

if exist tests\fixtures (
    move tests\fixtures testing\e2e\fixtures >nul
)

if exist tests\docs (
    move tests\docs testing\e2e\docs >nul
)

if exist load-tests\backend (
    move load-tests\backend testing\performance\scenarios\backend >nul
)

if exist load-tests\dashboard (
    move load-tests\dashboard testing\performance\scenarios\dashboard >nul
)

if exist load-tests\frontend (
    move load-tests\frontend testing\performance\scenarios\frontend >nul
)

echo ✅ Migration completed successfully!
echo 📋 Next steps:
echo    1. Verify the new testing\ directory structure
echo    2. Run tests to confirm everything works
echo    3. Remove old folders when ready
echo    4. Check testing-backup\ for your original files
echo.
echo 📁 New unified structure created at: testing\
echo 📦 Backup created at: testing-backup\
