/**
 * This is the fragment shader, responsible for rendering the tiling.
 * This code is protected under the MIT license (see the LICENSE file).
 * Author: Zenzicubic
 */

uniform vec2 resolution;
uniform float time;
uniform float scale;

// Tiling parameters
uniform vec2 invCen;
uniform vec2 refNrm;
uniform vec2 mousePos;
uniform float invRad;

// Appearance settings
uniform vec3 tileCol;
uniform int modelIdx;
uniform bool doEdges;
uniform bool doSolidColor;
uniform bool doParity;

// Rendering settings
uniform bool doAntialias;
uniform int nIterations;

out vec4 outputCol;

#define BG_COLOR vec3(.07)
#define THICKNESS .02
#define COLOR_COEFF 3.
#define PARITY_COEFF .6

/*
Complex utility functions and transformations.
*/

#define CMP_I vec2(0., 1.)
#define CMP_ONE vec2(1., 0.)

float normSq(vec2 v) { return dot(v, v); } // Squared norm of a vector

vec2 cinv(vec2 z) {
    // Complex reciprocal
    return vec2(z.x, -z.y) / normSq(z);
}

vec2 cmul(vec2 a, vec2 b) {
    // Complex number multiplication
    return vec2(a.x * b.x - a.y * b.y, a.x * b.y + a.y * b.x);
}

vec2 cdiv(vec2 a, vec2 b) {
    // Complex number division
    return cmul(a, cinv(b)); 
}

vec2 cexp(vec2 z) { 
    // Complex sine
    return vec2(cos(z.y), sin(z.y)) * exp(z.x);
}

vec2 ctanh(vec2 z) {
    // Complex hyperbolic tangent
    z = cexp(2. * z);
    return cdiv(z - CMP_ONE, z + CMP_ONE);
}

#define PI 3.14159265358
#define GANS_SCALE 10.

vec2 remapToDisk(vec2 z) {
    // Remaps the point from the given model to the Poincare disk
    if (modelIdx == 1) {
        // Half-plane model
        z.y++;
        return cdiv(z - CMP_I, z + CMP_I);
    } else if (modelIdx == 2) {
        // Klein model
        return z / (1. + sqrt(1. - normSq(z)));
    } else if (modelIdx == 3) {
        // Gans model
        z *= GANS_SCALE;
        return z / (1. + sqrt(1. + normSq(z)));
    } else if (modelIdx == 4) {
        // Band model
        return ctanh(z);
    }
    return z;
}

vec2 shift(vec2 z, vec2 a) {
    // Transform point in unit disk
    return cdiv(z - a, vec2(1., 0.) - cmul(z, a * vec2(1., -1.)));
}

/*
The coloring function.
*/

vec3 tilingSample(vec2 pt) {
    // Remap point to screen and move it around
    vec2 z = (2. * pt - resolution) / scale;
    z = remapToDisk(z);

    if (dot(z, z) > 1.) return BG_COLOR;
    z = shift(z, mousePos);
    
    // Repeatedly invert and reflect until we are within the fundamental domain
    bool fund;
    float distSq;
    vec2 diff;
    float n = 0.;
    for (int i = 0; i < nIterations; i ++) {
        fund = true;

        // Edge
        diff = z - invCen;
        distSq = normSq(diff);
        if (distSq < invRad * invRad) {
            fund = false;
            z = invCen + (invRad * invRad * diff) / distSq;
            n ++;
        }

        // Sectional line
        if (dot(z, refNrm) < 0.) {
            fund = false;
            z -= 2. * dot(z, refNrm) * refNrm;
            n ++;
        }

        // Edge bisector
        if (z.y < 0.) {
            fund = false;
            z.y *= -1.;
            n ++;
        }
        
        if (fund) break; // We are in the fundamental domain; no need to keep going
    }
    
    // Distance to the tile edge
    float brt = 1.;
    if (doEdges) {
        brt = distance(z, invCen) - invRad;
        brt = smoothstep(0., THICKNESS, brt);
    } 

    // Show parity
    if (doParity) {
        brt = min(brt, mix(1., mod(n, 2.), PARITY_COEFF));
    }

    // Coloring
    vec3 texCol = tileCol;
    if (!doSolidColor) {
        float t = COLOR_COEFF * z.x - time;
        texCol = .5 + .5 * cos(6.283 * (t + vec3(0, .1, .2)));
    }
    return brt * texCol;
}

/*
Antialiasing and output.
*/

void main(void) {
    vec2 pt = gl_FragCoord.xy;

    // Antialiasing
    vec3 color = tilingSample(pt);
    if (doAntialias) {
        color += tilingSample(pt + vec2(.5, 0.));
        color += tilingSample(pt + vec2(-.5, 0.));
        color += tilingSample(pt + vec2(0., .5));
        color += tilingSample(pt + vec2(0., -.5));
        color += tilingSample(pt + vec2(.5));
        color += tilingSample(pt + vec2(-.5));
        color += tilingSample(pt + vec2(-.5, .5));
        color += tilingSample(pt + vec2(.5, -.5));
        color *= .11111;
    }

    outputCol = vec4(color, 1.);
}