#version 300 es
precision highp float;

uniform vec2 u_PlanePos; // Our location in the virtual world displayed by the plane
uniform vec2 u_Dimensions; // Dimensions of the plane
uniform float u_Time;
uniform float u_Mode;
in vec4 fs_Pos;
in vec4 fs_Nor;
in vec4 fs_Col;
in float fs_Type;
in vec4 fs_LightVec1;
in vec4 fs_LightVec2;

out vec4 out_Col; // This is the final output color that you will see on your
                  // screen for the pixel that is currently being processed.

float random (vec2 p) {
    return fract(sin(dot(p.xy,
                         vec2(12.9898,78.233)))*
        43758.5453123);
}

float square_wave(float x, float freq, float amplitude) {
    return abs(float(int(floor(x * freq)) % 2) * amplitude);
}

float noise (vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);

    // Four corners in 2D of a tile
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));

    vec2 u = f * f * (3.0 - 2.0 * f);

    return mix(a, b, u.x) +
            (c - a)* u.y * (1.0 - u.x) +
            (d - b) * u.x * u.y;
}

float fbm (vec2 p, int octaves) {
    float v = 0.0;
    float a = 0.5;
    vec2 shift = vec2(100.0);
    // Rotate to reduce axial bias
    mat2 rot = mat2(cos(0.5), sin(0.5),
                    -sin(0.5), cos(0.50));
    for (int i = 0; i < octaves; ++i) {
        v += a * noise(p);
        p= rot * p * 2.0 + shift;
        a *= 0.5;
    }
    return v;
}

void main()
{
    float diffuseTerm1 = dot(normalize(fs_Nor), normalize(fs_LightVec1));
    float diffuseTerm2 = dot(normalize(fs_Nor), normalize(fs_LightVec2));
    // Avoid negative lighting values
    diffuseTerm1 = clamp(diffuseTerm1, 0.0, 1.0);
    diffuseTerm2 = clamp(diffuseTerm2, 0.0, 1.0);

    float ambientTerm = 0.15;

    float lightIntensity1 = diffuseTerm1 + ambientTerm;
    float lightIntensity2 = diffuseTerm2 + ambientTerm;
    if (u_Mode == 0.0) {
        out_Col = vec4(fs_Col.xyz * lightIntensity1 + fs_Col.xyz * lightIntensity2, 1.0);
    } 
    if (u_Mode == 1.0) {
        out_Col = vec4(vec3(0.15), 1.0);
    } 
    if (u_Mode == 2.0) {
        out_Col = vec4(1.0);
    }
}
