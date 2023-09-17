precision highp float;

// Attributes
attribute vec3 position;
attribute vec3 normal;
attribute vec2 uv;

// Uniforms
uniform mat4 world;
uniform mat4 worldViewProjection;
uniform mat4 rotation;

// Varying
varying vec3 worldPosition;
varying vec3 _normal;

void main(void) {
	gl_Position = worldViewProjection * vec4(position, 1.0);

	worldPosition = vec3(world * vec4(position, 1.0));
	_normal = normal;
}