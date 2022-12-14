// Harmonic Dissonance Curve
// p5.js sketch
// https://github.com/eduvf/Harmonic-Dissonance-Curve

// Display config
const canvasWidth = 800;
const canvasHeight = 500;

// FFT config
const RESOLUTION = 2 ** 10;
const BUF_LENGTH = RESOLUTION / 4;

// Init FFT
fft = new p5.FFT(0, RESOLUTION);

// Sound vars
snd = null;
sndReady = false;
sndColor = 'white';
sndState = "Sound not loaded, please click any 'load sound' button.";

//--------------------------------------------------------------

function init() {
	bufActive = Array(BUF_LENGTH).fill(0);
	bufStatic = Array(BUF_LENGTH).fill(0);
	bufSpikes = Array(BUF_LENGTH).fill(0);
	bufSmooth = Array(BUF_LENGTH).fill(0);
	bufDiffer = Array(BUF_LENGTH).fill(0);

	arrayBufActive = [];
	arrayBufStatic = [];
	arrayBufSmooth = [];

	offset = 0;
}

function getCanvasWidth() {
	return windowWidth < canvasWidth + 20 ? windowWidth - 20 : canvasWidth;
}

function getSnd(s) {
	snd = loadSound(
		s,
		() => {
			// S'ha carregat bé
			sndColor = 'lime';
			sndState = 'Sound loaded successfully!';
			sndReady = true;
		},
		() => {
			// Hi ha hagut un error
			sndColor = 'red';
			sndState = 'Error loading the sound. Please try again.';
		},
		() => {
			// S'està carregant el so
			sndColor = 'white';
			sndState = 'Loading sound...';
		}
	);
}

function getUserSnd(file) {
	if (file.type === 'audio') {
		getSnd(file.data);
	} else {
		sndColor = 'red';
		sndState = 'Not an audio file.';
	}
}

//--------------------------------------------------------------

function analyzeFFT() {
	// Realitza l'FFT del so i desa'l en 'bufActive'
	let spectrum = fft.analyze();
	for (let i = 0; i < BUF_LENGTH; i++) {
		bufActive[i] = spectrum[i];
	}
}

function calcAverage() {
	// Calcula la mitjana de tots els arrays desats a
	// 'arrayBufActive', desant-ne el resultat a 'bufStatic'
	for (let i = 0; i < BUF_LENGTH; i++) {
		let sum = 0;
		arrayBufActive.forEach((buf) => {
			sum += buf[i];
		});
		bufStatic[i] = sum / arrayBufActive.length;
	}
}

function calcSpikes(value) {
	// Donat un valor 'value' entre 0 i 255, desa els pics de
	// l'espectre 'bufStatic' que el superen, en 'bufSpikes'
	for (let i = 0; i < BUF_LENGTH; i++) {
		if (bufStatic[i] > value) {
			bufSpikes[i] = bufStatic[i];
		} else {
			bufSpikes[i] = 0;
		}
	}
}

function calcSmooth(value) {
	// Aplica una convolució (la finestra 'win') als pics
	// ('bufSpikes') i desa el resultat a 'bufSmooth'
	let win = [0.1, 0.2, 0.5, 0.8, 0.9, 1, 0.9, 0.8, 0.5, 0.2, 0.1];
	let mid = floor(win.length / 2);
	for (let i = mid; i < BUF_LENGTH - mid; i++) {
		let x = bufSpikes[i];
		for (let j = 0; j < len; j++) {
			bufSmooth[i + j - mid] += win[j] * x * value;
		}
	}

	// Ajusta al rang
	let m = max(bufSmooth);
	for (let i = 0; i < BUF_LENGTH; i++) {
		bufSmooth[i] = map(bufSmooth[i], 0, m, 0, 255);
	}
}

//--------------------------------------------------------------

function drawSpectrum(col, buf, top, bottom) {
	noFill();
	stroke(col);
	beginShape();
	let x, y;
	for (let i = 0; i < buf.length; i++) {
		x = map(i, 0, buf.length, 0, width);
		y = map(buf[i], 0, 255, top, bottom);
		vertex(x, y);
	}
	endShape();
}

//--------------------------------------------------------------

function setup() {
	init();
	createCanvas(getCanvasWidth(), canvasHeight);

	createButton('play').mousePressed(() => snd.play());
	createButton('stop').mousePressed(() => snd.stop());
	createButton('B');
	createButton('X');
	createElement('hr');
	createButton('load bowl sound').mousePressed(() =>
		getSnd('sounds/Bowl-tib-A%233-f.wav')
	);
	createFileInput(getUserSnd);
}

function draw() {
	background(0);

	// Mostra l'estat del so (carregat o no)
	noStroke();
	fill(sndColor);
	text(sndState, 10, 20);

	// Mostra les corbes
	drawSpectrum('magenta', bufActive, height * 0.25, 0);
	drawSpectrum('cyan', bufStatic, height * 0.25, 0);
	drawSpectrum('lime', bufSpikes, height * 0.5, height * 0.25);
	drawSpectrum('yellow', bufSmooth, height * 0.75, height * 0.5);
	drawSpectrum('white', bufDiffer, height, height * 0.75);
}

function windowResized() {
	resizeCanvas(getCanvasWidth(), height);
}
