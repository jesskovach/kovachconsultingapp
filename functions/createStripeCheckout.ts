import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    console.log('=== Stripe Checkout Request Started ===');
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    console.log('User authenticated:', user?.email);

    if (!user) {
      console.error('No user found - unauthorized');
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { clientId, amount, description, type = 'session', sessionId } = await req.json();
    console.log('Payment request:', { clientId, amount, description, type, sessionId });

    // Get client details using service role
    console.log('Fetching client:', clientId);
    const clients = await base44.asServiceRole.entities.Client.filter({ id: clientId });
    const client = clients[0];
    console.log('Client found:', client?.name);

    if (!client) {
      console.error('Client not found');
      return Response.json({ error: 'Client not found' }, { status: 404 });
    }

    // Check for existing pending payment to prevent duplicates
    console.log('Checking for existing pending payments...');
    const existingPayments = await base44.asServiceRole.entities.Payment.filter({
      client_id: clientId,
      status: 'pending',
      amount,
      description
    });
    console.log('Existing pending payments:', existingPayments.length);

    // If a pending payment exists with a valid Stripe session, return it
    if (existingPayments.length > 0) {
      const existingPayment = existingPayments[0];
      console.log('Found existing payment:', existingPayment.id);
      if (existingPayment.stripe_checkout_session_id) {
        console.log('Retrieving existing Stripe session:', existingPayment.stripe_checkout_session_id);
        // Retrieve existing Stripe session
        try {
          const existingSession = await stripe.checkout.sessions.retrieve(existingPayment.stripe_checkout_session_id);
          console.log('Existing session status:', existingSession.status);
          if (existingSession.status !== 'expired') {
            console.log('Returning existing session URL');
            return Response.json({
              sessionId: existingSession.id,
              url: existingSession.url
            });
          }
        } catch (e) {
          console.log('Existing session expired or invalid:', e.message);
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
        console.error('session_id missing for session-type payment');
        return Response.json({ error: 'session_id is required for session payments' }, { status: 400 });
      }
      paymentData.session_id = sessionId;
    }

    console.log('Creating payment record:', paymentData);
    const payment = await base44.asServiceRole.entities.Payment.create(paymentData);
    console.log('Payment created:', payment.id);

    // Create Stripe checkout session
    console.log('Creating Stripe checkout session...');
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

    console.log('Stripe session created:', session.id);
    console.log('Stripe checkout URL:', session.url);

    // Update payment with checkout session ID
    await base44.asServiceRole.entities.Payment.update(payment.id, {
      stripe_checkout_session_id: session.id
    });
    console.log('Payment updated with Stripe session ID');

    console.log('=== Returning successful response ===');
    return Response.json({
      sessionId: session.id,
      url: session.url
    });
  } catch (error) {
    console.error('=== Stripe checkout error ===');
    console.error('Error:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    return Response.json({ error: error.message }, { status: 500 });
  }
});