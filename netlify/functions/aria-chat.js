// Aria AI — KindDate Relationship Concierge
// Netlify Function → calls Anthropic Claude API
// Set ANTHROPIC_API_KEY in Netlify environment variables

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { statusCode: 500, headers, body: JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured' }) };

  let body;
  try { body = JSON.parse(event.body); }
  catch { return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON body' }) }; }

  const { messages, mode = 'DISCOVERY' } = body;
  if (!messages || !Array.isArray(messages)) return { statusCode: 400, headers, body: JSON.stringify({ error: 'messages array required' }) };

  // Normalize content to a plain string — strips cache_control and flattens content block arrays.
  // Anthropic rejects any empty text block that has cache_control set, and this can arrive from
  // old localStorage sessions or automatic SDK transforms.
  function normalizeContent(content) {
    if (typeof content === 'string') return content.trim();
    if (Array.isArray(content)) {
      return content
        .filter(b => b && b.type === 'text' && typeof b.text === 'string' && b.text.trim() !== '')
        .map(b => b.text.trim())
        .join('\n\n');
    }
    if (content && typeof content === 'object' && typeof content.text === 'string') {
      return content.text.trim();
    }
    return '';
  }

  // FIX: normalize + remove empty content (prevents cache_control-on-empty-block 400 errors)
  const sanitized = messages
    .filter(m => m && typeof m.role === 'string')
    .map(m => ({ role: m.role, content: normalizeContent(m.content) }))
    .filter(m => m.content !== '');

  if (sanitized.length === 0) return { statusCode: 400, headers, body: JSON.stringify({ error: 'No valid messages' }) };

  // FIX: merge consecutive same-role messages (Anthropic requires strict alternation)
  const merged = [];
  for (const msg of sanitized) {
    const last = merged[merged.length - 1];
    if (last && last.role === msg.role) { last.content += '\n\n' + msg.content; }
    else { merged.push({ role: msg.role, content: msg.content }); }
  }

  // FIX: last message must be from user
  while (merged.length > 0 && merged[merged.length - 1].role === 'assistant') merged.pop();
  if (merged.length === 0) return { statusCode: 400, headers, body: JSON.stringify({ error: 'No user messages found' }) };

  const SYSTEM = `You are Aria, an emotionally intelligent relationship concierge for KindDate — a guided dating platform built for intentional singles who are tired of the swipe culture. You are trained in attachment theory, the Gottman Method, Nonviolent Communication, IFS, and behavioral science. Current mode: ${mode}. Ask one question at a time. Reflect before advising. Be warm, real, and deeply present.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        system: SYSTEM,
        messages: merged.slice(-20),
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return { statusCode: response.status, headers, body: JSON.stringify({ error: err }) };
    }

    const data = await response.json();
    const rawText = data.content?.[0]?.text || '';

    const insights = [];
    const insightRegex = /<ARIA_INSIGHT>(.*?)<\/ARIA_INSIGHT>/g;
    let match;
    while ((match = insightRegex.exec(rawText)) !== null) {
      try { insights.push(JSON.parse(match[1])); } catch {}
    }

    const cleanText = rawText.replace(/<ARIA_INSIGHT>.*?<\/ARIA_INSIGHT>/gs, '').trim();
    return { statusCode: 200, headers, body: JSON.stringify({ reply: cleanText, insights }) };

  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
