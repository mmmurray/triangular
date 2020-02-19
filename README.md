# Triangular ▲

Type safe API for WebGL

## Installation

```bash
yarn add triangular
```

## Usage

```ts
import { createGL } from 'triangular'

const canvas = document.createElement('canvas')
const context = canvas.getContext('webgl')

if (!context) {
  throw new Error('Your device does not support WebGL')
}

document.body.appendChild(canvas)

const gl = createGL(context)

const positionBuffer = gl.createAttributeBuffer('vec2', [0, 1, 1, -1, -1, -1])

const program = gl.createProgram({
  attributes: { position: 'vec2' },
  uniforms: {},
  varying: { color: 'vec2' },
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
})

gl.clear()

program.drawTriangles({
  uniforms: {},
  attributeBuffers: { position: positionBuffer },
})
```

[![Edit triangular-example-1](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/triangular-example-1-d77h6?fontsize=14&hidenavigation=1&theme=dark)
