'use strict'

const { PeerRPCClient }  = require('grenache-nodejs-http')
const Link = require('grenache-nodejs-link')

const link = new Link({
  grape: 'http://127.0.0.1:30001',
  requestTimeout: 10000
})
link.start()

// discover RPC nodes on the network that process orders
link.lookup('order_book_worker', {}, (err, data) => {
  if(err) console.log(err)
})

const peer = new PeerRPCClient(link, {})
peer.init()

const clientOrderBook = {
  buy: [],
  sell: [],
}

function buy() {
  const sampleBuyOrder = {
    type: 'buy',
    coin: 'BTC',
    amount: Math.floor(Math.random() * 100) + 1,
    usdPrice: Math.floor(Math.random() * 5) + 1,
  }
  // add a buy order
  peer.request('order_book_worker', sampleBuyOrder, { timeout: 100000 }, (err, msg) => {
    if (err) throw err
    console.log(msg)
    clientOrderBook.buy.push(sampleBuyOrder)
  })
}

function sell() {
  const sampleSellOrder = {
    type: 'sell',
    coin: 'BTC',
    amount: Math.floor(Math.random() * 100) + 1,
    usdPrice: Math.floor(Math.random() * 5) + 1,
  }
  // add a sell order
  peer.request('order_book_worker', sampleSellOrder, { timeout: 100000 }, (err, msg) => {
    if (err) throw err
    console.log(msg)
    clientOrderBook.sell.push(sampleSellOrder)
  })
}

function init() {
  buy()
  sell()
  setTimeout(() => {
    init()
  }, 10000)
}

init()


