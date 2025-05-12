// Test script for Twilio SMS functionality
require('dotenv').config(); // Load environment variables from .env file
const twilio = require('twilio');

// Get Twilio credentials from environment variables
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

// Validate credentials
if (!accountSid || accountSid === 'your_account_sid_here') {
  console.error('❌ TWILIO_ACCOUNT_SID is missing or invalid');
  process.exit(1);
}

if (!authToken || authToken === 'your_auth_token_here') {
  console.error('❌ TWILIO_AUTH_TOKEN is missing or invalid');
  process.exit(1);
}

if (!twilioPhoneNumber || twilioPhoneNumber === 'your_twilio_phone_number_here') {
  console.error('❌ TWILIO_PHONE_NUMBER is missing or invalid');
  process.exit(1);
}

console.log('✅ Twilio credentials found in environment variables');

// Test phone number to send SMS to - replace with your own
const testPhoneNumber = process.argv[2];

if (!testPhoneNumber) {
  console.error('❌ Please provide a test phone number as an argument');
  console.log('Usage: node scripts/test-sms.js +1234567890');
  process.exit(1);
}

// Initialize Twilio client
try {
  console.log('🔄 Initializing Twilio client...');
  const client = twilio(accountSid, authToken);
  
  // Test sending an SMS
  console.log(`🔄 Sending test SMS to ${testPhoneNumber}...`);
  client.messages
    .create({
      body: 'This is a test message from The Smith Agency.',
      from: twilioPhoneNumber,
      to: testPhoneNumber
    })
    .then(message => {
      console.log('✅ Test SMS sent successfully!');
      console.log(`📱 Message SID: ${message.sid}`);
      console.log(`📄 Status: ${message.status}`);
    })
    .catch(error => {
      console.error('❌ Failed to send SMS:', error.message);
      if (error.code) {
        console.error(`   Error code: ${error.code}`);
      }
    });
} catch (error) {
  console.error('❌ Error initializing Twilio client:', error.message);
  process.exit(1);
} 