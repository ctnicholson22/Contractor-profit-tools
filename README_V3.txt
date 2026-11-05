Contractor Profit Tools V3: Supabase account signup/signin, cloud estimates, local estimates and printable quotes.
Deploy this ZIP to your existing Netlify site using the same manual deploy workflow.
PRE-DEPLOY: Run the supplied Supabase SQL and verify Row Level Security and policies.
Supabase Project URL and publishable key are public client-side values; NEVER add a service_role or secret key to browser code.
IMPORTANT: Cloud save is an opt-in separate button. Existing local estimates are not migrated automatically. Export your V2 backup before deploying.
This release is NOT a paid membership system. Stripe checkout, subscription entitlement gating, cancellation, cloud sync conflict handling and account deletion are not yet implemented.
Check Supabase Authentication > URL Configuration: Site URL should be https://cptools.netlify.app, and allow https://cptools.netlify.app/** redirect. Enable email confirmation. Configure SMTP for production.
Test signup, email verification, sign-in, cross-device load, sign-out, and row isolation with two separate test users before public launch.
Password reset email is available but a password update screen is not yet implemented: do not advertise password reset as complete.
