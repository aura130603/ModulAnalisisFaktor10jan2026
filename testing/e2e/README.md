# 🎯 Playwright Test Structure - Menu Focused

## 📁 Folder Structure (Organized by Menu)

```
testing/e2e/
├── specs/
│   ├── dashboard/
│   │   ├── basic.spec.ts          # Basic dashboard tests
│   │   ├── navigation.spec.ts     # Navigation tests
│   │   └── widgets.spec.ts        # Widget tests
│   ├──
│   ├── file-menu/
│   │   ├── basic.spec.ts          # Basic file menu tests
│   │   ├── import.spec.ts         # Import functionality
│   │   └── export.spec.ts         # Export functionality
│   ├──
│   ├── data-menu/
│   │   ├── basic.spec.ts          # Basic data menu tests
│   │   ├── variables.spec.ts      # Variable management
│   │   └── filtering.spec.ts      # Data filtering
│   └──
│   └── descriptive-menu/
│       ├── basic.spec.ts          # Basic descriptive tests
│       ├── analysis.spec.ts       # Descriptive analysis
│       └── export.spec.ts         # Results export
├── fixtures/                       # Test data
├── playwright.config.minimal.ts    # Minimal config
└── reports/                        # Test results
```

## 🚀 Usage Commands

```bash
# Run all tests
cd testing/e2e
npx playwright test --config=playwright.config.minimal.ts

# Run specific menu tests
npx playwright test specs/dashboard/
npx playwright test specs/file-menu/
npx playwright test specs/data-menu/
npx playwright test specs/descriptive-menu/

# Run specific test file
npx playwright test specs/dashboard/basic.spec.ts
```

## 📊 Each Menu Area
- **Dashboard**: Dashboard loading, navigation, widgets
- **File Menu**: File operations, import/export, recent files
- **Data Menu**: Data management, variables, restructuring, filtering
- **Descriptive Menu**: Descriptive analysis, options, calculations, export

## 🎯 Benefits
- ✅ Organized by menu areas
- ✅ Easy to add more tests per menu
- ✅ Clear separation of concerns
- ✅ Minimal but comprehensive
- ✅ Scalable structure
