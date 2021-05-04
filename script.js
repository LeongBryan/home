const STAR_COUNT = ( window.innerWidth + window.innerHeight ) / 8,
      STAR_SIZE = 3,
      STAR_MIN_SCALE = 0.2,
      OVERFLOW_THRESHOLD = 50;

const canvas = document.getElementById( 'canvas1' ),
      context = canvas.getContext( '2d' );

let scale = 1, // device pixel ratio
    width,
    height;

let stars = [];

let pointerX,
    pointerY;

let velocity = { x: 0, y: 0, tx: 0, ty: 0, z: 0.0005 };

let touchInput = false;

generate();
resize();
step();

window.onresize = resize;
// canvas.onmousemove = onMouseMove;
// canvas.ontouchmove = onTouchMove;
// canvas.ontouchend = onMouseLeave;  
// document.onmouseleave = onMouseLeave;

function generate() {

   for( let i = 0; i < STAR_COUNT; i++ ) {
    stars.push({
      x: 0,
      y: 0,
      z: STAR_MIN_SCALE + Math.random() * ( 1 - STAR_MIN_SCALE )
    });
   }

}

function placeStar( star ) {

  star.x = Math.random() * width;
  star.y = Math.random() * height;

}

function recycleStar( star ) {

  let direction = 'z';

  let vx = Math.abs( velocity.x ),
	    vy = Math.abs( velocity.y );

  if( vx > 1 || vy > 1 ) {
    let axis;

    if( vx > vy ) {
      axis = Math.random() < vx / ( vx + vy ) ? 'h' : 'v';
    }
    else {
      axis = Math.random() < vy / ( vx + vy ) ? 'v' : 'h';
    }

    if( axis === 'h' ) {
      direction = velocity.x > 0 ? 'l' : 'r';
    }
    else {
      direction = velocity.y > 0 ? 't' : 'b';
    }
  }
  
  star.z = STAR_MIN_SCALE + Math.random() * ( 1 - STAR_MIN_SCALE );

  if( direction === 'z' ) {
    star.z = 0.1;
    star.x = Math.random() * width;
    star.y = Math.random() * height;
  }
  else if( direction === 'l' ) {
    star.x = -OVERFLOW_THRESHOLD;
    star.y = height * Math.random();
  }
  else if( direction === 'r' ) {
    star.x = width + OVERFLOW_THRESHOLD;
    star.y = height * Math.random();
  }
  else if( direction === 't' ) {
    star.x = width * Math.random();
    star.y = -OVERFLOW_THRESHOLD;
  }
  else if( direction === 'b' ) {
    star.x = width * Math.random();
    star.y = height + OVERFLOW_THRESHOLD;
  }

}

function resize() {

  scale = window.devicePixelRatio || 1;

  width = window.innerWidth * scale;
  height = window.innerHeight * scale;

  canvas.width = width;
  canvas.height = height;

  stars.forEach( placeStar );

}

function step() {

  context.clearRect( 0, 0, width, height );

  update();
  render();

  requestAnimationFrame( step );

}

function update() {

  velocity.tx *= 0.96;
  velocity.ty *= 0.96;

  velocity.x += ( velocity.tx - velocity.x ) * 0.8;
  velocity.y += ( velocity.ty - velocity.y ) * 0.8;

  stars.forEach( ( star ) => {

    star.x += velocity.x * star.z;
    star.y += velocity.y * star.z;

    star.x += ( star.x - width/2 ) * velocity.z * star.z;
    star.y += ( star.y - height/2 ) * velocity.z * star.z;
    star.z += velocity.z;
  
    // recycle when out of bounds
    if( star.x < -OVERFLOW_THRESHOLD || star.x > width + OVERFLOW_THRESHOLD || star.y < -OVERFLOW_THRESHOLD || star.y > height + OVERFLOW_THRESHOLD ) {
      recycleStar( star );
    }

  } );

}

