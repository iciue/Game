import {Vector} from '../utils'

/**
 * 玩家类, 存储玩家的坐标, 速度
 * @class Player
 */
class Player {
  constructor(pos, speed) {
    this.pos = pos
    this.speed = speed
  }
  get type() {
    return 'player'
  }

  static create(pos) {
    return new Player(pos.plus(new Vector(0, -0.5)), new Vector(0, 0))
  }
}
//每个 actor 实例的 size 都是相同的, 为了避免不必要的 new vector 所以放在原型上
Player.prototype.size = new Vector(0.8, 1.5)

/**
 * 
 */
const PlayerXSpeed = 7
const gravity = 30
const jumpSpeed = 17
Player.prototype.update = function (time, state, keys) {
  let xSpeed = 0

  if (keys.ArrowLeft) xSpeed -= PlayerXSpeed
  if (keys.ArrowRight) xSpeed += PlayerXSpeed

  let pos = this.pos
  const movedX = pos.plus(new Vector(xSpeed * time, 0))
  if (!state.level.touches(movedX, this.size, 'wall')) {
    pos = movedX
  }

  let ySpeed = this.speed.y + time * gravity

  let movedY = pos.plus(new Vector(0, ySpeed * time))
  if (!state.level.touches(movedY, this.size, 'wall')) { // 脚下有墙
    pos = movedY
  } else if (keys.ArrowUp && ySpeed > 0) {
    ySpeed = -jumpSpeed
  } else {
    ySpeed = 0
  }

  return new Player(pos, new Vector(xSpeed, ySpeed))
}

export default Player