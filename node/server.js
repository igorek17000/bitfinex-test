const { PeerRPCServer }  = require('grenache-nodejs-http')

function server(link) {
    const peer = new PeerRPCServer(link, {
        timeout: 300000
    })

    peer.init()
    
    const port = 1024 + Math.floor(Math.random() * 1000)
    const service = peer.transport('server')
    service.listen(port)
    
    console.log('listening on port', port)
    
    setInterval(function () {
        link.announce('order_created', service.port, {})
        link.announce('order_executed', service.port, {})
    }, 1000)

    return service
}

module.exports = server