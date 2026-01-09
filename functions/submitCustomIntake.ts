import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { formData, clientId } = await req.json();

    // Save the intake as a questionnaire
    await base44.asServiceRole.entities.Questionnaire.create({
      client_id: clientId,
      type: 'initial',
      status: 'completed',
      completed_date: new Date().toISOString(),
      responses: formData
    });

    // Get client info - use filter instead of list for better performance
    const clients = await base44.asServiceRole.entities.Client.filter({ id: clientId });
    const clientInfo = clients[0];

    // Create notifications and send email asynchronously (don't wait)
    Promise.all([
      base44.asServiceRole.entities.Notification.create({
        type: 'onboarding_update',
        recipient_email: clientInfo?.created_by || user.email,
        recipient_name: 'Coach',
        client_id: clientId,
        subject: 'New Custom Intake Submitted',
        message: `${clientInfo?.name || user.full_name} has completed their custom intake questionnaire.`,
        status: 'sent',
        sent_date: new Date().toISOString()
      }),
      base44.asServiceRole.integrations.Core.SendEmail({
        to: clientInfo?.created_by || user.email,
        subject: 'New Custom Intake Questionnaire Submitted',
        body: `Hello,\n\n${clientInfo?.name || user.full_name} has completed their custom intake questionnaire.\n\nYou can review their responses in the client portal.\n\nBest regards,\nCoachCRM`
      })
    ]).catch(err => console.error('Notification error:', err));

    return Response.json({ 
      success: true,
      message: 'Intake submitted successfully' 
    });

  } catch (error) {
    console.error('Submit intake error:', error);
    return Response.json({ 
      error: error.message || 'Failed to submit intake' 
    }, { status: 500 });
  }
});