function render() {

  stars.forEach( ( star ) => {

    context.beginPath();
    context.lineCap = 'round';
    context.lineWidth = STAR_SIZE * star.z * scale;
    context.strokeStyle = 'rgba(255,255,255,'+(0.5 + 0.5*Math.random())+')';

    context.beginPath();
    context.moveTo( star.x, star.y );

    var tailX = velocity.x * 2,
        tailY = velocity.y * 2;

    // stroke() wont work on an invisible line
    if( Math.abs( tailX ) < 0.1 ) tailX = 0.5;
    if( Math.abs( tailY ) < 0.1 ) tailY = 0.5;

    context.lineTo( star.x + tailX, star.y + tailY );

    context.stroke();

  } );

}

function movePointer( x, y ) {

  if( typeof pointerX === 'number' && typeof pointerY === 'number' ) {

    let ox = x - pointerX,
        oy = y - pointerY;

    velocity.tx = velocity.tx + ( ox / 7*scale ) * ( touchInput ? 1 : -1 );
    velocity.ty = velocity.ty + ( oy / 7*scale ) * ( touchInput ? 1 : -1 );

  }

  pointerX = x;
  pointerY = y;

}

function onMouseMove( event ) {

  touchInput = false;

  movePointer( event.clientX, event.clientY );

}

function onTouchMove( event ) {

  touchInput = true;

  movePointer( event.touches[0].clientX, event.touches[0].clientY, true );

  event.preventDefault();

}

function onMouseLeave() {

  pointerX = null;
  pointerY = null;

}

///////////////// Text Typing ///////////////

var i = 0;
var txt = 'Software Developer, Musician, Sociologist';
var speed = 50;

function typeWriter() {
  if (i < txt.length) {
    document.getElementById("description").innerHTML += txt.charAt(i);
    i++;
    setTimeout(typeWriter, speed);
  }
}
typeWriter()


///////////////// Button Click //////////////
var particles = [];
var alreadyRendering = false;

// originally from Rachel Smith on CodePen https://codepen.io/rachsmith/pen/oXBOwg
/* global particles */

function sparkShower(startx, starty, sparkWidth, sparkHeight) {
  var canvas = document.getElementById('canvas2');
  var ctx = canvas.getContext('2d');
  var width = canvas.width = sparkWidth;
  var height = canvas.height = sparkHeight;
//   var colors = ['#AF4A0D', '##FFD064', '#FEFFFD'];
  var colors = ['#ff96d0', '#ffffff', '#ebdde9'];
  // this is only used for simple gravity
  var gravity = 1;
  //var particles = [];
  var floor = sparkHeight;
  var currentlySparking = false;
//   var maxSize = 10; //original
  var maxSize = 3;
  // This is the acceleration of Gravity in m/s.
  var ag = 4.1;

  function initParticles() {
    currentlySparking = true;
    for (var i = 0; i < 50; i++) {
      setTimeout(function() {
        createParticle(i);
        createParticle(i * 2);
      }, i);
    }
  }

  function createParticle(i) {
    // initial position in middle of canvas
    var x = startx;
    var y = starty;
    // var z = (Math.random() * 2);
    var z = (Math.random() * 2);
    // randomize the vx and vy a little - but we still want them flying 'up' and 'out'
    // var maxex = Math.random() * 10;
    // Starting speed?
    var maxex = Math.random() * 5;
    var vx = (Math.random() * maxex) - (maxex / 2);
    var vy = (Math.random() * -20);
    // velocity size?
    var vsize = 0;
    // randomize size and opacity a little & pick a color from our color palette
    // var size = 1 + Math.random();
    var size = 0.1
    var color = colors[Math.floor(Math.random() * colors.length)];
    // var opacity = 0.5 + Math.random() * 0.5;
    var opacity = 0.3 + Math.random() * 0.3;
    var d = new Date();
    var startTime = d.getTime();
    var p = new Particle(x, y, z, vx, vy, size, vsize, color, opacity, startTime, startTime);
    p.finished = false;
    particles.push(p);
  }

  function Particle(x, y, z, vx, vy, size, vsize, color, opacity, startTime, lastTime) {

    function reset() {
      opacity = 0;
      this.finished = true;
    }

    this.update = function() {
      // if a particle has faded to nothing we can reset it to the starting position
      // SURVIVABILITY
      if (opacity - 0.0005 > 0) opacity -= 0.0008;
      else reset();
      // simple gravity
      //vy += gravity;
      var d = new Date();
      var timeNow = d.getTime();
      // Calculate gravity based on time elapsed since last update in lastTime
      // Pixels per "Meter" = 4735 = 4.7
      // Velocity of Y = Acceleration of Gravity in meters per second * number of seconds since last calc * pixels-per-meter
      if (timeNow > lastTime)
        // vy += (ag * ((timeNow - lastTime) / 1000) * 4.7);
		vy += (ag * ((timeNow - lastTime) / 1000) * 0.7);
      lastTime = timeNow;
      x += vx;
      y += vy;
      if (y > (floor + 10)) this.finished = true;
      if (size < maxSize) size += vsize * z;
      if ((opacity < 0.5) && (y < floor)) {
        vsize = 0.55 - opacity;
      } else {
        vsize = 0;
      }
      // add bouncing off the floor
      if (y > floor) {
        vy = vy * -0.4;
        vx = vx * 0.96;
      }
    };

    this.draw = function() {
      ctx.globalAlpha = opacity;
      ctx.fillStyle = color;
      //ctx.fillRect(x, y, size, size);
      ctx.beginPath();
      ctx.arc(x, y, size, 0, 2 * Math.PI);
      ctx.fill();
    };
  }

  function render() {
    alreadyRendering = true;
    ctx.clearRect(0, 0, width, height);
    for (var i = 0; i < particles.length; i++) {
      if (typeof particles[i] !== "undefined") {
        if (particles[i].finished === true) {
          particles.splice(i, 1);
        } else {
          particles[i].update();
          particles[i].draw();
        }
      }
    }
    requestAnimationFrame(render);
  }

  // resize
  window.addEventListener('resize', resize);

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }

  // init
  initParticles();
  if (!alreadyRendering)
    render();
}

