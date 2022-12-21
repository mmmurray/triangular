import {
  AttributeShaderTypeName,
  GL,
  TextureData,
  UniformShaderTypeName,
} from './types';

const isPowerOf2 = (value: number) => (value & (value - 1)) == 0;

const getSizeOfType = (type: AttributeShaderTypeName): number => {
  switch (type) {
    case 'float':
      return 1;
    case 'bvec2':
      return 2;
    case 'bvec3':
      return 3;
    case 'bvec4':
      return 4;
    case 'ivec2':
      return 2;
    case 'ivec3':
      return 3;
    case 'ivec4':
      return 4;
    case 'vec2':
      return 2;
    case 'vec3':
      return 3;
    case 'vec4':
      return 4;
    case 'mat2':
      return 4;
    case 'mat3':
      return 9;
    case 'mat4':
      return 16;
  }
};

const compileShader = (
  gl: WebGLRenderingContext,
  type: GLenum,
  source: string,
): WebGLShader => {
  const shader = gl.createShader(type);

  if (!shader) {
    throw new Error('Failed to create shader');
  }

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  const shaderCompilerLog = gl.getShaderInfoLog(shader);
  if (shaderCompilerLog) {
    console.error('Error compiling shader', shaderCompilerLog);
  }

  return shader;
};

const setUniform = (
  gl: WebGLRenderingContext,
  location: WebGLUniformLocation,
  type: UniformShaderTypeName,
  value: any,
) => {
  switch (type) {
    case 'bool':
      gl.uniform1f(location, value ? 1 : 0);
      break;
    case 'float':
      gl.uniform1f(location, value);
      break;
    case 'vec2':
      gl.uniform2fv(location, new Float32Array(value));
      break;
    case 'vec3':
      gl.uniform3fv(location, new Float32Array(value));
      break;
    case 'vec4':
      gl.uniform4fv(location, new Float32Array(value));
      break;
    case 'mat2':
      gl.uniformMatrix2fv(location, false, new Float32Array(value));
      break;
    case 'mat3':
      gl.uniformMatrix3fv(location, false, new Float32Array(value));
      break;
    case 'mat4':
      gl.uniformMatrix4fv(location, false, new Float32Array(value));
      break;
    default:
      console.error('Failed to set uniform');
  }
};

