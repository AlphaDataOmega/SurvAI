#!/usr/bin/env node
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Patterns to detect
const PATTERNS = {
  todos: /\/\/(.*?)(TODO|FIXME|PLACEHOLDER|HACK|XXX)(.*?)$/gim,
  debugLogs: /console\.(log|debug|trace)\(/g,
  mocks: /\/\/(.*?)(mock|stub|temporary|temp)(.*?)$/gim,
  templates: /\/\/(.*?)(template placeholder|template variable)(.*?)$/gim
};

// Files to include/exclude
const INCLUDE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];
const EXCLUDE_DIRS = ['node_modules', 'dist', 'coverage', '.git', 'baselines', 'playwright-report', 'test-results'];
const EXCLUDE_FILES = ['.test.', '.spec.', 'prisma/generated'];

// Colors for output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

/**
 * Check if file should be processed
 * @param {string} filePath - The file path to check
 * @returns {boolean} - Whether to process the file
 */
function shouldProcessFile(filePath) {
  // Check extension
  const ext = path.extname(filePath);
  if (!INCLUDE_EXTENSIONS.includes(ext)) {
    return false;
  }

  // Check exclude patterns
  for (const exclude of EXCLUDE_FILES) {
    if (filePath.includes(exclude)) {
      return false;
    }
  }

  return true;
}

/**
 * Check if directory should be scanned
 * @param {string} dirPath - The directory path to check
 * @returns {boolean} - Whether to scan the directory
 */
function shouldScanDirectory(dirPath) {
  const dirName = path.basename(dirPath);
  return !EXCLUDE_DIRS.includes(dirName);
}

/**
 * Scan file for patterns
 * @param {string} filePath - Path to the file
 * @returns {Object} - Scan results
 */
async function scanFile(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const results = {
      file: filePath,
      todos: [],
      debugLogs: [],
      mocks: [],
      templates: []
    };

    const lines = content.split('\n');

    // Scan for TODOs
    lines.forEach((line, index) => {
      const todoMatch = PATTERNS.todos.exec(line);
      if (todoMatch) {
        results.todos.push({
          line: index + 1,
          text: line.trim(),
          match: todoMatch[2]
        });
      }
      PATTERNS.todos.lastIndex = 0; // Reset regex
    });

    // Scan for debug logs
    lines.forEach((line, index) => {
      const debugMatch = PATTERNS.debugLogs.exec(line);
      if (debugMatch) {
        // Skip intentional script logging
        if (filePath.includes('/scripts/') && (
          line.includes('🌱') || 
          line.includes('✅') || 
          line.includes('❌') ||
          line.includes('console.error')
        )) {
          return;
        }
        
        results.debugLogs.push({
          line: index + 1,
          text: line.trim(),
          match: debugMatch[1]
        });
      }
      PATTERNS.debugLogs.lastIndex = 0; // Reset regex
    });

    // Scan for mocks
    lines.forEach((line, index) => {
      const mockMatch = PATTERNS.mocks.exec(line);
      if (mockMatch) {
        results.mocks.push({
          line: index + 1,
          text: line.trim(),
          match: mockMatch[2]
        });
      }
      PATTERNS.mocks.lastIndex = 0; // Reset regex
    });

    // Scan for template placeholders
    lines.forEach((line, index) => {
      const templateMatch = PATTERNS.templates.exec(line);
      if (templateMatch) {
        results.templates.push({
          line: index + 1,
          text: line.trim(),
          match: templateMatch[2]
        });
      }
      PATTERNS.templates.lastIndex = 0; // Reset regex
    });

    return results;
  } catch (error) {
    console.error(`${colors.red}Error reading file ${filePath}:${colors.reset}`, error.message);
    return null;
  }
}

/**
 * Recursively scan directory
 * @param {string} dirPath - Directory to scan
 * @returns {Array} - Array of scan results
 */
