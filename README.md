# SpeedReads - Speed Reading Application

A modern, beautiful web application for speed reading that displays text one word at a time with a focal point to help maintain focus and increase reading speed.

## Features

- **Upload Text Files**: Upload any .txt or .pdf file, or paste text directly
- **Adjustable Reading Speed**: From 50 to 900 words per minute (WPM)
- **Focal Point Highlighting**: One letter in each word is highlighted to help maintain focus
- **Customizable Settings**:
  - Adjust reading speed in real-time
  - Choose focal point position (auto-optimal, first letter, second letter, etc.)
  - Customize focal letter color
  - Adjust font size (24-96px)
- **Playback Controls**: Play, pause, rewind, forward, and restart
- **Progress Tracking**: Visual progress bar and time remaining display
- **Keyboard Shortcuts**: 
  - `Space` - Play/Pause
  - `Arrow Left` - Previous word
  - `Arrow Right` - Next word
  - `Ctrl/Cmd + R` - Restart
  - `Esc` - Pause

## How to Use

1. **Open the Application**: Simply open `index.html` in your web browser
2. **Upload Text**: Either:
   - Drag and drop a .txt or .pdf file onto the upload area
   - Click "Choose File" to browse for a file
   - Paste text directly into the text area
3. **Adjust Settings**: Configure your preferred reading speed, focal point, color, and font size
4. **Start Reading**: Click the play button or press spacebar to begin
5. **Control Playback**: Use the playback controls or keyboard shortcuts to navigate

## Optimal Recognition Point

The app uses the Optimal Recognition Point (ORP) algorithm when set to "Auto" focal position. This highlights the ideal letter in each word for fastest recognition:
- 1-2 letter words: First letter
- 3-4 letter words: Second letter  
- 5-8 letter words: Third letter
- 9-13 letter words: Fourth letter
- 14+ letter words: Fifth letter

This technique is scientifically proven to improve reading speed and comprehension.

## Technology Stack

- Pure HTML, CSS, and JavaScript (no frameworks required)
- Modern, responsive design
- Dark theme optimized for reading
- Works offline

## Tips for Best Results

1. **Start Slow**: Begin at 200-250 WPM and gradually increase speed
2. **Find Your Pace**: The average reader reads 200-250 WPM; with practice, you can reach 400-600 WPM
3. **Use the Focal Point**: Let your eyes focus on the highlighted letter
4. **Practice Regularly**: Speed reading is a skill that improves with practice
5. **Adjust Settings**: Find the color and font size that works best for you

## Browser Compatibility

Works in all modern browsers:
- Chrome/Edge (Chromium)
- Firefox
- Safari
- Opera

## License

Free to use and modify.
