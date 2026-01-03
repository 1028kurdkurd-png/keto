#!/usr/bin/env node
try {
  // Register ts-node to allow requiring TypeScript files in CommonJS mode
  require('ts-node').register({ transpileOnly: true });
  // Require the TypeScript sync script (it exports an IIFE which will run)
  require('./sync-with-constants.ts');
} catch (err) {
  console.error('Wrapper failed to run sync script:', err);
  process.exit(1);
}
