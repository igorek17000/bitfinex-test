class OrderBook
{
    constructor (server, client)
    {
        this.client = client;
        this.server = server;

        this.sell_orders = [];
        this.buy_orders = [];
    }

    putOrder(orders)
    {
        this.client.map('order_created', { orders }, { timeout: 10000 }, (err, data) => {
            if (err) {
                console.error(err)
            }
            console.log(data) // { msg: 'world' }
        })
    }

    resolveOrder(){
        console.log("resolving .....")

        const used_orders = [];

        let buyOrder = this.buy_orders[0];
        let sellOrder = this.sell_orders[0];

        const exchange_result = [];
        const new_orders = [];

        while (buyOrder && sellOrder && buyOrder.price >= sellOrder.price)
        {
            let new_buy_orders = this.buy_orders;
            let new_sell_orders = this.sell_orders;
    
            if (buyOrder.quantity <= sellOrder.quantity)
            {
                new_buy_orders.pop();
                sellOrder.quantity -=buyOrder.quantity;
                if (sellOrder.quantity === 0)
                {
                    new_sell_orders.pop();
                }
                else
                {
                    // create new sell order with remaining quantity
                    new_orders.push({ type: 'sell', price: sellOrder.price, quantity: sellOrder.quantity });
                }
                exchange_result.push({ quantity: buyOrder.quantity, price: sellOrder.price})
                used_orders.push(buyOrder, sellOrder);
            }
            else 
            {
                exchange_result.push({ quantity: sellOrder.quantity, price: sellOrder.price });
                used_orders.push(buyOrder, sellOrder);
                buyOrder.quantity -= sellOrder.quantity;
                new_sell_orders.pop();
            }

            this.client.map('order_executed', { exchange_result, used_orders, new_orders }, { timeout: 10000 }, (err, data) => {
                if (err) {
                    console.error(err)
                }
                console.log(data) // { msg: 'world' }
            })

            buyOrder = this.buy_orders[0];
            sellOrder = this.sell_orders[0];
        }
        // exchange_result, used_orders, new_orders
    }

    newOrders(orders)
    {
        orders.forEach(order => {
            if (order.type === 'buy')
            {
                // insert sell order in the buy orders array
                this.buy_orders.push(order);
            } 
            else if (order.type === 'sell')
            {
                // insert sell order in the sell orders array
                this.sell_orders.push(order);
            }
        });

        // after adding the order, sort the buy orders by price
        this.buy_orders.sort((a, b) => {
            return a.price - b.price;
        });

        // after adding the order, sort the sell orders by price
        this.sell_orders.sort((a, b) => {
            return b.price - a.price;
        });

        this.resolveOrder();
    }

    async deleteOrders(orders){
        // set order availability to false
        orders.forEach(order => {
            this.order_availability.set(order.id, false);
        });

        orders.forEach(order => {    
            // delete order from order book
            if (order.type === 'buy')
            {
                // delete order from buy orders array
                this.buy_orders.find((o, i) => {
                    if (o.id === order.id)
                    {
                        this.buy_orders.splice(i, 1);
                        return true;
                    }
                    console.log("not found")
                });
            }
            else if (order.type === 'sell')
            {
                // delete order from sell orders array
                this.sell_orders.find((o, i) => {
                    if (o.id === order.id)
                    {
                        this.sell_orders.splice(i, 1);
                        return true;
                    }
                    console.log("not found")
                });
            }
        });
    }
}

module.exports = OrderBook