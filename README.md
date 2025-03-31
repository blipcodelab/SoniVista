# SoniVista v0.9 - Simple Image to Audio Converter by BlipCodeLab

Convert images into audio spectrograms with customizable parameters.

## How It Works
1. **Image Processing**: The application analyzes pixel brightness and position
2. **Frequency Mapping**: Vertical position determines frequency (higher pixels = higher pitch)
3. **Time Mapping**: Horizontal position determines when the sound occurs
4. **Audio Synthesis**: Generates sine waves based on image brightness values
5. **Output**: Creates a downloadable WAV file with your image's sonic representation

## Features
- Upload any image (PNG, JPEG, BMP)
- Adjustable parameters:
  - Audio duration (0.1-10 seconds)
  - Brightness threshold (0-255)
  - Transposition (Hz)
  - Dynamic range compression (dB)
- Spectrogram preview (Linear scale)
- Download as WAV file
- Play audio directly in browser
- works on mobile and desktop (web browsers)

## Usage
1. Open the application in your browser
2. Upload an image file
   - High contrast black and white images work best
   - Try photographs with clear vertical features
   - Simple line drawings produce interesting results
   - Gradient images create sweeping frequency changes
3. Adjust parameters using the sliders:
   - **Duration (seconds)**: Controls how long the audio will be
   - **Brightness Threshold (0-255)**: Filters out darker pixels
   - **Transposition (Hz)**: Shifts all frequencies up or down
   - **Dynamic Range (dB)**: Compresses the audio dynamic range
4. Preview the spectrogram visualization
5. Click "Convert to Audio" to generate the sound
6. Play the audio or download the WAV file

## Technical Details
- Pure client-side JavaScript (no server required)
- Canvas API for image manipulation
- Responsive UI with clean design
- Cross-browser compatibility
- Custom WAV encoder for audio file generation (no Web Audio API is used)

## Browser Support
Works in all modern browsers (with javascript support):
- Chrome, Firefox, Safari, Edge, Opera, etc
- Mobile browsers (iOS/Android)

## Development
To run locally:
1. Clone this repository
2. Open `index.html` in your browser

## License
GPL v3.0 License - see LICENSE file

## Contributing
Pull requests are welcome! For any changes/fixes, please open an issue first to discuss what you'd like to change/fix.

## Some Limitations
- Browser may block autoplay of audio (click play button)
- The preview spectrogram may not exactly replicate what will be displayed in a real-time spectrogram.
