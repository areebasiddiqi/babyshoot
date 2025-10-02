#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Find all API route files
const apiRoutes = glob.sync('app/api/**/route.ts', { cwd: process.cwd() });

console.log(`Found ${apiRoutes.length} API route files`);

apiRoutes.forEach(filePath => {
  const fullPath = path.join(process.cwd(), filePath);
  const content = fs.readFileSync(fullPath, 'utf8');
  
  // Check if the file uses cookies and doesn't already have dynamic export
  const usesCookies = content.includes('cookies') && content.includes('await import(\'next/headers\')');
  const hasDynamicExport = content.includes('export const dynamic');
  
  if (usesCookies && !hasDynamicExport) {
    console.log(`Adding dynamic export to: ${filePath}`);
    
    // Find the first import statement and add the dynamic export after imports
    const lines = content.split('\n');
    let insertIndex = 0;
    
    // Find the last import statement
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('import ') || lines[i].startsWith('export ')) {
        insertIndex = i + 1;
      } else if (lines[i].trim() === '' && insertIndex > 0) {
        // Found empty line after imports
        break;
      }
    }
    
    // Insert the dynamic export
    lines.splice(insertIndex, 0, '', '// Force dynamic rendering for this API route', 'export const dynamic = \'force-dynamic\'');
    
    const newContent = lines.join('\n');
    fs.writeFileSync(fullPath, newContent, 'utf8');
  }
});

console.log('Finished adding dynamic exports to API routes');
