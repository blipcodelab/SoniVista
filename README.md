# SoniVista v0.9 – Image to Audio Converter  
**by BlipCodeLab**

> Convert any image into sound — in your browser, offline.

![License](https://img.shields.io/badge/license-GPLv3-blue)
![Platform](https://img.shields.io/badge/platform-Web-lightgrey)
![Mobile](https://img.shields.io/badge/mobile-friendly-success)
![Built](https://img.shields.io/badge/built_with-JavaScript-yellow)

---

## What is SoniVista?

SoniVista is a web based tool that transforms images into audio files. When played back, in a spectrogram viewer, the image reappears visually.
It interprets image brightness and vertical position as frequency and horizontal position as time.

---

## How It Works

The code does not use Fourier transforms (FFT/IFFT). Instead, it directly synthesizes sine waves based on brightness and time/frequency position:

1. **Image Processing**  
   The image is resized if needed, then drawn to an offscreen `<canvas>`. Each pixel’s brightness is computed as:
   <pre>brightness = (R + G + B) / 3</pre>

2. **Frequency Mapping**  
   Each row corresponds to a different frequency bin. The higher the row (closer to the top), the higher the frequency:
   <pre>f_y = f_base + (H - 1 - y) × Δf</pre>

3. **Time Mapping**  
   Columns define when in time each frequency component occurs:
   <pre>t_x = x × (duration / width)</pre>

4. **Audio Synthesis**  
   Brightness controls the amplitude of sine waves. The formula used to generate each audio sample is:
   <pre>audio[t] += amplitude × sin(2π × frequency × t)</pre>

5. **Export**  
   The result is normalized and saved as a `.wav` file — ready to download or play in the browser.

---

## Features

- Upload any image (PNG, JPEG, BMP)
- Adjustable settings:
  - Audio duration (0.1–10 seconds)
  - Brightness threshold (0–255)
  - Transposition (Hz)
  - Dynamic range compression (6-60 dB)
- Spectrogram preview (linear scale)

---

## Usage

1. Open `index.html` in your browser  
2. Upload an image:
   - High-contrast black & white images work best
   - Try photos with clear structures
3. Adjust parameters using the sliders:
   - **Duration**: total audio length in seconds  
   - **Brightness Threshold**: ignores dark pixels  
   - **Transposition**: shifts all frequencies  
   - **Dynamic Range**: compresses or expands contrast  
4. Click `Convert to WAV`  
5. Preview the result or download the `.wav` file

---

## More details

- Written entirely in html/css/javascript
- Uses `<canvas>` for image processing
- Generates raw waveform data (not Web Audio API)
- Custom WAV encoder from scratch
- Fully offline, no internet required
- Runs in all major browsers

---

## License
GPL v3.0 License - see LICENSE file

## Contributing
Pull requests are welcome! For any changes/fixes, please open an issue first to discuss what you'd like to change/fix.

## Some Limitations
- Browser may block audio player
- The preview spectrogram may not exactly replicate what will be displayed in a real-time FFT spectrogram.
