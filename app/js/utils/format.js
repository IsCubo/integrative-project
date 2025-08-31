// utils/format.js
export function formatPrice(p){ return p===0 ? '$0' : '$' + Number(p).toFixed(2); }
export function formatDate(iso){
  if(!iso) return '';
  try{ const d = new Date(iso); return d.toLocaleDateString(undefined,{ weekday:'long', year:'numeric', month:'long', day:'numeric' }); }catch(e){ return iso; }
}
export function capitalize(s){ return (s||'').charAt(0).toUpperCase() + (s||'').slice(1); }
