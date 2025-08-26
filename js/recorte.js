const INSIDE = 0; // 0000
const LEFT = 1;   // 0001
const RIGHT = 2;  // 0010
const BOTTOM = 4; // 0100
const TOP = 8;    // 1000

function computeOutCode(x, y, xmin, ymin, xmax, ymax) {
    let code = INSIDE;
    if (x < xmin) code |= LEFT;
    else if (x > xmax) code |= RIGHT;
    if (y < ymin) code |= BOTTOM;
    else if (y > ymax) code |= TOP;
    return code;
}

function cohenSutherland(x0, y0, x1, y1, xmin, ymin, xmax, ymax) {
    let outcode0 = computeOutCode(x0, y0, xmin, ymin, xmax, ymax);
    let outcode1 = computeOutCode(x1, y1, xmin, ymin, xmax, ymax);
    let accept = false;
    while (true) {
        if (!(outcode0 | outcode1)) {
            accept = true;
            break;
        } else if (outcode0 & outcode1) {
            break;
        } else {
            let x, y;
            let outcodeOut = outcode1 > outcode0 ? outcode1 : outcode0;
            if (outcodeOut & TOP) {
                x = x0 + (x1 - x0) * (ymax - y0) / (y1 - y0);
                y = ymax;
            } else if (outcodeOut & BOTTOM) {
                x = x0 + (x1 - x0) * (ymin - y0) / (y1 - y0);
                y = ymin;
            } else if (outcodeOut & RIGHT) {
                y = y0 + (y1 - y0) * (xmax - x0) / (x1 - x0);
                x = xmax;
            } else if (outcodeOut & LEFT) {
                y = y0 + (y1 - y0) * (xmin - x0) / (x1 - x0);
                x = xmin;
            }
            if (outcodeOut === outcode0) {
                x0 = x;
                y0 = y;
                outcode0 = computeOutCode(x0, y0, xmin, ymin, xmax, ymax);
            } else {
                x1 = x;
                y1 = y;
                outcode1 = computeOutCode(x1, y1, xmin, ymin, xmax, ymax);
            }
        }
    }
    if (accept) {
        return {
            x0: Math.round(x0),
            y0: Math.round(y0),
            x1: Math.round(x1),
            y1: Math.round(y1)
        };
    }
    return null;
}