//--------------------------------------------------------------

function calcCanvasWidth() {
	return windowWidth < 820 ? windowWidth : 800;
}

//--------------------------------------------------------------

function setup() {
	createCanvas(calcCanvasWidth(), 800);
}

function draw() {
	background(10);
}

function windowResized() {
	resizeCanvas(calcCanvasWidth(), height);
}
