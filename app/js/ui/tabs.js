// ui/tabs.js
export function initTabs(){
  const tabs = Array.from(document.querySelectorAll('.tabs .tab'));
  const panels = Array.from(document.querySelectorAll('.tab-panel'));
  if(!tabs.length || !panels.length) return;

  function activate(name, push=false){
    tabs.forEach(t=>{ const is = t.dataset.tab===name; t.classList.toggle('active', is); t.setAttribute('aria-selected', is? 'true':'false'); if(is) t.focus(); });
    panels.forEach(p=>{ const show = p.id === `tab-${name}`; p.classList.toggle('hidden', !show); p.setAttribute('aria-hidden', !show ? 'true':'false'); });
    if(push) try{ history.pushState({tab:name},'',`#${name}`); }catch(e){}
  }

  tabs.forEach(t=> t.addEventListener('click', ()=> activate(t.dataset.tab, true)));
  const hash = location.hash.replace('#','');
  if(hash && tabs.some(t=>t.dataset.tab===hash)) activate(hash,false); else activate('available', false);
  window.addEventListener('popstate', ()=>{ const h = location.hash.replace('#','')|| 'available'; activate(h,false); });
}
