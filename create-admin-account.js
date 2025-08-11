#!/usr/bin/env node

// Script to create admin account in Supabase
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xcjplyhqxgrbdhixmzse.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || 'YOUR_SERVICE_KEY_HERE';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createAdminAccount() {
  const adminEmail = 'slazengersnow@gmail.com';
  const adminPassword = 's05936623';

  try {
    console.log('Creating admin account...');

    // Create user with admin service key
    const { data, error } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true, // Skip email confirmation for admin
      user_metadata: {
        role: 'admin'
      }
    });

    if (error) {
      console.error('Error creating admin account:', error.message);
      return;
    }

    console.log('✅ Admin account created successfully:', {
      id: data.user.id,
      email: data.user.email,
      confirmed: !!data.user.email_confirmed_at
    });

    // Update user metadata to mark as admin
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      data.user.id,
      {
        user_metadata: { role: 'admin' }
      }
    );

    if (updateError) {
      console.warn('Warning: Could not set admin role:', updateError.message);
    } else {
      console.log('✅ Admin role assigned successfully');
    }

  } catch (error) {
    console.error('Exception creating admin account:', error);
  }
}

createAdminAccount();