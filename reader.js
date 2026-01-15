// Reader state
let words = [];
let currentIndex = 0;
let isPlaying = false;
let intervalId = null;
let wpm = 250;
let focusPosition = 'auto';
let focusColor = '#dc2626';
let fontSize = 48;
let bookId = null;
let bookData = null;
let lastSavedIndex = 0;

// Initialize reader
async function initReader() {
    // Check if user is logged in
    const user = await window.supabaseClient.auth.getUser();
    if (user.error || !user.data.user) {
        window.location.href = 'auth.html';
        return;
    }

    // Display user email
    document.getElementById('userEmail').textContent = user.data.user.email;

    // Get book ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    bookId = urlParams.get('bookId');

    if (!bookId) {
        showMessage('No book selected', 'error');
        setTimeout(() => window.location.href = 'library.html', 2000);
        return;
    }

    // Load book from database
    await loadBook();
    
    // Setup event listeners
    setupEventListeners();
}

// Load book from database
async function loadBook() {
    try {
        const user = await window.supabaseClient.auth.getUser();
        
        // Get book data
        const { data: book, error: bookError } = await window.supabaseClient
            .from('books')
            .select('*')
            .eq('id', bookId)
            .eq('user_id', user.data.user.id)
            .single();

        if (bookError) throw bookError;
        if (!book) throw new Error('Book not found');

        bookData = book;
        document.getElementById('bookTitle').textContent = book.title;

        // Process text into words
        words = book.content
            .replace(/\s+/g, ' ')
            .trim()
            .split(' ')
            .filter(word => word.length > 0);

        // Get saved reading progress
        const { data: progress, error: progressError } = await window.supabaseClient
            .from('reading_progress')
            .select('*')
            .eq('book_id', bookId)
            .eq('user_id', user.data.user.id)
            .single();

        if (!progressError && progress) {
            currentIndex = progress.current_position;
            lastSavedIndex = currentIndex;
            showMessage(`Resumed from word ${currentIndex + 1}`, 'success');
        }

        // Display first word
        updateDisplay();
    } catch (error) {
        console.error('Error loading book:', error);
        showMessage('Error loading book: ' + error.message, 'error');
        setTimeout(() => window.location.href = 'library.html', 2000);
    }
}

// Setup event listeners
function setupEventListeners() {
    // WPM Control
    const wpmSlider = document.getElementById('wpmSlider');
    const wpmValue = document.getElementById('wpmValue');
    wpmSlider.addEventListener('input', (e) => {
        wpm = parseInt(e.target.value);
        wpmValue.textContent = wpm;
        if (isPlaying) {
            stopReading();
            startReading();
        }
    });

    // Focus Position
    document.getElementById('focusPosition').addEventListener('change', (e) => {
        focusPosition = e.target.value;
        updateDisplay();
    });

    // Focus Color
    document.getElementById('focusColor').addEventListener('input', (e) => {
        focusColor = e.target.value;
        updateDisplay();
    });

    // Font Size
    const fontSizeSlider = document.getElementById('fontSize');
    const fontSizeValue = document.getElementById('fontSizeValue');
    fontSizeSlider.addEventListener('input', (e) => {
        fontSize = parseInt(e.target.value);
        fontSizeValue.textContent = fontSize;
        document.getElementById('currentWord').style.fontSize = fontSize + 'px';
    });

    // Playback controls
    document.getElementById('playPauseBtn').addEventListener('click', togglePlayPause);
    document.getElementById('rewindBtn').addEventListener('click', () => skipWords(-10));
    document.getElementById('forwardBtn').addEventListener('click', () => skipWords(10));
    document.getElementById('restartBtn').addEventListener('click', restart);

    // Keyboard controls
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space') {
            e.preventDefault();
            togglePlayPause();
        } else if (e.code === 'ArrowLeft') {
            e.preventDefault();
            skipWords(-10);
        } else if (e.code === 'ArrowRight') {
            e.preventDefault();
            skipWords(10);
        } else if (e.code === 'KeyR') {
            e.preventDefault();
            restart();
        }
    });
}

// Toggle play/pause
function togglePlayPause() {
    if (isPlaying) {
        stopReading();
    } else {
        startReading();
    }
}

