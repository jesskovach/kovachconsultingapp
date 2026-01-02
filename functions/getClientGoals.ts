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

    // Verify access permissions
    if (user.role !== 'admin') {
      // Non-admin users must have matching client_id in their user record
      if (!user.client_id || user.client_id !== clientId) {
        return Response.json({ 
          error: 'Access denied. You can only view your own goals.' 
        }, { status: 403 });
      }
      
      // Double-check client record exists and matches user email
      const clients = await base44.entities.Client.filter({ 
        id: clientId, 
        email: user.email 
      });
      
      if (clients.length === 0) {
        return Response.json({ 
          error: 'Access denied. Client record verification failed.' 
        }, { status: 403 });
      }
    }

    // Use service role to fetch goals after authorization check
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