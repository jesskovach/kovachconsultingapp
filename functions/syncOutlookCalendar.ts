import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId, action } = await req.json();

    // Get user's calendar sync settings
    const syncs = await base44.entities.CalendarSync.filter({ 
      user_email: user.email,
      calendar_type: 'outlook'
    });

    if (syncs.length === 0 || !syncs[0].access_token) {
      return Response.json({ error: 'Outlook calendar not connected' }, { status: 400 });
    }

    const sync = syncs[0];
    let accessToken = sync.access_token;

    // Check if token needs refresh
    if (new Date(sync.token_expiry) < new Date()) {
      const clientId = Deno.env.get("MICROSOFT_CLIENT_ID");
      const clientSecret = Deno.env.get("MICROSOFT_CLIENT_SECRET");

      const tokenResponse = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: sync.refresh_token,
          grant_type: 'refresh_token',
          scope: 'Calendars.ReadWrite offline_access'
        })
      });

      if (tokenResponse.ok) {
        const tokens = await tokenResponse.json();
        accessToken = tokens.access_token;
        
        // Update stored tokens
        await base44.asServiceRole.entities.CalendarSync.update(sync.id, {
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token || sync.refresh_token,
          token_expiry: new Date(Date.now() + tokens.expires_in * 1000).toISOString()
        });
      }
    }

    if (action === 'create') {
      const sessions = await base44.entities.Session.filter({ id: sessionId });
      const session = sessions[0];

      if (!session) {
        return Response.json({ error: 'Session not found' }, { status: 404 });
      }

      const event = {
        subject: `Coaching Session - ${session.client_name}`,
        body: {
          contentType: 'HTML',
          content: `<p><strong>${session.type}</strong> session</p><p>Notes: ${session.notes || 'No notes'}</p>`
        },
        start: {
          dateTime: new Date(session.date).toISOString(),
          timeZone: 'UTC'
        },
        end: {
          dateTime: new Date(new Date(session.date).getTime() + (session.duration || 60) * 60000).toISOString(),
          timeZone: 'UTC'
        },
        isReminderOn: true,
        reminderMinutesBeforeStart: 30
      };

      const response = await fetch('https://graph.microsoft.com/v1.0/me/events', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(event)
      });

      if (!response.ok) {
        const error = await response.text();
        return Response.json({ error: 'Failed to create calendar event', details: error }, { status: 500 });
      }

      const calendarEvent = await response.json();

      return Response.json({
        success: true,
        eventId: calendarEvent.id,
        eventLink: calendarEvent.webLink
      });
    } else if (action === 'delete') {
      const { eventId } = await req.json();

      const response = await fetch(`https://graph.microsoft.com/v1.0/me/events/${eventId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!response.ok && response.status !== 404) {
        return Response.json({ error: 'Failed to delete calendar event' }, { status: 500 });
      }

      return Response.json({ success: true });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});