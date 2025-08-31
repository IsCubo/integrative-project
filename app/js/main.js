import { fetchEvents } from './api/events.js';
import { state, setEvents } from './state/store.js';
import { renderEventsInto, applyRegistrationsToCards } from './ui/renderEvents.js';
import { renderCart } from './ui/cart.js';
import { renderMyEvents } from './ui/myEvents.js';
import { initTabs } from './ui/tabs.js';

async function init(){
  const grid = document.querySelector('.events-grid');
  const events = await fetchEvents();
  setEvents(events);
  renderEventsInto(grid, events, state);
  applyRegistrationsToCards(state);
  renderCart();
  renderMyEvents();
  initTabs();
  // expose for debug
  window.__QF = { state, renderCart, renderMyEvents };
}

if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
// main.js - dashboard interaction and data fetching
// - fetchEvents() tries to load from /api/events, falls back to sample data
// - renderEvents() renders cards into .events-grid
// - updateStats() updates stat-value elements
// - registerForEvent() simulates registering (in-memory) and updates UI

(function(){
  const EVENTS_API = '/api/events'; // backend endpoint placeholder
  const $eventsGrid = document.querySelector('.events-grid');
  const sampleEvents = [
    {
      id: 'e1', title: 'Tech Conference 2025', organizer: 'John Smith', date: 'Sunday, September 14, 2025',
      description: 'Annual technology conference featuring the latest innovations', price: 0, registrations: ['attendee','speaker']
    },
    {
      id: 'e2', title: 'Marketing Summit', organizer: 'John Smith', date: 'Sunday, October 19, 2025',
      description: 'Learn the latest marketing strategies and trends', price: 0, registrations: ['volunteer','speaker']
    },
    {
      id: 'e3', title: 'Design Workshop', organizer: 'John Smith', date: 'Tuesday, November 4, 2025',
      description: 'Hands-on workshop for UX/UI designers', price: 0, registrations: ['speaker']
    }
  ];

  let state = {
    events: [],
    cart: [],
    myEvents: [],
    checkedIn: []
  };

  // Utility: timeoutable fetch
  function fetchWithTimeout(url, timeout = 3000){
    return new Promise((resolve, reject)=>{
      const timer = setTimeout(()=>reject(new Error('timeout')), timeout);
      fetch(url).then(res=>{clearTimeout(timer);resolve(res)}).catch(err=>{clearTimeout(timer);reject(err)});
    });
  }

  async function fetchEvents(){
    try{
      const res = await fetchWithTimeout(EVENTS_API,3000);
      if(!res.ok) throw new Error('bad response');
      const data = await res.json();
      return data;
    }catch(err){
      console.warn('Fetching events failed, using sample data:', err.message);
      return sampleEvents;
    }
  }

  function formatPrice(p){ return p===0 ? '$0' : '$' + p.toFixed(2); }

  function createRoleBadge(role){
    const span = document.createElement('span');
    span.className = 'role-badge role-' + role;
    span.textContent = role.charAt(0).toUpperCase() + role.slice(1);
    return span;
  }

  function renderEvents(events){
    if(!$eventsGrid) return;
    $eventsGrid.innerHTML = '';

    events.forEach(ev=>{
      const art = document.createElement('article');
      art.className = 'event-card card';
      art.dataset.id = ev.id;

      const price = document.createElement('div');
      price.className = 'event-price';
      price.textContent = formatPrice(ev.price || 0);

      const title = document.createElement('div');
      title.className = 'event-title';
      title.textContent = ev.title;

      const meta = document.createElement('div');
      meta.className = 'event-meta';
      meta.innerHTML = 'Organized by ' + (ev.organizer || 'Unknown') + '<small>Date<br>' + (ev.date || '') + '</small>';

      const desc = document.createElement('div');
      desc.className = 'event-desc';
      desc.textContent = ev.description || '';

      const badges = document.createElement('div');
      badges.className = 'event-badges';
      (ev.registrations||[]).forEach(r=>badges.appendChild(createRoleBadge(r)));

      const registerRow = document.createElement('div');
      registerRow.className = 'register-row';

      ['attendee','speaker','volunteer'].forEach(role=>{
        const btn = document.createElement('button');
        btn.className = 'btn-small btn-' + role + ' btn';
        btn.textContent = role.charAt(0).toUpperCase() + role.slice(1);
        btn.addEventListener('click', ()=> registerForEvent(ev.id, role));
        registerRow.appendChild(btn);
      });

      art.appendChild(price);
      art.appendChild(title);
      art.appendChild(meta);
      art.appendChild(desc);
      art.appendChild(badges);
      art.appendChild(registerRow);

      $eventsGrid.appendChild(art);
    });

    // update state
    state.events = events;
  // apply any existing cart/myEvents markers to the freshly rendered cards
  applyRegistrationsToCards();
  updateStats();
  }

  // Render cart panel
  function renderCart(){
    const panel = document.querySelector('#tab-mycart');
    if(!panel) return;
    const container = panel.querySelector('.cart-content');
    if(!container) return;
    container.innerHTML = '';
    if(state.cart.length === 0){
      container.textContent = 'Your cart is empty.';
      return;
    }
    state.cart.forEach(entry => {
      const ev = state.events.find(e=>e.id===entry.eventId) || {title: 'Unknown event'};
      const row = document.createElement('div');
      row.className = 'cart-row card';
      row.style.display = 'flex';
      row.style.justifyContent = 'space-between';
      row.style.alignItems = 'center';
      row.style.padding = '12px';

      const info = document.createElement('div');
      info.innerHTML = `<strong>${ev.title}</strong><div class="text-muted">Role: ${entry.role}</div>`;

      const actions = document.createElement('div');
      const remove = document.createElement('button');
      remove.className = 'btn';
      remove.textContent = 'Remove';
      remove.addEventListener('click', ()=> removeFromCart(entry.eventId));
      actions.appendChild(remove);

      row.appendChild(info);
      row.appendChild(actions);
      container.appendChild(row);
    });
    // Cart summary + confirm button
    const summary = document.createElement('div');
    summary.className = 'cart-summary card mt-16';
    summary.style.padding = '18px';

    const infoWrap = document.createElement('div');
    infoWrap.style.display = 'flex';
    infoWrap.style.justifyContent = 'space-between';
    infoWrap.style.alignItems = 'center';

    const left = document.createElement('div');
    left.innerHTML = `<strong>Cart Summary</strong><div class="text-muted">You will receive QR codes for each event after confirmation</div>`;

    const right = document.createElement('div');
    right.style.textAlign = 'right';
    const count = document.createElement('div');
    count.className = 'text-muted';
    count.textContent = state.cart.length + (state.cart.length === 1 ? ' events' : ' events');
    const total = document.createElement('div');
    total.style.fontWeight = '700';
    total.style.fontSize = '1.1rem';
    // simple total price
    const totalPrice = state.cart.reduce((sum, e) => {
      const ev = state.events.find(x=>x.id===e.eventId);
      return sum + (ev && ev.price ? ev.price : 0);
    }, 0);
    total.textContent = formatPrice(totalPrice);
    right.appendChild(count);
    right.appendChild(total);

    infoWrap.appendChild(left);
    infoWrap.appendChild(right);

    const confirmRow = document.createElement('div');
    confirmRow.style.marginTop = '12px';
    const confirmBtn = document.createElement('button');
    confirmBtn.className = 'btn btn-primary confirm-btn';
    confirmBtn.textContent = 'Confirm Registration';
    confirmBtn.addEventListener('click', ()=> confirmRegistration());
    confirmRow.appendChild(confirmBtn);

    summary.appendChild(infoWrap);
    summary.appendChild(confirmRow);
    container.appendChild(summary);
  }

  // move items from cart to myEvents (confirm purchase/registration)
  function confirmRegistration(){
    if(state.cart.length === 0) return;
    // move each cart entry to myEvents if not already present
    state.cart.forEach(entry => {
      if(!state.myEvents.includes(entry.eventId)) state.myEvents.push(entry.eventId);
    });
    // clear cart
    state.cart = [];
    // update UI
    applyRegistrationsToCards();
    renderCart();
    renderMyEvents();
    updateStats();
    // small feedback
    const panel = document.querySelector('#tab-myevents');
    if(panel){
      // ensure user sees myevents tab
      const hash = '#myevents';
      try{ history.pushState({},'',hash); }catch(e){}
      // activate tab if tabs exist
      const t = document.querySelector('.tabs .tab[data-tab="myevents"]');
      if(t) t.click();
    }
    console.log('Confirmed registration for', state.myEvents);
  }

  // Render my events panel
  function renderMyEvents(){
    const panel = document.querySelector('#tab-myevents');
    if(!panel) return;
    const container = panel.querySelector('.events-list');
    if(!container) return;
    container.innerHTML = '';
    if(state.myEvents.length === 0){
      container.textContent = 'You have no registered events yet.';
      return;
    }

    state.myEvents.forEach(id => {
      const ev = state.events.find(e=>e.id===id) || {title: 'Unknown event', organizer:'', date:'', description:''};

      const card = document.createElement('article');
      card.className = 'my-event-card card';
      card.style.display = 'flex';
      card.style.gap = '18px';
      card.style.alignItems = 'flex-start';

      // left content
      const left = document.createElement('div');
      left.style.flex = '1';

      const title = document.createElement('div');
      title.className = 'event-title';
      title.textContent = ev.title;

      const organizer = document.createElement('div');
      organizer.className = 'event-meta';
      organizer.textContent = 'Organized by ' + (ev.organizer || 'Unknown');

      const dateWrap = document.createElement('div');
      dateWrap.className = 'event-desc';
      dateWrap.innerHTML = '<strong>Date & Time</strong><br>' + (ev.date || '');

      const desc = document.createElement('div');
      desc.className = 'event-desc';
      desc.textContent = ev.description || '';

      const statusRow = document.createElement('div');
      statusRow.style.display = 'flex';
      statusRow.style.gap = '12px';
      statusRow.style.alignItems = 'center';
      statusRow.style.marginTop = '12px';

      const checkin = document.createElement('div');
      checkin.className = 'checkin-status';
      // default not checked in
      checkin.innerHTML = '<span style="color:#ef4444;font-weight:700;margin-right:6px">✖</span> <span class="text-muted">Not Checked In</span>';

      const rolePill = document.createElement('span');
      rolePill.className = 'role-badge role-attendee';
      rolePill.textContent = 'Attendee';

      statusRow.appendChild(checkin);
      statusRow.appendChild(rolePill);

      left.appendChild(title);
      left.appendChild(organizer);
      left.appendChild(dateWrap);
      left.appendChild(desc);
      left.appendChild(statusRow);

      // right content: QR and actions
      const right = document.createElement('div');
      right.style.width = '160px';
      right.style.flex = '0 0 160px';
      right.style.display = 'flex';
      right.style.flexDirection = 'column';
      right.style.alignItems = 'center';
      right.style.gap = '10px';

      const qrLabel = document.createElement('div');
      qrLabel.className = 'text-muted';
      qrLabel.textContent = 'Your QR Code';

      const qrBox = document.createElement('div');
      qrBox.className = 'qr-box';
      qrBox.innerHTML = '<div class="qr-placeholder">QR Code</div>';

      const note = document.createElement('div');
      note.className = 'text-muted';
      note.style.fontSize = '.85rem';
      note.style.textAlign = 'center';
      note.textContent = 'Show this QR code at the event for check-in as attendee';

      const emailBtn = document.createElement('button');
      emailBtn.className = 'btn btn-secondary';
      emailBtn.textContent = 'View Email';

      right.appendChild(qrLabel);
      right.appendChild(qrBox);
      right.appendChild(note);
      right.appendChild(emailBtn);

      card.appendChild(left);
      card.appendChild(right);

      container.appendChild(card);
    });
  }

  function updateStats(){
    // update stat-value elements by order
    const statValues = document.querySelectorAll('.stat-value');
    if(statValues && statValues.length>=4){
      statValues[0].textContent = state.events.length;
      statValues[1].textContent = state.cart.length;
      statValues[2].textContent = state.myEvents.length;
      statValues[3].textContent = state.checkedIn.length;
    }
  }

  function registerForEvent(eventId, role){
    const ev = state.events.find(e=>e.id===eventId);
    if(!ev) return console.warn('Event not found', eventId);

    // Add or update cart entry for this event (cart stores one entry per event)
    const existing = state.cart.find(c => c.eventId === eventId);
    if(existing){
      existing.role = role; // update chosen role
    } else {
      state.cart.push({ eventId, role });
    }

    // update UI: mark card as in-cart and show chosen role
    const card = document.querySelector(`.event-card[data-id="${eventId}"]`);
    if(card){
      card.classList.add('in-cart');
      let marker = card.querySelector('.my-registration');
      if(!marker){
        marker = document.createElement('div');
        marker.className = 'my-registration mt-16';
        card.appendChild(marker);
      }
      marker.textContent = 'In cart: ' + role.charAt(0).toUpperCase() + role.slice(1);
    }

    updateStats();
    console.log(`Added to cart: ${eventId} as ${role}`);
    // re-render cart panel if visible
    renderCart();
    // disable register buttons for this card
    disableRegisterButtonsFor(eventId);
  }

  function removeFromCart(eventId){
    state.cart = state.cart.filter(c=>c.eventId !== eventId);
    // re-render cart and update cards
    applyRegistrationsToCards();
    renderCart();
    updateStats();
    // re-enable buttons on card
    enableRegisterButtonsFor(eventId);
  }

  function disableRegisterButtonsFor(eventId){
    const card = document.querySelector(`.event-card[data-id="${eventId}"]`);
    if(!card) return;
    const buttons = card.querySelectorAll('button.btn-small');
    buttons.forEach(b => b.setAttribute('disabled','')); 
  }

  function enableRegisterButtonsFor(eventId){
    const card = document.querySelector(`.event-card[data-id="${eventId}"]`);
    if(!card) return;
    const buttons = card.querySelectorAll('button.btn-small');
    buttons.forEach(b => b.removeAttribute('disabled'));
  }

  // apply cart / myEvents markers after rendering
  function applyRegistrationsToCards(){
    // clear existing markers
    document.querySelectorAll('.event-card').forEach(card => {
      card.classList.remove('in-cart');
      const m = card.querySelector('.my-registration');
      if(m) m.remove();
    });

    // mark cart entries
    state.cart.forEach(entry => {
      const c = document.querySelector(`.event-card[data-id="${entry.eventId}"]`);
      if(c){
        c.classList.add('in-cart');
        const marker = document.createElement('div');
        marker.className = 'my-registration mt-16';
        marker.textContent = 'In cart: ' + entry.role.charAt(0).toUpperCase() + entry.role.slice(1);
        c.appendChild(marker);
      }
    });

    // mark myEvents (if any) - render as Registered
    state.myEvents.forEach(eventId => {
      const c = document.querySelector(`.event-card[data-id="${eventId}"]`);
      if(c){
        const marker = document.createElement('div');
        marker.className = 'my-registration mt-16';
        marker.textContent = 'Registered';
        c.appendChild(marker);
      }
    });
  }

  // init
  async function init(){
    const events = await fetchEvents();
    renderEvents(events);

  // render panels
  renderCart();
  renderMyEvents();

  // expose for debugging
  window.__QF = {state, renderEvents, fetchEvents, renderCart, renderMyEvents, removeFromCart};
  }

  // Run when DOM ready
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();

/* TAB NAVIGATION: dashboard tabs (accessible, deep-link, history) */
(function initDashboardTabs(){
  const tabs = Array.from(document.querySelectorAll('.tabs .tab'));
  const panels = Array.from(document.querySelectorAll('.tab-panel'));

  if (!tabs.length || !panels.length) return;

  function activate(tabName, push = false){
    tabs.forEach(t => {
      const is = t.dataset.tab === tabName;
      t.classList.toggle('active', is);
      t.setAttribute('aria-selected', is ? 'true' : 'false');
      if(is) t.focus();
    });

    panels.forEach(p => {
      const show = p.id === `tab-${tabName}`;
      p.classList.toggle('hidden', !show);
      p.setAttribute('aria-hidden', !show ? 'true' : 'false');
    });

    if(push){
      try{ history.pushState({tab: tabName}, '', `#${tabName}`); }catch(e){}
    }
  }

  tabs.forEach(t => t.addEventListener('click', e => {
    const name = t.dataset.tab;
    activate(name, true);
  }));

  // deep-link on load via hash
  const hash = location.hash.replace('#','');
  if(hash && tabs.some(t => t.dataset.tab === hash)){
    activate(hash, false);
  } else {
    // default
    activate('available', false);
  }

  // handle back/forward
  window.addEventListener('popstate', () => {
    const h = location.hash.replace('#','') || 'available';
    activate(h, false);
  });
})();
