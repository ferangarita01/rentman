const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://uoekolfgbbmvhzsfkjef.supabase.co';
const supabaseAnon = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvZWtvbGZnYmJtdmh6c2ZramVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzMjQzNzUsImV4cCI6MjA4NTkwMDM3NX0.DYxAxi4TTBLgdVruu8uGM3Jog7JZaplWqikAvI0EXvk';

// Use the EXACT token from the app
const userToken = 'eyJhbGciOiJFUzI1NiIsImtpZCI6ImYwNjY1NzA5LTI2Y2UtNDg3YS1iNzZlLTViNGM0MzIxMDFiNSIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL3VvZWtvbGZnYmJtdmh6c2ZramVmLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiI1YjNiM2Y3ZS01NTI5LTRmNmYtYjEzMi0yYTM0ZGM5MzUxNjAiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzcwNjk2NjUyLCJpYXQiOjE3NzA2OTMwNTIsImVtYWlsIjoiZmVyYW5nYXJpdGEwMUBnbWFpbC5jb20iLCJwaG9uZSI6IiIsImFwcF9tZXRhZGF0YSI6eyJwcm92aWRlciI6ImVtYWlsIiwicHJvdmlkZXJzIjpbImVtYWlsIl19LCJ1c2VyX21ldGFkYXRhIjp7ImVtYWlsIjoiZmVyYW5nYXJpdGEwMUBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwicGhvbmVfdmVyaWZpZWQiOmZhbHNlLCJzdWIiOiI1YjNiM2Y3ZS01NTI5LTRmNmYtYjEzMi0yYTM0ZGM5MzUxNjAifSwicm9sZSI6ImF1dGhlbnRpY2F0ZWQiLCJhYWwiOiJhYWwxIiwiYW1yIjpbeyJtZXRob2QiOiJwYXNzd29yZCIsInRpbWVzdGFtcCI6MTc3MDY5MzA1Mn1dLCJzZXNzaW9uX2lkIjoiNzE2MDBmZjQtODdkYS00M2IxLTgyOGQtZDcyZDg2NzY4ZDU0IiwiaXNfYW5vbnltb3VzIjpmYWxzZX0.3xhuW7Jl0-mW0nrupNaERdBcTXT5QuFfPWdM-0jKXmx_QZlcIBnwfC-XdnB53QvkbTUfAN5nlWYjZ4qi63aFxQ';

async function testWithUserToken() {
  const userId = '5b3b3f7e-5529-4f6f-b132-2a34dc935160';
  
  console.log('🧪 Testing Profile Access with User Token\n');
  console.log('━'.repeat(80));

  // Create client with user's token
  const client = createClient(supabaseUrl, supabaseAnon, {
    global: {
      headers: {
        Authorization: `Bearer ${userToken}`
      }
    }
  });

  // Try to fetch profile
  console.log('\n📋 Fetching profile for:', userId);
  const { data, error } = await client
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.log('\n❌ ERROR:');
    console.log('   Message:', error.message);
    console.log('   Code:', error.code);
    console.log('   Details:', error.details);
    console.log('   Hint:', error.hint);
  } else {
    console.log('\n✅ SUCCESS! Profile retrieved:');
    console.log('   Email:', data.email);
    console.log('   Credits:', data.credits);
    console.log('   Status:', data.status);
  }

  console.log('\n' + '━'.repeat(80));
}

testWithUserToken().catch(console.error);
