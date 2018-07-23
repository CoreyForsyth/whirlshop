"use strict;"

/**
 * Shape constructor
 * @constructor
 * @param {array} point_array - An array of border points
 * @param {object} settings - The settings under which the Shape was created
 */
var Shape = function(point_array, settings) {
    this.points = point_array;
    this.sides = settings['numSides'] || point_array.length;
    this.layers = settings['numLayers'] || 1;
    this.amountToDraw = settings['amountToDraw'] || 50;
    this.delta = settings['delta'] || 5;
    this.thickness = settings['thickness'] || 1;
    this.cclockwise = settings['cclockwise'] || false;
}

Shape.prototype.setValues = function(settings){
    this.layers = settings['numLayers'];
    this.amountToDraw = settings['amountToDraw'];
    this.delta = settings['delta'];
    this.thickness = settings['thickness'];
    this.cclockwise = settings['cclockwise'];
}

/**
 * Calcuates the points in the interior of the shape
 * @returns {shape} The shape instance
 */
Shape.prototype.calculatePoints = function() {
    var layer = 0,
        index = 0,
        length = 0,
        i = 0;

    if (this.points.length > this.sides){
        this.points.splice(this.sides, this.points.length - this.sides);
    }

    normalize(this.points, this.sides, !this.cclockwise)
    // Loop for each layer
    for (layer = 0; layer < this.layers; layer++) {
        // Add all other points
        for (length = index + this.amountToDraw; index < length; index++) {
            // Add point to end of array that is on line segment from beginning
            this.points.push({
                x: this.points[index].x + (this.points[index + 1].x - this.points[index].x) / this.delta,
                y: this.points[index].y + (this.points[index + 1].y - this.points[index].y) / this.delta
            });
        }
        // Add last (numSides) points to points array in reverse order 
        // so the next layer can be generated in opposite direction            
        for (length = this.points.length, i = length - 1; i >= length - this.sides; i--) {
            this.points.push(this.points[i]);
        }
        // Account for new points in index counter
        index += this.sides;
    }
    return this;
}

/**
 * Draws the Shape on the provided context
 * @param {2d context} ctx - The context on which to draw the shape
 * @returns {shape} The Shape instance
 */
Shape.prototype.drawShape = function(ctx) {
    ctx.beginPath();
    ctx.fillStyle = "rgb(0,0,0)";
    ctx.lineWidth=this.thickness;
    ctx.moveTo(this.points[this.sides - 1].x, this.points[this.sides - 1].y);
    ctx.lineTo(this.points[0].x, this.points[0].y);
    // Draws lines between all sequential points
    for (var i = 1, l = this.points.length; i < l; i++)
        ctx.lineTo(this.points[i].x, this.points[i].y);

    ctx.stroke();
    ctx.closePath();

    return this;
}

/**
 * Sorts the points in clockwise or counter-clockwise order around the center
 * @returns {shape} this
 */
Shape.prototype.normalize = function() {
    var cx = 0,
        cy = 0,
        i,
        j,
        temp;

    // Find the center
    for (i = 0; i < this.sides; i++) {
        cx += this.points[i].x / this.sides;
        cy += this.points[i].y / this.sides;
    }
    // Sort points clockwise or counter-clockwise
    for (i = 0; i < this.sides; i++) {
        for (j = i + 1; j < this.sides; j++) {
            if (this.cclockwise ^ less(this.points[i], this.points[j], cx, cy)) {
                var temp = this.points[i];
                this.points[i] = this.points[j];
                this.points[j] = temp;
            }
        }
    }
    return this;
}

/**
 * Get the outside points of this shape
 * @returns {Array} The outside points of this shape
 */
Shape.prototype.getBorderPoints = function() {
    return this.points.slice(0, this.sides);
}