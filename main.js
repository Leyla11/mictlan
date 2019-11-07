class Player {
  //logica de los jugadores
  constructor(x) {
    this.health = 3
    this.x = x
  }

  move(distance, collisions) {
    let nextX = this.x + distance
    while (collisions.indexOf(nextX) !== -1) {
      nextX += distance
    }
    if (nextX >= 10 || nextX < 0) {
      return
    }
    this.x = nextX
    console.log(`Move to: ${nextX}`)
  }

  moveLeft(collisions = []) {
    this.move(-1, collisions)
  }

  moveRight(collisions = []) {
    this.move(1, collisions)
  }
}

class Sprite {
  //la logica de las imagenes que esta dentro de este
  constructor({ path, width, height }) {
    this.loaded = false
    this.width = width
    this.height = height

    const image = new Image()
    image.src = path
    image.onload = () => {
      this.loaded = true
    }
    this.image = image
  }

  render(ctx, coords) {
    if (this.loaded === false) {
      return
    }

    const { width = this.width } = coords
    const { height = this.height } = coords
    ctx.drawImage(this.image, coords.x, coords.y, width, height)
  }
}

const sprites = {
  //imagenes que en este caso son sprites
  bonus: new Sprite({
    path: './images/bonus.png',
    width: 400,
    height: 400
  }),
  flor: new Sprite({
    path: './images/flor.png',
    width: 900,
    height: 600
  }),
  maiz: new Sprite({
    path: './images/maiz.png',
    width: 387,
    height: 550
  }),
  background: new Sprite({
    path: './images/mictlan-background.jpg',
    width: 1280,
    height: 960
  }),
  logo: new Sprite({
    path: './images/mictlan-logo.png',
    width: 656,
    height: 154
  }),
  p1win: new Sprite({
    path: './images/p1-win.png',
    width: 260,
    height: 89
  }),
  p2win: new Sprite({
    path: './images/p2-win.png',
    width: 260,
    height: 89
  }),
  enter: new Sprite({
    path: './images/press-enter.png',
    width: 415,
    height: 86
  }),
  pumpkin: new Sprite({
    path: './images/pumpkin.png',
    width: 4139,
    height: 2407
  }),
  winBackground: new Sprite({
    path: './images/win.jpg',
    width: 640,
    height: 557
  }),
  xolo: new Sprite({
    path: './images/xolo-player.png',
    width: 201,
    height: 456
  }),
  xolo2: new Sprite({
    path: './images/xolo-player2.png',
    width: 201,
    height: 456
  })
}

//estos son metodos de la clase Mictlan
const screens = {
  logo: ['renderBackground', 'renderLogo', 'renderEnter'],
  instructions: ['renderBackground', 'renderInstructions'],
  gameplay: ['renderBackground', 'renderGameplay'],
  win: ['renderWin']
}

const items = [
  {
    name: 'Bonus',
    sprite: sprites.bonus,
    health: 1,
    probability: 2
  },
  {
    name: 'Flor',
    sprite: sprites.flor,
    health: 0,
    probability: 10
  },
  {
    name: 'Maiz',
    sprite: sprites.maiz,
    health: 0,
    probability: 18
  },
  {
    name: 'Pumpkin',
    sprite: sprites.pumpkin,
    health: -1,
    probability: 20
  }
]

class Gameplay {
  constructor() {
    this.timeouts = {}
    this.reset()
  }

  reset() {
    this.stop()

    this.items = []
    this.players = [new Player(0), new Player(9)]
    this.settings = {
      newItemTimeout: 1000,
      updateItemsTimeout: 250,
      numCalabazas: 3,
      maxItemY: 11
    }
  }

  start() {
    const { newItemTimeout, updateItemsTimeout } = this.settings
    this.timeouts['newItem'] = setTimeout(() => this.newItem(), newItemTimeout)
    this.timeouts['updateItems'] = setTimeout(() => this.updateItems(), updateItemsTimeout)
  }

  stop() {
    for (const timeout in this.timeouts) {
      clearTimeout(this.timeouts[timeout])
    }
    this.timeouts = {}
  }

  calabacear(x) {
    const { numCalabazas } = this.settings
    for (let i = 0; i < numCalabazas; i++) {
      const calabaza = this.generateItem({ number: 99999, x, y: -i })
      this.items.push(calabaza)
    }
  }

  generateItem(settings = {}) {
    let { number = Math.floor(Math.random() * 50) } = settings
    let i
    for (i = 0; i < items.length; i += 1) {
      const { probability } = items[i]
      if (number < probability) {
        break
      }
      number -= probability
    }
    if (i === items.length) {
      i -= 1
    }
    const { name, sprite, health } = items[i]
    const { x = Math.floor(Math.random() * 10) } = settings
    const { y = 0 } = settings
    return { name, sprite, health, x, y }
  }

  newItem() {
    const newItem = this.generateItem()

    //revisa si existe un item en la misma posicion
    const existingItems = this.items.filter(({ x, y }) => x === newItem.x && y === newItem.y)
    if (existingItems.length > 0) {
      return
    }

    //agrega el nuevo item
    this.items.push(newItem)

    //actualiza el timeout
    const { newItemTimeout } = this.settings
    this.timeouts['newItem'] = setTimeout(() => this.newItem(), newItemTimeout)
  }

