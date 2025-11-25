require('dotenv').config({ path: '.env.local' });

async function testConnection() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  console.log('🔍 Testing Supabase connection...');
  console.log('URL:', url);
  console.log('Key:', key ? 'Found ✅' : 'Missing ❌');
  
  if (!url || !key) {
    console.error('❌ Missing credentials!');
    return;
  }
  
  try {
    console.log('\n📡 Attempting to connect...');
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    
    const response = await fetch(`${url}/rest/v1/`, {
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    console.log('Status:', response.status);
    
    if (response.ok || response.status === 404) {
      console.log('✅ Connection successful!');
      console.log('Supabase is accessible from your network.');
    } else {
      console.log('⚠️ Unexpected status:', response.status);
    }
    
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('❌ Connection timeout (15s)');
      console.error('🌐 Supabase appears to be filtered/blocked.');
      console.error('\n💡 Solutions:');
      console.error('   1. Turn on VPN');
      console.error('   2. Use Shecan DNS: 178.22.122.100');
      console.error('   3. Continue with mock data for now');
    } else {
      console.error('💥 Error:', error.message);
    }
  }
}

testConnection();







