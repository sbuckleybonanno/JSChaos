(function() {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for (var x = 0; x < vendors.length && !window.requestAnimationFrame; x++) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame']
                                   || window[vendors[x]+'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); },
              timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };

    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
}());

// Vector

function Vector(x, y) {
  this.x = x || 0;
  this.y = y || 0;
}
// These two are like static functions:

Vector.add = function(a, b) {
    return new Vector(a.x+b.x, a.y+b.y);
};

Vector.sub = function(a, b) {
    return new Vector(a.x-b.x, a.y-b.y);
};

Vector.prototype = {
  set: function(x, y) {
    if (typeof x === "object") {
      y = x.y;
      x = x.x;
    }
    this.x = x || 0;
    this.y = y || 0;
    return this;
  },

  add: function(v) {
    this.x += v.x;
    this.y += v.y;
    return this;
  },

  sub: function(v) {
    this.x -= v.x;
    this.y -= v.y;
    return this;
  },

  distanceTo: function(v) {
    var dx = v.x - this.x,
        dy = v.y - this.y;
    return Math.sqrt(dx*dx + dy*dy);
  },

  toString: function() {
    return "(x:" + this.x + ", y:" + this.y + "(";
  }
};

// Node

function Node(x, y) {
  Vector.call(this, x, y);
  this.idealRadius = 5;
  this.currentRadius = this.idealRadius * 0.5;
}

Node.prototype = (function(object) {
  var self = new Vector(), property;
  for (property in object) {
    self[property] = object[property];
  }
  return self;
}) ({
  // Configs
  // idealRadius: 5,
  // currentRadius: 2.5, // This is half of ideal radius
  internalColor: "rgba(221, 92, 92, 1)",
  externalColor: "rgba(221, 92, 92, 0)",

  isMouseOver: true,
  dragging: false,
  destroyed: false,
  dragDistance: null,
  collapsing: false,
  deltaRadius: 0,

  hitTest: function(position) {
    return this.distanceTo(position) < this.currentRadius;
  },

  startDrag: function(dragStart) {
    this.dragDistance = Vector.sub(dragStart, this);
    this.dragging = true;
  },

  drag: function(dragTo) {
    this.x = dragTo.x - this.dragDistance.x;
    this.y = dragTo.y - this.dragDistance.y;
  },

  endDrag: function() {
    this.dragDistance = null;
    this.dragging = false;
  },

  collapse: function(e) {
    this.currentRadius *= 1.75;
    this.collapsing = true;
  },

  render: function(ctx) {
    if (this.destroyed) {
      return;
    }

		this.deltaRadius = (this.deltaRadius + (this.idealRadius - this.currentRadius) * 0.07) * 0.95; // Play around with these numbers, they're not necessarily ideal. They determine how the node changes in size.

    this.currentRadius += this.deltaRadius;

    if (this.currentRadius < 0) {
      this.currentRadius = 0;
    }

    if (this.collapsing) {
      this.idealRadius *= 0.75;
      if (this.currentRadius < 1) {
        this.destroyed = true;
      }
    }

    this.draw(ctx);
  },

  draw: function(ctx) {
    var grd;
    ctx.save();

    // Here there could be code for the outer gradient of the nodes.
    grd = ctx.createRadialGradient(this.x, this.y, 0.5, this.x, this.y, this.currentRadius);
		grd.addColorStop(0, this.internalColor); // Light
		grd.addColorStop(1, this.externalColor); // Dark
		ctx.beginPath();
		ctx.arc(this.x, this.y, this.currentRadius, 0, Math.PI * 2, false);
		ctx.fillStyle = grd;
		ctx.fill();

		ctx.restore();
  }
});

// Particle

function Particle(lastParticle, destinationNode) {
  this.lastParticle = lastParticle;
  this.destinationNode = destinationNode;

  if (this.lastParticle === null) {
    this.isInitial = true;
    // Choose a random position:
    this.x = Math.random() * window.innerWidth;
    this.y = Math.random() * window.innerHeight;
  }
  else {
    this.isInitial = false;
    this.x = (this.lastParticle.x + this.destinationNode.x) * 0.5;
    this.y = (this.lastParticle.y + this.destinationNode.y) + 0.5;
  }
  Vector.call(this.x, this.y);
}

Particle.prototype = (function(object) {
  var self = new Vector(0, 0), property;
  for (property in object) {
    self[property] = object[property];
  }
  return self;
}) ({

  internalColor: "rgba(230, 218, 218, 1)",
  externalColor: "rgba(230, 218, 218, 0)",
  particleRadius: 0.1,
  dragging: false,



  render: function(ctx) {
    if (this.isInitial) {
      return;
    }
    if (this.destinationNode.dragging || this.lastParticle.dragging) {
      this.dragging = true;
      // Update Position:
      this.x = (this.lastParticle.x + this.destinationNode.x) * 0.5;
      this.y = (this.lastParticle.y + this.destinationNode.y) * 0.5;
    }
    this.draw(ctx);
  },

  draw: function(ctx) {
    var grd;
    ctx.save();

    ctx.fillStyle = ctx.strokeStyle = "#fff";
    ctx.lineCap = ctx.lineJoin = "round";
    ctx.lineWidth = this.particleRadius * 2;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x, this.y);
    ctx.stroke();

    grd = ctx.createRadialGradient(this.x, this.y, 0.5, this.x, this.y, this.particleRadius);
		grd.addColorStop(0, this.internalColor);
		grd.addColorStop(1, this.externalColor);
		ctx.beginPath();
		ctx.arc(this.x, this.y, this.particleRadius, 0, Math.PI * 2, false);
		ctx.fillStyle = grd;
		ctx.fill();
  }
});

