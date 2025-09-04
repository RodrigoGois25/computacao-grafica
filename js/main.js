// Arquivo: main.js (ou app.js) - VERSÃO FINAL COM RECORTE CORRIGIDO

const canvas = document.getElementById('mainCanvas');
const ctx = canvas.getContext('2d');
const clearButton = document.getElementById('clearButton');
const customCursor = document.getElementById('customCursor');

const PIXEL_SIZE = 5;
const GRID_WIDTH = canvas.width / PIXEL_SIZE;
const GRID_HEIGHT = canvas.height / PIXEL_SIZE;
const corFundo = 'rgb(255, 255, 255)';
const corDesenho = 'rgb(0, 0, 0)';
const corPreenchimento = 'rgb(0, 150, 255)';
const corControle = 'rgb(255, 0, 0)';

let grid = [], drawingMode = 'poligono', tempPoints = [], polygons = [], clipWindow = {}, historyStack = [], isCubeActive = false;

const sleep = (ms) => new Promise(res => setTimeout(res, ms));
const bresenhamSync = (x0, y0, x1, y1) => { let points = []; let dx = Math.abs(x1 - x0); let dy = Math.abs(y1 - y0); let sx = (x0 < x1) ? 1 : -1; let sy = (y0 < y1) ? 1 : -1; let err = dx - dy; while (true) { points.push({x: x0, y: y0}); if (x0 === x1 && y0 === y1) break; let e2 = 2 * err; if (e2 > -dy) { err -= dy; x0 += sx; } if (e2 < dx) { err += dx; y0 += sy; } } return points; };

function saveState() { const state = { grid: JSON.parse(JSON.stringify(grid)), polygons: JSON.parse(JSON.stringify(polygons)) }; historyStack.push(state); if (historyStack.length > 20) historyStack.shift(); }
function undo() { if (historyStack.length > 0) { const lastState = historyStack.pop(); grid = lastState.grid; polygons = lastState.polygons; isCubeActive = false; renderGrid(); drawClipWindow(); } else { console.log("Não há mais ações para desfazer."); } }
function init() { grid = Array(GRID_HEIGHT).fill(null).map(() => Array(GRID_WIDTH).fill(corFundo)); tempPoints = []; polygons = []; historyStack = []; isCubeActive = false; clipWindow = {}; document.querySelector('input[name="tool"][value="poligono"]').checked = true; drawingMode = 'poligono'; renderGrid(); }
function renderGrid() { ctx.clearRect(0, 0, canvas.width, canvas.height); for (let y = 0; y < GRID_HEIGHT; y++) { for (let x = 0; x < GRID_WIDTH; x++) { if (grid[y][x] !== corFundo) { ctx.fillStyle = grid[y][x]; ctx.fillRect(x * PIXEL_SIZE, y * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE); } } } }
function drawToGrid(point, color) { if (point.y >= 0 && point.y < GRID_HEIGHT && point.x >= 0 && point.x < GRID_WIDTH) { grid[point.y][point.x] = color; } }

async function handleCanvasClick(event) {
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((event.clientX - rect.left) / PIXEL_SIZE);
    const y = Math.floor((event.clientY - rect.top) / PIXEL_SIZE);
    isCubeActive = false;
    
    if (drawingMode !== 'recorte' && drawingMode !== 'poligono' && tempPoints.length === 1) saveState();
    if (drawingMode === 'preenchimento' || drawingMode === 'scanline' || (drawingMode === 'recorte' && tempPoints.length === 1)) saveState();

    switch (drawingMode) {
        case 'bresenham': case 'circulo': case 'curva': tempPoints.push({ x, y }); await processShapeDrawing(x, y); break;
        case 'poligono': if (event.detail === 2) { if (tempPoints.length > 2) { await finalizePolygon(); } } else { tempPoints.push({ x, y }); drawTempPolygon(); } break;
        case 'preenchimento': await floodFill(x, y, corPreenchimento, grid); renderGrid(); break;
        case 'scanline': if (polygons.length > 0) { await scanlineFill(polygons[polygons.length - 1], corPreenchimento, grid); renderGrid(); } break;
        case 'recorte': await handleClippingClick(x, y); break;
    }
}

async function handleClippingClick(x, y) {
    tempPoints.push({ x, y });
    renderGrid();
    drawClipWindow(); 
    tempPoints.forEach(p => { ctx.fillStyle = corControle; ctx.fillRect(p.x * PIXEL_SIZE, p.y * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE); });

    if (tempPoints.length === 2) {
        clipWindow = {
            xmin: Math.min(tempPoints[0].x, tempPoints[1].x), ymin: Math.min(tempPoints[0].y, tempPoints[1].y),
            xmax: Math.max(tempPoints[0].x, tempPoints[1].x), ymax: Math.max(tempPoints[0].y, tempPoints[1].y),
        };
        
        if (polygons.length > 0) {
            const subjectPolygon = polygons[polygons.length - 1];
            const clippedPolygon = sutherlandHodgman(subjectPolygon, clipWindow);
            if (clippedPolygon && clippedPolygon.length > 0) {
                await scanlineFill(clippedPolygon, corPreenchimento, grid);
                const originalPolygonLines = [];
                for (let i = 0; i < subjectPolygon.length; i++) {
                    const p1 = subjectPolygon[i]; const p2 = subjectPolygon[(i + 1) % subjectPolygon.length];
                    originalPolygonLines.push(...bresenhamSync(p1.x, p1.y, p2.x, p2.y));
                }
                originalPolygonLines.forEach(p => drawToGrid(p, corDesenho));
            }
        }
        
        tempPoints = [];
        renderGrid();
        drawClipWindow();
    }
}

