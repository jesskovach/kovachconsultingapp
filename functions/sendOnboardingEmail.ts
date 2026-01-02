import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // ADMIN ONLY: Only coaches/admins can send onboarding emails
        if (user.role !== 'admin') {
            return Response.json({ 
                error: 'Forbidden: Admin access required to send onboarding emails' 
            }, { status: 403 });
        }

        const { clientId, type } = await req.json();

        if (!clientId || !type) {
            return Response.json({ 
                error: 'Missing required fields: clientId, type' 
            }, { status: 400 });
        }

        // Get client details
        const clients = await base44.entities.Client.filter({ id: clientId });
        const client = clients[0];

        if (!client) {
            return Response.json({ error: 'Client not found' }, { status: 404 });
        }

        // Generate email content based on type
        let subject, body;

        if (type === 'welcome') {
            subject = `Welcome to Your Coaching Journey!`;
            body = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { margin-bottom: 30px; }
        .content { margin-bottom: 20px; }
        .steps {
            background-color: #f8fafc;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        .step {
            margin-bottom: 15px;
            padding-left: 30px;
            position: relative;
        }
        .step:before {
            content: "✓";
            position: absolute;
            left: 0;
            color: #1e293b;
            font-weight: bold;
            font-size: 18px;
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
            
            <p>I'm excited to begin our coaching journey together! This partnership is designed to support your growth as a leader and help you achieve your professional goals.</p>
            
            <div class="steps">
                <p style="font-weight: 600; margin-top: 0;">Here's what happens next:</p>
                <div class="step">
                    <strong>Initial Questionnaire:</strong> You'll receive a questionnaire to help me understand your background, challenges, and goals
                </div>
                <div class="step">
                    <strong>Discovery Session:</strong> We'll schedule a session to discuss your coaching objectives in detail
                </div>
                <div class="step" style="margin-bottom: 0;">
                    <strong>Personalized Plan:</strong> Together, we'll create a coaching plan tailored to your needs
                </div>
            </div>
            
            <p>I'm committed to creating a safe, confidential space where you can explore challenges, develop new skills, and achieve meaningful growth.</p>
            
            <p><strong>Looking forward to working with you!</strong></p>
        </div>
        
        <div class="footer">
            <p>Best regards,<br>${user.full_name}</p>
        </div>
    </div>
</body>
</html>
            `;
        } else if (type === 'questionnaire') {
            // Get or create questionnaire
            let questionnaires = await base44.entities.Questionnaire.filter({ 
                client_id: clientId, 
                type: 'initial' 
            });
            
            let questionnaire;
            if (questionnaires.length === 0) {
                questionnaire = await base44.entities.Questionnaire.create({
                    client_id: clientId,
                    client_name: client.name,
                    type: 'initial',
                    status: 'sent',
                    sent_date: new Date().toISOString()
                });
            } else {
                questionnaire = questionnaires[0];
                await base44.entities.Questionnaire.update(questionnaire.id, {
                    status: 'sent',
                    sent_date: new Date().toISOString()
                });
            }

            // Generate intake form URL
            const appUrl = Deno.env.get("APP_URL") || "https://app.base44.com";
            const intakeUrl = `${appUrl}/#/ClientIntake?clientId=${clientId}`;

            subject = `Pre-Coaching Questionnaire`;
            body = `
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
            <h2 style="color: #1e293b; margin-bottom: 10px;">Pre-Coaching Questionnaire</h2>
        </div>
        
        <div class="content">
            <p>Dear ${client.name},</p>
            
            <p>To make the most of our coaching engagement, I'd like to learn more about your background, challenges, and goals. Please take <strong>15-20 minutes</strong> to complete this initial questionnaire.</p>
            
            <p>Your responses will help me prepare for our discovery session and tailor our coaching approach to your specific needs.</p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="${intakeUrl}" class="button">Complete Your Questionnaire</a>
            </div>
            
            <p>Please complete this by the end of the week so we can schedule our discovery session.</p>
            
            <p>If you have any questions, feel free to reach out.</p>
        </div>
        
        <div class="footer">
            <p>Best regards,<br>${user.full_name}</p>
        </div>
    </div>
</body>
</html>
            `;

            // Update onboarding checklist
            const checklists = await base44.entities.OnboardingChecklist.filter({ 
                client_id: clientId 
            });
            if (checklists.length > 0) {
                await base44.entities.OnboardingChecklist.update(checklists[0].id, {
                    questionnaire_sent: true
                });
            }
        } else if (type === 'discovery_prep') {
            subject = `Discovery Session Preparation`;
            body = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { margin-bottom: 30px; }
        .content { margin-bottom: 20px; }
        .section {
            background-color: #f8fafc;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        .list-item {
            margin-bottom: 10px;
            padding-left: 25px;
            position: relative;
        }
        .list-item:before {
            content: "•";
            position: absolute;
            left: 5px;
            color: #1e293b;
            font-weight: bold;
            font-size: 18px;
        }
        .checklist-item {
            margin-bottom: 10px;
            padding-left: 25px;
            position: relative;
        }
        .checklist-item:before {
            content: "✓";
            position: absolute;
            left: 5px;
            color: #1e293b;
            font-weight: bold;
        }
        .session-details {
            background-color: #fff;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
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
            <h2 style="color: #1e293b; margin-bottom: 10px;">Discovery Session Preparation</h2>
        </div>
        
        <div class="content">
            <p>Dear ${client.name},</p>
            
            <p>I'm looking forward to our upcoming discovery session! This meeting is an opportunity for us to:</p>
            
            <div class="section">
                <div class="list-item">Discuss your leadership journey and current challenges</div>
                <div class="list-item">Explore your coaching goals and desired outcomes</div>
                <div class="list-item">Review the coaching process and set expectations</div>
                <div class="list-item" style="margin-bottom: 0;">Answer any questions you may have</div>
            </div>
            
            <p><strong>To prepare for our session:</strong></p>
            
            <div style="margin: 15px 0;">
                <div class="checklist-item">Review your questionnaire responses</div>
                <div class="checklist-item">Think about 2-3 specific situations you'd like to discuss</div>
                <div class="checklist-item">Consider what success looks like for you in 3-6 months</div>
            </div>
            
            <p>Our session will be <strong>90 minutes</strong>. Come prepared to be open and reflective.</p>
            
            <div class="session-details">
                <p style="font-weight: 600; margin-top: 0;">Session Details:</p>
                <p style="margin: 5px 0;"><strong>Date:</strong> [To be confirmed]</p>
                <p style="margin: 5px 0;"><strong>Time:</strong> [To be confirmed]</p>
                <p style="margin: 5px 0 0 0;"><strong>Location:</strong> [Video call link to be provided]</p>
            </div>
            
            <p><strong>See you soon!</strong></p>
        </div>
        
        <div class="footer">
            <p>Best regards,<br>${user.full_name}</p>
        </div>
    </div>
</body>
</html>
            `;
        }

        // Send email using Base44 integration
        await base44.integrations.Core.SendEmail({
            from_name: user.full_name,
            to: client.email,
            subject: subject,
            body: body
        });

        return Response.json({ 
            success: true,
            message: `${type} email sent to ${client.name}`
        });

    } catch (error) {
        console.error('Error sending onboarding email:', error);
        return Response.json({ 
            error: error.message 
        }, { status: 500 });
    }
});