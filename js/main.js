// Arquivo: js/main.js (VERSÃO CORRIGIDA)

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
let historyStack = [];
let isCubeActive = false;

const sleep = (ms) => new Promise(res => setTimeout(res, ms));

// NOVO: Versão RÁPIDA (Síncrona) do Bresenham para feedback visual instantâneo
const bresenhamSync = (x0, y0, x1, y1) => {
    let points = [];
    let dx = Math.abs(x1 - x0);
    let dy = Math.abs(y1 - y0);
    let sx = (x0 < x1) ? 1 : -1;
    let sy = (y0 < y1) ? 1 : -1;
    let err = dx - dy;
    while (true) {
        points.push({x: x0, y: y0});
        if (x0 === x1 && y0 === y1) break;
        let e2 = 2 * err;
        if (e2 > -dy) { err -= dy; x0 += sx; }
        if (e2 < dx) { err += dx; y0 += sy; }
    }
    return points;
};

function saveState() {
    const state = { grid: JSON.parse(JSON.stringify(grid)), polygons: JSON.parse(JSON.stringify(polygons)), };
    historyStack.push(state);
    if (historyStack.length > 20) historyStack.shift();
}

function undo() {
    if (historyStack.length > 0) {
        const lastState = historyStack.pop();
        grid = lastState.grid; polygons = lastState.polygons; isCubeActive = false;
        renderGrid();
        if (drawingMode === 'recorte') drawClipWindow();
    } else { console.log("Não há mais ações para desfazer."); }
}

function init() {
    grid = Array(GRID_HEIGHT).fill(null).map(() => Array(GRID_WIDTH).fill(corFundo));
    tempPoints = []; polygons = []; historyStack = []; isCubeActive = false;
    clippingState = 'defining_window'; clipWindow = {};
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

async function handleCanvasClick(event) {
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((event.clientX - rect.left) / PIXEL_SIZE);
    const y = Math.floor((event.clientY - rect.top) / PIXEL_SIZE);
    isCubeActive = false;

    if (drawingMode !== 'recorte' && drawingMode !== 'poligono' && tempPoints.length === 1) saveState();
    if (drawingMode === 'preenchimento' || drawingMode === 'scanline') saveState();

    switch (drawingMode) {
        case 'bresenham': case 'circulo': case 'curva':
            tempPoints.push({ x, y });
            await processShapeDrawing(x, y);
            break;
        case 'poligono':
            if (event.detail === 2) { if (tempPoints.length > 2) { saveState(); await finalizePolygon(); } } else { tempPoints.push({ x, y }); drawTempPolygon(); } break;
        case 'preenchimento':
            await floodFill(x, y, corPreenchimento, grid);
            renderGrid();
            break;
        case 'scanline':
            if (polygons.length > 0) {
                await scanlineFill(polygons[polygons.length - 1], corPreenchimento, grid);
                renderGrid();
            }
            break;
        case 'recorte':
            await handleClippingClick(x, y); break;
    }
}

async function processShapeDrawing(x, y) {
    renderGrid();
    if (tempPoints.length < 4 && drawingMode === 'curva' || tempPoints.length < 2) {
        tempPoints.forEach(p => { ctx.fillStyle = corControle; ctx.fillRect(p.x * PIXEL_SIZE, p.y * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE); });
        return;
    }

    if (drawingMode === 'bresenham') {
        await bresenham(tempPoints[0].x, tempPoints[0].y, x, y);
    } else if (drawingMode === 'circulo') {
        const dx = x - tempPoints[0].x;
        const dy = y - tempPoints[0].y;
        const radius = Math.round(Math.sqrt(dx * dx + dy * dy));
        await midpointCircle(tempPoints[0].x, tempPoints[0].y, radius);
    } else if (drawingMode === 'curva') {
        const bezierPoints = cubicBezier(tempPoints[0], tempPoints[1], tempPoints[2], tempPoints[3]);
        for (let i = 0; i < bezierPoints.length - 1; i++) {
            await bresenham(bezierPoints[i].x, bezierPoints[i].y, bezierPoints[i + 1].x, bezierPoints[i + 1].y);
        }
    }
    tempPoints = [];
    renderGrid();
}

async function finalizePolygon() {
    polygons.push([...tempPoints]);
    for (let i = 0; i < tempPoints.length; i++) {
        const p1 = tempPoints[i];
        const p2 = tempPoints[(i + 1) % tempPoints.length];
        await bresenham(p1.x, p1.y, p2.x, p2.y);
    }
    tempPoints = [];
    renderGrid();
}

function drawTempPolygon() {
    renderGrid();
    tempPoints.forEach(p => { ctx.fillStyle = corControle; ctx.fillRect(p.x * PIXEL_SIZE, p.y * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE); });
    for (let i = 0; i < tempPoints.length - 1; i++) {
        const linePoints = bresenhamSync(tempPoints[i].x, tempPoints[i].y, tempPoints[i+1].x, tempPoints[i+1].y);
        linePoints.forEach(p => { ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(p.x * PIXEL_SIZE, p.y * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE); });
    }
}

async function handleClippingClick(x, y) {
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
            saveState();
            const p1 = tempPoints[0]; const p2 = tempPoints[1];
            renderGrid(); drawClipWindow();
            const originalLine = bresenhamSync(p1.x, p1.y, p2.x, p2.y);
            originalLine.forEach(p => { ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(p.x * PIXEL_SIZE, p.y * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE); });
            const clippedLine = cohenSutherland(p1.x, p1.y, p2.x, p2.y, clipWindow.xmin, clipWindow.ymin, clipWindow.xmax, clipWindow.ymax);
            if (clippedLine) {
                const lineSegment = bresenhamSync(clippedLine.x0, clippedLine.y0, clippedLine.x1, clippedLine.y1);
                lineSegment.forEach(p => { ctx.fillStyle = corDesenho; ctx.fillRect(p.x * PIXEL_SIZE, p.y * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE); });
            }
            tempPoints = [];
        }
    }
}

