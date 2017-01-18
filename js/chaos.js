// requestAnimationFrame

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

Vector.add = function(a, b) {
    return new Vector(a.x+b.x, a.y+b.y);
};

Vector.sub = function(a, b) {
    return new Vector(a.x-b.x, a.y-b.y);
};

Vector.scale = function(v, s) {
    return v.clone().scale(s);
};

Vector.random = function() {
    return new Vector(
        Math.random()*2 - 1,
        Math.random()*2 - 1
    );
};

Vector.prototype = {
    set: function(x, y) {
        if (typeof x === "object") {
            y = x.y; // This is subtle.
            x = x.x; // y must be set first, because otherwise, the assignment of x will mean that x.y is undefined.
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

    scale: function(s) {
        this.x *= s;
        this.y *= s;
        return this;
    },

    length: function() {
        return Math.sqrt(this.x*this.x + this.y*this.y);
    },

    lengthSq: function() {
        return this.x*this.x + this.y*this.y;
    },

    normalize: function() {
        var m = Math.sqrt(this.x*this.x + this.y*this.y);
        if (m) {
            this.x /= m;
            this.y /= m;
        }
        return this;
    },

    angle: function() {
        return Math.atan2(this.y, this.x);
    },

    angleTo: function(v) {
        var dx = v.x - this.x,
            dy = v.y - this.y;
        return Math.atan2(dy, dx);
    },

    distanceTo: function(v) {
        var dx = v.x - this.x,
            dy = v.y - this.y;
        return Math.sqrt(dx*dx + dy*dy);
    },

    distanceToSq: function(v) {
        var dx = v.x - this.x,
            dy = v.y - this.y;
        return dx*dx + dy*dy;
    },

    lerp: function(v, t) { // Linear interpolation of a point between two points
        this.x += (v.x - this.x) * t;
        this.y += (v.y - this.y) * t;
        return this;
    },

    clone: function() {
        return new Vector(this.x, this.y);
    },

    toString: function() {
        return "(x:" + this.x + ", y:" + this.y + ")";
    }
};

// Node

function Node(x, y, radius, internalColor, externalColor) {
	Vector.call(this, x, y);
	this.idealRadius = radius;
	this.currentRadius = this.idealRadius * 0.5 // Start the radius off as half of what it should be
  this.deltaRadius = 0;
  this.internalColor = internalColor;
  this.externalColor = externalColor;
}

Node.prototype = (function(object) {
	var self = new Vector(0, 0), property;
	for (property in object) self[property] = object[property];
	return self;
}) ({
	isMouseOver: true, // Because the Node starts withthe mouse on top of it.
	dragging: false,
	destroyed: false,
	dragDistance: null,
	collapsing: false,
	deltaRadius: 0,

  hitTest: function(node) {
    return this.distanceTo(node) < this.currentRadius;
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

		// Render the fractal
		this.deltaRadius = (this.deltaRadius + (this.idealRadius - this.currentRadius) * 0.07) * 0.95; // Play around with these numbers, they're not necessarily ideal.

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

		// Or is it better to render here?

		this.draw(ctx);

	},

	draw: function(ctx) {
		var grd;
		ctx.save();

		// The below code will be for the outer gradient of each node.

		// grd = ctx.createRadialGradient(this.x, this.y, this.radius, this.x, this.y, 0);
		// grd.addColorStop(0, "rgba(0, 0, 0, 0.1)");
		// grd.addColorStop(1, "rgba(0, 0, 0, 0)");
		// ctx.beginPath()
		// ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
		// ctx.fillStyle = grd;
		// ctx.fill();

		grd = ctx.createRadialGradient(this.x, this.y, 0.5, this.x, this.y, this.currentRadius);
    // rgb(255, 161, 128)
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

function Particle(destinationNode, lastParticle) {
  this.particleRadius = 0.1; // Change this
//  // this.speed = new Vector(); // This might be necessary for animations later on;

  // More stuff to add configs to later:
  this.color = "rgba(230, 218, 218, 1)";;

  // this.isInitial = isInitial || false;
  this.destinationNode = destinationNode;
  this.lastParticle = lastParticle || null;

  if (this.lastParticle === null) {
    this.isInitial = true;
    this.x = Math.random() * window.innerWidth;
    this.y = Math.random() * window.innerHeight;
  }
  else {
    this.isInitial = false;
    this.update();
  }
  Vector.call(this.x, this.y);
}

Particle.prototype = (function(object) {
	var self = new Vector(0, 0), property;
	for (property in object) self[property] = object[property];
	return self;
}) ({

  // isInitial: false,

// 	addSpeed: function(d) {
// 		// this.speed.add(d);
// 		// Maybe this function will be necessary
// 	},
	update: function() {
    if (!this.isInitial) {
      this.x = (this.lastParticle.x + this.destinationNode.x) * (0.5);
      this.y = (this.lastParticle.y + this.destinationNode.y) * (0.5); // This 0.5 should be made into a config variable
    }
	},

	render: function(ctx) {
    // if (destinationNode.dragging) {
    //   this.update();
    // }
    if (!this.isInitial) {
      this.draw(ctx); // This is an ugly way of organizing these functions.
    }
	},
//
	draw: function(ctx) {
    ctx.save()

    ctx.fillStyle = ctx.strokeStyle = "#fff";
    ctx.lineCap = ctx.lineJoin = "round";
    ctx.lineWidth = this.particleRadius * 2;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x, this.y);
    ctx.stroke();

    grd = ctx.createRadialGradient(this.x, this.y, 0.5, this.x, this.y, this.particleRadius);
		grd.addColorStop(0, "rgba(230, 218, 218, 1)");
		grd.addColorStop(1, "rgba(230, 218, 218, 0)");
		ctx.beginPath();
		ctx.arc(this.x, this.y, this.currentRadius, 0, Math.PI * 2, false);
		ctx.fillStyle = grd;
		ctx.fill();

	}
});

// Fractal

function Fractal() {
  this.nodes = [];
  this.particles = [];
  this.particleNum = 50;

  this.lastParticle = null;

  // Functions:

  this.addNode = function(newNode) {
    this.nodes.push(newNode);
  };

  this.addParticles = function(num) {
    this.particleNum += num;
    this.updateParticles();
  };

  this.updateParticles = function() {
    var i, destinationNode, newParticle;
    if (this.nodes.length >= 3) {
      if (this.particles.length < 1) {
        // Make a random particle
        newParticle = new Particle(this.nodes[Math.floor(Math.random() * this.nodes.length)]);
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
    var i, node;
    for (i = 0; i < this.nodes.length; i++) {
      node = this.nodes[i];
      if (node.dragging) {
				node.drag(mouse);
			}
			node.render(context);
			if (node.destroyed) {
				fractal.nodes.splice(i, 1);
				len--;
				i--;
			}
    }
  };

  this.renderParticles = function(context) {
    var particle, i, len;
    for (i = 0, len = this.particles.length; i < len; i++) {
      particle = this.particles[i]
      particle.render(context);
    }
  };
}

// Initialize

(function() {

	// Configs
      // rgb(39, 64, 70)
	var BACKGROUND_COLOR = "rgb(0, 40, 70)",
			// PARTICLE_RADIUS = 0.05,

      // Node Configs:
			NODE_RADIUS = 5;
      // rgb(230, 218, 218)
      NODE_COLOR_INTERNAL = "rgba(221, 92, 92, 1)";
      NODE_COLOR_EXTERNAL = "rgba(221, 92, 92, 0)";
      //Particle Configs:
      // PARTICLE_RADIUS = 1;
      PARTICLE_COLOR = "rgba(230, 218, 218, 1)";


	// Vars
	var canvas, context,
			bufferCvs, bufferCtx,
			screenWidth, screenHeight,
			mouse = new Vector(),
			nodes = [],
			particles = [],
			grad,
			gui, control,
      fractal;

	// Event Listeners

	function resize(e) {
		screenWidth = canvas.width = window.innerWidth;
		screenHeight = canvas.height = window.innerHeight;
		bufferCvs.width = screenWidth;
		bufferCvs.height = screenHeight;
		context = canvas.getContext("2d");
		bufferCtx = bufferCvs.getContext("2d");

		var cx = canvas.width * 0.5,
				cy = canvas.height * 0.5;

		// Might be worth adding a background gradient here. Or not, j'sais pas.

    grad = context.createRadialGradient(cx, cy, 0, cx, cy, Math.sqrt(cx*cx + cy*cy));
    grad.addColorStop(0, "rgba(0, 0, 0, 0)");
    grad.addColorStop(1, "rgba(0, 0, 0, 0.35)");
	}

	function mouseMove(e) {
		mouse.set(e.clientX, e.clientY);

		var i, node, hit = false;
		for (i = nodes.length-1 ; i >= 0; i--) {
			node = nodes[i];
			if ((!hit && node.hitTest(mouse))|| node.dragging) {
				node.isMouseOver = hit = true;
			}
			else {
				node.isMouseOver = false;
			}

			canvas.style.cursor = hit ? "pointer" : "default";
		}
	}

	function mouseDown(e) {
		for (var i = nodes.length - 1; i >= 0; i--) {
			if (nodes[i].isMouseOver) {
				nodes[i].startDrag(mouse);
				return;
			}
		}
		fractal.addNode(new Node(e.clientX, e.clientY, NODE_RADIUS, NODE_COLOR_INTERNAL, NODE_COLOR_EXTERNAL));
  }

	function mouseUp(e) {
		for (var i = 0, len = nodes.length; i < len; i++) {
      node = nodes[i];
			if (node.dragging) {
				node.endDrag();
				break;
			}
		}
	}

	function doubleClick(e) {
		for (var i = nodes.length - 1; i >= 0; i--) {
			if (nodes[i].isMouseOver) {
				nodes[i].collapse();
				break;
			}
		}
	}

	// Init

	canvas = document.getElementById("c");
	bufferCvs = document.createElement("canvas");

	window.addEventListener("resize", resize, false);
	resize(null);

	canvas.addEventListener("mousemove", mouseMove, false);
	canvas.addEventListener("mousedown", mouseDown, false);
	canvas.addEventListener("mouseup", mouseUp, false);
	canvas.addEventListener("dblclick", doubleClick, false);

  fractal = new Fractal(nodes);

	// GUI

	gui = new dat.GUI();
  gui.add(fractal, "particleNum");
  gui.add(fractal, "updateParticles");
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
