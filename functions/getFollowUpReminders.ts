import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    // Fetch all active clients
    const clients = await base44.asServiceRole.entities.Client.filter({ 
      status: 'active' 
    });

    const reminders = [];

    for (const client of clients) {
      const reasons = [];
      let priority = 'low';

      // Check last session
      const sessions = await base44.asServiceRole.entities.Session.filter(
        { client_id: client.id, status: 'completed' },
        '-date',
        1
      );
      const lastSession = sessions[0];
      
      if (!lastSession) {
        reasons.push('No completed sessions yet');
        priority = 'high';
      } else {
        const sessionDate = new Date(lastSession.date);
        const daysSinceSession = Math.floor((now - sessionDate) / (1000 * 60 * 60 * 24));
        
        if (daysSinceSession > 14) {
          reasons.push(`Last session was ${daysSinceSession} days ago`);
          priority = 'high';
        } else if (daysSinceSession > 7) {
          reasons.push(`Last session was ${daysSinceSession} days ago`);
          if (priority === 'low') priority = 'medium';
        }
      }

      // Check goals with no recent progress
      const goals = await base44.asServiceRole.entities.Goal.filter({ 
        client_id: client.id 
      });
      
      const stuckGoals = goals.filter(goal => {
        const updated = new Date(goal.updated_date);
        return goal.status === 'in_progress' && updated < fourteenDaysAgo;
      });

      if (stuckGoals.length > 0) {
        reasons.push(`${stuckGoals.length} goal${stuckGoals.length > 1 ? 's' : ''} with no progress in 14+ days`);
        if (priority === 'low') priority = 'medium';
      }

      // Check incomplete onboarding tasks
      const checklists = await base44.asServiceRole.entities.OnboardingChecklist.filter({ 
        client_id: client.id 
      });
      
      if (checklists.length > 0) {
        const checklist = checklists[0];
        const incompleteTasks = checklist.tasks?.filter(t => !t.completed) || [];
        
        if (incompleteTasks.length > 0 && checklist.status !== 'completed') {
          reasons.push(`${incompleteTasks.length} onboarding task${incompleteTasks.length > 1 ? 's' : ''} pending`);
          if (priority === 'low') priority = 'medium';
        }
      }

      // Check for pending questionnaire
      const questionnaires = await base44.asServiceRole.entities.Questionnaire.filter({
        client_id: client.id,
        type: 'initial',
        status: 'sent'
      });

      if (questionnaires.length > 0) {
        const questionnaire = questionnaires[0];
        const sentDate = new Date(questionnaire.sent_date);
        const daysSinceSent = Math.floor((now - sentDate) / (1000 * 60 * 60 * 24));
        
        if (daysSinceSent > 7) {
          reasons.push(`Questionnaire sent ${daysSinceSent} days ago, not completed`);
          if (priority === 'low') priority = 'medium';
        }
      }

      if (reasons.length > 0) {
        reminders.push({
          client_id: client.id,
          client_name: client.name,
          client_email: client.email,
          priority,
          reasons,
          last_session_date: lastSession?.date,
          goal_count: goals.length,
          stuck_goals: stuckGoals.length
        });
      }
    }

    // Sort by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    reminders.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    return Response.json({
      success: true,
      reminders,
      total_count: reminders.length,
      high_priority: reminders.filter(r => r.priority === 'high').length
    });

  } catch (error) {
    return Response.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
});