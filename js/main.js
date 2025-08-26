const canvas = document.getElementById('mainCanvas');
const ctx = canvas.getContext('2d');
const clearButton = document.getElementById('clearButton');

const PIXEL_SIZE = 5;
const GRID_WIDTH = canvas.width / PIXEL_SIZE;
const GRID_HEIGHT = canvas.height / PIXEL_SIZE;

const corFundo = 'rgb(255, 255, 255)';
const corDesenho = 'rgb(0, 0, 0)';
const corPreenchimento = 'rgb(0, 150, 255)';
const corControle = 'rgb(255, 0, 0)';

let grid = [];
let drawingMode = 'poligono';
let tempPoints = [];
let polygons = [];

let clippingState = 'defining_window';
let clipWindow = {};

// --- FUNÇÕES DE SETUP E RENDER ---
function init() {
    grid = Array(GRID_HEIGHT).fill(null).map(() => Array(GRID_WIDTH).fill(corFundo));
    tempPoints = [];
    polygons = [];
    clippingState = 'defining_window';
    clipWindow = {};
    document.querySelector('input[name="tool"][value="poligono"]').checked = true;
    drawingMode = 'poligono';
    renderGrid();
}

function renderGrid() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let y = 0; y < GRID_HEIGHT; y++) {
        for (let x = 0; x < GRID_WIDTH; x++) {
            if (grid[y][x] !== corFundo) {
                ctx.fillStyle = grid[y][x];
                ctx.fillRect(x * PIXEL_SIZE, y * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE);
            }
        }
    }
}

function drawToGrid(point, color) {
    if (point.y >= 0 && point.y < GRID_HEIGHT && point.x >= 0 && point.x < GRID_WIDTH) {
        grid[point.y][point.x] = color;
    }
}

// --- LÓGICA DE DESENHO 2D ---
function handleCanvasClick(event) {
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((event.clientX - rect.left) / PIXEL_SIZE);
    const y = Math.floor((event.clientY - rect.top) / PIXEL_SIZE);

    // ... (O switch case para as ferramentas 2D continua o mesmo)
    switch (drawingMode) {
        case 'bresenham': case 'circulo': case 'curva':
            tempPoints.push({ x, y }); processShapeDrawing(x, y); break;
        case 'poligono':
            if (event.detail === 2) { if (tempPoints.length > 2) finalizePolygon(); } else { tempPoints.push({ x, y }); drawTempPolygon(); } break;
        case 'preenchimento':
            floodFill(x, y, corPreenchimento, grid); renderGrid(); break;
        case 'scanline':
            if (polygons.length > 0) { scanlineFill(polygons[polygons.length - 1], corPreenchimento, grid); renderGrid(); } break;
        case 'recorte':
            if (clippingState === 'defining_window') {
                tempPoints.push({ x, y });
                ctx.fillStyle = corControle;
                ctx.fillRect(x * PIXEL_SIZE, y * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE);
                if (tempPoints.length === 2) {
                    clipWindow.xmin = Math.min(tempPoints[0].x, tempPoints[1].x); clipWindow.ymin = Math.min(tempPoints[0].y, tempPoints[1].y);
                    clipWindow.xmax = Math.max(tempPoints[0].x, tempPoints[1].x); clipWindow.ymax = Math.max(tempPoints[0].y, tempPoints[1].y);
                    clippingState = 'drawing_lines'; tempPoints = []; renderGrid(); drawClipWindow();
                }
            } else {
                tempPoints.push({ x, y });
                if (tempPoints.length === 1) {
                    ctx.fillStyle = corControle; ctx.fillRect(x * PIXEL_SIZE, y * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE);
                } else if (tempPoints.length === 2) {
                    const p1 = tempPoints[0]; const p2 = tempPoints[1];
                    renderGrid(); drawClipWindow();
                    const originalLine = bresenham(p1.x, p1.y, p2.x, p2.y);
                    originalLine.forEach(p => { ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(p.x * PIXEL_SIZE, p.y * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE); });
                    const clippedLine = cohenSutherland(p1.x, p1.y, p2.x, p2.y, clipWindow.xmin, clipWindow.ymin, clipWindow.xmax, clipWindow.ymax);
                    if (clippedLine) {
                        const lineSegment = bresenham(clippedLine.x0, clippedLine.y0, clippedLine.x1, clippedLine.y1);
                        lineSegment.forEach(p => { ctx.fillStyle = corDesenho; ctx.fillRect(p.x * PIXEL_SIZE, p.y * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE); });
                    }
                    tempPoints = [];
                }
            } break;
    }
}