// Start reading
function startReading() {
    if (words.length === 0) return;
    
    isPlaying = true;
    document.getElementById('playIcon').classList.add('hidden');
    document.getElementById('pauseIcon').classList.remove('hidden');
    
    const interval = 60000 / wpm; // milliseconds per word
    
    intervalId = setInterval(() => {
        if (currentIndex < words.length - 1) {
            currentIndex++;
            updateDisplay();
            
            // Auto-save every 50 words
            if (currentIndex % 50 === 0) {
                saveProgress();
            }
        } else {
            stopReading();
            saveProgress();
            showMessage('Finished reading! 🎉', 'success');
        }
    }, interval);
}

// Stop reading
function stopReading() {
    isPlaying = false;
    document.getElementById('playIcon').classList.remove('hidden');
    document.getElementById('pauseIcon').classList.add('hidden');
    
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
    }
    
    // Save progress when stopping
    saveProgress();
}

// Skip words
function skipWords(count) {
    currentIndex = Math.max(0, Math.min(words.length - 1, currentIndex + count));
    updateDisplay();
    saveProgress();
}

// Restart
function restart() {
    stopReading();
    currentIndex = 0;
    updateDisplay();
    saveProgress();
}

// Update display
function updateDisplay() {
    if (words.length === 0) return;
    
    const word = words[currentIndex];
    const wordElement = document.getElementById('currentWord');
    
    // Calculate focal point
    let focalIndex;
    if (focusPosition === 'auto') {
        // Optimal Recognition Point (ORP) - typically around 30-35% into the word
        focalIndex = Math.floor(word.length * 0.33);
    } else if (focusPosition === 'middle') {
        focalIndex = Math.floor(word.length / 2);
    } else {
        focalIndex = parseInt(focusPosition);
    }
    
    // Ensure focal index is within bounds
    focalIndex = Math.max(0, Math.min(word.length - 1, focalIndex));
    
    // Build HTML with focal letter
    let html = '';
    for (let i = 0; i < word.length; i++) {
        if (i === focalIndex) {
            html += `<span class="focal-letter" style="color: ${focusColor};">${word[i]}</span>`;
        } else {
            html += word[i];
        }
    }
    
    wordElement.innerHTML = html;
    
    // Update progress
    const progress = ((currentIndex + 1) / words.length) * 100;
    document.getElementById('progressFill').style.width = progress + '%';
    document.getElementById('wordCount').textContent = `${currentIndex + 1} / ${words.length}`;
    
    // Calculate time remaining
    const wordsLeft = words.length - currentIndex - 1;
    const minutesLeft = wordsLeft / wpm;
    const minutes = Math.floor(minutesLeft);
    const seconds = Math.floor((minutesLeft - minutes) * 60);
    document.getElementById('timeRemaining').textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Save progress to database
async function saveProgress() {
    if (!bookId || currentIndex === lastSavedIndex) return;
    
    try {
        const user = await window.supabaseClient.auth.getUser();
        
        const progressData = {
            user_id: user.data.user.id,
            book_id: bookId,
            current_position: currentIndex,
            total_words: words.length,
            last_read_at: new Date().toISOString()
        };
        
        const { error } = await window.supabaseClient
            .from('reading_progress')
            .upsert(progressData, {
                onConflict: 'user_id,book_id'
            });
        
        if (error) throw error;
        
        lastSavedIndex = currentIndex;
        showAutoSaveIndicator();
    } catch (error) {
        console.error('Error saving progress:', error);
    }
}

// Show auto-save indicator
function showAutoSaveIndicator() {
    const indicator = document.getElementById('autoSaveIndicator');
    indicator.classList.add('show');
    setTimeout(() => {
        indicator.classList.remove('show');
    }, 2000);
}

// Show message
function showMessage(text, type) {
    // Create message element
    const message = document.createElement('div');
    message.className = `message ${type}`;
    message.textContent = text;
    document.body.appendChild(message);
    
    // Remove after 3 seconds
    setTimeout(() => {
        message.remove();
    }, 3000);
}

// Save progress before leaving
window.addEventListener('beforeunload', () => {
    if (currentIndex !== lastSavedIndex) {
        saveProgress();
    }
});

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initReader);
