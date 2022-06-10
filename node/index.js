const Link = require('grenache-nodejs-link')
const OrderBook = require('./src/OrderBook')
const Queue = require('./src/Queue')

const link = new Link({
  grape: 'http://127.0.0.1:30001'
})
link.start()

const server = require('./server')(link)
const client = require('./client')(link)

// create a new order book instance in memory
const orderBook = new OrderBook(server, client)

// create a queue instance for executing orders
const queue = new Queue()

// an order object structure { id:'2y2ft2vj2', type:'buy', price:10, quantity: 5 }
//example orderBook.putOrder([{ id:'2y2ft2vj2' type:'buy', price:10, quantity: 5 }])

server.on('request', async (rid, key, payload, handler) => {
    if(key === 'order_created') {
        console.log("new order created")
        console.log(rid, payload)

        // make a new order non blocking
        orderBook.newOrders(payload.orders)

        //set avaiablity of the order
        orderBook.setOrderAvailability(payload.orders, true)

        handler.reply(null, { msg: 'created' })
    }

    if(key === 'order_executed') {
        console.log(`some orders has been executed`)
        console.log(rid, payload)

        queue.enqueue(payload)

        while (!queue.isEmpty) {
            const queue_payload = queue.dequeue();
        
            // change order availability to false
            // delete order from order book
            await orderBook.deleteOrders(queue_payload.used_orders)
            orderBook.newOrders(queue_payload.new_orders)
    
            console.log(`${queue_payload.used_orders.length} orders has been executed`)
            console.log(`${queue_payload.new_orders.length} orders has been created`)
        }

        handler.reply(null, { msg: 'executed' })
    }
})

// orderBook.putOrder([{ id: 12345, type: 'sell', price: 10, quantity: 5 }])
// orderBook.putOrder([{ id: 12346, type: 'buy', price: 10, quantity: 5 }])
