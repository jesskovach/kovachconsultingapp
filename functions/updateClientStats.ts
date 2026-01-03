import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }

        const { clientId, sessionStatus, previousStatus } = await req.json();

        // Get current client data
        const clients = await base44.asServiceRole.entities.Client.filter({ id: clientId });
        if (clients.length === 0) {
            return Response.json({ error: 'Client not found' }, { status: 404 });
        }

        const client = clients[0];
        
        // Count completed sessions for this client
        const completedSessions = await base44.asServiceRole.entities.Session.filter({ 
            client_id: clientId, 
            status: 'completed' 
        });

        // Update client's total_sessions
        await base44.asServiceRole.entities.Client.update(clientId, {
            total_sessions: completedSessions.length
        });

        return Response.json({ 
            success: true, 
            total_sessions: completedSessions.length 
        });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});