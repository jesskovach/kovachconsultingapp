import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // ADMIN ONLY: This function should only be triggered by scheduled tasks or admin users
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'admin') {
      return Response.json({ 
        error: 'Forbidden: Admin access required' 
      }, { status: 403 });
    }
    
    // Get reminder settings
    const settings = await base44.asServiceRole.entities.ReminderSettings.list();
    const reminderSettings = settings.length > 0 ? settings[0] : {
      reminder_times: [24, 1],
      email_subject: "Reminder: Upcoming Coaching Session",
      email_template: "Hi {client_name},\n\nThis is a friendly reminder about your upcoming coaching session scheduled for {session_date} at {session_time}.\n\nSession Details:\n- Duration: {duration} minutes\n- Type: {type}\n\nLooking forward to our session!\n\nBest regards",
      enabled: true
    };

    if (!reminderSettings.enabled) {
      return Response.json({ 
        message: "Reminders are disabled",
        sent: 0 
      });
    }

    const now = new Date();
    const remindersSent = [];

    // Check for each reminder time (e.g., 24 hours, 1 hour)
    for (const hoursBeforeSession of reminderSettings.reminder_times) {
      const targetTime = new Date(now.getTime() + hoursBeforeSession * 60 * 60 * 1000);
      const windowStart = new Date(targetTime.getTime() - 30 * 60 * 1000); // 30 min before
      const windowEnd = new Date(targetTime.getTime() + 30 * 60 * 1000); // 30 min after

      // Get scheduled sessions in the time window
      const allSessions = await base44.asServiceRole.entities.Session.filter({ 
        status: "scheduled" 
      });

      const sessionsToRemind = allSessions.filter(session => {
        const sessionDate = new Date(session.date);
        return sessionDate >= windowStart && sessionDate <= windowEnd;
      });

      // Send reminders
      for (const session of sessionsToRemind) {
        // Get client details
        const clients = await base44.asServiceRole.entities.Client.filter({ 
          id: session.client_id 
        });
        const client = clients[0];

        if (!client || !client.email) continue;

        // Check if reminder already sent for this session at this time
        const existingNotifications = await base44.asServiceRole.entities.Notification.filter({
          session_id: session.id,
          type: "session_reminder",
          status: "sent"
        });

        const alreadySent = existingNotifications.some(notif => {
          const sentDate = new Date(notif.sent_date);
          const hoursDiff = Math.abs((sentDate.getTime() - now.getTime()) / (60 * 60 * 1000));
          return hoursDiff < 1; // Sent within the last hour
        });

        if (alreadySent) continue;

        // Format session date and time
        const sessionDate = new Date(session.date);
        const formattedDate = sessionDate.toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
        const formattedTime = sessionDate.toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit', 
          hour12: true 
        });

        // Replace template placeholders
        let emailBody = reminderSettings.email_template
          .replace(/{client_name}/g, client.name)
          .replace(/{session_date}/g, formattedDate)
          .replace(/{session_time}/g, formattedTime)
          .replace(/{duration}/g, session.duration || 60)
          .replace(/{type}/g, session.type || 'coaching');

        // Send email
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: client.email,
          subject: reminderSettings.email_subject,
          body: emailBody
        });

        // Log notification
        await base44.asServiceRole.entities.Notification.create({
          type: "session_reminder",
          recipient_email: client.email,
          recipient_name: client.name,
          client_id: client.id,
          session_id: session.id,
          status: "sent",
          sent_date: now.toISOString(),
          subject: reminderSettings.email_subject,
          message: emailBody,
          metadata: {
            hours_before: hoursBeforeSession
          }
        });

        remindersSent.push({
          client: client.name,
          session_date: formattedDate,
          hours_before: hoursBeforeSession
        });
      }
    }

    return Response.json({
      success: true,
      sent: remindersSent.length,
      reminders: remindersSent
    });

  } catch (error) {
    return Response.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
});