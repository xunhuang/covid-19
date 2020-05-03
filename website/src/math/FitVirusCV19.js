import ode45 from 'ode45-cash-karp';

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
