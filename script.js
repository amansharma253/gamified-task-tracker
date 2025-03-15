// IndexedDB Setup
const dbPromise = idb.openDB('QuestMaster', 1, {
  upgrade(db) {
    db.createObjectStore('quests', { keyPath: 'id' });
    db.createObjectStore('state', { keyPath: 'key' });
  }
});

// State
let quests = [];
let essence = 0;
let currentFilter = 'All';
let isDarkMode = false;
let guild = [];

// DOM
const questForm = document.getElementById('quest-form');
const questInput = document.getElementById('quest-input');
const questDueDate = document.getElementById('quest-due-date');
const questPriority = document.getElementById('quest-priority');
const questRealm = document.getElementById('quest-realm');
const questList = document.getElementById('quest-list');
const filterRunes = document.querySelectorAll('.filter-rune');
const essenceDisplay = document.getElementById('essence');
const progressFill = document.getElementById('progress-fill');
const rankDisplay = document.getElementById('rank');
const themeToggle = document.getElementById('theme-toggle');
const voiceBtn = document.getElementById('voice-btn');
const guildBtn = document.getElementById('guild-btn');
const guildLodge = document.getElementById('guild-lodge');
const guildScrolls = document.getElementById('guild-scrolls');
const guildScroll = document.getElementById('guild-scroll');
const etchScroll = document.getElementById('etch-scroll');
const inviteAlly = document.getElementById('invite-ally');

// Persistence
async function saveData() {
  const db = await dbPromise;
  const tx = db.transaction(['quests', 'state'], 'readwrite');
  await Promise.all(quests.map(quest => tx.objectStore('quests').put(quest)));
  await tx.objectStore('state').put({ key: 'essence', value: essence });
  await tx.objectStore('state').put({ key: 'darkMode', value: isDarkMode });
  await tx.objectStore('state').put({ key: 'guild', value: guild });
  await tx.done;
}

async function loadData() {
  const db = await dbPromise;
  quests = (await db.getAll('quests')) || [];
  const essenceData = await db.get('state', 'essence');
  const darkModeData = await db.get('state', 'darkMode');
  const guildData = await db.get('state', 'guild');
  essence = essenceData?.value || 0;
  isDarkMode = darkModeData?.value || false;
  guild = guildData?.value || [];
}

// Render Quests
function renderQuests() {
  questList.innerHTML = '';
  const today = new Date().toISOString().split('T')[0];
  const filteredQuests = currentFilter === 'All' ? quests :
                        currentFilter === 'Completed' ? quests.filter(q => q.completed) :
                        quests.filter(q => q.realm === currentFilter && !q.completed);
  filteredQuests.forEach(quest => {
    const isOverdue = quest.dueDate && quest.dueDate < today && !quest.completed;
    const li = document.createElement('li');
    li.className = `quest-item ${quest.completed ? 'completed' : ''} ${isOverdue ? 'overdue' : ''}`;
    li.innerHTML = `
      <span>${quest.name} (${quest.realm}) ${quest.dueDate ? `- Due: ${quest.dueDate}` : ''} [${quest.priority}]</span>
      <div class="quest-actions">
        <button class="complete-btn ${quest.completed ? 'completed' : ''}" data-id="${quest.id}">${quest.completed ? 'Unforge' : 'Complete'}</button>
        <button class="delete-btn" data-id="${quest.id}">Banish</button>
      </div>
    `;
    questList.appendChild(li);
  });
  updateLegend();
}

// Update Legend
function updateLegend() {
  essenceDisplay.textContent = `Essence: ${essence}`;
  const ranks = [
    { name: 'Outcast', threshold: 0 },
    { name: 'Seeker', threshold: 50 },
    { name: 'Guardian', threshold: 100 },
    { name: 'Champion', threshold: 200 },
    { name: 'Legend', threshold: 500 }
  ];
  const currentRank = ranks.reduce((prev, curr) => essence >= curr.threshold ? curr : prev, ranks[0]);
  const nextRank = ranks.find(r => r.threshold > essence) || currentRank;
  rankDisplay.textContent = `Rank: ${currentRank.name}`;
  const progress = nextRank.threshold === currentRank.threshold ? 100 : ((essence - currentRank.threshold) / (nextRank.threshold - currentRank.threshold)) * 100;
  progressFill.style.width = `${Math.min(progress, 100)}%`;
}

