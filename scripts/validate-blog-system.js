#!/usr/bin/env node
/**
 * Blog Translation System - Quick Validation Script
 * Run this in Node.js to validate the blog system setup
 * Usage: node validate-blog-system.js
 */

const fs = require('fs');
const path = require('path');

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function checkFile(filepath, description) {
  try {
    if (fs.existsSync(filepath)) {
      const size = fs.statSync(filepath).size;
      log(`✓ ${description} (${size} bytes)`, 'green');
      return true;
    } else {
      log(`✗ ${description} - FILE NOT FOUND`, 'red');
      return false;
    }
  } catch (error) {
    log(`✗ ${description} - ERROR: ${error.message}`, 'red');
    return false;
  }
}

function checkFileContent(filepath, searchStrings, description) {
  try {
    const content = fs.readFileSync(filepath, 'utf8');
    let allFound = true;
    
    for (const searchString of searchStrings) {
      if (!content.includes(searchString)) {
        log(`  ✗ Missing: ${searchString}`, 'red');
        allFound = false;
      }
    }
    
    if (allFound) {
      log(`✓ ${description}`, 'green');
      return true;
    }
    return false;
  } catch (error) {
    log(`✗ ${description} - ERROR: ${error.message}`, 'red');
    return false;
  }
}

function validateJSON(filepath, description) {
  try {
    const content = fs.readFileSync(filepath, 'utf8');
    JSON.parse(content);
    log(`✓ ${description} - Valid JSON`, 'green');
    return true;
  } catch (error) {
    log(`✗ ${description} - Invalid JSON: ${error.message}`, 'red');
    return false;
  }
}

function main() {
  log('\n╔════════════════════════════════════════════════════════════╗', 'blue');
  log('║     BLOG TRANSLATION SYSTEM - VALIDATION CHECKER          ║', 'blue');
  log('╚════════════════════════════════════════════════════════════╝\n', 'blue');

  const basePath = process.cwd();
  let allPassed = true;

  // 1. Check main files exist
  log('1️⃣  Checking Main Files...', 'blue');
  allPassed &= checkFile(path.join(basePath, 'blog/index.html'), 'blog/index.html');
  allPassed &= checkFile(path.join(basePath, 'blog/article.html'), 'blog/article.html');
  allPassed &= checkFile(path.join(basePath, 'assets/js/i18n.js'), 'assets/js/i18n.js');
  allPassed &= checkFile(path.join(basePath, 'blog/assets/js/blog.js'), 'blog/assets/js/blog.js');

  // 2. Check language files
  log('\n2️⃣  Checking Language Files...', 'blue');
  const languages = ['en', 'ar', 'tr', 'ru', 'fa', 'uz', 'af'];
  for (const lang of languages) {
    const filepath = path.join(basePath, `assets/lang/${lang}.json`);
    allPassed &= validateJSON(filepath, `${lang.toUpperCase()} Language File`);
  }

  // 3. Check blog.js improvements
  log('\n3️⃣  Checking blog.js Improvements...', 'blue');
  allPassed &= checkFileContent(
    path.join(basePath, 'blog/assets/js/blog.js'),
    ['waitForI18n', 'async function', 'await this.waitForI18n()'],
    'blog.js has async improvements'
  );

  // 4. Check HTML i18n imports
  log('\n4️⃣  Checking HTML i18n Imports...', 'blue');
  allPassed &= checkFileContent(
    path.join(basePath, 'blog/index.html'),
    ['i18n.js'],
    'blog/index.html imports i18n.js'
  );
  allPassed &= checkFileContent(
    path.join(basePath, 'blog/article.html'),
    ['i18n.js'],
    'blog/article.html imports i18n.js'
  );

  // 5. Check blog articles in language files
  log('\n5️⃣  Checking Blog Articles in Language Files...', 'blue');
  for (const lang of languages) {
    try {
      const filepath = path.join(basePath, `assets/lang/${lang}.json`);
      const content = JSON.parse(fs.readFileSync(filepath, 'utf8'));
      if (content.blog_articles) {
        const articleCount = Object.keys(content.blog_articles).length;
        log(`  ✓ ${lang.toUpperCase()}: ${articleCount} articles`, 'green');
      } else {
        log(`  ✗ ${lang.toUpperCase()}: blog_articles section missing`, 'red');
        allPassed = false;
      }
    } catch (error) {
      log(`  ✗ ${lang.toUpperCase()}: Error reading file`, 'red');
      allPassed = false;
    }
  }

  // Summary
  log('\n╔════════════════════════════════════════════════════════════╗', 'blue');
  if (allPassed) {
    log('║           ✓ ALL CHECKS PASSED - SYSTEM READY!            ║', 'green');
  } else {
    log('║         ✗ SOME CHECKS FAILED - REVIEW ABOVE              ║', 'red');
  }
  log('╚════════════════════════════════════════════════════════════╝\n', 'blue');

  log('📋 Next Steps:', 'blue');
  log('  1. Open blog/index.html in browser');
  log('  2. Check that 5 article cards appear');
  log('  3. Change language and verify articles update');
  log('  4. Check browser console (F12) for any errors');
  log('  5. Verify RTL/LTR switching works\n');

  process.exit(allPassed ? 0 : 1);
}

main();
