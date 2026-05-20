/* ==========================================================================
   CREDIBILITYAI - DYNAMIC APP CLIENT LOGIC
   ========================================================================== */

// 1. Dataset presets library for interactive testing
const PRESETS = [
    {
        title: "N.F.L. Playoffs: Schedule, Matchups and Odds - The New York Times",
        author: "Benjamin Hoffman",
        text: "When the Green Bay Packers lost to the Washington Redskins in Week 11, falling to 4-6, Aaron Rodgers made a bold projection: He said the Packers could run the table and win their final six games to make the playoffs. They did just that, and Rodgers backed up his words with spectacular play. Green Bay will face the New York Giants in the wild card round."
    },
    {
        title: "House Dem Aide: We Didn’t Even See Comey’s Letter Until Jason Chaffetz Tweeted It",
        author: "Darrell Lucus",
        text: "House Dem Aide: We Didn’t Even See Comey’s Letter Until Jason Chaffetz Tweeted It By Darrell Lucus on October 30, 2016. Federal Bureau of Investigation Director James Comey sent a letter to Congressional leaders regarding new emails discovered in the Hillary Clinton investigation, but Democratic staff was left completely in the dark until Republicans tweeted it."
    },
    {
        title: "FLYNN: Hillary Clinton, Big Woman on Campus - Breitbart",
        author: "Daniel J. Flynn",
        text: "Ever get the feeling your life circles the roundabout rather than heads down the highway? Hillary Clinton remains big woman on campus. Breitbart News reports that Clinton will deliver the commencement address at Wellesley College, her alma mater, marking a highly political speech in the wake of her presidential defeat."
    },
    {
        title: "Why the Truth Might Get You Fired",
        author: "Consortiumnews.com",
        text: "Why the Truth Might Get You Fired October 29, 2016. The tension between the Obama administration and its critics has escalated dramatically as intelligence community whistleblowers warn that speaking the truth about international conflicts can lead to immediate professional termination and federal blacklisting."
    }
];

// Document elements references
const newsForm = document.getElementById('news-form');
const titleInput = document.getElementById('news-title');
const authorInput = document.getElementById('news-author');
const textInput = document.getElementById('news-text');
const submitBtn = document.getElementById('submit-btn');

// State Cards
const welcomeCard = document.getElementById('welcome-card');
const scannerCard = document.getElementById('scanner-card');
const resultCard = document.getElementById('result-card');

// Scanner Elements
const scanStatus = document.getElementById('scan-status');
const loadBarFill = document.getElementById('loading-bar-fill');

// Result Elements
const resultPercent = document.getElementById('result-percent');
const gaugeFillArc = document.getElementById('gauge-fill-arc');
const resultBadge = document.getElementById('result-badge');
const resultBadgeIcon = document.getElementById('result-badge-icon');
const resultBadgeText = document.getElementById('result-badge-text');
const verdictTitle = document.getElementById('verdict-title');
const verdictDesc = document.getElementById('verdict-desc');

// Stat values
const statWords = document.getElementById('stat-words');
const statTime = document.getElementById('stat-time');
const statChars = document.getElementById('stat-chars');
const keywordsContainer = document.getElementById('keywords-container');

// List of status updates to simulate high-tech NLTK workflow
const SCANNING_PHASES = [
    { percent: 15, text: "Preparing the article..." },
    { percent: 35, text: "Removing filler words..." },
    { percent: 55, text: "Finding important terms..." },
    { percent: 75, text: "Comparing against trained data..." },
    { percent: 90, text: "Calculating credibility score..." },
    { percent: 98, text: "Finalizing result..." }
];

// ==========================================================================
// PRESETS INTERACTIVE SYSTEM
// ==========================================================================

function loadPreset(index) {
    if (index < 0 || index >= PRESETS.length) return;
    
    const preset = PRESETS[index];
    
    // Add quick flash animation effect to inputs for user feedback
    const flashClass = 'preset-flash-active';
    
    [titleInput, authorInput, textInput].forEach(el => {
        el.style.transform = 'scale(0.98)';
        el.style.borderColor = 'var(--accent-primary)';
        setTimeout(() => {
            el.style.transform = 'scale(1)';
            el.style.borderColor = '';
        }, 200);
    });

    titleInput.value = preset.title;
    authorInput.value = preset.author;
    textInput.value = preset.text;
}

// ==========================================================================
// PREDICTION FORM SUBMISSION & WORKFLOW
// ==========================================================================

newsForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const title = titleInput.value.trim();
    const author = authorInput.value.trim();
    const text = textInput.value.trim();
    
    if (!title && !author) {
        alert("Please provide at least a News Title or an Author/Source.");
        return;
    }
    
    // Show scanner screen with transition
    welcomeCard.classList.add('hidden');
    resultCard.classList.add('hidden');
    scannerCard.classList.remove('hidden');
    
    // Reset scanner loading bar
    loadBarFill.style.width = '0%';
    scanStatus.textContent = "Connecting to prediction engine...";
    
    let isRequestFinished = false;
    let apiData = null;
    let apiError = null;
    
    // Start asynchronous request
    const apiPromise = fetch('/api/predict', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title, author, text })
    })
    .then(res => {
        if (!res.ok) throw new Error("Server responded with a failure code.");
        return res.json();
    })
    .then(data => {
        apiData = data;
        isRequestFinished = true;
    })
    .catch(err => {
        apiError = err.message;
        isRequestFinished = true;
    });

    // Run interactive visualization scanner simultaneously
    let phaseIndex = 0;
    
    const scanInterval = setInterval(() => {
        if (phaseIndex < SCANNING_PHASES.length) {
            const currentPhase = SCANNING_PHASES[phaseIndex];
            loadBarFill.style.width = `${currentPhase.percent}%`;
            scanStatus.textContent = currentPhase.text;
            phaseIndex++;
        } else if (isRequestFinished) {
            // Once API completes, fill to 100% and show results
            clearInterval(scanInterval);
            loadBarFill.style.width = "100%";
            scanStatus.textContent = "Analysis complete! Generating report...";
            
            setTimeout(() => {
                scannerCard.classList.add('hidden');
                if (apiError) {
                    alert(`Prediction failed: ${apiError}`);
                    welcomeCard.classList.remove('hidden');
                } else {
                    renderPredictionResults(apiData);
                }
            }, 600);
        }
    }, 450); // Fluid timing step
});

// ==========================================================================
// RESULT RENDERING MODULE
// ==========================================================================

function renderPredictionResults(data) {
    // 1. Remove previous styling classes from results container
    resultCard.classList.remove('real-news', 'fake-news');
    
    const isReal = data.label === 'Real';
    const confidence = data.confidence;
    
    // Apply styling class depending on verdict
    if (isReal) {
        resultCard.classList.add('real-news');
        resultBadge.style.display = 'flex';
        resultBadgeIcon.className = "fa-solid fa-square-check";
        resultBadgeText.textContent = "VERIFIED REAL";
        
        verdictTitle.textContent = "Credible Source";
        
        if (confidence > 85) {
            verdictDesc.textContent = `This article shows strong signs of credible reporting (${confidence}% confidence).`;
        } else {
            verdictDesc.textContent = `This article looks mostly credible, but we are not fully certain (${confidence}% confidence).`;
        }
    } else {
        resultCard.classList.add('fake-news');
        resultBadge.style.display = 'flex';
        resultBadgeIcon.className = "fa-solid fa-triangle-exclamation";
        resultBadgeText.textContent = "SUSPECTED FAKE";
        
        verdictTitle.textContent = "Credibility Warning";
        
        if (confidence > 85) {
            verdictDesc.textContent = `This article shares patterns commonly found in unreliable sources (${confidence}% confidence).`;
        } else {
            verdictDesc.textContent = `We found some red flags, but the result is not conclusive (${confidence}% confidence).`;
        }
    }
    
    // 2. Animate Circular Radial Gauge
    resultPercent.textContent = `${Math.round(confidence)}%`;
    // Gauge calculations: Radius = 40. Circumference = 2 * PI * r = 251.2
    const circumference = 251.2;
    const offset = circumference - (confidence / 100) * circumference;
    
    // We delay the dashoffset render slightly to trigger the smooth CSS slide animation
    gaugeFillArc.style.strokeDashoffset = circumference;
    setTimeout(() => {
        gaugeFillArc.style.strokeDashoffset = offset;
    }, 100);
    
    // 3. Render Article Stats
    statWords.textContent = data.stats.word_count.toLocaleString();
    statChars.textContent = data.stats.char_count.toLocaleString();
    statTime.textContent = `${data.stats.reading_time}m`;
    
    // 4. Populate Core Predictors Tags
    keywordsContainer.innerHTML = '';
    
    if (data.keywords && data.keywords.length > 0) {
        data.keywords.forEach(word => {
            const tag = document.createElement('span');
            tag.className = 'keyword-tag';
            tag.textContent = word;
            keywordsContainer.appendChild(tag);
        });
    } else {
        // Fallback if no matching features are found in the text input
        const tag = document.createElement('span');
        tag.className = 'keyword-tag';
        tag.textContent = "neutral lexicon";
        keywordsContainer.appendChild(tag);
    }
    
    // Make results card visible
    resultCard.classList.remove('hidden');
}

// ==========================================================================
// RESET APPLICATION STATE
// ==========================================================================

function resetForm() {
    newsForm.reset();
    resultCard.classList.add('hidden');
    scannerCard.classList.add('hidden');
    welcomeCard.classList.remove('hidden');
}
