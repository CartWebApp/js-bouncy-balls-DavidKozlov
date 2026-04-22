// setup canvas

const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');

const width = canvas.width = window.innerWidth;
const height = canvas.height = window.innerHeight;

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

        // Coefficient of restitution (1 = elastic)
        let e = 1;

        // Impulse scalar
        let jImpulse = -(1 + e) * velAlongNormal / (1 / m1 + 1 / m2);

        // Apply impulse to velocities
        let impulseX = jImpulse * nx;
        let impulseY = jImpulse * ny;

        this.velX += (impulseX / m1);
        this.velY += (impulseY / m1);

        balls[j].velX -= (impulseX / m2);
        balls[j].velY -= (impulseY / m2);

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

        // --- Splitting logic ---
        const splitThresholdVel = 6;
        const minSizeToSplit = 12;

        let relativeNormalSpeed = Math.abs(velAlongNormal);
        if (relativeNormalSpeed >= splitThresholdVel) {
          // choose the larger ball to split
          let parentBall = this.size >= balls[j].size ? this : balls[j];

          if (parentBall.size > minSizeToSplit) {

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

              // push child2 as a new ball
              balls.push(child2);
            } else {
              // parent is balls[j]
              balls[idx].x = child1.x;
              balls[idx].y = child1.y;
              balls[idx].velX = child1.velX;
              balls[idx].velY = child1.velY;
              balls[idx].color = child1.color;
              balls[idx].size = child1.size;

              balls.push(child2);
            }
          }
        }
      }
    }
  }
}


while (balls.length < 25) {
  let size = random(10, 20);
  let ball = new Ball(
    random(0 + size, width - size),
    random(0 + size, height - size),
    random(-7, 7),
    random(-7, 7),
    (random(0, 1) < 0.5) ? 'red' : 'blue',
    size
  );

  balls.push(ball);
}

function loop() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
  ctx.fillRect(0, 0, width, height);

  for (let i = 0; i < balls.length; i++) {
    balls[i].draw();
    balls[i].update();
    balls[i].growth();
    balls[i].collisionDetect();
  }

  requestAnimationFrame(loop);
}

loop();