function drawClipWindow() { if (clipWindow.xmin !== undefined) { ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)'; ctx.lineWidth = 2; ctx.setLineDash([5, 5]); ctx.strokeRect(clipWindow.xmin * PIXEL_SIZE, clipWindow.ymin * PIXEL_SIZE, (clipWindow.xmax - clipWindow.xmin) * PIXEL_SIZE, (clipWindow.ymax - clipWindow.ymin) * PIXEL_SIZE); ctx.setLineDash([]); } }
document.querySelectorAll('input[name="tool"]').forEach(radio=>{radio.addEventListener('change',e=>{drawingMode=e.target.value;isCubeActive=false;tempPoints=[];if(drawingMode==='recorte'){clippingState='defining_window';clipWindow={}}renderGrid();if(drawingMode==='recorte')drawClipWindow()})});canvas.addEventListener('click',handleCanvasClick);clearButton.addEventListener('click',init);const undoButton=document.getElementById('undoButton');undoButton.addEventListener('click',undo);
function getPolygonCenter(polygon){if(!polygon||polygon.length===0)return{x:0,y:0};let sumX=0,sumY=0;for(const p of polygon){sumX+=p.x;sumY+=p.y}return{x:sumX/polygon.length,y:sumY/polygon.length}}
document.getElementById('translateBtn').addEventListener('click',()=>{if(polygons.length===0)return;saveState();const tx=parseFloat(document.getElementById('tx').value)||0;const ty=parseFloat(document.getElementById('ty').value)||0;const tM=createTranslationMatrix(tx,ty);const lP=polygons.pop();const nP=transformPolygon(lP,tM);polygons.push(nP);redrawAllPolygons()});document.getElementById('scaleBtn').addEventListener('click',()=>{if(polygons.length===0)return;saveState();const sx=parseFloat(document.getElementById('sx').value)||1;const sy=parseFloat(document.getElementById('sy').value)||1;const lP=polygons.pop();const c=getPolygonCenter(lP);const T1=createTranslationMatrix(-c.x,-c.y);const S=createScalingMatrix(sx,sy);const T2=createTranslationMatrix(c.x,c.y);let fM=multiplyMatrices(T2,S);fM=multiplyMatrices(fM,T1);const nP=transformPolygon(lP,fM);polygons.push(nP);redrawAllPolygons()});document.getElementById('rotateBtn').addEventListener('click',()=>{if(polygons.length===0)return;saveState();const angle=parseFloat(document.getElementById('angle').value)||0;const lP=polygons.pop();const c=getPolygonCenter(lP);const T1=createTranslationMatrix(-c.x,-c.y);const R=createRotationMatrix(angle);const T2=createTranslationMatrix(c.x,c.y);let fM=multiplyMatrices(T2,R);fM=multiplyMatrices(fM,T1);const nP=transformPolygon(lP,fM);polygons.push(nP);redrawAllPolygons()});
function redrawAllPolygons(){grid=Array(GRID_HEIGHT).fill(null).map(()=>Array(GRID_WIDTH).fill(corFundo));polygons.forEach(poly=>{for(let i=0;i<poly.length;i++){const p1=poly[i];const p2=poly[(i+1)%poly.length];const lineSegment=bresenhamSync(p1.x,p1.y,p2.x,p2.y);lineSegment.forEach(p=>drawToGrid(p,corDesenho))}});renderGrid()}
const drawCubeBtn=document.getElementById('drawCubeBtn');const txInput=document.getElementById('tx');const tyInput=document.getElementById('ty');const sxInput=document.getElementById('sx');const syInput=document.getElementById('sy');const angleInput=document.getElementById('angle');
function draw3DCube(){isCubeActive=true;grid=Array(GRID_HEIGHT).fill(null).map(()=>Array(GRID_WIDTH).fill(corFundo));polygons=[];const escala=(parseFloat(sxInput.value)||1)*20;const offsetX=GRID_WIDTH/2+(parseFloat(txInput.value)||0);const offsetY=GRID_HEIGHT/2+(parseFloat(tyInput.value)||0);const angle=parseFloat(angleInput.value)||0;const arestasDoCubo=projetarCubo(escala,offsetX,offsetY,angle,angle,angle);arestasDoCubo.forEach(aresta=>{const linha=bresenhamSync(aresta.p1.x,aresta.p1.y,aresta.p2.x,aresta.p2.y);linha.forEach(ponto=>drawToGrid(ponto,corDesenho))});renderGrid()}
drawCubeBtn.addEventListener('click',()=>{saveState();draw3DCube()});txInput.addEventListener('input',()=>{if(isCubeActive)draw3DCube()});tyInput.addEventListener('input',()=>{if(isCubeActive)draw3DCube()});sxInput.addEventListener('input',()=>{if(isCubeActive)draw3DCube()});syInput.addEventListener('input',()=>{if(isCubeActive)draw3DCube()});angleInput.addEventListener('input',()=>{if(isCubeActive)draw3DCube()});
init();