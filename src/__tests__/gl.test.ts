import { createGL } from "..";

const createTrackedFn = (name: string, calls: string[], result?: any) => ({
  [name]: (...args: any[]) => {
    calls.push(`${name}(${args.map((x) => JSON.stringify(x)).join(", ")})`);
    return result;
  },
});

const createIncrementingStirng = (name: string) => {
  let index = 1;
  return () => `${name}-${index++}`;
};

const createMockCanvas = (
  overrides: { [key: string]: any } = {}
): { canvas: HTMLCanvasElement; getCalls: () => string[] } => {
  const calls: string[] = [];

  const context: WebGLRenderingContext = {
    TEXTURE0: "TEXTURE0",
    TEXTURE1: "TEXTURE1",
    TEXTURE2: "TEXTURE2",
    TEXTURE3: "TEXTURE3",
    TEXTURE4: "TEXTURE4",
    TEXTURE5: "TEXTURE5",
    TEXTURE6: "TEXTURE6",
    TEXTURE7: "TEXTURE7",
    TEXTURE8: "TEXTURE8",
    TEXTURE9: "TEXTURE9",
    TEXTURE10: "TEXTURE10",
    TEXTURE11: "TEXTURE11",
    TEXTURE12: "TEXTURE12",
    TEXTURE13: "TEXTURE13",
    TEXTURE14: "TEXTURE14",
    TEXTURE15: "TEXTURE15",
    TEXTURE16: "TEXTURE16",
    TEXTURE17: "TEXTURE17",
    TEXTURE18: "TEXTURE18",
    TEXTURE19: "TEXTURE19",
    TEXTURE20: "TEXTURE20",
    TEXTURE21: "TEXTURE21",
    TEXTURE22: "TEXTURE22",
    TEXTURE23: "TEXTURE23",
    TEXTURE24: "TEXTURE24",
    TEXTURE25: "TEXTURE25",
    TEXTURE26: "TEXTURE26",
    TEXTURE27: "TEXTURE27",
    TEXTURE28: "TEXTURE28",
    TEXTURE29: "TEXTURE29",
    TEXTURE30: "TEXTURE30",
    TEXTURE31: "TEXTURE31",
    COLOR_BUFFER_BIT: 1,
    DEPTH_BUFFER_BIT: 2,
    ARRAY_BUFFER: "array_buffer",
    ELEMENT_ARRAY_BUFFER: "element_array_buffer",
    STATIC_DRAW: "static_draw",
    FLOAT: "float",
    UNSIGNED_INT: "uint",
    VERTEX_SHADER: "vertex",
    FRAGMENT_SHADER: "fragment",
    TRIANGLES: "triangles",
    TEXTURE_2D: "texture-2d",
    BLEND: "blend",
    SRC_ALPHA: "src_alpha",
    ONE_MINUS_SRC_ALPHA: "one_minus_src_alpha",
    createProgram: createIncrementingStirng("program"),
    createBuffer: createIncrementingStirng("buffer"),
    createTexture: createIncrementingStirng("texture"),
    createShader: (type: any) => `shader-${type}`,
    getShaderInfoLog: () => "",
    getAttribLocation: (program: any, name: any) => `aloc:${program}:${name}`,
    getUniformLocation: (program: any, name: any) => `uloc:${program}:${name}`,
    ...createTrackedFn("enable", calls, true),
    ...createTrackedFn("blendFunc", calls, true),
    ...createTrackedFn("getExtension", calls, true),
    ...createTrackedFn("clear", calls),
    ...createTrackedFn("clearColor", calls),
    ...createTrackedFn("drawArrays", calls),
    ...createTrackedFn("drawElements", calls),
    ...createTrackedFn("attachShader", calls),
    ...createTrackedFn("linkProgram", calls),
    ...createTrackedFn("useProgram", calls),
    ...createTrackedFn("shaderSource", calls),
    ...createTrackedFn("compileShader", calls),
    ...createTrackedFn("bindBuffer", calls),
    ...createTrackedFn("activeTexture", calls),
    ...createTrackedFn("bindTexture", calls),
    ...createTrackedFn("bufferData", calls),
    ...createTrackedFn("enableVertexAttribArray", calls),
    ...createTrackedFn("vertexAttribPointer", calls),
    ...createTrackedFn("uniformMatrix2fv", calls),
    ...createTrackedFn("uniform1i", calls),
    ...overrides,
  } as any;

  const getCalls = () => calls;

  const canvas = {
    getContext: (type: string) => {
      if (type !== "webgl") {
        throw new Error("Mock canvas unsupported context type");
      }

      return context;
    },
  } as any;

  return { canvas, getCalls };
};

