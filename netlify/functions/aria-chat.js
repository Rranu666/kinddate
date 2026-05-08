// Aria AI — KindDate Relationship Concierge
// Netlify Function → calls Anthropic Claude API

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
  catch { return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON' }) }; }

  const { messages, mode = 'DISCOVERY' } = body;
  if (!messages || !Array.isArray(messages)) return { statusCode: 400, headers, body: JSON.stringify({ error: 'messages array required' }) };

  // Normalize content — handles strings, arrays, objects, strips cache_control
  function normalizeContent(content) {
    if (typeof content === 'string') return content.trim();
    if (Array.isArray(content)) {
      return content
        .filter(b => b && b.type === 'text' && typeof b.text === 'string' && b.text.trim() !== '')
        .map(b => b.text.trim())
        .join('\n\n');
    }
    if (content && typeof content === 'object' && content.text) return String(content.text).trim();
    return '';
  }

  // Sanitize: normalize content, remove empty, ensure strings only
  const sanitized = messages
    .map(m => ({ role: m.role, content: normalizeContent(m.content) }))
    .filter(m => m.content !== '' && (m.role === 'user' || m.role === 'assistant'));

  if (sanitized.length === 0) return { statusCode: 400, headers, body: JSON.stringify({ error: 'No valid messages' }) };

  // Merge consecutive same-role messages
  const merged = [];
  for (const msg of sanitized) {
    const last = merged[merged.length - 1];
    if (last && last.role === msg.role) { last.content += '\n\n' + msg.content; }
    else { merged.push({ role: msg.role, content: msg.content }); }
  }

  // Last message must be from user
  while (merged.length > 0 && merged[merged.length - 1].role === 'assistant') merged.pop();
  if (merged.length === 0) return { statusCode: 400, headers, body: JSON.stringify({ error: 'No user messages' }) };

  const SYSTEM = `You are Aria, an emotionally intelligent relationship concierge for KindDate. You are trained in attachment theory, the Gottman Method, Nonviolent Communication, IFS, and behavioral science. Ask ONE question at a time. Reflect before advising. Be warm and deeply present. Current mode: ${mode}.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 1024, system: SYSTEM, messages: merged.slice(-20) }),
    });

    if (!response.ok) {
      const err = await response.text();
      return { statusCode: response.status, headers, body: JSON.stringify({ error: err }) };
    }

    const data = await response.json();
    const rawText = data.content?.[0]?.text || '';
    const insights = [];
    const re = /<ARIA_INSIGHT>(.*?)<\/ARIA_INSIGHT>/g;
    let m;
    while ((m = re.exec(rawText)) !== null) { try { insights.push(JSON.parse(m[1])); } catch {} }
    const cleanText = rawText.replace(/<ARIA_INSIGHT>.*?<\/ARIA_INSIGHT>/gs, '').trim();
    return { statusCode: 200, headers, body: JSON.stringify({ reply: cleanText, insights }) };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
