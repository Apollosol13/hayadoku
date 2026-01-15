// State management
const state = {
    words: [],
    currentIndex: 0,
    isPlaying: false,
    wpm: 250,
    interval: null,
    focusPosition: 'auto',
    focusColor: '#ff0000',
    fontSize: 48
};

// DOM Elements
const uploadSection = document.getElementById('uploadSection');
const readerSection = document.getElementById('readerSection');
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const pasteText = document.getElementById('pasteText');
const startFromPaste = document.getElementById('startFromPaste');
const currentWordEl = document.getElementById('currentWord');
const wpmSlider = document.getElementById('wpmSlider');
const wpmValue = document.getElementById('wpmValue');
const focusPositionSelect = document.getElementById('focusPosition');
const focusColorInput = document.getElementById('focusColor');
const fontSizeSlider = document.getElementById('fontSize');
const fontSizeValue = document.getElementById('fontSizeValue');
const playPauseBtn = document.getElementById('playPauseBtn');
const playIcon = document.getElementById('playIcon');
const pauseIcon = document.getElementById('pauseIcon');
const rewindBtn = document.getElementById('rewindBtn');
const forwardBtn = document.getElementById('forwardBtn');
const restartBtn = document.getElementById('restartBtn');
const newTextBtn = document.getElementById('newTextBtn');
const progressFill = document.getElementById('progressFill');
const wordCount = document.getElementById('wordCount');
const timeRemaining = document.getElementById('timeRemaining');

// Initialize
init();

function init() {
    setupEventListeners();
}

function setupEventListeners() {
    // File upload
    fileInput.addEventListener('change', handleFileUpload);
    uploadArea.addEventListener('click', () => fileInput.click());
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);

    // Paste text
    startFromPaste.addEventListener('click', handlePasteText);

    // Controls
    wpmSlider.addEventListener('input', handleWpmChange);
    focusPositionSelect.addEventListener('change', handleFocusPositionChange);
    focusColorInput.addEventListener('input', handleFocusColorChange);
    fontSizeSlider.addEventListener('input', handleFontSizeChange);

    // Playback
    playPauseBtn.addEventListener('click', togglePlayPause);
    rewindBtn.addEventListener('click', () => skipWords(-10));
    forwardBtn.addEventListener('click', () => skipWords(10));
    restartBtn.addEventListener('click', restart);
    newTextBtn.addEventListener('click', loadNewText);

    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyPress);
}

// File handling
function handleFileUpload(e) {
    const file = e.target.files[0];
    if (file) {
        readFile(file);
    }
}

function handleDragOver(e) {
    e.preventDefault();
    uploadArea.classList.add('drag-over');
}

function handleDragLeave(e) {
    e.preventDefault();
    uploadArea.classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    uploadArea.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file && (file.type === 'text/plain' || file.type === 'application/pdf')) {
        readFile(file);
    } else {
        alert('Please upload a .txt or .pdf file');
    }
}

async function readFile(file) {
    if (file.type === 'application/pdf') {
        await readPDF(file);
    } else {
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target.result;
            processText(text);
        };
        reader.readAsText(file);
    }
}

async function readPDF(file) {
    try {
        // Show loading message
        currentWordEl.textContent = 'Loading PDF...';
        
        const arrayBuffer = await file.arrayBuffer();
        
        // Configure PDF.js worker
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        
        // Load the PDF
        const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
        let fullText = '';
        
        // Extract text from all pages
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item => item.str).join(' ');
            fullText += pageText + ' ';
        }
        
        if (fullText.trim()) {
            processText(fullText);
        } else {
            alert('No text found in PDF. The PDF might be image-based or empty.');
            currentWordEl.textContent = '';
        }
    } catch (error) {
        console.error('Error reading PDF:', error);
        alert('Error reading PDF file. Please make sure it\'s a valid PDF.');
        currentWordEl.textContent = '';
    }
}

function handlePasteText() {
    const text = pasteText.value.trim();
    if (text) {
        processText(text);
    } else {
        alert('Please paste some text first');
    }
}

function processText(text) {
    // Split text into words, removing extra whitespace and empty strings
    state.words = text
        .replace(/\s+/g, ' ')
        .trim()
        .split(' ')
        .filter(word => word.length > 0);

    if (state.words.length === 0) {
        alert('No valid text found');
        return;
    }

    state.currentIndex = 0;
    state.isPlaying = false;

    // Show reader section
    uploadSection.classList.add('hidden');
    readerSection.classList.remove('hidden');

    // Display first word
    displayWord();
    updateUI();
}

// Display word with focal point
function displayWord() {
    if (state.currentIndex >= state.words.length) {
        stop();
        return;
    }

    const word = state.words[state.currentIndex];
    const focalIndex = getFocalIndex(word);

    // Create word with focal letter highlighted (more subtle approach)
    let wordHTML = '';
    for (let i = 0; i < word.length; i++) {
        if (i === focalIndex) {
            // Use the selected color with subtle styling - bold and slightly brighter
            wordHTML += `<span class="focal-letter" style="color: ${state.focusColor}; filter: brightness(1.2);">${word[i]}</span>`;
        } else {
            wordHTML += word[i];
        }
    }

    currentWordEl.innerHTML = wordHTML;
    currentWordEl.style.fontSize = `${state.fontSize}px`;

    updateProgress();
}

