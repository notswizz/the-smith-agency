import { getOpenAIClient } from '@/lib/chat/openaiClient';
import { functionDefinitions } from '@/lib/chat/functions';
import { executeChatFunction } from '@/lib/chat/executor';
import { systemPrompt } from '@/lib/chat/systemPrompt';
import { sanitizeForDisplay } from '@/lib/chat/sanitize';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: 'OpenAI API key is not configured on the server.' });
    }

    const openai = getOpenAIClient();
    const { messages } = req.body;

    const systemMessage = { role: 'system', content: systemPrompt };

    const completion = await openai.chat.completions.create({
      model: 'gpt-5-nano',
      messages: [systemMessage, ...messages],
      functions: functionDefinitions,
      function_call: 'auto',
    });

    const message = completion.choices[0].message;

    if (message.function_call) {
      const functionName = message.function_call.name;
      const functionArgs = JSON.parse(message.function_call.arguments);

      try {
        const functionResult = await executeChatFunction(functionName, functionArgs);
        if (functionResult && functionResult.__action) {
          return res.status(200).json({
            message: functionResult.message,
            actions: [functionResult.__action],
            preview: functionResult.preview ? sanitizeForDisplay(functionResult.preview) : null,
          });
        }

        // Allow the model to request additional function calls by feeding results back
        const followUpCompletion = await openai.chat.completions.create({
          model: 'gpt-4.1',
          messages: [
            systemMessage,
            ...messages,
            message,
            { role: 'function', name: functionName, content: JSON.stringify(functionResult) },
          ],
          functions: functionDefinitions,
          function_call: 'auto',
        });

        const followMsg = followUpCompletion.choices[0].message;
        // If the model asks for another function, run it once more (simple multi-step)
        if (followMsg.function_call) {
          const fn2 = followMsg.function_call.name;
          const args2 = JSON.parse(followMsg.function_call.arguments);
          const result2 = await executeChatFunction(fn2, args2);
          const finalCompletion = await openai.chat.completions.create({
            model: 'gpt-4.1',
            messages: [
              systemMessage,
              ...messages,
              message,
              { role: 'function', name: functionName, content: JSON.stringify(functionResult) },
              followMsg,
              { role: 'function', name: fn2, content: JSON.stringify(result2) },
            ],
          });
          return res.status(200).json({ message: stripPlan(finalCompletion.choices[0].message.content) });
        }

        return res.status(200).json({ message: stripPlan(followMsg.content) });
      } catch (error) {
        console.error('Function execution error:', error);
        return res.status(200).json({ message: `I encountered an error while ${functionName.replace('_', ' ')}: ${error.message}. Please try again.` });
      }
    }

    return res.status(200).json({ message: stripPlan(message.content) });
  } catch (error) {
    console.error('OpenAI API error:', error);
    return res.status(500).json({ error: 'Failed to process your request. Please try again.' });
  }
}

function stripPlan(text) {
  if (!text || typeof text !== 'string') return text;
  // Remove a leading "Plan:" section if present (up to the first blank line)
  const planHeader = /^\s*Plan:\s*[\s\S]*?\n\s*\n/;
  return text.replace(planHeader, '').trimStart();
}


