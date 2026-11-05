(()=>{'use strict';
const button=document.getElementById('startTrial');
const status=document.getElementById('billingStatus');
if(!button||!status)return;
button.addEventListener('click',async()=>{
  button.disabled=true;status.textContent='Opening secure Stripe test checkout…';
  try{
    const supabase=window.cptBillingClient;
    if(!supabase)throw Error('Please sign in first. Reload if you are already signed in.');
    const {data:{session},error}=await supabase.auth.getSession();
    if(error||!session?.access_token)throw Error('Please sign in under My Account first.');
    const res=await fetch('/.netlify/functions/create-checkout',{method:'POST',headers:{Authorization:'Bearer '+session.access_token}});
    if(!res.ok)throw Error((await res.text()).slice(0,180));
    const data=await res.json();
    if(!data.url||!data.url.startsWith('https://checkout.stripe.com/'))throw Error('Invalid checkout link');
    window.location.assign(data.url);
  }catch(e){status.textContent=e.message;button.disabled=false;}
});
const manage=document.getElementById('manageBilling');
if(manage)manage.addEventListener('click',async()=>{
 manage.disabled=true;status.textContent='Opening billing portal…';
 try{
  const client=window.cptBillingClient;
  if(!client)throw Error('Please sign in first.');
  const {data:{session}}=await client.auth.getSession();
  if(!session?.access_token)throw Error('Please sign in first.');
  const r=await fetch('/.netlify/functions/billing-portal',{method:'POST',headers:{Authorization:'Bearer '+session.access_token}});
  if(!r.ok)throw Error((await r.text()).slice(0,180));
  const d=await r.json();if(!d.url?.startsWith('https://billing.stripe.com/'))throw Error('Invalid billing portal link');
  location.assign(d.url);
 }catch(e){status.textContent=e.message;manage.disabled=false;}
});
const checkout=new URLSearchParams(location.search).get('checkout');
if(checkout==='success')status.textContent='Stripe checkout returned successfully. Subscription confirmation is not yet enabled.';
if(checkout==='cancelled')status.textContent='Checkout cancelled. No subscription started.';
})();