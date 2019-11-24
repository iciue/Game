import Coin from './actors/coin'
import Lava from './actors/lava'
import Player from './actors/player'
import {Vector, overlap} from './utils'

/**
 * 活动元素 值指向活动元素类
 */
const activeChar = {
  '.': 'empty',
  '#': 'wall',
  '+': 'lava',
  '@': Player,
  'o': Coin,
  '=': Lava,
  '|': Lava,
  'v': Lava,
}

/**
 * 关卡类
 * this 上保存了关卡的宽高, 表示地图的二维数组, 存储活动元素信息的数组
 * 构造函数接受一个用于表示表示关卡的二维数组
 * 遍历 plan, 生成用于整个关卡, 如果 ch 是 '.' 表示空, 如果是活动元素, 则根据坐标生成 对应活动元素 的实例
 *  
 */
class Level {
  constructor(plan) {
    this.width = plan[0].length
    this.height = plan.length
    this.actors = []

    // 左上角开始, 第 y 行, 第 x 列
    this.rows = plan.map((row, y) => {
      return row.map((ch, x) => {
        const type = activeChar[ch]
        if (typeof type === 'string') return type
        this.actors.push(type.create(new Vector(x, y), ch))
        return 'empty'
      })
    })
  }
}
/**
 * 判断下一次指定的矩形块 出现到的位置是否接触到了 targetType 类型的物体
 * 用于判断 熔岩/玩家 是否碰到墙壁
 * @param {Vector} pos 矩形的坐标
 * @param {Vector} size 矩形的宽高
 * @param {string} targetType 是否接触到的网格
 * @return(boolean)
 */
Level.prototype.touches = function (pos, size, targetType) {
  const xStart = Math.floor(pos.x)
  const yStart = Math.floor(pos.y)
  const xEnd = Math.ceil(pos.x + size.x)
  const yEnd = Math.ceil(pos.y + size.y)

  for (let y = yStart; y < yEnd; y++) {
    for (let x = xStart; x < xEnd; x++) {
      const isOutside = x < 0 || x >= this.width || y < 0 || y >= this.height
      const here = isOutside ? 'wall' : this.rows[y][x]
      if (here === targetType) return true
    }
  }
  return false
}


export  default Level