function midpointCircle(xc, yc, radius) {
    let points = [];
    let x = radius;
    let y = 0;
    let err = 1 - radius;
    while (x >= y) {
        points.push({ x: xc + x, y: yc + y }, { x: xc + y, y: yc + x }, { x: xc - y, y: yc + x }, { x: xc - x, y: yc + y }, { x: xc - x, y: yc - y }, { x: xc - y, y: yc - x }, { x: xc + y, y: yc - x }, { x: xc + x, y: yc - y });
        y++;
        if (err < 0) {
            err += 2 * y + 1;
        } else {
            x--;
            err += 2 * (y - x) + 1;
        }
    }
    return points;
}