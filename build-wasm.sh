#!/bin/bash

# Build script for WASM modules in the project

echo "Building Factor Analysis WASM module..."
cd frontend/components/Modals/Analyze/dimension-reduction/factor/rust
wasm-pack build --target web --release
echo "✓ Factor Analysis WASM module built successfully"

echo ""
echo "Building TimeSeries WASM module..."
cd ../../../../TimeSeries/wasm
wasm-pack build --target web --release
echo "✓ TimeSeries WASM module built successfully"

echo ""
echo "Building K-Means Cluster WASM module..."
cd ../../Classify/k-means-cluster/rust
wasm-pack build --target web --release
echo "✓ K-Means Cluster WASM module built successfully"

echo ""
echo "Building Univariate WASM module..."
cd ../../general-linear-model/univariate/rust
wasm-pack build --target web --release
echo "✓ Univariate WASM module built successfully"

echo ""
echo "All WASM modules built successfully!"
