const fs = require('fs');
const path = require('path');

const browserDir = path.join(__dirname, '..', 'dist', 'apps', 'client', 'browser');
const targetDir = path.join(__dirname, '..', 'dist', 'apps', 'client');

// Check if the source directory exists
if (fs.existsSync(browserDir)) {
  // Read all files from the source directory
  const files = fs.readdirSync(browserDir);

  // Move each file to the destination directory
  files.forEach(file => {
    fs.renameSync(path.join(browserDir, file), path.join(targetDir, file));
  });

  // Remove the now-empty source directory
  fs.rmdirSync(browserDir);
  console.log('✅ Build output successfully moved to dist/apps/client');
}