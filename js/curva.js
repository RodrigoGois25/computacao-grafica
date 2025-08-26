function cubicBezier(p0, p1, p2, p3, steps = 100) {
    let points = [];
    for (let i = 0; i <= steps; i++) {
        let t = i / steps;
        let tInv = 1 - t;
        let b0 = tInv * tInv * tInv;
        let b1 = 3 * t * tInv * tInv;
        let b2 = 3 * t * t * tInv;
        let b3 = t * t * t;
        let x = Math.round(b0 * p0.x + b1 * p1.x + b2 * p2.x + b3 * p3.x);
        let y = Math.round(b0 * p0.y + b1 * p1.y + b2 * p2.y + b3 * p3.y);
        points.push({ x, y });
    }
    return points;
}