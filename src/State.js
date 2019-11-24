
/**
 * 游戏的状态, 用于判断游戏的输赢
 */
class State {
  constructor(level, actors, status) {
    this.level = level
    this.actors = actors
    this.status = status
  }

  static start(level) {
    return new State(level, level.actors, 'playing')
  }

  get player() {
    return this.actors.find(a => a.type === 'player')
  }
}
/**
 * 
 * @param {*} time
 * @param {*} keys
 */
State.prototype.update = function (time, keys) {
  const actors = this.actors.map(actor => actor.update(time, this, keys))  //更新活动元素位置
  let newState = new State(this.level, actors, this.status) // 根据新活动元素的位置生成 State
  if (newState.status !== 'playing') return newState
  const player = newState.player
  if (this.level.touches(player.pos, player.size, 'lava')) return new State(this.level, actors, 'lost')
  for (let actor of actors) {
    if (actor.type !== 'player' && overlap(actor, player)) {
      newState = actor.collide(newState)
    }
  }
  return newState
}


export default State