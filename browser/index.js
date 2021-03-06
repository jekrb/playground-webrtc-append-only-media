const level = require('level')
const hyperlog = require('hyperlog')
const yo = require('yo-yo')
const wswarm = require('webrtc-swarm')
const signalhub = require('signalhub')
const concat = require('concat-stream')

const hubs = ['10.0.0.166:10000'] // put whatever hubs you want here
const swarm = wswarm(signalhub('wow', hubs))
const db = level('db')
const log = hyperlog(db, {
  valueEncoding: 'json'
})

const state = {
  pubs: []
}

document.getElementById('app').appendChild(render(state))
read()

log.on('add', () => read())

swarm.on('peer', (peer, id) => {
  const replicate = log.replicate({
    live: true
  })
  peer.pipe(replicate).pipe(peer)
})

function read () {
  log.createReadStream().pipe(concat(body => {
    state.pubs = body
    yo.update(document.getElementById('app'), render(state))
  }))
}

function render (state) {
  return yo`
    <div id='app'>
      <h1>pubs</h1>
      <form onsubmit=${publish}>
        <input type='text' name='publish' placeholder='publish some words'>
        <button type='submit'>publish</button>
      </form>
      <ul>
        ${state.pubs.map(pub => yo`<li>${pub.value}</li>`)}
      </ul>
    </div>`

  function publish (e) {
    e.preventDefault()
    log.append(this.elements.publish.value, err => {
      if (err) console.error(err)
      e.target.reset()
    })
  }
}

