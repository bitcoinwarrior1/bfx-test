"use strict";

const { PeerRPCClient } = require("grenache-nodejs-http");
const Link = require("grenache-nodejs-link");

const link = new Link({
  grape: "http://127.0.0.1:30001",
  requestTimeout: 10000,
});
link.start();

// discover RPC nodes on the network that process orders
link.lookup("order_book_worker", {}, (err, data) => {
  if (err) console.log(err);
});

const peer = new PeerRPCClient(link, {});
peer.init();

// generate a random number and use it as a userId so that orders can be traced back
const userId = Math.floor(Math.random() * 9999999999);

const clientOrderBook = {
  buy: [],
  sell: [],
};

function buy() {
  const sampleBuyOrder = {
    userId,
    type: "buy",
    coin: "BTC",
    amount: Math.floor(Math.random() * 100) + 1,
    usdPrice: Math.floor(Math.random() * 5) + 1,
    orderId: Math.floor(Math.random() * 999999999) + 1,
  };
  // Share our buy order with the network
  link.put(sampleBuyOrder, () => {});
  // add a buy order
  peer.request(
    "order_book_worker",
    sampleBuyOrder,
    { timeout: 100000 },
    (err, msg) => {
      if (err) throw err;
      console.log(msg);
      clientOrderBook.buy.push(sampleBuyOrder);
    }
  );
  // getStatusOfOrderById(sampleBuyOrder.orderId)
}

function sell() {
  const sampleSellOrder = {
    userId,
    type: "sell",
    coin: "BTC",
    amount: Math.floor(Math.random() * 100) + 1,
    usdPrice: Math.floor(Math.random() * 5) + 1,
    orderId: Math.floor(Math.random() * 999999999) + 1,
  };
  // Share our sell order with the network
  link.put(sampleSellOrder, () => {});
  // add a sell order
  peer.request(
    "order_book_worker",
    sampleSellOrder,
    { timeout: 100000 },
    (err, msg) => {
      if (err) throw err;
      console.log(msg);
      clientOrderBook.sell.push(sampleSellOrder);
    }
  );
  // getStatusOfOrderById(sampleSellOrder.orderId)
}

// function getStatusOfOrderById(orderId) {
//   setTimeout(() => {
//     peer.request(
//         "order_book_worker",
//         orderId,
//         { timeout: 100000 },
//         (err, msg) => {
//           if (err) throw err;
//           console.log(msg);
//         }
//     );
//     getStatusOfOrderById(orderId);
//   }, 10000);
// }

function init() {
  // TODO: allow a client to set an expiry date or cancel their order
  buy();
  sell();
  setTimeout(() => {
    init();
  }, 10000);
}

init();
