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
var ObjectId = require('mongodb').ObjectID;

const CONNECTION_STRING = process.env.DB; //MongoClient.connect(CONNECTION_STRING, function(err, db) {});

module.exports = function (app) {
  
  MongoClient.connect(CONNECTION_STRING, {useNewUrlParser: true}, (err, client) => {
    if(err) {
      console.log('Database error: ' + err);
    } else {
      console.log('Successful database connection');  
      const db = client.db('anonMessage');  
  
      app.route('/api/threads/:board')
        // I can GET an array of the most recent 10 bumped threads on the board with only the most 
        // recent 3 replies from /api/threads/{board}. 
        // The reported and delete_passwords fields will not be sent.
        .get(function (req, res){
          let board = req.params.board;
          
          db.collection(board)
            .find(
              {},
              {
                replies : { $slice : -3 },
                reported : false,
                delete_password : false,
                'replies.reported' : false,
                'replies.delete_password' : false                
              }
            )
            .sort({'bumped_on': -1})
            .limit(10)
            .toArray((err, doc) => {
              if (err) return res.send(err);
              else res.send(doc);
            }
          );    
        })
        // I can POST a thread to a specific message board by passing form data text and delete_password 
        // to /api/threads/{board}.
        // (Recomend res.redirect to board page /b/{board})
        // Saved will be _id, text, created_on(date&time), bumped_on(date&time, starts same as created_on), 
        // reported(boolean), delete_password, & replies(array).            
        .post(function (req, res){
          let board = req.params.board;
          let now = new Date();
          let thread = {
            text : req.body.text,
            created_on : now,
            bumped_on : now,
            reported : false,
            delete_password : req.body.delete_password,
            replies : []
          };        
        
          // Save the thread
          if(!board || !thread.text || !thread.delete_password) {
            res.send('missing required fields')
          } else {        
            db.collection(board).insertOne(thread, function(err, doc) {
              if (err) return res.send(err);
              else res.redirect(`/b/${board}`); //res.json(thread);
            });
          }  
        })
        // I can report a thread and change it's reported value to true by sending a PUT request 
        // to /api/threads/{board} and pass along the thread_id. 
        // (Text response will be 'success')
        .put(function (req, res){
          let board = req.params.board;
          let thread_id = req.body.thread_id;
        
          if(!board || !thread_id) {
            res.send('missing required fields')
          } else { 
            db.collection(board)
              .findOneAndUpdate(
                {_id: ObjectId(thread_id)},
                { $set : { 'reported' : true } },
                {returnOriginal: false},
                function(err, doc) {
                  if (err || doc.value === null) res.send(`could not update thread ${thread_id}`);
                  else res.send('success');
                });          
          }        
        })
        // I can delete a thread completely if I send a DELETE request to /api/threads/{board} 
        // and pass along the thread_id & delete_password. 
        // (Text response will be 'incorrect password' or 'success')
        .delete(function (req, res){
          let board = req.params.board;
          let thread_id = req.body.thread_id;
          let delete_password = req.body.delete_password;
        
          // Delete the thread
          if(!board || !thread_id || !delete_password) {
            res.send('missing required fields');
          } else {        
            db.collection(board).deleteOne({_id: ObjectId(thread_id), delete_password: delete_password}, function(err, doc) {
              if (err || doc.deletedCount === 0) res.send('incorrect board, thread_id or password');
              else res.send('success');            
            });
          }           
          
        })      

      app.route('/api/replies/:board')
        // I can GET an entire thread with all it's replies from /api/replies/{board}?thread_id={thread_id}. 
        // Also hiding the same fields.
        .get(function (req, res){
          let board = req.params.board;
          let thread_id = req.query.thread_id;
          
          db.collection(board)
            .findOne(
              {_id: ObjectId(thread_id)},
              {
                reported : false,
                delete_password : false,
                'replies.reported' : false,
                'replies.delete_password' : false                
              },
            function(err, doc) {
              if (err) return res.send(err);
              else res.send(doc);
            }); 
        })
        // I can POST a reply to a thread on a specific board by passing form data text, delete_password, & thread_id 
        // to /api/replies/{board} and it will also update the bumped_on date to the comments date.
        // (Recomend res.redirect to thread page /b/{board}/{thread_id}) 
        // In the thread's 'replies' array will be saved _id, text, created_on, delete_password, & reported.
        .post(function (req, res){
          let board = req.params.board;
          let now = new Date();
          let thread_id = req.body.thread_id;
          let reply = {
            _id : new ObjectId(), // adding _id to each element of the array (mongodb does not do this by default)
            text : req.body.text,
            created_on : now,            
            delete_password : req.body.delete_password,
            reported : false
          };        
        
          // Save the reply
          if(!board || !thread_id || !reply.text || !reply.delete_password) {
            res.send('missing required fields')
          } else {    
            db.collection(board)
              .findOneAndUpdate(
                {_id: ObjectId(thread_id)},
                {
                  $set : { 'bumped_on' : now },
                  $push : { 'replies' : reply }                  
                },
                {returnOriginal: false},
                function(err, doc) {
                  if (err || doc.value === null) res.send(`could not update thread ${thread_id}`);
                  else res.redirect(`/b/${board}/${thread_id}`);
                });
          } 
        })
        // I can report a reply and change it's reported value to true by sending a PUT request 
        // to /api/replies/{board} and pass along the thread_id & reply_id. 
        // (Text response will be 'success')
        .put(function (req, res){
          let board = req.params.board;
          let thread_id = req.body.thread_id;
          let reply_id = req.body.reply_id;        
        
          if(!board || !thread_id || !reply_id) {
            res.send('missing required fields')
          } else {    
            db.collection(board)
              .findOneAndUpdate(
                {
                  _id: ObjectId(thread_id),
                  'replies._id': ObjectId(reply_id)
                },
                { $set : { 'replies.$.reported' : true } },
                {returnOriginal: false},
                function(err, doc) {
                  if (err || doc.value === null) res.send('incorrect board, thread_id or reply_id');
                  else res.send('success');
                });
          } 
        })
        // I can delete a post(just changing the text to '[deleted]') if I send a DELETE request to /api/replies/{board}
        // and pass along the thread_id, reply_id, & delete_password. 
        // (Text response will be 'incorrect password' or 'success')
        .delete(function (req, res){
          let board = req.params.board;
          let thread_id = req.body.thread_id;
          let reply_id = req.body.reply_id;
          let delete_password = req.body.delete_password;        
        
          // 'Delete' reply
          if(!board || !thread_id || !reply_id || !delete_password) {
            res.send('missing required fields')
          } else {    
            db.collection(board)
              .findOneAndUpdate(
                {
                  _id: ObjectId(thread_id),
                  'replies._id': ObjectId(reply_id),
                  'replies.delete_password': delete_password
                },
                { $set : { 'replies.$.text' : '[deleted]' } },
                {returnOriginal: false},
                function(err, doc) {
                  if (err || doc.value === null) res.send('incorrect board, thread_id, reply_id or password');
                  else res.send('success');
                });
          } 
        })       
      
      // 404 Not Found Middleware
      app.use(function(req, res, next) {
        res.status(404)
          .type('text')
          .send('Not Found');
      });      
      
    }
    
  });

};
