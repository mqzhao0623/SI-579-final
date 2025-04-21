# Motivation Chrome Extension

A simple Chrome extension for displaying motivational quotes.

## Features
- Display random motivational quotes from ZenQuotes API
- Save favorite quotes
- Track the number of quotes viewed in current session
- Limit quote generation to 4 per hour to maintain focus

## Installation Guide

1. Download or clone this project to your local machine
2. Open Chrome browser
3. Enter `chrome://extensions/` in the address bar
4. Enable "Developer Mode" in the top right corner
5. Click "Load unpacked" button in the top left corner
6. Select the folder containing these files

## Usage

1. Click the extension icon in Chrome toolbar to view quotes
2. Click "Next Quote" button to see a new quote
3. Click heart button to save your favorite quote
4. Note: You can generate up to 4 new quotes per hour

## File Structure

- `manifest.json`: Extension configuration file
- `popup.html`: Extension popup interface
- `popup.js`: Extension functionality implementation
- `styles.css`: Style file
- `icon.png`: Extension icon

## Development

This extension was created as part of SI 579 course project. It demonstrates:
- DOM manipulation
- Event handling
- Chrome Storage API usage
- Modern CSS styling
- JSDoc documentation
- External API integration (ZenQuotes)

## Note

The extension requires:
- "storage" permission to save your favorite quotes locally
- Internet connection to fetch quotes from ZenQuotes API 