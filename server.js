'use strict'

const { PeerRPCServer }  = require('grenache-nodejs-http')
const Link = require('grenache-nodejs-link')
const async = require("async");

// The order book containing all orders on the network
const orderBook = {
    buy: [],
    sell: [],
}

const link = new Link({
    grape: 'http://127.0.0.1:30001'
})
link.start()

const peer = new PeerRPCServer(link, {})
peer.init()

const service = peer.transport('server')
service.listen(1337)

setInterval(() => {
    link.announce('order_book_worker', service.port, {})
}, 1000)

service.on('request', (rid, key, order, handler) => {
    // TODO handle the request type to check for updates to a client's order book
    handleOrderSubmission(order, handler)
    handler.reply(null, `${order.type} order received`)
})

/*
* @dev process orders from clients
* @dev broadcasts the order to other nodes on the network
* @dev adds the order to the queue for processing
* @dev checks if the order can be matched and modifies the order book
* @param order - the order submitted by the client
* */
function handleOrderSubmission(order) {
    // broadcast the order to other nodes on the network
    link.put(order, () => {
        // process order via the queue
        addOrderToQueueAndProcess.push(order, (err, res) => {
            if (err) {
                console.error(`Error processing order: ${err}`);
            } else {
                console.log(`processed: ${res}`)
            }
        });
    })
}

/*
* @dev add an order to the queue and check for matches
* @param order - the order to process
* */
const addOrderToQueueAndProcess = async.queue((order, callback) => {
    setTimeout(() => {
        processOrder(order)
        console.log(`Order match check done for: ${JSON.stringify(order)}`);
        callback(null, true);
    }, 1000); // delay simulation
}, 1);

function processOrder(order) {
    // TODO support multiple currency pairs
    if (order.type === 'buy') {
       processBuyOrder(order)
    } else {
       processSellOrder(order)
    }
}

/*
* @dev process a buy order by checking for matches
* @param buyOrder - the buy order to match
* */
function processBuyOrder(buyOrder) {
    orderBook.buy.push(buyOrder)
    for(let i = 0; i < orderBook.sell.length; i++) {
        if(buyOrder.usdPrice === orderBook.sell[i].usdPrice && buyOrder.coin === orderBook.sell[i].coin) {
            console.log('order match found')
            if(buyOrder.quantity === orderBook.sell[i].quantity) {
                // perfect match, buy order is never added and the sell order is removed
                orderBook.sell.splice(i, 1);
            } else if(buyOrder.quantity > orderBook.sell[i].quantity) {
                // the buy order is greater than the sell order, remove the sell order, decrease the buy order and add the modified buy order
                buyOrder.quantity -= orderBook.sell[i].quantity
                orderBook.sell.splice(i, 1);
                orderBook.buy.push(buyOrder)
            } else {
                // the sell order is greater than the buy order, don't add the buy order and decrease the sell order
                orderBook.sell[i].quantity -= buyOrder.quantity
            }
        }
    }
}

/*
* @dev process a sell order by checking for matches
* @param sellOrder - the sell order to match
* */
function processSellOrder(sellOrder) {
    orderBook.sell.push(sellOrder)
    for(let i = 0; i < orderBook.buy.length; i++) {
        if(sellOrder.usdPrice === orderBook.buy[i].usdPrice && sellOrder.coin === orderBook.buy[i].coin) {
            console.log('order match found')
            if(sellOrder.quantity === orderBook.buy[i].quantity) {
                // perfect match, remove both the buy and sell order
                orderBook.buy.splice(i, 1);
                orderBook.sell.pop()
            } else if(sellOrder.quantity > orderBook.buy[i].quantity) {
                // the sell order is greater than the buy order, remove the buy order, decrease the sell order and add the modified sell order
                sellOrder.quantity -= orderBook.buy[i].quantity
                orderBook.buy.splice(i, 1);
                orderBook.sell.push(sellOrder)
            } else {
                // the sell order is greater than the buy order, don't add the sell order and decrease the buy order
                orderBook.buy[i].quantity -= sellOrder.quantity
            }
        }
    }
}

