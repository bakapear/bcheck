let TICK = 0.015
let GRAVITY = -800.0
let TICKGRAV = TICK * GRAVITY
let MAXVEL = 3500.0
let EPSILON = 0.03125
let OFFSET = { crouched: 20, ceiling: 82 }
let DRANGE = [0.705078, 0.999999]
let ARANGE = [5200, 8900]
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

function getBounceAngles (height, bounce, land = { jumpbug: false, crouched: false }, teleheight) {
  let angles = []
  let set = []
  let prev = null
  for (let i = ARANGE[0]; i <= ARANGE[1]; i++) {
    let ang = i / 100
    let vel = getVelFromAngle(ang, bounce.crouched, WEAPONS[bounce.weapon])
    let b = checkBounce(height, { ...bounce, vel }, land, teleheight)
    if (bounce.double ? b === 2 : b !== 0) {
      if (prev && (ang - prev).toFixed(2) === '0.01') set.push(ang)
      else if (set.length > 1) {
        angles.push([set.shift(), set.pop()])
        set = []
      }
      prev = ang
    }
  }
  if (set.length > 1) angles.push([set.shift(), set.pop()])
  return angles.sort((a, b) => (a[0] - a[1]) - (b[0] - b[1]))
}

function checkBounce (height, bounce, land = { jumpbug: false, crouched: false }, teleheight = 1) {
  if (land.crouched && land.jumpbug) return 0

  let offs = 0
  if (bounce.crouched) offs -= OFFSET.crouched
  if (bounce.ceiling) offs -= OFFSET.ceiling
  if (bounce.offset) offs += bounce.offset

  if (land.crouched) offs += OFFSET.crouched
  height += offs + EPSILON

  let interval = [land.jumpbug ? Math.max(0, teleheight - 283 * TICK) : teleheight, 2]

  let b = canBounce(height, bounce.vel, interval)
  if (b === 2 && land.crouched) return 1
  return b
}

module.exports = { checkBounce, getBounceAngles }
