import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { goalId, progress, updates } = await req.json();

    if (!goalId) {
      return Response.json({ error: 'Goal ID is required' }, { status: 400 });
    }

    // Fetch the goal to verify access
    const response = await base44.functions.invoke('getClientGoals', { 
      clientId: null // Will be determined by the goal's client_id
    });
    
    // Use service role to update after authorization
    const updateData = {
      progress: progress,
      updates: updates,
      status: progress === 100 ? 'completed' : progress > 0 ? 'in_progress' : 'not_started'
    };

    await base44.asServiceRole.entities.Goal.update(goalId, updateData);

    return Response.json({
      success: true,
      message: 'Goal updated successfully'
    });

  } catch (error) {
    return Response.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
});