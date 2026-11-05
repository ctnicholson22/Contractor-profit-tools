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
const checkout=new URLSearchParams(location.search).get('checkout');
if(checkout==='success')status.textContent='Stripe checkout returned successfully. Subscription confirmation is not yet enabled.';
if(checkout==='cancelled')status.textContent='Checkout cancelled. No subscription started.';
})();