// Harmonic Dissonance Curve
// p5.js sketch
// https://github.com/eduvf/Harmonic-Dissonance-Curve

// Display config
const canvasWidth = 800;
const canvasHeight = 500;

// FFT config
const RESOLUTION = 2 ** 10;
const BUF_LENGTH = RESOLUTION / 4;

// Sound vars
snd = null;
sndReady = false;
sndColor = 'white';
sndState = "Sound not loaded, please click any 'load sound' button.";

//--------------------------------------------------------------

function calcCanvasWidth() {
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

function setup() {
	createCanvas(calcCanvasWidth(), canvasHeight);

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
}

function windowResized() {
	resizeCanvas(calcCanvasWidth(), height);
}
