precision highp float;

// Vertex
varying vec3 worldPosition;
varying vec3 _normal;

// Refs
uniform vec3 cameraPosition;
uniform samplerCube textureSampler;
uniform samplerCube cloudSampler;
uniform vec3 options;
uniform vec3 haloColor;
uniform vec3 lightPosition;

float computeFresnelTerm(vec3 viewDirection, vec3 worldNormal, float bias, float power)
{
	float fresnelTerm = pow(bias + abs(dot(viewDirection, worldNormal)), power);
	return clamp(fresnelTerm, 0., 1.);
}

void main(void) {
	vec3 worldNormal = normalize(vec3(world * vec4(normal, 0.0)));
	vec3 color = textureCube(textureSampler, _normal).rgb * options.y;
	vec3 cloud = textureCube(cloudSampler, vec3(rotation * vec4(_normal, 0.0))).rgb * options.z;

	// Light
	vec3 lightVectorW = normalize(lightPosition - worldPosition);

	// diffuse
	float ndl = max(0., dot(worldNormal, lightVectorW)) + 0.05;

	ndl = min(asin(ndl), 1.0);

	// Fresnel
	vec3 viewDirectionW = normalize(cameraPosition - worldPosition);
	float fresnelTerm = computeFresnelTerm(viewDirectionW, worldNormal, 0.65, 16.);

	// Emissive
	vec3 emissiveColor = haloColor * (1.0 - fresnelTerm) *clamp(1.0 - ndl, 0.2, 1.0);

	// Cloud
	float cloudLuminance = 0.;

	if (options.x != 0.0)
	{
		cloudLuminance = dot(cloud, vec3(0.3, 0.59, 0.11));
	}

	// Combine
	if (cloudLuminance < 0.5)
	{
		gl_FragColor = vec4(color * ndl * fresnelTerm + emissiveColor, fresnelTerm);
	}
	else
	{
		cloudLuminance = (cloudLuminance - 0.5) / 0.5;
		gl_FragColor = vec4((cloud * cloudLuminance + color) * ndl * fresnelTerm + emissiveColor, fresnelTerm);
	}
}