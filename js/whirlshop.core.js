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

// Not working rn
whirlshop.prototype.resizeCanvas = function() {
	console.log("asdfasdf");
    this.canvas.width = window.innerWidth - 250;
    this.canvas.height = window.innerHeight;
    this.hoverCanvas.width = window.innerWidth - 250;
    this.hoverCanvas.height = window.innerHeight;

	this.redrawShapes(); 

	return this;
}

whirlshop.prototype.addPoint = function(point) {

	if (!point.x || !typeof point.x === Number)
		throw "x is not properly defined";
	if (!point.y || !typeof point.y === Number)
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
