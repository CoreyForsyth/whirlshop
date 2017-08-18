"use strict;"

var ws = new whirlshop({
	canvas: document.getElementById("shapeCanvas"),
	hoverCanvas: document.getElementById("hoverCanvas")
});
// Context Menu
var contextMenu = document.getElementById("contextmenu"),
contextHoverShape = document.getElementById("contextHoverShape");

// Global variables
var mouseDown = false,
mouseDraggingPoint = false,
contextMenuVisible = false;


// Event listeners
ws.hoverCanvas.addEventListener('mousemove', function(event){
	if(!contextMenuVisible)
		mouseMoveHandler(event);
});
ws.hoverCanvas.addEventListener('mousedown', function (event) {
	mouseDown = true;
});
ws.hoverCanvas.addEventListener('mouseup', function (event) {
	if (contextMenuVisible) {
		hideContextMenu();
	}
	else if (!mouseDraggingPoint && event.which == 1)
		ws.addPoint(ws.hoverPoint || {x: event.offsetX, y: event.offsetY});

	mouseDown = false;
	mouseDraggingPoint = false;
});
ws.hoverCanvas.addEventListener('contextmenu', function(event){
	event.preventDefault();
	//add each item
    if(ws.hoverShape > -1){
    	contextHoverShape.className = "contextItem";
    	contextMenuVisible = true;
    }
    else 
    	contextHoverShape.className= "hide";

    //show context menu
    if(contextMenuVisible){
		contextMenu.className = "show";  
    	contextMenu.style.left = event.offsetX;
   		contextMenu.style.top =  event.offsetY;
   	}
	return false;
}, false);
window.addEventListener('resize', function(){
	ws.resizeCanvas();
});

// Resize canvas on startup
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

// Mouse Move Handler
function mouseMoveHandler(event) {
	var mousePoint = {x: event.offsetX, 
		y: event.offsetY};

		if (mouseDown && ws.hoverPoint)
			mouseDraggingPoint = true;


	if (mouseDraggingPoint) { // If point is being dragged	
		ws.movePoints(mousePoint);
	}
	else { // Point is not being dragged
		ws.setHoverPoint(mousePoint);
		ws.setHoverShape(mousePoint);
	}
	ws.drawHoverCanvas();
}

// Context menu functions
function contextDeleteShape(){
	ws.deleteShape(ws.hoverShape);
	hideContextMenu();
}

function hideContextMenu(){
	document.getElementById("contextmenu").className = "hide";
	contextMenuVisible = false;
}