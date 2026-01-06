import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { userEmail } = await req.json();

    if (!userEmail) {
      return Response.json({ error: 'userEmail is required' }, { status: 400 });
    }

    // Find the client by email
    const clients = await base44.asServiceRole.entities.Client.filter({ email: userEmail });
    
    if (clients.length === 0) {
      return Response.json({ error: 'No client found with that email' }, { status: 404 });
    }

    const client = clients[0];

    // Find the user by email
    const users = await base44.asServiceRole.entities.User.filter({ email: userEmail });
    
    if (users.length === 0) {
      return Response.json({ error: 'No user found with that email' }, { status: 404 });
    }

    const targetUser = users[0];

    // Link user to client
    await base44.asServiceRole.entities.User.update(targetUser.id, { 
      client_id: client.id 
    });

    return Response.json({ 
      success: true, 
      message: `User ${userEmail} linked to client ${client.name}`,
      client_id: client.id
    });
  } catch (error) {
    console.error('Error linking user to client:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});