"use strict;"

/**
*
* whirlshop constructor
*
* @param {array} point_array 	An array of border points
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
}

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

whirlshop.prototype.resizeCanvas = function() {
	this.canvas.width = window.innerWidth - 250;
	this.canvas.height = window.innerHeight;
	this.hoverCanvas.width = window.innerWidth - 250;
	this.hoverCanvas.height = window.innerHeight;

	this.redrawShapes(); 

	return this;
}

whirlshop.prototype.addPoint = function(point) {
	if (!point.x || typeof point.x != "number")
		throw "x is not properly defined";
	if (!point.y || typeof point.y != "number")
		throw "y is not properly defined";

	if (~this.activePoints.indexOf(point))
		return;
	this.activePoints.push(point);

	normalize(this.activePoints, this.activePoints.length, this.settings['cclockwise']);
	if (this.activePoints.length > 3 && !shapeIsConvex(this.activePoints)){
		this.activePoints.splice(this.activePoints.indexOf(point), 1);
		return;
	}

	if (!~this.allPoints.indexOf(point))
		this.allPoints.push(point);

	// Draw point on shape canvas
	this.ctx.fillStyle = "rgb(255,0,10)";
	drawCircle(this.ctx, point, 3);

	if (this.activePoints.length % this.settings['numSides'] == 0) {
		this.ctx.fillStyle = "rgb(10,0,255)";
		for (var i = 0, l = this.activePoints.length; i < l; i++)
			drawCircle(this.ctx, this.activePoints[i], 3);
		this.shapes.push(new Shape(this.activePoints, this.settings));
		this.activePoints = [];
		this.shapes[this.shapes.length - 1].calculatePoints().drawShape(this.ctx);
	}

	return this;
}

whirlshop.prototype.drawHoverCanvas = function(){
	this.hoverCtx.clearRect(0, 0, hoverCanvas.width, hoverCanvas.height);
	this.drawHoverPoint();
	this.drawHoverShape();
}

whirlshop.prototype.drawHoverPoint = function(){
	if (typeof this.hoverPoint !== 'undefined') {
		ws.hoverCtx.fillStyle = "rgba(150,150,150,.5)";
		drawCircle(this.hoverCtx, this.hoverPoint, this.settings['snapDistance']);
	}
}

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

whirlshop.prototype.movePoints = function(newPoint){
	for (var i = 0, sl = this.shapes.length; i < sl; i++){
		for (var j = 0, spl = this.shapes[i].sides; j < spl; j++){
			if (this.shapes[i].points[j] == this.hoverPoint) {
				this.shapes[i].points[j] = newPoint;
				this.shapes[i].points.splice(this.shapes[i].sides);
				this.shapes[i].calculatePoints();
				break;
			}
		}
	}
	this.activePoints[this.activePoints.indexOf(this.hoverPoint)] = newPoint;
	this.allPoints[this.allPoints.indexOf(this.hoverPoint)] = newPoint;
	this.hoverPoint = newPoint;
	this.redrawShapes();
}

whirlshop.prototype.setHoverShape = function (point) {
	for (var i = 0, l = this.shapes.length; i < l; i++){
		if (pointInShape(this.shapes[i].points, this.shapes[i].sides, point) ){
			this.hoverShape = i;
			return;
		}
	}
	this.hoverShape = -1;
}

whirlshop.prototype.deleteShape = function (deleteShape) {	
	if (~deleteShape) {
		var i,
		j,
		sl,
		spl,
		deleteCurrentPoint = true,
		shapePoints = this.shapes[deleteShape].getBorderPoints();
		this.shapes.splice(deleteShape, 1);		
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
		this.hoverShape = -1;
		this.redrawShapes();
	}
}
