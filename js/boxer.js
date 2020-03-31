
// Defines the canvas square
function drawSquare() {
  // create a canvas to draw the arrow on
  // create a canvas to draw the arrow on
  var canvas = document.createElement("canvas");
  var pos = getItemPosition("table");
  // canvas.offsetTop = pos.ot;
  // canvas.offsetLeft = pos.ol;
  canvas.width = pos.x;
  canvas.height = pos.y;
  $(canvas).css("position", "absolute");
  $(canvas).css("pointer-events", "none");
  $(canvas).css("top", pos.ot);
  $(canvas).css("left", pos.ol);
  $(canvas).css("opacity", "0.85");
  $("body").append(canvas);

  // get the drawing context
  var ctx = canvas.getContext("2d");
  ctx.fillStyle = "yellow"
  ctx.strokeStyle = "yellow";

  var table_cell = getItemPosition("#blow_1");
  table_cell.ol = table_cell.ol - pos.ol;
  table_cell.ot = table_cell.ot - pos.ot;

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

// Gets the bounds of the table relative to the document
function getItemPosition(name) {

  var offset =$(name).offset();
  var width = $(name).innerWidth();
  var height = $(name).innerHeight();
  
  return {
    ol: offset.left,
    ot: offset.top,
    x: width,
    y: height
  }
}
