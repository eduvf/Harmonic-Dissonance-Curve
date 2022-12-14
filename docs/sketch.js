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

function initVariables() {
	bufActive = Array(BUF_LENGTH).fill(0);
	bufStatic = Array(BUF_LENGTH).fill(0);
	bufSpikes = Array(BUF_LENGTH).fill(0);
	bufSmooth = Array(BUF_LENGTH).fill(0);
	bufDiffer = Array(BUF_LENGTH).fill(0);
	bufDisson = Array(BUF_LENGTH).fill(0);

	storeAverage = false;
	arrayAverage = [];

	offsetDiffer = 0;
	offsetDisson = 0;
}

function getSnd(s) {
	sndReady = false; // inhabilita el so, per si de cas
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
	// 'arrayAverage', desant-ne el resultat a 'bufStatic'
	for (let i = 0; i < BUF_LENGTH; i++) {
		let sum = 0;
		arrayAverage.forEach((buf) => {
			sum += buf[i];
		});
		bufStatic[i] = sum / arrayAverage.length;
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

function calcDiffer() {
	// Calcula la diferència entre 'bufSmooth' fixe i
	// 'bufSmooth' + 'offsetDiffer' i avança l'offset
	for (let i = 0; i < BUF_LENGTH; i++) {
		let j = (i + offsetDiffer) % BUF_LENGTH;
		bufDiffer[i] = abs(bufSmooth[i] - bufSmooth[j]);
	}
	offsetDiffer++;
}

function calcDisson() {
	// Calcula la corba de dissonància
	if (offsetDisson < BUF_LENGTH) {
		// Introdueix la suma de la dissonància
		let sum = bufDiffer.reduce((total, n) => total + n);
		// Ajusta al màxim valor possible (màxima dissonància)
		// quan cap harmònic coincideix
		let maxPossible = bufSmooth.reduce((total, n) => total + n) * 2;
		// Mapeja-ho dins del rang 0-255
		bufDisson[offsetDisson] = map(sum, 0, maxPossible, 0, 255);

		offsetDisson++;
	} else {
		offsetDisson = 0;
	}
}

//--------------------------------------------------------------

// Executa en cada frame
function update() {
	// Si s'està reproduint el so, fes-ne l'anàlisi
	if (sndReady) {
		if (snd.isPlaying()) {
			analyzeFFT();
		}
	}
	// Desa l'espectre
	if (storeAverage) {
		noStroke();
		fill('red');
		text("Saving buffer state... Press 'store' again to stop.", 10, 40);
		arrayAverage.push(bufActive.slice());
	}
}

//--------------------------------------------------------------

function getCanvasWidth() {
	return windowWidth < canvasWidth + 20 ? windowWidth - 20 : canvasWidth;
}

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
	initVariables();
	createCanvas(getCanvasWidth(), canvasHeight);

	createButton('play').mousePressed(() => snd.play());
	createButton('stop').mousePressed(() => snd.stop());
	createButton('store').mousePressed(() => (storeAverage = !storeAverage));
	createButton('average').mousePressed(() => calcAverage());
	createButton('spikes').mousePressed(() => calcSpikes(sliderSpikes.value));
	createButton('smooth').mousePressed(() => calcSmooth(sliderSmooth.value));
	createButton('difference').mousePressed(() => calcDiffer());
	createButton('dissonance').mousePressed(() => calcDisson());
	createElement('hr');
	sliderSpikes = createSlider(0, 256, 128);
	sliderSmooth = createSlider(0.5, 2, 1);
	createElement('hr');
	createButton('load bowl sound').mousePressed(() =>
		getSnd('sounds/Bowl-tib-A%233-f.wav')
	);
	createFileInput(getUserSnd);
}

function draw() {
	background(0);

	update();

	// Mostra l'estat del so (carregat o no)
	noStroke();
	fill(sndColor);
	text(sndState, 10, 20);

	// Mostra les corbes
	drawSpectrum('red', bufActive, height * 0.2, 0);
	drawSpectrum('magenta', bufStatic, height * 0.2, 0);
	drawSpectrum('cyan', bufSpikes, height * 0.4, height * 0.2);
	drawSpectrum('lime', bufSmooth, height * 0.6, height * 0.4);
	drawSpectrum('yellow', bufDiffer, height * 0.8, height * 0.6);
	drawSpectrum('white', bufDisson, height * 1.0, height * 0.8);
}

function windowResized() {
	resizeCanvas(getCanvasWidth(), height);
}
