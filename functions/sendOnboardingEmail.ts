import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
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
            subject = `Welcome to Your Coaching Journey, ${client.name}!`;
            body = `
Dear ${client.name},

I'm excited to begin our coaching journey together! This partnership is designed to support your growth as a leader and help you achieve your professional goals.

Here's what happens next:

1. You'll receive an initial questionnaire to help me understand your background, challenges, and goals
2. We'll schedule a discovery session to discuss your coaching objectives in detail
3. Together, we'll create a personalized coaching plan tailored to your needs

I'm committed to creating a safe, confidential space where you can explore challenges, develop new skills, and achieve meaningful growth.

Looking forward to working with you!

Best regards,
${user.full_name}
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

            subject = `Pre-Coaching Questionnaire - ${client.name}`;
            body = `
Dear ${client.name},

To make the most of our coaching engagement, I'd like to learn more about your background, challenges, and goals. Please take 15-20 minutes to complete this initial questionnaire.

Your responses will help me prepare for our discovery session and tailor our coaching approach to your specific needs.

Click here to complete the questionnaire: [Link will be provided in production]

Please complete this by the end of the week so we can schedule our discovery session.

If you have any questions, feel free to reach out.

Best regards,
${user.full_name}
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
            subject = `Discovery Session Preparation - ${client.name}`;
            body = `
Dear ${client.name},

I'm looking forward to our upcoming discovery session! This meeting is an opportunity for us to:

• Discuss your leadership journey and current challenges
• Explore your coaching goals and desired outcomes
• Review the coaching process and set expectations
• Answer any questions you may have

To prepare for our session:
✓ Review your questionnaire responses
✓ Think about 2-3 specific situations you'd like to discuss
✓ Consider what success looks like for you in 3-6 months

Our session will be 90 minutes. Come prepared to be open and reflective.

Session Details:
Date: [To be confirmed]
Time: [To be confirmed]
Location: [Video call link to be provided]

See you soon!

Best regards,
${user.full_name}
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