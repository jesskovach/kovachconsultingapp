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

    const { clientId, amount, description, type = 'session', sessionId } = await req.json();

    // Get client details
    const clients = await base44.entities.Client.filter({ id: clientId });
    const client = clients[0];

    if (!client) {
      return Response.json({ error: 'Client not found' }, { status: 404 });
    }

    // Check for existing pending payment to prevent duplicates
    const existingPayments = await base44.asServiceRole.entities.Payment.filter({
      client_id: clientId,
      status: 'pending',
      amount,
      description
    });

    // If a pending payment exists with a valid Stripe session, return it
    if (existingPayments.length > 0) {
      const existingPayment = existingPayments[0];
      if (existingPayment.stripe_checkout_session_id) {
        // Retrieve existing Stripe session
        try {
          const existingSession = await stripe.checkout.sessions.retrieve(existingPayment.stripe_checkout_session_id);
          if (existingSession.status !== 'expired') {
            return Response.json({
              sessionId: existingSession.id,
              url: existingSession.url
            });
          }
        } catch (e) {
          // Session doesn't exist or expired, create new one
        }
      }
    }

    // Create payment record with session_id if provided
    const paymentData = {
      client_id: clientId,
      client_name: client.name,
      amount,
      description,
      type,
      status: 'pending'
    };

    // Require session_id for session-type payments
    if (type === 'session') {
      if (!sessionId) {
        return Response.json({ error: 'session_id is required for session payments' }, { status: 400 });
      }
      paymentData.session_id = sessionId;
    }

    const payment = await base44.asServiceRole.entities.Payment.create(paymentData);

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