async function processShapeDrawing(x, y) { renderGrid(); if ((drawingMode === 'curva' && tempPoints.length < 4) || tempPoints.length < 2) { tempPoints.forEach(p => { ctx.fillStyle = corControle; ctx.fillRect(p.x * PIXEL_SIZE, p.y * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE); }); return; } if (drawingMode === 'bresenham') { await bresenham(tempPoints[0].x, tempPoints[0].y, x, y); } else if (drawingMode === 'circulo') { const dx = x - tempPoints[0].x; const dy = y - tempPoints[0].y; const radius = Math.round(Math.sqrt(dx * dx + dy * dy)); await midpointCircle(tempPoints[0].x, tempPoints[0].y, radius); } else if (drawingMode === 'curva') { const bezierPoints = cubicBezier(tempPoints[0], tempPoints[1], tempPoints[2], tempPoints[3]); for (let i = 0; i < bezierPoints.length - 1; i++) { await bresenham(bezierPoints[i].x, bezierPoints[i].y, bezierPoints[i + 1].x, bezierPoints[i + 1].y); } } tempPoints = []; renderGrid(); }
async function finalizePolygon() { polygons.push([...tempPoints]); for (let i = 0; i < tempPoints.length; i++) { const p1 = tempPoints[i]; const p2 = tempPoints[(i + 1) % tempPoints.length]; await bresenham(p1.x, p1.y, p2.x, p2.y); } tempPoints = []; renderGrid(); }
function drawTempPolygon() { renderGrid(); tempPoints.forEach(p => { ctx.fillStyle = corControle; ctx.fillRect(p.x * PIXEL_SIZE, p.y * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE); }); for (let i = 0; i < tempPoints.length - 1; i++) { const linePoints = bresenhamSync(tempPoints[i].x, tempPoints[i].y, tempPoints[i+1].x, tempPoints[i+1].y); linePoints.forEach(p => { ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(p.x * PIXEL_SIZE, p.y * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE); }); } }
function drawClipWindow() { if (clipWindow.xmin !== undefined) { ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)'; ctx.lineWidth = 2; ctx.setLineDash([5, 5]); ctx.strokeRect(clipWindow.xmin * PIXEL_SIZE, clipWindow.ymin * PIXEL_SIZE, (clipWindow.xmax - clipWindow.xmin) * PIXEL_SIZE, (clipWindow.ymax - clipWindow.ymin) * PIXEL_SIZE); ctx.setLineDash([]); } }

document.querySelectorAll('input[name="tool"]').forEach(radio=>{radio.addEventListener('change',e=>{drawingMode=e.target.value;isCubeActive=false;tempPoints=[];if(drawingMode==='recorte'){clipWindow={}}renderGrid();})});
canvas.addEventListener('click',handleCanvasClick);
clearButton.addEventListener('click',init);
document.getElementById('undoButton').addEventListener('click',undo);

const drawCubeBtn = document.getElementById('drawCubeBtn');
const scale3DInput = document.getElementById('scale3d');
const angleXInput = document.getElementById('angleX'); const angleYInput = document.getElementById('angleY'); const angleZInput = document.getElementById('angleZ');
const scale3DLabel = document.getElementById('scale3d_label'); const angleXLabel = document.getElementById('angleX_label'); const angleYLabel = document.getElementById('angleY_label'); const angleZLabel = document.getElementById('angleZ_label');

function draw3DCube() {
    isCubeActive = true;
    grid = Array(GRID_HEIGHT).fill(null).map(() => Array(GRID_WIDTH).fill(corFundo));
    polygons = [];
    const escala = parseFloat(scale3DInput.value) || 40;
    const offsetX = GRID_WIDTH / 2; const offsetY = GRID_HEIGHT / 2;
    const angleX = parseFloat(angleXInput.value) || 0;
    const angleY = parseFloat(angleYInput.value) || 0;
    const angleZ = parseFloat(angleZInput.value) || 0;
    
    scale3DLabel.textContent = escala;
    angleXLabel.textContent = angleX; angleYLabel.textContent = angleY; angleZLabel.textContent = angleZ;
    
    const arestasDoCubo = projetarCubo(escala, offsetX, offsetY, angleX, angleY, angleZ);
    arestasDoCubo.forEach(aresta => { const linha = bresenhamSync(aresta.p1.x, aresta.p1.y, aresta.p2.x, aresta.p2.y); linha.forEach(ponto => drawToGrid(ponto, corDesenho)); });
    renderGrid();
}
drawCubeBtn.addEventListener('click', () => {
    saveState();
    scale3DInput.value = 20;
    angleXInput.value = 0;
    angleYInput.value = 0;
    angleZInput.value = 0;
    draw3DCube();
});
scale3DInput.addEventListener('input', draw3DCube);
angleXInput.addEventListener('input', draw3DCube);
angleYInput.addEventListener('input', draw3DCube);
angleZInput.addEventListener('input', draw3DCube);

canvas.addEventListener('mouseenter', () => customCursor.style.display = 'block');
canvas.addEventListener('mouseleave', () => customCursor.style.display = 'none');
canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const gridX = Math.floor(x / PIXEL_SIZE);
    const gridY = Math.floor(y / PIXEL_SIZE);
    customCursor.style.left = `${rect.left + gridX * PIXEL_SIZE - 1}px`;
    customCursor.style.top = `${rect.top + gridY * PIXEL_SIZE - 1}px`;
    
    if (gridY >= 0 && gridY < GRID_HEIGHT && gridX >= 0 && gridX < GRID_WIDTH) {
        const color = grid[gridY][gridX];
        if (color === corDesenho) { customCursor.style.borderColor = 'white'; }
        else { customCursor.style.borderColor = 'black'; }
    }
});
init();