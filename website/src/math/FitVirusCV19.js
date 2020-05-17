import ode45 from 'ode45-cash-karp';
import integral from 'integrate-adaptive-simpson';
import fmin from 'fmin';
import moment from 'moment';
import {DataSeries} from '../models/DataSeries';


const C_Italy = [17, 79, 132, 229, 322, 400, 650, 888, 1128, 1689, 2036, 2502, 3089, 3858, 4636, 5883, 7375, 9172, 10149, 12462, 15113, 17660, 21157, 23980, 27980, 31506, 35713, 41035, 47021, 53578, 59138, 63927, 69176, 74386, 80539, 86498, 92472, 97689, 101739, 105792, 110574, 115242, 119827, 124632, 128948, 132547, 135586, 139422, 143626, 147577, 152271, 156363, 159516, 162488, 165155, 168941, 172434, 175925, 178972, 181228, 183957, 187327, 189973, 192994, 195351, 197675, 199414, 201505];
const C_Cal = [2,2,2,2,2,3,3,3,6,6,6,6,6,6,6,6,7,7,8,8,8,8,8,8,8,8,10,10,10,10,10,10,11,11,12,12,21,25,35,51,59,102,116,122,165,215,259,307,396,403,582,725,850,1029,1265,1427,1667,2129,2559,3190,4061,4906,5657,6340,7412,8580,9929,11134,12529,13923,15180,16370,17647,18944,20191,21430,22454,23334,24408,25779,27132,28191,29458,30845,31563,33898,35877,37733,39584,41377,42648,43739,45237,46201,48865,50447,52233,53690,54938,56170,58720,60653,62397,63816,66594,67910,69381,71080,73176,74903,76934,76974];

// %ODEFUN SIR model
function getODE(par) {
  var beta = par[0];
  var gamma = par[1];
  var N = par[2];
  var I0 = par[3];
  return function (dCdt, C, t) {
    const c0 = I0 / N;
    const c = C[0] / N;
    dCdt[0] = N * (1 - c) * (beta * c + gamma * Math.log((1 - c) / (1 - c0)));
  }
}

