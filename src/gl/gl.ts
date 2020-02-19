import { AttributeShaderTypeName, GL, UniformShaderTypeName } from './types'

const getSizeOfType = (type: AttributeShaderTypeName): number => {
  switch (type) {
    case 'float':
      return 1
    case 'bvec2':
      return 2
    case 'bvec3':
      return 3
    case 'bvec4':
      return 4
    case 'ivec2':
      return 2
    case 'ivec3':
      return 3
    case 'ivec4':
      return 4
    case 'vec2':
      return 2
    case 'vec3':
      return 3
    case 'vec4':
      return 4
    case 'mat2':
      return 4
    case 'mat3':
      return 9
    case 'mat4':
      return 16
  }
}

const compileShader = (
  gl: WebGLRenderingContext,
  type: GLenum,
  source: string,
): WebGLShader => {
  const shader = gl.createShader(type)

  if (!shader) {
    throw new Error('Failed to create shader')
  }

  gl.shaderSource(shader, source)
  gl.compileShader(shader)

  const shaderCompilerLog = gl.getShaderInfoLog(shader)
  if (shaderCompilerLog) {
    console.error('Error compiling shader', shaderCompilerLog)
  }

  return shader
}

const createGL = (gl: WebGLRenderingContext): GL => {
  const ext = gl.getExtension('OES_element_index_uint')
  if (!ext) {
    throw new Error('Device does not support gl.UNSIGNED_INT indices')
  }

  let nextBufferId = 1
  const buffers: { [id: number]: WebGLBuffer | undefined } = {}

  return {
    clear: (color = [0, 0, 0, 1]) => {
      gl.clearColor(...color)
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    },
    createIndicesBuffer: data => {
      const id = nextBufferId++
      const buffer = gl.createBuffer()
      let size = 0

      if (!buffer) {
        throw new Error('Failed to create buffer')
      }

      buffers[id] = buffer

      const bufferData = (data: number[] | Uint32Array) => {
        const arrayData =
          data instanceof Uint32Array ? data : new Uint32Array(data)
        size = arrayData.length

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer)
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, arrayData, gl.STATIC_DRAW)
      }

      if (data) {
        bufferData(data)
      }

      return { id, getSize: () => size, bufferData }
    },
    createAttributeBuffer: (type, data) => {
      const id = nextBufferId++
      const buffer = gl.createBuffer()
      let size = 0

      if (!buffer) {
        throw new Error('Failed to create buffer')
      }

      buffers[id] = buffer

      const bufferData = (data: number[] | Float32Array) => {
        const sizeOfType = getSizeOfType(type)
        const arrayData =
          data instanceof Float32Array ? data : new Float32Array(data)
        size = arrayData.length / sizeOfType

        if (arrayData.length % sizeOfType !== 0) {
          throw new Error(
            `Buffer data for attribute ${name} does not contain a multiple of ${sizeOfType} elements which is required for attributes of type ${type}`,
          )
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
        gl.bufferData(gl.ARRAY_BUFFER, arrayData, gl.STATIC_DRAW)
      }

      if (data) {
        bufferData(data)
      }

      return { type, id, getSize: () => size, bufferData }
    },
    createProgram: options => {
      const program = gl.createProgram()
      if (!program) {
        throw new Error('Failed to create program')
      }

      const shadersAttributeNames = Object.keys(options.attributes).reduce<
        {
          [name in keyof typeof options.attributes]: string
        }
      >(
        (acc, name: keyof typeof options.attributes) => {
          acc[name] = `a_${name}`
          return acc
        },
        { ...options.attributes },
      )

      const shadersUniformNames = Object.keys(options.uniforms).reduce<
        {
          [name in keyof typeof options.uniforms]: string
        }
      >(
        (acc, name: keyof typeof options.uniforms) => {
          acc[name] = `u_${name}`
          return acc
        },
        { ...options.uniforms },
      )

      const shadersVaryingNames = Object.keys(options.varying).reduce<
        {
          [name in keyof typeof options.varying]: string
        }
      >(
        (acc, name: keyof typeof options.varying) => {
          acc[name] = `v_${name}`
          return acc
        },
        { ...options.varying },
      )

      const shaderAttributeSource = Object.entries(options.attributes)
        .map(([name, type]) => `attribute ${type} a_${name};`)
        .join('\n')

      const shaderUniformSource = Object.entries(options.uniforms)
        .map(([name, type]) => `uniform ${type} u_${name};`)
        .join('\n')

      const shaderVaryingSource = Object.entries(options.varying)
        .map(([name, type]) => `varying ${type} v_${name};`)
        .join('\n')

      const vertexShaderSource = [
        shaderAttributeSource,
        shaderUniformSource,
        shaderVaryingSource,
        options.vertexShaderSource({
          attributes: shadersAttributeNames,
          uniforms: shadersUniformNames,
          varying: shadersVaryingNames,
        }),
      ].join('\n')

      const fragmentShaderSource = [
        'precision mediump float;',
        shaderVaryingSource,
        options.fragmentShaderSource({
          varying: shadersVaryingNames,
        }),
      ].join('\n')

      gl.attachShader(
        program,
        compileShader(gl, gl.VERTEX_SHADER, vertexShaderSource),
      )

      gl.attachShader(
        program,
        compileShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource),
      )

      gl.linkProgram(program)
      gl.useProgram(program)

      const attributeLocations = Object.keys(options.attributes).reduce<
        { [name in keyof typeof options.attributes]: number }
      >((acc, name: keyof typeof options.attributes) => {
        const location = gl.getAttribLocation(program, `a_${name}`)

        if (location < 0) {
          throw new Error(
            `Failed to get location of attribute '${name}'. Is this attribute being used by your shader?`,
          )
        }

        acc[name] = location
        return acc
      }, {} as any)

      const uniformLocations = Object.keys(options.uniforms).reduce<
        { [name in keyof typeof options.uniforms]: WebGLUniformLocation }
      >((acc, name: keyof typeof options.uniforms) => {
        const location = gl.getUniformLocation(program, `u_${name}`)

        if (!location) {
          throw new Error(
            `Failed to get location of uniform '${name}'. Is this uniform being used by your shader?`,
          )
        }

        acc[name] = location
        return acc
      }, {} as any)

      return {
        drawTriangles: ({ attributeBuffers, uniforms, indicesBuffer }) => {
          let count: number | null = null

          Object.entries(attributeBuffers).forEach(
            ([name, bufferReference]) => {
              if (count === null) {
                count = bufferReference.getSize()
              } else if (bufferReference.getSize() !== count) {
                throw new Error(`Attribute buffer size mismatch`)
              }

              const type: AttributeShaderTypeName = bufferReference.type
              const location = attributeLocations[name]
              const buffer = buffers[bufferReference.id]

              if (!buffer) {
                throw new Error('Invalid attribute buffer reference')
              }

              gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
              gl.enableVertexAttribArray(location)

              switch (type) {
                case 'float':
                  gl.vertexAttribPointer(location, 1, gl.FLOAT, false, 0, 0)
                  break
                case 'vec2':
                  gl.vertexAttribPointer(location, 2, gl.FLOAT, false, 0, 0)
                  break
                default:
                  console.error('Failed to bind attribute')
              }
            },
          )

          Object.entries(uniforms).forEach(([name, value]) => {
            const type: UniformShaderTypeName = options.uniforms[name]
            const location = uniformLocations[name]

            switch (type) {
              case 'mat2':
                gl.uniformMatrix2fv(
                  location,
                  false,
                  new Float32Array(value as any),
                )
                break
              case 'mat3':
                gl.uniformMatrix3fv(
                  location,
                  false,
                  new Float32Array(value as any),
                )
                break
              default:
                console.error('Failed to set uniform')
            }
          })

          gl.useProgram(program)

          if (count === null) {
            throw new Error('No attribute buffer data supplied')
          }

          if (indicesBuffer) {
            const buffer = buffers[indicesBuffer.id]

            if (!buffer) {
              throw new Error('Invalid indices buffer reference')
            }

            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer)
            gl.drawElements(
              gl.TRIANGLES,
              indicesBuffer.getSize(),
              gl.UNSIGNED_INT,
              0,
            )
          } else {
            gl.drawArrays(gl.TRIANGLES, 0, count)
          }
        },
      }
    },
  }
}

export { createGL }
