// Arquivo: js/transformacoes.js

// --- FUNÇÕES 2D (JÁ EXISTENTES) ---
function multiplyMatrixVector(matrix, vector) {
    const result = [0, 0, 0];
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            result[i] += matrix[i][j] * vector[j];
        }
    }
    return result;
}
function multiplyMatrices(matA, matB) {
    const result = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            for (let k = 0; k < 3; k++) {
                result[i][j] += matA[i][k] * matB[k][j];
            }
        }
    }
    return result;
}
function createTranslationMatrix(tx, ty) {
    return [[1, 0, tx], [0, 1, ty], [0, 0, 1]];
}
function createScalingMatrix(sx, sy) {
    return [[sx, 0, 0], [0, sy, 0], [0, 0, 1]];
}
function createRotationMatrix(angleDegrees) {
    const angleRadians = angleDegrees * (Math.PI / 180);
    const cos = Math.cos(angleRadians);
    const sin = Math.sin(angleRadians);
    return [[cos, -sin, 0], [sin, cos, 0], [0, 0, 1]];
}
function transformPolygon(polygon, matrix) {
    const newPolygon = [];
    for (const point of polygon) {
        const vector = [point.x, point.y, 1];
        const resultVector = multiplyMatrixVector(matrix, vector);
        newPolygon.push({ x: Math.round(resultVector[0]), y: Math.round(resultVector[1]) });
    }
    return newPolygon;
}

// --- FUNÇÕES 3D (NOVAS) ---
function createRotationMatrix3D_X(angleDegrees) {
    const angleRadians = angleDegrees * (Math.PI / 180);
    const cos = Math.cos(angleRadians);
    const sin = Math.sin(angleRadians);
    return [
        [1, 0, 0, 0],
        [0, cos, -sin, 0],
        [0, sin, cos, 0],
        [0, 0, 0, 1]
    ];
}

function createRotationMatrix3D_Y(angleDegrees) {
    const angleRadians = angleDegrees * (Math.PI / 180);
    const cos = Math.cos(angleRadians);
    const sin = Math.sin(angleRadians);
    return [
        [cos, 0, sin, 0],
        [0, 1, 0, 0],
        [-sin, 0, cos, 0],
        [0, 0, 0, 1]
    ];
}

function createRotationMatrix3D_Z(angleDegrees) {
    const angleRadians = angleDegrees * (Math.PI / 180);
    const cos = Math.cos(angleRadians);
    const sin = Math.sin(angleRadians);
    return [
        [cos, -sin, 0, 0],
        [sin, cos, 0, 0],
        [0, 0, 1, 0],
        [0, 0, 0, 1]
    ];
}

function multiplyMatrixVector3D(matrix, vector) {
    const result = [0, 0, 0, 0];
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            result[i] += matrix[i][j] * vector[j];
        }
    }
    return result;
}

function transformPoints3D(points, matrix) {
    return points.map(p => {
        const vector = [p.x, p.y, p.z, 1];
        const resultVector = multiplyMatrixVector3D(matrix, vector);
        return { x: resultVector[0], y: resultVector[1], z: resultVector[2] };
    });
}