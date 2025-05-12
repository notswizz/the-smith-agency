// SMS sending API endpoint using Twilio
import twilio from 'twilio';

// Initialize Twilio client with environment variables from .env
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get message details from request body
    const { to, message } = req.body;

    // Validate input
    if (!to || !message) {
      return res.status(400).json({ error: 'Phone number and message are required' });
    }

    // Basic phone number validation
    const phoneRegex = /^\+?[1-9]\d{9,14}$/;
    if (!phoneRegex.test(to.replace(/\s+/g, ''))) {
      return res.status(400).json({ 
        error: 'Invalid phone number format. Please use international format (e.g., +1XXXXXXXXXX)'
      });
    }

    // Check if Twilio credentials are configured
    if (!accountSid || !authToken || !twilioPhoneNumber) {
      console.error('Twilio credentials are not configured');
      return res.status(500).json({ 
        error: 'SMS service not properly configured. Please check your environment variables.'
      });
    }

    // Initialize Twilio client
    const client = twilio(accountSid, authToken);

    // Send the message
    const twilioResponse = await client.messages.create({
      body: message,
      from: twilioPhoneNumber,
      to: to.replace(/\s+/g, '') // Remove any whitespace
    });

    // Return success response with Twilio message ID
    return res.status(200).json({ 
      success: true, 
      messageId: twilioResponse.sid,
      message: 'SMS sent successfully'
    });
  } catch (error) {
    console.error('Error sending SMS:', error);
    
    // Handle Twilio specific errors
    if (error.code) {
      return res.status(400).json({ 
        error: `Twilio error: ${error.message || error.code}`,
        code: error.code
      });
    }
    
    // Generic error handler
    return res.status(500).json({ 
      error: 'Failed to send SMS. Please try again.'
    });
  }
} 