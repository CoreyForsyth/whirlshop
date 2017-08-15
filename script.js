"use strict;"

// Global Variables
var canvas = document.getElementById("shapeCanvas"),
hoverCanvas = document.getElementById("hoverCanvas"),
ctx = canvas.getContext("2d"),
hoverCtx = hoverCanvas.getContext("2d"),
points = [],
clickedPoints = [],
shapes = [],
hoverPoint = undefined,
mouseDown = false,
mouseDraggingPoint = false;


// Global settings
var settings = {
	numSides: 5,
	delta: 5,
	numLayers: 1,
	amountToDraw: 50,
	snapDistance: 10,
	cclockwise: false
};

// Event listeners
//hoverCanvas.addEventListener('click', clickHandler);
hoverCanvas.addEventListener('mousemove', debounce(mouseMoveHandler, 13));
hoverCanvas.addEventListener('mousedown', function (event) {
	mouseDown = true;
});
hoverCanvas.addEventListener('mouseup', function (event) {
	if (!mouseDraggingPoint)
		addPointHandler(event);
	mouseDown = false;
	mouseDraggingPoint = false;
});

window.addEventListener('resize', debounce(resizeCanvas, 100));

function resizeCanvas() {
    canvas.width = window.innerWidth - 250;
    canvas.height = window.innerHeight;
    hoverCanvas.width = window.innerWidth - 250;
    hoverCanvas.height = window.innerHeight;

	redrawShapes(); 
}
resizeCanvas();

// Debouncing from https://davidwalsh.name/javascript-debounce-function
function debounce(func, wait, immediate) {
	var timeout;
	return function() {
		var context = this, args = arguments;
		var later = function() {
			timeout = null;
			if (!immediate) func.apply(context, args);
		};
		var callNow = immediate && !timeout;
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
		if (callNow) func.apply(context, args);
	};
};

