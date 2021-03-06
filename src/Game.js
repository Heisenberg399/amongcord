const GameStages = require('./GameStages')
const Player = require('./Player')
const PlayerColors = require('./PlayerColors')

class Game {
  constructor (voiceChannel, textChannel, manager) {
    this.manager = manager
    this.voiceChannel = voiceChannel
    this.textChannel = textChannel
    this.gameStage = GameStages.LOBBY
    this.players = []
  }

  async setStage (stage) {
    this.gameStage = stage

    for (const player of this.players) {
      if (stage.toLowerCase() === GameStages.LOBBY) player.setAlive(true)
      await this.updatePlayerMute(player)
    }
  }

  addPlayer (member, color) {
    const player = new Player(member, color)
    this.players.push(player)
    this.updatePlayerMute(player)
    return player
  }

  removePlayer (member) {
    const player = this.getPlayer(member)
    this.players.splice(this.players.indexOf(player), 1)
    this.updatePlayerMute(player)
    if (this.players.length === 0) {
      this.textChannel.send(`The game in **${this.voiceChannel.name}** has ended because there were no players left.`)
      this.manager.endGame(this.voiceChannel)
    }
  }

  getPlayer (member) {
    return this.players.find(p => p.member.user.id === member.user.id)
  }

  getPlayerByColor (color) {
    return this.players.find(p => p.color === color)
  }

  setPlayerAlive (member, alive) {
    const player = this.getPlayer(member)
    player.setAlive(alive)
    this.updatePlayerMute(player)
  }

  isColorOccupied (color) {
    return !!this.getPlayerByColor(color.toLowerCase())
  }

  isColorAvailable (color) {
    return !this.getPlayerByColor(color.toLowerCase())
  }

  getAvailableColors () {
    return Object.keys(PlayerColors).map(k => PlayerColors[k]).filter(c => !this.getPlayerByColor(c))
  }

  getOccupiedColors () {
    return Object.keys(PlayerColors).map(k => PlayerColors[k]).filter(c => !!this.getPlayerByColor(c))
  }

  getDeadColors () {
    return this.players.filter(p => !p.alive).map(p => p.color)
  }

  getAliveColors () {
    return this.players.filter(p => !!p.alive).map(p => p.color)
  }

  async updatePlayerMute (player) {
    if (player.member.user.bot) return
    if (!this.players.includes(player)) return player.member.voice.setMute(false)
    switch (this.gameStage) {
      case GameStages.LOBBY: 
        await player.member.voice.setMute(false)
        break
      case GameStages.DISCUSSION:
        if (player.alive) {
          await player.member.voice.setMute(false)
        } else {
          await player.member.voice.setMute(true)
        }
        break
      case GameStages.TASKS:
        await player.member.voice.setMute(true)
        break
    }
  }
}

module.exports = Game