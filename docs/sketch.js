function setup() {
	// Config
	const RESOLUTION = 2 ** 12;
	const BUF_LENGTH = floor(RESOLUTION / 4);

	// Carrega el so
	snd = loadSound('Bowl-tib-A#3-f.wav');
	//snd = loadSound("sweep.wav");

	// Inicialitza l'FFT
	fft = new p5.FFT(0, RESOLUTION);
	fft.setInput(snd);

	// Inicialitza els arrays
	buffer = Array(BUF_LENGTH).fill(0);
	bufferArray = [];
	average = Array(BUF_LENGTH).fill(0);
	spikes = Array(BUF_LENGTH).fill(0);
	spikesKeep = null;
	differ = Array(BUF_LENGTH).fill(0);
	disson = Array(BUF_LENGTH).fill(0);

	// Altres variables
	storeAverage = false;
	enableDisson = false;
	offset = 0;

	// Interfície
	createCanvas(500, 600);
	createButton('play').mousePressed(() => snd.play());
	createButton('stop').mousePressed(() => snd.stop());
	createButton('average').mousePressed(() => calcAverage());
	createButton('exaggerate').mousePressed(() => calcExaggerate());
	slider = createSlider(0, 255, 128).changed(() => calcSpikes());
	createButton('smooth').mousePressed(() => calcSmooth());
	createButton('keep').mousePressed(() => (spikesKeep = spikes.slice()));
	createButton('difference').mousePressed(() => calcDiffer());
	createButton('dissonance').mousePressed(
		() => (enableDisson = !enableDisson)
	);
}

function calcAverage() {
	if (storeAverage) {
		for (let i = 0; i < average.length; i++) {
			let sum = 0;
			bufferArray.forEach((buf) => {
				sum += buf[i];
			});
			average[i] = sum / bufferArray.length;
		}
	}
	storeAverage = !storeAverage;
}

function calcExaggerate() {
	for (let i = 0; i < average.length; i++) {
		average[i] = average[i] ** 1.5;
	}
	let maximum = max(average);
	for (let i = 0; i < average.length; i++) {
		average[i] = map(average[i], 0, maximum, 0, 255);
	}
}

function calcSpikes() {
	for (let i = 0; i < spikes.length; i++) {
		if (average[i] > slider.value()) {
			spikes[i] = average[i];
		} else {
			spikes[i] = 0;
		}
	}
}

function calcSmooth() {
	let array = spikes.slice();

	// Donada una finestra de valors
	let win = [0.1, 0.2, 0.5, 0.8, 0.9, 1, 0.9, 0.8, 0.5, 0.2, 0.1];
	let len = win.length;
	let mid = floor(len / 2);
	// Multplica per cada valor de 'spikes' i suma-ho a 'differ'
	for (let i = mid; i < spikes.length - mid; i++) {
		let value = spikes[i];
		for (let j = 0; j < len; j++) {
			array[i + j - mid] += win[j] * value;
		}
	}

	let maximum = max(array);
	for (let i = 0; i < array.length; i++) {
		array[i] = map(array[i], 0, maximum, 0, 255);
	}

	spikes = array;
}

function calcDiffer() {
	// Calcula la dissonància (harmònics que coincideixen es cancel·len entre si)
	for (let i = 0; i < differ.length; i++) {
		differ[i] = abs(spikesKeep[i] - spikes[i]);
	}
	// Desplaça tots els valors de 'spikes' un pas a la dreta
	for (let i = spikes.length - 1; i > 0; i--) {
		spikes[i] = spikes[i - 1];
	}
	spikes[0] = 0;
}

function calcDissonance() {
	if (offset < disson.length) {
		// Calcula la dissonància
		calcDiffer();

		// Introdueix la suma de la dissonància
		let sum = differ.reduce((total, n) => total + n);
		// Ajusta al màxim valor possible (màxima dissonància)
		// quan cap harmònic coincideix
		let maxPossible = spikesKeep.reduce((total, n) => total + n) * 2;
		// Mapeja-ho dins del rang 0-255
		disson[offset] = map(sum, 0, maxPossible, 0, 255);

		// Avança al següent offset
		offset++;
	} else {
		offset = 0;
		enableDisson = false;
	}
}

////////////////////////////////

function draw() {
	background(0);

	if (snd.isPlaying()) {
		// Analitza l'FFT
		let spec = fft.analyze();

		// Desa l'espectre al buffer
		for (let i = 0; i < buffer.length; i++) {
			buffer[i] = spec[i];
		}
	}

	// Desa el buffer en bufferArray
	if (storeAverage) {
		noStroke();
		fill('red');
		text('Saving buffer state...', 10, 20);
		bufferArray.push(buffer.slice());
	}

	// Mostra si s'han desat els spikes a keepSpikes
	if (spikesKeep) {
		noStroke();
		fill('lime');
		text('Spikes kept!', 10, 20);
	}

	// Calcula la corba de dissonància
	if (enableDisson) {
		calcDissonance();
	}

	drawSpectrum('yellow', buffer, height * 0.2, 0);
	drawSpectrum('cyan', average, height * 0.4, height * 0.2);
	drawSpectrum('magenta', spikes, height * 0.6, height * 0.4);
	drawSpectrum('lime', differ, height * 0.8, height * 0.6);
	drawSpectrum('white', disson, height, height * 0.8);
}

function drawSpectrum(color, buf, y1, y2) {
	noFill();
	stroke(color);
	beginShape();
	for (let i = 0; i < buf.length; i++) {
		let x = map(i, 0, buf.length, 0, width);
		let y = map(buf[i], 0, 255, y1, y2);
		vertex(x, y);
	}
	endShape();
}
