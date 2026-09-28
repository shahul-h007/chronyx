import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hnkohxlzlewynxbhrujd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhua29oeGx6bGV3eW54YmhydWpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxMjU2MjEsImV4cCI6MjA5MjcwMTYyMX0.hjA5KUV25YRJe6_yc6lXZ-CeSj-8PJr3PO1I0rvaayo';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testAuth() {
  const email = 'cronyxbrand@gmail.com';
  const password = 'password123'; // Try a dummy password to see what happens

  console.log(`Attempting to sign in with ${email}...`);
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error('Sign in failed:', error.message);
    
    if (error.message === 'Invalid login credentials') {
      console.log('Attempting to create the account instead...');
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (signUpError) {
        console.error('Sign up failed:', signUpError.message);
      } else {
        console.log('Account created successfully! Password is: password123');
        console.log('Check if email confirmation is required:', signUpData?.user?.identities?.length === 0 ? 'Yes, please confirm email.' : 'No, should be ready.');
      }
    }
  } else {
    console.log('Successfully signed in!');
  }
}

testAuth();
