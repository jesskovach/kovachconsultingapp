import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { clientId } = await req.json();

    if (!clientId) {
      return Response.json({ error: 'Client ID is required' }, { status: 400 });
    }

    // Get client details
    const clients = await base44.entities.Client.filter({ id: clientId });
    const client = clients[0];

    if (!client) {
      return Response.json({ error: 'Client not found' }, { status: 404 });
    }

    // Get all sessions with notes
    const sessions = await base44.entities.Session.filter({ 
      client_id: clientId 
    }, '-date');

    // Get client goals
    const goals = await base44.entities.Goal.filter({ client_id: clientId });

    // Compile all notes and relevant data
    const sessionNotes = sessions
      .filter(s => s.notes || s.outcomes)
      .map(s => ({
        date: new Date(s.date).toLocaleDateString(),
        type: s.type,
        notes: s.notes,
        outcomes: s.outcomes,
        status: s.status
      }));

    const context = `
Client: ${client.name}
Company: ${client.company || 'N/A'}
Role: ${client.role || 'N/A'}
Coaching Focus: ${client.coaching_focus || 'N/A'}
General Notes: ${client.notes || 'None'}

Active Goals:
${goals.map(g => `- ${g.title} (${g.status}, ${g.progress}% complete)`).join('\n') || 'No goals set'}

Session History (${sessionNotes.length} sessions):
${sessionNotes.map(s => `
Date: ${s.date} | Type: ${s.type}
Notes: ${s.notes || 'N/A'}
Outcomes: ${s.outcomes || 'N/A'}
`).join('\n---\n')}
    `.trim();

    // Use LLM to generate summary
    const summary = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an executive coach reviewing client notes. Analyze the following client information and session notes, then provide a comprehensive summary.

${context}

Generate a well-structured summary that includes:

1. **Client Overview**: Brief background and coaching focus
2. **Key Discussion Points**: Main themes and topics covered across sessions
3. **Progress & Achievements**: Notable developments and wins
4. **Ongoing Challenges**: Areas still requiring attention
5. **Action Items**: Current and upcoming priorities
6. **Recommendations**: Suggested focus areas for future sessions

Keep it professional, concise, and actionable. Use bullet points where appropriate.`,
      response_json_schema: {
        type: "object",
        properties: {
          overview: { type: "string" },
          key_points: { type: "array", items: { type: "string" } },
          progress: { type: "array", items: { type: "string" } },
          challenges: { type: "array", items: { type: "string" } },
          action_items: { type: "array", items: { type: "string" } },
          recommendations: { type: "array", items: { type: "string" } }
        }
      }
    });

    return Response.json({
      success: true,
      summary
    });

  } catch (error) {
    return Response.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
});