// Add Quest
questForm.addEventListener('submit', async e => {
  e.preventDefault();
  const quest = {
    id: Date.now(),
    name: questInput.value.trim(),
    dueDate: questDueDate.value || null,
    priority: questPriority.value,
    realm: questRealm.value,
    completed: false
  };
  quests.push(quest);
  await saveData();
  questInput.value = '';
  questDueDate.value = '';
  renderQuests();
});

// Voice Input
voiceBtn.addEventListener('click', () => {
  if (!('webkitSpeechRecognition' in window)) {
    alert('Voice input not supported in this browser.');
    return;
  }
  const recognition = new webkitSpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = 'en-US';
  recognition.start();
  recognition.onresult = (event) => {
    const spokenText = event.results[0][0].transcript.toLowerCase();
    questInput.value = spokenText;
    if (spokenText.includes('tomorrow')) questDueDate.value = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    if (spokenText.includes('urgent')) questPriority.value = 'High';
    recognition.stop();
  };
});

// Quest Actions
questList.addEventListener('click', async e => {
  const id = parseInt(e.target.dataset.id);
  const essenceRewards = { 'Low': 10, 'Medium': 20, 'High': 50 };
  if (e.target.classList.contains('complete-btn')) {
    const quest = quests.find(q => q.id === id);
    quest.completed = !quest.completed;
    if (quest.completed) {
      essence += essenceRewards[quest.priority];
      confetti({ particleCount: 100, spread: 70 });
    } else {
      essence = Math.max(0, essence - essenceRewards[quest.priority]);
    }
    await saveData();
    renderQuests();
  }
  if (e.target.classList.contains('delete-btn')) {
    quests = quests.filter(q => q.id !== id);
    await saveData();
    renderQuests();
  }
});

// Filter Quests
filterRunes.forEach(rune => {
  rune.addEventListener('click', () => {
    filterRunes.forEach(r => r.classList.remove('active'));
    rune.classList.add('active');
    currentFilter = rune.dataset.filter;
    renderQuests();
  });
});

// Guild Logic
guildBtn.addEventListener('click', () => {
  guildLodge.style.display = guildLodge.style.display === 'none' ? 'block' : 'none';
});

etchScroll.addEventListener('click', () => {
  if (guildScroll.value.trim()) {
    guild.push({ lord: 'Wanderer', scroll: guildScroll.value.trim(), essence });
    guildScroll.value = '';
    updateGuild();
    saveData();
  }
});

inviteAlly.addEventListener('click', () => {
  const allies = ['Eldric', 'Lyra', 'Thane', 'Mira', 'Kael'];
  const randomAlly = allies[Math.floor(Math.random() * allies.length)];
  guild.push({ lord: randomAlly, scroll: `${randomAlly} has joined the guild!`, essence: Math.floor(Math.random() * 100) });
  updateGuild();
  saveData();
});

function updateGuild() {
  guild.sort((a, b) => b.essence - a.essence);
  guildScrolls.innerHTML = guild.slice(0, 5).map(g => `<li>${g.lord}: ${g.scroll} (${g.essence})</li>`).join('');
}

// Theme Toggle
themeToggle.addEventListener('click', async () => {
  isDarkMode = !isDarkMode;
  document.body.classList.toggle('dark-mode', isDarkMode);
  themeToggle.textContent = isDarkMode ? '☀️' : '🌙';
  await saveData();
});

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  await loadData();
  document.body.classList.toggle('dark-mode', isDarkMode);
  themeToggle.textContent = isDarkMode ? '☀️' : '🌙';
  renderQuests();
  updateGuild();
});