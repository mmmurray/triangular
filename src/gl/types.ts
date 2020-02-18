export type Vec2 = [number, number]

export type Vec3 = [number, number, number]

export type Vec4 = [number, number, number, number]

export type Mat2 = [number, number, number, number]

export type Mat3 = [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
]

export type Mat4 = [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
]

export type ShaderTypeName =
  | 'bool'
  | 'int'
  | 'float'
  | 'bvec2'
  | 'bvec3'
  | 'bvec4'
  | 'ivec2'
  | 'ivec3'
  | 'ivec4'
  | 'vec2'
  | 'vec3'
  | 'vec4'
  | 'mat2'
  | 'mat3'
  | 'mat4'

export type AttributeShaderTypeName =
  | 'float'
  | 'bvec2'
  | 'bvec3'
  | 'bvec4'
  | 'ivec2'
  | 'ivec3'
  | 'ivec4'
  | 'vec2'
  | 'vec3'
  | 'vec4'
  | 'mat2'
  | 'mat3'
  | 'mat4'

export type UniformShaderTypeName =
  | 'bool'
  | 'int'
  | 'float'
  | 'bvec2'
  | 'bvec3'
  | 'bvec4'
  | 'ivec2'
  | 'ivec3'
  | 'ivec4'
  | 'vec2'
  | 'vec3'
  | 'vec4'
  | 'mat2'
  | 'mat3'
  | 'mat4'

export type VaryingShaderTypeName = 'float' | 'vec2' | 'vec3' | 'vec4'

export type ShaderType<T extends ShaderTypeName> = T extends 'bool'
  ? boolean
  : T extends 'int'
  ? number
  : T extends 'float'
  ? number
  : T extends 'bvec2'
  ? [boolean, boolean]
  : T extends 'bvec3'
  ? [boolean, boolean, boolean]
  : T extends 'bvec4'
  ? [boolean, boolean, boolean, boolean]
  : T extends 'ivec2'
  ? [number, number]
  : T extends 'ivec3'
  ? [number, number, number]
  : T extends 'ivec4'
  ? [number, number, number, number]
  : T extends 'vec2'
  ? Vec2
  : T extends 'vec3'
  ? Vec3
  : T extends 'vec4'
  ? Vec4
  : T extends 'mat2'
  ? Mat2
  : T extends 'mat3'
  ? Mat3
  : T extends 'mat4'
  ? Mat4
  : never

export type AttributeBufferReference<T extends AttributeShaderTypeName> = {
  type: T
  id: number
  getSize(): number
  bufferData(data: number[] | Float32Array): void
}

export type IndicesBufferReference = {
  id: number
  getSize(): number
  bufferData(data: number[] | Uint32Array): void
}

export type GL = {
  clear(color?: Vec4): void
  createIndicesBuffer(data?: number[] | Uint32Array): IndicesBufferReference
  createAttributeBuffer<T extends AttributeShaderTypeName>(
    type: T,
    data?: number[] | Float32Array,
  ): AttributeBufferReference<T>
  createProgram<
    TAttributes extends Record<string, AttributeShaderTypeName>,
    TUniforms extends Record<string, UniformShaderTypeName>,
    TVarying extends Record<string, VaryingShaderTypeName>
  >(options: {
    attributes: TAttributes
    uniforms: TUniforms
    varying: TVarying
    vertexShaderSource: (parameters: {
      attributes: { [name in keyof TAttributes]: string }
      uniforms: { [name in keyof TUniforms]: string }
      varying: { [name in keyof TVarying]: string }
    }) => string
    fragmentShaderSource: (parameters: {
      varying: { [name in keyof TVarying]: string }
    }) => string
  }): {
    drawTriangles(options: {
      uniforms: { [name in keyof TUniforms]: ShaderType<TUniforms[name]> }
      attributeBuffers: {
        [name in keyof TAttributes]: AttributeBufferReference<TAttributes[name]>
      }
      indicesBuffer?: IndicesBufferReference
    }): void
  }
}