export function fitVirusCV19(C, startdate) {
  // var C = C_Italy;
  var date0 = 0;
  var startdate_till_now = moment().diff( moment.unix(startdate), 'days');

  // default values
  const Nmax = 12e6;   // max. population size

  // save original data
  const date00 = date0;

  // find start
  const nmin = 5
  var n0 = 0;
  for (var n = 1; n < C.length; n++) {
    if (C[n - 1] > C[n]) {
      throw new Error('Invalid data C(n-1)>C(n)');
    }
    if (C[n] === C[n - 1]) {
      n0 = n;
      date0 = date0 + 1;
      continue;
    }
    break;
  }
  if (n0 === C.length - 1) {
    throw new Error('Constant data set');
  }
  C = C.slice(n0);
  if (C.length < nmin) {
    throw new Error('Data set to small');
  }

  // initial guess
  while (true) {
    var b0 = iniGuess(C);
    if (b0.length === 0) {
      if (C.length >= nmin) {
        date0 = date0 + 1;
        C = C.slice(1);
        continue;
      } else {
        break;
      }
    }
    break;
  }

  if (b0.length === 0) {
    return;
  }

  // ... logistic curve parameters
  const K0 = b0[0];
  var r = b0[1];
  const A = b0[2];
  const C0 = K0 / (A + 1);

  // ... initial guess
  var I0 = C0;
  var N = 2 * K0;
  var gamma = 2 * r;
  var beta = 1.5 * gamma;

  // main calculation =======================================================%

  // set infection rate and time intervals 
  const dC = diff(C).map((d) => d < 0 ? 0 : d);
  const nday = C.length;
  const tt = [...Array(nday - 1).keys()]; // 0:nday-1

  // initial estimate
  b0 = [beta, gamma, N, I0];

  // calculate parameters

  // automatic selection of weigths
  var bmax = Nmax;
  var b = [];
  var w1, w2;
  var bt, fmin, flag;
  for (var i = 1; i <= 3; i++) {
    switch (i) {
      case 1:
        w1 = 1;
        w2 = 0;
        break;
      case 2:
        w1 = 0;
        w2 = 1;
        break;
      case 3:
        w1 = 1;
        w2 = 1;
        break;
    }
    [bt, fmin, flag] = parestWrapper(C, w1, w2)(b0);
    if (bt.every((x) => x > 0) && bt[2] < bmax) {
      b = bt;
      bmax = b[2];
    }
  }

  if (b.length === 0) {
    b = bt;
  }

  // % unpack results
  beta = b[0];
  gamma = b[1];
  N = b[2];
  I0 = b[3];

  //   % postprocessing ======================================================== %

  //   %... final value
  var Clim = calcClim(b);

  //   %... value at inflection point
  var Cm = calcCm(b);

  //   % contact numer
  var R0 = beta / gamma; //*(1 - I0/N);

  //   % critical number of S
  var Sc = gamma * N / beta;

  //   %... parameters of logistic model approximation
  r = beta - gamma;
  var K = 2 * (beta - gamma) / (2 * beta - gamma) * N;
  var t2 = Math.log(2) / r;

  //   %... tangent slope in inflection point
  var k = (N - Cm) * (beta * Cm / N + gamma * Math.log((N - Cm) / (N - I0)));
  //   k = real(k);

  //   %... acceleration time
  var tau1 = Cm / k;

  //   %... deceleration time
  var tau2 = (Clim - Cm) / k;

  //   %... total duration of accelerated phase
  var tau = tau1 + tau2;

  //   %... inflection time
  var tm = calcTm(b,Cm);
  //   tm = real(tm);

  //   %... end time
  var tend  = calcTend(b,Clim);
  var tend5 = calcTend(b,Clim,5);

  //   %... datums
  //   if fdata   % new 20/04/30 MB
  //       tp0 = date00;
  //   else
  //       tp0 = max(tm - tau1 - tau + date0,date00);
  //   end
  var tp0 = Math.max(tm - tau1 - tau + date0,date00);
   var tp1 = (tm - tau1) + date0;  // begin acceleration
   var tp2 = (tm) + date0;         // turning point
   var tp3 = (tm + tau2) + date0;  // end deceleration
   var tp4 = (tm + tau2) + tau/2 + date0; // enter final phase
   var tpend = tend + date0; // end time
   var tpend5 = tend5 + date0; // end time    
  //  % tp4 = 2*tm + date0; % enter final phase

  //   %... dense forcast curve
  var dt = 1; // 0.1;  We want it one per day
  var ttm = Math.max(tm + 2*tau,startdate_till_now+1); // 20/04/02, 20/04/23
  var tspan = makeTspan(0, dt, ttm);
  var [t, Ca] = myOde45(getODE(b), tspan, [I0]);;


  return Ca;
}
// --------- HELPER FUNCTIONS ---------------------------------------------------------

function myOde45(odefun, tspan, y0) {
  const dt0 = 1e-3;
  const t0 = tspan[0];
  const integrator = ode45(y0, odefun, t0, dt0, { 'tol': 1e-6 });
  const t = [];
  const C = [];
  tspan.forEach(tmax => {
      while (integrator.step(tmax)) {}
      t.push(integrator.t)
      C.push(integrator.y[0])
    }
  );
  return [t, C];
}

function makeTspan(tmin, dt, tmax) {
  tmax = Math.floor(tmax / dt) * dt;
  const tspan = [];
  for (var t = tmin; t <= tmax; t += dt) {
    tspan.push(t);
  }
  return tspan;
}

function parestWrapper(C, w1, w2) {
  return function (b0) {
    const fun = function (par) {
      // upack parameter
      const I0 = [par[3]];

      // set time span
      const tspan = makeTspan(0, 1, C.length - 1);

      // solve ODE
      try {
        var [tsol, Csol] = myOde45(getODE(par), tspan, I0);;
        // [tsol,Csol] = ode45(@(t,y) odeFun(t,y,par), tspan, I0);
      } catch (e) {
        return NaN;
      }

      // % check if calculation time equals sample time
      if (tsol.length !== tspan.length) {
        return NaN;
      }

      // % clean data MB 20/04/23
      var Cc = [];
      var Csol_new = [];
      for (var i = 0; i < C.length; i++) {
        if (!isNaN(C[i])) {
          Cc.push(C[i]);
          Csol_new.push(Csol[i]);
        }
      }

      // % calculate optimization function
      const c1 = w1 / (w1 + w2);
      const c2 = w2 / (w1 + w2);
      var f1 = 0;
      var f2 = 0;
      if (c2 > 0) {
        f2 = norm(vec_subtraction(diff(Cc), diff(Csol)));
      }
      if (c1 > 0) {
        f1 = norm(vec_subtraction(Cc, Csol));
      }
      return c1 * f1 + c2 * f2;
    }
    // [b, fmin,flag] = fminsearch(@fun, b0, options);
    return fminsearch(fun, b0);
  }
}

