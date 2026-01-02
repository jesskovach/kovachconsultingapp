import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { clientId, amount, description, type = 'session' } = await req.json();

    // Get client details
    const clients = await base44.entities.Client.filter({ id: clientId });
    const client = clients[0];

    if (!client) {
      return Response.json({ error: 'Client not found' }, { status: 404 });
    }

    // Create payment record
    const payment = await base44.asServiceRole.entities.Payment.create({
      client_id: clientId,
      client_name: client.name,
      amount,
      description,
      type,
      status: 'pending'
    });

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: Math.round(amount * 100),
            product_data: {
              name: description || 'Coaching Session',
              description: `Payment for ${client.name}`
            }
          },
          quantity: 1
        }
      ],
      mode: 'payment',
      customer_email: client.email,
      success_url: `${req.headers.get('origin')}/ClientPortal?payment=success`,
      cancel_url: `${req.headers.get('origin')}/ClientPortal?payment=cancelled`,
      metadata: {
        payment_id: payment.id,
        client_id: clientId
      }
    });

    // Update payment with checkout session ID
    await base44.asServiceRole.entities.Payment.update(payment.id, {
      stripe_checkout_session_id: session.id
    });

    return Response.json({
      sessionId: session.id,
      url: session.url
    });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});