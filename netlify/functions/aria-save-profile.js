// KindDate — Aria Profile Saver
// Persists psychological insights from Aria conversations to Supabase
// Required env vars: SUPABASE_URL, SUPABASE_SERVICE_KEY

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Supabase env vars not configured' }) };
  }

  let body;
  try { body = JSON.parse(event.body); }
  catch { return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON' }) }; }

  const { userId, insights, sessionMode } = body;

  if (!userId || !insights || !Array.isArray(insights)) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'userId and insights[] required' }) };
  }

  // Build ai_profile_data patch from insight array
  // Each insight: { type, value, confidence? }
  const profilePatch = {};
  const FIELD_MAP = {
    'attachment_style':    'attachment_style',
    'love_language':       'love_language',
    'readiness_score':     'readiness_score',
    'core_fear':           'core_fear',
    'growth_edge':         'growth_edge',
    'relationship_pattern':'relationship_pattern',
    'communication_style': 'communication_style',
    'emotional_availability': 'emotional_availability',
  };

  for (const insight of insights) {
    const field = FIELD_MAP[insight.type];
    if (field) {
      profilePatch[field] = {
        value: insight.value,
        confidence: insight.confidence ?? 1.0,
        updated_at: new Date().toISOString(),
        session_mode: sessionMode || 'DISCOVERY',
      };
    }
  }

  if (Object.keys(profilePatch).length === 0) {
    return { statusCode: 200, headers, body: JSON.stringify({ updated: 0, message: 'No recognized insight types' }) };
  }

  try {
    // Fetch current ai_profile_data to merge (not overwrite)
    const getResp = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}&select=ai_profile_data`, {
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
      },
    });

    let existing = {};
    if (getResp.ok) {
      const rows = await getResp.json();
      existing = rows[0]?.ai_profile_data || {};
    }

    const merged = { ...existing, ...profilePatch };

    // Also build top-level profile fields for commonly used values
    const topLevelFields = {};
    if (profilePatch.attachment_style) topLevelFields.attachment_style_aria = profilePatch.attachment_style.value;
    if (profilePatch.readiness_score) topLevelFields.aria_readiness_score = profilePatch.readiness_score.value;

    const patchResp = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}`, {
      method: 'PATCH',
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({
        ai_profile_data: merged,
        ...topLevelFields,
        updated_at: new Date().toISOString(),
      }),
    });

    if (!patchResp.ok) {
      const errText = await patchResp.text();
      return { statusCode: 502, headers, body: JSON.stringify({ error: 'Supabase update failed', detail: errText }) };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        updated: Object.keys(profilePatch).length,
        fields: Object.keys(profilePatch),
        message: 'Profile insights saved',
      }),
    };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