// Fractal

// The following object exists primarily to ease using these functions on dat.GUI

// No prototype is used as there will only ever be one instance of this.
function Fractal() {
  this.nodes = [];
  this.particles = [];
  this.particleNum = 50;

  this.lastParticle = null;
  this.mouse = new Vector();

  // Functions:

  this.addNode = function(newNode) { // This could ideally be made more like the Vector's set method above, with the option to take 0, 1, or 2 parameters
    this.nodes.push(newNode);
  };

  this.addParticles = function() {
    var i, destinationNode, newParticle;
    if (this.nodes.length >= 3) {
      // Then let's add particles:
      if (this.particles.length < 1) {
        newParticle = new Particle(null, this.nodes[Math.floor(Math.random() * this.nodes.length)]); // Make a random particle;
        this.particles.push(newParticle);
        this.lastParticle = newParticle;
        this.particleNum--;
      }
      while (this.particleNum > 0) {
        destinationNode = this.nodes[Math.floor(Math.random() * this.nodes.length)]; // Choose a random node
        newParticle = new Particle(destinationNode, this.lastParticle);
        this.particles.push(newParticle);
        this.lastParticle = newParticle;
        this.particleNum--;
      }
    }
  };

  this.clearParticles = function() {
    this.particles = [];
  };

  this.clearEverything = function() {
    this.particles = [];
    this.nodes = [];
  };

  this.renderNodes = function(context) {
    var i, node, len;
    for (i = 0, len = this.nodes.length; i < len; i++) {
      node = this.nodes[i];
      if (node.dragging) {
        node.drag(this.mouse);
      }
      node.render(context);
      if (node.destroyed) {
        this.nodes.splice(i, 1);
        len--;
        i--;
      }
    }
  };

  this.renderParticles = function(context) {
    var particle, i, len;
    for (i = 0, len = this.particles.length; i < len; i++) {
      particle = this.particles[i];
      particle.render(context);
    }
  };
}

// Initialize:

(function() {
  // Configs

  var BACKGROUND_COLOR = "rgb(0, 40, 70)";
      BACKGROUND_GRADIENT_INTERNAL_COLOR = "rgba(0, 0, 0, 0)";
      BACKGROUND_GRADIENT_EXTERNAL_COLOR = "rgba(0, 0, 0, 0.35)";

  // Vars
  var canvas, context,
      screenWidth, screenHeight,
      grad, gui,
      fractal;

  // Event Listeners

  function resize(e) {
    screenWidth = canvas.width = window.innerWidth;
    screenHeight = canvas.height = window.innerHeight;
    context = canvas.getContext("2d");

    var cx = canvas.width * 0.5,
        cy = canvas.height * 0.5;

    // Maybe have an outer gradient here as well

    // Background Gradient
    grad = context.createRadialGradient(cx, cy, 0, cx, cy, Math.sqrt(cx*cx + cy*cy));
    grad.addColorStop(0, BACKGROUND_GRADIENT_INTERNAL_COLOR);
    grad.addColorStop(1, BACKGROUND_GRADIENT_EXTERNAL_COLOR);
  }

  function mouseMove(e) {
    fractal.mouse.set(e.clientX, e.clientY);
    var i, node, hit = false;
    for (i = fractal.nodes.length-1; i >= 0; i--) {
      node = fractal.nodes[i];
      if ((!hit && node.hitTest(fractal.mouse)) || node.dragging) {
        node.isMouseOver = hit = true;
      }
      else {
        node.isMouseOver = false;
      }

      canvas.style.cursor = hit ? "pointer" : "default";
    }
  }

  function mouseDown(e) {
    var i, node;
    for (i = fractal.nodes.length-1; i >= 0; i--) {
      node = fractal.nodes[i];
      if (node.isMouseOver) {
        node.startDrag(fractal.mouse);
        return;
      }
    }
    fractal.addNode(new Node(e.clientX, e.clientY));
  }

  function mouseUp(e) {
    var i, len, node;
    for (i = 0, len = fractal.nodes.length; i < len; i++) {
      node = fractal.nodes[i];
      if (node.dragging) {
        node.endDrag();
        break;
      }
    }
  }

  function doubleClick(e) {
    for (var i = fractal.nodes.length - 1; i >= 0; i--) {
			if (fractal.nodes[i].isMouseOver) {
				fractal.nodes[i].collapse();
				break;
			}
		}
  }

  // Init

  canvas = document.getElementById("c");

  window.addEventListener("resize", resize, false);
	resize(null);

	canvas.addEventListener("mousemove", mouseMove, false);
	canvas.addEventListener("mousedown", mouseDown, false);
	canvas.addEventListener("mouseup", mouseUp, false);
	canvas.addEventListener("dblclick", doubleClick, false);

  fractal = new Fractal();

  // GUI

  // Add a slider for the particle count
  // Make the particle count change in real time when the slider changes
  // Thus, get rid of clear particles.

  gui = new dat.GUI();
  gui.add(fractal, "particleNum");
  gui.add(fractal, "addParticles").name("Insert Particles");
  gui.add(fractal, "clearParticles");
  gui.close();

  var loop = function() {
    var i, len, n, p;
    context.save();
    context.fillStyle = BACKGROUND_COLOR;
		context.fillRect(0, 0, screenWidth, screenHeight);
		// This kind of styling needs to be done later
		context.fillStyle = grad;
		context.fillRect(0, 0, screenWidth, screenHeight);

		context.restore();

		fractal.renderNodes(context);
    fractal.renderParticles(context);

		requestAnimationFrame(loop);
  };
  loop();
})();
