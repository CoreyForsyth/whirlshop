"use strict;"

/**
 * whirlshop constructor
 * @param {object} object		The settings under which the Shape was created
 * @return {Shape} 				Returns the new Shape
 */
var whirlshop = function(object) {
    if (!object['canvas'] || object['canvas'] === 'undefined' || !(object['canvas'] instanceof Element))
	throw 'canvas is not defined';
    if (!object['hoverCanvas'] || object['hoverCanvas'] === 'undefined' || !(object['hoverCanvas'] instanceof Element))
	throw "hoverCanvas is not defined";

    this.canvas = object['canvas'];
    this.hoverCanvas = object['hoverCanvas'];
    this.ctx = this.canvas.getContext("2d");
    this.hoverCtx = this.hoverCanvas.getContext("2d");
    this.activePoints = [];
    this.allPoints = [];
    this.shapes = [];
    this.hoverPoint = undefined;
    this.hoverShape = -1;
    this.mouseDown = false;
    this.mouseDraggingPoint = false;

    this.settings = {
	numSides: 5,
	delta: 5,
	numLayers: 1,
	amountToDraw: 50,
	snapDistance: 10,
	cclockwise: false
    };
    return this;
}

/**
 * Redraw all shapes on ctx
 * @return {whirlshop} this				Returns `this` for chaining
 */
whirlshop.prototype.redrawShapes = function() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.shapes.forEach(function(s) {
	s.drawShape(this.ctx);
    }, this);
    this.allPoints.forEach(function(p) {
	this.ctx.beginPath();
	this.ctx.fillStyle = "rgb(10,0,255)";
	this.ctx.arc(p.x, p.y, 3, 0, 2 * Math.PI);
	this.ctx.fill();
	this.ctx.closePath();
    }, this);
    this.activePoints.forEach(function(p) {
	this.ctx.beginPath();
	this.ctx.fillStyle = "rgb(255,0,10)";
	this.ctx.arc(p.x, p.y, 3, 0, 2 * Math.PI);
	this.ctx.fill();
	this.ctx.closePath();
    }, this);

    return this;
}

/**
 * Resize the canvases
 * @return {whirlshop} this				Returns `this` for chaining
 */
whirlshop.prototype.resizeCanvas = function() {
    this.canvas.width = window.innerWidth - 250;
    this.canvas.height = window.innerHeight;
    this.hoverCanvas.width = window.innerWidth - 250;
    this.hoverCanvas.height = window.innerHeight;

    this.redrawShapes(); 

    return this;
}

/**
 * Add a point to the canvas
 * @param {point} point 					Point being added
 * @return {whirlshop} 				        Returns `this` for chaining
 */
whirlshop.prototype.addPoint = function(point) {
    if (!point.x || typeof point.x != "number")
	throw "x is not properly defined";
    if (!point.y || typeof point.y != "number")
	throw "y is not properly defined";
    
    if (~this.activePoints.indexOf(point))
	return;

    if (!~this.allPoints.indexOf(point))
	this.allPoints.push(point);

    // Save reference of point
    this.activePoints.push(this.allPoints[this.allPoints.indexOf(point)]);

    normalize(this.activePoints, this.activePoints.length, this.settings['cclockwise']);
    if (this.activePoints.length > 3 && !shapeIsConvex(this.activePoints)){
	this.activePoints.splice(this.activePoints.indexOf(point), 1);
	return;
    }


    // Draw point on shape canvas
    this.ctx.fillStyle = "rgb(255,0,10)";
    drawCircle(this.ctx, point, 3);

    var numSides = this.settings['numSides'];

    if (this.activePoints.length % numSides == 0) {
	this.ctx.fillStyle = "rgb(10,0,255)";
	for (var i = 0, l = this.activePoints.length; i < l; i++)
	    drawCircle(this.ctx, this.activePoints[i], 3);
	this.shapes.push(new Shape(this.activePoints, this.settings));
	this.activePoints = [];
	this.shapes[this.shapes.length - 1].calculatePoints().drawShape(this.ctx);
    }

    return this;
}

/**
 * Redraw hoverCanvas
 */
whirlshop.prototype.drawHoverCanvas = function(){
    this.hoverCtx.clearRect(0, 0, hoverCanvas.width, hoverCanvas.height);
    this.drawHoverPoint();
    this.drawHoverShape();
}

/**
 * Redraw the hoverPoint on the hoverCanvas
 */
whirlshop.prototype.drawHoverPoint = function(){
    if (typeof this.hoverPoint !== 'undefined') {
	ws.hoverCtx.fillStyle = "rgba(150,150,150,.5)";
	drawCircle(this.hoverCtx, this.hoverPoint, this.settings['snapDistance']);
    }
}

/**
 * Redraw the hoverShape on the hoverCanvas
 */
whirlshop.prototype.drawHoverShape = function () {
    if( this.hoverShape > -1 && this.hoverPoint === undefined ){
	this.hoverCtx.fillStyle = "rgba(98, 81, 255, 0.3)";
	this.hoverCtx.beginPath();
	this.hoverCtx.moveTo(this.shapes[this.hoverShape].points[0].x, this.shapes[this.hoverShape].points[0].y);
	for( var i = 1, l = this.shapes[this.hoverShape].sides; i < l; i++){
	    this.hoverCtx.lineTo(this.shapes[this.hoverShape].points[i].x, this.shapes[this.hoverShape].points[i].y)
	}
	this.hoverCtx.closePath();
	this.hoverCtx.fill();
    }
}


/**
 * Redraw the hoverPoint on the hoverCanvas
 * @param {point} mousePoint 			Current Mouse location
 */
