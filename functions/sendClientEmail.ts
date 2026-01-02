import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { clientId, clientName, toEmail, subject, body, attachments = [] } = await req.json();

    if (!clientId || !toEmail || !subject || !body) {
      return Response.json({ 
        error: 'Missing required fields: clientId, toEmail, subject, body' 
      }, { status: 400 });
    }

    // Send email via Core integration
    await base44.integrations.Core.SendEmail({
      to: toEmail,
      subject: subject,
      body: body,
      from_name: user.full_name || "Executive Coach"
    });

    // Log email in database
    await base44.asServiceRole.entities.Email.create({
      client_id: clientId,
      client_name: clientName,
      from_email: user.email,
      to_email: toEmail,
      subject: subject,
      body: body,
      direction: "sent",
      sent_date: new Date().toISOString(),
      status: "sent",
      attachments: attachments
    });

    return Response.json({ 
      success: true, 
      message: "Email sent successfully" 
    });
  } catch (error) {
    console.error('Error sending email:', error);
    
    // Log failed email attempt
    try {
      const base44 = createClientFromRequest(req);
      const { clientId, clientName, toEmail, subject, body, attachments = [] } = await req.json();
      const user = await base44.auth.me();
      
      await base44.asServiceRole.entities.Email.create({
        client_id: clientId,
        client_name: clientName,
        from_email: user?.email || "unknown",
        to_email: toEmail,
        subject: subject,
        body: body,
        direction: "sent",
        sent_date: new Date().toISOString(),
        status: "failed",
        attachments: attachments
      });
    } catch (logError) {
      console.error('Failed to log email error:', logError);
    }
    
    return Response.json({ 
      error: error.message || 'Failed to send email' 
    }, { status: 500 });
  }
});