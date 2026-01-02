import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // ADMIN ONLY: Only coaches/admins can send welcome emails
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'admin') {
      return Response.json({ 
        error: 'Forbidden: Admin access required' 
      }, { status: 403 });
    }

    const { clientId } = await req.json();

    if (!clientId) {
      return Response.json({ error: 'Client ID is required' }, { status: 400 });
    }

    // Get client details
    const clients = await base44.asServiceRole.entities.Client.filter({ id: clientId });
    const client = clients[0];

    if (!client || !client.email) {
      return Response.json({ error: 'Client not found or no email' }, { status: 404 });
    }

    // Create onboarding checklist if it doesn't exist
    const existingChecklists = await base44.asServiceRole.entities.OnboardingChecklist.filter({ 
      client_id: clientId 
    });

    if (existingChecklists.length === 0) {
      await base44.asServiceRole.entities.OnboardingChecklist.create({
        client_id: clientId,
        client_name: client.name,
        status: "in_progress",
        started_date: new Date().toISOString(),
        tasks: [
          {
            id: "1",
            title: "Send welcome email",
            description: "Send personalized welcome email with intake form link",
            completed: true,
            completed_date: new Date().toISOString(),
            order: 1
          },
          {
            id: "2",
            title: "Complete intake form",
            description: "Client fills out initial questionnaire and intake information",
            completed: false,
            order: 2
          },
          {
            id: "3",
            title: "Review intake responses",
            description: "Coach reviews client responses and prepares for discovery session",
            completed: false,
            order: 3
          },
          {
            id: "4",
            title: "Schedule discovery session",
            description: "Book first coaching session with client",
            completed: false,
            order: 4
          }
        ]
      });
    }

    // Get app base URL
    const appUrl = Deno.env.get("APP_URL") || "https://app.base44.com";
    const intakeFormUrl = `${appUrl}/#/ClientIntake?clientId=${clientId}`;

    // Send welcome email
    const emailBody = `
Dear ${client.name},

Welcome to our coaching program! We're excited to begin this journey with you.

To get started, please complete your client intake form by clicking the link below:

${intakeFormUrl}

This form will help us understand your goals, challenges, and what you hope to achieve through our coaching partnership. It should take about 10-15 minutes to complete.

Once you've submitted the form, we'll review your responses and reach out to schedule your first discovery session.

If you have any questions, please don't hesitate to reach out.

Looking forward to working with you!

Best regards,
Your Coaching Team
    `.trim();

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: client.email,
      subject: `Welcome! Next Steps for Your Coaching Journey`,
      body: emailBody
    });

    return Response.json({
      success: true,
      message: 'Welcome email sent',
      intakeFormUrl
    });

  } catch (error) {
    return Response.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
});