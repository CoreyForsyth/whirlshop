"use strict;"

// Global Variables
var canvas = document.getElementById("shapeCanvas"),
hoverCanvas = document.getElementById("hoverCanvas"),
ctx = canvas.getContext("2d"),
hoverCtx = hoverCanvas.getContext("2d"),
points = [],
clickedPoints = [],
shapes = [],
hoverPoint = undefined;


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
hoverCanvas.addEventListener('click', clickHandler);
hoverCanvas.addEventListener('mousemove', debounce(mouseMoveHandler, 13));

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


function Shape(points) {
	this.points = points;
	this.sides = settings['numSides'];
	this.layers = settings['numLayers'];
	this.calculatePoints = function() {
		var layer = 0,
		index = 0,
		length = 0,
		i = 0;

		// Loop for each layer
		for (layer = 0; layer < this.layers; layer++){
			// Add all other points
			for (length = index + settings['amountToDraw']; index < length; index++) {
				// Add point to end of array that is on line segment from beginning
				this.points.push({
					x: this.points[index].x + (this.points[index+1].x - this.points[index].x) / settings['delta'],
					y: this.points[index].y + (this.points[index+1].y - this.points[index].y) / settings['delta']
				});
			}
			// Add last (numSides) points to points array in reverse order 
			// so the next layer can be generated in opposite direction			
			for (length = this.points.length, i = length - 1; i >= length - this.sides; i--){
				this.points.push(this.points[i]);
			}
			// Account for new points in index counter
			index += this.sides;
		}
		return this;
	}
	this.drawShape = function() {
		ctx.beginPath();
		ctx.fillStyle = "rgb(0,0,0)";
		ctx.moveTo(this.points[this.sides - 1].x, this.points[this.sides - 1].y);
		ctx.lineTo(this.points[0].x, this.points[0].y);
		for (var i = 1, l = this.points.length; i < l; i++) 
			ctx.lineTo(this.points[i].x, this.points[i].y);
		
		ctx.stroke();
		ctx.closePath();
	}
	this.normalize = function() {
		// Find the center
		var cx = 0,
		cy = 0,
		i,
		j;
		for (i = 0; i < this.sides; i++) {
			cx += this.points[i].x / this.sides;
			cy += this.points[i].y / this.sides;
		}
		// Sort points clockwisely
		for (i = 0; i < this.sides; i++) {
			for (j = i + 1; j < this.sides; j++) {
				if (settings['cclockwise'] ^ less(this.points[i], this.points[j], cx, cy)) {
					var temp = this.points[i];
					this.points[i] = this.points[j];
					this.points[j] = temp;
				}
			}
		}
		return this;
	}
}

function mouseMoveHandler(event) {

	hoverPoint = undefined;

	hoverCtx.clearRect(0, 0, hoverCanvas.width, hoverCanvas.height);

	var minDistance = Infinity,
	closestPoint = {},
	dist;
	clickedPoints.forEach(function(p){
		dist = distance(p, {x: event.offsetX, y: event.offsetY});
		if (dist < settings['snapDistance'] && dist < minDistance) {
			minDistance = dist;
			closestPoint = p;
		}
	});

	if (minDistance != Infinity) {
		hoverPoint = closestPoint;
	} 
	else {
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

function clickHandler(event) {
	if (points.length > 2 && checkIfInsideShape(event.offsetX, event.offsetY, points))
		return;
	var clickedPoint = hoverPoint || {x: event.offsetX, y: event.offsetY};

	if (points.includes(clickedPoint))
		return;
	points.push(clickedPoint);
	if (!clickedPoints.includes(clickedPoint))
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
		shapes.push(new Shape(points));
		points = [];
		shapes[shapes.length - 1].normalize().calculatePoints().drawShape();
	}
}

// From stackoverflow
function less(a, b, cx, cy)
{
    if (a.x - cx >= 0 && b.x - cx < 0)
        return true;
    if (a.x - cx < 0 && b.x - cx >= 0)
        return false;
    if (a.x - cx == 0 && b.x - cx == 0) {
        if (a.y - cy >= 0 || b.y - cy >= 0)
            return a.y > b.y;
        return b.y > a.y;
    }

    // compute the cross product of vectors (center -> a) x (center -> b)
    var det = (a.x - cx) * (b.y - cy) - (b.x - cx) * (a.y - cy);
    if (det < 0)
        return true;
    if (det > 0)
        return false;

    // points a and b are on the same line from the center
    // check which point is closer to the center
    var d1 = (a.x - cx) * (a.x - cx) + (a.y - cy) * (a.y - cy);
    var d2 = (b.x - cx) * (b.x - cx) + (b.y - cy) * (b.y - cy);
    return d1 > d2;
}

function checkIfInsideShape(testx, testy, points) {
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
		s.drawShape();
	});
}