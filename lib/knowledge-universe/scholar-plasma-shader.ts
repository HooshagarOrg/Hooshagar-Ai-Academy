/**
 * WebGL plasma field — Scholar Blue palette (adapted from ShaderBackground)
 */

export type PlasmaVariant = 'landing' | 'auth' | 'luxury' | 'luxury-calm'

const VARIANT_CONFIG: Record<
  PlasmaVariant,
  { speed: string; lineIntensity: string; lineColor: string; bg1: string; bg2: string }
> = {
  landing: {
    speed: '0.2',
    lineIntensity: '1.18',
    lineColor: 'vec4(0.23, 0.51, 0.96, 1.0)',
    bg1: 'vec4(0.02, 0.027, 0.051, 1.0)',
    bg2: 'vec4(0.09, 0.11, 0.29, 1.0)',
  },
  auth: {
    speed: '0.12',
    lineIntensity: '0.72',
    lineColor: 'vec4(0.23, 0.51, 0.96, 1.0)',
    bg1: 'vec4(0.02, 0.027, 0.051, 1.0)',
    bg2: 'vec4(0.09, 0.11, 0.29, 1.0)',
  },
  luxury: {
    speed: '0.14',
    lineIntensity: '0.92',
    lineColor: 'vec4(0.83, 0.69, 0.22, 1.0)',
    bg1: 'vec4(0.02, 0.008, 0.035, 1.0)',
    bg2: 'vec4(0.06, 0.03, 0.09, 1.0)',
  },
  'luxury-calm': {
    speed: '0.08',
    lineIntensity: '0.48',
    lineColor: 'vec4(0.72, 0.58, 0.18, 1.0)',
    bg1: 'vec4(0.015, 0.008, 0.03, 1.0)',
    bg2: 'vec4(0.05, 0.025, 0.08, 1.0)',
  },
}

const VS_SOURCE = `
  attribute vec4 aVertexPosition;
  void main() {
    gl_Position = aVertexPosition;
  }
`

function buildFragmentSource(variant: PlasmaVariant): string {
  const cfg = VARIANT_CONFIG[variant]

  return `
    precision highp float;
    uniform vec2 iResolution;
    uniform float iTime;

    const float overallSpeed = ${cfg.speed};
    const float gridSmoothWidth = 0.015;
    const float axisWidth = 0.05;
    const float majorLineWidth = 0.025;
    const float minorLineWidth = 0.0125;
    const float majorLineFrequency = 5.0;
    const float minorLineFrequency = 1.0;
    const float scale = 5.0;
    const vec4 lineColor = ${cfg.lineColor};
    const float minLineWidth = 0.01;
    const float maxLineWidth = 0.2;
    const float lineSpeed = 1.0 * overallSpeed;
    const float lineAmplitude = 1.0;
    const float lineFrequency = 0.2;
    const float warpSpeed = 0.2 * overallSpeed;
    const float warpFrequency = 0.5;
    const float warpAmplitude = 1.0;
    const float offsetFrequency = 0.5;
    const float offsetSpeed = 1.33 * overallSpeed;
    const float minOffsetSpread = 0.6;
    const float maxOffsetSpread = 2.0;
    const int linesPerGroup = 16;
    const float lineIntensity = ${cfg.lineIntensity};

    #define drawCircle(pos, radius, coord) smoothstep(radius + gridSmoothWidth, radius, length(coord - (pos)))
    #define drawSmoothLine(pos, halfWidth, t) smoothstep(halfWidth, 0.0, abs(pos - (t)))
    #define drawCrispLine(pos, halfWidth, t) smoothstep(halfWidth + gridSmoothWidth, halfWidth, abs(pos - (t)))

    float random(float t) {
      return (cos(t) + cos(t * 1.3 + 1.3) + cos(t * 1.4 + 1.4)) / 3.0;
    }

    float getPlasmaY(float x, float horizontalFade, float offset) {
      return random(x * lineFrequency + iTime * lineSpeed) * horizontalFade * lineAmplitude + offset;
    }

    void main() {
      vec2 fragCoord = gl_FragCoord.xy;
      vec2 uv = fragCoord.xy / iResolution.xy;
      vec2 space = (fragCoord - iResolution.xy / 2.0) / iResolution.x * 2.0 * scale;

      float horizontalFade = 1.0 - (cos(uv.x * 6.28) * 0.5 + 0.5);
      float verticalFade = 1.0 - (cos(uv.y * 6.28) * 0.5 + 0.5);

      space.y += random(space.x * warpFrequency + iTime * warpSpeed) * warpAmplitude * (0.5 + horizontalFade);
      space.x += random(space.y * warpFrequency + iTime * warpSpeed + 2.0) * warpAmplitude * horizontalFade;

      vec4 lines = vec4(0.0);
      vec4 bgColor1 = ${cfg.bg1};
      vec4 bgColor2 = ${cfg.bg2};

      for (int l = 0; l < linesPerGroup; l++) {
        float normalizedLineIndex = float(l) / float(linesPerGroup);
        float offsetTime = iTime * offsetSpeed;
        float offsetPosition = float(l) + space.x * offsetFrequency;
        float rand = random(offsetPosition + offsetTime) * 0.5 + 0.5;
        float halfWidth = mix(minLineWidth, maxLineWidth, rand * horizontalFade) / 2.0;
        float offset = random(offsetPosition + offsetTime * (1.0 + normalizedLineIndex)) * mix(minOffsetSpread, maxOffsetSpread, horizontalFade);
        float linePosition = getPlasmaY(space.x, horizontalFade, offset);
        float line = drawSmoothLine(linePosition, halfWidth, space.y) / 2.0 + drawCrispLine(linePosition, halfWidth * 0.15, space.y);

        float circleX = mod(float(l) + iTime * lineSpeed, 25.0) - 12.0;
        vec2 circlePosition = vec2(circleX, getPlasmaY(circleX, horizontalFade, offset));
        float circle = drawCircle(circlePosition, 0.01, space) * 4.0;

        line = line + circle;
        lines += line * lineColor * rand;
      }

      vec4 fragColor = mix(bgColor1, bgColor2, uv.x);
      fragColor *= verticalFade;
      fragColor.a = 1.0;
      fragColor += lines * lineIntensity;

      gl_FragColor = fragColor;
    }
  `
}

function loadShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)
  if (!shader) return null
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('Shader compile error:', gl.getShaderInfoLog(shader))
    gl.deleteShader(shader)
    return null
  }
  return shader
}

export function createPlasmaProgram(gl: WebGLRenderingContext, variant: PlasmaVariant) {
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, VS_SOURCE)
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, buildFragmentSource(variant))
  if (!vertexShader || !fragmentShader) return null

  const program = gl.createProgram()
  if (!program) return null

  gl.attachShader(program, vertexShader)
  gl.attachShader(program, fragmentShader)
  gl.linkProgram(program)

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Shader program link error:', gl.getProgramInfoLog(program))
    return null
  }

  return {
    program,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(program, 'aVertexPosition'),
    },
    uniformLocations: {
      resolution: gl.getUniformLocation(program, 'iResolution'),
      time: gl.getUniformLocation(program, 'iTime'),
    },
  }
}

export const PLASMA_QUAD = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1])