// Calculate focal point based on word length (Optimal Recognition Point)
function getFocalIndex(word) {
    const length = word.length;

    if (state.focusPosition === 'auto') {
        // Optimal Recognition Point - typically around 30-40% into the word
        if (length === 1) return 0;
        if (length === 2) return 0;
        if (length === 3) return 1;
        if (length === 4) return 1;
        if (length === 5) return 2;
        if (length <= 8) return 2;
        if (length <= 13) return 3;
        return 4;
    } else if (state.focusPosition === 'middle') {
        return Math.floor(length / 2);
    } else {
        const index = parseInt(state.focusPosition);
        return Math.min(index, length - 1);
    }
}

// Playback controls
function togglePlayPause() {
    if (state.isPlaying) {
        pause();
    } else {
        play();
    }
}

function play() {
    if (state.currentIndex >= state.words.length) {
        restart();
    }

    state.isPlaying = true;
    playIcon.classList.add('hidden');
    pauseIcon.classList.remove('hidden');

    const delay = 60000 / state.wpm; // Convert WPM to milliseconds per word

    state.interval = setInterval(() => {
        if (state.currentIndex < state.words.length) {
            displayWord();
            state.currentIndex++;
        } else {
            stop();
        }
    }, delay);
}

function pause() {
    state.isPlaying = false;
    playIcon.classList.remove('hidden');
    pauseIcon.classList.add('hidden');
    clearInterval(state.interval);
}

function stop() {
    pause();
    state.currentIndex = state.words.length;
    updateProgress();
}

function restart() {
    pause();
    state.currentIndex = 0;
    displayWord();
    updateUI();
}

function skipWords(count) {
    const wasPlaying = state.isPlaying;
    if (wasPlaying) pause();

    state.currentIndex = Math.max(0, Math.min(state.currentIndex + count, state.words.length - 1));
    displayWord();
    updateUI();

    if (wasPlaying) play();
}

// Control handlers
function handleWpmChange(e) {
    state.wpm = parseInt(e.target.value);
    wpmValue.textContent = state.wpm;

    // If playing, restart with new speed
    if (state.isPlaying) {
        pause();
        play();
    }

    updateTimeRemaining();
}

function handleFocusPositionChange(e) {
    state.focusPosition = e.target.value;
    displayWord();
}

function handleFocusColorChange(e) {
    state.focusColor = e.target.value;
    displayWord();
}

function handleFontSizeChange(e) {
    state.fontSize = parseInt(e.target.value);
    fontSizeValue.textContent = state.fontSize;
    currentWordEl.style.fontSize = `${state.fontSize}px`;
}

// UI updates
function updateProgress() {
    const progress = (state.currentIndex / state.words.length) * 100;
    progressFill.style.width = `${progress}%`;
    wordCount.textContent = `${state.currentIndex} / ${state.words.length}`;
    updateTimeRemaining();
}

function updateTimeRemaining() {
    const wordsLeft = state.words.length - state.currentIndex;
    const minutesLeft = wordsLeft / state.wpm;
    const seconds = Math.round(minutesLeft * 60);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    timeRemaining.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
}

function updateUI() {
    updateProgress();
}

function loadNewText() {
    const confirmLoad = confirm('Are you sure you want to load new text? Your current progress will be lost.');
    if (confirmLoad) {
        pause();
        readerSection.classList.add('hidden');
        uploadSection.classList.remove('hidden');
        pasteText.value = '';
        state.words = [];
        state.currentIndex = 0;
    }
}

// Keyboard shortcuts
function handleKeyPress(e) {
    if (readerSection.classList.contains('hidden')) return;

    switch(e.code) {
        case 'Space':
            e.preventDefault();
            togglePlayPause();
            break;
        case 'ArrowLeft':
            e.preventDefault();
            skipWords(-1);
            break;
        case 'ArrowRight':
            e.preventDefault();
            skipWords(1);
            break;
        case 'KeyR':
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                restart();
            }
            break;
        case 'Escape':
            pause();
            break;
    }
}

// Email signup form handler
const emailForm = document.getElementById('emailForm');
const emailInput = document.getElementById('emailInput');
const emailMessage = document.getElementById('emailMessage');

if (emailForm) {
    emailForm.addEventListener('submit', handleEmailSubmit);
}

async function handleEmailSubmit(e) {
    e.preventDefault();
    
    const email = emailInput.value.trim();
    
    if (!email) {
        showEmailMessage('Please enter your email address', 'error');
        return;
    }
    
    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showEmailMessage('Please enter a valid email address', 'error');
        return;
    }
    
    // For now, just show success (you'll replace this with actual API call)
    showEmailMessage('Thanks for subscribing! Check your email for confirmation.', 'success');
    emailInput.value = '';
    
    // TODO: Replace with actual email service API call
    // Example with Mailchimp, ConvertKit, etc.
    // await submitToEmailService(email);
}

function showEmailMessage(message, type) {
    emailMessage.textContent = message;
    emailMessage.className = `email-message ${type}`;
    
    setTimeout(() => {
        emailMessage.textContent = '';
        emailMessage.className = 'email-message';
    }, 5000);
}

// Example function to integrate with email service (placeholder)
// async function submitToEmailService(email) {
//     const response = await fetch('YOUR_EMAIL_SERVICE_API_ENDPOINT', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ email: email })
//     });
//     return response.json();
// }
