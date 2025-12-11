#!/usr/bin/env node

/**
 * Bundle Size Analyzer
 * Run after build to analyze bundle sizes
 */

const fs = require('fs');
const path = require('path');

const BUILD_DIR = path.join(__dirname, '.next');
const STATIC_DIR = path.join(BUILD_DIR, 'static');

function getDirectorySize(dirPath) {
  let totalSize = 0;
  
  if (!fs.existsSync(dirPath)) {
    return 0;
  }

  const files = fs.readdirSync(dirPath);
  
  files.forEach(file => {
    const filePath = path.join(dirPath, file);
    const stats = fs.statSync(filePath);
    
    if (stats.isDirectory()) {
      totalSize += getDirectorySize(filePath);
    } else {
      totalSize += stats.size;
    }
  });
  
  return totalSize;
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

function analyzeChunks() {
  const chunksDir = path.join(STATIC_DIR, 'chunks');
  
  if (!fs.existsSync(chunksDir)) {
    console.log('❌ Build directory not found. Run "npm run build" first.');
    return;
  }

  console.log('\n📊 Bundle Size Analysis\n');
  console.log('='.repeat(60));
  
  const chunks = [];
  
  function scanDirectory(dir, prefix = '') {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stats = fs.statSync(filePath);
      
      if (stats.isDirectory()) {
        scanDirectory(filePath, prefix + file + '/');
      } else if (file.endsWith('.js')) {
        chunks.push({
          name: prefix + file,
          size: stats.size,
          path: filePath
        });
      }
    });
  }
  
  scanDirectory(chunksDir);
  
  // Sort by size
  chunks.sort((a, b) => b.size - a.size);
  
  // Display top 15 chunks
  console.log('\n🔍 Top 15 Largest Chunks:\n');
  chunks.slice(0, 15).forEach((chunk, index) => {
    const size = formatBytes(chunk.size);
    const bar = '█'.repeat(Math.min(Math.floor(chunk.size / 10000), 50));
    console.log(`${index + 1}. ${chunk.name}`);
    console.log(`   ${bar} ${size}`);
  });
  
  // Total size
  const totalSize = chunks.reduce((sum, chunk) => sum + chunk.size, 0);
  console.log('\n' + '='.repeat(60));
  console.log(`📦 Total JS Bundle Size: ${formatBytes(totalSize)}`);
  
  // Warnings
  console.log('\n⚠️  Recommendations:\n');
  
  chunks.forEach(chunk => {
    if (chunk.size > 500000) {
      console.log(`   • ${chunk.name} is large (${formatBytes(chunk.size)})`);
      console.log(`     Consider code-splitting or lazy loading`);
    }
  });
  
  // Page analysis
  const pagesDir = path.join(STATIC_DIR, 'chunks', 'pages');
  if (fs.existsSync(pagesDir)) {
    console.log('\n📄 Page Sizes:\n');
    const pages = fs.readdirSync(pagesDir);
    pages.forEach(page => {
      const pagePath = path.join(pagesDir, page);
      const size = fs.statSync(pagePath).size;
      console.log(`   ${page}: ${formatBytes(size)}`);
    });
  }
  
  console.log('\n✅ Analysis complete!\n');
}

analyzeChunks();
