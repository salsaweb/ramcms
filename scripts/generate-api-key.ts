const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local');
  
  if (!fs.existsSync(envPath)) {
    console.error('❌ Error: .env.local file not found');
    console.error('Please create .env.local in the project root');
    process.exit(1);
  }

  const envContent = fs.readFileSync(envPath, 'utf-8');
  const envLines = envContent.split('\n');

  envLines.forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      const value = valueParts.join('=').replace(/^["']|["']$/g, ''); // Remove quotes
      process.env[key.trim()] = value.trim();
    }
  });
}

// Load environment variables
loadEnv();

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Missing environment variables in .env.local');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function generateApiKey(userId, name, expiresInDays) {
  try {
    // Generate secure random key
    const key = `sk_live_${crypto.randomBytes(32).toString('hex')}`;

    const expiresAt = expiresInDays
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
      : null;

    const { data, error } = await supabase
      .from('api_keys')
      .insert({
        user_id: userId,
        name,
        key,
        expires_at: expiresAt,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating API key:', error.message);
      return null;
    }

    console.log('\n✅ API Key created successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Name:       ${data.name}`);
    console.log(`Key:        ${data.key}`);
    console.log(`User ID:    ${data.user_id}`);
    console.log(`Expires:    ${data.expires_at || 'Never'}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⚠️  SAVE THIS KEY - it will not be shown again!\n');

    return data;
  } catch (err) {
    console.error('❌ Unexpected error:', err);
    return null;
  }
}

// Parse command line arguments
const userId = process.argv[2];
const name = process.argv[3] || 'API Key';
const expiresInDays = process.argv[4] ? parseInt(process.argv[4]) : undefined;

if (!userId) {
  console.error('Usage: node scripts/generate-api-key.js <user_id> [name] [expires_in_days]');
  console.error('Example: node scripts/generate-api-key.js abc-123-def "Production API" 365');
  process.exit(1);
}

// Run
generateApiKey(userId, name, expiresInDays).then(() => process.exit(0));