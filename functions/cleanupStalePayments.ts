import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }

        // Find all pending payments older than 48 hours without Stripe checkout session
        const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
        
        const allPayments = await base44.asServiceRole.entities.Payment.filter({
            status: 'pending'
        });

        const stalePayments = allPayments.filter(payment => {
            const isOld = new Date(payment.created_date) < new Date(twoDaysAgo);
            const noStripeSession = !payment.stripe_checkout_session_id && !payment.stripe_payment_intent_id;
            return isOld && noStripeSession;
        });

        // Mark stale payments as failed
        let cleanedCount = 0;
        for (const payment of stalePayments) {
            await base44.asServiceRole.entities.Payment.update(payment.id, {
                status: 'failed'
            });
            cleanedCount++;
        }

        return Response.json({
            success: true,
            cleaned: cleanedCount,
            message: `Marked ${cleanedCount} stale pending payments as failed`
        });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});