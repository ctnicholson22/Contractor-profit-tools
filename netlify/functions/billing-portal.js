// Open Stripe's hosted billing portal only for a verified subscription owner.
const BASE='https://mlhpaaqmyqdgymcfluts.supabase.co';
const KEY='sb_publishable_2abl92PvnPvG8N5j1_M34w_d1E-FndZ';
exports.handler=async(event)=>{
 if(event.httpMethod!=='POST')return {statusCode:405,body:'Method not allowed'};
 const token=(event.headers.authorization||event.headers.Authorization||'').replace(/^Bearer\s+/i,'');
 if(!token)return {statusCode:401,body:'Sign in required'};
 const secret=process.env.STRIPE_SECRET_KEY;
 if(!secret)return {statusCode:503,body:'Billing unavailable'};
 try{
  const auth=await fetch(BASE+'/auth/v1/user',{headers:{apikey:KEY,Authorization:'Bearer '+token}});
  if(!auth.ok)return {statusCode:401,body:'Session expired'};
  const user=await auth.json();
  if(!user.id||!user.email)return {statusCode:401,body:'Invalid user'};
  const customersResponse=await fetch('https://api.stripe.com/v1/customers?'+new URLSearchParams({email:user.email,limit:'100'}),{headers:{Authorization:'Bearer '+secret}});
  if(!customersResponse.ok)throw Error('Customer lookup failed');
  const customers=await customersResponse.json();
  let owner=null;
  for(const customer of customers.data||[]){
   const r=await fetch('https://api.stripe.com/v1/subscriptions?'+new URLSearchParams({customer:customer.id,status:'all',limit:'100'}),{headers:{Authorization:'Bearer '+secret}});
   if(!r.ok)throw Error('Subscription lookup failed');
   const subs=await r.json();
   if((subs.data||[]).some(s=>s.metadata?.supabase_user_id===user.id)){owner=customer.id;break;}
  }
  if(!owner)return {statusCode:404,body:'No billing account found'};
  const body=new URLSearchParams({customer:owner,return_url:'https://cptools.netlify.app/#account'});
  const r=await fetch('https://api.stripe.com/v1/billing_portal/sessions',{method:'POST',headers:{Authorization:'Bearer '+secret,'Content-Type':'application/x-www-form-urlencoded'},body:body.toString()});
  const data=await r.json();
  if(!r.ok||!data.url)return {statusCode:502,body:'Billing portal is not configured yet'};
  return {statusCode:200,headers:{'Content-Type':'application/json','Cache-Control':'no-store'},body:JSON.stringify({url:data.url})};
 }catch(e){console.error('Portal error',e.message);return {statusCode:502,body:'Could not open billing portal'};}
};