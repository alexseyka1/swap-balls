class ListItem {
  constructor(point, next) {
    this.point = point
    this.next = next
  }
}

class App {
  static MIN_BALLS_FOR_DESTROY = 5
  static ROLL_SPEED = 10

  /** @type {BallTransition} */
  ballTransition

  ADD_BALLS_COUNT = 3
  points = 0
  timestamp = 0
  /** @type {Ball} */
  player = null
  ballsDestroyed = false
  /** @type {CanvasRenderingContext2D} */
  context

  /**
   * @type {Map<string, Ball>}
   */
  balls = new Map()

  constructor(canvas, cols) {
    this.canvas = canvas
    this.cols = cols >= App.MIN_BALLS_FOR_DESTROY ? cols : App.MIN_BALLS_FOR_DESTROY
    this.context = this.canvas.getContext("2d")
    this.ballTransition = new BallTransition(this.canvas)

    const [width, height] = [this.canvas.clientWidth, this.canvas.clientHeight]
    ;[this.cellWidth, this.cellHeight] = [width / this.cols, height / this.cols]
    ;[this.canvas.width, this.canvas.height] = [width, height]

    this.wooshAudio = new Audio("./sounds/woosh.wav")
    this.wooshAudio.volume = 0.5
    this.clickAudio = new Audio("./sounds/click.wav")

    this.init()
    this.startNewGame()
    this.update()
  }

  startNewGame() {
    this.points = 0
    this.timestamp = 0
    this.player = null
    this.balls = new Map()
    this.activePath = []
    this.activePathTo = new Vector()

    this.initBalls()
    this.update()
  }

  degreesToRadians(degrees) {
    return (Math.PI / 180) * degrees
  }

  renderGrid() {
    this.context.save()
    this.context.strokeStyle = "rgba(255, 255, 255, 0.2)"
    this.context.fillStyle = "rgba(255, 255, 255, 0.1)"
    this.context.lineWidth = 3

    for (let x = 1; x < this.cols; x++) {
      this.context.beginPath()
      this.context.moveTo(x * this.cellWidth, 0)
      this.context.lineTo(x * this.cellWidth, this.cols * this.cellHeight)
      this.context.stroke()
    }
    for (let y = 1; y < this.cols; y++) {
      this.context.beginPath()
      this.context.moveTo(0, y * this.cellHeight)
      this.context.lineTo(this.cols * this.cellWidth, y * this.cellHeight)
      this.context.stroke()
    }

    this.context.restore()
  }

  update(timestamp = 0) {
    this.timestamp = timestamp

    this.context.clearRect(0, 0, this.canvas.clientWidth, this.canvas.clientHeight)
    this.renderGrid()

    for (let ball of this.balls.values()) {
      ball.update(timestamp)
      ball.render()
    }

    requestAnimationFrame((time) => this.update(time))
  }

  renderPoints() {
    const minus = this.points < 0
    const pointsBlock = this.canvas.parentNode.querySelector(".top-panel__points")
    pointsBlock.innerText = (minus ? "-" : "") + Math.abs(this.points).toFixed(0).padStart(10, "0")
  }

  /**
   * @param {number} add
   */
  addPoints(add) {
    this.points = Math.round(this.points + Number(add))
    this.renderPoints()
  }

  /**
   * @returns {Vector}
   */
  getCursorPosition(event) {
    const rect = this.canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    return new Vector(Math.floor(x / this.cellWidth), Math.floor(y / this.cellHeight))
  }

  randomInt(from, to) {
    return Math.floor(Math.random() * to) + from
  }

