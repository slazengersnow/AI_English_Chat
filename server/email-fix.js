// Server-side email fix for Supabase
import { createClient } from '@supabase/supabase-js'

// Use service role key for admin operations
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://xcjplyhqxgrbdhixmzse.supabase.co'
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjanlseXFoeGdyYmRoaXhtenNlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNTM2MTEyMywiZXhwIjoyMDUwOTM3MTIzfQ.yVr_6dPQPzUq2-1zJ6ZNwRrqNYO4hzS-tJBMIkxgzA8'

const adminClient = createClient(supabaseUrl, serviceRoleKey)

async function generatePasswordResetLink(email) {
  try {
    console.log('Generating password reset link for:', email)
    
    const { data, error } = await adminClient.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: 'process.env.SITE_URL || window.location.origin/reset-password'
      }
    })

    if (error) {
      console.error('Error generating link:', error)
      return { success: false, error: error.message }
    }

    console.log('Successfully generated link:', data)
    return { 
      success: true, 
      link: data.properties.action_link,
      email: data.user.email 
    }
  } catch (error) {
    console.error('Exception generating link:', error)
    return { success: false, error: error.message }
  }
}

async function inviteUserByEmail(email) {
  try {
    console.log('Inviting user by email:', email)
    
    const { data, error } = await adminClient.auth.admin.inviteUserByEmail(email, {
      redirectTo: 'process.env.SITE_URL || window.location.origin/reset-password'
    })

    if (error) {
      console.error('Error inviting user:', error)
      return { success: false, error: error.message }
    }

    console.log('Successfully invited user:', data)
    return { 
      success: true, 
      user: data.user,
      email: data.user.email 
    }
  } catch (error) {
    console.error('Exception inviting user:', error)
    return { success: false, error: error.message }
  }
}

async function fixEmailForUser(email) {
  console.log('Starting email fix for:', email)
  
  const results = []
  
  // Try generating reset link
  const resetResult = await generatePasswordResetLink(email)
  results.push({ method: 'generatePasswordResetLink', ...resetResult })
  
  if (resetResult.success) {
    console.log('✓ Password reset link generated successfully')
    console.log('Link:', resetResult.link)
    return { success: true, results, directLink: resetResult.link }
  }
  
  // Try inviting user
  const inviteResult = await inviteUserByEmail(email)
  results.push({ method: 'inviteUserByEmail', ...inviteResult })
  
  if (inviteResult.success) {
    console.log('✓ User invited successfully')
    return { success: true, results, method: 'invite' }
  }
  
  console.log('✗ All methods failed')
  return { success: false, results }
}

// Run the fix
const email = 'slazengersnow@gmail.com'
fixEmailForUser(email)
  .then(result => {
    console.log('Final result:', JSON.stringify(result, null, 2))
    
    if (result.success && result.directLink) {
      console.log('\n=== SUCCESS ===')
      console.log('Direct password reset link:')
      console.log(result.directLink)
      console.log('\nClick this link to reset your password!')
    }
  })
  .catch(error => {
    console.error('Script error:', error)
  })