const { PeerRPCClient }  = require('grenache-nodejs-http')

function client(link) {
    const peer = new PeerRPCClient(link, {})
    peer.init()

    console.log('client has been initialized')

    return peer
}

module.exports = client