  init() {
    const resetPlayer = () => {
      this.player.setMustJump(false)
      this.player = null
    }

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") resetPlayer()
    })
    document.body.addEventListener("click", (e) => resetPlayer())
    document.addEventListener("ontouchstart", (e) => e.preventDefault())

    this.canvas.addEventListener("click", (e) => e.stopPropagation())
    this.canvas.addEventListener("mousedown", async (e) => {
      const target = this.getCursorPosition(e)

      const selectedBall = this.balls.get(target.toString())
      if (!this.player) {
        this.player = selectedBall
        this.player.setMustJump(true)
      } else if (this.getCellCoords(this.player.position).isEqual(target)) {
        /** If user clicked on player ball */
        resetPlayer()
      } else {
        /** If user selected any other ball */
        const playerCellCoords = this.getCellCoords(this.player.position),
          selectedBallCoords = this.getCellCoords(selectedBall.position)

        if (
          Math.abs(playerCellCoords.x - selectedBallCoords.x) <= 1 &&
          Math.abs(playerCellCoords.y - selectedBallCoords.y) <= 1
        ) {
          this.swapBalls(this.player, selectedBall)
          this.ballsDestroyed = false

          let destroyedPlayerX, destroyedPlayerY, destroyedSelectedX, destroyedSelectedY
          destroyedPlayerX = this.checkBallsRow(this.player, "x")
          if (!destroyedPlayerX) destroyedPlayerY = this.checkBallsRow(this.player, "y")

          if (
            !destroyedPlayerX ||
            this.getCellCoords(this.player.destination).y !== this.getCellCoords(selectedBall.destination).y
          ) {
            destroyedSelectedX = this.checkBallsRow(selectedBall, "x")
          }

          if (
            (!destroyedPlayerY ||
              this.getCellCoords(this.player.destination).x !== this.getCellCoords(selectedBall.destination).x) &&
            !destroyedSelectedX
          ) {
            destroyedSelectedY = this.checkBallsRow(selectedBall, "y")
          }

          if (!this.ballsDestroyed) {
            this.addPoints(-1)
          }
          resetPlayer()
        } else {
          /** Select new player */
          resetPlayer()
          this.player = selectedBall
          this.player.setMustJump(true)
        }
      }
    })
  }

  /**
   * @param {Ball} first
   * @param {Ball} second
   */
  swapBalls(first, second) {
    first.setMustJump(false)

    const firstPosition = first.position.clone(),
      secondPosition = second.position.clone()

    if (first.position.x < second.position.x) {
      ;[first.velocity.x, second.velocity.x] = [first.swapSpeed, -second.swapSpeed]
    } else {
      ;[first.velocity.x, second.velocity.x] = [-first.swapSpeed, second.swapSpeed]
    }

    if (first.position.y < second.position.y) {
      ;[first.velocity.y, second.velocity.y] = [first.swapSpeed, -second.swapSpeed]
    } else {
      ;[first.velocity.y, second.velocity.y] = [-first.swapSpeed1, second.swapSpeed]
    }

    first.destination = second.position.clone()
    second.destination = first.position.clone()

    this.balls.set(this.getCellCoords(firstPosition).toString(), second)
    this.balls.set(this.getCellCoords(secondPosition).toString(), first)
    this.wooshAudio.play()
  }

  /**
   * @param {Vector} point
   */
  getCellCoords(point) {
    return new Vector(Math.floor(point.x / this.cellWidth), Math.floor(point.y / this.cellHeight))
  }

  initBalls() {
    const direction = this.randomInt(1, 4)

    for (let x = 0; x < this.cols; x++) {
      for (let y = 0; y < this.cols; y++) {
        this.createNewBall(x, y, direction)
      }
    }
  }

  /**
   * @param {number} x
   * @param {number} y
   * @param {string} rollDirection
   */
  createNewBall(x, y, rollDirection) {
    const radius = this.cellWidth / 2.3
    const ballX = x * this.cellWidth + this.cellWidth / 2
    const ballY = y * this.cellHeight + this.cellWidth / 2

    const initPosition = new Vector(ballX, ballY)
    const destination = new Vector(ballX, ballY)

    const ball = new Ball(this.context, initPosition, radius)
    ball.destination = destination
    ball.velocity.y = ball.velocity.y + y / 10

    this.ballTransition.run(rollDirection, ball, App.ROLL_SPEED)

    this.balls.set(this.getCellCoords(ball.destination).toString(), ball)

    return ball
  }

  /**
   * @param {Ball[]} balls
   */
  destroyBallsRow(balls) {
    this.ballsDestroyed = true
    const newBallsOnCoords = []

    let rowDirection = "horizontal"
    if (balls[0].destination.x === balls[balls.length - 1].destination.x) rowDirection = "vertical"

    for (let ball of balls) {
      const coords = this.getCellCoords(ball.destination)
      if (this.balls.has(coords.toString())) {
        this.balls.delete(coords.toString())
        newBallsOnCoords.push(coords)
        this.addPoints(1)
      }
    }

    /** @todo REFACTOR THE CODE BELOW! */
    /** Move existing balls and create new */
    if (rowDirection === "vertical") {
      const x = this.getCellCoords(new Vector(balls[0].destination.x, 0)).x
      let maxY = newBallsOnCoords.reduce((max, current) => (current.y > max ? current.y : max), 0)
      const direction = BallTransition.FROM_TOP

      /** Drop down existing balls */
      for (let y = maxY; y >= 0; y--) {
        const currentBall = this.balls.get(new Vector(x, y).toString())
        if (!currentBall) continue

        this.balls.delete(new Vector(x, y).toString())
        currentBall.velocity.y = App.ROLL_SPEED
        currentBall.destination.y = maxY * this.cellHeight + this.cellHeight / 2
        this.balls.set(this.getCellCoords(currentBall.destination).toString(), currentBall)
        maxY--
      }

      for (let y = 0; y <= maxY; y++) {
        this.createNewBall(x, y, direction)
      }
    } else {
      // Horizontal
      const y = this.getCellCoords(new Vector(0, balls[0].destination.y)).y
      let maxX = newBallsOnCoords.reduce((max, current) => (current.x > max ? current.x : max), 0)
      const direction = BallTransition.FROM_LEFT

      /** Drop down existing balls */
      for (let x = maxX; x >= 0; x--) {
        const currentBall = this.balls.get(new Vector(x, y).toString())
        if (!currentBall) continue

        this.balls.delete(new Vector(x, y).toString())
        currentBall.velocity.x = App.ROLL_SPEED
        currentBall.destination.x = maxX * this.cellWidth + this.cellWidth / 2
        this.balls.set(this.getCellCoords(currentBall.destination).toString(), currentBall)
        maxX--
      }

      for (let x = 0; x <= maxX; x++) {
        this.createNewBall(x, y, direction)
      }
    }

    this.clickAudio.play()
  }

  /**
   * @param {Ball} ball
   * @param {string} direction
   */
  checkBallsRow(ball, direction = "x") {
    /** @type {Ball[]} */
    let stack = []
    let result = false

    for (let i = 0; i < this.cols; i++) {
      const lastBall = stack[stack.length - 1]
      const currentPoint =
        direction === "x"
          ? new Vector(i, this.getCellCoords(ball.destination).y)
          : new Vector(this.getCellCoords(ball.destination).x, i)
      const currentBall = this.balls.get(currentPoint.toString())

      if (lastBall && lastBall.color !== currentBall.color) {
        // Check a right row for destroy
        if (stack.length >= App.MIN_BALLS_FOR_DESTROY) {
          this.destroyBallsRow(stack)
          result = true
        }
        stack = []
      }
      stack.push(currentBall)
    }

    if (stack.length >= App.MIN_BALLS_FOR_DESTROY) {
      this.destroyBallsRow(stack)
      result = true
    }

    return result
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new App(document.querySelector("#canvas"), 10)
})
