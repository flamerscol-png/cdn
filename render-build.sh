#!/usr/bin/env bash
# exit on error
set -o errexit

# Install server dependencies
cd server
npm install

echo "...Build Complete..."
