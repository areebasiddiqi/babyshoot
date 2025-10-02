const fs = require('fs');
const path = require('path');

// List of API route files that need the null check
const apiFiles = [
  'app/api/auth/create-profile/route.ts',
  'app/api/auth/sync-profile/route.ts',
  'app/api/children/[childId]/latest-session/route.ts',
  'app/api/children/route.ts',
  'app/api/credits/balance/route.ts',
  'app/api/credits/packages/route.ts',
  'app/api/credits/transactions/route.ts',
  'app/api/photoshoot/create/route.ts',
  'app/api/photoshoot/[sessionId]/route.ts',
  'app/api/photoshoot/[sessionId]/generate/route.ts',
  'app/api/photoshoot/[sessionId]/check-generation/route.ts',
  'app/api/photoshoot/[sessionId]/status/route.ts',
  'app/api/photoshoot/[sessionId]/auto-update/route.ts',
  'app/api/profile/update/route.ts',
  'app/api/stripe/create-checkout/route.ts',
  'app/api/stripe/create-payment-intent/route.ts',
  'app/api/themes/route.ts',
  'app/api/admin/themes/route.ts',
  'app/api/admin/themes/[themeId]/route.ts',
  'app/api/admin/themes/[themeId]/prompts/route.ts',
  'app/api/admin/themes/[themeId]/prompts/[promptId]/route.ts',
  'app/api/admin/themes/toggle/route.ts',
  'app/api/admin/update-session/route.ts',
  'app/api/admin/force-update-images/route.ts',
  'app/api/cron/check-generation-status/route.ts',
  'app/api/cron/check-training-status/route.ts',
  'app/api/debug/generation-status/route.ts'
];

const nullCheckPattern = `    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 })
    }

`;

function addNullCheck(filePath) {
  try {
    const fullPath = path.join(__dirname, '..', filePath);
    
    if (!fs.existsSync(fullPath)) {
      console.log(`❌ File not found: ${filePath}`);
      return;
    }

    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Check if null check already exists
    if (content.includes('if (!supabaseAdmin)')) {
      console.log(`✅ Already fixed: ${filePath}`);
      return;
    }

    // Find the pattern: export async function [METHOD](
    const functionPattern = /(export async function \w+\([^)]*\)\s*{\s*try\s*{)/;
    const match = content.match(functionPattern);
    
    if (match) {
      const replacement = match[1] + '\n' + nullCheckPattern;
      content = content.replace(functionPattern, replacement);
      
      fs.writeFileSync(fullPath, content);
      console.log(`✅ Fixed: ${filePath}`);
    } else {
      console.log(`⚠️  Pattern not found in: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
}

console.log('🔧 Fixing supabaseAdmin null checks...\n');

apiFiles.forEach(addNullCheck);

console.log('\n✅ Null check fixes completed!');
console.log('\n📋 Summary:');
console.log(`- Total files processed: ${apiFiles.length}`);
console.log('- All files should now have proper null checks for supabaseAdmin');
console.log('- Run the build again to verify all TypeScript errors are resolved');
