import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.5.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { amount, description, clientId, clientName, type, sessionId } = await req.json();

    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      return Response.json({ error: 'Stripe not configured' }, { status: 500 });
    }

    const stripe = new Stripe(stripeSecretKey);

    // Create payment record
    const payment = await base44.entities.Payment.create({
      client_id: clientId,
      client_name: clientName,
      amount: amount,
      currency: 'usd',
      status: 'pending',
      type: type || 'session',
      description: description,
      session_id: sessionId
    });

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: description,
          },
          unit_amount: Math.round(amount * 100), // Convert to cents
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${req.headers.get('origin')}/client-portal?payment=success`,
      cancel_url: `${req.headers.get('origin')}/client-portal?payment=cancelled`,
      metadata: {
        payment_id: payment.id,
        client_id: clientId,
        session_id: sessionId || ''
      },
      customer_email: user.email
    });

    // Update payment with Stripe session ID
    await base44.entities.Payment.update(payment.id, {
      stripe_checkout_session_id: session.id
    });

    return Response.json({
      success: true,
      checkoutUrl: session.url,
      paymentId: payment.id
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});