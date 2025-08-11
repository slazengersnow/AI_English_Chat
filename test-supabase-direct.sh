#!/bin/bash

# Test Supabase direct API call
echo "Testing Supabase direct signup..."

curl -i \
  -X POST "https://xcjplyhqxgrbdhixmzse.supabase.co/auth/v1/signup" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjanBseWhxeGdyYmRoaXhtenNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3NDEyMjksImV4cCI6MjA2NjMxNzIyOX0.IgMRAXM_fC9D5PnQR6iSP0ZC5rQNJxcpGrrNMWRCJqE" \
  -H "Content-Type: application/json" \
  -d '{"email": "slazengersnow@gmail.com", "password": "s05936623"}'

echo ""
echo "If you see 201/200 response, then Supabase is working correctly."
echo "Check Supabase dashboard to see if user was created."