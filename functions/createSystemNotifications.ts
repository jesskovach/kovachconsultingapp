import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const notifications = [];

    // 1. Check for upcoming sessions (within next 24 hours)
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    const sessions = await base44.asServiceRole.entities.Session.list();
    const upcomingSessions = sessions.filter(s => {
      if (s.status !== 'scheduled') return false;
      const sessionDate = new Date(s.date);
      return sessionDate >= now && sessionDate <= tomorrow;
    });

    for (const session of upcomingSessions) {
      // Check if notification already exists
      const existingNotifs = await base44.asServiceRole.entities.Notification.filter({
        session_id: session.id,
        type: 'session_reminder'
      });

      if (existingNotifs.length === 0) {
        notifications.push({
          type: 'session_reminder',
          recipient_email: user.email,
          recipient_name: user.full_name,
          client_id: session.client_id,
          session_id: session.id,
          status: 'pending',
          scheduled_date: now.toISOString(),
          subject: `Upcoming Session: ${session.client_name}`,
          message: `You have a ${session.type} session scheduled for ${new Date(session.date).toLocaleString()}`,
          metadata: { session_date: session.date }
        });
      }
    }

    // 2. Check for overdue onboarding tasks
    const checklists = await base44.asServiceRole.entities.OnboardingChecklist.list();
    const overdueChecklists = checklists.filter(c => {
      if (c.status === 'completed') return false;
      if (!c.started_date) return false;
      
      const startDate = new Date(c.started_date);
      const daysSinceStart = Math.floor((now - startDate) / (1000 * 60 * 60 * 24));
      
      // Alert if onboarding is taking more than 14 days and not completed
      return daysSinceStart > 14;
    });

    for (const checklist of overdueChecklists) {
      // Check if notification already exists for this checklist today
      const existingNotifs = await base44.asServiceRole.entities.Notification.filter({
        client_id: checklist.client_id,
        type: 'task_overdue'
      });

      const todayNotifs = existingNotifs.filter(n => {
        const notifDate = new Date(n.created_date);
        return notifDate.toDateString() === now.toDateString();
      });

      if (todayNotifs.length === 0) {
        const incompleteTasks = checklist.tasks?.filter(t => !t.completed).length || 0;
        notifications.push({
          type: 'task_overdue',
          recipient_email: user.email,
          recipient_name: user.full_name,
          client_id: checklist.client_id,
          status: 'pending',
          scheduled_date: now.toISOString(),
          subject: `Overdue Onboarding: ${checklist.client_name}`,
          message: `${checklist.client_name}'s onboarding has ${incompleteTasks} incomplete tasks and is overdue`,
          metadata: { checklist_id: checklist.id }
        });
      }
    }

    // 3. Check for new emails received today
    const emails = await base44.asServiceRole.entities.Email.list('-created_date', 20);
    const todayEmails = emails.filter(e => {
      const emailDate = new Date(e.created_date);
      return emailDate.toDateString() === now.toDateString() && e.direction === 'received';
    });

    for (const email of todayEmails) {
      // Check if notification already exists
      const existingNotifs = await base44.asServiceRole.entities.Notification.filter({
        metadata: { email_id: email.id }
      });

      if (existingNotifs.length === 0) {
        notifications.push({
          type: 'email_received',
          recipient_email: user.email,
          recipient_name: user.full_name,
          client_id: email.client_id,
          status: 'pending',
          scheduled_date: now.toISOString(),
          subject: `New Email: ${email.subject}`,
          message: `${email.client_name} sent you an email: "${email.subject}"`,
          metadata: { email_id: email.id }
        });
      }
    }

    // 4. Check for recent client activity (new messages)
    const messages = await base44.asServiceRole.entities.Message.list('-created_date', 20);
    const todayMessages = messages.filter(m => {
      const msgDate = new Date(m.created_date);
      return msgDate.toDateString() === now.toDateString() && !m.read;
    });

    for (const message of todayMessages) {
      const existingNotifs = await base44.asServiceRole.entities.Notification.filter({
        metadata: { message_id: message.id }
      });

      if (existingNotifs.length === 0) {
        notifications.push({
          type: 'client_activity',
          recipient_email: user.email,
          recipient_name: user.full_name,
          client_id: message.client_id,
          status: 'pending',
          scheduled_date: now.toISOString(),
          subject: 'New Message',
          message: `${message.sender_name} sent you a message`,
          metadata: { message_id: message.id }
        });
      }
    }

    // Create all notifications
    if (notifications.length > 0) {
      await Promise.all(
        notifications.map(n => base44.asServiceRole.entities.Notification.create(n))
      );
    }

    return Response.json({ 
      success: true, 
      message: `Created ${notifications.length} notifications`,
      notifications_created: notifications.length
    });
  } catch (error) {
    console.error('Error creating notifications:', error);
    return Response.json({ 
      error: error.message || 'Failed to create notifications' 
    }, { status: 500 });
  }
});