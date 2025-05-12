// Application Configuration

const config = {
  // Twilio Configuration
  twilio: {
    // Replace these with your actual Twilio credentials
    accountSid: process.env.TWILIO_ACCOUNT_SID || 'your_account_sid_here',
    authToken: process.env.TWILIO_AUTH_TOKEN || 'your_auth_token_here',
    phoneNumber: process.env.TWILIO_PHONE_NUMBER || 'your_twilio_phone_number_here',
  },
  
  // You can add other configuration sections here as needed
}

export default config; 