function keyPress(thisKey) {

  thisKeyRect = thisKey.getBoundingClientRect();
  var initialX = thisKeyRect.left + ((thisKeyRect.right - thisKeyRect.left) / 2);
//   var initialY = thisKeyRect.bottom + (thisKeyRect.top - thisKeyRect.bottom / 2);
  var initialY = thisKeyRect.bottom
  console.log(initialX, initialY)
  var sparkCanvas = $('#canvas2');
  var sparkWidth = sparkCanvas.width();
  var sparkHeight = sparkCanvas.height();
  console.log(sparkWidth, sparkHeight)
  //var sparkHeight = $('.video-stream').position().top;
  sparkShower(initialX, initialY, sparkWidth, sparkHeight);
}

// This is what assigns the buttons
document.addEventListener('click', function(e) {
    e = e || window.event;
    var target = e.target;
	keyPress(target);
})



///// Pulses /////
function createRipple(event) {
  const key = event.currentTarget;
  const theRipple = document.createElement("span");
  const diameter = Math.max(key.clientWidth, key.clientHeight);
  const radius = diameter / 2;
  theRipple.style.width = theRipple.style.height = `${diameter}px`;
  theRipple.style.left = `${event.clientX - (key.offsetLeft + radius)}px`;
  theRipple.style.top = `${event.clientY - (key.offsetTop + radius)}px`;
  /*
  const key_width = key.clientWidth;
  const key_height = key.clientHeight;
  theRipple.style.width = `${key_width}px`;
  theRipple.style.width = `${key_height}px`;
  theRipple.style.left = `${event.clientX - (key.offsetLeft )}px`;
  theRipple.style.top = `${event.clientY - (key.offsetTop )}px`;
  */
  theRipple.classList.add("ripple"); 
  console.log('added ripple!')

  // Check for existing and remove
  const ripple = key.getElementsByClassName("ripple")[0];
  if (ripple) {
    console.log('Removing already existent ripple')
    ripple.remove();
  }

  // Inject the span into key
  key.appendChild(theRipple);
}

// This is what assigns the ripples
const allKeys = document.getElementsByClassName('key')
for (const key of allKeys) {
  key.addEventListener("click", createRipple);
}


