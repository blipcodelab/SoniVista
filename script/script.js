
/* 
 * SoniVista - Simple Image to Audio Converter
 * Copyright (C) 2025 BlipCodeLab / @ilbpedro
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

// interface elements
const elements = {
	imageInput: document.getElementById('imageInput'),
	duration: document.getElementById('duration'),
	durationValue: document.getElementById('durationValue'),
	brightnessThreshold: document.getElementById('brightnessThreshold'),
	brightnessThresholdValue: document.getElementById('brightnessThresholdValue'),
	dynamicRangeToggle: document.getElementById('dynamicRangeToggle'),
	dynamicRange: document.getElementById('dynamicRange'),
	dynamicRangeValue: document.getElementById('dynamicRangeValue'),
	dynamicRangeControl: document.getElementById('dynamicRangeControl'),
	convertBtn: document.getElementById('convertBtn'),
	downloadBtn: document.getElementById('downloadBtn'),
	imageCanvas: document.getElementById('imageCanvas'),
	imageCtx: document.getElementById('imageCanvas').getContext('2d'),
	spectrogramPreviewCanvas: document.getElementById('spectrogramPreviewCanvas'),
	spectrogramPreviewCtx: document.getElementById('spectrogramPreviewCanvas').getContext('2d'),
	audioPlayer: document.getElementById('audioPlayer'),
	loading: document.getElementById('loading'),
	frequencyShift: document.getElementById('frequencyShift'),
	frequencyShiftValue: document.getElementById('frequencyShiftValue')
};

// SETTINGS (default/initial values)
const config = {
	brightnessThreshold: 50,
	duration: 5.0,
	frequencyShift: 0,
	sampleRate: 44100, // sample rate: 11250, 22500, 24000, 44100, 48000, 88200, 96000, 176400, 192000 Hz
	bitDepth: 16,      // bit depth: 8, 12, 16, 24, 32 bits
	baseFrequency: 20, // base frequency (hz)
	get frequencySpan() { return Math.max(20, (this.sampleRate/2) - this.baseFrequency); }, // intervalo de frequencia (hz)
	useDynamicRange: false, // dynamicRange disabled by default
	dynamicRange: 24, // (6–12 dB) more uniform audio (little variation. ideal for images with smooth tones)
					  // (18–24 dB) balanced (natural dynamics. good for most cases)
					  // (30–48 dB) high dynamic range (sharp contrast. useful for crisp black and white images)
					  // (> 48 dB) extreme effect (may overemphasize small variations)
	fftSize: 512      //  spectrogram resolution
};

let currentImageData = null; // stores current image data

function debounce(func, wait) {
	let timeout;
	return function() {
		const context = this, args = arguments;
		clearTimeout(timeout);
		timeout = setTimeout(() => {
			func.apply(context, args);
		}, wait);
	};
}

function writeString(view, offset, string) {
	for (let i = 0; i < string.length; i++) {
		view.setUint8(offset + i, string.charCodeAt(i));
	}
}

function setupControlListeners() {
	const updatePreview = debounce(() => {
		if (elements.imageInput.files[0] && currentImageData) {
			drawSpectrogramPreview(currentImageData);
		}
	}, 200);

	elements.duration.addEventListener('input', () => {
		elements.durationValue.textContent = elements.duration.value;
		config.duration = parseFloat(elements.duration.value);
		updatePreview();
	});

	elements.brightnessThreshold.addEventListener('input', () => {
		elements.brightnessThresholdValue.textContent = elements.brightnessThreshold.value;
		config.brightnessThreshold = parseInt(elements.brightnessThreshold.value);
		updatePreview();
	});

	elements.frequencyShift.addEventListener('input', () => {
		elements.frequencyShiftValue.textContent = elements.frequencyShift.value;
		config.frequencyShift = parseInt(elements.frequencyShift.value);
		updatePreview();
	});

	elements.dynamicRangeToggle.addEventListener('change', function() {
		config.useDynamicRange = this.checked;
		elements.dynamicRangeControl.style.display = this.checked ? 'block' : 'none';
		if (currentImageData) {
			drawSpectrogramPreview(currentImageData);
		}
	});

	elements.dynamicRange.addEventListener('input', function() {
		elements.dynamicRangeValue.textContent = this.value;
		config.dynamicRange = parseInt(this.value);
		if (config.useDynamicRange && currentImageData) {
			drawSpectrogramPreview(currentImageData);
		}
	});
	
}

// processes image file
elements.imageInput.addEventListener('change', function(e) {
	const file = e.target.files[0];
	if (!file) return;

	const reader = new FileReader();
	reader.onload = function(event) {
		const img = new Image();
		img.onload = function() {
			try {
				// sets recommended maximum size
				const MAX_WIDTH = 1024;
				const MAX_HEIGHT = 512;
				const TARGET_WIDTH = 512;
				const TARGET_HEIGHT = 256;
				
				// checks and resizes if needed
				if (img.width > MAX_WIDTH || img.height > MAX_HEIGHT) {
					console.warn(`Big image! (${img.width}x${img.height}). Resized to ${TARGET_WIDTH}x${TARGET_HEIGHT}...`);
					
					// creates canvas for resizing
					const tempCanvas = document.createElement('canvas');
					tempCanvas.width = TARGET_WIDTH;
					tempCanvas.height = TARGET_HEIGHT;
					const ctx = tempCanvas.getContext('2d');
					
					// maintains original aspect ratio
					const ratio = Math.min(
						TARGET_WIDTH / img.width,
						TARGET_HEIGHT / img.height
					);
					const newWidth = Math.floor(img.width * ratio);
					const newHeight = Math.floor(img.height * ratio);
					
					// centers image on canvas
					const offsetX = (TARGET_WIDTH - newWidth) / 2;
					const offsetY = (TARGET_HEIGHT - newHeight) / 2;

					ctx.drawImage(img, offsetX, offsetY, newWidth, newHeight); // draws resized image

					// replaces original image with resized version
					img.width = TARGET_WIDTH;
					img.height = TARGET_HEIGHT;
					img.src = tempCanvas.toDataURL('image/png');
					
					alert(`Image optimized to ${newWidth}x${newHeight}px for better audio quality.`);
				}
				
				// processes image (original or resized)
				currentImageData = processImageData(img);
				displayImage(currentImageData);
				drawSpectrogramPreview(currentImageData);
				
			} catch (error) {
				alert('Error processing image: ' + error.message);
				console.error(error);
			}
		};
		img.onerror = function() {
			alert('Error loading image. Use PNG, JPEG or BMP formats.');
		};
		img.src = event.target.result;
	};
	reader.onerror = function() {
		alert('Error reading image file.');
	};
	reader.readAsDataURL(file);
});

elements.convertBtn.addEventListener('click', async () => {
	if (!elements.imageInput.files[0]) {
		alert('Please, select an image first');
		return;
	}
	
	elements.loading.style.display = 'block';
	elements.convertBtn.disabled = true;
	
	try {
		const file = elements.imageInput.files[0];
		const img = await loadImage(file);
		const imageData = processImageData(img);
		const audioData = await processImageToAudio(imageData);
		const wavBlob = createWavBlob(audioData);
		
		const url = URL.createObjectURL(wavBlob);
		elements.audioPlayer.src = url;
		elements.downloadBtn.disabled = false;
		
		elements.downloadBtn.onclick = () => {
			const a = document.createElement('a');
			a.href = url;
			a.download = 'output.wav';
			a.click();
		};
	} catch (error) {
		alert('Error converting image: ' + error.message);
		console.error(error);
	} finally {
		elements.loading.style.display = 'none';
		elements.convertBtn.disabled = false;
	}
});

document.addEventListener('DOMContentLoaded', function() {
	setupControlListeners();
});

// loads image
function loadImage(file) {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = (event) => {
			const img = new Image();
			img.onload = () => resolve(img);
			img.onerror = reject;
			img.src = event.target.result;
		};
		reader.onerror = reject;
		reader.readAsDataURL(file);
	});
}

// analyzes image file
function processImageData(img) {
	const canvas = document.createElement('canvas');
	canvas.width = img.width;
	canvas.height = img.height;
	const ctx = canvas.getContext('2d');
	ctx.drawImage(img, 0, 0);
	
	const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
	const pixels = new Uint8Array(img.width * img.height * 3);
	
	for (let i = 0, j = 0; i < imageData.data.length; i += 4, j += 3) {
		pixels[j] = imageData.data[i];
		pixels[j + 1] = imageData.data[i + 1];
		pixels[j + 2] = imageData.data[i + 2];
	}
	
	return {
		width: img.width,
		height: img.height,
		pixels: pixels
	};
}

// displays image on canvas
function displayImage(imageData) {
	// adjusts canvas size to maintain image proportions
	const maxWidth = 400;
	const maxHeight = 400;
	
	let displayWidth = imageData.width;
	let displayHeight = imageData.height;
	
	if (displayWidth > maxWidth || displayHeight > maxHeight) {
		const ratio = Math.min(maxWidth / displayWidth, maxHeight / displayHeight);
		displayWidth = Math.floor(displayWidth * ratio);
		displayHeight = Math.floor(displayHeight * ratio);
	}
	
	elements.imageCanvas.width = displayWidth;
	elements.imageCanvas.height = displayHeight;
	
	// creates 'ImageData' with display size
	const displayImageData = elements.imageCtx.createImageData(displayWidth, displayHeight);
	
	// resizes image while maintaining proportions
	const xRatio = imageData.width / displayWidth;
	const yRatio = imageData.height / displayHeight;
	
	for (let y = 0; y < displayHeight; y++) {
		for (let x = 0; x < displayWidth; x++) {
			const srcX = Math.floor(x * xRatio);
			const srcY = Math.floor(y * yRatio);
			
			const srcIdx = (srcY * imageData.width + srcX) * 3;
			const dstIdx = (y * displayWidth + x) * 4;
			
			displayImageData.data[dstIdx] = imageData.pixels[srcIdx];
			displayImageData.data[dstIdx + 1] = imageData.pixels[srcIdx + 1];
			displayImageData.data[dstIdx + 2] = imageData.pixels[srcIdx + 2];
			displayImageData.data[dstIdx + 3] = 255;
		}
	}
	
	elements.imageCtx.putImageData(displayImageData, 0, 0);
}

// draws spectrogram preview
function drawSpectrogramPreview(imageData) {
	const fftSize = config.fftSize;
	const maxFreq = config.baseFrequency + config.frequencySpan;
	
	// fixed width for preview
	const targetWidth = Math.min(800, imageData.width);
	const canvasHeight = Math.min(fftSize/2, 400);
	
	// configures canvas
	elements.spectrogramPreviewCanvas.width = targetWidth;
	elements.spectrogramPreviewCanvas.height = canvasHeight;
	
	// creates 'ImageData' for spectrogram
	const imageDataObj = elements.spectrogramPreviewCtx.createImageData(targetWidth, canvasHeight);
	
	
	const durationScale = config.duration / 5.0; // scale factor based on duration
	
	// creates spectrogram representation
	const spectrogramData = new Array(targetWidth);
	for (let x = 0; x < targetWidth; x++) {
		spectrogramData[x] = new Array(canvasHeight).fill(0);
		
		// calculates original position while maintaining centering
		const normalizedPos = (x - targetWidth/2) / durationScale + imageData.width/2;
		let srcX = Math.floor(normalizedPos);
		
		// ensures it's within image boundaries
		srcX = Math.max(0, Math.min(imageData.width - 1, srcX));
		
		for (let y = 0; y < imageData.height; y++) {
			const srcIdx = (y * imageData.width + srcX) * 3;
			const brightness = (imageData.pixels[srcIdx] + 
							  imageData.pixels[srcIdx+1] + 
							  imageData.pixels[srcIdx+2]) / 3;
			
			if (brightness >= config.brightnessThreshold) {
				const freq = config.baseFrequency + config.frequencyShift + 
							 (imageData.height - 1 - y) * (config.frequencySpan / imageData.height);
				const bin = Math.floor((freq / maxFreq) * canvasHeight);
				
				if (bin >= 0 && bin < canvasHeight) {
					spectrogramData[x][bin] = Math.max(spectrogramData[x][bin], brightness / 255);
				}
			}
		}
	}
	
	// fills with black background
	for (let i = 0; i < imageDataObj.data.length; i += 4) {
		imageDataObj.data[i] = 0;
		imageDataObj.data[i+1] = 0;
		imageDataObj.data[i+2] = 0;
		imageDataObj.data[i+3] = 255;
	}
	
	for (let x = 0; x < targetWidth; x++) {
		for (let y = 0; y < canvasHeight; y++) {
			const displayY = canvasHeight - 1 - y;
			const idx = (displayY * targetWidth + x) * 4;
			const rawIntensity = spectrogramData[x][y];
			
			if (rawIntensity > 0) {
				let displayIntensity;
				
				if (config.useDynamicRange) {
					// dynamic range mode
					const dbRange = config.dynamicRange;
					const minDb = -dbRange;
					const safeIntensity = Math.max(1e-6, rawIntensity);
					const intensityDb = 20 * Math.log10(safeIntensity);
					displayIntensity = (Math.max(minDb, intensityDb) - minDb) / dbRange;
				} else {
					// original mode (maybe a better resolution)
					displayIntensity = rawIntensity;
				}
				
				const color = getColor(displayIntensity);
				imageDataObj.data[idx] = color[0];
				imageDataObj.data[idx+1] = color[1];
				imageDataObj.data[idx+2] = color[2];
			}
		}
	}
	
	elements.spectrogramPreviewCtx.putImageData(imageDataObj, 0, 0);
}

// inferno colormap (full)
function getColor(intensity) {
	const colormap = [
		[0, 0, 3], [0, 0, 4], [0, 0, 6], [1, 0, 7],
		[1, 1, 9], [1, 1, 11], [2, 2, 13], [2, 2, 15],
		[3, 3, 17], [4, 3, 19], [4, 4, 21], [5, 4, 23],
		[6, 5, 25], [7, 5, 27], [8, 6, 29], [9, 6, 31],
		[10, 7, 34], [11, 7, 36], [12, 8, 38], [13, 8, 40],
		[14, 9, 42], [15, 9, 44], [16, 10, 47], [17, 10, 49],
		[18, 11, 51], [20, 11, 53], [21, 11, 55], [22, 11, 58],
		[23, 12, 60], [24, 12, 62], [26, 12, 64], [27, 12, 66],
		[28, 12, 69], [30, 12, 71], [31, 12, 73], [32, 12, 75],
		[34, 11, 77], [35, 11, 79], [37, 11, 81], [38, 11, 83],
		[40, 10, 85], [41, 10, 87], [43, 10, 89], [44, 10, 91],
		[46, 9, 93], [47, 9, 95], [49, 9, 97], [51, 9, 99],
		[52, 9, 101], [54, 9, 103], [55, 9, 105], [57, 9, 107],
		[59, 9, 108], [60, 9, 110], [62, 9, 112], [64, 9, 114],
		[65, 9, 115], [67, 10, 117], [69, 10, 118], [70, 10, 120],
		[72, 11, 121], [74, 11, 123], [75, 12, 124], [77, 12, 126],
		[79, 13, 127], [80, 13, 128], [82, 14, 129], [84, 14, 131],
		[85, 15, 132], [87, 15, 133], [89, 16, 134], [90, 16, 135],
		[92, 17, 136], [94, 18, 137], [95, 18, 138], [97, 19, 139],
		[99, 19, 140], [100, 20, 141], [102, 21, 142], [104, 21, 143],
		[105, 22, 144], [107, 23, 144], [109, 23, 145], [110, 24, 146],
		[112, 24, 147], [114, 25, 147], [115, 26, 148], [117, 26, 149],
		[119, 27, 149], [120, 28, 150], [122, 28, 151], [124, 29, 151],
		[125, 30, 152], [127, 30, 152], [129, 31, 153], [130, 31, 153],
		[132, 32, 154], [134, 33, 154], [135, 33, 155], [137, 34, 155],
		[139, 34, 156], [140, 35, 156], [142, 36, 156], [144, 36, 157],
		[145, 37, 157], [147, 37, 157], [149, 38, 158], [150, 38, 158],
		[152, 39, 158], [154, 40, 159], [155, 40, 159], [157, 41, 159],
		[159, 41, 159], [160, 42, 160], [162, 42, 160], [164, 43, 160],
		[165, 44, 160], [167, 44, 160], [169, 45, 161], [170, 45, 161],
		[172, 46, 161], [174, 46, 161], [175, 47, 161], [177, 48, 161],
		[178, 48, 161], [180, 49, 161], [182, 49, 161], [183, 50, 161],
		[185, 51, 161], [186, 51, 161], [188, 52, 161], [190, 52, 161],
		[191, 53, 161], [193, 53, 161], [194, 54, 161], [196, 55, 161],
		[198, 55, 161], [199, 56, 161], [201, 56, 160], [202, 57, 160],
		[204, 58, 160], [205, 58, 160], [207, 59, 160], [208, 59, 159],
		[210, 60, 159], [211, 61, 159], [213, 61, 159], [214, 62, 158],
		[216, 62, 158], [217, 63, 158], [219, 64, 157], [220, 64, 157],
		[222, 65, 157], [223, 66, 156], [224, 66, 156], [226, 67, 155],
		[227, 68, 155], [229, 68, 155], [230, 69, 154], [231, 70, 154],
		[233, 70, 153], [234, 71, 153], [235, 72, 152], [237, 73, 152],
		[238, 73, 151], [239, 74, 151], [240, 75, 150], [242, 76, 149],
		[243, 77, 149], [244, 77, 148], [245, 78, 148], [246, 79, 147],
		[247, 80, 146], [248, 81, 146], [249, 82, 145], [250, 83, 144],
		[251, 83, 144], [252, 84, 143], [253, 85, 142], [254, 86, 141],
		[254, 87, 141], [255, 88, 140], [255, 89, 139], [255, 90, 138],
		[255, 91, 137], [255, 92, 136], [255, 93, 136], [255, 94, 135],
		[255, 95, 134], [255, 96, 133], [255, 97, 132], [255, 98, 131],
		[255, 99, 130], [255, 100, 129], [255, 101, 128], [255, 102, 127],
		[255, 103, 126], [255, 104, 125], [255, 105, 124], [255, 106, 123],
		[255, 107, 122], [255, 108, 121], [255, 109, 120], [255, 110, 119],
		[255, 111, 118], [255, 112, 117], [255, 113, 116], [255, 114, 115],
		[255, 115, 114], [255, 116, 113], [255, 117, 112], [255, 118, 111],
		[255, 119, 110], [255, 120, 109], [255, 121, 108], [255, 122, 106],
		[255, 123, 105], [255, 124, 104], [255, 125, 103], [255, 126, 102],
		[255, 127, 101], [255, 128, 100], [255, 129, 98], [255, 130, 97],
		[255, 131, 96], [255, 132, 95], [255, 133, 94], [255, 134, 93],
		[255, 135, 91], [255, 136, 90], [255, 137, 89], [255, 138, 88],
		[255, 139, 87], [255, 140, 85], [255, 141, 84], [255, 142, 83],
		[255, 143, 82], [255, 144, 81], [255, 145, 79], [255, 146, 78],
		[255, 147, 77], [255, 148, 76], [255, 149, 75], [255, 150, 73],
		[255, 151, 72], [255, 152, 71], [255, 153, 70], [255, 154, 69],
		[255, 155, 67], [255, 156, 66], [255, 157, 65], [255, 158, 64],
		[255, 159, 63], [255, 160, 61], [255, 161, 60], [255, 162, 59],
		[255, 163, 58], [255, 164, 57], [255, 165, 55], [255, 166, 54],
		[255, 167, 53], [255, 168, 52], [255, 169, 51], [255, 170, 49],
		[255, 171, 48], [255, 172, 47], [255, 173, 46], [255, 174, 45],
		[255, 175, 43], [255, 176, 42], [255, 177, 41], [255, 178, 40],
		[255, 179, 39], [255, 180, 37], [255, 181, 36], [255, 182, 35],
		[255, 183, 34], [255, 184, 33], [255, 185, 31], [255, 186, 30],
		[255, 187, 29], [255, 188, 28], [255, 189, 27], [255, 190, 25],
		[255, 191, 24], [255, 192, 23], [255, 193, 22], [255, 194, 21],
		[255, 195, 19], [255, 196, 18], [255, 197, 17], [255, 198, 16],
		[255, 199, 15], [255, 200, 13], [255, 201, 12], [255, 202, 11],
		[255, 203, 10], [255, 204, 9], [255, 205, 7], [255, 206, 6],
		[255, 207, 5], [255, 208, 4], [255, 209, 3], [255, 210, 1],
		[255, 211, 0], [255, 212, 0], [255, 213, 0], [255, 214, 0],
		[255, 215, 0], [255, 216, 0], [255, 217, 0], [255, 218, 0],
		[255, 219, 0], [255, 220, 0], [255, 221, 0], [255, 222, 0],
		[255, 223, 0], [255, 224, 0], [255, 225, 0], [255, 226, 0],
		[255, 227, 0], [255, 228, 0], [255, 229, 0], [255, 230, 0],
		[255, 231, 0], [255, 232, 0], [255, 233, 0], [255, 234, 0],
		[255, 235, 0], [255, 236, 0], [255, 237, 0], [255, 238, 0],
		[255, 239, 0], [255, 240, 0], [255, 241, 0], [255, 242, 0],
		[255, 243, 0], [255, 244, 0], [255, 245, 0], [255, 246, 0],
		[255, 247, 0], [255, 248, 0], [255, 249, 0], [255, 250, 0],
		[255, 251, 0], [255, 252, 0], [255, 253, 0], [255, 254, 0],
		[255, 255, 0]
	];

	// const index = Math.min(colormap.length - 1, Math.floor(intensity * colormap.length));
	// return colormap[index];
	
	const position = intensity * (colormap.length - 1);
	const index1 = Math.floor(position);
	const index2 = Math.min(index1 + 1, colormap.length - 1);
	const frac = position - index1;

	// linear interpolation between adjacent colors (between colormap points)
	const color1 = colormap[index1];
	const color2 = colormap[index2];
	return [
		Math.round(color1[0] + frac * (color2[0] - color1[0])),
		Math.round(color1[1] + frac * (color2[1] - color1[1])),
		Math.round(color1[2] + frac * (color2[2] - color1[2]))
	];
}

// processes image to audio
async function processImageToAudio(imageData) {
	const totalSamples = Math.floor(config.sampleRate * config.duration);
	const audioData = new Float32Array(totalSamples);

	// pre-process pixel brightness
	const brightnessData = new Array(imageData.height);
	for (let y = 0; y < imageData.height; y++) {
		brightnessData[y] = new Array(imageData.width);
		for (let x = 0; x < imageData.width; x++) {
			const idx = (y * imageData.width + x) * 3;
			brightnessData[y][x] = (imageData.pixels[idx] + 
								  imageData.pixels[idx + 1] + 
								  imageData.pixels[idx + 2]) / 3;
		}
	}
	
	// determines encoding parameters
	const timePerLine = config.duration / imageData.width;
	const freqPerPixel = config.frequencySpan / imageData.height;
	const baseFreq = config.baseFrequency + config.frequencyShift;
	
	// HORIZONTAL ENCODING: each column = moment in time, each row = frequency
	for (let x = 0; x < imageData.width; x++) {
		const startTime = x * timePerLine;
		const endTime = (x + 1) * timePerLine;
		const startSample = Math.floor(startTime * config.sampleRate);
		const endSample = Math.min(totalSamples, Math.floor(endTime * config.sampleRate));
		
		for (let y = 0; y < imageData.height; y++) {
			const brightness = brightnessData[y][x];
			if (brightness < config.brightnessThreshold) continue;
			
			const freq = baseFreq + (imageData.height - 1 - y) * freqPerPixel;
			const amplitude = brightness / 255;
			
			for (let i = startSample; i < endSample; i++) {
				const t = i / config.sampleRate;
				audioData[i] += amplitude * Math.sin(2 * Math.PI * freq * t);
			}
		}
	}
	
	normalizeAudio(audioData);
	
	return audioData;
}

// normalizes audio to prevent clipping
function normalizeAudio(audioData) {
	let maxAmplitude = 0;
	for (let i = 0; i < audioData.length; i++) {
		maxAmplitude = Math.max(maxAmplitude, Math.abs(audioData[i]));
	}
	
	if (maxAmplitude > 0) {
		if (config.useDynamicRange) { // dynamic range mode
			const scale = (10 ** (config.dynamicRange / 20)) / maxAmplitude;
			const minAmplitude = scale * (10 ** (-config.dynamicRange / 20));
			
			for (let i = 0; i < audioData.length; i++) {
				const sign = Math.sign(audioData[i]);
				audioData[i] = sign * Math.max(minAmplitude, Math.abs(audioData[i]) * scale);
			}
		} else { // original mode
			const scale = 0.8 / maxAmplitude;
			for (let i = 0; i < audioData.length; i++) {
				audioData[i] *= scale;
			}
		}
	}
}

// creates WAV file
function createWavBlob(audioData) {
	const numChannels = 1;
	const bitsPerSample = config.bitDepth;
	
	// converts float32 to selected bit format
	let audioView;
	if(config.bitDepth === 8) {
		const int8Data = new Uint8Array(audioData.length);
		for (let i = 0; i < audioData.length; i++) {
			int8Data[i] = Math.max(0, Math.min(255, Math.floor((audioData[i] + 1) * 127.5)));
		}
		audioView = int8Data;
	} else if(config.bitDepth === 16) {
		const int16Data = new Int16Array(audioData.length);
		for (let i = 0; i < audioData.length; i++) {
			int16Data[i] = Math.max(-32768, Math.min(32767, audioData[i] * 32767));
		}
		audioView = int16Data;
	} else if(config.bitDepth === 24) {
		// 24-bit implementation (requires special handling)
		const buffer = new ArrayBuffer(audioData.length * 3);
		const view = new DataView(buffer);
		for (let i = 0; i < audioData.length; i++) {
			const sample = Math.max(-8388608, Math.min(8388607, audioData[i] * 8388607));
			view.setInt24(i * 3, sample, true);
		}
		audioView = buffer;
	} else if(config.bitDepth === 32) {
		const int32Data = new Int32Array(audioData.length);
		for (let i = 0; i < audioData.length; i++) {
			int32Data[i] = Math.max(-2147483648, Math.min(2147483647, audioData[i] * 2147483647));
		}
		audioView = int32Data;
	}

	const byteRate = config.sampleRate * numChannels * bitsPerSample / 8;
	const blockAlign = numChannels * bitsPerSample / 8;
	const subChunk2Size = audioData.length * numChannels * bitsPerSample / 8;
	
	// creates WAV buffer
	const buffer = new ArrayBuffer(44 + subChunk2Size);
	const view = new DataView(buffer);
	
	// writes WAV header
	writeString(view, 0, 'RIFF');
	view.setUint32(4, 36 + subChunk2Size, true);
	writeString(view, 8, 'WAVE');
	writeString(view, 12, 'fmt ');
	view.setUint32(16, 16, true);
	view.setUint16(20, 1, true); // PCM Format
	view.setUint16(22, numChannels, true);
	view.setUint32(24, config.sampleRate, true);
	view.setUint32(28, byteRate, true);
	view.setUint16(32, blockAlign, true);
	view.setUint16(34, bitsPerSample, true);
	writeString(view, 36, 'data');
	view.setUint32(40, subChunk2Size, true);
	
	// writes audio data
	if(config.bitDepth === 8) {
		new Uint8Array(buffer, 44).set(audioView);
	} else if(config.bitDepth === 16) {
		new Int16Array(buffer, 44).set(audioView);
	} else if(config.bitDepth === 24) {
		// special implementation for 24-bit
		new Uint8Array(buffer, 44).set(new Uint8Array(audioView));
	} else if(config.bitDepth === 32) {
		new Int32Array(buffer, 44).set(audioView);
	}
	
	return new Blob([view], { type: 'audio/wav' });
}

// helper for writing 24-bit integers
DataView.prototype.setInt24 = function(pos, val, littleEndian) {
	this.setUint8(pos, val & 0xff);
	this.setUint8(pos + 1, (val >> 8) & 0xff);
	this.setUint8(pos + 2, (val >> 16) & 0xff);
};