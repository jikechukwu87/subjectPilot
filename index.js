


(function() {
  let ocwOpen = false;
  let clientId = localStorage.getItem('ocw_client_id');
  if (!clientId) {
    clientId = 'web_6a38d187f2cb_' + Math.random().toString(36).substr(2,9);
    localStorage.setItem('ocw_client_id', clientId);
  }

  window.ocwToggle = function() {
    ocwOpen = !ocwOpen;
    const box = document.getElementById('ocwBox');
    box.style.display = ocwOpen ? 'flex' : 'none';
    if (ocwOpen && document.getElementById('ocwMsgs').children.length === 0) {
      ocwAddMsg('Dear Learner, I am your AI companion. What can I assist you with today?', 'bot', true);
    }
  };

  window.ocwAddMsg = function(text, sender, showAppt) {
    const msgs = document.getElementById('ocwMsgs');
    const d    = document.createElement('div');
    d.className = 'ocw-msg ' + (sender === 'bot' ? 'ocw-bot' : 'ocw-user');
    d.textContent = text;
    if (showAppt) {
      const btn = document.createElement('button');
      btn.className = 'ocw-appt-btn';
      // btn.textContent = '📅 Book an Appointment';
      btn.onclick = ocwShowApptForm;
      d.appendChild(btn);
    }
    msgs.appendChild(d);
    msgs.scrollTop = msgs.scrollHeight;
  };

  window.ocwSend = function() {
    const inp = document.getElementById('ocwInput');
    const msg = inp.value.trim();
    if (!msg) return;
    ocwAddMsg(msg, 'user');
    inp.value = '';
    const typing = document.createElement('div');
    typing.className = 'ocw-msg ocw-bot';
    typing.id = 'ocwTyping';
    typing.innerHTML = '<em style="color:#94a3b8;">Typing…</em>';
    document.getElementById('ocwMsgs').appendChild(typing);

    fetch('https://obeksai.pythonanywhere.com/api/website/chat', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        message: msg, ai_id: '7b25ac3c-d381-4f19-8557-a79a9ab26553', user_id: 'b73da917-7e9d-4987-ab2e-655345c3ce6a',
        client_id: clientId,
        conversation_id: 'website_b73da917-7e9d-4987-ab2e-655345c3ce6a_7b25ac3c-d381-4f19-8557-a79a9ab26553_' + clientId
      })
    })
    .then(r => r.json())
    .then(data => {
      const t = document.getElementById('ocwTyping');
      if (t) t.remove();
      const needsAppt = /appoint|book|schedul/i.test(msg);
      if (data.success) ocwAddMsg(data.response, 'bot', needsAppt);
      else ocwAddMsg("Sorry, something went wrong. Please try again.", 'bot');
    })
    .catch(() => {
      const t = document.getElementById('ocwTyping');
      if (t) t.remove();
      ocwAddMsg("Connection error. Please try again.", 'bot');
    });
  };

  window.ocwShowApptForm = function() {
    const msgs = document.getElementById('ocwMsgs');
    const form = document.createElement('div');
    form.className = 'ocw-msg ocw-bot';
    form.style.width = '100%';
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate()+1);
    const minDate  = tomorrow.toISOString().split('T')[0];
    form.innerHTML = `
      <div style="font-weight:700;margin-bottom:8px;color:#1f52dc;">📅 Book Appointment</div>
      <input id="oa-name"  type="text"  placeholder="Your name"  style="width:100%;padding:7px;margin-bottom:6px;border:1.5px solid #e2e8f0;border-radius:7px;font-size:.8rem;">
      <input id="oa-email" type="email" placeholder="Email"      style="width:100%;padding:7px;margin-bottom:6px;border:1.5px solid #e2e8f0;border-radius:7px;font-size:.8rem;">
      <input id="oa-date"  type="date"  min="${minDate}"       style="width:100%;padding:7px;margin-bottom:6px;border:1.5px solid #e2e8f0;border-radius:7px;font-size:.8rem;">
      <input id="oa-time"  type="time"                           style="width:100%;padding:7px;margin-bottom:6px;border:1.5px solid #e2e8f0;border-radius:7px;font-size:.8rem;">
      <select id="oa-svc" style="width:100%;padding:7px;margin-bottom:8px;border:1.5px solid #e2e8f0;border-radius:7px;font-size:.8rem;">
        <option value="consultation">Consultation</option>
        <option value="support">Support</option>
        <option value="meeting">Meeting</option>
        <option value="demo">Demo</option>
      </select>
      <div style="display:flex;gap:7px;">
        <button onclick="ocwSubmitAppt(this)" style="flex:2;background:linear-gradient(135deg,#1f52dc,#38bdf8);color:#fff;border:none;padding:9px;border-radius:8px;cursor:pointer;font-weight:700;font-size:.8rem;">Book Now</button>
        <button onclick="this.closest('.ocw-msg').remove()" style="flex:1;background:#f1f5f9;border:none;padding:9px;border-radius:8px;cursor:pointer;font-size:.8rem;">Cancel</button>
      </div>`;
    msgs.appendChild(form);
    msgs.scrollTop = msgs.scrollHeight;
  };

  window.ocwSubmitAppt = function(btn) {
    const name  = document.getElementById('oa-name').value.trim();
    const email = document.getElementById('oa-email').value.trim();
    const date  = document.getElementById('oa-date').value;
    const time  = document.getElementById('oa-time').value;
    const svc   = document.getElementById('oa-svc').value;
    if (!name || !email || !date || !time) {
      alert('Please fill in all fields.');
      return;
    }
    btn.textContent = 'Booking…'; btn.disabled = true;
    fetch('https://obeksai.pythonanywhere.com/api/website/appointments', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        client_name: name, client_email: email,
        service_type: svc, date, time, duration: 60,
        notes: 'Booked via website chatbot',
        ai_id: '7b25ac3c-d381-4f19-8557-a79a9ab26553', user_id: 'b73da917-7e9d-4987-ab2e-655345c3ce6a'
      })
    })
    .then(r => r.json())
    .then(data => {
      btn.closest('.ocw-msg').remove();
      if (data.success)
        ocwAddMsg(`✅ Appointment booked for ${date} at ${time}. Confirmation sent to ${email}.`, 'bot');
      else
        ocwAddMsg('❌ Could not book: ' + data.error, 'bot');
    })
    .catch(() => ocwAddMsg('Connection error while booking.', 'bot'));
  };

  // Auto-open after 12 s on first visit
  document.addEventListener('DOMContentLoaded', function() {
    if (!localStorage.getItem('ocw_opened')) {
      setTimeout(function() {
        ocwToggle();
        localStorage.setItem('ocw_opened', '1');
      }, 12000);
    }
  });
})();
