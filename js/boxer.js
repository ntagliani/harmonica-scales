var ctx = null;
var canvas = null;
var table_position = null;

function boxSetup(){
    // create a canvas to draw the arrow on
    canvas = document.createElement("canvas");
    table_position = getItemPosition("table");
    // canvas.offsetTop = pos.ot;
    // canvas.offsetLeft = pos.ol;
    canvas.width = table_position.x;
    canvas.height = table_position.y;
    $(canvas).css("position", "absolute");
    $(canvas).css("pointer-events", "none");
    $(canvas).css("top", table_position.ot);
    $(canvas).css("left", table_position.ol);
    $(canvas).css("opacity", "0.85");
    $("body").append(canvas);

    // get the drawing context
    ctx = canvas.getContext("2d");
    ctx.fillStyle = "yellow";
    ctx.strokeStyle = "yellow";
}
// Defines the canvas square
function drawSquare(tune_index) {
  if (tune_index < 0 || tune_index > 36) return;
  

  var table_cell = getItemPosition(".tune_" + tune_index);
  if (table_cell != null) {
    clearCanvas();
    table_cell.ol = table_cell.ol - table_position.ol;
    table_cell.ot = table_cell.ot - table_position.ot;

    // draw line from start to end
    ctx.beginPath();
    ctx.moveTo(table_cell.ol, table_cell.ot);
    ctx.lineTo(table_cell.ol + table_cell.x, table_cell.ot);
    ctx.lineTo(table_cell.ol + table_cell.x, table_cell.ot + table_cell.y);
    ctx.lineTo(table_cell.ol, table_cell.ot + table_cell.y);
    ctx.lineTo(table_cell.ol, table_cell.ot);
    ctx.lineWidth = 5;
    ctx.stroke();
  }
}

// Defines the canvas square
function clearCanvas() {
  if (ctx != null) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  }
}
// Gets the bounds of the table relative to the document
function getItemPosition(name) {
  if ($(name).length) {
    var offset = $(name).offset();
    var width = $(name).innerWidth();
    var height = $(name).innerHeight();

    return {
      ol: offset.left,
      ot: offset.top,
      x: width,
      y: height
    };
  }
  return null;
}
