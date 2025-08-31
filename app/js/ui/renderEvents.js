import { setEvents, addToCart } from '../state/store.js';
import { formatPrice, formatDate, capitalize } from '../utils/format.js';
import { renderCart } from './cart.js';

const roles = ['attendee','speaker','volunteer'];

export function renderEventsInto(container, events, state){
  if(!container) return;
  container.innerHTML = '';
  events.forEach(ev=>{
    const art = document.createElement('article');
    art.className = 'event-card card';
    art.dataset.id = ev.id;

    const price = document.createElement('div'); price.className='event-price'; price.textContent = formatPrice(ev.price||0);
    const title = document.createElement('div'); title.className='event-title'; title.textContent = ev.title;
    const organizer = document.createElement('div'); organizer.className='event-organizer'; organizer.textContent = 'Organized by ' + (ev.organizer||'');
  const date = document.createElement('div');
  date.className = 'event-date';
  date.innerHTML = '<div class="event-subhead">Date</div><div class="event-date-value">' + formatDate(ev.date) + '</div>';

  const desc = document.createElement('div');
  desc.className = 'event-desc';
  desc.innerHTML = '<div class="event-subhead">Description</div><div class="event-desc-text">' + (ev.description || '') + '</div>';

  const regsWrap = document.createElement('div');
  regsWrap.className = 'event-registrations';
  regsWrap.innerHTML = '<div class="event-subhead">Current Registrations</div>';
  const badges = document.createElement('div');
  badges.className = 'registration-badges';
    (ev.registrations||[]).forEach(r=>{ const b = document.createElement('span'); b.className = 'reg-badge reg-'+r; b.textContent = capitalize(r); badges.appendChild(b); });
    regsWrap.appendChild(badges);

    const actions = document.createElement('div'); actions.className = 'event-actions';
    const lbl = document.createElement('div'); lbl.className='register-label'; lbl.innerHTML = '<strong>Register as:</strong>';
    const btns = document.createElement('div'); btns.className='register-buttons';
    roles.forEach(role =>{
      const b = document.createElement('button'); b.className='register-btn'; b.dataset.role = role; b.textContent = capitalize(role);
      b.addEventListener('click', ()=>{ addToCart({eventId:ev.id, role}); renderCart(); disableButtonsFor(ev.id); });
      btns.appendChild(b);
    });
    actions.appendChild(lbl); actions.appendChild(btns);

    art.appendChild(price); art.appendChild(title); art.appendChild(organizer); art.appendChild(date); art.appendChild(desc); art.appendChild(regsWrap); art.appendChild(actions);
    container.appendChild(art);
  });
  setEvents(events);
}

function disableButtonsFor(eventId){ const card = document.querySelector(`.event-card[data-id="${eventId}"]`); if(!card) return; card.classList.add('in-cart'); card.querySelectorAll('.register-btn').forEach(b=>b.setAttribute('disabled','')); }

export function applyRegistrationsToCards(state){
  document.querySelectorAll('.event-card').forEach(card=>{ const id = card.dataset.id; card.classList.remove('in-cart'); const m = card.querySelector('.in-cart-label'); if(m) m.remove(); });
  state.cart.forEach(entry =>{ const c = document.querySelector(`.event-card[data-id="${entry.eventId}"]`); if(c){ c.classList.add('in-cart'); let marker = c.querySelector('.in-cart-label'); if(!marker){ marker = document.createElement('div'); marker.className = 'in-cart-label'; c.appendChild(marker); } marker.textContent = 'In cart: '+ capitalize(entry.role); c.querySelectorAll('.register-btn').forEach(b=>b.setAttribute('disabled','')); } });
  state.myEvents.forEach(eid=>{ const c = document.querySelector(`.event-card[data-id="${eid}"]`); if(c){ let m = c.querySelector('.registered-badge'); if(!m){ m = document.createElement('span'); m.className = 'registered-badge'; m.textContent = 'Registered'; c.querySelector('.registration-badges')?.appendChild(m); } } });
}
