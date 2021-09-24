let TICK = 0.015
let GRAVITY = -800.0
let TICKGRAV = TICK * GRAVITY
let MAXVEL = 3500.0
let EPSILON = 0.03125
let OFFSET = { crouched: 20, ceiling: 82 }
let DRANGE = [0.705078, 0.999999]
let ARANGE = [40, 89]
let PLAYER = {
  uncrouched: { height: 82, view: 68, u: -3, scale: 1 },
  crouched: { height: 62, view: 45, u: 8, scale: 82 / 55 }
}
let WEAPONS = {
  Stock: [12, 121],
  Original: [0, 121],
  Mangler: [8, 121],
  'Mangler Charged': [8, 160.9299926757812]
}

function canBounce (height, vel, interval) {
  let heightmax = getValidHeight(vel, height - interval[0])
  let heightmin = getValidHeight(vel, height - interval[1])
  let tickmax = Math.floor(getLandTickFromStartZVel(heightmax, vel))
  let tickmin = Math.ceil(getLandTickFromStartZVel(heightmin, vel))

  let b = (height - interval[0] >= heightmax || height - interval[1] >= heightmin) && (tickmax - tickmin) >= 0.0
  if (b) {
    let raw = -getZFromTick(vel, tickmin) % 1
    if (raw >= DRANGE[0] && raw <= DRANGE[1]) return 2
  }
  return Number(b)
}

function getValidHeight (vel, height) {
  let ticktop = Math.ceil(-vel / TICKGRAV)
  let maxzrel = ticktop >= 0 ? getZFromTick(vel, ticktop) : 0.0

  return Math.max(height, -maxzrel)
}

function getZFromTick (vel, tick) {
  let maxveltick = getMaxVelTickFromStartZVel(vel)
  let tick0 = tick < maxveltick ? tick : (maxveltick - 1)
  let z = 0.5 * TICKGRAV * TICK * tick0 * tick0 + vel * TICK * tick0
  if (tick >= maxveltick) z -= MAXVEL * TICK * (tick - tick0)
  return z
}

function getMaxVelTickFromStartZVel (vel) {
  return Math.ceil(-(vel + MAXVEL) / TICKGRAV)
}

function getLandTickFromStartZVel (height, vel) {
  let tick0 = getMaxVelTickFromStartZVel(vel) - 1
  let z0 = getZFromTick(vel, tick0)
  if (z0 <= 0.0) return -(vel + Math.sqrt(vel * vel - 2.0 * GRAVITY * height)) / TICKGRAV
  return height / (MAXVEL * TICK) + (1 + vel / MAXVEL) * tick0 + 0.5 * TICKGRAV / MAXVEL * tick0 * tick0
}

function getVelFromAngle (angle, crouched, [y, radius]) {
  let p = crouched ? PLAYER.crouched : PLAYER.uncrouched

  let ang = angle * Math.PI / 180
  let cos = Math.cos(ang)
  let sin = Math.sin(ang)

  let l2 = 1 / ((2 * p.u * cos + 3953 * sin) ** 2) * (
    ((3953 * p.view + 4000 * p.u * cos) ** 2) +
    ((-2 * y * (p.view - 2000 * sin)) ** 2) +
    ((-2 * p.u * (p.view - 2000 * sin)) ** 2)
  ) - (p.view ** 2)

  return (900 * p.scale * (1 - (Math.sqrt(l2 + 1) / (2 * radius))) *
    ((p.height / 2) + 9)) / (Math.sqrt((p.height ** 2) + 4 * l2 + 36 * p.height + 324))
}

