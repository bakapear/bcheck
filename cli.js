let bcheck = require('./bcheck.js')

let data = require('./bounces.json')
let { bounces, list } = bcheck.formatBounceJSON(data)

function logBounce (height, bounce, land = { crouched: false, jumpbug: false }, teleheight = 1) {
  let b = false
  let ang = null

  if (bounce.ang) ang = bcheck.getBounceAngles(height, bounce, land, teleheight)
  else b = bcheck.checkBounce(height, bounce, land, teleheight)

  if (b || ang) {
    console.log(
      (bounce.weapon ? `(${bounce.weapon}) ` : '') +
      bounce.text +
      (ang ? ` <${ang[0]} - ${ang[1]}>` : '') +
      ((bounce.double || b === 2) ? ' [double]' : '')
    )
  }
}

function main (height, types = ['default'], weapons = []) {
  if (!Array.isArray(types)) types = [types]
  if (!Array.isArray(weapons)) weapons = [weapons]
  types = types.map(x => x.toLowerCase())
  weapons = weapons.map(x => x.toLowerCase())

  console.log(`BCHECK: ${height}`)
  console.log('\n' + '-'.repeat(5), 'UNCROUCHED', '-'.repeat(5))

  let check = (x, y) => !y || (!x.length || x.includes(y.toLowerCase()))

  for (let type in bounces) {
    if (check(types, type)) for (let bounce of bounces[type]) if (check(weapons, bounce.weapon)) logBounce(height, bounce)
  }
  console.log('\n' + '-'.repeat(6), 'CROUCHED', '-'.repeat(6))
  for (let type in bounces) {
    if (check(types, type)) for (let bounce of bounces[type]) if (check(weapons, bounce.weapon)) logBounce(height, bounce, { crouched: true })
  }
  console.log('\n' + '-'.repeat(6), 'JUMPBUG', '-'.repeat(6))
  for (let type in bounces) {
    if (check(types, type)) for (let bounce of bounces[type]) if (check(weapons, bounce.weapon)) logBounce(height, bounce, { jumpbug: true })
  }
  console.log('')
}

let args = process.argv.slice(2)
let height = Number(args[0])
let types = args[1] && args[1].split(',')
let weapons = args[2] && args[2].split(',')

if (!args.length) console.log('bcheck <height> [type] [weapon] | bcheck <types/weapons>')
else {
  if (args[0] === 'types') console.log('Types:', list.types.join(', '))
  else if (args[0] === 'weapons') console.log('Weapons:', list.weapons.join(', '))
  else main(height, types, weapons)
}
