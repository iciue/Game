/**
 * 用于存储及计算坐标
 */
export class Vector {
  constructor(x, y) {
    this.x = x
    this.y = y
  }
  plus(other) {
    return new Vector(this.x + other.x, this.y + other.y)
  }
  times(factor) {
    return new Vector(this.x * factor, this.y * factor)
  }
}

/**
 * 计算 a1 a2 是否重叠
 */
export const overlap = (a1, a2) => {
  return a1.pos.x + a1.size.x > a2.pos.x &&  // a1 底部 是否与 a2 重叠
    a1.pos.x < a2.pos.x + a2.size.x &&       // a1 顶部 是否与 a2 重叠
    a1.pos.y + a1.size.y > a2.pos.y &&       // a1 右侧 是否与 a2 重叠
    a1.pos.y < a2.pos.y + a2.size.y         // a2 左侧 是否与 a2 重叠
}

/**
 * 生成事件对象, 并绑定事件
 */
export const trackKeys = (keys) => {
  if(!keys) return {}

  const down = Object.create(null)
  const track = (e) => {
    console.log('outer',e);
    console.log(keys.includes(e.key), );
    if (keys.includes(e.key)) {
      e.preventDefault()
      console.log('inner',e.key, e.type);
      down[e.key] = (e.type === 'keydown')
      console.log(down);
    }
  }

  window.addEventListener('keydown', track)
  window.addEventListener('keyup', track)

  return down
}

/**
 * 翻转 Y 轴
 */
export const flipHorizontally = (context, around) => {
  context.translate(around, 0);
  context.scale(-1, 1);
  context.translate(-around, 0);
}


export const addEventListenerOnce = (target, eventType, callback) => {
  function handler(e) {
    callback(e)
    target.removeEventListener(eventType, handler)
  }
  target.addEventListener(eventType, handler)
}