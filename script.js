/* ═══════════════════════════════════════════════════════════
   Neurowell — Script
   Navigation · BMI Calculator · Meal Plan · Neuro AI Chatbot
   ═══════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

    /* ──────────────── DOM REFS ──────────────── */

    // Nav
    const navLinks = document.querySelectorAll('.nav-link');
    const mobileLinks = document.querySelectorAll('.mobile-link');
    const hamburger = document.getElementById('hamburger');
    const mobileNav = document.getElementById('mobile-nav');
    const sections = document.querySelectorAll('.app-section');

    // BMI
    const bmiForm = document.getElementById('bmi-form');
    const heightInput = document.getElementById('height-input');
    const weightInput = document.getElementById('weight-input');
    const heightError = document.getElementById('height-error');
    const weightError = document.getElementById('weight-error');
    const bmiResult = document.getElementById('bmi-result');
    const bmiValue = document.getElementById('bmi-value');
    const bmiCategory = document.getElementById('bmi-category');
    const ageInput = document.getElementById('age-input');
    const genderSelect = document.getElementById('gender-select');
    const ageError = document.getElementById('age-error');
    const genderError = document.getElementById('gender-error');
    const calValue = document.getElementById('cal-value');
    const mealPlanCard = document.getElementById('meal-plan-card');
    const mealCalTarget = document.getElementById('meal-cal-target');
    const mealsList = document.getElementById('meals-list');
    const refreshBtn = document.getElementById('refresh-meals-btn');
    const questionnaireOverlay = document.getElementById('questionnaire-overlay');
    const questionnaireForm = document.getElementById('questionnaire-form');

    // Chat
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input-field');
    const chatMessages = document.getElementById('chat-messages');


    /* ════════════════════════════════════════════
       1. NAVIGATION LOGIC
       ════════════════════════════════════════════ */

    function switchSection(sectionId) {
        sections.forEach(s => s.classList.toggle('active', s.id === `section-${sectionId}`));
        navLinks.forEach(link => link.classList.toggle('active', link.dataset.section === sectionId));
        mobileLinks.forEach(link => link.classList.toggle('active', link.dataset.section === sectionId));
        closeMobileMenu();
        if (sectionId === 'chat') setTimeout(() => chatInput.focus(), 150);
    }

    navLinks.forEach(link => link.addEventListener('click', () => switchSection(link.dataset.section)));
    mobileLinks.forEach(link => link.addEventListener('click', () => switchSection(link.dataset.section)));

    function closeMobileMenu() {
        mobileNav.classList.remove('open');
        hamburger.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
    }

    hamburger.addEventListener('click', () => {
        const isOpen = mobileNav.classList.contains('open');
        mobileNav.classList.toggle('open');
        hamburger.classList.toggle('open');
        hamburger.setAttribute('aria-expanded', String(!isOpen));
    });


    /* ════════════════════════════════════════════
       2. BMI CALCULATOR
       ════════════════════════════════════════════ */

    let userProfile = {};
    let refreshCount = 0;
    let userPreferences = null;

    function clearErrors() {
        [heightError, weightError, ageError, genderError].forEach(el => el.textContent = '');
        [heightInput, weightInput, ageInput, genderSelect].forEach(el => el.parentElement.classList.remove('has-error'));
    }

    function setError(inputEl, errorEl, msg) {
        errorEl.textContent = msg;
        inputEl.parentElement.classList.add('has-error');
    }

    function calculateCalories(weight, heightCm, age, gender) {
        const s = gender === 'male' ? 5 : -161;
        const bmr = (10 * weight) + (6.25 * heightCm) - (5 * age) + s;
        return Math.round(bmr * 1.375);
    }

    async function handleBMI(e) {
        e.preventDefault();
        clearErrors();
        const a = ageInput.value.trim(), g = genderSelect.value;
        const h = heightInput.value.trim(), w = weightInput.value.trim();
        let valid = true;

        if (!a || isNaN(a) || Number(a) <= 0 || Number(a) > 120) { setError(ageInput, ageError, 'Enter a valid age.'); valid = false; }
        if (!g) { setError(genderSelect, genderError, 'Select your gender.'); valid = false; }
        if (!h || isNaN(h) || Number(h) <= 0) { setError(heightInput, heightError, 'Enter a valid height.'); valid = false; }
        if (!w || isNaN(w) || Number(w) <= 0) { setError(weightInput, weightError, 'Enter a valid weight.'); valid = false; }

        if (!valid) { bmiResult.classList.add('hidden'); mealPlanCard.classList.add('hidden'); return; }

        const age = Number(a), heightCm = Number(h), weightKg = Number(w);
        const bmi = weightKg / ((heightCm / 100) ** 2);
        const calories = calculateCalories(weightKg, heightCm, age, g);
        userProfile = { age, gender: g, heightCm, weightKg, bmi: Math.round(bmi * 100) / 100, calories };

        showBMIResult(bmi, calories);
        refreshCount = 0;
        userPreferences = null;
        mealPlanCard.classList.remove('hidden');
        showReadyMadeMeals(0);
    }

    function showBMIResult(bmi, calories) {
        const r = Math.round(bmi * 100) / 100;
        let cat, cls;
        if (r < 18.5) { cat = 'Underweight'; cls = 'cat-underweight'; }
        else if (r <= 24.9) { cat = 'Normal'; cls = 'cat-normal'; }
        else if (r <= 29.9) { cat = 'Overweight'; cls = 'cat-overweight'; }
        else { cat = 'Obese'; cls = 'cat-obese'; }
        bmiValue.textContent = r.toFixed(2);
        bmiValue.className = `result-value ${cls}`;
        bmiCategory.textContent = cat;
        bmiCategory.className = `result-category ${cls}`;
        calValue.textContent = calories;
        mealCalTarget.textContent = calories;
        bmiResult.classList.remove('hidden');
    }

    [heightInput, weightInput, ageInput].forEach(el => {
        el.addEventListener('input', () => { clearErrors(); bmiResult.classList.add('hidden'); mealPlanCard.classList.add('hidden'); });
    });
    genderSelect.addEventListener('change', () => { clearErrors(); bmiResult.classList.add('hidden'); mealPlanCard.classList.add('hidden'); });
    bmiForm.addEventListener('submit', handleBMI);


    /* ════════════════════════════════════════════
       3. MEAL PLAN (Ready-made → Popup → API)
       ════════════════════════════════════════════ */

    const readyMadeMeals = [
        [
            { meal: 'Breakfast', name: 'Oatmeal with banana and honey', calories: 350, protein: 10, carbs: 58, fat: 8 },
            { meal: 'Mid-Morning Snack', name: 'Greek yogurt with mixed berries', calories: 200, protein: 15, carbs: 22, fat: 6 },
            { meal: 'Lunch', name: 'Grilled chicken salad with olive oil dressing', calories: 550, protein: 38, carbs: 20, fat: 34 },
            { meal: 'Afternoon Snack', name: 'Apple slices with almond butter', calories: 250, protein: 6, carbs: 28, fat: 14 },
            { meal: 'Dinner', name: 'Baked salmon with steamed broccoli and brown rice', calories: 600, protein: 42, carbs: 52, fat: 18 }
        ],
        [
            { meal: 'Breakfast', name: 'Whole wheat toast with avocado and poached eggs', calories: 400, protein: 18, carbs: 32, fat: 22 },
            { meal: 'Mid-Morning Snack', name: 'Handful of mixed nuts and dried fruits', calories: 220, protein: 6, carbs: 18, fat: 14 },
            { meal: 'Lunch', name: 'Quinoa bowl with roasted vegetables and chickpeas', calories: 500, protein: 18, carbs: 65, fat: 16 },
            { meal: 'Afternoon Snack', name: 'Carrot sticks with hummus', calories: 180, protein: 6, carbs: 20, fat: 8 },
            { meal: 'Dinner', name: 'Grilled turkey breast with sweet potato and green beans', calories: 550, protein: 40, carbs: 48, fat: 14 }
        ]
    ];

    function showReadyMadeMeals(idx) { renderMeals(readyMadeMeals[idx] || readyMadeMeals[0]); }

    function renderMeals(meals) {
        mealsList.innerHTML = '';
        meals.forEach(m => {
            const item = document.createElement('div');
            item.className = 'meal-item-simple';
            const nutr = (m.protein !== undefined)
                ? `<div class="meal-nutrition"><span>🥩 ${m.protein}g protein</span><span>🌾 ${m.carbs}g carbs</span><span>🫒 ${m.fat}g fat</span></div>`
                : '';
            item.innerHTML = `
                <span class="meal-dash">–</span>
                <div class="meal-info">
                    <div class="meal-name">${m.meal}: ${m.name}</div>
                    <div class="meal-cal">~${m.calories} kcal</div>
                    ${nutr}
                </div>`;
            mealsList.appendChild(item);
        });
    }

    // Refresh: 1st click → 2nd set + popup, subsequent → popup or API
    refreshBtn.addEventListener('click', () => {
        refreshCount++;
        if (userPreferences) { generateAIMeals(); return; }
        if (refreshCount === 1) {
            showReadyMadeMeals(1);
            setTimeout(() => { questionnaireOverlay.classList.remove('hidden'); }, 500);
        } else {
            questionnaireOverlay.classList.remove('hidden');
        }
    });


    /* ════════════════════════════════════════════
       4. BYTEZ API (shared)
       ════════════════════════════════════════════ */

    const BYTEZ_API_KEY = '7ff8d2c408d19a533f6ca100ebcc94f9';
    const BYTEZ_MODEL = 'google/gemini-3-pro-preview';
    const BYTEZ_URL = `https://api.bytez.com/models/v2/${BYTEZ_MODEL}`;

    async function callBytez(messages) {
        const resp = await fetch(BYTEZ_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Key ${BYTEZ_API_KEY}` },
            body: JSON.stringify({ messages })
        });
        if (!resp.ok) throw new Error(`API ${resp.status}`);
        const data = await resp.json();
        if (data.output && typeof data.output === 'string') return data.output;
        if (data.output && data.output.content) return data.output.content;
        if (data.output && Array.isArray(data.output)) return data.output.map(o => o.content || o.text || '').join('');
        return JSON.stringify(data.output || data);
    }


    /* ════════════════════════════════════════════
       5. AI MEAL GENERATION (after questionnaire)
       ════════════════════════════════════════════ */

    async function generateAIMeals() {
        mealsList.innerHTML = `<div class="meals-loading"><div><span class="dot"></span><span class="dot"></span><span class="dot"></span></div><p>Creating your personalized plan... ✨</p></div>`;

        const prompt = `Generate a 5-meal day plan for a ${userProfile.age}-year-old ${userProfile.gender}, ${userProfile.heightCm}cm, ${userProfile.weightKg}kg, BMI ${userProfile.bmi}, ~${userProfile.calories} kcal/day.
Preferences: Goal=${userPreferences.goal}, Diet=${userPreferences.diet}, Avoid=${userPreferences.avoid}, Cuisine=${userPreferences.cuisine}.
Return ONLY a JSON array of 5 objects with keys: "meal","name","calories","protein","carbs","fat".
Example: [{"meal":"Breakfast","name":"Oatmeal","calories":350,"protein":12,"carbs":55,"fat":8}]. No extra text.`;

        try {
            const raw = await callBytez([
                { role: 'system', content: 'Nutritionist AI. Return only valid JSON.' },
                { role: 'user', content: prompt }
            ]);
            const match = raw.match(/\[[\s\S]*\]/);
            if (!match) throw new Error('No JSON');
            renderMeals(JSON.parse(match[0]));
            document.querySelector('.meal-subtitle').innerHTML = `AI-personalized &bull; ${userProfile.calories} kcal/day`;
        } catch (err) {
            console.error('Meal error:', err);
            mealsList.innerHTML = `<p style="text-align:center;color:var(--color-error);padding:1rem;">Could not generate meals. Click Refresh to try again.</p>`;
        }
    }

    // Questionnaire submit
    questionnaireForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        userPreferences = {
            goal: document.getElementById('q-goal').value,
            diet: document.getElementById('q-diet').value,
            avoid: document.getElementById('q-avoid').value,
            cuisine: document.getElementById('q-cuisine').value
        };
        questionnaireOverlay.classList.add('hidden');
        await generateAIMeals();
        mealPlanCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });


    /* ════════════════════════════════════════════
       6. NEURO AI CHATBOT (reuses callBytez)
       ════════════════════════════════════════════ */

    const SYSTEM_PROMPT = `You are Neuro AI — a warm, caring health buddy on the Neurowell platform. You talk like a supportive friend who happens to know a lot about health.

Your personality:
- You're genuinely friendly and empathetic. Use a casual, conversational tone — like texting a knowledgeable friend.
- Use short sentences. Break up long info into bite-sized pieces.
- Sprinkle in relevant emojis naturally (💪 🥗 😊 💤 🧘 etc.) but don't overdo it.
- Show you care — say things like "That's a great question!", "I totally get that", "Oh, good point!", "Here's what I'd suggest..."
- Ask follow-up questions sometimes to keep the conversation going.
- Use "you" and "your" to make it personal.

Your rules:
- Share general wellness info about nutrition, exercise, sleep, stress, BMI, hydration, and healthy habits.
- NEVER diagnose, prescribe, or give emergency advice. If someone mentions serious symptoms, gently suggest they see a doctor.
- Keep responses to 2-4 short sentences max. Nobody likes reading walls of text.
- End with a brief, natural disclaimer ONLY when giving specific health advice (like: "Just a heads up — always good to check with your doctor too! 😊").
- If someone just says hi or chats casually, just be friendly — no need for health disclaimers on greetings.`;

    const conversationHistory = [{ role: 'system', content: SYSTEM_PROMPT }];

    function addMessage(text, sender) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `msg msg-${sender}`;
        const bubble = document.createElement('div');
        bubble.className = 'msg-bubble';
        bubble.textContent = text;
        msgDiv.appendChild(bubble);
        chatMessages.appendChild(msgDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return msgDiv;
    }

    function showTyping() {
        const msgDiv = document.createElement('div');
        msgDiv.className = 'msg msg-bot';
        msgDiv.id = 'typing-indicator';
        const bubble = document.createElement('div');
        bubble.className = 'msg-bubble typing-bubble';
        bubble.innerHTML = '<span class="dot"></span><span class="dot"></span><span class="dot"></span>';
        msgDiv.appendChild(bubble);
        chatMessages.appendChild(msgDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function removeTyping() {
        const el = document.getElementById('typing-indicator');
        if (el) el.remove();
    }

    async function getBotResponse(userMessage) {
        conversationHistory.push({ role: 'user', content: userMessage });
        try {
            const reply = await callBytez(conversationHistory);
            conversationHistory.push({ role: 'assistant', content: reply });
            return reply;
        } catch (err) {
            console.error('Bytez API Error:', err);
            return "I'm having trouble connecting right now. Please try again in a moment.";
        }
    }

    async function handleChat(e) {
        e.preventDefault();
        const text = chatInput.value.trim();
        if (!text) return;
        addMessage(text, 'user');
        chatInput.value = '';
        chatInput.disabled = true;
        showTyping();
        const reply = await getBotResponse(text);
        removeTyping();
        addMessage(reply, 'bot');
        chatInput.disabled = false;
        chatInput.focus();
    }

    chatForm.addEventListener('submit', handleChat);


    /* ════════════════════════════════════════════
       7. FLOATING BUTTON & MOBILE NAV CHAT
       ════════════════════════════════════════════ */

    const floatingChatBtn = document.getElementById('floating-chat-btn');
    const mobileNavChat = document.getElementById('mobile-nav-chat');

    if (floatingChatBtn) {
        floatingChatBtn.addEventListener('click', () => switchSection('chat'));
    }

    if (mobileNavChat) {
        mobileNavChat.addEventListener('click', () => switchSection('chat'));
    }


    /* ════════════════════════════════════════════
       8. QUICK TOPIC CHIPS
       ════════════════════════════════════════════ */

    const topicSets = [
        ['💪 Best exercises for beginners', '🥗 How to eat healthier', '💤 Tips for better sleep'],
        ['🧘 How to reduce stress', '💧 How much water should I drink', '🏃 Benefits of daily walking'],
        ['🍎 Best foods for energy', '🧠 How to improve focus', '❤️ Heart-healthy habits'],
        ['🥑 Healthy snack ideas', '📉 How to lower blood pressure', '🦴 Ways to strengthen bones'],
        ['🫁 Breathing exercises', '🏋️ Home workout routine', '😴 How to fix sleep schedule']
    ];

    let currentTopicSet = 0;
    let usedCount = 0;
    const chipsRow = document.getElementById('chips-row');
    const topicChipsContainer = document.getElementById('topic-chips');

    function loadTopicChips() {
        if (currentTopicSet >= topicSets.length) {
            // All sets exhausted, loop back
            currentTopicSet = 0;
        }
        const topics = topicSets[currentTopicSet];
        usedCount = 0;
        chipsRow.innerHTML = '';
        topics.forEach(topic => {
            const chip = document.createElement('button');
            chip.type = 'button';
            chip.className = 'topic-chip';
            chip.textContent = topic;
            chip.addEventListener('click', () => handleChipClick(chip, topic));
            chipsRow.appendChild(chip);
        });
        topicChipsContainer.style.display = '';
    }

    async function handleChipClick(chip, topic) {
        chip.classList.add('used');
        usedCount++;

        // Send topic as user message
        addMessage(topic, 'user');
        chatInput.disabled = true;
        showTyping();
        const reply = await getBotResponse(topic);
        removeTyping();
        addMessage(reply, 'bot');
        chatInput.disabled = false;

        // If all 3 used, load next set
        if (usedCount >= 3) {
            currentTopicSet++;
            setTimeout(() => loadTopicChips(), 300);
        }
    }

    // Initialize first set of chips
    loadTopicChips();

});
