attribute vec3 aPosition;
attribute vec2 aTexCoord;
attribute vec3 aNormal;
uniform mat4 uProjectionMatrix;
uniform mat4 uModelViewMatrix;
uniform mat3 uNormalMatrix;

varying vec2 vTexCoord;
varying vec3 objPos;
varying vec3 vNormal;

uniform sampler2D uSampler;
uniform bool isTexture;

void main() {
	vec4 positionVec4 = vec4(aPosition, 1.0);
	vec4 modelViewVec = uModelViewMatrix * positionVec4;
	gl_Position = uProjectionMatrix * modelViewVec;
	vTexCoord = aTexCoord;
	vTexCoord = vec2( abs ( (aPosition.y + 0.5) - aTexCoord.y ) > 0.01 ? aTexCoord.y : aTexCoord.x ,(aPosition.y + 0.5)  );
	objPos = modelViewVec.xyz;
	vNormal = normalize(uNormalMatrix * aNormal);
}
