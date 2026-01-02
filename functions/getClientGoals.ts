import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { clientId } = await req.json();

    if (!clientId) {
      return Response.json({ error: 'Client ID is required' }, { status: 400 });
    }

    // Check if user is a coach/admin or the client themselves
    if (user.role !== 'admin') {
      // If not admin, verify they're accessing their own client record
      const clients = await base44.entities.Client.filter({ 
        id: clientId, 
        email: user.email 
      });
      
      if (clients.length === 0) {
        return Response.json({ 
          error: 'Access denied. You can only view your own goals.' 
        }, { status: 403 });
      }
    }

    // Fetch goals for the client
    const goals = await base44.asServiceRole.entities.Goal.filter({ 
      client_id: clientId 
    }, '-created_date');

    return Response.json({
      success: true,
      goals
    });

  } catch (error) {
    return Response.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
});