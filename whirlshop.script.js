"use strict;"

var ws = new whirlshop({
	canvas: document.getElementById("shapeCanvas"),
	hoverCanvas: document.getElementById("hoverCanvas")
});

var mouseDown = false,
mouseDraggingPoint = false;


// Event listeners
hoverCanvas.addEventListener('mousemove', mouseMoveHandler);
hoverCanvas.addEventListener('mousedown', function (event) {
	mouseDown = true;
});
hoverCanvas.addEventListener('mouseup', function (event) {
	if (!mouseDraggingPoint)
		ws.addPoint(ws.hoverPoint || {x: event.offsetX, y: event.offsetY});
	mouseDown = false;
	mouseDraggingPoint = false;
});

window.addEventListener('resize', function(){
	ws.resizeCanvas();
});

ws.resizeCanvas();

// Plus sign in front of $(this).val() returns numerical value instead of string
$('#sides-select').on('change', function() {
	ws.settings['numSides'] = +$(this).val();
});
$('#slope-select').on('change', function() {
	ws.settings['delta'] = +$(this).val();
});
$('#height-select').on('change', function() {
	ws.settings['amountToDraw'] = +$(this).val();
});
$('#slope-select').on('change', function() {
	ws.settings['delta'] = +$(this).val();
});
$('#height-select').on('change', function() {
	ws.settings['amountToDraw'] = +$(this).val();
});
$('#clockwise-check').click(function() {
	ws.settings['cclockwise'] = !this.checked;
});
$('#layers-select').click(function() {
	ws.settings['numLayers'] = +$(this).val();
});


function mouseMoveHandler(event) {
	var i,
	sl,
	j,
	spl,
	mousePoint = {x: event.offsetX, 
		y: event.offsetY};

	if (mouseDown && ws.hoverPoint)
		mouseDraggingPoint = true;

	if (mouseDraggingPoint) { // If point is being dragged		
		ws.movePoints(mousePoint);
	}
	else { // Point is not being dragged
		ws.setHoverPoint(mousePoint);
	}

	ws.drawHoverPoint();
}