import { Mat2, Mat3, Mat4, Vec2, Vec3, Vec4 } from "mantissa";

export type ShaderTypeName =
  | "bool"
  | "int"
  | "float"
  | "bvec2"
  | "bvec3"
  | "bvec4"
  | "ivec2"
  | "ivec3"
  | "ivec4"
  | "vec2"
  | "vec3"
  | "vec4"
  | "mat2"
  | "mat3"
  | "mat4"
  | "sampler2D";

export type AttributeShaderTypeName =
  | "float"
  | "bvec2"
  | "bvec3"
  | "bvec4"
  | "ivec2"
  | "ivec3"
  | "ivec4"
  | "vec2"
  | "vec3"
  | "vec4"
  | "mat2"
  | "mat3"
  | "mat4";

export type UniformShaderTypeName =
  | "bool"
  | "int"
  | "float"
  | "bvec2"
  | "bvec3"
  | "bvec4"
  | "ivec2"
  | "ivec3"
  | "ivec4"
  | "vec2"
  | "vec3"
  | "vec4"
  | "mat2"
  | "mat3"
  | "mat4";

export type VaryingShaderTypeName = "float" | "vec2" | "vec3" | "vec4";

export type TextureShaderTypeName = "sampler2D";

export type ShaderType<T extends ShaderTypeName> = T extends "bool"
  ? boolean
  : T extends "int"
  ? number
  : T extends "float"
  ? number
  : T extends "bvec2"
  ? [boolean, boolean]
  : T extends "bvec3"
  ? [boolean, boolean, boolean]
  : T extends "bvec4"
  ? [boolean, boolean, boolean, boolean]
  : T extends "ivec2"
  ? [number, number]
  : T extends "ivec3"
  ? [number, number, number]
  : T extends "ivec4"
  ? [number, number, number, number]
  : T extends "vec2"
  ? Vec2
  : T extends "vec3"
  ? Vec3
  : T extends "vec4"
  ? Vec4
  : T extends "mat2"
  ? Mat2
  : T extends "mat3"
  ? Mat3
  : T extends "mat4"
  ? Mat4
  : T extends "sampler2D"
  ? number
  : never;

export type TextureData = any;

export type AttributeBufferReference<T extends AttributeShaderTypeName> = {
  type: T;
  id: number;
  getSize(): number;
  bufferData(data: number[] | Float32Array): void;
};

export type IndicesBufferReference = {
  id: number;
  getSize(): number;
  bufferData(data: number[] | Uint32Array): void;
};

export type TextureBufferReference<T extends TextureShaderTypeName> = {
  type: T;
  id: number;
  bufferData(data?: TextureData): void;
};

export type GL = {
  setViewport(x: number, y: number, width: number, height: number): void;
  clear(color?: Vec4): void;
  createIndicesBuffer(): IndicesBufferReference;
  createAttributeBuffer<T extends AttributeShaderTypeName>(
    type: T
  ): AttributeBufferReference<T>;
  createTextureBuffer<T extends TextureShaderTypeName>(
    type: T
  ): TextureBufferReference<T>;
  createProgram<
    TAttributes extends Record<string, AttributeShaderTypeName>,
    TUniforms extends Record<string, UniformShaderTypeName>,
    TFragmentUniforms extends Record<string, UniformShaderTypeName>,
    TVarying extends Record<string, VaryingShaderTypeName>,
    TTextures extends Record<string, TextureShaderTypeName>
  >(options: {
    attributes: TAttributes;
    uniforms: TUniforms;
    fragmentUniforms: TFragmentUniforms;
    varying: TVarying;
    textures: TTextures;
    vertexShaderSource: (parameters: {
      attributes: { [name in keyof TAttributes]: string };
      uniforms: { [name in keyof TUniforms]: string };
      varying: { [name in keyof TVarying]: string };
    }) => string;
    fragmentShaderSource: (parameters: {
      varying: { [name in keyof TVarying]: string };
      textures: { [name in keyof TTextures]: string };
      uniforms: { [name in keyof TFragmentUniforms]: string };
    }) => string;
  }): {
    drawTriangles(options: {
      uniforms: {
        [name in keyof TUniforms]: ShaderType<TUniforms[name]>;
      };
      fragmentUniforms: {
        [name in keyof TFragmentUniforms]: ShaderType<TFragmentUniforms[name]>;
      };
      attributeBuffers: {
        [name in keyof TAttributes]: AttributeBufferReference<
          TAttributes[name]
        >;
      };
      textureBuffers: {
        [name in keyof TTextures]: TextureBufferReference<TTextures[name]>;
      };
      indicesBuffer?: IndicesBufferReference;
      strip?: boolean;
    }): void;
  };
};