const createGL = (canvas: HTMLCanvasElement): GL => {
  const gl = canvas.getContext('webgl', { antialias: true });
  if (!gl) {
    throw new Error('Device does not support WebGL');
  }

  const ext = gl.getExtension('OES_element_index_uint');
  if (!ext) {
    throw new Error('Device does not support gl.UNSIGNED_INT indices');
  }

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  let nextBufferId = 1;
  let nextTextureId = 0;
  const buffers: { [id: number]: WebGLBuffer | undefined } = {};
  const textures: { [id: number]: WebGLTexture | undefined } = {};

  return {
    setViewport: (x, y, width, height) => {
      gl.viewport(x, y, width, height);
    },
    clear: (color = [0, 0, 0, 1]) => {
      gl.clearColor(...color);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    },
    createIndicesBuffer: () => {
      const id = nextBufferId++;
      const buffer = gl.createBuffer();
      let size = 0;

      if (!buffer) {
        throw new Error('Failed to create buffer');
      }

      buffers[id] = buffer;

      const bufferData = (data: number[] | Uint32Array) => {
        const arrayData =
          data instanceof Uint32Array ? data : new Uint32Array(data);
        size = arrayData.length;

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, arrayData, gl.STATIC_DRAW);
      };

      return { id, getSize: () => size, bufferData };
    },
    createAttributeBuffer: (type) => {
      const id = nextBufferId++;
      const buffer = gl.createBuffer();
      let size = 0;

      if (!buffer) {
        throw new Error('Failed to create buffer');
      }

      buffers[id] = buffer;

      const bufferData = (data: number[] | Float32Array) => {
        const sizeOfType = getSizeOfType(type);
        const arrayData =
          data instanceof Float32Array ? data : new Float32Array(data);
        size = arrayData.length / sizeOfType;

        if (arrayData.length % sizeOfType !== 0) {
          throw new Error(
            `Buffer data for attribute ${name} does not contain a multiple of ${sizeOfType} elements which is required for attributes of type ${type}`,
          );
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, arrayData, gl.STATIC_DRAW);
      };

      return { type, id, getSize: () => size, bufferData };
    },
    createTextureBuffer: (type) => {
      const id = nextTextureId++;
      const texture = gl.createTexture();

      if (!texture) {
        throw new Error('Failed to create texture');
      }

      textures[id] = texture;

      const bufferData = (data: TextureData) => {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(
          gl.TEXTURE_2D,
          0,
          gl.RGBA,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          data as any,
        );

        if (isPowerOf2(data.width) && isPowerOf2(data.height)) {
          gl.generateMipmap(gl.TEXTURE_2D);
          gl.texParameteri(
            gl.TEXTURE_2D,
            gl.TEXTURE_MIN_FILTER,
            gl.LINEAR_MIPMAP_LINEAR,
          );
        } else {
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        }
      };

      return { type, id, bufferData };
    },
    createProgram: (options) => {
      const program = gl.createProgram();
      if (!program) {
        throw new Error('Failed to create program');
      }

      const shadersAttributeNames = Object.keys(options.attributes).reduce<{
        [name in keyof typeof options.attributes]: string;
      }>(
        (acc, name: keyof typeof options.attributes) => {
          acc[name] = `a_${String(name)}`;
          return acc;
        },
        { ...options.attributes },
      );

      const shadersUniformNames = Object.keys(options.uniforms).reduce<{
        [name in keyof typeof options.uniforms]: string;
      }>(
        (acc, name: keyof typeof options.uniforms) => {
          acc[name] = `u_${String(name)}`;
          return acc;
        },
        { ...options.uniforms },
      );

      const shadersFragmentUniformNames = Object.keys(
        options.fragmentUniforms,
      ).reduce<{
        [name in keyof typeof options.fragmentUniforms]: string;
      }>(
        (acc, name: keyof typeof options.fragmentUniforms) => {
          acc[name] = `u_${String(name)}`;
          return acc;
        },
        { ...options.fragmentUniforms },
      );

      const shadersVaryingNames = Object.keys(options.varying).reduce<{
        [name in keyof typeof options.varying]: string;
      }>(
        (acc, name: keyof typeof options.varying) => {
          acc[name] = `v_${String(name)}`;
          return acc;
        },
        { ...options.varying },
      );

      const shadersTextureNames = Object.keys(options.textures).reduce<{
        [name in keyof typeof options.textures]: string;
      }>(
        (acc, name: keyof typeof options.textures) => {
          acc[name] = `t_${String(name)}`;
          return acc;
        },
        { ...options.textures },
      );

      const shaderAttributeSource = Object.entries(options.attributes)
        .map(([name, type]) => `attribute ${type} a_${name};`)
        .join('\n');

      const shaderUniformSource = Object.entries(options.uniforms)
        .map(([name, type]) => `uniform ${type} u_${name};`)
        .join('\n');

      const shaderFragmentUniformSource = Object.entries(
        options.fragmentUniforms,
      )
        .filter(([name]) => name !== 'texture')
        .map(([name, type]) => `uniform ${type} u_${name};`)
        .join('\n');

      const shaderVaryingSource = Object.entries(options.varying)
        .map(([name, type]) => `varying ${type} v_${name};`)
        .join('\n');

      const shaderTextureSource = Object.entries(options.textures)
        .map(([name, type]) => `uniform ${type} t_${name};`)
        .join('\n');

      const vertexShaderSource = [
        shaderAttributeSource,
        shaderUniformSource,
        shaderVaryingSource,
        options.vertexShaderSource({
          attributes: shadersAttributeNames,
          uniforms: shadersUniformNames,
          varying: shadersVaryingNames,
        }),
      ]
        .filter(Boolean)
        .join('\n');

      const fragmentShaderSource = [
        'precision highp float;',
        shaderVaryingSource,
        shaderTextureSource,
        shaderFragmentUniformSource,
        options.fragmentShaderSource({
          varying: shadersVaryingNames,
          textures: shadersTextureNames,
          uniforms: shadersFragmentUniformNames,
        }),
      ]
        .filter(Boolean)
        .join('\n');

      gl.attachShader(
        program,
        compileShader(gl, gl.VERTEX_SHADER, vertexShaderSource),
      );

      gl.attachShader(
        program,
        compileShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource),
      );

      gl.linkProgram(program);
      gl.useProgram(program);

      const attributeLocations = Object.keys(options.attributes).reduce<{
        [name in keyof typeof options.attributes]: number;
      }>((acc, name: keyof typeof options.attributes) => {
        const location = gl.getAttribLocation(program, `a_${String(name)}`);

        if (location < 0) {
          throw new Error(
            `Failed to get location of attribute '${String(
              name,
            )}'. Is this attribute being used by your shader?`,
          );
        }

        acc[name] = location;
        return acc;
      }, {} as any);

      const uniformLocations = Object.keys(options.uniforms).reduce<{
        [name in keyof typeof options.uniforms]: WebGLUniformLocation;
      }>((acc, name: keyof typeof options.uniforms) => {
        const location = gl.getUniformLocation(program, `u_${String(name)}`);

        if (!location) {
          throw new Error(
            `Failed to get location of uniform '${String(
              name,
            )}'. Is this uniform being used by your shader?`,
          );
        }

        acc[name] = location;
        return acc;
      }, {} as any);

      const fragmentUniformLocations = Object.keys(
        options.fragmentUniforms,
      ).reduce<{
        [name in keyof typeof options.fragmentUniforms]: WebGLUniformLocation;
      }>((acc, name: keyof typeof options.fragmentUniforms) => {
        const location = gl.getUniformLocation(program, `u_${String(name)}`);

        if (!location) {
          throw new Error(
            `Failed to get location of uniform '${String(
              name,
            )}'. Is this uniform being used by your shader?`,
          );
        }

        acc[name] = location;
        return acc;
      }, {} as any);

      const textureLocations = Object.keys(options.textures).reduce<{
        [name in keyof typeof options.textures]: WebGLUniformLocation;
      }>((acc, name: keyof typeof options.textures) => {
        const location = gl.getUniformLocation(program, `t_${String(name)}`);

        if (!location) {
          throw new Error(
            `Failed to get location of texture '${String(
              name,
            )}'. Is this texture being used by your shader?`,
          );
        }

        acc[name] = location;
        return acc;
      }, {} as any);

      return {
        drawTriangles: ({
          attributeBuffers,
          uniforms,
          fragmentUniforms,
          indicesBuffer,
          textureBuffers,
          strip,
        }) => {
          gl.useProgram(program);

          let count: number | null = null;

          Object.entries(attributeBuffers).forEach(
            ([name, bufferReference]) => {
              if (count === null) {
                count = bufferReference.getSize();
              } else if (bufferReference.getSize() !== count) {
                throw new Error(`Attribute buffer size mismatch`);
              }

              const type: AttributeShaderTypeName = bufferReference.type;
              const location = attributeLocations[name];
              const buffer = buffers[bufferReference.id];

              if (!buffer) {
                throw new Error('Invalid attribute buffer reference');
              }

              gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
              gl.enableVertexAttribArray(location);

              switch (type) {
                case 'float':
                  gl.vertexAttribPointer(location, 1, gl.FLOAT, false, 0, 0);
                  break;
                case 'vec2':
                  gl.vertexAttribPointer(location, 2, gl.FLOAT, false, 0, 0);
                  break;
                default:
                  console.error('Failed to bind attribute');
              }
            },
          );

          Object.entries(uniforms).forEach(([name, value]) => {
            const type: UniformShaderTypeName = options.uniforms[name];
            const location = uniformLocations[name];
            setUniform(gl, location, type, value);
          });

          Object.entries(fragmentUniforms).forEach(([name, value]) => {
            const type: UniformShaderTypeName = options.fragmentUniforms[name];
            const location = fragmentUniformLocations[name];
            setUniform(gl, location, type, value);
          });

          Object.entries(textureBuffers).forEach(([name, textureReference]) => {
            const location = textureLocations[name];
            const texture = textures[textureReference.id];

            if (!texture) {
              throw new Error('Invalid texture reference');
            }

            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.uniform1i(location, 0);
          });

          if (count === null) {
            throw new Error('No attribute buffer data supplied');
          }

          const drawingMode = strip ? gl.TRIANGLE_STRIP : gl.TRIANGLES;

          if (indicesBuffer) {
            const buffer = buffers[indicesBuffer.id];

            if (!buffer) {
              throw new Error('Invalid indices buffer reference');
            }

            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
            gl.drawElements(
              drawingMode,
              indicesBuffer.getSize(),
              gl.UNSIGNED_INT,
              0,
            );
          } else {
            gl.drawArrays(drawingMode, 0, count);
          }
        },
      };
    },
  };
};

export { createGL };
