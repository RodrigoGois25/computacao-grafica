// Arquivo: js/projecoes.js

const verticesCubo = [ { x: -1, y: -1, z: -1 }, { x: 1, y: -1, z: -1 }, { x: 1, y: 1, z: -1 }, { x: -1, y: 1, z: -1 }, { x: -1, y: -1, z: 1 }, { x: 1, y: -1, z: 1 }, { x: 1, y: 1, z: 1 }, { x: -1, y: 1, z: 1 } ];
const arestasCubo = [ [0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7] ];

function projetarCubo(escala, offsetX, offsetY, angleX, angleY, angleZ) {
    const rotX = createRotationMatrix3D_X(angleX);
    const rotY = createRotationMatrix3D_Y(angleY);
    const rotZ = createRotationMatrix3D_Z(angleZ);
    
    let finalRotation = multiplyMatrices4x4(rotY, rotX);
    finalRotation = multiplyMatrices4x4(rotZ, finalRotation);
    
    const rotatedVertices = transformPoints3D(verticesCubo, finalRotation);
    
    const pontosProjetados = rotatedVertices.map(v => ({
        x: Math.round(v.x * escala + offsetX),
        y: Math.round(v.y * escala + offsetY)
    }));
    
    const arestasProjetadas = arestasCubo.map(aresta => ({
        p1: pontosProjetados[aresta[0]],
        p2: pontosProjetados[aresta[1]]
    }));

    return arestasProjetadas;
}

// NOVA FUNÇÃO ADICIONADA AQUI
function projetarEixos(escala, offsetX, offsetY, angleX, angleY, angleZ) {
    const rotX = createRotationMatrix3D_X(angleX);
    const rotY = createRotationMatrix3D_Y(angleY);
    const rotZ = createRotationMatrix3D_Z(angleZ);

    let finalRotation = multiplyMatrices4x4(rotY, rotX);
    finalRotation = multiplyMatrices4x4(rotZ, finalRotation);

    const rotatedVertices = transformPoints3D(verticesEixos, finalRotation);

    const pontosProjetados = rotatedVertices.map(v => ({
        x: Math.round(v.x * escala + offsetX),
        y: Math.round(v.y * escala + offsetY)
    }));

    const arestasProjetadas = arestasEixos.map(aresta => ({
        p1: pontosProjetados[aresta[0]],
        p2: pontosProjetados[aresta[1]]
    }));

    return { arestasProjetadas };
}