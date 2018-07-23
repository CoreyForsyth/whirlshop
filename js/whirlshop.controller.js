"use strict;"

var ws = new whirlshop({
    canvas: document.getElementById("shapeCanvas"),
    hoverCanvas: document.getElementById("hoverCanvas")
});
// Context Menu
var contextMenu = document.getElementById("contextmenu"),
    contextHoverShape = document.getElementById("contextHoverShape"),
    contextHoverPoint = document.getElementById("contextHoverPoint"),
    contextHoverMultiplePoints = document.getElementById("contextHoverMultiplePoints");
    contextSelectedShapes = document.getElementById("contextSelectedShapes");

// Global variables
var mouseDown = false,
    mouseDraggingPoint = false,
    contextMenuVisible = false;


// Event listeners
ws.hoverCanvas.addEventListener('mousemove', function(event) {
    if (!contextMenuVisible && event.which != 3)
        mouseMoveHandler(event);
});
ws.hoverCanvas.addEventListener('mousedown', function(event) {
    mouseDown = true;
});
ws.hoverCanvas.addEventListener('mouseup', function(event) {
    if(event.button === 2){
        return;
    }
    if (contextMenuVisible) {
        hideContextMenu();
    } else if (!mouseDraggingPoint && event.which == 1 && ws.hoverShape == -1)
        ws.addPoint(ws.hoverPoint || { x: event.offsetX, y: event.offsetY });
    else if(ws.hoverShape > -1){
        hoverShapeIndex = ws.selectedShapes.indexOf(ws.hoverShape);
        if(!~hoverShapeIndex){
            ws.selectedShapes.push(ws.hoverShape);
        }
        else {
            ws.selectedShapes.splice(hoverShapeIndex, 1);
        }
    }
    mouseDown = false;
    mouseDraggingPoint = false;
});
ws.hoverCanvas.addEventListener('contextmenu', function(event) {
    event.preventDefault();
    mouseDown = false;
    //add each item
    if (ws.hoverShape > -1) {
        contextHoverShape.className = "contextItem";
        contextMenuVisible = true;
        if (ws.selectedShapes.indexOf(ws.hoverShape) != -1){
            contextSelectedShapes.className = "contextItem";
        }
        else {
            contextSelectedShapes.className = "hide";
        }
    } else {
        contextHoverShape.className = "hide";
        contextSelectedShapes.className = "hide";
    }

    if (ws.hoverPoint !== undefined && ~ws.allPoints.indexOf(ws.hoverPoint)) {
        if (ws.getOccurences(ws.hoverPoint) > 1)
            contextHoverMultiplePoints.className = "contextItem";
        else
            contextHoverMultiplePoints.className = "hide";

        contextHoverPoint.className = "contextItem";
        contextMenuVisible = true;
    } else {
        contextHoverMultiplePoints.className = "hide";
        contextHoverPoint.className = "hide";
    }

    //show context menu
    if (contextMenuVisible) {
        contextMenu.className = "show";
        contextMenu.style.left = event.offsetX;
        contextMenu.style.top = event.offsetY;
    }
    return false;
}, false);
window.addEventListener('resize', function() {
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
$('#thickness-select').on('change', function() {
    ws.settings['thickness'] = +$(this).val();
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
$('#show-points').click(function() {
    ws.settings['showPoints'] = this.checked;
    ws.redrawShapes();
});
$('#edit-shapes').click(function() {
    ws.editShapes();
});

// Mouse Move Handler
function mouseMoveHandler(event) {
    var mousePoint = {
        x: event.offsetX,
        y: event.offsetY
    };

    if (mouseDown && ws.hoverPoint)
        mouseDraggingPoint = true;


    if (mouseDraggingPoint) { // If point is being dragged    
        ws.movePoints(mousePoint);
    } else { // Point is not being dragged
        ws.setHoverPoint(mousePoint);
        ws.setHoverShape(mousePoint);
    }
    ws.drawHoverCanvas();
}

// Context menu functions
function contextDeleteShape() {
    ws.deleteShape(ws.hoverShape);
    hideContextMenu();
}

function hideContextMenu() {
    document.getElementById("contextmenu").className = "hide";
    contextMenuVisible = false;
}

function contextSplitPoints() {
    ws.splitPoints();
    hideContextMenu();
}

function contextDeletePoint() {
    ws.deletePoint(ws.hoverPoint);
    hideContextMenu();
}

function contextDeleteSelectedShapes() {
    ws.selectedShapes.sort();
    ws.selectedShapes.reverse();
    while (ws.selectedShapes.length != 0){
        ws.deleteShape(ws.selectedShapes[0]);
    }
    hideContextMenu();
}

function contextUpdateSelectedShapes() {
    ws.editShapes();
    hideContextMenu();
}

