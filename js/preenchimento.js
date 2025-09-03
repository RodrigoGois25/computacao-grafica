// Arquivo: js/preenchimento.js (VERSÃO ANIMADA)

async function floodFill(x, y, fillColor, grid) {
    const gridWidth = grid[0].length;
    const gridHeight = grid.length;
    if (x < 0 || x >= gridWidth || y < 0 || y >= gridHeight) return;

    const targetColor = grid[y][x];
    if (targetColor === fillColor) return;

    const stack = [{ x, y }];

    while (stack.length > 0) {
        const point = stack.pop();
        const px = point.x;
        const py = point.y;

        if (px < 0 || px >= gridWidth || py < 0 || py >= gridHeight) continue;

        if (grid[py][px] === targetColor) {
            grid[py][px] = fillColor;

            // Adiciona vizinhos na pilha
            stack.push({ x: px + 1, y: py });
            stack.push({ x: px - 1, y: py });
            stack.push({ x: px, y: py + 1 });
            stack.push({ x: px, y: py - 1 });

            // Pequena pausa para animação
            if (stack.length % 20 === 0) { // Atualiza a tela a cada 20 pixels para ser mais rápido
                 renderGrid();
                 await sleep(1);
            }
        }
    }
}