async function midpointCircle(xc, yc, radius) {
    let x = radius;
    let y = 0;
    let err = 1 - radius;

    while (x >= y) {
        // Desenha os 8 pontos simétricos na grade
        drawToGrid({ x: xc + x, y: yc + y }, corDesenho);
        drawToGrid({ x: xc + y, y: yc + x }, corDesenho);
        drawToGrid({ x: xc - y, y: yc + x }, corDesenho);
        drawToGrid({ x: xc - x, y: yc + y }, corDesenho);
        drawToGrid({ x: xc - x, y: yc - y }, corDesenho);
        drawToGrid({ x: xc - y, y: yc - x }, corDesenho);
        drawToGrid({ x: xc + y, y: yc - x }, corDesenho);
        drawToGrid({ x: xc + x, y: yc - y }, corDesenho);

        // Pausa para a animação
        renderGrid();
        await sleep(30); // Pausa de 30 milissegundos

        y++;
        if (err < 0) {
            err += 2 * y + 1;
        } else {
            x--;
            err += 2 * (y - x) + 1;
        }
    }
}