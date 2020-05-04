import ode45 from 'ode45-cash-karp';
import { epsilon } from 'simple-statistics';
import integral from 'integrate-adaptive-simpson';

const C_Italy = [17, 79, 132, 229, 322, 400, 650, 888, 1128, 1689, 2036, 2502, 3089, 3858, 4636, 5883, 7375, 9172, 10149, 12462, 15113, 17660, 21157, 23980, 27980, 31506, 35713, 41035, 47021, 53578, 59138, 63927, 69176, 74386, 80539, 86498, 92472, 97689, 101739, 105792, 110574, 115242, 119827, 124632, 128948, 132547, 135586, 139422, 143626, 147577, 152271, 156363, 159516, 162488, 165155, 168941, 172434, 175925, 178972, 181228, 183957, 187327, 189973, 192994, 195351, 197675, 199414, 201505];

// function dCdt = odeFun(~,C,par)
// %ODEFUN SIR model

//     % unpack parameters
//     beta  = par[1];
//     gamma = par[2];
//     N     = par[3];
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
  var b0 = iniGuess(C_Italy);

  var b = [0.200606055230150, 0.094701268862003, 2.753548526838968e+05, 2.140638571887494e+03];
  const cm = 1.024003914085440e+05;
  var tm = calcTm(b, cm);

  const Clim = 2.281053139237023e+05;
  var tend  = calcTend(b,Clim);
  var tend5 = calcTend(b,Clim,5);

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

function calcClim(par) {
  // %CALCCLIM Calculate number of recoverd individuals after t=inf
  const beta = par[0];
  const gamma = par[1];
  const N = par[2];
  const I0 = par[3];
  return calcEndPoint(beta, gamma, I0 / N) * N;
}

function calcCm(par) {
  // %CALCCM Calculate number of cases at inflection point
  const beta = par[0];
  const gamma = par[1];
  const N = par[2];
  const I0 = par[3];
  return calcInflectionPoint(beta, gamma, I0 / N) * N;
}

// %CALCTM Calculate peak time
function calcTm(par, Cm) {
  const fun = function (c) {
    const tt = (1 - c) * (beta * c + gamma * Math.log((1 - c) / (1 - c0)));
    return 1. / tt;
  }
  const beta = par[0];
  const gamma = par[1];
  const N = par[2];
  const c0 = par[3] / N;
  return integral(fun, c0, Cm / N);
}

// function res = calcTend(par,Clim,nn)
// %CALCTM Calculate end time
function calcTend(par, Clim, nn) {
  nn = nn || 1;  // number of infected left

  const fun = function (c) {
    const tt = (1 - c) * (beta * c + gamma * Math.log((1 - c) / (1 - c0)));
    return 1. / tt;
  }
  const beta = par[0];
  const gamma = par[1];
  const N = par[2];
  const c0 = par[3] / N;
  return integral(fun, c0, (Clim - nn) / N);
}

function calcEndPoint(beta,gamma,c0) {
  // %CALCENDPOINT Calculate end density 
  return 1 + gamma/beta*flambertw(-beta*(1 - c0)*Math.exp(-beta/gamma)/gamma);
}

function calcInflectionPoint(beta,gamma,c0) {
  // %CALCINFLECTIONPOINT Calculate inflection point for density curve
  return 1 + (gamma/2/beta)*flambertw(-1, -2*beta*(1 - c0)*Math.exp(-(1 + beta/gamma))/gamma);
}

// INIGUESS Initial guess for logistic regression
// calculate initial K, r, A using data from three equidistant points 
//
// Input:
//   C -- data
//
// Output:
//   b0 -- initial guess = [K r A]' or [] if calculation fails
function iniGuess(C) {
  var b0 = [];
  const n = C.length;

  if (n <= 5) {
    return b0;
  }

  const nmax = n - 5;

  for (var i = 1; i <= nmax; i++) {
    var k1, k2, k3;
    // calculate time interval for equidistant points: k-2*m, k-m, k
    if (((n - i + 1) % 2) == 0) {
      k1 = i;
      k3 = n - 1;
    } else {
      k1 = i;
      k3 = n;
    }
    k2 = (k1 + k3) / 2;
    const m = k2 - k1 - 1;

    if (k1 < 1 || k2 < 1 || k3 < 1 || m < 1) {
      break;
    }

    if (isNaN(C[k1 - 1]) || isNaN(C[k2 - 1]) || isNaN(C[k3 - 1])) {
      continue;
    }

    // % calculate K, r, A ...

    // %.. calculate K
    const q = C[k2 - 1] ** 2 - C[k3 - 1] * C[k1 - 1];
    if (q <= 0) {
      // fprintf('***Warning: iniGuess q = %g  k1 = %d k2= %d k3 = %d \n',...
      //          q, k1, k2, k3)
      continue;
    }
    const p = C[k1 - 1] * C[k2 - 1] - 2 * C[k1 - 1] * C[k3 - 1] + C[k2 - 1] * C[k3 - 1];
    if (p <= 0) {
      // fprintf('***Warning: iniGuess p = %g\n',p)
      continue;
    }
    const K = C[k2 - 1] * p / q;

    // % ... calculate r
    const r = Math.log(C[k3 - 1] * (C[k2 - 1] - C[k1 - 1]) / C[k1 - 1] / (C[k3 - 1] - C[k2 - 1])) / m;
    if (r < 0) {
      // fprintf('***Warning: iniGuess r = %g\n',r)
      continue;
    }

    // %... calculate A
    const A = (C[k3 - 1] - C[k2 - 1]) * (C[k2 - 1] - C[k1 - 1]) / q * (C[k3 - 1] * (C[k2 - 1] - C[k1 - 1]) / C[k1 - 1] / (C[k3 - 1] - C[k2 - 1])) ** ((k3 - m) / m);
    if (A <= 0) {
      //     %   fprintf('***Warning: iniGuess A = %g\n',r)
      continue;
    }

  // % this is initial guess
    b0 = [K, r,  A];
    break;
  }
  return b0;
}

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
