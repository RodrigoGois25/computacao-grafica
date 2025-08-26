# Mini Paint - Trabalho Prático de Computação Gráfica

Este projeto é uma aplicação web desenvolvida como trabalho prático para a disciplina de Computação Gráfica. Trata-se de um editor gráfico simples, um "Mini Paint", que implementa do zero diversos algoritmos clássicos de rasterização, preenchimento, recorte, transformações 2D e projeção 3D.

A interface permite selecionar diferentes ferramentas para desenhar e manipular formas em um canvas digital baseado em uma grade de pixels.

## Funcionalidades Implementadas

O projeto inclui a implementação dos seguintes algoritmos:

-   **Rasterização de Primitivas:**
    -   Reta de **Bresenham**
    -   **Círculo** de Ponto Médio
-   **Curvas:**
    -   Curva de **Bézier Cúbica**
-   **Preenchimento de Polígonos:**
    -   **Flood Fill** (4-vizinhos, implementado com pilha)
    -   **Scanline**
-   **Recorte (Clipping):**
    -   Recorte de Linha com **Cohen-Sutherland**
-   **Transformações Geométricas 2D:**
    -   **Translação**, **Escala** e **Rotação** aplicadas a polígonos, implementadas com matrizes e coordenadas homogêneas.
-   **Projeções 3D:**
    -   **Projeção Ortográfica** de um cubo 3D aramado, com rotação interativa em tempo real nos eixos X, Y e Z.

## Demonstração

Aqui estão alguns exemplos de cada funcionalidade em ação.

*(coloque seu print do polígono preenchido com Scanline aqui)*
**Figura 1:** Polígono complexo preenchido com o algoritmo Scanline.

*(coloque seu print do recorte de linha aqui)*
**Figura 2:** Reta sendo recortada por uma janela de recorte retangular.

*(coloque seu print do cubo 3D girado aqui)*
**Figura 3:** Projeção ortográfica de um cubo 3D após ser rotacionado.

## Como Executar

Este projeto não requer instalação de dependências, apenas um navegador web moderno.

1.  Clone ou baixe este repositório.
2.  Abra o arquivo `index.html` no seu navegador de preferência (Google Chrome, Firefox, etc.).
3.  Utilize a interface para selecionar as ferramentas e desenhar no canvas.

## Estrutura do Projeto

O código está organizado da seguinte forma:

/
|-- index.html              # A interface principal da aplicação
|-- README.md               # Este arquivo de documentação
|
└── js/
|-- main.js             # Lógica principal, controle do canvas e eventos
|-- bresenham.js        # Algoritmo de rasterização de retas
|-- circulo.js          # Algoritmo de rasterização de círculos
|-- curva.js            # Algoritmo para curvas de Bézier
|-- preenchimento.js    # Algoritmo Flood Fill
|-- scanline.js         # Algoritmo de preenchimento Scanline
|-- recorte.js          # Algoritmo de recorte de linha Cohen-Sutherland
|-- transformacoes.js   # Funções para transformações 2D e 3D com matrizes
`-- projecoes.js        # Lógica da projeção ortográfica do cubo