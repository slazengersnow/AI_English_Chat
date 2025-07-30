// Create admin account for testing
const { createClient } = require('@supabase/supabase-js');

async function createAdminAccount() {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY;
  
  console.log('Creating admin account...');
  console.log('URL:', url);
  console.log('Key prefix:', key?.slice(0, 20));
  
  const supabase = createClient(url, key);
  
  try {
    // Attempt to create the admin account
    const { data, error } = await supabase.auth.signUp({
      email: 'slazengersnow@gmail.com',
      password: 's05936623',
      options: {
        data: {
          role: 'admin',
          is_admin: true
        }
      }
    });
    
    if (error) {
      console.log('Signup error:', error.message);
      console.log('Error code:', error.status);
      
      // If user already exists, try to sign in
      if (error.message.includes('already') || error.status === 422) {
        console.log('User already exists, attempting sign in...');
        
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: 'slazengersnow@gmail.com',
          password: 's05936623'
        });
        
        if (signInError) {
          console.log('Sign in failed:', signInError.message);
          
          // Try password reset
          console.log('Attempting password reset...');
          const { data: resetData, error: resetError } = await supabase.auth.resetPasswordForEmail(
            'slazengersnow@gmail.com',
            {
              redirectTo: `${process.env.REPLIT_DEV_DOMAIN || 'http://localhost:5000'}/reset-password`
            }
          );
          
          if (resetError) {
            console.log('Password reset failed:', resetError.message);
          } else {
            console.log('Password reset email sent successfully');
          }
        } else {
          console.log('Sign in successful!');
          console.log('User ID:', signInData.user?.id);
          console.log('Email:', signInData.user?.email);
        }
      }
    } else {
      console.log('Account created successfully!');
      console.log('User ID:', data.user?.id);
      console.log('Email:', data.user?.email);
      console.log('Confirmation required:', !data.user?.email_confirmed_at);
    }
    
  } catch (e) {
    console.log('Exception occurred:', e.message);
  }
}

createAdminAccount().catch(console.error);