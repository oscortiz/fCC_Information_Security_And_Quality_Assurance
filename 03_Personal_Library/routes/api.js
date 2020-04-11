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
var ObjectId = require('mongodb').ObjectId;
const MONGODB_CONNECTION_STRING = process.env.DB;
//Example connection: MongoClient.connect(MONGODB_CONNECTION_STRING, function(err, db) {});

module.exports = function (app) {

  MongoClient.connect(MONGODB_CONNECTION_STRING, { useNewUrlParser: true}, (err, client) => {
    if(err) {
      console.log('Database error: ' + err);
    } else {
      console.log('Successful database connection');    
      const db = client.db('personalLibrary');  
      
      app.route('/api/books')
        // I can get /api/books to retrieve an array of all books containing title, _id, & commentcount.
        .get(function (req, res){
          
          db.collection('books').find({}).toArray((err, doc) => {
            if (err) {
              console.error(err);
            } else {
              //response will be array of book objects
              //json res format: [{"_id": bookid, "title": book_title, "commentcount": num_of_comments },...]
              let listOfBooks = [];
              doc.map((book) => {
                let b = {
                  '_id' : book._id,
                  'title' : book.title,
                  'commentcount' : book.comments ? book.comments.length : 0
                };
                listOfBooks.push(b);
              });
              res.send(listOfBooks);              
            }
          });        
        })
        // I can post a title to /api/books to add a book and returned will be the object
        // with the title and a unique _id.
        .post(function (req, res){
          var title = req.body.title;          
          let book = {title : title};
        
          // Save the object
          if(!book.title) {
            res.send('missing required title');
          } else {        
            db.collection('books').insertOne(book, function(err, doc) {
              if (err) {
                console.error(err);
              } else {
                //response will contain new book object including at least _id and title
                res.json(book);
              }
            });
          }        
        })
        // I can send a delete request to /api/books to delete all books in the database.
        // Returned will be 'complete delete successful' if successful.
        .delete(function(req, res){          
          db.collection('books').deleteMany({},  function(err, doc) {
              if (err) {
                console.error(err);
              } else {
                // if successful response will be 'complete delete successful'
                res.send('complete delete successful');
              }
            });
        });

      app.route('/api/books/:id')
        // I can get /api/books/{_id} to retrieve a single object of a book containing 
        // title, _id, & an array of comments (empty array if no comments present).
        .get(function (req, res){
          var bookid = req.params.id;
          
          db.collection('books').findOne({_id: ObjectId(bookid)}, (err, book) => {  
            if (err) {
              console.error(err);
            } else {   
              // If I try to request a book that doesn't exist I will get a 'no book exists' message.
              if (book === null) {
                res.send('no book exists');
              } else {
                //json res format: {"_id": bookid, "title": book_title, "comments": [comment,comment,...]}
                res.json({
                  '_id' : book._id,
                  'title' : book.title,
                  'comments' : book.comments ? book.comments : []
                }); 
              }
            }
          });
        })
        // I can post a comment to /api/books/{_id} to add a comment to a book and returned
        // will be the books object similar to get /api/books/{_id}.
        .post(function(req, res){
          var bookid = req.params.id;
          var comment = req.body.comment;
        
          // Save the object
          if(!bookid || !comment) {
            res.send('missing required id or comment');
          } else {        
            db.collection('books')
              .findOneAndUpdate(
                {_id: ObjectId(bookid)},
                {$push: {comments: comment}},
                {returnOriginal: false},
                function(err, book) {
                  if (err) {
                    console.error(err);
                  } else {
                    //json res format same as .get
                    res.json({
                      '_id' : book.value._id,
                      'title' : book.value.title,
                      'comments' : book.value.comments
                    });
                  }
            });
          }          
        })
        // I can delete /api/books/{_id} to delete a book from the collection.
        // Returned will be 'delete successful' if successful.
        .delete(function(req, res){
          var bookid = req.params.id;
        
          db.collection('books').deleteOne({_id: ObjectId(bookid)},  function(err, doc) {
              if (err) {
                console.error(err);
              } else {
                // if successful response will be 'delete successful'
                res.send('delete successful');
              }
            });           
        });
      
      //404 Not Found Middleware
      app.use(function(req, res, next) {
        res.status(404)
          .type('text')
          .send('Not Found');
      });
      
    }
    
  });
  
};
