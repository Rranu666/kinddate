// KindDate — Match Score Calculator
// MatchScore = 0.30P + 0.20I + 0.15C + 0.15V + 0.10B + 0.10A
// P=Personality, I=Intent, C=Communication, V=Values, B=Behavioral, A=Attraction
// Set ANTHROPIC_API_KEY in Netlify environment variables

const SCORE_WEIGHTS = { P: 0.30, I: 0.20, C: 0.15, V: 0.15, B: 0.10, A: 0.10 };

// Attachment style compatibility matrix (0–1)
const ATTACHMENT_COMPAT = {
  'Secure':              { 'Secure': 1.0, 'Anxious-Preoccupied': 0.80, 'Dismissive-Avoidant': 0.75, 'Fearful-Avoidant': 0.70 },
  'Anxious-Preoccupied': { 'Secure': 0.80, 'Anxious-Preoccupied': 0.55, 'Dismissive-Avoidant': 0.35, 'Fearful-Avoidant': 0.40 },
  'Dismissive-Avoidant': { 'Secure': 0.75, 'Anxious-Preoccupied': 0.35, 'Dismissive-Avoidant': 0.60, 'Fearful-Avoidant': 0.50 },
  'Fearful-Avoidant':    { 'Secure': 0.70, 'Anxious-Preoccupied': 0.40, 'Dismissive-Avoidant': 0.50, 'Fearful-Avoidant': 0.45 },
};

// Intent alignment (exact match = 1.0, adjacent = 0.5, opposite = 0.1)
const INTENT_COMPAT = {
  'serious': { 'serious': 1.0, 'open': 0.65, 'casual': 0.15, 'friends': 0.10 },
  'casual':  { 'serious': 0.15, 'open': 0.70, 'casual': 1.0, 'friends': 0.40 },
  'open':    { 'serious': 0.65, 'open': 1.0, 'casual': 0.70, 'friends': 0.55 },
  'friends': { 'serious': 0.10, 'open': 0.55, 'casual': 0.40, 'friends': 1.0 },
};

function arrayOverlap(a = [], b = []) {
  if (!a.length || !b.length) return 0;
  const setA = new Set(a.map(x => x.toLowerCase()));
  const overlap = b.filter(x => setA.has(x.toLowerCase())).length;
  return overlap / Math.max(a.length, b.length);
}

function normalizedAgeDiff(age1, age2, pref1, pref2) {
  // Returns 0–1: how well each is in the other's age preference
  const inPref1 = age2 >= (pref1?.min || 18) && age2 <= (pref1?.max || 99);
  const inPref2 = age1 >= (pref2?.min || 18) && age1 <= (pref2?.max || 99);
  if (inPref1 && inPref2) return 1.0;
  if (inPref1 || inPref2) return 0.60;
  return 0.20;
}

function distanceScore(distMiles) {
  if (distMiles <= 5) return 1.0;
  if (distMiles <= 15) return 0.85;
  if (distMiles <= 30) return 0.65;
  if (distMiles <= 50) return 0.45;
  return 0.25;
}

// Normalize attachment style to Title-Case with hyphen (e.g. "secure" → "Secure", "anxious_preoccupied" → "Anxious-Preoccupied")
function normalizeAttachmentStyle(s) {
  if (!s) return null;
  return s
    .replace(/_/g, '-')
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join('-');
}

