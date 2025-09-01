// api/events.js
const EVENTS_API = '/api/events';

function fetchWithTimeout(url, timeout = 4000){
  return new Promise((resolve, reject)=>{
    const timer = setTimeout(()=>reject(new Error('timeout')), timeout);
    fetch(url).then(res=>{clearTimeout(timer);resolve(res)}).catch(err=>{clearTimeout(timer);reject(err)});
  });
}

export async function fetchEvents(){
  try{
    const res = await fetchWithTimeout(EVENTS_API,4000);
    if(!res.ok) throw new Error('bad response: ' + res.status);
    const data = await res.json();
    return Array.isArray(data) ? data : (Array.isArray(data.events) ? data.events : []);
  }catch(err){
    console.warn('fetchEvents failed:', err.message);
    return [];
  }
}
