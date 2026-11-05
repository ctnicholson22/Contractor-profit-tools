// Stripe subscription status for a signed-in Supabase user (test mode).
const AUTH_URL='https://mlhpaaqmyqdgymcfluts.supabase.co/auth/v1/user';
const API_KEY='sb_publishable_2abl92PvnPvG8N5j1_M34w_d1E-FndZ';
async function getUser(event){
 const token=(event.headers.authorization||event.headers.Authorization||'').replace(/^Bearer\s+/i,'');
 if(!token)return null;
 const r=await fetch(AUTH_URL,{headers:{apikey:API_KEY,Authorization:'Bearer '+token}});
 return r.ok?await r.json():null;
}
async function stripe(path,secret,params){
 const url='https://api.stripe.com/v1/'+path+(params?'?'+params.toString():'');
 const r=await fetch(url,{headers:{Authorization:'Bearer '+secret}});
 if(!r.ok)throw Error('Stripe API request failed');
 return r.json();
}
exports.handler=async(event)=>{
 if(event.httpMethod!=='GET')return {statusCode:405,body:'Method not allowed'};
 try{
  const user=await getUser(event);
  if(!user?.id||!user.email)return {statusCode:401,body:'Sign in required'};
  const secret=process.env.STRIPE_SECRET_KEY;
  if(!secret)return {statusCode:503,body:'Billing unavailable'};
  const customers=await stripe('customers',secret,new URLSearchParams({email:user.email,limit:'100'}));
  let active=null;
  for(const customer of customers.data||[]){
   const subs=await stripe('subscriptions',secret,new URLSearchParams({customer:customer.id,status:'all',limit:'100'}));
   for(const s of subs.data||[]){
    if(s.metadata?.supabase_user_id!==user.id)continue;
    if(['trialing','active','past_due','unpaid','paused'].includes(s.status)){
     active={status:s.status,trial_end:s.trial_end,current_period_end:s.items?.data?.[0]?.current_period_end||null,cancel_at_period_end:s.cancel_at_period_end,customer_id:customer.id};
     break;
    }
   }
   if(active)break;
  }
  return {statusCode:200,headers:{'Content-Type':'application/json','Cache-Control':'no-store'},body:JSON.stringify({subscription:active?{status:active.status,trial_end:active.trial_end,current_period_end:active.current_period_end,cancel_at_period_end:active.cancel_at_period_end}:null,has_access:!!active&&['trialing','active'].includes(active.status)})};
 }catch(e){console.error('Subscription lookup failed',e.message);return {statusCode:502,body:'Unable to verify subscription'};}
};
