import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // If already linked, return the client
    if (user.client_id) {
      const clients = await base44.asServiceRole.entities.Client.filter({ id: user.client_id });
      if (clients.length > 0) {
        return Response.json({ client: clients[0], alreadyLinked: true });
      }
    }

    // Find client by email
    const clients = await base44.asServiceRole.entities.Client.filter({ email: user.email });
    
    if (clients.length === 0) {
      return Response.json({ client: null, message: 'No client found' }, { status: 200 });
    }

    const client = clients[0];

    // Link user to client
    await base44.asServiceRole.entities.User.update(user.id, { 
      client_id: client.id 
    });

    return Response.json({ 
      client, 
      linked: true,
      message: 'Successfully linked to client'
    });
  } catch (error) {
    console.error('Error auto-linking user to client:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});