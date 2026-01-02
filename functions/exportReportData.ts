import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // ADMIN ONLY: Exporting aggregated data requires admin privileges
        if (user.role !== 'admin') {
            return Response.json({ 
                error: 'Forbidden: Admin access required to export reports' 
            }, { status: 403 });
        }

        const { reportType } = await req.json();

        let csvData = '';
        let filename = 'report.csv';

        if (reportType === 'clients') {
            const clients = await base44.entities.Client.list();
            const sessions = await base44.entities.Session.list();
            const goals = await base44.entities.Goal.list();

            // Build CSV header
            csvData = 'Client Name,Email,Company,Status,Pipeline Stage,Total Sessions,Completed Sessions,Active Goals,Completed Goals,Goal Completion %,Start Date\n';

            // Build CSV rows
            for (const client of clients) {
                const clientSessions = sessions.filter(s => s.client_id === client.id);
                const completedSessions = clientSessions.filter(s => s.status === 'completed');
                const clientGoals = goals.filter(g => g.client_id === client.id);
                const completedGoals = clientGoals.filter(g => g.status === 'completed');
                const goalCompletion = clientGoals.length > 0 ? ((completedGoals.length / clientGoals.length) * 100).toFixed(0) : 0;

                csvData += `"${client.name}","${client.email}","${client.company || ''}","${client.status}","${client.pipeline_stage}",${clientSessions.length},${completedSessions.length},${clientGoals.length},${completedGoals.length},${goalCompletion},"${client.start_date || ''}"\n`;
            }

            filename = 'clients_report.csv';

        } else if (reportType === 'sessions') {
            const sessions = await base44.entities.Session.list();

            csvData = 'Session Date,Client Name,Duration (min),Type,Status,Mood Rating,Notes,Outcomes\n';

            for (const session of sessions) {
                const date = new Date(session.date).toLocaleDateString();
                csvData += `"${date}","${session.client_name}",${session.duration || 60},"${session.type}","${session.status}","${session.mood_rating || ''}","${(session.notes || '').replace(/"/g, '""')}","${(session.outcomes || '').replace(/"/g, '""')}"\n`;
            }

            filename = 'sessions_report.csv';

        } else if (reportType === 'goals') {
            const goals = await base44.entities.Goal.list();
            const clients = await base44.entities.Client.list();

            csvData = 'Client Name,Goal Title,Category,Status,Progress %,Target Date,Description\n';

            for (const goal of goals) {
                const client = clients.find(c => c.id === goal.client_id);
                const clientName = client ? client.name : 'Unknown';
                csvData += `"${clientName}","${goal.title}","${goal.category}","${goal.status}",${goal.progress || 0},"${goal.target_date || ''}","${(goal.description || '').replace(/"/g, '""')}"\n`;
            }

            filename = 'goals_report.csv';

        } else if (reportType === 'health_scores') {
            const clients = await base44.entities.Client.list();
            const sessions = await base44.entities.Session.list();
            const goals = await base44.entities.Goal.list();

            csvData = 'Client Name,Health Score,Session Count,Goal Completion %,Engagement Rate,Status,Risk Level\n';

            for (const client of clients) {
                if (client.status !== 'active') continue;

                const clientSessions = sessions.filter(s => s.client_id === client.id && s.status === 'completed');
                const clientGoals = goals.filter(g => g.client_id === client.id);
                const completedGoals = clientGoals.filter(g => g.status === 'completed');
                const goalCompletion = clientGoals.length > 0 ? (completedGoals.length / clientGoals.length) * 100 : 0;

                const now = new Date();
                const recentSessions = clientSessions.filter(s => {
                    const daysSince = (now - new Date(s.date)) / (1000 * 60 * 60 * 24);
                    return daysSince <= 30;
                });
                const engagementRate = recentSessions.length > 0 ? 100 : 50;

                const healthScore = Math.round(
                    (Math.min(clientSessions.length * 10, 40)) +
                    (goalCompletion * 0.3) +
                    (engagementRate * 0.3)
                );

                const riskLevel = healthScore < 40 ? 'High' : healthScore < 60 ? 'Medium' : 'Low';

                csvData += `"${client.name}",${healthScore},${clientSessions.length},${goalCompletion.toFixed(0)},${engagementRate},"${client.status}","${riskLevel}"\n`;
            }

            filename = 'health_scores_report.csv';
        }

        return new Response(csvData, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="${filename}"`
            }
        });

    } catch (error) {
        console.error('Error generating report:', error);
        return Response.json({ 
            error: error.message 
        }, { status: 500 });
    }
});