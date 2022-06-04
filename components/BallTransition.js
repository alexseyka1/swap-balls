class BallTransition {
  static FROM_TOP = 1
  static FROM_BOTTOM = 2
  static FROM_LEFT = 3
  static FROM_RIGHT = 4

  constructor(canvas) {
    this.canvas = canvas
  }

  /**
   * @param {number} direction
   * @param {Ball} ball
   * @param {number} speed
   */
  run(direction, ball, speed = 5) {
    if (direction === BallTransition.FROM_TOP) this.fromTop(ball, speed)
    else if (direction === BallTransition.FROM_BOTTOM) this.fromBottom(ball, speed)
    else if (direction === BallTransition.FROM_LEFT) this.fromLeft(ball, speed)
    else if (direction === BallTransition.FROM_RIGHT) this.fromRight(ball, speed)
  }

  /**
   * @param {Ball} ball
   * @param {number} speed
   */
  fromTop(ball, speed) {
    ball.velocity = new Vector(0, speed)
    ball.position.y = -this.canvas.height + ball.position.y - ball.position.x / 2
  }
  /**
   * @param {Ball} ball
   * @param {number} speed
   */
  fromLeft(ball, speed) {
    ball.velocity = new Vector(speed, 0)
    ball.position.x = -this.canvas.width + ball.position.x - ball.position.y / 2
  }

  /**
   *
   * @param {Ball} ball
   * @param {number} speed
   */
  fromBottom(ball, speed) {
    ball.velocity = new Vector(0, -speed)
    ball.position.y = this.canvas.height + ball.position.y + ball.position.x / 2
  }

  /**
   * @param {Ball} ball
   * @param {number} speed
   */
  fromRight(ball, speed) {
    ball.velocity = new Vector(-speed, 0)
    ball.position.x = this.canvas.width * 1.5 + ball.position.x - ball.position.y / 2
  }
}
