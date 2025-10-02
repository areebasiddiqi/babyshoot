#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

/**
 * Script to fix supabaseAdmin usage across the codebase
 * Replaces direct supabaseAdmin calls with supabaseAdmin.instance calls
 */

console.log('🔧 Starting supabaseAdmin fix script...\n');

// Find all TypeScript and TSX files
const pattern = '**/*.{ts,tsx}';
const options = {
  cwd: __dirname,
  ignore: ['node_modules/**', '.next/**', 'dist/**', '*.d.ts']
};

try {
  const files = glob.sync(pattern, options);
  console.log(`📁 Found ${files.length} TypeScript files to check\n`);

  let totalFilesFixed = 0;
  let totalReplacements = 0;

  files.forEach(file => {
    const filePath = path.join(__dirname, file);
    
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      let newContent = content;
      let fileReplacements = 0;

      // Pattern 1: await supabaseAdmin.from -> await supabaseAdmin.instance.from
      const pattern1 = /await supabaseAdmin\.from/g;
      const matches1 = content.match(pattern1);
      if (matches1) {
        newContent = newContent.replace(pattern1, 'await supabaseAdmin.instance.from');
        fileReplacements += matches1.length;
      }

      // Pattern 2: await supabaseAdmin.rpc -> await supabaseAdmin.instance.rpc
      const pattern2 = /await supabaseAdmin\.rpc/g;
      const matches2 = newContent.match(pattern2);
      if (matches2) {
        newContent = newContent.replace(pattern2, 'await supabaseAdmin.instance.rpc');
        fileReplacements += matches2.length;
      }

      // Pattern 3: await supabaseAdmin.auth -> await supabaseAdmin.instance.auth
      const pattern3 = /await supabaseAdmin\.auth/g;
      const matches3 = newContent.match(pattern3);
      if (matches3) {
        newContent = newContent.replace(pattern3, 'await supabaseAdmin.instance.auth');
        fileReplacements += matches3.length;
      }

      // Pattern 4: await supabaseAdmin.storage -> await supabaseAdmin.instance.storage
      const pattern4 = /await supabaseAdmin\.storage/g;
      const matches4 = newContent.match(pattern4);
      if (matches4) {
        newContent = newContent.replace(pattern4, 'await supabaseAdmin.instance.storage');
        fileReplacements += matches4.length;
      }

      // Pattern 5: supabaseAdmin\n.from -> supabaseAdmin.instance\n.from (multiline)
      const pattern5 = /supabaseAdmin(\s*\n\s*)\.from/g;
      const matches5 = newContent.match(pattern5);
      if (matches5) {
        newContent = newContent.replace(pattern5, 'supabaseAdmin.instance$1.from');
        fileReplacements += matches5.length;
      }

      // Pattern 6: supabaseAdmin\n.rpc -> supabaseAdmin.instance\n.rpc (multiline)
      const pattern6 = /supabaseAdmin(\s*\n\s*)\.rpc/g;
      const matches6 = newContent.match(pattern6);
      if (matches6) {
        newContent = newContent.replace(pattern6, 'supabaseAdmin.instance$1.rpc');
        fileReplacements += matches6.length;
      }

      // Pattern 7: supabaseAdmin\n.auth -> supabaseAdmin.instance\n.auth (multiline)
      const pattern7 = /supabaseAdmin(\s*\n\s*)\.auth/g;
      const matches7 = newContent.match(pattern7);
      if (matches7) {
        newContent = newContent.replace(pattern7, 'supabaseAdmin.instance$1.auth');
        fileReplacements += matches7.length;
      }

      // Pattern 8: supabaseAdmin\n.storage -> supabaseAdmin.instance\n.storage (multiline)
      const pattern8 = /supabaseAdmin(\s*\n\s*)\.storage/g;
      const matches8 = newContent.match(pattern8);
      if (matches8) {
        newContent = newContent.replace(pattern8, 'supabaseAdmin.instance$1.storage');
        fileReplacements += matches8.length;
      }

      // Only write file if changes were made
      if (fileReplacements > 0) {
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log(`✅ ${file}: ${fileReplacements} replacements`);
        totalFilesFixed++;
        totalReplacements += fileReplacements;
      }

    } catch (error) {
      console.error(`❌ Error processing ${file}:`, error.message);
    }
  });

  console.log(`\n🎉 Fix complete!`);
  console.log(`📊 Summary:`);
  console.log(`   - Files checked: ${files.length}`);
  console.log(`   - Files fixed: ${totalFilesFixed}`);
  console.log(`   - Total replacements: ${totalReplacements}`);

  if (totalFilesFixed === 0) {
    console.log(`\n✨ No files needed fixing - all supabaseAdmin usage is already correct!`);
  } else {
    console.log(`\n🔨 Run 'npm run build' to verify all fixes are working correctly.`);
  }

} catch (error) {
  console.error('❌ Script failed:', error.message);
  process.exit(1);
}