// ... (Todas as funções auxiliares para desenho 2D continuam as mesmas)
function processShapeDrawing(x, y) { if (drawingMode === 'bresenham' && tempPoints.length === 2) { const points = bresenham(tempPoints[0].x, tempPoints[0].y, x, y); points.forEach(p => drawToGrid(p, corDesenho)); tempPoints = []; } else if (drawingMode === 'circulo' && tempPoints.length === 2) { const dx = x - tempPoints[0].x; const dy = y - tempPoints[0].y; const radius = Math.round(Math.sqrt(dx * dx + dy * dy)); const points = midpointCircle(tempPoints[0].x, tempPoints[0].y, radius); points.forEach(p => drawToGrid(p, corDesenho)); tempPoints = []; } else if (drawingMode === 'curva' && tempPoints.length === 4) { const bezierPoints = cubicBezier(tempPoints[0], tempPoints[1], tempPoints[2], tempPoints[3]); for (let i = 0; i < bezierPoints.length - 1; i++) { const lineSegment = bresenham(bezierPoints[i].x, bezierPoints[i].y, bezierPoints[i + 1].x, bezierPoints[i + 1].y); lineSegment.forEach(p => drawToGrid(p, corDesenho)); } tempPoints = []; } renderGrid(); tempPoints.forEach(p => { ctx.fillStyle = corControle; ctx.fillRect(p.x * PIXEL_SIZE, p.y * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE); }); }
function finalizePolygon() { polygons.push([...tempPoints]); for (let i = 0; i < tempPoints.length; i++) { const p1 = tempPoints[i]; const p2 = tempPoints[(i + 1) % tempPoints.length]; const lineSegment = bresenham(p1.x, p1.y, p2.x, p2.y); lineSegment.forEach(p => drawToGrid(p, corDesenho)); } tempPoints = []; renderGrid(); }
function drawTempPolygon() { renderGrid(); tempPoints.forEach(p => { ctx.fillStyle = corControle; ctx.fillRect(p.x * PIXEL_SIZE, p.y * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE); }); for (let i = 0; i < tempPoints.length - 1; i++) { const linePoints = bresenham(tempPoints[i].x, tempPoints[i].y, tempPoints[i + 1].x, tempPoints[i + 1].y); linePoints.forEach(p => { ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(p.x * PIXEL_SIZE, p.y * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE); }); } }
function drawClipWindow() { if (clipWindow.xmin !== undefined) { ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)'; ctx.lineWidth = 2; ctx.setLineDash([5, 5]); ctx.strokeRect(clipWindow.xmin * PIXEL_SIZE, clipWindow.ymin * PIXEL_SIZE, (clipWindow.xmax - clipWindow.xmin) * PIXEL_SIZE, (clipWindow.ymax - clipWindow.ymin) * PIXEL_SIZE); ctx.setLineDash([]); } }


// --- LISTENERS DE EVENTOS ---
document.querySelectorAll('input[name="tool"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
        drawingMode = e.target.value;
        tempPoints = [];
        if (drawingMode === 'recorte') {
            clippingState = 'defining_window';
            clipWindow = {};
        }
        renderGrid();
        if (drawingMode === 'recorte') drawClipWindow();
    });
});
canvas.addEventListener('click', handleCanvasClick);
clearButton.addEventListener('click', init);

