/* ================================================
   CHATAPP — script.js 
   ================================================ */

/* ── CHAT DATA ── */
const chatData = {
  preetam:    { name:'Preetam Chemistry',         initials:'PC', av:'av1', status:'Online',      messages:[
    {t:'recv',txt:'Hey! How are you?',          time:'4:38 PM'},
    {t:'sent',txt:"I'm doing great! Just finished a project I've been working on.",time:'4:40 PM'},
    {t:'recv',txt:'That sounds awesome! What was it about?', time:'4:42 PM'},
    {t:'sent',txt:"It's a messaging app design. Want to see it?",time:'4:43 PM'},
    {t:'recv',txt:'Absolutely! Send it over',  time:'4:42 PM'},
    {t:'recv',txt:"I'd love to give you some feedback",time:'4:42 PM'},
  ]},
  devteam: { name:'Dev Team ',       initials:'DT', av:'av7', status:'3 members online', messages:[
    {t:'recv',txt:'Team standup in 5 mins',         time:'9:00 AM'},
    {t:'sent',txt:'On my way 💻',                   time:'9:01 AM'},
    {t:'recv',txt:'Ravi: Push the update ASAP!',    time:'9:10 AM'},
    {t:'sent',txt:'Done! Pushed to main branch ✅', time:'9:25 AM'},
  ]},
  mom:     { name:'Maa',            initials:'Ma', av:'av8', status:'last seen 1h ago', messages:[
    {t:'recv',txt:'Beta, did you have lunch?',      time:'Yesterday'},
    {t:'sent',txt:'Yes mom, had rice and dal 😊',   time:'Yesterday'},
    {t:'recv',txt:'Good! Drink water too ❤️',       time:'Yesterday'},
    {t:'recv',txt:'Did you eat? Call me!',           time:'Yesterday'},
  ]},
};

/* ── APP STATE ── */
let activeChatId  = null;
let activeView    = 'welcome';
let editTarget    = null;
let replyTimer    = null;

const autoReplies = [
  "Got it, thanks ",
  "Totally agree ",
  "Amazing! ","On it! "
];

/* ════════════════════════════════
   UTILITY FUNCTIONS 
   ════════════════════════════════ */

function getTime() {
  return new Date().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });
}

function showToast(msg, ms = 2200) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.remove('hidden');
  clearTimeout(t._tid);
  t._tid = setTimeout(() => t.classList.add('hidden'), ms);
}

function showModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('hidden');
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('hidden');
}

/* Close modal when clicking the background */
function modalBgClick(e, id) {
  if (e.target === e.currentTarget) closeModal(id);
}

function closeAttach() {
  document.getElementById('attachPopup').classList.add('hidden');
  showToast('Feature coming soon!');
}

/* ════════════════════════════════
   VIEW SWITCHING
   ════════════════════════════════ */

function switchRightView(name) {
  /* Hide all views */
  document.querySelectorAll('.rp-view').forEach(v => {
    v.classList.remove('active');
    v.classList.add('hidden');
  });

  /* Show target */
  const el = document.getElementById('view-' + name);
  if (el) {
    el.classList.remove('hidden');
    el.classList.add('active');
  }
  activeView = name;
  document.body.setAttribute('data-view', name);

  /* Update bottom-nav active state */
  const navMap = { chat:'chats', calls:'calls', community:'community', profile:'profile', settings:'profile', starred:'chats', welcome:'chats' };
  const navKey = navMap[name] || name;
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.view === navKey));

  /* On mobile: close sidebar */
  if (window.innerWidth <= 768) closeSidebar();

  /* Close all dropdowns */
  closeAllDropdowns();
}

/* ════════════════════════════════
   LOAD CHAT
   ════════════════════════════════ */

function loadChat(id) {
  const data = chatData[id];
  if (!data) return;
  activeChatId = id;

  /* Update chat header */
  document.getElementById('chatHdrName').textContent   = data.name;
  document.getElementById('chatHdrStatus').textContent = data.status;
  const av = document.getElementById('chatHdrAvatar');
  av.textContent = data.initials;
  av.className   = 'chat-hdr-avatar ' + data.av;

  /* Render messages */
  const area = document.getElementById('messagesArea');
  area.innerHTML = '<div class="date-chip"><span>Today</span></div>';
  data.messages.forEach(m => area.appendChild(makeBubble(m.t, m.txt, m.time)));

  /* Add typing bubble at end */
  const tb = document.createElement('div');
  tb.className = 'typing-bubble';
  tb.id = 'typingBubble';
  tb.innerHTML = '<div class="t-dots"><span></span><span></span><span></span></div>';
  tb.style.display = 'none';
  area.appendChild(tb);

  scrollBottom();
  switchRightView('chat');

  /* Mark contact as active */
  document.querySelectorAll('.contact-card').forEach(c =>
    c.classList.toggle('active-card', c.dataset.id === id)
  );
}

