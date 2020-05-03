import ode45 from 'ode45-cash-karp';
import { epsilon } from 'simple-statistics';

// function dCdt = odeFun(~,C,par)
// %ODEFUN SIR model

//     % unpack parameters
//     beta  = par(1);
//     gamma = par(2);
//     N     = par(3);
//     I0    = par(4);
    
//     % set temp. vars
//     c0    = I0/N;
//     c     = C/N;

//     % setup equation
//     dCdt = N*(1 - c)*(beta*c + gamma*log((1 - c)/(1 - c0)));
    
// end
var evaluations = 0;
function getODE(beta, gamma, N, I0) {
  evaluations = 0;
  return function(dCdt, C, t) {
    evaluations++;
    const c0 = I0 / N;
    const c  = C[0] / N;
    dCdt[0] = N*(1 - c)*(beta*c + gamma*Math.log((1 - c)/(1 - c0)));
  }
}


export function fitVirusCV19() {
  var z = flambertw(0.252715078491049);

  // Initialize:
  var y0 = [1.419775332702944],
    t0 = 0,
    dt0 = 0.01,
    integrator = ode45(y0, getODE(2.808385553303577, 2.638117844413195, 1.507846494290519e+04, 1.419775332702944), t0, dt0)

  // Integrate up to tmax:
  var tmax = 71, t = [], y = []
  while (integrator.step(tmax)) {
    // Store the solution at this timestep:
    t.push(integrator.t)
    y.push(integrator.y[0])
  }
}



// --------- HELPER FUNCTIONS ---------------------------------------------------------

function flambertw(n, x) {
  // The lambert-w-function doesn't work for numbers less than e so manually replicating the fitVirusCV19 code
  if (typeof(x) === "undefined") {
    x = n;
    n = 0;
  }

  const zmax = 1e6;
  const z0 = -1 / Math.exp(1) + 10 * Number.EPSILON;  // This Epsilon matches the one in MATLAB

  const fun = (y) => y * Math.exp(y) - x;

  switch (n) {
    case -1:
      if (x < z0 || x > 0) {
        return NaN;
      } else if (x == 0) {
        return Number.POSITIVE_INFINITY;
      } else if (x < 0) {
        return fzero(fun, [-zmax, -1]);
      }
      break;
    case 0:
      if (x < z0) {
        return NaN;
      } else if (x == 0) {
        return 0;
      } else if (x < 0) {
        return fzero(fun, [-1, 0]);
      } else {
        return fzero(fun, [0, zmax]);
      }
      break;
    default:
      throw '**flamberw: invalid n';
  }
}

function fzero(fun, range) {
  return uniroot(fun, range[0], range[1] );
}

// From https://gist.github.com/borgar/3317728
/**
 * Searches the interval from <tt>lowerLimit</tt> to <tt>upperLimit</tt>
 * for a root (i.e., zero) of the function <tt>func</tt> with respect to
 * its first argument using Brent's method root-finding algorithm.
 *
 * Translated from zeroin.c in http://www.netlib.org/c/brent.shar.
 *
 * Copyright (c) 2012 Borgar Thorsteinsson <borgar@borgar.net>
 * MIT License, http://www.opensource.org/licenses/mit-license.php
 *
 * @param {function} function for which the root is sought.
 * @param {number} the lower point of the interval to be searched.
 * @param {number} the upper point of the interval to be searched.
 * @param {number} the desired accuracy (convergence tolerance).
 * @param {number} the maximum number of iterations.
 * @returns an estimate for the root within accuracy.
 *
 */
function uniroot(func, lowerLimit, upperLimit, errorTol, maxIter) {
  var a = lowerLimit
    , b = upperLimit
    , c = a
    , fa = func(a)
    , fb = func(b)
    , fc = fa
    , s = 0
    , fs = 0
    , tol_act   // Actual tolerance
    , new_step  // Step at this iteration
    , prev_step // Distance from the last but one to the last approximation
    , p         // Interpolation step is calculated in the form p/q; division is delayed until the last moment
    , q
    ;

  errorTol = errorTol || 0;
  maxIter = maxIter || 1000;

  while (maxIter-- > 0) {

    prev_step = b - a;

    if (Math.abs(fc) < Math.abs(fb)) {
      // Swap data for b to be the best approximation
      a = b;
      b = c;
      c = a;
      fa = fb;
      fb = fc;
      fc = fa;
    }

    tol_act = 1e-15 * Math.abs(b) + errorTol / 2;
    new_step = (c - b) / 2;

    if (Math.abs(new_step) <= tol_act || fb === 0) {
      return b; // Acceptable approx. is found
    }

    // Decide if the interpolation can be tried
    if (Math.abs(prev_step) >= tol_act && Math.abs(fa) > Math.abs(fb)) {
      // If prev_step was large enough and was in true direction, Interpolatiom may be tried
      var t1, cb, t2;
      cb = c - b;
      if (a === c) { // If we have only two distinct points linear interpolation can only be applied
        t1 = fb / fa;
        p = cb * t1;
        q = 1.0 - t1;
      }
      else { // Quadric inverse interpolation
        q = fa / fc; t1 = fb / fc; t2 = fb / fa;
        p = t2 * (cb * q * (q - t1) - (b - a) * (t1 - 1));
        q = (q - 1) * (t1 - 1) * (t2 - 1);
      }

      if (p > 0) {
        q = -q;  // p was calculated with the opposite sign; make p positive
      }
      else {
        p = -p;  // and assign possible minus to q
      }

      if (p < (0.75 * cb * q - Math.abs(tol_act * q) / 2) &&
        p < Math.abs(prev_step * q / 2)) {
        // If (b + p / q) falls in [b,c] and isn't too large it is accepted
        new_step = p / q;
      }

      // If p/q is too large then the bissection procedure can reduce [b,c] range to more extent
    }

    if (Math.abs(new_step) < tol_act) { // Adjust the step to be not less than tolerance
      new_step = (new_step > 0) ? tol_act : -tol_act;
    }

    a = b; fa = fb;     // Save the previous approx.
    b += new_step; fb = func(b);  // Do step to a new approxim.

    if ((fb > 0 && fc > 0) || (fb < 0 && fc < 0)) {
      c = a; fc = fa; // Adjust c for it to have a sign opposite to that of b
    }
  }
}
