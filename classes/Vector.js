class Vector {
  /**
   * @param {number} x
   * @param {number} y
   */
  constructor(x = null, y = null) {
    this.x = x
    this.y = y
  }

  /**
   * @returns {Vector}
   */
  clone() {
    return new Vector(this.x, this.y)
  }

  /**
   * @returns {string} x;y
   */
  toString() {
    return `${this.x};${this.y}`
  }

  /**
   * @param {Vector} point
   * @returns {boolean}
   */
  isEqual(point) {
    return this.x === point.x && this.y === point.y
  }
}
