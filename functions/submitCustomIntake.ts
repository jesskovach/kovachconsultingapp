import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // 1. Authenticate user
    const user = await base44.auth.me();
    if (!user) {
      return Response.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Parse request body
    const body = await req.json();
    const { formData, clientId } = body;

    if (!clientId || !formData) {
      return Response.json(
        { success: false, error: 'Missing clientId or formData' },
        { status: 400 }
      );
    }

    // 3. Save questionnaire
    await base44.asServiceRole.entities.Questionnaire.create({
      client_id: clientId,
      type: 'custom_intake',
      status: 'completed',
      completed_date: new Date().toISOString(),
      responses: formData
    });

    // 4. Fetch client (single record)
    const clients = await base44.asServiceRole.entities.Client.filter({
      id: clientId
    });

    const client = clients?.[0];
    const coachEmail =
      client?.created_by || user.email;

    const clientName =
      client?.name || user.full_name || 'Client';

    // 5. Fire notifications + email (NON-BLOCKING)
    Promise.all([
      // In-app notification
      base44.asServiceRole.entities.Notification.create({
        type: 'intake_submitted',
        recipient_email: coachEmail,
        recipient_name: 'Coach',
        client_id: clientId,
        subject: 'New Intake Form Submitted',
        message: `${clientName} has submitted their intake questionnaire.`,
        status: 'sent',
        sent_date: new Date().toISOString()
      }),

      // Email notification
      base44.asServiceRole.integrations.Core.SendEmail({
        to: coachEmail,
        subject: 'New Intake Questionnaire Submitted',
        body: `
Hello,

${clientName} has completed their intake questionnaire.

You can review their responses in the CoachCRM dashboard under:
Clients → Intake Forms

— CoachCRM
        `.trim()
      })
    ]).catch((err) => {
      console.error('Async notification error:', err);
    });

    // 6. Return SUCCESS (frontend relies on this)
    return Response.json({
      success: true,
      message: 'Intake submitted successfully',
      clientId
    });

  } catch (error) {
    console.error('submitCustomIntake error:', error);
    return Response.json(
      {
        success: false,
        error: error?.message || 'Internal server error'
      },
      { status: 500 }
    );
  }
});
