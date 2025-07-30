// Manually confirm admin account to bypass email verification
const { createClient } = require('@supabase/supabase-js');

async function confirmAdminAccount() {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY;
  
  console.log('Attempting to confirm admin account...');
  
  const supabase = createClient(url, key);
  
  try {
    // Try to create a new user with different approach
    console.log('Testing different password...');
    
    // First, try to delete the existing user if possible
    const { data: existingUser, error: fetchError } = await supabase.auth.signInWithPassword({
      email: 'slazengersnow@gmail.com',
      password: 's05936623'
    });
    
    if (fetchError) {
      console.log('Current error:', fetchError.message, 'Code:', fetchError.code);
      
      if (fetchError.code === 'email_not_confirmed') {
        console.log('Email needs confirmation - this is expected');
        
        // Try to resend confirmation email
        const { data: resendData, error: resendError } = await supabase.auth.resend({
          type: 'signup',
          email: 'slazengersnow@gmail.com'
        });
        
        if (resendError) {
          console.log('Resend error:', resendError.message);
        } else {
          console.log('Confirmation email resent successfully');
        }
      } else if (fetchError.code === 'invalid_credentials') {
        console.log('Invalid credentials - trying to create new account with simpler password');
        
        // Try creating account with different password
        const { data: newAccount, error: newError } = await supabase.auth.signUp({
          email: 'admin@test.com',
          password: 'admin123',
          options: {
            data: {
              role: 'admin',
              is_admin: true
            }
          }
        });
        
        if (newError) {
          console.log('New account error:', newError.message);
        } else {
          console.log('New admin account created:', newAccount.user?.email);
          console.log('User ID:', newAccount.user?.id);
          console.log('Confirmed:', newAccount.user?.email_confirmed_at ? 'YES' : 'NO');
        }
      }
    } else {
      console.log('Login successful!');
      console.log('User:', existingUser.user?.email);
      console.log('Confirmed:', existingUser.user?.email_confirmed_at ? 'YES' : 'NO');
    }
    
  } catch (e) {
    console.log('Exception:', e.message);
  }
}

confirmAdminAccount().catch(console.error);