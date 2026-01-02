import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId, action } = await req.json();

    // Get the OAuth access token for Google Calendar
    const accessToken = await base44.asServiceRole.connectors.getAccessToken("googlecalendar");

    if (action === 'create') {
      // Get session details
      const sessions = await base44.entities.Session.filter({ id: sessionId });
      const session = sessions[0];

      if (!session) {
        return Response.json({ error: 'Session not found' }, { status: 404 });
      }

      // Create Google Calendar event
      const event = {
        summary: `Coaching Session - ${session.client_name}`,
        description: `${session.type} session\n\nNotes: ${session.notes || 'No notes'}`,
        start: {
          dateTime: new Date(session.date).toISOString(),
          timeZone: 'UTC',
        },
        end: {
          dateTime: new Date(new Date(session.date).getTime() + (session.duration || 60) * 60000).toISOString(),
          timeZone: 'UTC',
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 },
            { method: 'popup', minutes: 30 },
          ],
        },
      };

      const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      });

      if (!response.ok) {
        const error = await response.text();
        return Response.json({ error: 'Failed to create calendar event', details: error }, { status: 500 });
      }

      const calendarEvent = await response.json();

      return Response.json({
        success: true,
        eventId: calendarEvent.id,
        eventLink: calendarEvent.htmlLink
      });
    } else if (action === 'delete') {
      const { eventId } = await req.json();

      const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
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