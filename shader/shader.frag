precision mediump float;

uniform vec4 uMaterialColor;
uniform vec4 uTint;
uniform sampler2D uSampler;
uniform bool isTexture;

uniform vec3 vNormal;

uniform sampler2D tGrassTexture;
uniform sampler2D tBoxTexture;
uniform sampler2D tWaterTexture;

varying vec2 vTexCoord;
varying vec3 objPos;



void main(void) {
	float zeroPos = -825.0; // z=0 is -825
	vec4 resCol;
	if(uMaterialColor.a == 0.0)
	{
		if(uMaterialColor.xyz == vec3(1.0,0.0,1.0)) resCol = texture2D(tGrassTexture, vTexCoord);
		else if(uMaterialColor.xyz == vec3(0.0,1.0,1.0)) resCol = texture2D(tBoxTexture, vTexCoord);
		else if(uMaterialColor.xyz == vec3(0.0,0.0,1.0)) resCol = texture2D(tWaterTexture, vTexCoord);
	}
	else resCol = uMaterialColor;
	float dim = objPos.z > zeroPos ? 1.0 : (objPos.z - zeroPos) / 400.0 + 0.5;
	gl_FragColor = vec4(resCol.xyz * dim, resCol.a);
//	gl_FragColor = vec4(vNormal.xyz, 1.0);
}
