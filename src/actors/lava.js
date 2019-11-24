import State from '../State'
import {Vector} from '../utils'
/**
 * 有 3 种不同类型的熔岩
 * = 在水平方向上来回移动的熔岩, 撞到障碍物会回弹
 * | 在垂直方向上运动的容颜,  撞到障碍物会回弹
 * v 在垂直方向上运动, 撞到障碍物会直接出现在起始位置, 然后继续下落
 */
class Lava {
  constructor(pos, speed, reset) {
    this.pos = pos
    this.speed = speed
    this.reset = reset
  }

  get type() {
    return 'lava'
  }

  static create(pos, ch) {
    if (ch === '=') return new Lava(pos, new Vector(2, 0))
    if (ch === '|') return new Lava(pos, new Vector(0, 2))
    if (ch === 'v') return new Lava(pos, new Vector(0, 3), this.reset)
  }
}
Lava.prototype.size = new Vector(1, 1)
Lava.prototype.collide = function (state) {
  return new State(state.level, state.actors, "lost", state.life);
}

/**
 * 
 * @param {*} state
 * @param {*} time
 * @returns
 */
Lava.prototype.update = function (time, state) {
  const newPos = this.pos.plus(this.speed.times(time))
  if (!state.level.touches(newPos, this.size, 'wall')) return new Lava(newPos, this.speed, this.reset)
  if (this.reset) return new Lava(this.reset, speed, rest)
  return new Lava(this.pos, this.speed.times(-1))
}

export default Lava