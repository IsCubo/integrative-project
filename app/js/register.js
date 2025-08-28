// register.js
// Client-side registration handler and QR preview/generator.
// This file does not call backend endpoints; it demonstrates the UI flow entirely on the client
// and creates a QR-like canvas image (data URL) for preview and download. Replace canvas QR
// generation with a real QR library or server endpoint when integrating with backend.

(function () {
  // Helper: simple hash to create pseudo-unique token for QR payload (client-side demo)
  function simpleHash(str) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
    return h.toString(16);
  }

  // Draw a mock QR using canvas: high-contrast square pattern based on payload hash
  function drawMockQr(canvas, payload) {
    const ctx = canvas.getContext('2d');
    const size = Math.min(canvas.width, canvas.height);
    const scale = 8; // size of modules
    const modules = Math.floor(size / scale);
    canvas.width = modules * scale;
    canvas.height = modules * scale;

    // background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // pseudo-random pattern from hash
    const seed = simpleHash(payload + Date.now().toString());
    let s = 0;
    for (let i = 0; i < seed.length; i++) s += seed.charCodeAt(i);

    // draw modules
    for (let y = 0; y < modules; y++) {
      for (let x = 0; x < modules; x++) {
        // pattern function
        const v = ((x * 31 + y * 17 + s) % 7) % 2 === 0;
        if (v) {
          ctx.fillStyle = '#111827';
          ctx.fillRect(x * scale, y * scale, scale, scale);
        }
      }
    }

    // small centered logo block
    ctx.fillStyle = '#10b981';
    const logoSize = Math.floor(scale * 3);
    const cx = Math.floor((canvas.width - logoSize) / 2);
    const cy = Math.floor((canvas.height - logoSize) / 2);
    ctx.fillRect(cx, cy, logoSize, logoSize);

    return canvas.toDataURL('image/png');
  }

  // Utility: serialize form data to an object
  function formToObj(form) {
    const fd = new FormData(form);
    const out = {};
    for (const [k, v] of fd.entries()) out[k] = v;
    return out;
  }

  // Main behavior when present on register page
  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    const qrCanvas = document.getElementById('qrPreview');
    const submitBtn = document.getElementById('submitBtn');

    // Accessibility: focus the first input on load
    window.addEventListener('DOMContentLoaded', () => {
      const first = registerForm.querySelector('input,select,textarea');
      if (first) first.focus();
    });

    registerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      // basic client validation
      const data = formToObj(registerForm);
      if (!data.fullName || !data.email || !data.role || !data.event) {
        // show inline errors (minimal): set outline
        submitBtn.classList.add('shake');
        setTimeout(() => submitBtn.classList.remove('shake'), 400);
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Generating...';

      // create payload and draw mock QR
      const payload = JSON.stringify({ name: data.fullName, email: data.email, role: data.role, event: data.event });
      setTimeout(() => {
        try {
          const dataUrl = drawMockQr(qrCanvas, payload);

          // store data in sessionStorage to pass to success page (lightweight)
          sessionStorage.setItem('eventsync_qr', dataUrl);
          sessionStorage.setItem('eventsync_attendee', JSON.stringify(data));

          // redirect to success page
          window.location.href = '/app/pages/register-success.html';
        } finally {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Register & Get QR';
        }
      }, 600);
    });
  }

  // Behavior for success page: read sessionStorage and render
  const qrImage = document.getElementById('qrImage');
  if (qrImage) {
    const dataUrl = sessionStorage.getItem('eventsync_qr');
    const attendeeRaw = sessionStorage.getItem('eventsync_attendee');
    const downloadLink = document.getElementById('downloadQr');
    const list = document.getElementById('attendeeData');

    if (!dataUrl || !attendeeRaw) {
      // nothing to show, send back to register
      qrImage.src = '';
      list.innerHTML = '<li>No registration data found. <a href="/app/pages/register.html">Register again</a></li>';
    } else {
      qrImage.src = dataUrl;
      if (downloadLink) downloadLink.href = dataUrl;

      // render attendee details
      try {
        const attendee = JSON.parse(attendeeRaw);
        list.innerHTML = '';
        const rows = [
          ['Full name', attendee.fullName],
          ['Email', attendee.email],
          ['Role', attendee.role],
          ['Event', attendee.event],
          ['Ticket ID', simpleHash(attendee.email + attendee.event).toUpperCase()]
        ];
        for (const r of rows) {
          const li = document.createElement('li');
          li.innerHTML = '<strong>' + r[0] + ':</strong> <span>' + (r[1] || '-') + '</span>';
          list.appendChild(li);
        }
      } catch (err) {
        list.innerHTML = '<li>Invalid attendee data</li>';
      }
    }
  }

})();
