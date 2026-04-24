// setup canvas

const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');
const countDisplay = document.getElementById('ball-count');
const colorsContainer = document.getElementById('colors-container');
const newColorInput = document.getElementById('new-color-input');
const newColorAmountInput = document.getElementById('new-color-amount');
const addColorBtn = document.getElementById('add-color-btn');
const sidebar = document.getElementById('sidebar');
const closeSidebarBtn = document.getElementById('close-sidebar-btn');
const openSidebarBtn = document.getElementById('open-sidebar-btn');

const width = canvas.width = window.innerWidth;
const height = canvas.height = window.innerHeight;

// configurations

const ballColors = ['red', 'blue'];
let maxSpeed = 100;
let MAX_BALLS = 2000;

// central config object (UI writes will modify this and then reload)
let config = {
  initialCount: 25,
  maxSpeed: 100,
  maxBalls: 2000,
  restitution: 0.9,
  splitThresholdVel: 6,
  minSizeToSplit: 12,
  initialSpeed: 7,
  speedGrowthPerSec: 0
};

// sync globals from config
function syncGlobalsFromConfig() {
  maxSpeed = Number(config.maxSpeed) || 100;
  MAX_BALLS = Number(config.maxBalls) || 2000;
}
syncGlobalsFromConfig();

// function to generate random number

function random(min, max) {
  const num = Math.floor(Math.random() * (max - min + 1)) + min;
  return num;
}

function Ball(x, y, velX, velY, color, size) {
  this.x = x;
  this.y = y;
  this.velX = velX;
  this.velY = velY;
  this.color = color;
  this.size = size;
}

Ball.prototype.draw = function () {
  ctx.beginPath();
  ctx.fillStyle = this.color;
  ctx.arc(this.x, this.y, this.size, 0, 2 * Math.PI);
  ctx.fill();
}

Ball.prototype.update = function () {
  if ((this.x + this.size) >= width) {
    this.velX = -(this.velX);
  }

  if ((this.x - this.size) <= 0) {
    this.velX = -(this.velX);
  }

  if ((this.y + this.size) >= height) {
    this.velY = -(this.velY);
  }

  if ((this.y - this.size) <= 0) {
    this.velY = -(this.velY);
  }

  this.x += this.velX;
  this.y += this.velY;
}

let balls = [];
let pendingAdds = [];

function updateCounts() {
  if (countDisplay) countDisplay.textContent = balls.length;
  // render per-color counts
  if (colorsContainer) {
    colorsContainer.innerHTML = '';
    ballColors.forEach((c) => {
      const cnt = balls.filter(b => b.color === c).length;
      const row = document.createElement('div');
      row.className = 'color-row';
      const swatch = document.createElement('span');
  swatch.className = 'color-swatch';
  swatch.style.backgroundColor = c;
      row.appendChild(swatch);
      const label = document.createElement('span');
      label.textContent = `${c}: `;
      row.appendChild(label);
      const countSpan = document.createElement('span');
      countSpan.textContent = String(cnt);

      const removeBtn = document.createElement('button');
      removeBtn.className = 'remove-color-btn';
      removeBtn.type = 'button';
      removeBtn.title = `Remove color ${c}`;
      // use trash icon for remove button (styling in CSS)
      const icon = document.createElement('img');
      icon.src = 'images/icons8-trash.svg';
      icon.alt = `Remove ${c}`;
      removeBtn.appendChild(icon);

      removeBtn.addEventListener('click', () => {
        const idx = ballColors.findIndex(x => x.toLowerCase() === c.toLowerCase());
        if (idx >= 0) {
          ballColors.splice(idx, 1);
          // remove any existing balls of that color
          for (let i = balls.length - 1; i >= 0; i--) {
            if (balls[i].color && balls[i].color.toLowerCase() === c.toLowerCase()) {
              balls.splice(i, 1);
            }
          }
          updateCounts();
        }
      });

      row.appendChild(countSpan);
      row.appendChild(removeBtn);
      colorsContainer.appendChild(row);
    });
  }
}

// handle adding new colors via the UI
if (addColorBtn) {
  addColorBtn.addEventListener('click', () => {
    // read UI config so initialSpeed/spawn behavior applies immediately
    readConfigFromUI();
    const val = (newColorInput && newColorInput.value || '').trim();
    if (!val) return;
    // read the amount to spawn (0 = don't spawn any)
    const amount = Math.max(0, parseInt(newColorAmountInput && newColorAmountInput.value) || 0);

    const exists = ballColors.some(c => c.toLowerCase() === val.toLowerCase());
    if (!exists) {
      ballColors.push(val);
    }

    // spawn requested amount of new balls of this color (respect MAX_BALLS)
    let spawned = 0;
    while (spawned < amount && balls.length < MAX_BALLS) {
      let size = random(6, 20);
      let color = val;
      // spawn using configured initial speed
      let ang = Math.random() * Math.PI * 2;
      let speed = Number(config.initialSpeed) || 7;
      let vx = Math.cos(ang) * speed + (Math.random() - 0.5) * 0.5;
      let vy = Math.sin(ang) * speed + (Math.random() - 0.5) * 0.5;
      let ball = new Ball(
        random(0 + size, width - size),
        random(0 + size, height - size),
        vx,
        vy,
        color,
        size
      );
      balls.push(ball);
      spawned++;
    }

    updateCounts();
    if (newColorInput) newColorInput.value = '';
    if (newColorAmountInput) newColorAmountInput.value = '0';
  });
}

