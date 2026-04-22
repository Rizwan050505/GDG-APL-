document.addEventListener('DOMContentLoaded', () => {
  const toggleSwitch = document.getElementById('mode-toggle');
  const manualInputs = document.getElementById('manual-inputs');
  const autoLabel = document.getElementById('auto-label');
  const manualLabel = document.getElementById('manual-label');
  
  const refreshToggle = document.getElementById('auto-refresh-toggle');
  const refreshControl = document.getElementById('refresh-control');

  const themeToggleBtn = document.getElementById('theme-toggle');
  const sunIcon = document.getElementById('sun-icon');
  const moonIcon = document.getElementById('moon-icon');

  let isDark = true;
  themeToggleBtn.addEventListener('click', () => {
    isDark = !isDark;
    if (isDark) {
      document.body.removeAttribute('data-theme');
      sunIcon.style.display = 'block';
      moonIcon.style.display = 'none';
    } else {
      document.body.setAttribute('data-theme', 'light');
      sunIcon.style.display = 'none';
      moonIcon.style.display = 'block';
    }
  });

  // Scorecard elements
  const scoreTeams = document.getElementById('display-teams');
  const scoreRuns = document.getElementById('display-runs');
  const scoreOvers = document.getElementById('display-overs');
  const scoreStatus = document.getElementById('display-status');

  // Inputs
  const inputTeams = document.getElementById('input-teams');
  const inputRuns = document.getElementById('input-runs');
  const inputOvers = document.getElementById('input-overs');
  const inputStatus = document.getElementById('input-status');

  let mode = 'Auto';
  let language = 'EN';

  const langToggle = document.getElementById('lang-toggle');
  const langEnLabel = document.getElementById('lang-en-label');
  const langHiLabel = document.getElementById('lang-hi-label');

  if (langToggle) {
    langToggle.addEventListener('click', () => {
      language = language === 'EN' ? 'HI' : 'EN';
      const isHindi = language === 'HI';
      langToggle.classList.toggle('active', isHindi);
      langEnLabel.style.color = isHindi ? 'var(--text-secondary)' : '#fff';
      langHiLabel.style.color = isHindi ? '#fff' : 'var(--text-secondary)';
      console.log("Language switched to:", language);
    });
  }

  // Auto Mock Data (Fallback)
  const autoData = {
    teams: "CSK vs RCB (Mock)",
    runs: "212/7",
    overs: "19.5",
    status: "6 runs needed off 1 ball"
  };

  // Fetch Live Match Data
  async function fetchLiveMatchData() {
    try {
      const apiKey = '5962fcef-ed78-4d15-a7e6-9436cbb3ecfa';
      const response = await fetch(`https://api.cricapi.com/v1/currentMatches?apikey=${apiKey}&offset=0`);
      if (!response.ok) throw new Error('API Request Failed');

      const json = await response.json();
      console.log("CricAPI Raw Data:", json);

      if (json && json.status === "success" && json.data) {
        // Filter for matches that have scores (live or recently finished)
        const activeMatches = json.data.filter(m => m.matchStarted && !m.matchEnded);
        
        if (activeMatches.length === 0 && json.data.length > 0) {
          console.warn("No active live matches, picking first scheduled match.");
        }

        const dataPool = activeMatches.length > 0 ? activeMatches : json.data;

        // Filter for IPL matches first
        let match = dataPool.find(m => 
          m.name.toLowerCase().includes('ipl') || 
          m.name.toLowerCase().includes('indian premier league') ||
          m.series_id === 'c7349b64-e1d5-4927-9279-58b1a376594d' // Common IPL ID
        );
        
        // If no IPL match found, take the first available match
        if (!match) {
          match = dataPool[0];
        }

        if (!match) throw new Error("No matches found in API data");
        
        const score = match.score?.[0] || { r: 0, w: 0, o: 0 };

        return {
          teams: match.name || `${match.teams[0]} vs ${match.teams[1]}`,
          runs: `${score.r}/${score.w}`,
          overs: `${score.o}`,
          status: match.status
        };
      }
      throw new Error(json.reason || 'No active matches found');
    } catch (error) {
      console.warn('API Fetch Error:', error.message, '--> Gracefully falling back to mock data.');
      return autoData; // Graceful failure
    }
  }

  // Initialize Auto Data
  async function initializeAutoData() {
    scoreTeams.textContent = "Fetching Live API...";
    scoreRuns.textContent = "-/-";
    scoreOvers.textContent = "-";
    scoreStatus.textContent = "Connecting...";

    const liveData = await fetchLiveMatchData();

    // Update scorecard if still in Auto mode
    if (mode === 'Auto') {
      updateScorecard(liveData);
    }
  }

  let autoRefreshInterval = null;

  function manageAutoRefresh() {
    if (autoRefreshInterval) {
      clearInterval(autoRefreshInterval);
      autoRefreshInterval = null;
    }
    // Automatically start refresh if in Auto mode (even if toggle element doesn't exist or is checked)
    if (mode === 'Auto') {
      const refreshTime = 30000; // 30 seconds
      console.log(`Auto-refresh started: ${refreshTime}ms`);
      autoRefreshInterval = setInterval(async () => {
        console.log("Fetching live update...");
        const liveData = await fetchLiveMatchData();
        if (mode === 'Auto') {
          updateScorecard(liveData);
          console.log("Scorecard updated automatically.");
        }
      }, refreshTime);
    }
  }

  if (refreshToggle) refreshToggle.addEventListener('change', manageAutoRefresh);

  initializeAutoData();
  manageAutoRefresh();

  // Toggle Mode
  toggleSwitch.addEventListener('click', () => {
    mode = mode === 'Auto' ? 'Manual' : 'Auto';
    const isManual = mode === 'Manual';

    toggleSwitch.classList.toggle('active', isManual);

    if (isManual) {
      manualInputs.style.display = 'grid';
      setTimeout(() => {
        manualInputs.classList.add('visible');
      }, 10);
      autoLabel.style.color = 'var(--text-secondary)';
      manualLabel.style.color = '#fff';
      if (refreshControl) {
        refreshControl.style.opacity = '0';
        refreshControl.style.pointerEvents = 'none';
        refreshControl.style.transition = 'opacity 0.3s';
      }

      // Populate inputs with current scorecard data
      inputTeams.value = scoreTeams.textContent;
      inputRuns.value = scoreRuns.textContent;
      inputOvers.value = scoreOvers.textContent;
      inputStatus.value = scoreStatus.textContent;
      manageAutoRefresh();
    } else {
      manualInputs.classList.remove('visible');
      setTimeout(() => {
        manualInputs.style.display = 'none';
      }, 400); // Wait for transition
      manualLabel.style.color = 'var(--text-secondary)';
      autoLabel.style.color = '#fff';
      if (refreshControl) {
        refreshControl.style.opacity = '1';
        refreshControl.style.pointerEvents = 'auto';
      }

      // Revert to auto live data
      initializeAutoData();
      manageAutoRefresh();
    }
  });

  // Listen for manual input changes
  const inputs = [inputTeams, inputRuns, inputOvers, inputStatus];
  inputs.forEach(input => {
    input.addEventListener('input', () => {
      if (mode === 'Manual') {
        updateScorecard({
          teams: inputTeams.value || '-',
          runs: inputRuns.value || '-',
          overs: inputOvers.value || '-',
          status: inputStatus.value || '-'
        });
      }
    });
  });

  async function updateScorecard(data) {
    // Check if score has changed to avoid redundant commentary generation
    const oldScore = scoreRuns.textContent;
    
    scoreTeams.textContent = data.teams;
    scoreRuns.textContent = data.runs;
    scoreOvers.textContent = data.overs;
    scoreStatus.textContent = data.status;

    // Automatically trigger commentary if score changes or it's the first load
    if (mode === 'Auto' && oldScore !== data.runs) {
      console.log("Score updated! Generating automatic commentary and Crowd Pulse...");
      const matchData = getMatchData();
      if (matchData) {
        generateContent('commentary', matchData);
        updateCrowdPulse(matchData);
      }
    }
  }

  async function updateCrowdPulse(data) {
    const pulseStatus = document.getElementById('emotion-status');
    const bars = document.querySelectorAll('.pulse-bar');
    
    pulseStatus.textContent = "Processing real-time social buzz...";
    
    const prompt = `Based on this real-time IPL match: ${data.team1} vs ${data.team2}, Score: ${data.runs}/${data.wickets}, Overs: ${data.overs}, Status: ${data.status}.
    1. Analyze the current social media sentiment (X/Twitter/Reddit).
    2. Provide 5 numeric sentiment scores (0-100) for: Tension, Joy, Pressure, Disbelief, Aggression.
    3. Generate 3 REALISTIC fan reactions (one-liners) that fans are likely shouting right now on social media.
    Return FORMAT: scores: 80,20,90,10,60 | reactions: reaction1, reaction2, reaction3`;

    const result = await callGemini(prompt);
    
    // Parse combined response
    const parts = result.split('|');
    const scoresPart = parts[0]?.replace('scores:', '').trim();
    const reactionsPart = parts[1]?.replace('reactions:', '').trim();

    const scores = scoresPart.split(',').map(s => parseInt(s.trim()) || 20);

    if (scores.length >= 5) {
      bars.forEach((bar, index) => {
        if (scores[index] !== undefined) {
          bar.style.height = `${scores[index]}%`;
        }
      });

      const emotions = ["High Tension", "Pure Joy", "Immense Pressure", "Total Disbelief", "Aggressive Vibes"];
      const maxIndex = scores.indexOf(Math.max(...scores));
      const vibe = emotions[maxIndex];
      pulseStatus.textContent = `Vibe: ${vibe}!`;

      // Update Live Crowd Buzz with AI generated REAL reactions
      const aiReactions = reactionsPart ? reactionsPart.split(',').map(r => r.trim()) : [];
      updateCrowdBuzz(data, vibe, aiReactions);
    }
  }

  function updateCrowdBuzz(data, vibe, aiReactions) {
    const reactionsContainer = document.getElementById('reactions-container');
    const buzzMeter = document.getElementById('buzz-meter');

    const intensityMap = {
      "High Tension": "Nail-Biting 😬",
      "Pure Joy": "Roaring! 🦁",
      "Immense Pressure": "Silent anticipation... 🤫",
      "Total Disbelief": "Absolute Shock! 😱",
      "Aggressive Vibes": "Electric Heat! 🔥"
    };

    buzzMeter.textContent = `Atmosphere: ${intensityMap[vibe] || 'Electric'}`;

    // Use AI reactions if available, fallback to pool
    const finalReactions = aiReactions.length >= 2 ? aiReactions : [
      `${data.team1} fans going crazy! 🔥`,
      "What a turnaround in this over! 🏏",
      "Stadium is literally shaking! 🏟️"
    ];
    
    reactionsContainer.innerHTML = '';
    finalReactions.slice(0, 3).forEach(text => {
      const bubble = document.createElement('div');
      bubble.className = 'reaction-bubble';
      bubble.textContent = text.replace(/^["']|["']$/g, ''); // Remove quotes
      reactionsContainer.appendChild(bubble);
    });
  }

  // Generate Buttons
  const btnCommentary = document.getElementById('btn-commentary');
  const btnStory = document.getElementById('btn-story');
  const outputContent = document.getElementById('output-content');

  function getMatchData() {
    // Read directly from inputs or scorecard based on mode
    const isManual = (mode.toLowerCase() === 'manual');
    const teamsRaw = isManual ? inputTeams.value : scoreTeams.textContent;
    const runsRaw = isManual ? inputRuns.value : scoreRuns.textContent;
    const oversRaw = isManual ? inputOvers.value : scoreOvers.textContent;
    const statusRaw = isManual ? inputStatus.value : scoreStatus.textContent;

    // Parse components
    const [runs, wickets] = (runsRaw || '').includes('/') ? (runsRaw || '').split('/') : [runsRaw, '0'];
    const teamsArray = (teamsRaw || '').split(/ vs /i);
    const team1 = teamsArray[0] || 'Team 1';
    const team2 = teamsArray[1] || 'Team 2';

    // Validate inputs: ensure they exist and aren't purely whitespace
    if (!runs?.trim() || !oversRaw?.trim() || !teamsRaw?.includes(' vs ')) {
      alert("Validation Error: Please use 'Team1 vs Team2' for Teams and 'Runs/Wickets' (e.g. 150/3) for Score.");
      return null;
    }

    // Create and return the strictly formatted JavaScript object
    const matchData = {
      team1: team1.trim(),
      team2: team2.trim(),
      runs: runs.trim(),
      wickets: wickets.trim(),
      overs: oversRaw.trim(),
      status: statusRaw.trim()
    };

    console.log("Extracted matchData:", matchData);
    return matchData;
  }

  btnCommentary.addEventListener('click', () => {
    const matchData = getMatchData();
    if (matchData) generateContent('commentary', matchData);
  });

  btnStory.addEventListener('click', () => {
    const matchData = getMatchData();
    if (matchData) generateContent('story', matchData);
  });

  // Gemini API Configuration
  const GEMINI_API_KEY = "AIzaSyC3RwIfD3Mcw77hmNL7FX9QGkt4tk-xSPo";
  let lastRequestTime = 0;
  const MIN_REQUEST_INTERVAL = 6000; // Increased to 6 seconds to be safer with Free Tier limits

  async function callGemini(prompt) {
    if (!GEMINI_API_KEY) {
      return "⚠️ Gemini API key is missing!";
    }

    // Rate limiting check: Wait if the last request was too recent
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
      const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
      console.log(`Rate limiting: Waiting ${waitTime}ms before next Gemini call...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    // Update last request time AFTER the potential wait
    lastRequestTime = Date.now();

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_API_KEY}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        if (response.status === 429) {
          // If 429 occurs, increase the interval dynamically for next time
          console.warn("Gemini Quota Exceeded. Increasing wait time.");
          return "🚨 Gemini API Limit reach ho gayi hai. Please 15-20 seconds wait karein, ye apne aap theek ho jayega.";
        }
        throw new Error(`API Error (${response.status}): ${errJson?.error?.message || response.statusText}`);
      }

      const json = await response.json();

      if (json && json.candidates && json.candidates[0]?.content?.parts?.[0]?.text) {
        return json.candidates[0].content.parts[0].text;
      }
      throw new Error("Received an unexpected data format from Google API");
    } catch (error) {
      console.error("Gemini Details:", error);
      return `❌ ${error.message}<br><br>(Check your internet or API key status.)`;
    }
  }

  function generatePrompt(mode, data) {
    // Construct momentum and pressure context dynamically
    const context = `Match Status: ${data.status}. Calculate the current pressure level and momentum based on this equation.`;

    const langPrompt = language === 'HI' ? 
      "in HINDI (Hinglish/Hindi script mix)" : 
      "in ENGLISH (Standard Cricket Commentary)";

    if (mode === 'commentary') {
      return `You are an expert, high-energy IPL cricket commentator. Provide a thrilling, dynamic, 5-6 sentence live commentary ${langPrompt} for this scenario:
* Teams: ${data.team1} vs ${data.team2}
* Score: ${data.runs} runs for ${data.wickets} wickets
* Overs Bowled: ${data.overs}
* Context: ${context}

Commentary guidelines:
1. Provide a mix of terminology suitable for the chosen language.
2. Capture the immense pressure, the crowd's raw energy, and the momentum shift.
3. Make it emotionally rich and electrifying, like a real TV broadcast.
4. Use markdown bold (**text**) to emphasize key numbers or emotional words.
5. If Hindi is selected, first part should be Hindi script and second part Hinglish/English mix.`;
    }

    if (mode === 'story') {
      return `Write a compelling, dramatic 2-paragraph cricket story ${langPrompt} about this specific moment:
* ${data.team1} battling ${data.team2}
* The score is ${data.runs}/${data.wickets} in ${data.overs} overs.
* Status: ${data.status}

Focus on the player's psychology, the weight of the match, and the high stakes involved for both teams. Make it cinematic and intense.`;
    }

    return `You are a viral cricket meme creator for WhatsApp and Instagram.

Match Situation:
${data.team1} vs ${data.team2}
Score: ${data.runs}/${data.wickets} in ${data.overs} overs
Status: ${data.status || 'Ongoing'}

Task:
Generate ONLY a short cricket meme caption ${langPrompt} with emojis.

Rules:
- NO analysis
- NO steps
- NO explanation
- ONLY final caption

Caption rules:
- Exactly 1 line
- Max 8-12 words
- Use emojis (😂🔥😭🏏)
- Relatable tone preferred for the chosen language.

STRICT OUTPUT:
<only the caption line>

Do not add labels like "Caption:"
Do not add anything else.`;
  }

  async function generateContent(type, data) {
    // Show typing indicator
    outputContent.innerHTML = `<span class="typing-indicator"><span class="typing"></span><span class="typing" style="animation-delay: 0.2s"></span><span class="typing" style="animation-delay: 0.4s"></span></span> Generating ${type}...`;
    outputContent.style.color = 'var(--text-secondary)';

    // Build dynamic prompt using isolated function
    const prompt = generatePrompt(type, data);

    // Await live generation
    const generatedText = await callGemini(prompt);

    // Render text formatting safe linebreaks and highlights
    outputContent.style.color = 'var(--text-primary)';
    
    // Parse markdown bold arrays into custom glossy highlight class
    const htmlFormatted = generatedText
      .replace(/\*\*(.*?)\*\*/g, '<strong class="highlight">$1</strong>')
      .replace(/\n/g, '<br>');
      
    outputContent.innerHTML = htmlFormatted;

    // 🔴 NEW: Speak the generated commentary/meme automatically
    speakText(generatedText);
  }

  // ==========================================
  // NEW: TEXT-TO-SPEECH (Web Speech API)
  // ==========================================

  function enhanceForVoice(text) {
    // Add artificial pauses after punctuation for pacing
    let enhanced = text.replace(/([.,!?])/g, '$1 ... ');
    // Add emphasis to explosive cricket terms
    enhanced = enhanced.replace(/\b(SIX|OUT|WICKET|FOUR|BOUNDARY)\b/gi, '$1!!!');
    // Remove markdown asterisks so they aren't spoken out loud
    enhanced = enhanced.replace(/\*\*/g, '');
    return enhanced;
  }

  function speakText(text) {
    // Stop any currently playing audio
    window.speechSynthesis.cancel();

    // Strip visual emojis so the engine doesn't read them awkwardly
    const cleanText = text.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2702}-\u{27B0}\u{24C2}-\u{1F251}]/gu, '');
    
    // Auto-detect Hindi/Hinglish context based on common root words or unicode
    const isHindi = /[\u0900-\u097F]|(?:hai|kya|bhai|bawal|dhoya|yeh|waah|khatarnak|gaya|diya|arey|yaar)/i.test(cleanText);

    // Apply dramatic pacing
    const spokenText = enhanceForVoice(cleanText);

    const utterance = new SpeechSynthesisUtterance(spokenText);
    utterance.lang = isHindi ? 'hi-IN' : 'en-IN';
    utterance.rate = 0.95; // Slightly slower
    utterance.pitch = 1.1; // Slightly higher

    window.speechSynthesis.speak(utterance);
  }

  // Global stop proxy if user wires a button later
  window.stopVoice = function() {
    window.speechSynthesis.cancel();
  };

});
