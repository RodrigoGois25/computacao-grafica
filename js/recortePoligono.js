// Arquivo: js/recortePoligono.js

function intersect(p1, p2, edge, clipBoundary) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    if (edge === 'left' || edge === 'right') {
        const x = clipBoundary;
        const y = p1.y + dy * (x - p1.x) / dx;
        return { x, y };
    } else { // top or bottom
        const y = clipBoundary;
        const x = p1.x + dx * (y - p1.y) / dy;
        return { x, y };
    }
}

function isInside(p, edge, clipBoundary) {
    if (edge === 'left') return p.x >= clipBoundary;
    if (edge === 'right') return p.x <= clipBoundary;
    if (edge === 'top') return p.y >= clipBoundary; // Y cresce para baixo no canvas, então >= para topo
    if (edge === 'bottom') return p.y <= clipBoundary;
    return false;
}

function sutherlandHodgman(polygon, clipWindow) {
    let outputList = [...polygon];
    const clipEdges = ['left', 'right', 'bottom', 'top'];
    const clipBoundaries = [clipWindow.xmin, clipWindow.xmax, clipWindow.ymax, clipWindow.ymin];

    for (let i = 0; i < clipEdges.length; i++) {
        const edge = clipEdges[i];
        const clipBoundary = clipBoundaries[i];
        const inputList = [...outputList];
        outputList = [];
        if (inputList.length === 0) break;
        let S = inputList[inputList.length - 1];
        for (let j = 0; j < inputList.length; j++) {
            let E = inputList[j];
            let s_inside = isInside(S, edge, clipBoundary);
            let e_inside = isInside(E, edge, clipBoundary);
            if (e_inside) {
                if (!s_inside) {
                    outputList.push(intersect(S, E, edge, clipBoundary));
                }
                outputList.push(E);
            } else if (s_inside) {
                outputList.push(intersect(S, E, edge, clipBoundary));
            }
            S = E;
        }
    }
    return outputList;
}