// sidebar open/close handlers
if (closeSidebarBtn && sidebar) {
  closeSidebarBtn.addEventListener('click', () => {
    sidebar.classList.add('collapsed');
    if (openSidebarBtn) openSidebarBtn.style.display = 'flex';
  });
}
if (openSidebarBtn && sidebar) {
  openSidebarBtn.addEventListener('click', () => {
    sidebar.classList.remove('collapsed');
    openSidebarBtn.style.display = 'none';
  });
}

// config UI elements
const initialCountInput = document.getElementById('initial-count');
const maxSpeedInput = document.getElementById('max-speed');
const maxBallsInput = document.getElementById('max-balls');
const initialSpeedInput = document.getElementById('initial-speed');
const speedGrowthInput = document.getElementById('speed-growth');
const restitutionInput = document.getElementById('restitution');
const splitThresholdInput = document.getElementById('split-threshold');
const minSplitSizeInput = document.getElementById('min-split-size');
const applyConfigBtn = document.getElementById('apply-config-btn');

function readConfigFromUI() {
  if (initialCountInput) config.initialCount = Math.max(0, parseInt(initialCountInput.value) || config.initialCount);
  if (maxSpeedInput) config.maxSpeed = Math.max(1, parseFloat(maxSpeedInput.value) || config.maxSpeed);
  if (maxBallsInput) config.maxBalls = Math.max(1, parseInt(maxBallsInput.value) || config.maxBalls);
  if (initialSpeedInput) config.initialSpeed = Math.max(0, parseFloat(initialSpeedInput.value) || config.initialSpeed);
  if (speedGrowthInput) config.speedGrowthPerSec = Math.max(0, parseFloat(speedGrowthInput.value) || config.speedGrowthPerSec);
  if (restitutionInput) config.restitution = Math.min(1, Math.max(0, parseFloat(restitutionInput.value) || config.restitution));
  if (splitThresholdInput) config.splitThresholdVel = Math.max(0, parseFloat(splitThresholdInput.value) || config.splitThresholdVel);
  if (minSplitSizeInput) config.minSizeToSplit = Math.max(1, parseInt(minSplitSizeInput.value) || config.minSizeToSplit);
}

function applyConfigAndReload() {
  readConfigFromUI();
  syncGlobalsFromConfig();
  reloadSimulation();
}

if (applyConfigBtn) {
  applyConfigBtn.addEventListener('click', () => {
    applyConfigAndReload();
  });
}

// reset-colors button removed; individual color remove buttons are shown next to each color

Ball.prototype.growth = function () {
  if (this.size < 50) {
    this.size += 0.001;
  }
}