  updateItems() {
    const { maxItemY } = this.settings
    const itemsToAssign = []
    this.items.forEach(item => {
      item.y += 1
      console.log(`${item.name}: ${item.x}, ${item.y}`)
      if (item.y === maxItemY) {
        itemsToAssign.push(item)
      }
    })
    if (itemsToAssign.length > 0) {
      const [p1, p2] = this.players
      itemsToAssign.reverse()
      itemsToAssign.forEach(item => {
        if (item.x === p1.x) {
          p1.health += item.health
        } else if (item.x === p2.x) {
          p2.health += item.health
        } else if (item.name !== 'Pumpkin') {
          this.calabacear(item.x)
        }
      })
      this.items = this.items.filter(({ y }) => y < maxItemY)
    }
    const { updateItemsTimeout } = this.settings
    this.timeouts['updateItems'] = setTimeout(() => this.updateItems(), updateItemsTimeout)
  }

  onKeyDown({ keyCode }) {
    const collisions = this.players.map(({ x }) => x)
    switch (keyCode) {
      case 65: // A
        this.players[0].moveLeft(collisions)
        break

      case 68: // D
        this.players[0].moveRight(collisions)
        break

      case 37: // Left
        this.players[1].moveLeft(collisions)
        break

      case 39: // Right
        this.players[1].moveRight(collisions)
        break
    }
  }
}

class Mictlan {
  constructor() {
    this.ctx = document.getElementById('mictlan').getContext('2d')
    this.gameplay = new Gameplay()
    this.screen = 'logo'
    document.addEventListener('keydown', e => this.onKeyDown(e))
  }

  renderLogo() {
    const { logo } = sprites
    logo.render(this.ctx, { x: 0, y: 100 })
  }

  renderBackground() {
    const { background } = sprites
    background.render(this.ctx, { x: 0, y: 0, width: 640, height: 480 })
  }

  renderEnter() {
    const { enter } = sprites
    enter.render(this.ctx, { x: 110, y: 260 })
  }

  renderInstructions() {
    const { ctx } = this
    ctx.font = '40px Verdana'
    ctx.fillStyle = 'white'
    ctx.textAlign = 'center'
    ctx.fillText('Instructions', 320, 160)
    ctx.font = '16px Verdana'
    ctx.fillText('Make that your friend Xolo help you with your journey to the underworld,', 320, 200)
    ctx.fillText('take the cempasuchtl flowers and the corn.', 320, 230)
    ctx.fillText('Do not take the pumpkin items, they will take life off your Xolo friend.', 320, 260)
    ctx.fillText('Use the key A and D for move the Xolo 1', 320, 290)
    ctx.fillText('Use the key ◀︎ and ▶︎ for move the Xolo 2', 320, 320)
  }

  renderWin() {
    const { winBackground } = sprites
    winBackground.render(this.ctx, { x: 0, y: 0, width: 640, height: 480 })
    const [p1, p2] = this.gameplay.players
    if (p1.health > 0) {
      const { p1win } = sprites
      p1win.render(this.ctx, { x: 110, y: 50 })
    } else if (p2.health > 0) {
      const { p2win } = sprites
      p2win.render(this.ctx, { x: 110, y: 50 })
    }
  }

  renderGameplay() {
    //renderizando los jugadores
    const { players } = this.gameplay
    players.forEach((player, playerIndex) => {
      const x = player.x * 64
      const { xolo, xolo2 } = sprites
      const sprite = playerIndex === 0 ? xolo : xolo2
      sprite.render(this.ctx, { x, y: 335, width: 64, height: 145 })
    })

    //renderizando los items
    const { items } = this.gameplay
    items.forEach(item => {
      const x = item.x * 64
      const y = item.y * 32
      const { sprite } = item
      sprite.render(this.ctx, { x, y, width: 64, height: 64 })
    })

    //cambiando la screen si ya ha ganado un jugador
    const [p1, p2] = players
    if (p1.health <= 0 || p2.health <= 0) {
      this.gameplay.stop()
      this.screen = 'win'
      setTimeout(() => (this.screen = 'logo'), 3000)
    }

    //renderizando las vidas
    const { bonus } = sprites
    for (let i = 0; i < p1.health; i += 1) {
      const x = 16 + i * 40
      const y = 432
      bonus.render(this.ctx, { x, y, width: 32, height: 32 })
    }
    for (let i = 0; i < p2.health; i += 1) {
      const x = 592 - i * 40
      const y = 432
      bonus.render(this.ctx, { x, y, width: 32, height: 32 })
    }
  }

  render() {
    //array con los metodos que vamos a llamar
    const renderMethods = screens[this.screen]
    renderMethods.forEach(method => this[method]())
    //esto es para repetir el render el siguiente frame (60 fps)
    window.requestAnimationFrame(() => this.render())
  }

  onKeyDown(event) {
    const { keyCode } = event
    switch (this.screen) {
      case 'gameplay':
        this.gameplay.onKeyDown(event)
        break

      case 'logo':
        if (keyCode === 13) {
          this.screen = 'instructions'
          setTimeout(() => {
            this.screen = 'gameplay'
            this.gameplay.reset()
            this.gameplay.start()
          }, 3000)
        }
    }
  }
}

const mictlan = new Mictlan()
mictlan.render()