// --- LÓGICA DAS TRANSFORMAÇÕES 2D ---
function getPolygonCenter(polygon) { if (!polygon || polygon.length === 0) return { x: 0, y: 0 }; let sumX = 0, sumY = 0; for (const p of polygon) { sumX += p.x; sumY += p.y; } return { x: sumX / polygon.length, y: sumY / polygon.length }; }
document.getElementById('translateBtn').addEventListener('click', () => { if (polygons.length === 0) return; const tx = parseFloat(document.getElementById('tx').value) || 0; const ty = parseFloat(document.getElementById('ty').value) || 0; const translationMatrix = createTranslationMatrix(tx, ty); const lastPolygon = polygons.pop(); const newPolygon = transformPolygon(lastPolygon, translationMatrix); polygons.push(newPolygon); redrawAllPolygons(); });
document.getElementById('scaleBtn').addEventListener('click', () => { if (polygons.length === 0) return; const sx = parseFloat(document.getElementById('sx').value) || 1; const sy = parseFloat(document.getElementById('sy').value) || 1; const lastPolygon = polygons.pop(); const center = getPolygonCenter(lastPolygon); const T1 = createTranslationMatrix(-center.x, -center.y); const S = createScalingMatrix(sx, sy); const T2 = createTranslationMatrix(center.x, center.y); let finalMatrix = multiplyMatrices(T2, S); finalMatrix = multiplyMatrices(finalMatrix, T1); const newPolygon = transformPolygon(lastPolygon, finalMatrix); polygons.push(newPolygon); redrawAllPolygons(); });
document.getElementById('rotateBtn').addEventListener('click', () => { if (polygons.length === 0) return; const angle = parseFloat(document.getElementById('angle').value) || 0; const lastPolygon = polygons.pop(); const center = getPolygonCenter(lastPolygon); const T1 = createTranslationMatrix(-center.x, -center.y); const R = createRotationMatrix(angle); const T2 = createTranslationMatrix(center.x, center.y); let finalMatrix = multiplyMatrices(T2, R); finalMatrix = multiplyMatrices(finalMatrix, T1); const newPolygon = transformPolygon(lastPolygon, finalMatrix); polygons.push(newPolygon); redrawAllPolygons(); });
function redrawAllPolygons() { grid = Array(GRID_HEIGHT).fill(null).map(() => Array(GRID_WIDTH).fill(corFundo)); polygons.forEach(poly => { for (let i = 0; i < poly.length; i++) { const p1 = poly[i]; const p2 = poly[(i + 1) % poly.length]; const lineSegment = bresenham(p1.x, p1.y, p2.x, p2.y); lineSegment.forEach(p => drawToGrid(p, corDesenho)); } }); renderGrid(); }

// --- LÓGICA PARA O CUBO 3D (CORRIGIDA) ---
const drawCubeBtn = document.getElementById('drawCubeBtn');
const txInput = document.getElementById('tx');
const tyInput = document.getElementById('ty');
const sxInput = document.getElementById('sx');
const syInput = document.getElementById('sy');
const angleInput = document.getElementById('angle');

function draw3DCube() {
    // Limpa a grade, mas não reseta as ferramentas
    grid = Array(GRID_HEIGHT).fill(null).map(() => Array(GRID_WIDTH).fill(corFundo));
    polygons = [];

    const escala = (parseFloat(sxInput.value) || 1) * 20;
    const offsetX = GRID_WIDTH / 2 + (parseFloat(txInput.value) || 0);
    const offsetY = GRID_HEIGHT / 2 + (parseFloat(tyInput.value) || 0);
    const angle = parseFloat(angleInput.value) || 0;

    const arestasDoCubo = projetarCubo(escala, offsetX, offsetY, angle, angle, angle);

    arestasDoCubo.forEach(aresta => {
        const linha = bresenham(aresta.p1.x, aresta.p1.y, aresta.p2.x, aresta.p2.y);
        linha.forEach(ponto => drawToGrid(ponto, corDesenho));
    });

    renderGrid();
}

drawCubeBtn.addEventListener('click', draw3DCube);
txInput.addEventListener('input', draw3DCube);
tyInput.addEventListener('input', draw3DCube);
sxInput.addEventListener('input', draw3DCube);
syInput.addEventListener('input', draw3DCube);
angleInput.addEventListener('input', draw3DCube);

init(); // Inicia a aplicação