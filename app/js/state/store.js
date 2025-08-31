// state/store.js
export const state = {
  events: [],
  cart: [],
  myEvents: [],
  checkedIn: []
};

export function setEvents(list){ state.events = list; }
export function addToCart(entry){
  // ensure one entry per eventId
  state.cart = state.cart.filter(c=>c.eventId !== entry.eventId).concat(entry);
}
export function removeFromCart(eventId){ state.cart = state.cart.filter(c=>c.eventId !== eventId); }
export function clearCart(){ state.cart = []; }
export function confirmCart(){
  state.cart.forEach(e=>{ if(!state.myEvents.includes(e.eventId)) state.myEvents.push(e.eventId); });
  state.cart = [];
}

export function pushCheckedIn(eventId){ if(!state.checkedIn.includes(eventId)) state.checkedIn.push(eventId); }
