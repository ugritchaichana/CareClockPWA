#!/usr/bin/env node

// Script to test environment variables
console.log('🔧 Environment Variables Test:');
console.log('');

const vars = [
  'DATABASE_URL',
  'DIRECT_URL', 
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'NEXT_PUBLIC_APP_NAME',
  'NEXT_PUBLIC_APP_VERSION'
];

vars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    // Mask sensitive data
    const displayValue = varName.includes('KEY') || varName.includes('URL') || varName.includes('DATABASE') 
      ? value.substring(0, 20) + '...' 
      : value;
    console.log(`✅ ${varName}: ${displayValue}`);
  } else {
    console.log(`❌ ${varName}: NOT SET`);
  }
});

console.log('');
console.log('🎯 Test completed!');
