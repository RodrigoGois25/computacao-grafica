const verticesCubo = [
    { x: -1, y: -1, z: -1 }, { x:  1, y: -1, z: -1 }, { x:  1, y:  1, z: -1 }, { x: -1, y:  1, z: -1 },
    { x: -1, y: -1, z:  1 }, { x:  1, y: -1, z:  1 }, { x:  1, y:  1, z:  1 }, { x: -1, y:  1, z:  1 }
];

const arestasCubo = [
    [0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4],
    [0, 4], [1, 5], [2, 6], [3, 7]
];

function projetarCubo(escala, offsetX, offsetY, angleX, angleY, angleZ) {
    // 1. Cria matrizes de rotação para cada eixo
    const rotX = createRotationMatrix3D_X(angleX);
    const rotY = createRotationMatrix3D_Y(angleY);
    const rotZ = createRotationMatrix3D_Z(angleZ);

    // 2. Gira os vértices do cubo
    let rotatedVertices = transformPoints3D(verticesCubo, rotX);
    rotatedVertices = transformPoints3D(rotatedVertices, rotY);
    rotatedVertices = transformPoints3D(rotatedVertices, rotZ);
    
    // 3. Projeta os pontos 3D ROTACIONADOS para 2D
    const pontosProjetados = rotatedVertices.map(v => {
        return {
            x: Math.round(v.x * escala + offsetX),
            y: Math.round(v.y * escala + offsetY)
        };
    });
    
    const arestasProjetadas = arestasCubo.map(aresta => {
        const p1 = pontosProjetados[aresta[0]];
        const p2 = pontosProjetados[aresta[1]];
        return { p1, p2 };
    });

    return arestasProjetadas;
}