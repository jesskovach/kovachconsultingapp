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

    // Get app base URL from environment
    const appId = Deno.env.get("BASE44_APP_ID");
    
    // Generate secure token for unauthenticated access (optional - client can also login)
    const tokenSecret = Deno.env.get("INTAKE_TOKEN_SECRET");
    let intakeFormUrl = `https://${appId}.base44.app/#/ClientIntake?clientId=${clientId}`;
    
    if (tokenSecret) {
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        "raw",
        encoder.encode(tokenSecret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
      );
      
      const data = encoder.encode(`${clientId}:${client.email}`);
      const signature = await crypto.subtle.sign("HMAC", key, data);
      const token = Array.from(new Uint8Array(signature))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      
      intakeFormUrl += `&token=${token}`;
    }

    // Send welcome email
    const emailBody = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { margin-bottom: 30px; }
        .content { margin-bottom: 20px; }
        .button { 
            display: inline-block;
            background-color: #1e293b;
            color: white !important;
            padding: 14px 28px;
            text-decoration: none;
            border-radius: 8px;
            margin: 20px 0;
            font-weight: 600;
        }
        .info-box {
            background-color: #f8fafc;
            border-left: 4px solid #1e293b;
            padding: 15px;
            margin: 20px 0;
        }
        .footer { 
            margin-top: 40px; 
            padding-top: 20px; 
            border-top: 1px solid #e2e8f0;
            font-size: 14px;
            color: #64748b;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2 style="color: #1e293b; margin-bottom: 10px;">Welcome to Your Coaching Journey!</h2>
        </div>
        
        <div class="content">
            <p>Dear ${client.name},</p>
            
            <p>Welcome to our coaching program! We're excited to begin this journey with you.</p>
            
            <p>To get started, please complete your client intake form:</p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="${intakeFormUrl}" class="button">Complete Intake Form</a>
            </div>
            
            <div class="info-box">
                <p style="margin: 0;"><strong>What to expect:</strong></p>
                <p style="margin: 5px 0 0 0;">This form will help us understand your goals, challenges, and what you hope to achieve through our coaching partnership. It should take about <strong>10-15 minutes</strong> to complete.</p>
            </div>
            
            <p>Once you've submitted the form, we'll review your responses and reach out to schedule your first discovery session.</p>
            
            <p>If you have any questions, please don't hesitate to reach out.</p>
            
            <p><strong>Looking forward to working with you!</strong></p>
        </div>
        
        <div class="footer">
            <p>Best regards,<br>Your Coaching Team</p>
        </div>
    </div>
</body>
</html>
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