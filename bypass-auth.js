// Create a test account that bypasses email confirmation
const { createClient } = require('@supabase/supabase-js');

async function createTestAccount() {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY;
  
  console.log('Creating test account without email confirmation...');
  
  // Create service role client if possible, or use anon key
  const supabase = createClient(url, key);
  
  try {
    // Delete existing user first
    console.log('Cleaning up existing accounts...');
    
    // Create new test account with simple credentials
    const testEmail = 'test@example.com';
    const testPassword = 'test123';
    
    console.log('Creating test account:', testEmail);
    
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          role: 'admin',
          is_admin: true
        }
      }
    });
    
    if (error) {
      console.log('Signup error:', error.message);
      
      // If user exists, try to sign in
      if (error.message.includes('already')) {
        console.log('User exists, trying to sign in...');
        
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: testEmail,
          password: testPassword
        });
        
        if (signInError) {
          console.log('Sign in error:', signInError.message);
        } else {
          console.log('✅ Test login successful!');
          console.log('User:', signInData.user?.email);
          console.log('ID:', signInData.user?.id);
          console.log('Confirmed:', signInData.user?.email_confirmed_at ? 'YES' : 'NO');
          return { email: testEmail, password: testPassword };
        }
      }
    } else {
      console.log('Account created:', data.user?.email);
      console.log('ID:', data.user?.id);
      console.log('Confirmed:', data.user?.email_confirmed_at ? 'YES' : 'NO');
      
      // Try to sign in immediately
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword
      });
      
      if (signInError) {
        console.log('Immediate sign in error:', signInError.message);
        console.log('This might be due to email confirmation requirements');
      } else {
        console.log('✅ Immediate sign in successful!');
        return { email: testEmail, password: testPassword };
      }
    }
    
  } catch (e) {
    console.log('Exception:', e.message);
  }
  
  return null;
}

createTestAccount()
  .then(result => {
    if (result) {
      console.log('\n🎉 Test account ready:');
      console.log('Email:', result.email);
      console.log('Password:', result.password);
    } else {
      console.log('\n❌ Could not create working test account');
    }
  })
  .catch(console.error);