// Arquivo: js/circulo.js (VERSÃO ANIMADA)
async function midpointCircle(xc, yc, radius) {
    let x = radius;
    let y = 0;
    let err = 1 - radius;
    while (x >= y) {
        drawToGrid({ x: xc + x, y: yc + y }, corDesenho);
        drawToGrid({ x: xc + y, y: yc + x }, corDesenho);
        drawToGrid({ x: xc - y, y: yc + x }, corDesenho);
        drawToGrid({ x: xc - x, y: yc + y }, corDesenho);
        drawToGrid({ x: xc - x, y: yc - y }, corDesenho);
        drawToGrid({ x: xc - y, y: yc - x }, corDesenho);
        drawToGrid({ x: xc + y, y: yc - x }, corDesenho);
        drawToGrid({ x: xc + x, y: yc - y }, corDesenho);
        renderGrid();
        await sleep(30);
        y++;
        if (err < 0) {
            err += 2 * y + 1;
        } else {
            x--;
            err += 2 * (y - x) + 1;
        }
    }
}