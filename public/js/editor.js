// Minimal editor: load image into imageCanvas, draw mask on maskCanvas, send both to server
const imageInput = document.getElementById('imageInput');
const imageCanvas = document.getElementById('imageCanvas');
const maskCanvas = document.getElementById('maskCanvas');
const promptInput = document.getElementById('prompt');
const applyBtn = document.getElementById('apply');
const resultImg = document.getElementById('result');
const downloadBtn = document.getElementById('download');
const clearMaskBtn = document.getElementById('clearMask');
const brushSizeInput = document.getElementById('brushSize');

let img = new Image();
let drawing = false;
let brushSize = parseInt(brushSizeInput.value, 10) || 36;

const imageCtx = imageCanvas.getContext('2d');
const maskCtx = maskCanvas.getContext('2d');

function resizeCanvases(w, h) {
  imageCanvas.width = w; imageCanvas.height = h;
  maskCanvas.width = w; maskCanvas.height = h;
}

imageInput.addEventListener('change', (e) => {
  const f = e.target.files && e.target.files[0];
  if (!f) return;
  const url = URL.createObjectURL(f);
  img = new Image();
  img.onload = () => {
    const maxW = 640, maxH = 480;
    let w = img.width, h = img.height;
    const ratio = Math.min(maxW / w, maxH / h, 1);
    w = Math.round(w * ratio); h = Math.round(h * ratio);
    resizeCanvases(w, h);
    imageCtx.clearRect(0,0,w,h);
    imageCtx.drawImage(img, 0, 0, w, h);
    // initialize mask to opaque white
    maskCtx.fillStyle = 'rgba(255,255,255,1)';
    maskCtx.fillRect(0,0,w,h);
  };
  img.src = url;
});

maskCanvas.addEventListener('mousedown', (e) => { drawing = true; draw(e); });
maskCanvas.addEventListener('mousemove', draw);
window.addEventListener('mouseup', () => { drawing = false; maskCtx.beginPath(); });

maskCanvas.addEventListener('touchstart', (e) => { drawing = true; drawTouch(e); });
maskCanvas.addEventListener('touchmove', (e) => { drawTouch(e); e.preventDefault(); });
window.addEventListener('touchend', () => { drawing = false; maskCtx.beginPath(); });

brushSizeInput.addEventListener('input', (e) => { brushSize = parseInt(e.target.value, 10); });
clearMaskBtn.addEventListener('click', () => {
  if (!maskCanvas.width) return;
  maskCtx.fillStyle = 'rgba(255,255,255,1)';
  maskCtx.fillRect(0,0,maskCanvas.width, maskCanvas.height);
});

function getCanvasPos(e) {
  const rect = maskCanvas.getBoundingClientRect();
  return { x: (e.clientX - rect.left) * (maskCanvas.width / rect.width), y: (e.clientY - rect.top) * (maskCanvas.height / rect.height) };
}
function draw(e) {
  if (!drawing) return;
  const p = getCanvasPos(e);
  maskCtx.fillStyle = 'rgba(0,0,0,1)'; // painted areas will be the mask marks
  maskCtx.beginPath();
  maskCtx.arc(p.x, p.y, brushSize/2, 0, Math.PI*2);
  maskCtx.fill();
}
function drawTouch(e) {
  const touch = e.touches[0];
  const rect = maskCanvas.getBoundingClientRect();
  const p = { x: (touch.clientX - rect.left) * (maskCanvas.width / rect.width), y: (touch.clientY - rect.top) * (maskCanvas.height / rect.height) };
  if (!drawing) return;
  maskCtx.fillStyle = 'rgba(0,0,0,1)';
  maskCtx.beginPath();
  maskCtx.arc(p.x, p.y, brushSize/2, 0, Math.PI*2);
  maskCtx.fill();
}

// Prepare files and send to backend
applyBtn.addEventListener('click', async () => {
  if (!imageInput.files[0]) { alert('Carga una imagen primero.'); return; }
  applyBtn.disabled = true; applyBtn.textContent = 'Procesando...';

  // original file
  const originalFile = imageInput.files[0];

  // create mask blob: we need to transform the drawn mask so that painted areas are transparent (areas to be edited)
  const maskBlob = await createMaskBlob();

  const form = new FormData();
  form.append('image', originalFile);
  form.append('mask', maskBlob, 'mask.png');
  form.append('prompt', promptInput.value || '');

  try {
    const resp = await fetch('/api/edit', { method: 'POST', body: form });
    const data = await resp.json();
    if (data.image) {
      resultImg.src = data.image;
      downloadBtn.disabled = false;
      downloadBtn.onclick = () => downloadDataUrl(data.image, 'result.png');
    } else if (data.image_url) {
      resultImg.src = data.image_url;
      downloadBtn.disabled = true;
    } else {
      alert('Error: ' + (data.error || JSON.stringify(data)));
    }
  } catch (err) {
    console.error(err);
    alert('Error en la solicitud. Mira la consola.');
  }

  applyBtn.disabled = false; applyBtn.textContent = 'Aplicar edición IA';
});

async function createMaskBlob() {
  // We expect maskCanvas to have white background and black painted areas where user wants edits.
  // OpenAI expects a mask where transparent areas will be replaced. So we invert: painted (black) -> transparent alpha 0.
  const w = maskCanvas.width, h = maskCanvas.height;
  const tmp = document.createElement('canvas'); tmp.width = w; tmp.height = h;
  const tctx = tmp.getContext('2d');
  // draw the mask onto tmp to read pixels
  tctx.drawImage(maskCanvas, 0, 0);
  const imgd = tctx.getImageData(0,0,w,h);
  const d = imgd.data;
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i], g = d[i+1], b = d[i+2];
    // if pixel is dark (painted), make it transparent
    const isPainted = (r < 250 || g < 250 || b < 250);
    d[i+3] = isPainted ? 0 : 255; // alpha
    if (!isPainted) { d[i]=255; d[i+1]=255; d[i+2]=255; }
  }
  tctx.putImageData(imgd, 0, 0);
  return await new Promise(resolve => tmp.toBlob(resolve, 'image/png'));
}

function downloadDataUrl(dataUrl, filename) {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}
