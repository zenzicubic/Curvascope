/**
 * This file contains complex number and hyperbolic model utilities.
 * This code is protected under the MIT license (see the LICENSE file).
 * @author Zenzicubic
 */

// Complex number class.
class Complex {
    /**
     * Creates a new complex number.
     * @param {Number} x Real part.
     * @param {Number} y Imaginary part.
     */
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    // Adds two complex numbers
    add(z) { return new Complex(this.x + z.x, this.y + z.y); }

    // Subtracts two complex numbers
    sub(z) { return new Complex(this.x - z.x, this.y - z.y); }

    // Multiplies two complex numbers
    mul(z) { return new Complex(this.x * z.x - this.y * z.y, this.x * z.y + this.y * z.x); }

    // Divides two complex numbers
    div(z) { return this.mul(z.reciprocal()); }

    // Scales a complex number by a real number
    mulRe(k) { return new Complex(this.x * k, this.y * k); }

    // Divides a complex number by a real number
    divRe(k) { return this.mulRe(1 / k); }

    // Conjugate of the current complex number
    conj() { return new Complex(this.x, -this.y); }

    // Squared norm of the current complex number
    normSq() { return this.x * this.x + this.y * this.y; }

    // Reciprocal of the current complex number
    reciprocal() { return this.conj().divRe(this.normSq()); }

    exp() { 
        // Complex exponential of current complex number
        return versor(this.y).mulRe(Math.exp(this.x));
    }

    tanh() { 
        // Complex hyperbolic tangent of the current complex number
        let exp = this.mulRe(2).exp();
        return exp.sub(CMP_ONE).div(exp.add(CMP_ONE));
    }
}

// Euler's formula e^it = cos(t) + i sin(t)
const versor = (t) => new Complex(Math.cos(t), Math.sin(t));

// Constants
const CMP_ONE = new Complex(1, 0);
const CMP_I = new Complex(0, 1);

/*
Mappings from various models of the hyperbolic plane to Poincare disk model.
*/

const gansScale = 10;
const invScale = 2.5;

const modelMaps = [
    (z) => z, // Poincare disk model (default)
    (z) => { // Upper half-plane model
        z.y ++;
        return z.sub(CMP_I).div(z.add(CMP_I));
    },
    (z) => z.divRe(1 + Math.sqrt(1 - z.normSq())), // Beltrami-Klein model
    (z) => { // Gans model
        z = z.mulRe(gansScale);
        return z.divRe(1 + Math.sqrt(1 + z.normSq()));
    },
    (z) => z.tanh(), // Band model
    (z) => z.mulRe(invScale).reciprocal() // Inverted Poincare model
];

/*
Computing the tiling parameters for a given Schlafli symbol.
*/

const generateTilingParams = (p, q) => {
    let alpha = Math.PI / p;
    let refDir = versor(alpha);

    // Compute Euclidean distance from polygon's vertices to center
    let beta = Math.PI / q;
    let cotq = 1 / Math.tan(beta);
    let tanp = refDir.y / refDir.x;
    let rSide = Math.sqrt((cotq - tanp) / (cotq + tanp));
    
    // Inversion circle center and radius
    let cenX = .5 * (rSide * rSide + 1) / (rSide * refDir.x);
    let invRadSq = cenX * cenX + (-2 * refDir.x * cenX + rSide) * rSide; 

    return {
        invCen: new Complex(cenX, 0),
        invRad: Math.sqrt(invRadSq),
        refNrm: new Complex(refDir.y, -refDir.x)
    };
}

export { Complex, generateTilingParams, modelMaps };