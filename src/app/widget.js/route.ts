// Embeddable script: <script src="https://YOUR-APP/widget.js" data-key="WIDGET_KEY" async></script>
export const dynamic = "force-static";

const SCRIPT = `(function(){
  var s=document.currentScript; if(!s) return;
  var key=s.getAttribute('data-key'); if(!key||document.getElementById('assistar-widget-root')) return;
  var base=new URL(s.src).origin;
  var color=s.getAttribute('data-color')||'#123D32';
  var root=document.createElement('div'); root.id='assistar-widget-root';
  root.style.cssText='position:fixed;right:20px;bottom:20px;z-index:2147483000;font-family:system-ui,sans-serif';
  var frame=document.createElement('iframe');
  frame.src=base+'/widget/'+encodeURIComponent(key); frame.title='Chat';
  frame.style.cssText='display:none;position:absolute;right:0;bottom:70px;width:min(380px,calc(100vw - 24px));height:min(600px,calc(100vh - 110px));border:0;border-radius:16px;box-shadow:0 12px 40px rgba(8,44,37,.25);background:#fff';
  var btn=document.createElement('button'); btn.setAttribute('aria-label','Open chat');
  btn.style.cssText='width:56px;height:56px;border-radius:50%;border:0;cursor:pointer;color:#fff;background:'+color+';box-shadow:0 6px 20px rgba(8,44,37,.3);font-size:0;display:flex;align-items:center;justify-content:center';
  btn.innerHTML='<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
  var open=false; btn.onclick=function(){open=!open; frame.style.display=open?'block':'none'; btn.setAttribute('aria-label',open?'Close chat':'Open chat');};
  root.appendChild(frame); root.appendChild(btn); document.body.appendChild(root);
})();`;

export function GET() {
  return new Response(SCRIPT, {
    headers: { "content-type": "application/javascript; charset=utf-8", "cache-control": "public, max-age=300", "access-control-allow-origin": "*" },
  });
}