module.exports = {
  UNCROUCHED: 0,
  CROUCHED: 1,
  JUMPBUG: 2,
  checkBounce (height, bounce, land, teleheight = 1) {
    let offs = 0
    if (bounce.crouched) offs -= OFFSET.crouched
    if (bounce.ceiling) offs -= OFFSET.ceiling
    if (bounce.offs) offs += bounce.offs

    if (land === this.CROUCHED) offs += OFFSET.crouched
    height += offs + (bounce.ceiling ? -EPSILON : EPSILON)

    let interval = [land === this.JUMPBUG ? Math.max(0, teleheight - 283 * TICK) : teleheight, 2]

    let b = canBounce(height, bounce.vel, interval)
    if (b === 2 && (land === this.CROUCHED)) return 1
    return b
  },
  getBounceAngles (height, bounce, land, teleheight) {
    let angles = []
    let l = [0, 1]
    let step = 0.01
    let ang = ARANGE[0]
    let canBounce = ang => {
      let vel = getVelFromAngle(ang, bounce.crouched, WEAPONS[bounce.weapon])
      let b = this.checkBounce(height, { ...bounce, vel }, land, teleheight)
      return bounce.double ? b === 2 : b !== 0
    }
    let hold = null
    let pushAngle = ang => {
      ang = Math.round(ang * 1000) / 1000
      if (!hold) hold = ang
      else {
        angles.push([hold, ang])
        hold = null
      }
    }
    while (!l[0]) {
      step = 0.01
      if (canBounce(ang + step - 0.01)) {
        l[0] = 1
        pushAngle(ang + 0.01)
        while (l[1]) {
          if (ang > ARANGE[1]) break
          if (canBounce(ang + step)) step += 0.01
          else {
            pushAngle(ang + step - 0.01)
            l = [0, 0]
            ang += step
            break
          }
        }
      } else if (ang < ARANGE[1]) ang += 0.01
      else break
      if (ang <= ARANGE[1]) l[1] = 1
      if (ang > ARANGE[1] && angles.length < 2) return []
    }
    angles = angles.sort((a, b) => (a[0] - a[1]) - (b[0] - b[1]))

    if (bounce.ang && angles.length) {
      let ang = angles[0]
      let goal = bounce.ang
      if (goal !== -1) {
        let avg = x => (x[0] + x[1]) / 2
        ang = angles.reduce((prev, curr) => {
          return (Math.abs(avg(curr) - goal) < Math.abs(avg(prev) - goal) ? curr : prev)
        })
      }
      return ang
    }

    return angles
  },
  getBounces (height, bounces, land, teleheight) {
    let res = []
    for (let bounce of bounces) {
      let b = 0
      let ang = []

      if (!bounce.ang) b = this.checkBounce(height, bounce, land, teleheight)
      else {
        ang = this.getBounceAngles(height, bounce, land, teleheight)
        if (ang.length) b = 1 + !!bounce.double
      }

      if (b) res.push({ ...bounce, double: b === 2, ang })
    }
    return res
  },
  formatBounceJSON (data, weapons) {
    let WILDCARD = '*'
    let types = Object.keys(data)
    if (!weapons) {
      weapons = new Set()
      Object.values(data).forEach(x => {
        x.forEach(y => {
          let w = y.all || y
          if (w.weapon && w.weapon !== WILDCARD) weapons.add(w.weapon)
        })
      })
    }

    for (let type in data) {
      let arr = data[type]
      for (let i = 0; i < arr.length; i++) {
        let bounce = arr[i]
        let bulk = []
        if (bounce.all) {
          arr.splice(i, 1)
          for (let j = i; j < arr.length; j++) {
            if (arr[j].all) break
            arr[j] = { ...arr[j], ...bounce.all }
          }
          i--
          continue
        }
        if (bounce.weapon === WILDCARD) {
          for (let weapon of weapons) bulk.push({ ...bounce, weapon })
        } else if (Array.isArray(bounce.offs)) {
          bounce.offs.forEach((offs, i) => {
            bulk.push({ ...bounce, offs, text: bounce.text.replace(WILDCARD, i + 1) })
          })
        } else if (Array.isArray(bounce.vel)) {
          bounce.vel.forEach(vel => {
            bulk.push({ ...bounce, vel, text: bounce.text.replace(WILDCARD, vel) })
          })
        } else if (bounce.bounces) {
          bounce.bounces.forEach(b => {
            let c = Object.assign({}, bounce)
            delete c.bounces
            bulk.push({ ...c, ...b })
          })
        }
        if (bulk.length) arr.splice(i, 1, ...bulk)
      }
    }

    return { bounces: data, list: { types, weapons: Array.from(weapons) } }
  }
}
