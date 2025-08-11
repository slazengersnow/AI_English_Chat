#!/bin/bash

# Test Supabase direct API call with environment variable
URL="https://xcjplyhqxgrbdhixmzse.supabase.co/auth/v1/signup"
KEY="$VITE_SUPABASE_ANON_KEY"
EMAIL="debug+$(date +%s)@bizmowa.com"
PW="StrongPass!234"

echo "Testing Supabase direct signup..."
echo "URL: $URL"
echo "Email: $EMAIL"

curl -i -X POST "$URL" \
  -H "apikey: $KEY" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PW\"}"

echo ""
echo "If you see 201/200 response, then Supabase is working correctly."
echo "If you see 422 'signup_disabled', check Supabase dashboard settings."