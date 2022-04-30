// merges multiple .log files into one and simplifies result

let fs = require('fs')
let ph = require('path')

let DIR = 'ZLOGS'

function walkDir (dir) {
  let dirs = fs.readdirSync(dir)
  let files = dirs.map(sub => {
    let res = ph.resolve(dir, sub)
    return fs.statSync(res).isDirectory() ? walkDir(res) : res
  })
  return files.reduce((a, f) => a.concat(f), [])
}

function merge (wep, a, b, c) {
  let files = walkDir(ph.join(DIR, wep))
  let lines = files.reduce((arr, item) => {
    arr.push(fs.readFileSync(item, 'utf-8'))
    return arr
  }, []).join('\r\n').split(/\r\n/)

  let data = []

  let table = {}

  for (let line of lines) {
    let timestamp = line.match(/\d\d\/\d\d\/\d\d\d\d - \d\d:\d\d:\d\d:/)
    if (timestamp) line = line.substr(timestamp[0].length).trim()
    if (line.startsWith('---')) continue // some weird error message on hudreload keeps popping up in logs
    if (!line) continue

    line = line.replaceAll(/(SPEEDO|VEL|OFFS): /g, '')

    let chance = Number(line.split(' ').shift())
    if (!isNaN(chance)) {
      if (!table[chance]) table[chance] = 0
      table[chance]++

      // change numbers based on table result
      // this is stupid but whatev it works
      if (a) {
        if (chance >= a[0] && chance <= a[1]) line = line.replace(`${chance} >`, '70 >')
        else if (chance >= b[0] && chance <= b[1]) line = line.replace(`${chance} >`, '30 >')
        else if (chance >= c[0] && chance <= c[1]) continue
        else if (chance !== 100) throw Error('Invalid range! ' + chance)
      }
    }

    data.push(line)
  }

  // console.log(table)

  fs.writeFileSync(wep + '.log', data.join('\n'))
}

merge('stock')
merge('ori', [62, 72], [26, 38], [1, 5])
merge('mangler', [62, 73], [27, 37], [1, 3])
