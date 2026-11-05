// Netlify Function: Stripe Checkout (test-mode integration).
// Requires STRIPE_SECRET_KEY and STRIPE_PRICE_ID in Netlify environment.
// Supabase project URL is public; never expose a service-role key here.
const SUPABASE_URL = 'https://mlhpaaqmyqdgymcfluts.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_2abl92PvnPvG8N5j1_M34w_d1E-FndZ';
const SITE_URL = 'https://cptools.netlify.app';

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' };
  const secret = process.env.STRIPE_SECRET_KEY;
  const price = process.env.STRIPE_PRICE_ID;
  if (!secret || !price) return { statusCode: 503, body: 'Billing is not configured' };
  const token = (event.headers.authorization || event.headers.Authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) return { statusCode: 401, body: 'Please sign in first' };
  try {
    // Authenticate the customer on the server. Never trust an emailed user ID from the browser.
    const auth = await fetch(SUPABASE_URL + '/auth/v1/user', {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: 'Bearer ' + token }
    });
    if (!auth.ok) return { statusCode: 401, body: 'Your sign-in has expired' };
    const user = await auth.json();
    if (!user.id || !user.email) return { statusCode: 401, body: 'Invalid user account' };

    const params = new URLSearchParams();
    params.set('mode', 'subscription');
    params.set('line_items[0][price]', price);
    params.set('line_items[0][quantity]', '1');
    params.set('subscription_data[trial_period_days]', '7');
    params.set('payment_method_collection', 'always');
    params.set('customer_email', user.email);
    params.set('client_reference_id', user.id);
    params.set('subscription_data[metadata][supabase_user_id]', user.id);
    params.set('success_url', SITE_URL + '/?checkout=success&session_id={CHECKOUT_SESSION_ID}');
    params.set('cancel_url', SITE_URL + '/?checkout=cancelled');

    const checkout = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + secret, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    });
    const session = await checkout.json();
    if (!checkout.ok || !session.url) {
      console.error('Stripe checkout error', session.error?.type, session.error?.code);
      return { statusCode: 502, body: 'Unable to start checkout. Please try again.' };
    }
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      body: JSON.stringify({ url: session.url })
    };
  } catch (err) {
    console.error('Checkout function error', err?.message);
    return { statusCode: 500, body: 'Checkout temporarily unavailable' };
  }
};
