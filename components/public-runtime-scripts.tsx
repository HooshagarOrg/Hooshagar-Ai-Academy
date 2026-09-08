/**
 * اسکریپت وانیلا روی لندینگ — بدون React تا چانک ۱۲۵کیلوبایتی next/navigation لود نشود.
 */
export function PublicRuntimeScripts(): JSX.Element {
  const registerSw = process.env.NODE_ENV === 'production'

  return (
    <script
      type="module"
      dangerouslySetInnerHTML={{
        __html: `(function(){
  var KEY='hooshagar_cookie_consent';
  function showNav(){
    var n=document.getElementById('lp-nav');
    if(n && window.scrollY>window.innerHeight*0.7) n.classList.add('is-visible');
  }
  window.addEventListener('scroll', showNav, {passive:true});
  var vid=document.getElementById('lp-cinematic-video');
  if(vid){
    var reduce=false;
    try{ reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches; }catch(e){}
    if(!reduce && 'IntersectionObserver' in window){
      var io=new IntersectionObserver(function(es){
        for(var i=0;i<es.length;i++){
          if(es[i].isIntersecting){ vid.play().catch(function(){}); }
          else { vid.pause(); }
        }
      },{threshold:0.25});
      io.observe(document.getElementById('cinematic')||vid);
    }
  }
  try {
    if (!localStorage.getItem(KEY)) {
      setTimeout(function(){
        if (localStorage.getItem(KEY)) return;
        var wrap=document.createElement('div');
        wrap.setAttribute('role','dialog');
        wrap.setAttribute('aria-label','رضایت کوکی');
        wrap.className='fixed bottom-0 left-0 right-0 z-[100] border-t bg-background/95 p-4 shadow-lg';
        wrap.dir='rtl';
        var box=document.createElement('div');
        box.className='mx-auto flex max-w-4xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between';
        var p=document.createElement('p');
        p.className='text-sm text-muted-foreground';
        p.textContent='هوشاگر از کوکی برای ورود امن، ترجیحات و بهبود تجربه استفاده می‌کند.';
        var btn=document.createElement('button');
        btn.type='button';
        btn.className='lux-btn-accent shrink-0 px-4 py-2 text-sm';
        btn.textContent='می‌پذیرم';
        btn.addEventListener('click', function(){
          localStorage.setItem(KEY,'accepted');
          wrap.remove();
        });
        box.appendChild(p);
        box.appendChild(btn);
        wrap.appendChild(box);
        document.body.appendChild(wrap);
      }, 20000);
    }
  } catch (e) {}
  ${registerSw ? "if('serviceWorker' in navigator){window.setTimeout(function(){navigator.serviceWorker.register('/sw.js',{scope:'/',updateViaCache:'none'}).catch(function(){});},4000);}" : ''}
})();`,
      }}
    />
  )
}
