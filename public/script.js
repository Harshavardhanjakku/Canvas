// ------------------------
// DOM & Canvas setup
const canvas = document.getElementById("board");
const ctx = canvas.getContext("2d");
const toolbar = document.querySelector(".toolbar");

// ------------------------
// Drawing state
let drawing = false;
let lastX = 0;
let lastY = 0;

let color = document.getElementById("colorPicker").value;
let thickness = document.getElementById("thickness").value;
let tool = "pen";

// ------------------------
// Socket.IO
const socket = io();
const params = new URLSearchParams(window.location.search);
const roomId = params.get("room") || "default";

socket.emit("join-room", roomId);

socket.on("room-full", () => {
  alert("Room is full (Max 4 users)");
  window.location.reload();
});

// ------------------------
// Responsive canvas
function resizeCanvas() {
  const toolbarHeight = toolbar.offsetHeight;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight - toolbarHeight;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// ------------------------
// UI controls
document.getElementById("colorPicker").onchange = (e) => color = e.target.value;
document.getElementById("thickness").oninput = (e) => thickness = e.target.value;

document.getElementById("penBtn").onclick = () => tool = "pen";
document.getElementById("eraserBtn").onclick = () => tool = "eraser";
document.getElementById("clearBtn").onclick = () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  socket.emit("clear-board");
};

// ------------------------
// Helper: get proper canvas coordinates
function getCanvasPos(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: clientX - rect.left,
    y: clientY - rect.top
  };
}

// ------------------------
// Mouse Events (Desktop)
canvas.addEventListener("mousedown", (e) => {
  const pos = getCanvasPos(e.clientX, e.clientY);
  drawing = true;
  lastX = pos.x;
  lastY = pos.y;
});

canvas.addEventListener("mousemove", (e) => {
  if (!drawing) return;
  const pos = getCanvasPos(e.clientX, e.clientY);

  const data = {
    x1: lastX,
    y1: lastY,
    x2: pos.x,
    y2: pos.y,
    color,
    thickness,
    tool
  };

  drawLine(data);
  socket.emit("draw", data);

  lastX = pos.x;
  lastY = pos.y;
});

canvas.addEventListener("mouseup", () => drawing = false);
canvas.addEventListener("mouseout", () => drawing = false);

// ------------------------
// Touch Events (Mobile)
canvas.addEventListener("touchstart", (e) => {
  e.preventDefault();
  const pos = getCanvasPos(e.touches[0].clientX, e.touches[0].clientY);
  drawing = true;
  lastX = pos.x;
  lastY = pos.y;
});

canvas.addEventListener("touchmove", (e) => {
  e.preventDefault();
  if (!drawing) return;
  const pos = getCanvasPos(e.touches[0].clientX, e.touches[0].clientY);

  const data = {
    x1: lastX,
    y1: lastY,
    x2: pos.x,
    y2: pos.y,
    color,
    thickness,
    tool
  };

  drawLine(data);
  socket.emit("draw", data);

  lastX = pos.x;
  lastY = pos.y;
});

canvas.addEventListener("touchend", () => drawing = false);
canvas.addEventListener("touchcancel", () => drawing = false);

// ------------------------
// Draw line function
function drawLine({ x1, y1, x2, y2, color, thickness, tool }) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.lineWidth = thickness;
  ctx.lineCap = "round";

  if (tool === "eraser") {
    ctx.globalCompositeOperation = "destination-out";
    ctx.strokeStyle = "rgba(0,0,0,1)";
  } else {
    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = color;
  }

  ctx.stroke();
  ctx.closePath();
}

// ------------------------
// Socket.IO receive events
socket.on("draw", (data) => drawLine(data));
socket.on("clear-board", () => ctx.clearRect(0, 0, canvas.width, canvas.height));
