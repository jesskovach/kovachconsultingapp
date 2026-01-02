import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        const user = await base44.auth.me();
        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const twoDaysFromNow = new Date(now);
        twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);

        const notifications = [];

        // 1. Check for upcoming sessions (24 hours before)
        const upcomingSessions = await base44.asServiceRole.entities.Session.list();
        
        for (const session of upcomingSessions) {
            if (session.status !== 'scheduled') continue;
            
            const sessionDate = new Date(session.date);
            const hoursUntil = (sessionDate - now) / (1000 * 60 * 60);
            
            // Send reminder 24 hours before
            if (hoursUntil > 23 && hoursUntil <= 25) {
                const clients = await base44.asServiceRole.entities.Client.filter({ id: session.client_id });
                const client = clients[0];
                
                if (client) {
                    const subject = `Reminder: Coaching Session Tomorrow`;
                    const body = `
Dear ${client.name},

This is a friendly reminder about your upcoming coaching session:

📅 Date: ${sessionDate.toLocaleDateString()}
⏰ Time: ${sessionDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
⏱️ Duration: ${session.duration || 60} minutes

To prepare for our session:
• Review your recent goals and progress
• Think about challenges you'd like to discuss
• Prepare any questions you have

Looking forward to our conversation!

Best regards,
${user.full_name}
                    `;

                    await base44.asServiceRole.integrations.Core.SendEmail({
                        from_name: user.full_name,
                        to: client.email,
                        subject: subject,
                        body: body
                    });

                    notifications.push({
                        type: 'session_reminder',
                        recipient_email: client.email,
                        recipient_name: client.name,
                        client_id: client.id,
                        session_id: session.id,
                        status: 'sent',
                        sent_date: now.toISOString(),
                        subject: subject
                    });
                }
            }
        }

        // 2. Check for completed sessions needing follow-up (24 hours after)
        const completedSessions = await base44.asServiceRole.entities.Session.filter({ status: 'completed' });
        
        for (const session of completedSessions) {
            const sessionDate = new Date(session.date);
            const hoursSince = (now - sessionDate) / (1000 * 60 * 60);
            
            // Send follow-up 24 hours after session
            if (hoursSince > 23 && hoursSince <= 26) {
                // Check if follow-up already sent
                const existingNotifications = await base44.asServiceRole.entities.Notification.filter({
                    session_id: session.id,
                    type: 'session_followup',
                    status: 'sent'
                });
                
                if (existingNotifications.length === 0) {
                    const clients = await base44.asServiceRole.entities.Client.filter({ id: session.client_id });
                    const client = clients[0];
                    
                    if (client) {
                        const subject = `Follow-up: Action Items from Our Session`;
                        const body = `
Dear ${client.name},

Thank you for yesterday's coaching session! I wanted to follow up and help you maintain momentum.

Session Outcomes:
${session.outcomes || 'Review your notes from our discussion'}

Action Items to Focus On:
• Reflect on insights from our conversation
• Take action on the commitments you made
• Note any questions or challenges that arise

Our next session is an opportunity to review progress and tackle new challenges.

How are you feeling about the action items? Hit reply if you'd like to discuss anything.

Best regards,
${user.full_name}
                        `;

                        await base44.asServiceRole.integrations.Core.SendEmail({
                            from_name: user.full_name,
                            to: client.email,
                            subject: subject,
                            body: body
                        });

                        notifications.push({
                            type: 'session_followup',
                            recipient_email: client.email,
                            recipient_name: client.name,
                            client_id: client.id,
                            session_id: session.id,
                            status: 'sent',
                            sent_date: now.toISOString(),
                            subject: subject
                        });
                    }
                }
            }
        }

        // 3. Check for overdue questionnaires (sent more than 3 days ago, not completed)
        const questionnaires = await base44.asServiceRole.entities.Questionnaire.filter({ 
            status: 'sent' 
        });
        
        for (const questionnaire of questionnaires) {
            const sentDate = new Date(questionnaire.sent_date);
            const daysSince = (now - sentDate) / (1000 * 60 * 60 * 24);
            
            if (daysSince > 3) {
                // Check if reminder already sent
                const existingReminders = await base44.asServiceRole.entities.Notification.filter({
                    client_id: questionnaire.client_id,
                    type: 'questionnaire_reminder'
                });
                
                const recentReminder = existingReminders.find(n => {
                    const reminderDate = new Date(n.sent_date);
                    const daysSinceReminder = (now - reminderDate) / (1000 * 60 * 60 * 24);
                    return daysSinceReminder < 3;
                });
                
                if (!recentReminder) {
                    const clients = await base44.asServiceRole.entities.Client.filter({ id: questionnaire.client_id });
                    const client = clients[0];
                    
                    if (client) {
                        const subject = `Reminder: Complete Your Pre-Coaching Questionnaire`;
                        const body = `
Dear ${client.name},

I hope this message finds you well! I wanted to gently remind you about the pre-coaching questionnaire I sent a few days ago.

Your responses will help me:
• Understand your unique challenges and goals
• Prepare for our discovery session
• Tailor our coaching approach to your needs

It takes about 15-20 minutes to complete. If you have any questions or concerns, please don't hesitate to reach out.

Looking forward to working with you!

Best regards,
${user.full_name}
                        `;

                        await base44.asServiceRole.integrations.Core.SendEmail({
                            from_name: user.full_name,
                            to: client.email,
                            subject: subject,
                            body: body
                        });

                        notifications.push({
                            type: 'questionnaire_reminder',
                            recipient_email: client.email,
                            recipient_name: client.name,
                            client_id: client.id,
                            status: 'sent',
                            sent_date: now.toISOString(),
                            subject: subject
                        });
                    }
                }
            }
        }

        // 4. Check for onboarding checklists with no progress in 7 days
        const onboardingChecklists = await base44.asServiceRole.entities.OnboardingChecklist.filter({ 
            status: 'in_progress' 
        });
        
        for (const checklist of onboardingChecklists) {
            const lastUpdate = new Date(checklist.updated_date);
            const daysSinceUpdate = (now - lastUpdate) / (1000 * 60 * 60 * 24);
            
            if (daysSinceUpdate > 7) {
                // Check if reminder already sent
                const existingReminders = await base44.asServiceRole.entities.Notification.filter({
                    client_id: checklist.client_id,
                    type: 'progress_review'
                });
                
                const recentReminder = existingReminders.find(n => {
                    const reminderDate = new Date(n.sent_date);
                    const daysSinceReminder = (now - reminderDate) / (1000 * 60 * 60 * 24);
                    return daysSinceReminder < 7;
                });
                
                if (!recentReminder) {
                    const completedTasks = checklist.tasks?.filter(t => t.completed).length || 0;
                    const totalTasks = checklist.tasks?.length || 0;
                    
                    const subject = `Action Needed: Review ${checklist.client_name}'s Onboarding`;
                    const body = `
Hi ${user.full_name},

This is an automated reminder about ${checklist.client_name}'s onboarding progress.

Current Status:
• Tasks Completed: ${completedTasks} of ${totalTasks}
• Last Updated: ${daysSinceUpdate.toFixed(0)} days ago
• Status: In Progress

Action Items:
• Review the onboarding checklist
• Complete any pending tasks
• Reach out to the client if needed
• Update the checklist status

View Onboarding: [Dashboard Link]

Best regards,
Your CRM System
                    `;

                    await base44.asServiceRole.integrations.Core.SendEmail({
                        from_name: "CoachCRM",
                        to: user.email,
                        subject: subject,
                        body: body
                    });

                    notifications.push({
                        type: 'progress_review',
                        recipient_email: user.email,
                        recipient_name: user.full_name,
                        client_id: checklist.client_id,
                        status: 'sent',
                        sent_date: now.toISOString(),
                        subject: subject,
                        metadata: {
                            completedTasks,
                            totalTasks,
                            daysSinceUpdate: Math.floor(daysSinceUpdate)
                        }
                    });
                }
            }
        }

        // 5. Save all notifications to database
        if (notifications.length > 0) {
            await base44.asServiceRole.entities.Notification.bulkCreate(notifications);
        }

        return Response.json({ 
            success: true,
            notificationsSent: notifications.length,
            types: notifications.reduce((acc, n) => {
                acc[n.type] = (acc[n.type] || 0) + 1;
                return acc;
            }, {}),
            timestamp: now.toISOString()
        });

    } catch (error) {
        console.error('Error sending automated notifications:', error);
        return Response.json({ 
            error: error.message,
            stack: error.stack
        }, { status: 500 });
    }
});