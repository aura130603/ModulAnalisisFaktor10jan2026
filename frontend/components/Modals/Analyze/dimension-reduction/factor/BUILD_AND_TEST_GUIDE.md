# Build and Test Guide - Correlation Matrix Fix

## Step 1: Rebuild the Rust WASM Module

Navigate to the Rust project directory and build:

```bash
cd frontend/components/Modals/Analyze/dimension-reduction/factor/rust
```

Build the WASM module:

```bash
wasm-pack build --target web
```

This will:
- Compile the Rust code to WebAssembly
- Generate JavaScript bindings in the `pkg/` folder
- Create the `wasm_bg.wasm` file

Expected output should include:
```
✨  Done in X.XXs
⬇️  Installing dependencies...
// ... dependency installation messages ...
🎉  Build successful!
```

If you encounter any build errors, they will typically be related to:
- Missing Rust dependencies (install via `cargo`)
- Rust version compatibility (ensure you have a recent stable version)

## Step 2: Restart the Development Server

After the build completes, the frontend dev server should automatically detect the changes. If not:

```bash
# From the root directory
npm run dev
# or
yarn dev
# or  
pnpm dev
```

The dev server should output something like:
```
> next dev

▲ Next.js 13.x.x
- Local:        http://localhost:3000
- Environments: .env
```

## Step 3: Test the Correlation Matrix Fix

### Test Case 1: Coefficients Only

1. Open the application at `http://localhost:3000`
2. Go to **Analyze** → **Dimension Reduction** → **Factor**
3. Select variables (e.g., var1, var2, var3, var4, var5, var6)
4. Click **Continue** until you reach the **Descriptives** dialog
5. In Descriptives dialog:
   - **Check**: "Univariate Descriptives"
   - **Check**: "Coefficients"
   - **Uncheck**: "Significance Levels"
   - Click **Continue**
6. Proceed through remaining dialogs and click **OK**
7. Go to the **Result** tab
8. Check the **Correlation Matrix** table:
   - ✅ Variables should appear in order: var1, var2, var3, var4, var5, var6
   - ✅ Should show only correlation coefficients
   - ✅ Should NOT show "Sig. (1-tailed)" rows
   - ✅ Values should be between -1 and 1
   - ✅ Diagonal should be 1.000

### Test Case 2: Coefficients + Significance Levels

1. Repeat steps 1-5 from Test Case 1, but:
   - **Check**: "Coefficients"
   - **Check**: "Significance Levels"
2. Proceed through remaining dialogs and click **OK**
3. Go to the **Result** tab
4. Check the **Correlation Matrix** table:
   - ✅ Variables should appear in order: var1, var2, var3, var4, var5, var6
   - ✅ Should show correlation coefficients first
   - ✅ Should show "Sig. (1-tailed)" section after correlation values
   - ✅ Significance values should be between 0 and 1 (p-values)

### Test Case 3: Variable Order Verification

1. Test with a different variable order
2. Select variables in a specific order: var5, var2, var1, var6
3. Verify that the correlation matrix displays them in exactly this order
4. Confirm both the row headers and column headers match the selection order

## Step 4: Compare with SPSS Output

Expected correlation coefficient range:
- Must be between -1.0 and 1.0
- Diagonal elements should be exactly 1.0
- Matrix should be symmetric (r_ij = r_ji)
- Values should match SPSS output exactly (to 3-4 decimal places)

Example comparison:
```
SPSS Output:              Current Output:
var1  1.000              var1  1.000
var2  0.923              var2  0.923
var3  0.262              var3  0.262
```

## Troubleshooting

### Issue: WASM Build Fails
**Solution**: 
- Ensure Rust is installed: `rustup --version`
- Update Rust: `rustup update`
- Install wasm-pack: `cargo install wasm-pack`

### Issue: Build Succeeds but Changes Don't Appear
**Solution**:
- Clear browser cache: Ctrl+Shift+Delete (Chrome) or similar
- Restart dev server: `npm run dev`
- Check browser console for errors: F12

### Issue: "Cannot find module" Error
**Solution**:
- Verify WASM file exists: `ls -la frontend/components/Modals/Analyze/dimension-reduction/factor/rust/pkg/`
- If missing, rebuild: `wasm-pack build --target web`

### Issue: Correlation Values Look Wrong
**Solution**:
- Check that variable order is preserved in output
- Verify config is being passed correctly (check browser console logs)
- Compare with SPSS output for the same data

## Quick Verification Checklist

Before considering the fix complete:

- [ ] WASM builds successfully without errors
- [ ] Dev server restarts without errors
- [ ] Factor Analysis dialog opens
- [ ] Variables are selectable
- [ ] Correlation Matrix appears in results
- [ ] Variables are in correct order
- [ ] Sig values only show when both checkboxes checked
- [ ] Correlation values match SPSS (within rounding)
- [ ] No JavaScript errors in browser console
- [ ] Table formatting matches SPSS style

## Performance Notes

The changes should have:
- ✅ Same or better performance (less calculation when sig values not needed)
- ✅ No memory leaks
- ✅ Proper error handling
- ✅ Better data organization

## Additional Testing

### Edge Cases to Test

1. **Single Variable**: Select only var1
   - Should return 1x1 matrix with value 1.000

2. **Perfect Correlation**: If you have variables with r = 1.0 or r = -1.0
   - Significance should be 0.000

3. **No Correlation**: If you have variables with r ≈ 0
   - Significance should be high (close to 1.0)

4. **Large Dataset**: Test with 10+ variables
   - Should handle efficiently
   - Order should still be preserved

## Documentation

See `CORRELATION_MATRIX_FIX.md` for:
- Detailed explanation of all changes
- Code modifications summary
- Expected output formats
- Formula verification

## Support

If you encounter any issues:
1. Check the error messages in browser console (F12)
2. Review the build output for compilation errors
3. Verify all files were modified correctly
4. Check that WASM module was rebuilt after code changes
