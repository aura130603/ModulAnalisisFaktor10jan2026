# Factor Analysis WASM Build Instructions

## Overview
This directory contains the Rust source code for the Factor Analysis WASM module. The Rust code needs to be compiled to WebAssembly (WASM) to be used in the JavaScript/TypeScript application.

## Prerequisites
Before building, ensure you have the following installed:
1. **Rust**: https://www.rust-lang.org/tools/install
2. **wasm-pack**: https://rustwasm.org/docs/wasm-pack/installer/
   ```bash
   curl https://rustwasm.org/wasm-pack/installer/init.sh -sSf | sh
   ```

## Build Instructions

### Build for Web Development
Run the following command from the `frontend/components/Modals/Analyze/dimension-reduction/factor/rust/` directory:

```bash
wasm-pack build --target web
```

This will:
- Compile the Rust code to WebAssembly
- Generate JavaScript bindings
- Create the `pkg/` directory with all necessary files:
  - `wasm.wasm` - The compiled WebAssembly binary
  - `wasm.js` - JavaScript wrapper for the WASM module
  - `wasm.d.ts` - TypeScript definitions
  - `package.json` - Package metadata

### Build for Production
For production builds with optimizations:

```bash
wasm-pack build --target web --release
```

## File Structure After Build
After running `wasm-pack build`, the `pkg/` directory will contain:
```
pkg/
├── wasm.wasm          # Compiled WebAssembly binary
├── wasm_bg.wasm       # Background WASM module
├── wasm.js            # JavaScript binding glue code
├── wasm.d.ts          # TypeScript definitions
├── wasm_bg.wasm.d.ts  # TypeScript definitions for background module
└── package.json       # Package metadata
```

## Integration with TypeScript

The compiled WASM module is imported in `frontend/components/Modals/Analyze/dimension-reduction/factor/services/factor-analysis.ts`:

```typescript
import init, {
    FactorAnalysis,
} from "@/components/Modals/Analyze/dimension-reduction/factor/rust/pkg";
```

The WASM module provides the `FactorAnalysis` class with methods:
- `new FactorAnalysis(target_data, value_target_data, target_data_defs, value_target_data_defs, config_data)`
- `get_results()` - Returns raw analysis results
- `get_formatted_results()` - Returns formatted results ready for display
- `get_all_errors()` - Returns any errors that occurred during analysis
- `clear_errors()` - Clears the error list

## Troubleshooting

### Error: "wasm-pack: command not found"
- Install wasm-pack: `curl https://rustwasm.org/wasm-pack/installer/init.sh -sSf | sh`
- Ensure it's in your PATH

### Error: "Could not find Rust toolchain for wasm32"
- Install the wasm32 target: `rustup target add wasm32-unknown-unknown`

### Error: "Cannot find module 'wasm_bg.wasm'"
- Ensure you ran `wasm-pack build` from the correct directory
- Verify the `pkg/` directory was created with the WASM binary

### Build takes a long time
- This is normal for the first build. Subsequent builds are faster.
- For development, the default (non-optimized) build is recommended as it's faster.

## Development Workflow

1. Modify Rust source files in `src/`
2. Run `wasm-pack build --target web` (from this directory)
3. The build will update files in `pkg/`
4. Run the frontend dev server to test changes: `npm run dev` (from `frontend/` directory)

## Testing

To run tests on the Rust code:
```bash
cargo test
```

To run tests in Node.js:
```bash
wasm-pack test --node
```

## Next Steps

Once the WASM module is compiled:
1. The `Factor Analysis` menu will be fully functional
2. Results will display in the "Result" tab after analysis
3. The following outputs will be available:
   - Correlation Matrix
   - Communalities
   - Total Variance Explained
   - Component Matrix

## References

- [wasm-pack Documentation](https://rustwasm.org/docs/wasm-pack/)
- [Rust WASM Book](https://rustwasm.org/docs/book/)
- [MDN WebAssembly](https://developer.mozilla.org/en-US/docs/WebAssembly/)
