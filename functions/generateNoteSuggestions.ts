import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { clientId, sessionType, currentNote } = await req.json();

    if (!clientId) {
      return Response.json({ error: 'Client ID is required' }, { status: 400 });
    }

    // Get client details
    const clients = await base44.entities.Client.filter({ id: clientId });
    const client = clients[0];

    if (!client) {
      return Response.json({ error: 'Client not found' }, { status: 404 });
    }

    // Get recent sessions
    const sessions = await base44.entities.Session.filter({ 
      client_id: clientId 
    }, '-date', 5);

    // Get goals
    const goals = await base44.entities.Goal.filter({ client_id: clientId });

    const context = `
Client: ${client.name}
Role: ${client.role || 'N/A'}
Coaching Focus: ${client.coaching_focus || 'N/A'}

Active Goals:
${goals.map(g => `- ${g.title} (${g.status})`).join('\n') || 'No goals set'}

Recent Session Notes:
${sessions.map((s, i) => `Session ${i + 1} (${s.type}): ${s.notes || 'No notes'}`).join('\n') || 'No previous notes'}

Current Session Type: ${sessionType || 'regular'}
Current Note Draft: ${currentNote || '(empty)'}
    `.trim();

    // Generate suggestions
    const suggestions = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an AI assistant helping an executive coach write session notes. Based on the client's history and current session, suggest relevant points to include in the notes.

${context}

Generate 4-6 specific, actionable suggestions for what to include in the session notes. Each suggestion should be:
- Relevant to the client's coaching focus and goals
- Appropriate for the session type
- Build on previous discussions when applicable
- Include specific questions or areas to document

Return suggestions as an array of strings.`,
      response_json_schema: {
        type: "object",
        properties: {
          suggestions: { 
            type: "array", 
            items: { type: "string" }
          }
        }
      }
    });

    return Response.json({
      success: true,
      suggestions: suggestions.suggestions
    });

  } catch (error) {
    return Response.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
});