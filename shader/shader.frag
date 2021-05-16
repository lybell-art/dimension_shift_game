precision mediump float;

uniform vec4 uMaterialColor;
uniform vec4 uTint;
uniform sampler2D uSampler;
uniform bool isTexture;

varying vec2 vTexCoord;
varying vec3 objPos;

void main(void) {
	float zeroPos = -800.0; // z=0 is -800
	vec4 resCol = isTexture ? texture2D(uSampler, vTexCoord) * (uTint / vec4(255, 255, 255, 255)) : uMaterialColor;
	float dim = objPos.z > zeroPos ? 1.0 : (objPos.z - zeroPos) / 400.0 + 0.5;
	gl_FragColor = vec4(resCol.xyz * dim, resCol.a);
}
