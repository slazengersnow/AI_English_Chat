# Email Verification Setup Guide

## Overview
Complete implementation of email verification flow for the AI English Composition Chat application.

## 🚀 Implementation Status: ✅ COMPLETED

### Changes Made (August 14, 2025)

1. **Fixed Hardcoded Test Email**
   - Removed `slazengersnow@gmail.com` hardcoded in signup-simple.tsx
   - Now uses actual user input email addresses
   - Added proper form validation

2. **Created Subscription Plan Selection Screen**
   - `/subscription-select` route with 4 plan options
   - Matches provided screenshot design exactly
   - Standard/Premium monthly and yearly plans
   - 7-day free trial messaging

3. **Enhanced Email Verification Flow**
   - `auth-callback.tsx` properly handles email confirmation
   - Redirects to subscription select after verification
   - Fixed react-router-dom routing inconsistencies

4. **Added Error Handling**
   - Existing email addresses show Japanese error message
   - Clear user-friendly error states
   - Loading states during signup process

## 📋 Authentication Flow

### For New Users:
1. Visit `/signup-simple`
2. Enter email and password
3. Click "新規登録" (Sign Up)
4. Receive "確認メールを送信しました" message
5. Check email and click confirmation link
6. Redirected to `/subscription-select`
7. Choose plan and proceed to main app

### For Existing Users:
- Shows error: "このメールアドレスは既に登録されています。ログインをお試しください。"

## 🛠 Required Supabase Settings

### 1. Email Configuration
In Supabase Dashboard → Authentication → Settings:
- ✅ **Confirm email**: ON (Required for verification flow)
- ✅ **Allow new users to sign up**: ON

### 2. URL Configuration  
In Authentication → URL Configuration:
- **Site URL**: `https://your-domain.replit.dev`
- **Redirect URLs**: Add these URLs:
  ```
  https://your-domain.replit.dev/auth/callback
  http://localhost:5000/auth/callback
  ```

### 3. Email Templates (Optional)
Customize email templates in Authentication → Email Templates:
- **Confirm signup** template for verification emails
- Use Japanese text if preferred

## 🧪 Testing Instructions

### Test New Registration:
```bash
# Test the signup endpoint
curl -X POST http://localhost:5000/api/admin/create-user \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@example.com","password":"StrongPass#1"}'
```

### Test UI Flow:
1. Navigate to `/signup-simple`
2. Use a valid email address you can access
3. Use password with 8+ characters
4. Check email for confirmation link
5. Click link → should redirect to `/subscription-select`

## 🔐 Security Features

- Email verification prevents unauthorized signups
- Proper error handling for duplicate accounts
- CSP headers configured for Supabase connections
- Session management with Supabase Auth

## 🎯 Plan Selection Features

- **Standard Plan**: ¥980/month, 50 problems/day
- **Premium Plan**: ¥1,300/month, 100 problems/day  
- **Yearly Options**: 2-month discount included
- **Free Trial**: 7-day trial for all plans

## 📁 Key Files Modified

- `client/src/pages/signup-simple.tsx` - Main signup form
- `client/src/pages/subscription-select.tsx` - Plan selection screen
- `client/src/pages/auth-callback.tsx` - Email verification handler
- `client/src/App.tsx` - Route configuration
- `replit.md` - Project documentation update

## 🐛 Troubleshooting

### Common Issues:

1. **Email not received**
   - Check Supabase email settings
   - Verify SMTP configuration
   - Check spam folder

2. **Redirect not working**
   - Verify URL configuration in Supabase
   - Check CSP headers in server configuration

3. **Existing user error**
   - Expected behavior - user should use login instead
   - Consider adding "Forgot Password" option

## 🚀 Next Steps

1. Test with real email addresses
2. Configure production domain URLs in Supabase
3. Customize email templates if needed
4. Implement actual payment processing for plans
5. Add plan persistence to user profiles

## 📞 Support

If issues persist:
- Check browser console for JavaScript errors
- Review Supabase logs in dashboard
- Verify environment variables are set correctly