import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { clientId, responses, verificationToken } = await req.json();

    if (!clientId || !responses) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get client details using service role
    const clients = await base44.asServiceRole.entities.Client.filter({ id: clientId });
    const client = clients[0];

    if (!client) {
      return Response.json({ error: 'Client not found' }, { status: 404 });
    }

    // SECURITY: Verify the submission is from the correct client
    // Option 1: Check if user is authenticated and matches client email
    const isAuthenticated = await base44.auth.isAuthenticated();
    if (isAuthenticated) {
      const user = await base44.auth.me();
      if (user.email !== client.email && user.role !== 'admin') {
        return Response.json({ 
          error: 'Forbidden: You can only submit your own intake form' 
        }, { status: 403 });
      }
    } else {
      // Option 2: For unauthenticated access, require a cryptographically signed token
      if (!verificationToken) {
        return Response.json({ 
          error: 'Verification token required for unauthenticated submissions' 
        }, { status: 401 });
      }
      
      // Verify token using cryptographic HMAC signature
      const secret = Deno.env.get("INTAKE_TOKEN_SECRET");
      if (!secret) {
        return Response.json({ 
          error: 'Server configuration error: Token verification unavailable' 
        }, { status: 500 });
      }
      
      // Generate expected token using HMAC-SHA256
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        "raw",
        encoder.encode(secret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
      );
      
      const data = encoder.encode(`${clientId}:${client.email}`);
      const signature = await crypto.subtle.sign("HMAC", key, data);
      const expectedToken = Array.from(new Uint8Array(signature))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      
      if (verificationToken !== expectedToken) {
        return Response.json({ 
          error: 'Invalid verification token' 
        }, { status: 403 });
      }
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