test("can draw triangles", () => {
  const { canvas, getCalls } = createMockCanvas();
  const gl = createGL(canvas);

  gl.clear();

  const program = gl.createProgram({
    attributes: { at1: "vec2" },
    uniforms: { un1: "mat2" },
    fragmentUniforms: {},
    varying: {},
    textures: {},
    fragmentShaderSource: () => "mock fragment shader",
    vertexShaderSource: () => "mock vertex shader",
  });

  const at1Buffer = gl.createAttributeBuffer("vec2");
  at1Buffer.bufferData([0, 1, 2, 3, 4, 5]);

  program.drawTriangles({
    uniforms: { un1: [1, 0, 0, 1] },
    fragmentUniforms: {},
    attributeBuffers: { at1: at1Buffer },
    textureBuffers: {},
  });

  expect(getCalls()).toEqual([
    'getExtension("OES_element_index_uint")',
    'enable("blend")',
    'blendFunc("src_alpha", "one_minus_src_alpha")',
    "clearColor(0, 0, 0, 1)",
    "clear(3)",
    'shaderSource("shader-vertex", "attribute vec2 a_at1;\\nuniform mat2 u_un1;\\nmock vertex shader")',
    'compileShader("shader-vertex")',
    'attachShader("program-1", "shader-vertex")',
    'shaderSource("shader-fragment", "precision highp float;\\nmock fragment shader")',
    'compileShader("shader-fragment")',
    'attachShader("program-1", "shader-fragment")',
    'linkProgram("program-1")',
    'useProgram("program-1")',
    'bindBuffer("array_buffer", "buffer-1")',
    'bufferData("array_buffer", {"0":0,"1":1,"2":2,"3":3,"4":4,"5":5}, "static_draw")',
    'useProgram("program-1")',
    'bindBuffer("array_buffer", "buffer-1")',
    'enableVertexAttribArray("aloc:program-1:a_at1")',
    'vertexAttribPointer("aloc:program-1:a_at1", 2, "float", false, 0, 0)',
    'uniformMatrix2fv("uloc:program-1:u_un1", false, {"0":1,"1":0,"2":0,"3":1})',
    'drawArrays("triangles", 0, 3)',
  ]);
});

test("can draw triangles with indices", () => {
  const { canvas, getCalls } = createMockCanvas();
  const gl = createGL(canvas);

  gl.clear();

  const program = gl.createProgram({
    attributes: { at1: "vec2" },
    uniforms: { un1: "mat2" },
    fragmentUniforms: {},
    varying: {},
    textures: {},
    fragmentShaderSource: () => "mock fragment shader",
    vertexShaderSource: () => "mock vertex shader",
  });

  const at1Buffer = gl.createAttributeBuffer("vec2");
  at1Buffer.bufferData([0, 1, 2, 3, 4, 5]);

  const inBuffer = gl.createIndicesBuffer();
  inBuffer.bufferData([1, 2, 3]);

  program.drawTriangles({
    uniforms: { un1: [1, 0, 0, 1] },
    fragmentUniforms: {},
    attributeBuffers: { at1: at1Buffer },
    indicesBuffer: inBuffer,
    textureBuffers: {},
  });

  expect(getCalls()).toEqual([
    'getExtension("OES_element_index_uint")',
    'enable("blend")',
    'blendFunc("src_alpha", "one_minus_src_alpha")',
    "clearColor(0, 0, 0, 1)",
    "clear(3)",
    'shaderSource("shader-vertex", "attribute vec2 a_at1;\\nuniform mat2 u_un1;\\nmock vertex shader")',
    'compileShader("shader-vertex")',
    'attachShader("program-1", "shader-vertex")',
    'shaderSource("shader-fragment", "precision highp float;\\nmock fragment shader")',
    'compileShader("shader-fragment")',
    'attachShader("program-1", "shader-fragment")',
    'linkProgram("program-1")',
    'useProgram("program-1")',
    'bindBuffer("array_buffer", "buffer-1")',
    'bufferData("array_buffer", {"0":0,"1":1,"2":2,"3":3,"4":4,"5":5}, "static_draw")',
    'bindBuffer("element_array_buffer", "buffer-2")',
    'bufferData("element_array_buffer", {"0":1,"1":2,"2":3}, "static_draw")',
    'useProgram("program-1")',
    'bindBuffer("array_buffer", "buffer-1")',
    'enableVertexAttribArray("aloc:program-1:a_at1")',
    'vertexAttribPointer("aloc:program-1:a_at1", 2, "float", false, 0, 0)',
    'uniformMatrix2fv("uloc:program-1:u_un1", false, {"0":1,"1":0,"2":0,"3":1})',
    'bindBuffer("element_array_buffer", "buffer-2")',
    'drawElements("triangles", 3, "uint", 0)',
  ]);
});

