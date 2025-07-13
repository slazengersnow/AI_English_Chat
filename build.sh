#!/bin/bash
set -e

npm ci --include=dev
npx vite build && npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist