# Triangular ▲

Type safe wrapper for WebGL.

## Install

```console
yarn add triangular
```

Or

```console
npm i triangular
```

## Usage

```ts
import { createGL } from 'triangular';

const canvas = document.body.appendChild(document.createElement('canvas'));

const gl = createGL(canvas);

const positionBuffer = gl.createAttributeBuffer('vec2');
positionBuffer.bufferData([0, 1, 1, -1, -1, -1]);

const program = gl.createProgram({
  attributes: { position: 'vec2' },
  uniforms: {},
  fragmentUniforms: {},
  varying: { color: 'vec2' },
  textures: {},
  vertexShaderSource: ({ attributes, varying }) => `
    void main() {
      gl_Position = vec4(${attributes.position}.xy, 0, 1);
      ${varying.color} = (gl_Position.xy + vec2(1,1)) / vec2(2,2);
    }
  `,
  fragmentShaderSource: ({ varying }) => `
    void main() {
      gl_FragColor = vec4(0, ${varying.color}, 1);
    }
  `,
});

gl.clear();

program.drawTriangles({
  uniforms: {},
  fragmentUniforms: {},
  attributeBuffers: { position: positionBuffer },
  textureBuffers: {},
});
```

[![Edit triangular-example](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/triangular-example-d77h6?fontsize=14&hidenavigation=1&theme=dark)