test("can draw triangles with texture", () => {
  const { canvas, getCalls } = createMockCanvas();
  const gl = createGL(canvas);

  gl.clear();

  const program = gl.createProgram({
    attributes: { at1: "vec2" },
    uniforms: { un1: "mat2" },
    fragmentUniforms: {},
    varying: {},
    textures: { tx1: "sampler2D" },
    fragmentShaderSource: () => "mock fragment shader",
    vertexShaderSource: () => "mock vertex shader",
  });

  const at1Buffer = gl.createAttributeBuffer("vec2");
  at1Buffer.bufferData([0, 1, 2, 3, 4, 5]);

  const tx1Buffer = gl.createTextureBuffer("sampler2D");

  program.drawTriangles({
    uniforms: { un1: [1, 0, 0, 1] },
    fragmentUniforms: {},
    attributeBuffers: { at1: at1Buffer },
    textureBuffers: { tx1: tx1Buffer },
  });

  expect(getCalls()).toEqual([
    'getExtension("OES_element_index_uint")',
    'enable("blend")',
    'blendFunc("src_alpha", "one_minus_src_alpha")',
    "clearColor(0, 0, 0, 1)",
    "clear(3)",
    'shaderSource("shader-vertex", "attribute vec2 a_at1;\\nuniform mat2 u_un1;\\nmock vertex shader")',
    'compileShader("shader-vertex")',
    'attachShader("program-1", "shader-vertex")',
    'shaderSource("shader-fragment", "precision highp float;\\nuniform sampler2D t_tx1;\\nmock fragment shader")',
    'compileShader("shader-fragment")',
    'attachShader("program-1", "shader-fragment")',
    'linkProgram("program-1")',
    'useProgram("program-1")',
    'bindBuffer("array_buffer", "buffer-1")',
    'bufferData("array_buffer", {"0":0,"1":1,"2":2,"3":3,"4":4,"5":5}, "static_draw")',
    'useProgram("program-1")',
    'bindBuffer("array_buffer", "buffer-1")',
    'enableVertexAttribArray("aloc:program-1:a_at1")',
    'vertexAttribPointer("aloc:program-1:a_at1", 2, "float", false, 0, 0)',
    'uniformMatrix2fv("uloc:program-1:u_un1", false, {"0":1,"1":0,"2":0,"3":1})',
    'activeTexture("TEXTURE0")',
    'bindTexture("texture-2d", "texture-1")',
    'uniform1i("uloc:program-1:t_tx1", 0)',
    'drawArrays("triangles", 0, 3)',
  ]);
});

test("throws an error if unsigned integers extension cannot be enabled", () => {
  const { canvas } = createMockCanvas({
    getExtension: (name: string) => name !== "OES_element_index_uint",
  });

  expect(() => createGL(canvas)).toThrowError(
    "Device does not support gl.UNSIGNED_INT indices"
  );
});

test("throws an error if a program cannot be created", () => {
  const { canvas } = createMockCanvas({
    createProgram: () => null,
  });

  const gl = createGL(canvas);
  const createProgram = () =>
    gl.createProgram({
      uniforms: {},
      fragmentUniforms: {},
      attributes: {},
      varying: {},
      textures: {},
      fragmentShaderSource: () => "",
      vertexShaderSource: () => "",
    });

  expect(createProgram).toThrowError("Failed to create program");
});
