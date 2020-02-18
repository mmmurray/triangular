import { createGL } from '../gl/gl'
import { Mat3 } from '../gl/types'

const mat3 = (
  m00 = 0,
  m01 = 0,
  m02 = 0,
  m10 = 0,
  m11 = 0,
  m12 = 0,
  m20 = 0,
  m21 = 0,
  m22 = 0,
): Mat3 => [m00, m01, m02, m10, m11, m12, m20, m21, m22]

const mat3Projection = (
  width: number,
  height: number,
  out: Mat3 = mat3(),
): Mat3 => {
  out[0] = 2 / width
  out[1] = 0
  out[2] = 0
  out[3] = 0
  out[4] = -2 / height
  out[5] = 0
  out[6] = -1
  out[7] = 1
  out[8] = 1
  return out
}

const createApp = (
  canvas: HTMLCanvasElement,
  context: WebGLRenderingContext,
) => {
  const width = canvas.clientWidth
  const height = canvas.clientHeight

  const gl = createGL(context)

  const program = gl.createProgram({
    attributes: { position: 'vec2' },
    uniforms: { view: 'mat3' },
    varying: { color: 'vec3' },
    vertexShaderSource: ({ attributes, varying }) => `
      void main() {
        gl_Position = vec4((u_view * vec3(${attributes.position}.xy, 1)).xy, 0, 1);
        ${varying.color} = (gl_Position.xyz + vec3(1)) / vec3(2);
      }
    `,
    fragmentShaderSource: ({ varying }) => `
      void main() {
        gl_FragColor = vec4(${varying.color}, 1.0);
      }
    `,
  })

  const positionBuffer = gl.createAttributeBuffer('vec2')
  const indicesBuffer = gl.createIndicesBuffer([0, 1, 2, 1, 2, 3])

  let x = 0
  let y = 0
  let dx = 1
  let dy = 1
  const w = 200
  const h = w
  const speed = 3
  const animate = () => {
    window.requestAnimationFrame(animate)
    if (x + w > width || x < 0) {
      dx = -dx
    }
    if (y + h > height || y < 0) {
      dy = -dy
    }

    x += dx * speed
    y += dy * speed

    gl.clear()

    positionBuffer.bufferData([x, y, w + x, y, x, h + y, w + x, h + y])

    program.drawTriangles({
      uniforms: { view: mat3Projection(width, height) },
      attributeBuffers: { position: positionBuffer },
      indicesBuffer,
    })
  }

  return {
    run: () => {
      animate()
    },
  }
}

export { createApp }