Ball.prototype.collisionDetect = function () {
  for (let j = 0; j < balls.length; j++) {
    if (!(this === balls[j])) {
      const dx = this.x - balls[j].x;
      const dy = this.y - balls[j].y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < this.size + balls[j].size) {

        // Normal
        let dist = distance || 0.0001;
        let nx = dx / dist;
        let ny = dy / dist;

        // Relative velo.
        let rvx = this.velX - balls[j].velX;
        let rvy = this.velY - balls[j].velY;

        // Velocity along the normal
        let velAlongNormal = rvx * nx + rvy * ny;

        // Do not resolve if velocities are separating
        if (velAlongNormal > 0) {
          continue;
        }

        // Use mass proportional to area (size^2)
        let m1 = this.size * this.size;
        let m2 = balls[j].size * balls[j].size;

        // Coefficient of restitution (slightly inelastic to avoid energy runaway)
        let e = Number(config.restitution) || 0.9;

        // Impulse scalar
        let jImpulse = -(1 + e) * velAlongNormal / (1 / m1 + 1 / m2);

        // Apply impulse to velocities
        let impulseX = jImpulse * nx;
        let impulseY = jImpulse * ny;

        this.velX += (impulseX / m1);
        this.velY += (impulseY / m1);

        balls[j].velX -= (impulseX / m2);
        balls[j].velY -= (impulseY / m2);

        // Clamp speeds
        function clampSpeed(ball) {
          let sp = Math.sqrt(ball.velX * ball.velX + ball.velY * ball.velY);
          if (sp > maxSpeed) {
            let s = maxSpeed / sp;
            ball.velX *= s;
            ball.velY *= s;
          }
        }
        clampSpeed(this);
        clampSpeed(balls[j]);

        // Positional correction to avoid sinking (percent slightly > 0)
        const percent = 0.8;
        const allowance = 0.01;
        let penetration = this.size + balls[j].size - dist;
        let correction = Math.max(penetration - allowance, 0) / (1 / m1 + 1 / m2) * percent;
        // move balls proportionally to inverse mass
        this.x += (correction * (1 / m1)) * nx;
        this.y += (correction * (1 / m1)) * ny;
        balls[j].x -= (correction * (1 / m2)) * nx;
        balls[j].y -= (correction * (1 / m2)) * ny;

        // --- Splitting logic (configurable) ---
        let relativeNormalSpeed = Math.abs(velAlongNormal);
        if (relativeNormalSpeed >= Number(config.splitThresholdVel || 6)) {
          // choose the larger ball to split
          let parentBall = this.size >= balls[j].size ? this : balls[j];

          if (parentBall.size > Number(config.minSizeToSplit || 12)) {

            let newSize = Math.max(6, Math.floor(parentBall.size / Math.SQRT2));


            let idx = balls.indexOf(parentBall);
            // perpendicular (tangent) vector for velocity spread
            let tx = -ny;
            let ty = nx;

            // base velocity of parent
            let baseVX = parentBall.velX;
            let baseVY = parentBall.velY;

            // create two child balls
            let child1 = new Ball(
              parentBall.x + nx * (newSize / 2),
              parentBall.y + ny * (newSize / 2),
              baseVX + tx * 2 + (Math.random() - 0.5) * 2,
              baseVY + ty * 2 + (Math.random() - 0.5) * 2,
              parentBall.color,
              newSize
            );

            let child2 = new Ball(
              parentBall.x - nx * (newSize / 2),
              parentBall.y - ny * (newSize / 2),
              baseVX - tx * 2 + (Math.random() - 0.5) * 2,
              baseVY - ty * 2 + (Math.random() - 0.5) * 2,
              parentBall.color,
              newSize
            );

            // Replace parent in-place (so any active references continue to work) and push the second child
            if (parentBall === this) {
              // mutate this to become child1
              this.x = child1.x;
              this.y = child1.y;
              this.velX = child1.velX;
              this.velY = child1.velY;
              this.color = child1.color;
              this.size = child1.size;

              // queue child2 to be added after this frame's collision processing
              pendingAdds.push(child2);
            } else {
              // parent is balls[j]
              balls[idx].x = child1.x;
              balls[idx].y = child1.y;
              balls[idx].velX = child1.velX;
              balls[idx].velY = child1.velY;
              balls[idx].color = child1.color;
              balls[idx].size = child1.size;

              // queue child2 to be added after this frame's collision processing
              pendingAdds.push(child2);
            }
          }
        }
      }
    }
  }
}


// initial seeding removed — `populateInitial()` will create initial balls based on config
// populate initial based on config
function populateInitial() {
  balls.length = 0;
  pendingAdds.length = 0;
  const initial = Number(config.initialCount) || 25;
  let attempts = 0;
  while (balls.length < initial && attempts < initial * 5) {
    attempts++;
  let size = random(10, 20);
  let color = (ballColors.length > 0) ? ballColors[Math.floor(Math.random() * ballColors.length)] : '#cccccc';
    // spawn with a random direction but magnitude based on config.initialSpeed
    let ang = Math.random() * Math.PI * 2;
    let speed = Number(config.initialSpeed) || 7;
    let vx = Math.cos(ang) * speed + (Math.random() - 0.5) * 0.5;
    let vy = Math.sin(ang) * speed + (Math.random() - 0.5) * 0.5;
    let ball = new Ball(
      random(0 + size, width - size),
      random(0 + size, height - size),
      vx,
      vy,
      color,
      size
    );
    balls.push(ball);
  }
  updateCounts();
}

populateInitial();
function reloadSimulation() {
  readConfigFromUI();
  syncGlobalsFromConfig();

  // clear current balls and queued additions
  balls.length = 0;
  pendingAdds.length = 0;

  // repopulate from config
  populateInitial();

  // refresh counts/UI
  updateCounts();
}

let lastTime = performance.now();
function loop(time) {
  const now = time || performance.now();
  const dt = Math.max(0, (now - lastTime) / 1000); // seconds since last frame
  lastTime = now;

  // apply slight speed growth if configured
  const growthPerSec = Number(config.speedGrowthPerSec) || 0;
  if (growthPerSec > 0 && balls.length) {
    for (let i = 0; i < balls.length; i++) {
      let b = balls[i];
      // increase velocity magnitude while preserving direction
      let mag = Math.sqrt(b.velX * b.velX + b.velY * b.velY);
      if (mag > 0) {
        let targetMag = mag + growthPerSec * dt;
        // clamp to maxSpeed
        if (targetMag > maxSpeed) targetMag = maxSpeed;
        let scale = targetMag / mag;
        b.velX *= scale;
        b.velY *= scale;
      }
    }
  }

  ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
  ctx.fillRect(0, 0, width, height);

  for (let i = 0; i < balls.length; i++) {
    balls[i].draw();
    balls[i].update();
    balls[i].growth();
    balls[i].collisionDetect();
  }

  // append any pending
  if (pendingAdds.length) {
    for (let k = 0; k < pendingAdds.length; k++) {
      if (balls.length < MAX_BALLS) {
        balls.push(pendingAdds[k]);
      }
    }
    pendingAdds = [];
    updateCounts();
  }

  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);