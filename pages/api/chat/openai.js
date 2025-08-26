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

    // Iterative function-calling loop with action aggregation
    let convo = [systemMessage, ...messages];
    let actions = [];
    let previews = [];
    let lastAssistantMessage = null;
    let loops = 0;

    while (loops < 5) {
      const completion = await openai.chat.completions.create({
        model: loops === 0 ? 'gpt-5-mini' : 'gpt-4.1-mini',
        messages: convo,
        functions: functionDefinitions,
        function_call: 'auto',
      });

      const msg = completion.choices[0].message;
      lastAssistantMessage = msg;

      if (!msg.function_call) {
        break;
      }

      const fnName = msg.function_call.name;
      const fnArgs = JSON.parse(msg.function_call.arguments || '{}');

      try {
        const fnResult = await executeChatFunction(fnName, fnArgs);
        if (fnResult && fnResult.__action) {
          actions.push(fnResult.__action);
          if (fnResult.preview) previews.push(sanitizeForDisplay(fnResult.preview));
        }
        if (fnResult && fnResult.__ui) {
          // Prefer last UI result for rendering
          previews.push({ __ui: fnResult.__ui });
        }
        // Feed function result back to the model
        convo = [
          ...convo,
          msg,
          { role: 'function', name: fnName, content: JSON.stringify(fnResult) },
        ];
      } catch (error) {
        console.error('Function execution error:', error);
        return res.status(200).json({ message: `I encountered an error while ${fnName.replace('_', ' ')}: ${error.message}. Please try again.` });
      }

      loops += 1;
    }

    const finalText = lastAssistantMessage && lastAssistantMessage.content ? stripPlan(lastAssistantMessage.content) : '';
    // Prefer the most recent UI preview if present; otherwise the first preview
    let preview = null;
    if (previews.length) {
      for (let i = previews.length - 1; i >= 0; i--) {
        if (previews[i] && previews[i].__ui) { preview = previews[i]; break; }
      }
      if (!preview) preview = previews[0];
    }
    // Deduplicate actions that target the same record update
    let dedupedActions = actions;
    if (Array.isArray(actions) && actions.length > 1) {
      const seen = new Set();
      const out = [];
      for (let i = 0; i < actions.length; i++) {
        const a = actions[i] || {};
        const data = a.data || {};
        // Build a stable key: type + collection/id or full data
        const key = `${a.type || ''}:${data.collection || ''}:${data.id || ''}:${data.action || ''}:${JSON.stringify(data.updates || {})}`;
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(a);
      }
      dedupedActions = out;
    }
    if (dedupedActions.length > 0) {
      return res.status(200).json({ message: finalText, actions: dedupedActions, preview });
    }
    return res.status(200).json({ message: finalText, preview });
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