// Plus sign in front of $(this).val() returns numerical value instead of string
$('#sides-select').on('change', function() {
	settings['numSides'] = +$(this).val();
});
$('#slope-select').on('change', function() {
	settings['delta'] = +$(this).val();
});
$('#height-select').on('change', function() {
	settings['amountToDraw'] = +$(this).val();
});
$('#slope-select').on('change', function() {
	settings['delta'] = +$(this).val();
});
$('#height-select').on('change', function() {
	settings['amountToDraw'] = +$(this).val();
});
$('#clockwise-check').click(function() {
	settings['cclockwise'] = !this.checked;
});
$('#layers-select').click(function() {
	settings['numLayers'] = +$(this).val();
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
		for (i = 0, sl = shapes.length; i < sl; i++){
			for (j = 0, spl = shapes[i].points.length; j < spl; j++){
				if (shapes[i].points[j] == hoverPoint) {
					shapes[i].points[j] = mousePoint;
					shapes[i].points.splice(shapes[i].sides);
					shapes[i].calculatePoints();
					break;
				}
			}
		}
		points[points.indexOf(hoverPoint)] = mousePoint;
		clickedPoints[clickedPoints.indexOf(hoverPoint)] = mousePoint;
		hoverPoint = mousePoint;
		redrawShapes();
	}
	else { // Point is not being dragged
		hoverPoint = undefined;

		var minDistance = Infinity,
		closestPoint = {},
		dist;

		// Find the closest point within the 'snapDistance' radius
		clickedPoints.forEach(function(p){
			dist = distance(p, {x: event.offsetX, y: event.offsetY});
			if (dist < settings['snapDistance'] && dist < minDistance) {
				minDistance = dist;
				closestPoint = p;
			}
		});

		if (minDistance != Infinity) { // If point is found, set hoverPoint to reference it
			hoverPoint = closestPoint;
		} 
		else { // Otherwise, check if mouse is within 'snapDistance' of the edge of the screen
			if (event.offsetY < settings['snapDistance'])
				closestPoint.y = 0;
			else if (event.offsetY > hoverCanvas.height - settings['snapDistance'])
				closestPoint.y = hoverCanvas.height;

			if (event.offsetX < settings['snapDistance'])
				closestPoint.x = 0;
			else if (event.offsetX > hoverCanvas.width - settings['snapDistance'])
				closestPoint.x = hoverCanvas.width;
			
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

	hoverCtx.clearRect(0, 0, hoverCanvas.width, hoverCanvas.height);
	if (typeof hoverPoint !== 'undefined') {		
		hoverCtx.beginPath();
		hoverCtx.fillStyle = "rgba(200,200,200,.5)";
		hoverCtx.arc(hoverPoint.x, hoverPoint.y, settings['snapDistance'], 0, 2 * Math.PI);
		hoverCtx.fill();
		hoverCtx.closePath();
	}
}

function distance(p1, p2) {
	return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
}

function addPointHandler(event) {
	if (points.length > 2 && checkIfInsidePoints(event.offsetX, event.offsetY, points))
		return;
	var clickedPoint = hoverPoint || {x: event.offsetX, y: event.offsetY};

	if (~points.indexOf(clickedPoint))
		return;
	points.push(clickedPoint);
	if (!~clickedPoints.indexOf(clickedPoint))
		clickedPoints.push(clickedPoint);

	// Draw point on shape canvas
	ctx.beginPath();
	ctx.fillStyle = "rgb(255,0,10)";
	ctx.arc(clickedPoint.x, clickedPoint.y, 3, 0, 2 * Math.PI);
	ctx.fill();
	ctx.closePath();

	if (points.length % settings['numSides'] == 0) {
		for (var i = 0; i < points.length; i++) {
			ctx.beginPath();
			ctx.fillStyle = "rgb(10,0,255)";
			ctx.arc(points[i].x, points[i].y, 3, 0, 2 * Math.PI);
			ctx.fill();
			ctx.closePath();
		}
		shapes.push(new Shape(points, settings));
		points = [];
		shapes[shapes.length - 1].normalize().calculatePoints().drawShape(ctx);
	}
}

// From stackoverflow
function less(a, b, cx, cy) {
    if (a.x - cx >= 0 && b.x - cx < 0)
        return true;
    if (a.x - cx < 0 && b.x - cx >= 0)
        return false;
    if (a.x - cx == 0 && b.x - cx == 0) {
        if (a.y - cy >= 0 || b.y - cy >= 0)
            return a.y > b.y;
        return b.y > a.y;
    }

    // Compute the cross product of vectors (center -> a) x (center -> b)
    var det = (a.x - cx) * (b.y - cy) - (b.x - cx) * (a.y - cy);
    if (det < 0)
        return true;
    if (det > 0)
        return false;

    // Points a and b are on the same line from the center
    // Check which point is closer to the center
    var d1 = (a.x - cx) * (a.x - cx) + (a.y - cy) * (a.y - cy);
    var d2 = (b.x - cx) * (b.x - cx) + (b.y - cy) * (b.y - cy);
    return d1 > d2;
}

function checkIfInsidePoints(testx, testy, points) {
	var c = false,
	i,
	j;
	for (i = 0, j = points.length - 1; i < points.length; j = i++) {
		if (((points[i].y > testy) != (points[j].y > testy))
			&& (testx < (points[j].x - points[i].x) * (testy - points[i].y) / (points[j].y - points[i].y) + points[i].x))
			c = !c;
	}
	return c;
}

function redrawShapes() {
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	shapes.forEach(function(s) {
		s.drawShape(ctx);
	});
	clickedPoints.forEach(function(p) {
		ctx.beginPath();
		ctx.fillStyle = "rgb(10,0,255)";
		ctx.arc(p.x, p.y, 3, 0, 2 * Math.PI);
		ctx.fill();
		ctx.closePath();
	});
	points.forEach(function(p) {
		ctx.beginPath();
		ctx.fillStyle = "rgb(255,0,10)";
		ctx.arc(p.x, p.y, 3, 0, 2 * Math.PI);
		ctx.fill();
		ctx.closePath();
	});
}