function makeBubble(type, text, time) {
  const div = document.createElement('div');
  div.classList.add('msg', type === 'sent' ? 'sent' : 'received');
  const tick = type === 'sent'
    ? ' <i class="fa-solid fa-check-double" style="font-size:10px;opacity:.7"></i>'
    : '';
  div.innerHTML = `<p>${text}</p><span class="msg-time">${time}${tick}</span>`;
  return div;
}

function scrollBottom() {
  const a = document.getElementById('messagesArea');
  if (a) a.scrollTop = a.scrollHeight;
}

/* ════════════════════════════════
   SEND MESSAGE
   ════════════════════════════════ */

function sendMessage() {
  const input = document.getElementById('msgInput');
  const text  = (input.value || '').trim();
  if (!text || !activeChatId) return;

  const area = document.getElementById('messagesArea');
  const tb   = document.getElementById('typingBubble');

  /* Add sent bubble */
  const b = makeBubble('sent', text, getTime());
  area.insertBefore(b, tb);

  /* Update sidebar preview */
  const preview = document.querySelector(`.contact-card[data-id="${activeChatId}"] .card-preview`);
  if (preview) preview.textContent = text;

  /* Save */
  chatData[activeChatId].messages.push({ t:'sent', txt:text, time:getTime() });

  input.value = '';
  scrollBottom();

  /* Close panels */
  document.getElementById('attachPopup').classList.add('hidden');
  document.getElementById('emojiPanel').classList.add('hidden');

  /* Simulate reply */
  clearTimeout(replyTimer);
  if (tb) tb.style.display = 'flex';
  scrollBottom();

  replyTimer = setTimeout(() => {
    if (tb) tb.style.display = 'none';
    const reply = autoReplies[Math.floor(Math.random() * autoReplies.length)];
    const rb = makeBubble('recv', reply, getTime());
    area.insertBefore(rb, document.getElementById('typingBubble'));
    chatData[activeChatId].messages.push({ t:'recv', txt:reply, time:getTime() });
    scrollBottom();
  }, 1600 + Math.random() * 900);
}
  function triggerCall(voice){
  showToast(`${voice} call feature coming soon`);
}
/* ════════════════════════════════
   SEARCH
   ════════════════════════════════ */

function initSearch() {
  const inp    = document.getElementById('searchInput');
  const clr    = document.getElementById('searchClearBtn');
  const cards  = document.querySelectorAll('.contact-card[data-name]');
  const noRes  = document.getElementById('noResults');

  inp.addEventListener('input', () => {
    const q = inp.value.toLowerCase().trim();
    clr.classList.toggle('hidden', q === '');
    let vis = 0;
    cards.forEach(c => {
      const show = c.dataset.name.toLowerCase().includes(q);
      c.classList.toggle('hidden', !show);
      if (show) vis++;
    });
    if (noRes) noRes.classList.toggle('hidden', vis > 0);
  });
}

function clearSearch() {
  const inp  = document.getElementById('searchInput');
  const clr  = document.getElementById('searchClearBtn');
  const noRes = document.getElementById('noResults');
  inp.value = '';
  clr.classList.add('hidden');
  document.querySelectorAll('.contact-card[data-name]').forEach(c => c.classList.remove('hidden'));
  if (noRes) noRes.classList.add('hidden');
}

/* ════════════════════════════════
   FILTER TABS
   ════════════════════════════════ */

function initFilterTabs() {
  const tabs  = document.querySelectorAll('.ftab');
  const cards = document.querySelectorAll('.contact-card[data-type]');
  const noRes = document.getElementById('noResults');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const f = tab.dataset.f;
      let vis = 0;
      cards.forEach(c => {
        const show = f === 'all' || c.dataset.type === f;
        c.classList.toggle('hidden', !show);
        if (show) vis++;
      });
      if (noRes) noRes.classList.toggle('hidden', vis > 0);
    });
  });
}

/* ════════════════════════════════
   CALLS FILTER
   ════════════════════════════════ */

function initCallsFilter() {
  document.querySelectorAll('.ptab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.ptab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const f = tab.dataset.cf;
      document.querySelectorAll('.call-item').forEach(r => {
        r.classList.toggle('hidden', f !== 'all' && r.dataset.ct !== f);
      });
    });
  });
}

/* ════════════════════════════════
   SIDEBAR BOTTOM NAV
   ════════════════════════════════ */

function initSidebarNav() {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const v = btn.dataset.view;
      if (v === 'chats') {
        if (window.innerWidth <= 768) {
          activeChatId = null;
          document.querySelectorAll('.contact-card').forEach(c => c.classList.remove('active-card'));
          switchRightView('welcome');
        } else {
          if (activeChatId) switchRightView('chat');
          else switchRightView('welcome');
        }
      } else {
        switchRightView(v);
      }
    });
  });
}

/* ════════════════════════════════
   CONTACT CARDS
   ════════════════════════════════ */

function initContactCards() {
  document.querySelectorAll('.contact-card[data-id]').forEach(card => {
    card.addEventListener('click', () => {
      loadChat(card.dataset.id);
      /* Make "Chats" nav active */
      document.querySelectorAll('.nav-btn').forEach(b =>
        b.classList.toggle('active', b.dataset.view === 'chats')
      );
    });
  });
}

