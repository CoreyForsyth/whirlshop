"use strict;"

var ws = new whirlshop({
	canvas: document.getElementById("shapeCanvas"),
	hoverCanvas: document.getElementById("hoverCanvas"),
	settings: {}
});

var hoverPoint = undefined,
mouseDown = false,
mouseDraggingPoint = false;
// Event listeners


//hoverCanvas.addEventListener('click', clickHandler);
hoverCanvas.addEventListener('mousemove', debounce(mouseMoveHandler, 13));
hoverCanvas.addEventListener('mousedown', function (event) {
	mouseDown = true;
});
hoverCanvas.addEventListener('mouseup', function (event) {
	if (!mouseDraggingPoint)
		ws.addPoint(hoverPoint || {x: event.offsetX, y: event.offsetY});
	mouseDown = false;
	mouseDraggingPoint = false;
});

window.addEventListener('resize', debounce(ws.resizeCanvas, 100));

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

	if (mouseDown && hoverPoint)
		mouseDraggingPoint = true;

	if (mouseDraggingPoint) { // If point is being dragged		
		for (i = 0, sl = ws.shapes.length; i < sl; i++){
			for (j = 0, spl = ws.shapes[i].sides; j < spl; j++){
				if (ws.shapes[i].points[j] == hoverPoint) {
					ws.shapes[i].points[j] = mousePoint;
					ws.shapes[i].points.splice(ws.shapes[i].sides);
					ws.shapes[i].calculatePoints();
					break;
				}
			}
		}
		ws.activePoints[ws.activePoints.indexOf(hoverPoint)] = mousePoint;
		ws.allPoints[ws.allPoints.indexOf(hoverPoint)] = mousePoint;
		hoverPoint = mousePoint;
		ws.redrawShapes();
	}
	else { // Point is not being dragged
		hoverPoint = undefined;

		var minDistance = Infinity,
		closestPoint = {},
		dist;

		// Find the closest point within the 'snapDistance' radius
		ws.allPoints.forEach(function(p){
			dist = distance(p, mousePoint);
			if (dist < ws.settings['snapDistance'] && dist < minDistance) {
				minDistance = dist;
				closestPoint = p;
			}
		});

		if (minDistance != Infinity) { // If point is found, set hoverPoint to reference it
			hoverPoint = closestPoint;
		} 
		else { // Otherwise, check if mouse is within 'snapDistance' of the edge of the screen
			if (event.offsetY < ws.settings['snapDistance'])
				closestPoint.y = 0;
			else if (event.offsetY > ws.hoverCanvas.height - ws.settings['snapDistance'])
				closestPoint.y = ws.hoverCanvas.height;

			if (event.offsetX < ws.settings['snapDistance'])
				closestPoint.x = 0;
			else if (event.offsetX > ws.hoverCanvas.width - ws.settings['snapDistance'])
				closestPoint.x = ws.hoverCanvas.width;
			
			if (typeof closestPoint.x !== 'undefined' 
				|| typeof closestPoint.y !== 'undefined') { // If within bounds of a border

				hoverPoint = closestPoint;
				if (typeof hoverPoint.x === 'undefined')
					hoverPoint.x = event.offsetX;
				if (typeof hoverPoint.y === 'undefined')
					hoverPoint.y = event.offsetY;
			}
		}
	}

	ws.hoverCtx.clearRect(0, 0, hoverCanvas.width, hoverCanvas.height);
	if (typeof hoverPoint !== 'undefined') {		
		ws.hoverCtx.fillStyle = "rgba(200,200,200,.5)";
		drawCircle(ws.hoverCtx, hoverPoint, ws.settings['snapDistance']);
	}
}