import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { clientId, responses } = await req.json();

    if (!clientId || !responses) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get client details
    const clients = await base44.asServiceRole.entities.Client.filter({ id: clientId });
    const client = clients[0];

    if (!client) {
      return Response.json({ error: 'Client not found' }, { status: 404 });
    }

    // Create or update questionnaire
    const existingQuestionnaires = await base44.asServiceRole.entities.Questionnaire.filter({
      client_id: clientId,
      type: "initial"
    });

    if (existingQuestionnaires.length > 0) {
      await base44.asServiceRole.entities.Questionnaire.update(existingQuestionnaires[0].id, {
        responses,
        status: "completed",
        completed_date: new Date().toISOString()
      });
    } else {
      await base44.asServiceRole.entities.Questionnaire.create({
        client_id: clientId,
        client_name: client.name,
        type: "initial",
        status: "completed",
        sent_date: new Date().toISOString(),
        completed_date: new Date().toISOString(),
        responses
      });
    }

    // Update onboarding checklist
    const checklists = await base44.asServiceRole.entities.OnboardingChecklist.filter({ 
      client_id: clientId 
    });

    if (checklists.length > 0) {
      const checklist = checklists[0];
      const updatedTasks = checklist.tasks.map(task => {
        if (task.id === "2") {
          return {
            ...task,
            completed: true,
            completed_date: new Date().toISOString()
          };
        }
        return task;
      });

      await base44.asServiceRole.entities.OnboardingChecklist.update(checklist.id, {
        tasks: updatedTasks,
        questionnaire_completed: true
      });
    }

    // Update client status if still prospect
    if (client.status === "prospect") {
      await base44.asServiceRole.entities.Client.update(clientId, {
        status: "active"
      });
    }

    // Send notification to coach
    const coachEmail = Deno.env.get("COACH_EMAIL") || client.created_by;
    if (coachEmail) {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: coachEmail,
        subject: `${client.name} completed their intake form`,
        body: `${client.name} has completed their initial intake form. Please review their responses and schedule their first discovery session.\n\nKey highlights:\n\nChallenges: ${responses.current_challenges || 'Not provided'}\n\nGoals: ${responses.coaching_goals || 'Not provided'}`
      });
    }

    return Response.json({
      success: true,
      message: 'Intake form submitted successfully'
    });

  } catch (error) {
    return Response.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
});