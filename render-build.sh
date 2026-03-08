#!/usr/bin/env bash
# exit on error
set -o errexit

# Install dependencies
npm install

# Ensure Puppeteer downloads Chromium
echo "...Installing Chromium..."
npx puppeteer browsers install chrome
