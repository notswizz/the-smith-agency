import OpenAI from 'openai';
import { openAIConfig } from './config';
import functionSchemas from './functions/schemas';

// Initialize OpenAI client
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Generate chat completion with optional function calling
export async function createChatCompletion(messages, options = {}) {
  try {
    const response = await openai.chat.completions.create({
      model: options.model || openAIConfig.model,
      messages,
      functions: options.functions || functionSchemas,
      temperature: options.temperature || openAIConfig.temperature,
    });

    return response;
  } catch (error) {
    console.error('Error calling OpenAI:', error);
    throw error;
  }
} 