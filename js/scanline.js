function scanlineFill(polygon, fillColor, grid) {
    if (!polygon || polygon.length < 3) return;
    let minY = Infinity;
    let maxY = -Infinity;
    for (const p of polygon) {
        minY = Math.min(minY, p.y);
        maxY = Math.max(maxY, p.y);
    }
    for (let y = minY; y < maxY; y++) {
        let intersections = [];
        for (let i = 0; i < polygon.length; i++) {
            const p1 = polygon[i];
            const p2 = polygon[(i + 1) % polygon.length];
            if (p1.y === p2.y) continue;
            if ((p1.y < y && p2.y >= y) || (p2.y < y && p1.y >= y)) {
                const x = p1.x + (y - p1.y) / (p2.y - p1.y) * (p2.x - p1.x);
                intersections.push(x);
            }
        }
        intersections.sort((a, b) => a - b);
        for (let i = 0; i < intersections.length; i += 2) {
            const x_start = Math.ceil(intersections[i]);
            const x_end = Math.floor(intersections[i + 1]);
            for (let x = x_start; x < x_end; x++) {
                 if (y >= 0 && y < grid.length && x >= 0 && x < grid[0].length) {
                    grid[y][x] = fillColor;
                }
            }
        }
    }
}