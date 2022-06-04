class Ball {
  /** HSLA */
  static COLORS = {
    purple2: [0, "92%", "35%", 1],
    orange: [22, "100%", "56%", 1],
    yellow: [49, "100%", "50%", 1],
    green: [131, "23%", "34%", 1],
    pink: [321, "77%", "45%", 1],
    blue: [211, "74%", "43%", 1],
    purple: [271, "100%", "39%", 1],
  }
  swapSpeed = 2

  /** @type {Vector} */
  position = new Vector(0, 0)
  /** @type {Vector} */
  destination = new Vector(0, 0)
  /** @type {Vector} */
  velocity = new Vector(10, 10)
  /** @type {Vector} */
  offset = new Vector(0, 0)
  /** @type {Vector} */
  offsetVelocity = new Vector(0, -0.5)

  radius = 10
  jumpHeight = 15
  isMoving = false
  mustJump = false

  /** @type {CanvasRenderingContext2D} */
  context

  /**
   * @param {Vector} position
   * @param {string} color
   */
  constructor(context, position, radius) {
    ;[this.context, this.position, this.radius, this.color] = [context, position, radius]
    this.color = this.getRandomColor()
  }

  getRandomColor() {
    const colors = Object.keys(Ball.COLORS)
    const color = Math.floor(Math.random() * colors.length)
    return colors[color]
  }

  /**
   * @param {boolean} value
   */
  setMustJump(value) {
    this.offset = new Vector(0, 0)
    this.mustJump = !!value
  }

  update(time) {
    // Jumping animation
    if (this.offset.y <= 0 && this.offsetVelocity.y < 0) {
      this.offsetVelocity.y = Math.abs(this.offsetVelocity.y)
    } else if (this.offset.y > this.jumpHeight && this.offsetVelocity.y > 0) {
      this.offsetVelocity.y = -Math.abs(this.offsetVelocity.y)
    }

    const move = (dir = "x") => {
      if (this.mustJump) this.offset[dir] += this.offsetVelocity[dir]

      if (
        (this.velocity[dir] > 0 && this.position[dir] < this.destination[dir]) ||
        (this.velocity[dir] < 0 && this.position[dir] > this.destination[dir])
      ) {
        this.position[dir] += this.velocity[dir]
        this.isMoving = true
      } else {
        this.position[dir] = this.destination[dir]
        this.isMoving = false
      }
    }

    move("x")
    move("y")
  }

  render() {
    const { position, radius, offset } = this

    const x = position.x - offset.x
    const y = position.y - offset.y
    const [h, s, l, a] = Ball.COLORS[this.color]

    const gradient = this.context.createRadialGradient(x, y, radius, x + radius, y - radius, 0.5)
    gradient.addColorStop(0, `hsla(${h}, ${s}, ${l}, 0.4)`)
    gradient.addColorStop(0.2, `hsla(${h}, ${s}, ${l}, ${a})`)
    gradient.addColorStop(0.8, `hsla(${h}, ${s}, 80%, 1)`)
    gradient.addColorStop(1, `hsla(${h}, ${s}, 90%, 1)`)

    this.context.save()
    this.context.strokeStyle = `hsla(${h}, ${s}, 40%, 0.6)`
    this.context.fillStyle = gradient

    /** SQUARE */
    // this.context.fillRect(x - radius, y - radius, radius * 2, radius * 2)
    this.context.beginPath()
    this.context.arc(x, y, radius, 0, Math.PI * 2)
    this.context.fill()

    this.context.lineWidth = 3
    this.context.stroke()
    this.context.restore()
  }
}
