let bcheck = window.bcheck
let BOUNCES = bcheck.formatBounceJSON(window.BOUNCES)
let STATE = { height: null, folds: {} }
let LIST = {}

Object.defineProperty(STATE, 'set', {
  enumerable: false,
  value: function (prop, value) {
    this[prop] = value
    displayBounces()
  }
})

window.onload = () => {
  LIST = {
    uncrouched: document.getElementById('list_uncrouched'),
    crouched: document.getElementById('list_crouched')
  }
  handleInput('input_height', 'button_check')
  handleSwitches('switch_types', 'types', 'data-type', 1)
  handleSwitches('switch_weps', 'weapons', 'data-weapon')
  handleJumpbug('switch_jb', 1)
}

function handleInput (input, button) {
  input = document.getElementById(input)
  button = document.getElementById(button)

  let forward = () => {
    let val = Number(input.value)
    STATE.set('height', isNaN(val) ? null : val)
  }

  button.onclick = forward
  input.onkeydown = e => {
    if (e.keyCode === 69) return false
    if (e.keyCode === 13) forward()
  }
}

function handleSwitches (switches, prop, attr, def) {
  switches = Array.from(document.getElementById(switches).children)
  switches.forEach(s => {
    s.onclick = e => {
      if (e.ctrlKey) switches.forEach(t => t.classList.add('disabled'))
      s.classList.toggle('disabled')
      let sws = switches.filter(x => !x.classList.contains('disabled'))
      STATE.set(prop, sws.map(x => x.getAttribute(attr)))
    }
  })

  if (def) {
    if (Array.isArray(def)) def.forEach(d => switches[d - 1].click())
    else switches[def - 1].click()
  }
}

function handleJumpbug (types, def) {
  types = Array.from(document.getElementById(types).children)
  types.forEach(s => {
    s.onclick = () => {
      types.forEach(s => {
        s.classList.add('disabled')
        s.tabIndex = 0
      })
      s.tabIndex = -1
      s.classList.remove('disabled')
      STATE.set('jumpbug', s.getAttribute('data-type') === 'JUMPBUG')
    }
  })
  if (def) types[def - 1].click()
}

function displayBounces () {
  LIST.uncrouched.innerHTML = ''
  LIST.crouched.innerHTML = ''

  if (STATE.height === null) return

  let bounces = getBounces(STATE.height, STATE.types, STATE.weapons, STATE.jumpbug)

  let type = null

  for (let t of Object.keys(LIST)) {
    for (let bounce of bounces[t]) {
      if (type !== bounce.type) {
        type = bounce.type
        LIST[t].appendChild(createSeparator(type))
      }
      LIST[t].appendChild(createBounceItem(bounce))
    }
    type = null
  }

  handleSeparators()
}

function getBounces (height, types = [], weapons = [], jumpbug) {
  let bounces = BOUNCES.bounces
  let set = []
  for (let type in bounces) {
    if (!types.length || types.includes(type)) {
      for (let bounce of bounces[type]) {
        if (!bounce.weapon || !weapons.length || weapons.includes(bounce.weapon)) set.push({ ...bounce, type })
      }
    }
  }

  let uncrouched = bcheck.getBounces(height, set, STATE.jumpbug ? bcheck.JUMPBUG : bcheck.UNCROUCHED)
  let crouched = bcheck.getBounces(height, set, bcheck.CROUCHED)
  return { uncrouched, crouched }
}

function addBounceItemTag (parent, name, content, overwrite, title) {
  if (Array.isArray(content) && !content.length) return
  if (!content) return
  let node = document.createElement('span')
  node.className = name
  if (Array.isArray(content)) node.innerHTML = `<span>${Number(content[0]).toFixed(2)}</span><span>${Number(content[1]).toFixed(2)}</span>`
  else node.innerText = overwrite || content
  if (title) node.title = title
  parent.appendChild(node)
  return node
}

function formatBounceSetup (setup) {
  let parts = setup.map(x => {
    if (['JDS', 'JS', 'SHOOT'].includes(x)) return x
    if (x === 'SIDE') return 'Left/Right'
    return x[0].toUpperCase() + x.substr(1).toLowerCase()
  })
  let str = ''
  for (let i = 0; i < parts.length; i++) {
    if (parts[i] === 'SHOOT') continue
    if (i !== 0) {
      str += (i === 2 && parts.length > 3) ? '+' : ' '
    }
    str += parts[i]
  }
  return str
}

function formatBounceText (bounce) {
  return (bounce.weapon ? `(${bounce.weapon}) ` : '') +
    (bounce.text || formatBounceSetup(bounce.setup)) +
    (bounce.speedo ? ` <${bounce.speedo} u/s>` : '') +
    (bounce.ang && bounce.ang.length ? ` <${bounce.ang[0]} - ${bounce.ang[1]}>` : '') +
    (bounce.double ? ' [double]' : '')
}

function createSeparator (type) {
  type = type.toUpperCase()
  let sep = document.createElement('button')
  sep.className = 'separator'
  sep.innerText = type
  sep.setAttribute('data-type', type)
  return sep
}

function createBounceItem (bounce) {
  let item = document.createElement('div')
  item.className = 'item'

  let w = bounce.weapon
  if (w) w = w.split(' ').pop()[0]
  addBounceItemTag(item, 'weapon', bounce.weapon, w, bounce.weapon)

  let normal = addBounceItemTag(item, 'normal', bounce.text || formatBounceSetup(bounce.setup))
  normal.onclick = () => navigator.clipboard.writeText(formatBounceText(bounce))

  addBounceItemTag(item, 'angle', bounce.ang, null, Math.abs(bounce.ang[0] - bounce.ang[1]).toFixed(2))

  let speedo = addBounceItemTag(item, 'speedo', bounce.speedo, null, bounce.chance + '%')
  if (speedo) speedo.style.webkitFilter = `saturate(${Math.min(bounce.chance * 1.8, 150)}%)`

  if (!bounce.setup) addBounceItemTag(item, 'double', bounce.double, 'D', 'Double Bhop')

  return item
}

function handleSeparators () {
  let all = Array.from(document.getElementsByClassName('separator'))

  all.forEach(s => {
    s.onclick = e => {
      s.classList.toggle('pressed')
      let folded = s.classList.contains('pressed')
      let next = s
      let c = 0
      while (true) {
        next = next.nextElementSibling
        if (!next || !next.classList.contains('item')) break
        next.classList.toggle('hidden')
        c++
      }

      if (folded) s.innerText += ` (${c})`
      else s.innerText = s.innerText.substr(0, s.innerText.indexOf('('))

      if (e.isTrusted) {
        for (let t of Object.keys(LIST)) {
          let seps = Array.from(LIST[t].getElementsByClassName('separator'))
          for (let sep of seps) {
            STATE.folds[t][sep.getAttribute('data-type')] = sep.classList.contains('pressed')
          }
        }
      }
    }
  })

  for (let t of Object.keys(LIST)) {
    if (!STATE.folds[t]) STATE.folds[t] = {}
    Array.from(LIST[t].getElementsByClassName('separator')).forEach(s => {
      if (STATE.folds[t][s.getAttribute('data-type')] === true) s.click()
    })
  }
}
