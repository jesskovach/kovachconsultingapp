import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
const endpointSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    let event;

    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        endpointSecret
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return Response.json({ error: 'Webhook signature verification failed' }, { status: 400 });
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const paymentId = session.metadata.payment_id;
        const clientId = session.metadata.client_id;

        if (paymentId) {
          await base44.asServiceRole.entities.Payment.update(paymentId, {
            status: 'paid',
            paid_date: new Date().toISOString(),
            stripe_payment_intent_id: session.payment_intent
          });

          // Create notification
          const clients = await base44.asServiceRole.entities.Client.filter({ id: clientId });
          if (clients[0]) {
            await base44.asServiceRole.entities.Notification.create({
              type: 'payment_received',
              recipient_email: clients[0].created_by,
              recipient_name: 'Coach',
              client_id: clientId,
              status: 'pending',
              scheduled_date: new Date().toISOString(),
              subject: 'Payment Received',
              message: `Payment of $${(session.amount_total / 100).toFixed(2)} received from ${clients[0].name}`
            });
          }
        }
        break;
      }

      case 'checkout.session.expired': {
        const session = event.data.object;
        const paymentId = session.metadata.payment_id;

        if (paymentId) {
          await base44.asServiceRole.entities.Payment.update(paymentId, {
            status: 'failed'
          });
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        console.log('Payment failed:', paymentIntent.id);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});