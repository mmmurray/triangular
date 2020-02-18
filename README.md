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
  varying: {},
  vertexShaderSource: ({ attributes }) => `
      void main() {
        gl_Position = vec4(${attributes.position}.xy, 0, 1);
      }
    `,
  fragmentShaderSource: () => `
      void main() {
        gl_FragColor = vec4(0, 1, 0, 1);
      }
    `,
})

gl.clear()

program.drawTriangles({
  uniforms: {},
  attributeBuffers: { position: positionBuffer },
})
```
