import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { getOpenRouterCompletion } from '$lib/server/aiService';

export const POST: RequestHandler = async ({ request }) => {
  const { message } = await request.json();

  try {
    const reply = await getOpenRouterCompletion(message);

    if (reply === null) {
      // getOpenRouterCompletion already logs errors internally
      return json({ reply: 'Failed to get a reply from AI service.' }, { status: 500 });
    }

    return json({ reply });
  } catch (err) {
    console.error('Error processing chat request:', err);
    return json({ reply: 'Server error occurred.' }, { status: 500 });
  }
};