/* ════════════════════════════════
   CHAT INPUT + PANELS
   ════════════════════════════════ */

function initChatInput() {
  /* Send */
  document.getElementById('sendBtn').addEventListener('click', sendMessage);
  document.getElementById('msgInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') sendMessage();
  });

  /* Attach */
  const attachBtn   = document.getElementById('attachBtn');
  const attachPopup = document.getElementById('attachPopup');
  attachBtn.addEventListener('click', e => {
    e.stopPropagation();
    attachPopup.classList.toggle('hidden');
    document.getElementById('emojiPanel').classList.add('hidden');
  });

  /* Emoji */
  const emojiBtn   = document.getElementById('emojiBtn');
  const emojiPanel = document.getElementById('emojiPanel');
  emojiBtn.addEventListener('click', e => {
    e.stopPropagation();
    emojiPanel.classList.toggle('hidden');
    attachPopup.classList.add('hidden');
  });

  /* Emoji character click */
  document.querySelector('.emoji-scroll').addEventListener('click', e => {
    const ch = e.target.textContent.trim();
    if (ch) {
      const inp = document.getElementById('msgInput');
      inp.value += [...ch][0];
      inp.focus();
    }
  });

  /* Chat header dots */
  const chatDotsBtn  = document.getElementById('chatDotsBtn');
  const chatDropdown = document.getElementById('chatDropdown');
  chatDotsBtn.addEventListener('click', e => {
    e.stopPropagation();
    chatDropdown.classList.toggle('hidden');
    document.getElementById('sidebarDropdown').classList.add('hidden');
  });

  /* Back button (mobile) */
  document.getElementById('chatBackBtn').addEventListener('click', () => {
    activeChatId = null;
    document.querySelectorAll('.contact-card').forEach(c => c.classList.remove('active-card'));
    switchRightView('welcome');
  });
}

/* ════════════════════════════════
   SIDEBAR HEADER MENU
   ════════════════════════════════ */

function initSidebarMenu() {
  const btn  = document.getElementById('sidebarDotsBtn');
  const menu = document.getElementById('sidebarDropdown');
  btn.addEventListener('click', e => {
    e.stopPropagation();
    menu.classList.toggle('hidden');
    document.getElementById('chatDropdown').classList.add('hidden');
  });
}

/* Close all dropdowns */
function closeAllDropdowns() {
  document.querySelectorAll('.dropdown-menu').forEach(m => m.classList.add('hidden'));
}

/* ════════════════════════════════
   MOBILE SIDEBAR
   ════════════════════════════════ */

function initMobileSidebar() {
  const mobileBtn = document.getElementById('mobileMenuBtn');
  const overlay   = document.getElementById('sidebarOverlay');
  if (mobileBtn) {
    mobileBtn.addEventListener('click', () => {
      document.getElementById('sidebar').classList.add('open');
      overlay.classList.remove('hidden');
    });
  }
}

function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  const ov = document.getElementById('sidebarOverlay');
  if (ov) ov.classList.add('hidden');
}

/* ════════════════════════════════
   PROFILE EDIT
   ════════════════════════════════ */

function openEdit(field, currentVal) {
  editTarget = field;
  const titles = { name:'Edit Name', about:'Edit About', email:'Edit Email', birthday:'Edit Birthday'};
  document.getElementById('editModalTitle').textContent = titles[field] || 'Edit';
  document.getElementById('editInput').value = currentVal || '';
  showModal('editModal');
}

function saveEdit() {
  const val = (document.getElementById('editInput').value || '').trim();
  if (!val) return;

  if (editTarget === 'name') {
    ['profileName','pfName','settingsName'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    });
  } else if (editTarget === 'about') {
    ['profileAbout','pfAbout'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    });
  } else if (editTarget === 'email') {
    const el = document.getElementById('pfEmail');
    if (el) el.textContent = val;
  }

  closeModal('editModal');
  showToast('Saved');
}

/* ════════════════════════════════
   SETTINGS FUNCTIONS
   ════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  /* Setup all listeners */
  initSearch();
  initFilterTabs();
  initCallsFilter();
  initSidebarNav();
  initContactCards();
  initChatInput();
  initSidebarMenu();
  initMobileSidebar();

  /* Global click → close all dropdowns + panels */
  document.addEventListener('click', () => {
    closeAllDropdowns();
    const ap = document.getElementById('attachPopup');
    const ep = document.getElementById('emojiPanel');
    if (ap) ap.classList.add('hidden');
    if (ep) ep.classList.add('hidden');
  });

  /* Load first chat on desktop */
  if (window.innerWidth > 768) {
    loadChat('preetam');
  } else {
    switchRightView('welcome');
  }

  /* Stagger contact card animations */
  document.querySelectorAll('.contact-card').forEach((c, i) => {
    c.style.animationDelay = `${i * 40}ms`;
  });
});

/* ════════════════════════════════
   THEME TOGGLE FUNCTION
   ════════════════════════════════ */
function toggleTheme() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  if (isDark) {
    document.documentElement.removeAttribute('data-theme');
  } else {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
}
