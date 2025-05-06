import { createChatCompletion } from '@/lib/chatbot/openai';
import { systemMessage } from '@/lib/chatbot/config';
import functionSchemas from '@/lib/chatbot/functions/schemas';
import { executeFunctionCall } from '@/lib/chatbot/functions/executor';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages are required and must be an array' });
    }

    // Add system message at the beginning
    const messagesWithSystem = [systemMessage, ...messages];

    // Call OpenAI API
    const response = await createChatCompletion(messagesWithSystem);
    const responseMessage = response.choices[0].message;

    // Check if the model wanted to call a function
    if (responseMessage.function_call) {
      // Extract the function call information
      const functionCall = {
        name: responseMessage.function_call.name,
        arguments: JSON.parse(responseMessage.function_call.arguments),
      };

      // Execute the function call to get the data
      const functionResponse = await executeFunctionCall(functionCall.name, functionCall.arguments);
      
      // Get data from the function response
      const data = functionResponse.data;

      // Return both the message, data, and the function call
      return res.status(200).json({
        message: {
          role: 'assistant',
          content: functionResponse.message || responseMessage.content || "I'll help you with that right away.",
        },
        data: data,
        functionCall,
      });
    }

    // If no function call, just return the message
    return res.status(200).json({
      message: {
        role: 'assistant',
        content: responseMessage.content,
      },
    });
  } catch (error) {
    console.error('Error in chat API:', error);
    return res.status(500).json({
      error: 'Error processing your request',
      message: {
        role: 'assistant',
        content: 'I encountered an error while processing your request. Please try again.',
      },
      details: error.message,
    });
  }
} 