whirlshop.prototype.setHoverPoint = function(mousePoint){
    this.hoverPoint = undefined;

    var minDistance = Infinity,
	closestPoint = {},
	dist;

    // Find the closest point within the 'snapDistance' radius
    for(var i = 0, l = this.allPoints.length; i < l; i++){
	dist = distance(this.allPoints[i], mousePoint);
	if (dist < this.settings['snapDistance'] && dist < minDistance) {
	    minDistance = dist;
	    closestPoint = this.allPoints[i];
	}
    }

    if (minDistance != Infinity) { // If point is found, set this.hoverPoint to reference it
	this.hoverPoint = closestPoint;
    } 
    else { // Otherwise, check if mouse is within 'snapDistance' of the edge of the screen
	if (event.offsetY < this.settings['snapDistance'])
	    closestPoint.y = 0;
	else if (event.offsetY > this.hoverCanvas.height - this.settings['snapDistance'])
	    closestPoint.y = this.hoverCanvas.height;

	if (event.offsetX < this.settings['snapDistance'])
	    closestPoint.x = 0;
	else if (event.offsetX > this.hoverCanvas.width - this.settings['snapDistance'])
	    closestPoint.x = this.hoverCanvas.width;
	
	if (typeof closestPoint.x !== 'undefined' 
	    || typeof closestPoint.y !== 'undefined') { // If within bounds of a border
	    this.hoverPoint = closestPoint;
	    if (typeof this.hoverPoint.x === 'undefined')
		this.hoverPoint.x = event.offsetX;
	    if (typeof this.hoverPoint.y === 'undefined')
		this.hoverPoint.y = event.offsetY;
	}
    }
}


/**
 * Move the `hoverPoint` to newPoint, including the points in all shapes
 * @param {point} newPoint			Point to move current point to
 */
whirlshop.prototype.movePoints = function(newPoint){
    
    this.allPoints[this.allPoints.indexOf(this.hoverPoint)].x = newPoint.x;
    this.allPoints[this.allPoints.indexOf(this.hoverPoint)].y = newPoint.y;
    
    this.hoverPoint = this.allPoints[this.allPoints.indexOf(this.hoverPoint)];

    for (var i = 0, l = this.shapes.length; i < l; i++) {
	this.shapes[i].points.splice(this.shapes[i].sides);
	this.shapes[i].calculatePoints();
    }
    this.redrawShapes();
}

/**
 * Set the hoverShape based upon current mouse location
 * @param {point} point			Current mouse location
 */
whirlshop.prototype.setHoverShape = function (point) {
    if (this.hoverPoint !== undefined){
	this.hoverShape = -1;
	return;
    }
    for (var i = 0, l = this.shapes.length; i < l; i++){
	if (pointInShape(this.shapes[i].points, this.shapes[i].sides, point) ){
	    this.hoverShape = i;
	    return;
	}
    }
    this.hoverShape = -1;
}

/**
 * Delete the given shape
 * @param {int} shapeToDelete			Shape index to delete
 */
whirlshop.prototype.deleteShape = function (shapeToDelete) {	
    this.hoverShape = -1;
    if (~shapeToDelete) {
	var i,
	    j,
	    sl,
	    spl,
	    deleteCurrentPoint = true,
	    shapePoints = this.shapes[shapeToDelete].getBorderPoints();
	this.shapes.splice(shapeToDelete, 1);		
	for (i = 0, spl = shapePoints.length; i < spl; i++) {
	    deleteCurrentPoint = true;
	    for (j = 0, sl = this.shapes.length; j < sl; j++) {
		if (~this.shapes[j].points.indexOf(shapePoints[i])) {
		    deleteCurrentPoint = false;
		    break;
		}
	    }
	    if (deleteCurrentPoint)
		this.allPoints.splice(this.allPoints.indexOf(shapePoints[i]), 1);				
	} 
	this.redrawShapes();
	this.drawHoverCanvas();
    }
}


whirlshop.prototype.splitPoints = function (){
    if(this.hoverPoint === undefined)
	return;
    var containingShapes = [],
	newPoint,
	i,
	l;

    // Get list of shapes that need to be split, and other data about them
    for(i = 0, l = this.shapes.length; i < l; i++){
	if(~this.shapes[i].points.indexOf(this.hoverPoint)){
	    containingShapes.push(this.shapes[i]);
	}
    }
    
    // Iterate through containing shapes and split the point
    for (i = 0, l = containingShapes.length; i < l; i++){
	var center = getCenter(containingShapes[i].getBorderPoints()),
	    dist = distance(center, this.hoverPoint),
	    deltaX = (center.x - this.hoverPoint.x) / dist * this.settings['snapDistance'],
	    deltaY = (center.y - this.hoverPoint.y) / dist * this.settings['snapDistance'];
	
	newPoint = {x: this.hoverPoint.x + deltaX,
		    y: this.hoverPoint.y + deltaY};

	this.allPoints.push(newPoint);
	containingShapes[i].points.splice(containingShapes[i].sides);
	containingShapes[i].points[containingShapes[i].points.indexOf(this.hoverPoint)] = newPoint;
	containingShapes[i].calculatePoints();
    }

    this.allPoints.splice(this.allPoints.indexOf(this.hoverPoint), 1);
    this.redrawShapes();
    this.drawHoverCanvas();
}

whirlshop.prototype.getOccurences = function(point){
    var occurenceCount = 0;
    for(var i = 0, l = this.shapes.length; i < l; i++){
	if(~this.shapes[i].points.indexOf(point))
	    occurenceCount++;
    }
    return occurenceCount;
}
