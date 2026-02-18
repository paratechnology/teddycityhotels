const fs = require('fs');
const path = require('path');

// Define the path to the environment file that needs to be modified.
const envFilePath = path.join(__dirname, '../apps/client/src/environments/environment.prod.ts');

console.log(`Starting replacement of environment variables in: ${envFilePath}`);

// Check if the file exists before trying to read it.
if (!fs.existsSync(envFilePath)) {
  console.error(`Error: Environment file not found at ${envFilePath}`);
  process.exit(1);
}

// Read the file's content.
let envFileContent = fs.readFileSync(envFilePath, 'utf8');

// Define the mapping between the placeholders in the file and the actual environment variable names.
const variablesToReplace = {
  // Logic: Try Ionic name first OR try App Hosting name second
  '__FIREBASE_API_KEY__': process.env.FIREBASE_API_KEY || process.env.APP_FIREBASE_API_KEY,
  '__FIREBASE_AUTH_DOMAIN__': process.env.FIREBASE_AUTH_DOMAIN || process.env.APP_FIREBASE_AUTH_DOMAIN,
  '__FIREBASE_PROJECT_ID__': process.env.FIREBASE_PROJECT_ID || process.env.APP_FIREBASE_PROJECT_ID,
  '__FIREBASE_STORAGE_BUCKET__': process.env.FIREBASE_STORAGE_BUCKET || process.env.APP_FIREBASE_STORAGE_BUCKET,
  '__FIREBASE_MESSAGING_SENDER_ID__': process.env.FIREBASE_MESSAGING_SENDER_ID || process.env.APP_FIREBASE_MESSAGING_SENDER_ID,
  '__FIREBASE_APP_ID__': process.env.FIREBASE_APP_ID || process.env.APP_FIREBASE_APP_ID,
  '__FIREBASE_MEASUREMENT_ID__': process.env.FIREBASE_MEASUREMENT_ID || process.env.APP_FIREBASE_MEASUREMENT_ID,
  '__MS_APP_ID__': process.env.MS_APP_ID || process.env.APP_MS_APP_ID,
};
// Loop through each variable and replace its placeholder in the file content.
for (const [placeholder, value] of Object.entries(variablesToReplace)) {
  if (value) {
    console.log(`- Replacing ${placeholder}...`);

    const cleanValue = value.trim();
   envFileContent = envFileContent.replace(
      new RegExp(placeholder, 'g'),
      cleanValue
    );
  } else {
    console.warn(`  - Warning: Environment variable for ${placeholder} is not set.`);
  }
}


// Write the modified content back to the file.
fs.writeFileSync(envFilePath, envFileContent, 'utf8');

console.log('✅ Environment variables replaced successfully.');
