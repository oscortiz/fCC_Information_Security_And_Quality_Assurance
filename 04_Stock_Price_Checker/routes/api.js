/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

var expect = require('chai').expect;
var MongoClient = require('mongodb').MongoClient;
var fetch = require('node-fetch');

const CONNECTION_STRING = process.env.DB; //MongoClient.connect(CONNECTION_STRING, function(err, db) {});


module.exports = function (app) {
  
  // Get stock from external API (https://cloud.iexapis.com)
  function getStockFromAPI(stock) {
    let apiRequests = [];
    stock.map(stk => {
      let apiUrl = `https://cloud.iexapis.com/stable/stock/${stk}/price?token=${process.env.API_KEY}`; 
      apiRequests.push(fetch(apiUrl)
        .then(response => response.json())
        .then(price => { return {stock: stk, price: price} })
        .catch(error => {
          console.error(error);
        }))          
    });             

    // Wait until stock objects have resolved
    return Promise.all(apiRequests).then(stocksToSave => stocksToSave);
  }

  
  MongoClient.connect(CONNECTION_STRING, {useNewUrlParser: true}, (err, client) => {
    if(err) {
      console.log('Database error: ' + err);
    } else {
      console.log('Successful database connection');  
      const db = client.db('stockPriceChecker');

      app.route('/api/stock-prices')
        // 1. I can GET /api/stock-prices with form data containing a Nasdaq stock ticker
        // and recieve back an object stockData.
        //
        // 2. In stockData, I can see the stock (string, the ticker), price (decimal in string format), and likes (int).
        //
        // 3. I can also pass along field like as true (boolean) to have my like added to the stock(s). Only 1 like per ip should be accepted.
        //
        // 4. If I pass along 2 stocks, the return object will be an array with both stock's info but instead of likes, 
        // it will display rel_likes (the difference between the likes on both) on both.
        //
        // 5. A good way to receive current price is the following external API( replacing 'GOOG' with your stock):
        //    https://finance.google.com/finance/info?q=NASDAQ%3aGOOG    --->   NOT WORKING
        //
        //    Using https://iexcloud.io/
        //    https://cloud.iexapis.com/stable/stock/STOCK_NAME/price?token=YOUR_TOKEN_HERE
        .get(async function (req, res){
          let stock = req.query.stock;
          let like = req.query.like === 'true' ? true : false;
          let ip = req.connection.remoteAddress.slice(7);

          if (Array.isArray(stock)) {
            // Passing along 2 stocks
            try {
              let stocksToStudy = await getStockFromAPI(stock);
              let stockData = [];

              db.collection('stocks').find({stock: { $in: stock }}).toArray((err, stocksFound) => {
                if (err) {
                  console.error(err);
                } else {
                  if (stocksFound.length === 0) {
                    // Save new stocks
                    stocksToStudy.map(stk => {  
                      stockData.push({"stock": stk.stock, "price": stk.price.toString(), "rel_likes": 0});
                      
                      let stockToSave = {
                        'stock': stk.stock,
                        'price': stk.price,
                        'likes': like ? 1 : 0,
                        'ip': like ? [ip] : []
                      };                      
                      
                      db.collection('stocks').save(stockToSave, (err, stkSaved) => {  
                        if (err) console.error(err);
                      });                      
                    });
                    
                    res.json({"stockData": stockData});
                    
                  } else if (stocksFound.length === 2) {
                    // Update both stocks
                    stocksFound.map(stk => {                       
                      stk.price = stk.stock === stocksToStudy[0].stock ? stocksToStudy[0].price : stocksToStudy[1].price;
                      
                      if (like && !stk.ip.includes(ip)) {
                        stk.ip.push(ip)
                        stk.likes++;
                      }
                      
                      stockData.push({"stock": stk.stock, "price": stk.price.toString(), "likes": stk.likes});
                      
                      db.collection('stocks')
                        .findOneAndUpdate(
                          {stock: stk.stock},
                          {$set: stk},
                          {returnOriginal: false},
                          function(err, updatedStock) {
                            if (err) console.error(err);
                      });                      
                    });
                    
                    res.json({"stockData": [
                      {"stock": stockData[0].stock, "price": stockData[0].price.toString(), "rel_likes": stockData[0].likes - stockData[1].likes },
                      {"stock": stockData[1].stock, "price": stockData[1].price.toString(), "rel_likes": stockData[1].likes - stockData[0].likes}
                    ]}); 
                    
                  } else if (stocksFound.length === 1) {
                    // Update one stock, save the other
                    if (stocksToStudy[0].stock !== stocksFound[0].stock) {
                      let stockToSave = {
                        'stock': stocksToStudy[0].stock,
                        'price': stocksToStudy[0].price,
                        'likes': like ? 1 : 0,
                        'ip': like ? [ip] : []
                      };
                      
                      db.collection('stocks').save(stockToSave, (err, stkSaved) => {  
                        if (err) console.error(err);
                      });         

                      let stockToUpdate = {
                        'stock': stocksToStudy[1].stock,
                        'price': stocksToStudy[1].price,
                        'likes': like && !stocksFound[0].ip.includes(ip) ? stocksFound[0].likes++ : stocksFound[0].likes,
                        'ip': like && !stocksFound[0].ip.includes(ip) ? stocksFound[0].ip.push(ip) : stocksFound[0].ip
                      };
                      
                      db.collection('stocks')
                        .findOneAndUpdate(
                          {stock: stockToUpdate.stock},
                          {$set: stockToUpdate},
                          {returnOriginal: false},
                          function(err, updatedStock) {
                            if (err) console.error(err);
                      });      
                      
                      res.json({"stockData": [
                        {"stock": stockToSave.stock, "price": stockToSave.price.toString(), "rel_likes": stockToSave.likes - stockToUpdate.likes },
                        {"stock": stockToUpdate.stock, "price": stockToUpdate.price.toString(), "rel_likes": stockToUpdate.likes - stockToSave.likes}
                      ]});
                      
                    } else {
                      let stockToSave = {
                        'stock': stocksToStudy[1].stock,
                        'price': stocksToStudy[1].price,
                        'likes': like ? 1 : 0,
                        'ip': like ? [ip] : []
                      };
                      
                      db.collection('stocks').save(stockToSave, (err, stkSaved) => {  
                        if (err) console.error(err);
                      });         
                      
                      let stockToUpdate = {
                        'stock': stocksToStudy[0].stock,
                        'price': stocksToStudy[0].price,
                        'likes': like && !stocksFound[0].ip.includes(ip) ? stocksFound[0].likes++ : stocksFound[0].likes,
                        'ip': like && !stocksFound[0].ip.includes(ip) ? stocksFound[0].ip.push(ip) : stocksFound[0].ip
                      };   
                      
                      db.collection('stocks')
                        .findOneAndUpdate(
                          {stock: stockToUpdate.stock},
                          {$set: stockToUpdate},
                          {returnOriginal: false},
                          function(err, updatedStock) {
                            if (err) console.error(err);
                      });      
                      
                      res.json({"stockData": [
                        {"stock": stockToSave.stock, "price": stockToSave.price.toString(), "rel_likes": stockToSave.likes - stockToUpdate.likes },
                        {"stock": stockToUpdate.stock, "price": stockToUpdate.price.toString(), "rel_likes": stockToUpdate.likes - stockToSave.likes}
                      ]});                     
                    }
                  }
                }
              });              
            } catch (err) {
              console.error(err);
              return err;
            }
          } else {
            // Passing along 1 stock
            let apiUrl = `https://cloud.iexapis.com/stable/stock/${stock}/price?token=${process.env.API_KEY}`;
            fetch(apiUrl)
              .then(response => {
                return response.json();
              })
              .then(price => {  
                // Check if stock exists
                db.collection('stocks').findOne({stock: stock}, (err, stk) => {  
                  if (err) {
                    console.error(err);
                  } else { 
                    if (stk === null) {
                      // Save new stock
                      let stockToSave = {
                        'stock': stock,
                        'price': price,
                        'likes': like ? 1 : 0,
                        'ip': like ? [ip] : []
                      };
                      
                      db.collection('stocks').save(stockToSave, (err, stkSaved) => {  
                        if (err) {
                          console.error(err);
                        } else {
                          res.json({'stockData': {'stock': stkSaved.ops[0].stock, 'price': stkSaved.ops[0].price.toString(), 'likes': stkSaved.ops[0].likes}});
                        }
                      });
                    } else {
                      // Update stock
                      stk.price = price;
                      if (like && !stk.ip.includes(ip)) {
                        stk.ip.push(ip)
                        stk.likes++;
                      }
                      
                      db.collection('stocks')
                        .findOneAndUpdate(
                          {stock: stock},
                          {$set: stk},
                          {returnOriginal: false},
                          function(err, updatedStock) {
                            if (err) {
                              console.error(err);
                            } else {
                              res.json({'stockData': {'stock': updatedStock.value.stock, 'price': updatedStock.value.price.toString(), 'likes': updatedStock.value.likes}});
                            }
                      });                      
                    }
                  }                  
                });
              })        
              .catch(error => {
                console.error(error);
              });
          }

        });

      // 404 Not Found Middleware
      app.use(function(req, res, next) {
        res.status(404)
          .type('text')
          .send('Not Found');
      });  
      
    }
    
  });
  
};