function computeMatchScore(u1, u2) {
  // P — Personality (attachment style + personality tags + communication style)
  const style1 = normalizeAttachmentStyle(u1.attachment_style);
  const style2 = normalizeAttachmentStyle(u2.attachment_style);
  const attachScore = (ATTACHMENT_COMPAT[style1]?.[style2]) ?? 0.55;
  const tagOverlap = arrayOverlap(u1.interests, u2.interests);
  const lifestyleOverlap = arrayOverlap(u1.lifestyle_tags, u2.lifestyle_tags);
  const P = (attachScore * 0.5) + (tagOverlap * 0.3) + (lifestyleOverlap * 0.2);

  // I — Intent alignment
  const I = (INTENT_COMPAT[u1.intent]?.[u2.intent]) ?? 0.50;

  // C — Communication style compatibility
  const commStyles = u1.communication_style && u2.communication_style;
  const COMM_COMPAT = {
    'direct':     { 'direct': 1.0, 'thoughtful': 0.75, 'playful': 0.70, 'reserved': 0.55 },
    'thoughtful': { 'direct': 0.75, 'thoughtful': 1.0, 'playful': 0.65, 'reserved': 0.80 },
    'playful':    { 'direct': 0.70, 'thoughtful': 0.65, 'playful': 1.0, 'reserved': 0.50 },
    'reserved':   { 'direct': 0.55, 'thoughtful': 0.80, 'playful': 0.50, 'reserved': 0.85 },
  };
  const C = commStyles ? (COMM_COMPAT[u1.communication_style]?.[u2.communication_style] ?? 0.65) : 0.65;

  // V — Values (interests overlap + lifestyle overlap weighted differently)
  const V = (tagOverlap * 0.6) + (lifestyleOverlap * 0.4);

  // B — Behavioral (activity level, last active, response rate)
  const activityLevels = { 'high': 3, 'medium': 2, 'low': 1 };
  const a1 = activityLevels[u1.activity_level] ?? 2;
  const a2 = activityLevels[u2.activity_level] ?? 2;
  const B = 1 - (Math.abs(a1 - a2) / 4);

  // A — Attraction (age pref, distance, gender pref)
  const ageSc = normalizedAgeDiff(u1.age, u2.age, u1.age_pref, u2.age_pref);
  const distSc = u1.distance_miles ? distanceScore(u1.distance_miles) : 0.70;
  const A = (ageSc * 0.6) + (distSc * 0.4);

  // Final weighted score
  const raw = (P * SCORE_WEIGHTS.P) + (I * SCORE_WEIGHTS.I) + (C * SCORE_WEIGHTS.C) +
              (V * SCORE_WEIGHTS.V) + (B * SCORE_WEIGHTS.B) + (A * SCORE_WEIGHTS.A);

  const score = Math.round(Math.min(Math.max(raw, 0), 1) * 100);

  return {
    score,
    breakdown: {
      personality: Math.round(P * 100),
      intent:      Math.round(I * 100),
      communication: Math.round(C * 100),
      values:      Math.round(V * 100),
      behavioral:  Math.round(B * 100),
      attraction:  Math.round(A * 100),
    },
    weights: SCORE_WEIGHTS,
  };
}

async function generateWhyMatch(u1, u2, breakdown, apiKey) {
  const prompt = `You are Aria, KindDate's AI concierge. Generate a concise, warm, psychologically insightful "why this match works" explanation (2-3 sentences, max 60 words) for these two people.

Person 1: ${u1.display_name || 'User'}, ${u1.age}, attachment style: ${u1.attachment_style || 'unknown'}, intent: ${u1.intent}, interests: ${(u1.interests || []).join(', ')}, communication: ${u1.communication_style || 'unknown'}
Person 2: ${u2.display_name || 'Match'}, ${u2.age}, attachment style: ${u2.attachment_style || 'unknown'}, intent: ${u2.intent}, interests: ${(u2.interests || []).join(', ')}, communication: ${u2.communication_style || 'unknown'}

Match scores — Personality: ${breakdown.personality}%, Intent: ${breakdown.intent}%, Values: ${breakdown.values}%

Write ONLY the explanation. No preamble. First-person address to Person 1 ("Your..."). Be specific, not generic.`;

  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-opus-4-6',
      max_tokens: 200,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!resp.ok) return null;
  const data = await resp.json();
  return data.content?.[0]?.text?.trim() || null;
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

  let body;
  try { body = JSON.parse(event.body); }
  catch { return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON' }) }; }

  const { user1, user2 } = body;
  if (!user1 || !user2) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'user1 and user2 profiles required' }) };
  }

  const result = computeMatchScore(user1, user2);

  // Optionally generate AI explanation (requires ANTHROPIC_API_KEY)
  const apiKey = process.env.ANTHROPIC_API_KEY;
  let whyMatch = null;
  if (apiKey) {
    try { whyMatch = await generateWhyMatch(user1, user2, result.breakdown, apiKey); }
    catch (e) { console.error('AI explanation error:', e.message); }
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ ...result, whyMatch }),
  };
};
