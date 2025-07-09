#!/usr/bin/env node

/**
 * @fileoverview Script to update widget documentation with new version and integrity hash
 * 
 * This script automatically updates docs/WIDGET.md with the latest widget version,
 * CDN URLs, and SHA-384 integrity hashes after a successful production build.
 */

import { readFileSync, writeFileSync } from 'fs';
import { createHash } from 'crypto';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '..');

/**
 * Main function to update widget documentation
 */
async function updateWidgetDoc() {
  try {
    console.log('📝 Updating widget documentation...');
    
    // Read package.json to get current version
    const packageJson = JSON.parse(readFileSync(join(ROOT_DIR, 'package.json'), 'utf8'));
    const version = packageJson.version;
    console.log(`📦 Current version: ${version}`);
    
    // Read the built widget bundle
    const bundlePath = join(ROOT_DIR, 'dist', 'survai-widget.umd.js');
    const bundleContent = readFileSync(bundlePath);
    
    // Calculate SHA-384 hash
    const hash = createHash('sha384').update(bundleContent).digest('base64');
    console.log(`🔐 SHA-384 hash: ${hash}`);
    
    // Write hash to file for CI/CD pipeline
    writeFileSync(join(ROOT_DIR, 'dist', 'survai-widget.umd.js.sha384'), hash);
    
    // Read current documentation
    const docPath = join(ROOT_DIR, 'docs', 'WIDGET.md');
    let docContent = readFileSync(docPath, 'utf8');
    
    // Update CDN URLs with new version
    const cdnUrlPattern = /https:\/\/cdn\.survai\.app\/widget\/[\d\.]+\/survai-widget\.js/g;
    const newCdnUrl = `https://cdn.survai.app/widget/${version}/survai-widget.js`;
    
    const cdnMatches = docContent.match(cdnUrlPattern);
    if (cdnMatches) {
      docContent = docContent.replace(cdnUrlPattern, newCdnUrl);
      console.log(`🔗 Updated ${cdnMatches.length} CDN URLs to version ${version}`);
    }
    
    // Update alternative CDN URLs (cdn.survai.com)
    const altCdnUrlPattern = /https:\/\/cdn\.survai\.com\/widget\/[\d\.]+\/survai-widget\.js/g;
    const newAltCdnUrl = `https://cdn.survai.com/widget/${version}/survai-widget.js`;
    
    const altCdnMatches = docContent.match(altCdnUrlPattern);
    if (altCdnMatches) {
      docContent = docContent.replace(altCdnUrlPattern, newAltCdnUrl);
      console.log(`🔗 Updated ${altCdnMatches.length} alternative CDN URLs to version ${version}`);
    }
    
    // Update integrity hashes
    const integrityPattern = /integrity="sha384-[^"]+"/g;
    const newIntegrity = `integrity="sha384-${hash}"`;
    
    const integrityMatches = docContent.match(integrityPattern);
    if (integrityMatches) {
      docContent = docContent.replace(integrityPattern, newIntegrity);
      console.log(`🔒 Updated ${integrityMatches.length} integrity hashes`);
    }
    
    // Update UMD script references
    const umdPattern = /src="[^"]*survai-widget\.umd\.js"/g;
    const newUmdSrc = `src="${newCdnUrl}"`;
    
    const umdMatches = docContent.match(umdPattern);
    if (umdMatches) {
      docContent = docContent.replace(umdPattern, newUmdSrc);
      console.log(`📦 Updated ${umdMatches.length} UMD script references`);
    }
    
    // Update version references in documentation
    const versionPattern = /<!-- VERSION: [\d\.]+ -->/g;
    const newVersionComment = `<!-- VERSION: ${version} -->`;
    
    // Add version comment if it doesn't exist
    if (!docContent.includes('<!-- VERSION:')) {
      docContent = `${newVersionComment}\n${docContent}`;
      console.log(`🏷️ Added version comment: ${version}`);
    } else {
      docContent = docContent.replace(versionPattern, newVersionComment);
      console.log(`🏷️ Updated version comment to: ${version}`);
    }
    
    // Update bundle size information if present
    const bundleSize = bundleContent.length;
    const bundleSizeKB = Math.round(bundleSize / 1024);
    
    // Update bundle size references in documentation
    const bundleSizePattern = /Bundle Size.*?~\d+kB/g;
    const newBundleSize = `Bundle Size**: ~${bundleSizeKB}kB`;
    
    const bundleSizeMatches = docContent.match(bundleSizePattern);
    if (bundleSizeMatches) {
      docContent = docContent.replace(bundleSizePattern, newBundleSize);
      console.log(`📊 Updated bundle size to: ${bundleSizeKB}kB`);
    }
    
    // Write updated documentation
    writeFileSync(docPath, docContent);
    console.log('✅ Documentation updated successfully!');
    
    // Generate summary
    console.log('\n📋 Update Summary:');
    console.log(`   Version: ${version}`);
    console.log(`   CDN URL: ${newCdnUrl}`);
    console.log(`   SHA-384: ${hash}`);
    console.log(`   Bundle Size: ${bundleSizeKB}kB`);
    console.log(`   Updated: ${docPath}`);
    
  } catch (error) {
    console.error('❌ Error updating widget documentation:', error.message);
    process.exit(1);
  }
}

/**
 * Validate that all required files exist
 */
function validateFiles() {
  const requiredFiles = [
    join(ROOT_DIR, 'package.json'),
    join(ROOT_DIR, 'dist', 'survai-widget.umd.js'),
    join(ROOT_DIR, 'docs', 'WIDGET.md')
  ];
  
  for (const file of requiredFiles) {
    try {
      readFileSync(file);
    } catch (error) {
      console.error(`❌ Required file not found: ${file}`);
      console.error('Please run "npm run build:widget:prod" first');
      process.exit(1);
    }
  }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  validateFiles();
  updateWidgetDoc();
}

export { updateWidgetDoc };