///// Music /////
let csound = document.getElementById('csound')
let csharpsound = document.getElementById('csharpsound')
let dsound = document.getElementById('dsound')
let dsharpsound = document.getElementById('dsharpsound')
let esound = document.getElementById('esound')
let fsound = document.getElementById('fsound')
let fsharpsound = document.getElementById('fsharpsound')
let gsound = document.getElementById('gsound')
let gsharpsound = document.getElementById('gsharpsound')
let asound = document.getElementById('asound')
let asharpsound = document.getElementById('asharpsound')
let bsound = document.getElementById('bsound')
let c2sound = document.getElementById('c2sound')
let c2sharpsound = document.getElementById('c2sharpsound')

let c = document.getElementById('c')
let csharp = document.getElementById('csharp')
let d = document.getElementById('d')
let dsharp = document.getElementById('dsharp')
let e = document.getElementById('e')
let f = document.getElementById('f')
let fsharp = document.getElementById('fsharp')
let g = document.getElementById('g')
let gsharp = document.getElementById('gsharp')
let a = document.getElementById('a')
let asharp = document.getElementById('asharp')
let b = document.getElementById('b')
let c2 = document.getElementById('c2')
let c2sharp = document.getElementById('c2sharp')

c.onclick =
  function() {
    console.log('C');
    csound.play();
    return false;
    };

csharp.onclick =
  function() {
    console.log('C#');
    csharpsound.play();
    return false;
    };
d.onclick =
  function() {
    console.log('D');
    dsound.play();
    return false;
    };    
dsharp.onclick =
  function() {
    console.log('D#');
    dsharpsound.play();
    return false;
    };
e.onclick =
  function() {
    console.log('E');
    esound.play();
    return false;
    };
f.onclick =
  function() {
    console.log('F');
    fsound.play();
    return false;
    };
fsharp.onclick =
  function() {
    console.log('F#');
    fsharpsound.play();
    return false;
    };
g.onclick =
  function() {
    console.log('G');
    gsound.play();
    return false;
    };
gsharp.onclick =
  function() {
    console.log('G#');
    gsharpsound.play();
    return false;
    };
a.onclick =
  function() {
    console.log('A');
    asound.play();
    return false;
    };
asharp.onclick =
  function() {
    console.log('A#');
    asharpsound.play();
    return false;
    };
b.onclick =
  function() {
    console.log('B');
    bsound.play();
    return false;
    };
c2.onclick =
  function() {
    console.log('C2');
    c2sound.play();
    return false;
    };
c2sharp.onclick =
  function() {
    console.log('C2');
    c2sharpsound.play();
    return false;
    };

///// projects page down /////

var keys_visible = true

function toggleProjects() {
  var btn = document.getElementById("projects-btn");
  var arrowIcon = document.getElementById("arrow-icon");
  var allProjects = document.getElementById("allProjects")
  var toolTipText = document.getElementById("tooltiptext")
  const allKeys = document.getElementsByClassName('key');

  if (keys_visible == true) {
    toolTipText.innerHTML = 'Click me to play piano!' //dodgy logic
    arrowIcon.classList.remove('fa-chevron-circle-down');
    arrowIcon.classList.add('fa-chevron-circle-up');
    

    keys_visible = false

    for (const key of allKeys) {      
      key.classList.remove("keys_in");
      key.classList.remove("keys_out");
      void key.offsetTop;
      key.classList.add("keys_out");
    }
    allProjects.classList.remove("projects_out");
    allProjects.classList.remove("projects_in");
    void allProjects.offsetTop;
    allProjects.classList.add("projects_in");



  } else { 
    toolTipText.innerHTML = 'Click me for more projects!' //dodgy logic
    arrowIcon.classList.remove('fa-chevron-circle-up');
    arrowIcon.classList.add('fa-chevron-circle-down');

    keys_visible = true;

    for (const key of allKeys) {
      key.classList.remove("keys_out");
      key.classList.remove("keys_in");
      void key.offsetTop;
      key.classList.add("keys_in"); 
    }

    allProjects.classList.remove("projects_in");
    allProjects.classList.remove("projects_out");
    void allProjects.offsetTop;
    allProjects.classList.add("projects_out");


  }
  btn.className


}