import OpenAI from 'openai';

export function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key is not configured on the server.');
  }
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}


