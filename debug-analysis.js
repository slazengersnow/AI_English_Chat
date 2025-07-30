// Comprehensive debugging analysis
const { createClient } = require('@supabase/supabase-js');

async function analyzeSupabaseConfig() {
  console.log('=== SUPABASE CONFIGURATION ANALYSIS ===');
  
  // Environment variables
  const viteUrl = process.env.VITE_SUPABASE_URL;
  const viteKey = process.env.VITE_SUPABASE_ANON_KEY;
  const regularUrl = process.env.SUPABASE_URL;
  const regularKey = process.env.SUPABASE_ANON_KEY;
  
  console.log('Environment Variables:');
  console.log('- VITE_SUPABASE_URL:', viteUrl ? viteUrl.slice(0, 30) + '...' : 'NOT SET');
  console.log('- VITE_SUPABASE_ANON_KEY:', viteKey ? viteKey.slice(0, 20) + '...' : 'NOT SET');
  console.log('- SUPABASE_URL:', regularUrl ? regularUrl.slice(0, 30) + '...' : 'NOT SET');
  console.log('- SUPABASE_ANON_KEY:', regularKey ? regularKey.slice(0, 20) + '...' : 'NOT SET');
  
  // Choose the correct values
  const url = viteUrl || regularUrl;
  const key = viteKey || regularKey;
  
  console.log('\nSelected Configuration:');
  console.log('- URL:', url);
  console.log('- Key starts with:', key?.slice(0, 10));
  console.log('- Key length:', key?.length);
  console.log('- Key ends with:', key?.slice(-10));
  
  // Validate URL format
  console.log('\nURL Analysis:');
  if (url) {
    try {
      const urlObj = new URL(url);
      console.log('- Protocol:', urlObj.protocol);
      console.log('- Hostname:', urlObj.hostname);
      console.log('- Valid URL format: YES');
    } catch (e) {
      console.log('- Valid URL format: NO -', e.message);
    }
  }
  
  // Validate API key format
  console.log('\nAPI Key Analysis:');
  if (key) {
    const isJWT = key.includes('.');
    const parts = key.split('.');
    console.log('- Is JWT format:', isJWT);
    console.log('- Parts count:', parts.length);
    console.log('- Starts with eyJ:', key.startsWith('eyJ'));
    
    if (key.startsWith('postgresql://')) {
      console.log('- ERROR: This appears to be a database URL, not an API key!');
    }
  }
  
  // Test DNS resolution
  console.log('\nDNS Resolution Test:');
  if (url) {
    try {
      const hostname = new URL(url).hostname;
      const dns = require('dns').promises;
      const addresses = await dns.lookup(hostname);
      console.log('- DNS Resolution: SUCCESS');
      console.log('- IP Address:', addresses.address);
    } catch (e) {
      console.log('- DNS Resolution: FAILED -', e.message);
    }
  }
  
  // Test Supabase client creation
  console.log('\nSupabase Client Test:');
  try {
    const client = createClient(url, key);
    console.log('- Client creation: SUCCESS');
    
    // Test basic connection
    try {
      const { data, error } = await client.auth.getSession();
      console.log('- Auth session check: SUCCESS');
      console.log('- Session data:', data ? 'present' : 'null');
    } catch (e) {
      console.log('- Auth session check: FAILED -', e.message);
    }
    
    // Test sign in
    try {
      const { data, error } = await client.auth.signInWithPassword({
        email: 'slazengersnow@gmail.com',
        password: 's05936623'
      });
      
      if (error) {
        console.log('- Sign in test: FAILED -', error.message);
        console.log('- Error code:', error.status);
        console.log('- Error details:', JSON.stringify(error, null, 2));
      } else {
        console.log('- Sign in test: SUCCESS');
        console.log('- User ID:', data.user?.id);
      }
    } catch (e) {
      console.log('- Sign in test: EXCEPTION -', e.message);
    }
    
  } catch (e) {
    console.log('- Client creation: FAILED -', e.message);
  }
}

analyzeSupabaseConfig().catch(console.error);