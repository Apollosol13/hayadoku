// Library page functionality
let currentUser = null;
let selectedFile = null; // Store the selected/dropped file

// Drag and drop functionality
const dropZone = document.getElementById('dropZone');
const bookFileInput = document.getElementById('bookFile');
const bookTitleInput = document.getElementById('bookTitle');
const selectedFileName = document.getElementById('selectedFileName');

if (dropZone) {
    // Make drop zone clickable
    dropZone.addEventListener('click', () => {
        bookFileInput.click();
    });

    // Drag events
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-over');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('drag-over');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileSelect(files[0]);
        }
    });
}

// Handle file selection
if (bookFileInput) {
    bookFileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFileSelect(e.target.files[0]);
        }
    });
}

function handleFileSelect(file) {
    // Store the file globally
    selectedFile = file;
    
    // Show selected file
    selectedFileName.textContent = `Selected: ${file.name}`;
    selectedFileName.style.display = 'block';
    
    // Auto-fill title if empty
    if (!bookTitleInput.value) {
        const title = file.name.replace(/\.(txt|pdf)$/i, '');
        bookTitleInput.value = title;
    }
}

// Check authentication
async function checkAuth() {
    currentUser = await getCurrentUser();
    if (!currentUser) {
        window.location.href = 'auth.html';
        return false;
    }
    
    // Display user email
    document.getElementById('userEmail').textContent = currentUser.email;
    return true;
}

// Load user's books
async function loadBooks() {
    const booksContainer = document.getElementById('booksContainer');
    
    const { data: books, error } = await window.supabaseClient
        .from('books')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });
    
    if (error) {
        booksContainer.innerHTML = '<p class="error-message">Error loading books</p>';
        console.error('Error loading books:', error);
        return;
    }
    
    if (!books || books.length === 0) {
        booksContainer.innerHTML = '<p class="empty-message">No books yet. Upload your first book below!</p>';
        return;
    }
    
    // Display books
    booksContainer.innerHTML = books.map(book => `
        <div class="book-card" data-book-id="${book.id}">
            <h3>${escapeHtml(book.title)}</h3>
            <p class="book-meta">Uploaded: ${new Date(book.created_at).toLocaleDateString()}</p>
            <p class="book-words">${book.word_count || 0} words</p>
            <div class="book-actions">
                <button onclick="startReading('${book.id}')" class="btn btn-primary">
                    ${book.last_position ? 'Continue Reading' : 'Start Reading'}
                </button>
                <button onclick="deleteBook('${book.id}')" class="btn btn-secondary">Delete</button>
            </div>
        </div>
    `).join('');
}

// Upload new book
document.getElementById('uploadBookBtn')?.addEventListener('click', async () => {
    const statusEl = document.getElementById('uploadStatus');
    
    // Get file from either dropped file or file input
    const file = selectedFile || document.getElementById('bookFile').files[0];
    
    if (!file) {
        statusEl.textContent = 'Please select a file';
        statusEl.className = 'upload-status error';
        return;
    }
    
    // Use filename as title if not provided
    let title = document.getElementById('bookTitle').value.trim();
    if (!title) {
        title = file.name.replace(/\.(txt|pdf)$/i, '');
    }
    
    statusEl.textContent = 'Uploading...';
    statusEl.className = 'upload-status info';
    
    try {
        // Read file content
        const content = await readFileContent(file);
        const words = content.trim().split(/\s+/).filter(w => w.length > 0);
        
        // Save to database
        const { data, error } = await window.supabaseClient
            .from('books')
            .insert([
                {
                    user_id: currentUser.id,
                    title: title,
                    content: content,
                    word_count: words.length
                }
            ])
            .select();
        
        if (error) throw error;
        
        statusEl.textContent = 'Book uploaded successfully!';
        statusEl.className = 'upload-status success';
        
        // Clear form
        document.getElementById('bookTitle').value = '';
        document.getElementById('bookFile').value = '';
        selectedFile = null;
        selectedFileName.style.display = 'none';
        selectedFileName.textContent = '';
        
        // Reload books
        await loadBooks();
        
    } catch (error) {
        statusEl.textContent = 'Error uploading book: ' + error.message;
        statusEl.className = 'upload-status error';
        console.error('Upload error:', error);
    }
});

// Read file content
function readFileContent(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(e);
        reader.readAsText(file);
    });
}

// Start reading a book
async function startReading(bookId) {
    window.location.href = `reader.html?bookId=${bookId}`;
}

// Delete a book
async function deleteBook(bookId) {
    if (!confirm('Are you sure you want to delete this book?')) return;
    
    const { error } = await window.supabaseClient
        .from('books')
        .delete()
        .eq('id', bookId)
        .eq('user_id', currentUser.id);
    
    if (error) {
        alert('Error deleting book');
        console.error('Delete error:', error);
        return;
    }
    
    await loadBooks();
}

// Sign out
document.getElementById('signOutBtn')?.addEventListener('click', signOut);

// Helper function
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initialize
checkAuth().then(isAuth => {
    if (isAuth) {
        loadBooks();
    }
});
