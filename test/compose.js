let fs = require('fs')
let ph = require('path')

let DIR = 'data'

let WEAPONS = ['Stock', 'Original', 'Mangler', 'Mangler Charged']
let CROUCHED = ['CROUCH', 'JDS']

let res = {}

for (let weapon of WEAPONS) {
  let file = ph.join(__dirname, DIR, weapon + '.log')
  if (!fs.existsSync(file)) continue
  let lines = fs.readFileSync(file, 'utf-8').split(/\r?\n/)
  let setup = []
  let vels = []

  let push = () => {
    if (!vels.length) return
    for (let i = 0; i < vels.length; i++) {
      let curr = vels[i]
      let c = vels.findIndex((x, n) => i !== n && x.speedo === curr.speedo && Math.abs(x.vel - curr.vel) < 0.1)
      if (c !== -1) {
        let close = vels[c]

        let dom = close.count > curr.count ? close : curr
        let sub = dom === curr ? close : curr

        let merged = { ...dom, count: dom.count + sub.count }
        vels.splice(i, 1, merged)
        vels.splice(c, 1, { delete: true })
      }
    }
    let type = setup[setup.length - 1]
    if (setup[0] === 'STAND' && setup.length > 2) setup[0] = 'WALK'
    if (type === 'SHOOT') type = 'SPECIAL'
    if (weapon === 'Original') {
      if (setup.includes('RIGHT')) {
        vels = []
        setup = []
        return
      } else {
        let left = setup.indexOf('LEFT')
        if (left !== -1) setup[left] = 'SIDE'
      }
    }
    if (!res[type]) res[type] = []
    vels = vels.filter(x => !x.delete).sort((a, b) => b.count - a.count)
    let total = vels.reduce((a, b) => a + b.count, 0)
    res[type].push({
      weapon,
      setup,
      crouched: [type, ...setup].some(x => CROUCHED.includes(x)) || undefined,
      bounces: vels.slice(0, 2).map((x, i) => {
        if (x.offs === 0) delete x.offs
        x.chance = Number((x.count / total * 100).toFixed(2))
        delete x.count
        if (i !== 0) x.alt = true
        return x
      })
    })
    vels = []
    setup = []
  }
  for (let line of lines) {
    line = line.slice(23).trim()
    if (!line || line[0] === '>') continue
    if (isNaN(line[0])) {
      push()
      setup.push(...line.split(' ').filter(x => x).map(x => x.slice(1, -1)))
    } else {
      let m = line.match(/(\d+) > \[(\d+) u\/s\] VEL: ([\d.]+.), OFFS: ([\d.]+.)/)
      vels.push({
        count: Number(m[1]), speedo: Number(m[2]), vel: Number(m[3]), offs: Number(m[4])
      })
    }
  }
  push()
}

fs.writeFileSync('result.json', JSON.stringify(res, null, 2))
