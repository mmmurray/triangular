import { createGL } from '../gl/gl'

const createTrackedFn = (name: string, calls: string[], result?: any) => ({
  [name]: (...args: any[]) => {
    calls.push(`${name}(${args.map(x => JSON.stringify(x)).join(', ')})`)
    return result
  },
})

const createIncrementingStirng = (name: string) => {
  let index = 1
  return () => `${name}-${index++}`
}

const createMockContext = (
  overrides: { [key: string]: any } = {},
): { context: WebGLRenderingContext; getCalls: () => string[] } => {
  const calls: string[] = []

  const context: WebGLRenderingContext = {
    COLOR_BUFFER_BIT: 1,
    DEPTH_BUFFER_BIT: 2,
    ARRAY_BUFFER: 'array_buffer',
    ELEMENT_ARRAY_BUFFER: 'element_array_buffer',
    STATIC_DRAW: 'static_draw',
    FLOAT: 'float',
    UNSIGNED_INT: 'uint',
    VERTEX_SHADER: 'vertex',
    FRAGMENT_SHADER: 'fragment',
    TRIANGLES: 'triangles',
    createProgram: createIncrementingStirng('program'),
    createBuffer: createIncrementingStirng('buffer'),
    createShader: (type: any) => `shader-${type}`,
    getShaderInfoLog: () => '',
    getAttribLocation: (program: any, name: any) => `aloc:${program}:${name}`,
    getUniformLocation: (program: any, name: any) => `uloc:${program}:${name}`,
    ...createTrackedFn('getExtension', calls, true),
    ...createTrackedFn('clear', calls),
    ...createTrackedFn('clearColor', calls),
    ...createTrackedFn('drawArrays', calls),
    ...createTrackedFn('drawElements', calls),
    ...createTrackedFn('attachShader', calls),
    ...createTrackedFn('linkProgram', calls),
    ...createTrackedFn('useProgram', calls),
    ...createTrackedFn('shaderSource', calls),
    ...createTrackedFn('compileShader', calls),
    ...createTrackedFn('bindBuffer', calls),
    ...createTrackedFn('bufferData', calls),
    ...createTrackedFn('enableVertexAttribArray', calls),
    ...createTrackedFn('vertexAttribPointer', calls),
    ...createTrackedFn('uniformMatrix2fv', calls),
    ...overrides,
  } as any

  const getCalls = () => calls

  return { context, getCalls }
}

test('can draw triangles', () => {
  const { context, getCalls } = createMockContext()
  const gl = createGL(context)

  gl.clear()

  const program = gl.createProgram({
    attributes: { at1: 'vec2' },
    uniforms: { un1: 'mat2' },
    varying: {},
    fragmentShaderSource: () => 'mock fragment shader',
    vertexShaderSource: () => 'mock vertex shader',
  })

  const at1Buffer = gl.createAttributeBuffer('vec2', [0, 1, 2, 3, 4, 5])

  program.drawTriangles({
    uniforms: { un1: [1, 0, 0, 1] },
    attributeBuffers: { at1: at1Buffer },
  })

  expect(getCalls()).toEqual([
    'getExtension("OES_element_index_uint")',
    'clearColor(0, 0, 0, 1)',
    'clear(3)',
    'shaderSource("shader-vertex", "attribute vec2 a_at1;\\nuniform mat2 u_un1;\\n\\nmock vertex shader")',
    'compileShader("shader-vertex")',
    'attachShader("program-1", "shader-vertex")',
    'shaderSource("shader-fragment", "precision mediump float;\\n\\nmock fragment shader")',
    'compileShader("shader-fragment")',
    'attachShader("program-1", "shader-fragment")',
    'linkProgram("program-1")',
    'useProgram("program-1")',
    'bindBuffer("array_buffer", "buffer-1")',
    'bufferData("array_buffer", {"0":0,"1":1,"2":2,"3":3,"4":4,"5":5}, "static_draw")',
    'bindBuffer("array_buffer", "buffer-1")',
    'enableVertexAttribArray("aloc:program-1:a_at1")',
    'vertexAttribPointer("aloc:program-1:a_at1", 2, "float", false, 0, 0)',
    'uniformMatrix2fv("uloc:program-1:u_un1", false, {"0":1,"1":0,"2":0,"3":1})',
    'useProgram("program-1")',
    'drawArrays("triangles", 0, 3)',
  ])
})

test('can draw triangles with indices', () => {
  const { context, getCalls } = createMockContext()
  const gl = createGL(context)

  gl.clear()

  const program = gl.createProgram({
    attributes: { at1: 'vec2' },
    uniforms: { un1: 'mat2' },
    varying: {},
    fragmentShaderSource: () => 'mock fragment shader',
    vertexShaderSource: () => 'mock vertex shader',
  })

  const at1Buffer = gl.createAttributeBuffer('vec2', [0, 1, 2, 3, 4, 5])
  const inBuffer = gl.createIndicesBuffer([1, 2, 3])

  program.drawTriangles({
    uniforms: { un1: [1, 0, 0, 1] },
    attributeBuffers: { at1: at1Buffer },
    indicesBuffer: inBuffer,
  })

  expect(getCalls()).toEqual([
    'getExtension("OES_element_index_uint")',
    'clearColor(0, 0, 0, 1)',
    'clear(3)',
    'shaderSource("shader-vertex", "attribute vec2 a_at1;\\nuniform mat2 u_un1;\\n\\nmock vertex shader")',
    'compileShader("shader-vertex")',
    'attachShader("program-1", "shader-vertex")',
    'shaderSource("shader-fragment", "precision mediump float;\\n\\nmock fragment shader")',
    'compileShader("shader-fragment")',
    'attachShader("program-1", "shader-fragment")',
    'linkProgram("program-1")',
    'useProgram("program-1")',
    'bindBuffer("array_buffer", "buffer-1")',
    'bufferData("array_buffer", {"0":0,"1":1,"2":2,"3":3,"4":4,"5":5}, "static_draw")',
    'bindBuffer("element_array_buffer", "buffer-2")',
    'bufferData("element_array_buffer", {"0":1,"1":2,"2":3}, "static_draw")',
    'bindBuffer("array_buffer", "buffer-1")',
    'enableVertexAttribArray("aloc:program-1:a_at1")',
    'vertexAttribPointer("aloc:program-1:a_at1", 2, "float", false, 0, 0)',
    'uniformMatrix2fv("uloc:program-1:u_un1", false, {"0":1,"1":0,"2":0,"3":1})',
    'useProgram("program-1")',
    'bindBuffer("element_array_buffer", "buffer-2")',
    'drawElements("triangles", 3, "uint", 0)',
  ])
})

test('throws an error if unsigned integers extension cannot be enabled', () => {
  const { context } = createMockContext({
    getExtension: (name: string) => name !== 'OES_element_index_uint',
  })

  expect(() => createGL(context)).toThrowError(
    'Device does not support gl.UNSIGNED_INT indices',
  )
})

test('throws an error if a program cannot be created', () => {
  const { context } = createMockContext({
    createProgram: () => null,
  })

  const gl = createGL(context)
  const createProgram = () =>
    gl.createProgram({
      uniforms: {},
      attributes: {},
      varying: {},
      fragmentShaderSource: () => '',
      vertexShaderSource: () => '',
    })

  expect(createProgram).toThrowError('Failed to create program')
})
