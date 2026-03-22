const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local');
  
  if (!fs.existsSync(envPath)) {
    console.error('❌ Error: .env.local file not found');
    process.exit(1);
  }

  const envContent = fs.readFileSync(envPath, 'utf-8');
  const envLines = envContent.split('\n');

  envLines.forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      const value = valueParts.join('=').replace(/^["']|["']$/g, '');
      process.env[key.trim()] = value.trim();
    }
  });
}

// Load environment
loadEnv();

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('❌ Error: DATABASE_URL not found in .env.local');
  process.exit(1);
}

const migrationsDir = path.join(__dirname, '..', 'database', 'migrations');
const migrations = fs.readdirSync(migrationsDir)
  .filter(f => f.endsWith('.sql'))
  .sort();

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🔄 Running Database Migrations');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

let successCount = 0;
let failCount = 0;

migrations.forEach(migration => {
  console.log(`▶️  Running: ${migration}`);
  try {
    const migrationPath = path.join(migrationsDir, migration);
    execSync(`psql "${DATABASE_URL}" -f "${migrationPath}"`, {
      stdio: 'pipe',
      encoding: 'utf-8'
    });
    console.log(`✅ Completed: ${migration}\n`);
    successCount++;
  } catch (error) {
    console.error(`❌ Failed: ${migration}`);
    console.error(`Error: ${error.message}\n`);
    failCount++;
  }
});

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`✅ Success: ${successCount} migrations`);
console.log(`❌ Failed: ${failCount} migrations`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

if (failCount > 0) {
  console.error('\n⚠️  Some migrations failed. Please check the errors above.');
  process.exit(1);
} else {
  console.log('\n🎉 All migrations completed successfully!');
}