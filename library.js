// Library page functionality
let currentUser = null;

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
    const title = document.getElementById('bookTitle').value.trim();
    const fileInput = document.getElementById('bookFile');
    const file = fileInput.files[0];
    const statusEl = document.getElementById('uploadStatus');
    
    if (!title) {
        statusEl.textContent = 'Please enter a book title';
        statusEl.className = 'upload-status error';
        return;
    }
    
    if (!file) {
        statusEl.textContent = 'Please select a file';
        statusEl.className = 'upload-status error';
        return;
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
        fileInput.value = '';
        
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
