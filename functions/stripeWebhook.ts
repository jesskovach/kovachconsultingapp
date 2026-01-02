import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.5.0';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  
  try {
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

    if (!stripeSecretKey || !webhookSecret) {
      return Response.json({ error: 'Stripe not configured' }, { status: 500 });
    }

    const stripe = new Stripe(stripeSecretKey);
    const signature = req.headers.get('stripe-signature');
    const body = await req.text();

    // Verify webhook signature
    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret
    );

    // Handle the event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const paymentId = session.metadata.payment_id;

      if (paymentId) {
        // Update payment status
        await base44.asServiceRole.entities.Payment.update(paymentId, {
          status: 'paid',
          stripe_payment_intent_id: session.payment_intent,
          paid_date: new Date().toISOString()
        });

        // Send confirmation email
        const payments = await base44.asServiceRole.entities.Payment.filter({ id: paymentId });
        const payment = payments[0];

        if (payment) {
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: session.customer_email,
            subject: 'Payment Confirmation - Coaching Session',
            body: `
              <h2>Payment Received</h2>
              <p>Thank you for your payment!</p>
              <p><strong>Amount:</strong> $${payment.amount}</p>
              <p><strong>Description:</strong> ${payment.description}</p>
              <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
              <p>Your session is confirmed. We look forward to working with you!</p>
            `
          });
        }
      }
    } else if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object;
      
      // Find payment by payment intent ID
      const payments = await base44.asServiceRole.entities.Payment.filter({
        stripe_payment_intent_id: paymentIntent.id
      });

      if (payments.length > 0) {
        await base44.asServiceRole.entities.Payment.update(payments[0].id, {
          status: 'failed'
        });
      }
    }

    return Response.json({ received: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
});