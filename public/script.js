const canvas = document.getElementById("board");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight - 60;

const socket = io();

// Room ID from URL
const params = new URLSearchParams(window.location.search);
const roomId = params.get("room") || "default";

socket.emit("join-room", roomId);

socket.on("room-full", () => {
  alert("Room is full (Max 4 users)");
  window.location.reload();
});

// Drawing state
let drawing = false;
let lastX = 0;
let lastY = 0;

let color = document.getElementById("colorPicker").value;
let thickness = document.getElementById("thickness").value;
let tool = "pen";

// UI controls
document.getElementById("colorPicker").onchange = (e) => color = e.target.value;
document.getElementById("thickness").oninput = (e) => thickness = e.target.value;

document.getElementById("penBtn").onclick = () => tool = "pen";
document.getElementById("eraserBtn").onclick = () => tool = "eraser";

document.getElementById("clearBtn").onclick = () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  socket.emit("clear-board");
};

// Mouse events
canvas.addEventListener("mousedown", (e) => {
  drawing = true;
  [lastX, lastY] = [e.offsetX, e.offsetY];
});

canvas.addEventListener("mouseup", () => drawing = false);
canvas.addEventListener("mouseout", () => drawing = false);

canvas.addEventListener("mousemove", (e) => {
  if (!drawing) return;

  const data = {
    x1: lastX,
    y1: lastY,
    x2: e.offsetX,
    y2: e.offsetY,
    color,
    thickness,
    tool
  };

  drawLine(data);
  socket.emit("draw", data);

  [lastX, lastY] = [e.offsetX, e.offsetY];
});

// Draw function
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

// Receive drawing
socket.on("draw", (data) => {
  drawLine(data);
});

// Clear board for all
socket.on("clear-board", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
});
