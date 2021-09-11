let fs = require('fs')
let ph = require('path')

let DIR = 'data'

let files = ['Stock', 'Original', 'Mangler', 'Mangler Charged']

let full = {}

for (let file of files) {
  file = ph.join(DIR, file + '.log')
  if (!fs.existsSync(file)) continue
  let lines = fs.readFileSync(file, 'utf-8').split(/\r?\n/)
  let res = {}
  let type = ''
  let setup = []
  let vels = []

  let push = () => {
    if (vels.length) {
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
      res[type].push({ setup, vels: vels.filter(x => !x.delete).sort((a, b) => b.count - a.count) })
      vels = []
      setup = []
    }
  }
  for (let line of lines) {
    line = line.slice(23)
    if (line.trim()) {
      if (line[0] === '-') {
        push()
        type = line.match(/- (.*) -/)[1].toLowerCase()
        res[type] = []
      } else if (type) {
        if (isNaN(line[0])) {
          push()
          setup.push(...line.split(' ').filter(x => x))
        } else {
          let m = line.match(/(\d+) > \[(\d+) u\/s\] VEL: ([\d.]+.), OFFS: ([\d.]+.)/)
          vels.push({
            count: Number(m[1]), speedo: Number(m[2]), vel: Number(m[3]), offs: Number(m[4])
          })
        }
      }
    }
  }
  push()

  full[ph.basename(file).slice(0, -4)] = res
}

let out = {}

for (let weapon in full) {
  for (let type in full[weapon]) {
    for (let bounce of full[weapon][type]) {
      let key = bounce.setup.pop().toUpperCase()
      if (!out[key]) out[key] = []

      if (bounce.setup.includes('STAND') && bounce.setup.length !== 1) bounce.setup[0] = 'WALK'

      out[key].push({
        weapon: weapon,
        setup: bounce.setup,
        crouched: [key, ...bounce.setup].some(x => ['CROUCH', 'JDS', 'JS'].includes(x)) || undefined,
        bounces: bounce.vels.slice(0, 2).map(x => {
          if (x.offs === 0) delete x.offs
          delete x.count
          return x
        })
      })
    }
  }
}

fs.writeFileSync('special.json', JSON.stringify(out, null, 2))
