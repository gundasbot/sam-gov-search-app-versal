// fix-all-prisma.js
// Run with: node fix-all-prisma.js

const fs = require('fs');
const path = require('path');

// Model name replacements (prisma.modelName.method)
const modelReplacements = [
  { from: /prisma\.user\./g, to: 'prisma.users.' },
  { from: /prisma\.search\./g, to: 'prisma.searches.' },
  { from: /prisma\.savedSearch\./g, to: 'prisma.saved_searches.' },
  { from: /prisma\.alertExport\./g, to: 'prisma.alert_exports.' },
  { from: /prisma\.searchAlert\./g, to: 'prisma.search_alerts.' },
  { from: /prisma\.savedSearchNew\./g, to: 'prisma.saved_searches_new.' },
  { from: /prisma\.savedSearchV2\./g, to: 'prisma.saved_searches_v2.' },
  { from: /prisma\.searchExport\./g, to: 'prisma.search_exports.' },
  { from: /prisma\.emailVerificationToken\./g, to: 'prisma.email_verification_tokens.' },
  { from: /prisma\.passwordResetToken\./g, to: 'prisma.password_reset_tokens.' },
  { from: /prisma\.autoLoginToken\./g, to: 'prisma.auto_login_tokens.' },
];

// Relation name replacements (include: { relationName: ... })
const relationReplacements = [
  // user -> users (in include statements)
  { from: /include:\s*\{\s*user\s*:/g, to: 'include: { users:' },
  { from: /,\s*user\s*:/g, to: ', users:' },
];

// Recursively get all TypeScript files
function getAllTsFiles(dir, fileList = []) {
  try {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      
      try {
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          // Skip node_modules and .next
          if (file !== 'node_modules' && file !== '.next' && !file.startsWith('.')) {
            getAllTsFiles(filePath, fileList);
          }
        } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
          fileList.push(filePath);
        }
      } catch (err) {
        // Skip files we can't access
      }
    });
  } catch (err) {
    // Skip directories we can't access
  }
  
  return fileList;
}

// Main function
function fixAllPrisma() {
  console.log('🔍 Finding TypeScript files...\n');
  
  const files = getAllTsFiles('.');
  console.log(`Found ${files.length} TypeScript files\n`);
  
  let updatedCount = 0;
  const updatedFiles = [];
  
  files.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf8');
      let newContent = content;
      
      // Apply model name replacements
      let hasChanges = false;
      modelReplacements.forEach(({ from, to }) => {
        if (from.test(newContent)) {
          hasChanges = true;
          newContent = newContent.replace(from, to);
        }
      });
      
      // Apply relation name replacements
      relationReplacements.forEach(({ from, to }) => {
        if (from.test(newContent)) {
          hasChanges = true;
          newContent = newContent.replace(from, to);
        }
      });
      
      // Only write if changes were made
      if (hasChanges) {
        fs.writeFileSync(file, newContent, 'utf8');
        updatedCount++;
        updatedFiles.push(file);
        console.log(`✓ Updated: ${file}`);
      }
    } catch (error) {
      console.error(`✗ Error processing ${file}:`, error.message);
    }
  });
  
  console.log(`\n✅ Successfully updated ${updatedCount} file(s)!\n`);
  
  if (updatedFiles.length > 0) {
    console.log('Updated files:');
    updatedFiles.forEach(f => console.log(`  - ${f}`));
  }
  
  console.log('\n📋 Next steps:');
  console.log('1. npx prisma generate');
  console.log('2. npm run build\n');
}

// Run it
fixAllPrisma();