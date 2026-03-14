#!/usr/bin/env bash
# exit on error
set -o errexit

# Install dependencies
npm install

# Install Puppeteer browsers
npx puppeteer browsers install chrome

echo "...Build Complete (Scraper Integrated)..."
