import State from '../State'
import {Vector} from '../utils'

/**
 * 硬币, 硬币可以在垂直方向上小幅度的抖动
 * wobble 属性用来记录硬币的抖动幅度
 * wobble 和 basePos 共同决定了 pos 所在的实际位置
 */
class Coin {
  constructor(pos, basePos, wobble) {
    this.pos = pos
    this.basePos = basePos
    this.wobble = wobble
  }

  get type() {
    return 'coin'
  }

  static create(pos) {
    const basePos = pos.plus(new Vector(0.2, 0.1))
    return new Coin(basePos, basePos, Math.random() * Math.PI * 2)
  }
}
Coin.prototype.size = new Vector(0.6, 0.6)

/**
 *
 *
 * @param {*} state
 */
Coin.prototype.collide = function (state) {
  console.log('get coin');
  const filteredActor = state.actors.filter(a => a !== this) //剔除得到的硬币
  let status = state.status
  if (!filteredActor.some(a => a.type == 'coin')) status = 'won'
  return new State(state.level, filteredActor, status, state.life)
}

const wobbleSpeed = 8
const wobbleDist = 0.07
Coin.prototype.update = function (time) {
  const wobble = this.wobble + time * wobbleSpeed
  const wobblePos = Math.sin(wobble) * wobbleDist
  return new Coin(this.basePos.plus(new Vector(0, wobblePos)), this.basePos, wobble)
}


export default Coin