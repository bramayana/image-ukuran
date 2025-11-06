const upload = document.getElementById("upload");
const dropZone = document.getElementById("dropZone");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const zoomInput = document.getElementById("zoom");
const modeSelect = document.getElementById("mode");
const bgColorInput = document.getElementById("bgColor");
const autoBgBtn = document.getElementById("autoBg");
const formatSelect = document.getElementById("format");
const downloadBtn = document.getElementById("download");
const clearBtn = document.getElementById("clear");

canvas.width = 1080;
canvas.height = 1350;

let img = new Image();
let scale = 1;
let posX = 0, posY = 0;
let dragging = false;
let startX, startY;

function loadImage(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    img.onload = () => {
      posX = canvas.width / 2;
      posY = canvas.height / 2;
      scale = 1;
      modeSelect.value = "contain"; // otomatis contain
      draw();
    };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
}

upload.addEventListener("change", e => loadImage(e.target.files[0]));

// Drag & drop
dropZone.addEventListener("click", () => upload.click());
dropZone.addEventListener("dragover", e => {
  e.preventDefault();
  dropZone.classList.add("dragover");
});
dropZone.addEventListener("dragleave", () => dropZone.classList.remove("dragover"));
dropZone.addEventListener("drop", e => {
  e.preventDefault();
  dropZone.classList.remove("dragover");
  loadImage(e.dataTransfer.files[0]);
});

// Paste
document.addEventListener("paste", e => {
  const items = e.clipboardData.items;
  for (let item of items) {
    if (item.type.indexOf("image") !== -1) {
      loadImage(item.getAsFile());
    }
  }
});

zoomInput.addEventListener("input", () => {
  scale = parseFloat(zoomInput.value);
  draw();
});

modeSelect.addEventListener("change", draw);
bgColorInput.addEventListener("input", draw);

canvas.addEventListener("mousedown", e => {
  dragging = true;
  startX = e.offsetX - posX;
  startY = e.offsetY - posY;
});
canvas.addEventListener("mousemove", e => {
  if (!dragging) return;
  posX = e.offsetX - startX;
  posY = e.offsetY - startY;
  draw();
});
canvas.addEventListener("mouseup", () => dragging = false);
canvas.addEventListener("mouseleave", () => dragging = false);

function draw() {
  ctx.fillStyle = bgColorInput.value;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (!img.src) return;

  let iw = img.width * scale;
  let ih = img.height * scale;

  if (modeSelect.value === "cover") {
    const scaleX = canvas.width / img.width;
    const scaleY = canvas.height / img.height;
    const coverScale = Math.max(scaleX, scaleY) * scale;
    iw = img.width * coverScale;
    ih = img.height * coverScale;
  } else if (modeSelect.value === "contain") {
    const scaleX = canvas.width / img.width;
    const scaleY = canvas.height / img.height;
    const containScale = Math.min(scaleX, scaleY) * scale;
    iw = img.width * containScale;
    ih = img.height * containScale;
  }

  ctx.drawImage(img, posX - iw / 2, posY - ih / 2, iw, ih);
}

// Ambil warna dominan dari tepi gambar
autoBgBtn.addEventListener("click", () => {
  if (!img.src) return;
  const tempCanvas = document.createElement("canvas");
  const tctx = tempCanvas.getContext("2d");
  tempCanvas.width = img.width;
  tempCanvas.height = img.height;
  tctx.drawImage(img, 0, 0);

  const edgePixels = [];
  const imgData = tctx.getImageData(0, 0, tempCanvas.width, tempCanvas.height).data;

  function addPixel(x, y) {
    const idx = (y * tempCanvas.width + x) * 4;
    edgePixels.push([imgData[idx], imgData[idx + 1], imgData[idx + 2]]);
  }

  // ambil baris atas dan bawah
  for (let x = 0; x < tempCanvas.width; x++) {
    addPixel(x, 0);
    addPixel(x, tempCanvas.height - 1);
  }
  // ambil kolom kiri dan kanan
  for (let y = 0; y < tempCanvas.height; y++) {
    addPixel(0, y);
    addPixel(tempCanvas.width - 1, y);
  }

  let r = 0, g = 0, b = 0;
  edgePixels.forEach(p => {
    r += p[0]; g += p[1]; b += p[2];
  });
  r = Math.round(r / edgePixels.length);
  g = Math.round(g / edgePixels.length);
  b = Math.round(b / edgePixels.length);

  bgColorInput.value = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  draw();
});

downloadBtn.addEventListener("click", () => {
  const format = formatSelect.value;
  const link = document.createElement("a");
  link.download = "instagram-1080x1350" + (format === "image/png" ? ".png" : ".jpg");
  link.href = canvas.toDataURL(format, 1.0); // kualitas maksimal
  link.click();
});

clearBtn.addEventListener("click", () => {
  img.src = "";
  ctx.clearRect(0, 0, canvas.width, canvas.height);
});
