// Aria AI — KindDate Relationship Concierge
// Netlify Function → calls Anthropic Claude API
// Set ANTHROPIC_API_KEY in Netlify environment variables

// Recursively remove every cache_control key from any object/array structure.
// Anthropic rejects requests where a cache_control is set on an empty text block;
// this strips the property entirely at every nesting level so it can never reach the API.
function deepStrip(val) {
  if (Array.isArray(val)) return val.map(deepStrip);
  if (val !== null && typeof val === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(val)) {
      if (k !== 'cache_control') out[k] = deepStrip(v);
    }
    return out;
  }
  return val;
}

// Flatten any content format (string | ContentBlock[] | single block) to a plain trimmed string.
function flattenContent(content) {
  if (typeof content === 'string') return content.trim();
  if (Array.isArray(content)) {
    return content
      .filter(b => b && b.type === 'text' && b.text && String(b.text).trim())
      .map(b => String(b.text).trim())
      .join('\n\n');
  }
  if (content && typeof content === 'object') {
    if (typeof content.text === 'string') return content.text.trim();
  }
  return '';
}

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

  // 1. Deep-strip cache_control from every incoming message (handles all possible shapes)
  // 2. Flatten content to a plain non-empty string
  // 3. Drop anything that ends up empty after flattening
  const sanitized = deepStrip(messages)
    .filter(m => m && typeof m.role === 'string')
    .map(m => ({ role: m.role, content: flattenContent(m.content) }))
    .filter(m => m.content !== '');

  if (sanitized.length === 0) return { statusCode: 400, headers, body: JSON.stringify({ error: 'No valid messages' }) };

  // Merge consecutive same-role messages (Anthropic requires strict user/assistant alternation)
  const merged = [];
  for (const msg of sanitized) {
    const last = merged[merged.length - 1];
    if (last && last.role === msg.role) {
      last.content += '\n\n' + msg.content;
    } else {
      merged.push({ role: msg.role, content: msg.content });
    }
  }

  // Last message must be from user
  while (merged.length > 0 && merged[merged.length - 1].role === 'assistant') merged.pop();
  if (merged.length === 0) return { statusCode: 400, headers, body: JSON.stringify({ error: 'No user messages found' }) };

  const SYSTEM = `You are Aria, an emotionally intelligent relationship concierge for KindDate — a guided dating platform built for intentional singles who are tired of the swipe culture. You are trained in attachment theory, the Gottman Method, Nonviolent Communication, IFS, and behavioral science. Current mode: ${mode}. Ask one question at a time. Reflect before advising. Be warm, real, and deeply present.

When you identify a key insight about the user, include a JSON tag in your response:
<ARIA_INSIGHT>{"type":"attachment_style","value":"Anxious-Preoccupied","confidence":0.7}</ARIA_INSIGHT>
Valid types: attachment_style, love_language, readiness_score, core_fear, growth_edge, relationship_pattern`;

  // Final messages to send — plain string content only, no cache_control anywhere
  const finalMessages = merged.slice(-20).map(m => ({
    role: m.role,
    content: m.content, // guaranteed plain string by this point
  }));

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
        messages: finalMessages,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Anthropic API error:', response.status, errText);
      return { statusCode: response.status, headers, body: JSON.stringify({ error: errText }) };
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
    console.error('Aria function error:', err.message);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