async function scanDirectory(dirPath) {
  const results = [];
  
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      
      if (entry.isDirectory()) {
        if (shouldScanDirectory(fullPath)) {
          const subResults = await scanDirectory(fullPath);
          results.push(...subResults);
        }
      } else if (entry.isFile()) {
        if (shouldProcessFile(fullPath)) {
          const fileResult = await scanFile(fullPath);
          if (fileResult) {
            results.push(fileResult);
          }
        }
      }
    }
  } catch (error) {
    console.error(`${colors.red}Error scanning directory ${dirPath}:${colors.reset}`, error.message);
  }
  
  return results;
}

/**
 * Print results summary
 * @param {Array} results - Scan results
 */
function printSummary(results) {
  let totalTodos = 0;
  let totalDebugLogs = 0;
  let totalMocks = 0;
  let totalTemplates = 0;
  let filesWithIssues = 0;

  console.log(`\n${colors.cyan}=== PLACEHOLDER AUDIT SUMMARY ===${colors.reset}\n`);

  results.forEach(result => {
    const hasIssues = result.todos.length > 0 || result.debugLogs.length > 0 || 
                      result.mocks.length > 0 || result.templates.length > 0;
    
    if (hasIssues) {
      filesWithIssues++;
      console.log(`${colors.yellow}${result.file}${colors.reset}`);
      
      if (result.todos.length > 0) {
        totalTodos += result.todos.length;
        console.log(`  ${colors.red}TODOs (${result.todos.length}):${colors.reset}`);
        result.todos.forEach(todo => {
          console.log(`    Line ${todo.line}: ${todo.text}`);
        });
      }
      
      if (result.debugLogs.length > 0) {
        totalDebugLogs += result.debugLogs.length;
        console.log(`  ${colors.magenta}Debug Logs (${result.debugLogs.length}):${colors.reset}`);
        result.debugLogs.forEach(log => {
          console.log(`    Line ${log.line}: ${log.text}`);
        });
      }
      
      if (result.mocks.length > 0) {
        totalMocks += result.mocks.length;
        console.log(`  ${colors.blue}Mocks (${result.mocks.length}):${colors.reset}`);
        result.mocks.forEach(mock => {
          console.log(`    Line ${mock.line}: ${mock.text}`);
        });
      }
      
      if (result.templates.length > 0) {
        totalTemplates += result.templates.length;
        console.log(`  ${colors.green}Templates (${result.templates.length}):${colors.reset}`);
        result.templates.forEach(template => {
          console.log(`    Line ${template.line}: ${template.text}`);
        });
      }
      
      console.log();
    }
  });

  // Print final summary
  console.log(`${colors.cyan}=== FINAL RESULTS ===${colors.reset}`);
  console.log(`Files scanned: ${results.length}`);
  console.log(`Files with issues: ${filesWithIssues}`);
  console.log(`Total TODOs: ${colors.red}${totalTodos}${colors.reset}`);
  console.log(`Total Debug Logs: ${colors.magenta}${totalDebugLogs}${colors.reset}`);
  console.log(`Total Mocks: ${colors.blue}${totalMocks}${colors.reset}`);
  console.log(`Total Templates: ${colors.green}${totalTemplates}${colors.reset}`);
  
  const totalIssues = totalTodos + totalDebugLogs + totalMocks + totalTemplates;
  
  if (totalIssues === 0) {
    console.log(`\n${colors.green}✅ AUDIT PASSED: No placeholders, TODOs, debug logs, or mock implementations found!${colors.reset}`);
    process.exit(0);
  } else {
    console.log(`\n${colors.red}❌ AUDIT FAILED: ${totalIssues} issues found that need to be addressed.${colors.reset}`);
    process.exit(1);
  }
}

/**
 * Main execution function
 */
async function main() {
  const projectRoot = path.resolve(__dirname, '..');
  console.log(`${colors.cyan}Scanning project directory: ${projectRoot}${colors.reset}`);
  console.log(`${colors.yellow}Excluded directories: ${EXCLUDE_DIRS.join(', ')}${colors.reset}`);
  console.log(`${colors.yellow}Excluded files: ${EXCLUDE_FILES.join(', ')}${colors.reset}\n`);
  
  const results = await scanDirectory(projectRoot);
  printSummary(results);
}

// Export for CI usage
export { PATTERNS, scanDirectory };

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error(`${colors.red}Fatal error:${colors.reset}`, error);
    process.exit(1);
  });
}