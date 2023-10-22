"use strict";

const { PeerRPCServer } = require("grenache-nodejs-http");
const Link = require("grenache-nodejs-link");
const async = require("async");

// The order book containing all orders on the network
const orderBook = {
  buy: [],
  sell: [],
};

// OrderId - boolean
const filledOrders = {}

const link = new Link({
  grape: "http://127.0.0.1:30001",
});
link.start();

const peer = new PeerRPCServer(link, {});
peer.init();

const port = 1024 + Math.floor(Math.random() * 1000)
const service = peer.transport("server");
service.listen(port); //(1337);

setInterval(() => {
  link.announce("order_book_worker", service.port, {});
}, 1000);

service.on("request", (rid, key, payload, handler) => {
  // TODO handle requests to check for updates to a client's order book by userId
  // if(typeof payload === 'number') {
  //   addOrderFulfilledCheckToQueueAndProcess.push(payload, (err, res) => {
  //     if (err) {
  //       console.error(`Error processing enquiry: ${err}`);
  //     } else {
  //       handler.reply(null, res);
  //     }
  //   })
  // } else {
    handleOrderSubmission(payload, handler);
    handler.reply(null, `${payload.type} order received`);
  // }
});

/*
 * @dev process orders from clients
 * @dev broadcasts the order to other nodes on the network
 * @dev adds the order to the queue for processing
 * @dev checks if the order can be matched and modifies the order book
 * @param order - the order submitted by the client
 * */
function handleOrderSubmission(order) {
  // process order via the queue
  addOrderToQueueAndProcess.push(order, (err, res) => {
    if (err) {
      console.error(`Error processing order: ${err}`);
    } else {
      console.log(`processed: ${res}`);
    }
  });
}

function getIsOrderFulfilled(orderId) {
  return !!filledOrders[orderId];
}

const addOrderFulfilledCheckToQueueAndProcess = async.queue((orderId, callback) => {
  setTimeout(() => {
    callback(null, getIsOrderFulfilled(orderId))
  }, 1000)
}, 1)

/*
 * @dev add an order to the queue and check for matches
 * @param order - the order to process
 * */
const addOrderToQueueAndProcess = async.queue((order, callback) => {
  setTimeout(() => {
    processOrder(order);
    console.log(`Order match check done for: ${JSON.stringify(order)}`);
    callback(null, true);
  }, 1000); // delay simulation
}, 1);

function processOrder(order) {
  if (order.type === "buy") {
    processBuyOrder(order);
  } else {
    processSellOrder(order);
  }
}

/*
 * @dev process a buy order by checking for matches
 * @param buyOrder - the buy order to match
 * */
function processBuyOrder(buyOrder) {
  orderBook.buy.push(buyOrder);
  for (let i = 0; i < orderBook.sell.length; i++) {
    if (
      buyOrder.usdPrice === orderBook.sell[i].usdPrice &&
      buyOrder.coin === orderBook.sell[i].coin
    ) {
      console.log("order match found");
      if (buyOrder.amount === orderBook.sell[i].amount) {
        console.log("exact match, remove both orders");
        filledOrders[buyOrder.orderId] = true;
        filledOrders[orderBook.sell[i].orderId] = true;
        orderBook.sell.splice(i, 1);
      } else if (buyOrder.amount > orderBook.sell[i].amount) {
        console.log("buy > sell, decrease buy amount and remove sell order");
        orderBook.buy[orderBook.buy.length - 1].amount -= orderBook.sell[i].amount;
        filledOrders[orderBook.sell[i].orderId] = true;
        orderBook.sell.splice(i, 1);
      } else {
        console.log("sell > buy, decrease sell amount and remove buy order");
        orderBook.sell[i].amount -= buyOrder.amount;
        filledOrders[buyOrder.orderId] = true;
        orderBook.buy.pop();
      }
    }
  }
}

/*
 * @dev process a sell order by checking for matches
 * @param sellOrder - the sell order to match
 * */
function processSellOrder(sellOrder) {
  orderBook.sell.push(sellOrder);
  for (let i = 0; i < orderBook.buy.length; i++) {
    if (
      sellOrder.usdPrice === orderBook.buy[i].usdPrice &&
      sellOrder.coin === orderBook.buy[i].coin
    ) {
      console.log("order match found");
      if (sellOrder.amount === orderBook.buy[i].amount) {
        console.log("exact match, remove both orders");
        orderBook.buy.splice(i, 1);
        orderBook.sell.pop();
      } else if (sellOrder.amount > orderBook.buy[i].amount) {
        console.log("sell > buy, decrease sell amount and remove buy order");
        orderBook.sell[orderBook.sell.length - 1].amount -=
          orderBook.buy[i].amount;
        orderBook.buy.splice(i, 1);
      } else {
        console.log("buy > sell, decrease buy amount and remove sell order");
        orderBook.buy[i].amount -= sellOrder.amount;
        orderBook.sell.pop();
      }
    }
  }
}