function fminsearch(fun, b0) {
  const res = fmin.nelderMead(fun, b0);
  return [res.x, res.fx, 0]
}

// PAREST Parameter estimation
// function [b,fmin,flag] = parest(b0)
//     global maxnum

//     warning('on')
//     if ~isempty(maxnum)
//         options = optimset('Display','off','MaxIter',maxnum,...
//             'MaxFunEvals',maxnum);
//     else
//         options = optimset('Display','off');
//     end
//     [b, fmin,flag] = fminsearch(@fun, b0, options);
//     warning('off')
// end

// // FUN Optimization function
// function optimizationFun(par) {
//     global C %dC
//     global w1 w2

//     % upack parameter
// 	I0 = par(4);

//     % set time span
//     tspan = 0:length(C)-1;  

//     % solve ODE
//     try
//         warning('off')
//         [tsol,Csol] = ode45(@(t,y) odeFun(t,y,par), tspan, I0);
//         warning('on')
//     catch
//         f = NaN;
//         warning('on')
//         return
//     end

//     % check if calculation time equals sample time
//     if length(tsol) ~= length(tspan)
//         f = NaN;
//         return
//     end

//     % clean data MB 20/04/23
//     Cc = C;
//     Cc(isnan(C)) = [];
//     Csol(isnan(C)) = [];
//     Cc = Cc';

//     % calculate optimization function
//     c1 = w1/(w1 + w2);
//     c2 = w2/(w1 + w2);
//     f1 = 0;
//     f2 = 0;
//     if c2 > 0
//         f2 = norm((diff(Cc) - diff(Csol)));
//     end
//     if c1 > 0
//         f1 = norm((Cc - Csol));
//     end
//     f =  c1*f1  +  c2*f2;   
// }

function vec_subtraction(v1, v2) {
  if (v1.length !== v2.length) {
    return NaN;
  }
  const v = [];
  for (var i = 0; i < v1.length; i++) {
    v.push(v1[i] - v2[i]);
  }
  return v;
}

function diff(C) {
  var dC = [];
  for (var i = 1; i < C.length; i++) {
    dC.push(C[i] - C[i - 1]);
  }
  return dC;
}

function norm(C) {
  var sum = 0;
  for (var i = 0; i < C.length; i++) {
    sum += C[i] * C[i];
  }
  return Math.sqrt(sum);
}

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

function calcEndPoint(beta, gamma, c0) {
  // %CALCENDPOINT Calculate end density 
  return 1 + gamma / beta * flambertw(-beta * (1 - c0) * Math.exp(-beta / gamma) / gamma);
}

function calcInflectionPoint(beta, gamma, c0) {
  // %CALCINFLECTIONPOINT Calculate inflection point for density curve
  return 1 + (gamma / 2 / beta) * flambertw(-1, -2 * beta * (1 - c0) * Math.exp(-(1 + beta / gamma)) / gamma);
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
    if (((n - i + 1) % 2) === 0) {
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
    b0 = [K, r, A];
    break;
  }
  return b0;
}

function flambertw(n, x) {
  // The lambert-w-function doesn't work for numbers less than e so manually replicating the fitVirusCV19 code
  if (typeof (x) === "undefined") {
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
      } else if (x === 0) {
        return Number.POSITIVE_INFINITY;
      } else if (x < 0) {
        return fzero(fun, [-zmax, -1]);
      }
      break;
    case 0:
      if (x < z0) {
        return NaN;
      } else if (x === 0) {
        return 0;
      } else if (x < 0) {
        return fzero(fun, [-1, 0]);
      } else {
        return fzero(fun, [0, zmax]);
      }
    default:
      throw new Error('**flamberw: invalid n');
  }
}

function fzero(fun, range) {
  return uniroot(fun, range[0], range[1]);
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
