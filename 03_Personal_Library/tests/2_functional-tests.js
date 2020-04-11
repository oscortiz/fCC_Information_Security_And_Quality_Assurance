/*
*
*
*       FILL IN EACH FUNCTIONAL TEST BELOW COMPLETELY
*       -----[Keep the tests in the same order!]-----
*       
*/

var chaiHttp = require('chai-http');
var chai = require('chai');
var assert = chai.assert;
var server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function() {

  /*
  * ----[EXAMPLE TEST]----
  * Each test should completely test the response of the API end-point including response status code!
  */
  /*
  test('#example Test GET /api/books', function(done){
     chai.request(server)
      .get('/api/books')
      .end(function(err, res){
        assert.equal(res.status, 200);
        assert.isArray(res.body, 'response should be an array');
        assert.property(res.body[0], 'commentcount', 'Books in array should contain commentcount');
        assert.property(res.body[0], 'title', 'Books in array should contain title');
        assert.property(res.body[0], '_id', 'Books in array should contain _id');
        done();
      });
  });
  */
  /*
  * ----[END of EXAMPLE TEST]----
  */

  suite('Routing tests', function() {

    let id;

    suite('POST /api/books with title => create book object/expect book object', function() {
      
      test('Test POST /api/books with title', function(done) {
       chai.request(server)
        .post('/api/books')
        .send({title: 'Book Title'})
        .end(function(err, res){
          assert.equal(res.status, 200);
          assert.equal(res.body.title, 'Book Title');
          done();
        });
      });
      
      test('Test POST /api/books with no title given', function(done) {
       chai.request(server)
        .post('/api/books')
        .send({})
        .end(function(err, res){
          assert.equal(res.status, 200);
          assert.equal(res.text, 'missing required title');
          done();
        });
      });
      
    });


    suite('GET /api/books => array of books', function(){
      
      test('Test GET /api/books',  function(done){
        chai.request(server)
          .get('/api/books')
          .query({})
          .end(function(err, res){
            assert.equal(res.status, 200);
            assert.isArray(res.body, 'response should be an array');
            assert.property(res.body[0], 'commentcount', 'Books in array should contain commentcount');
            assert.property(res.body[0], 'title', 'Books in array should contain title');
            assert.property(res.body[0], '_id', 'Books in array should contain _id');
            id = res.body[0]._id;
            done();
          });
      });      
      
    });


    suite('GET /api/books/[id] => book object with [id]', function(){
      
      test('Test GET /api/books/[id] with id not in db',  function(done){
        chai.request(server)
          .get('/api/books/111111111111111111111111')
          .end(function(err, res){
            assert.equal(res.status, 200);
            assert.equal(res.text, 'no book exists');
            done();
          });
      });
      
      test('Test GET /api/books/[id] with valid id in db',  function(done){
        chai.request(server)
          .get('/api/books/' + id)
          .end(function(err, res){
            assert.equal(res.status, 200);
            assert.equal(res.body._id, id);
            assert.isArray(res.body.comments);
            done();
          });
      });
      
    });


    suite('POST /api/books/[id] => add comment/expect book object with id', function(){
      
      test('Test POST /api/books/[id] with comment', function(done){
       chai.request(server)
        .post('/api/books/' + id)
        .send({comment: 'Added comment'})
        .end(function(err, res){
          assert.equal(res.status, 200);
          assert.equal(res.body._id, id);
          assert.isArray(res.body.comments);
          assert.include(res.body.comments, 'Added comment')
          done();
        });
      });
      
    });
    
    
    suite('DELETE /api/books/[id] => text', function() {
           
      test('One delete successful', function(done) {
        chai.request(server)
          .delete('/api/books/' + id)
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.equal(res.text, 'delete successful');
            done();
          });         
      });
      
    });
    
    
    suite('DELETE /api/books => text', function(){
      
      test('Complete successful delete', function(done){
       chai.request(server)
        .delete('/api/books')
        .end(function(err, res){
          assert.equal(res.status, 200);
          assert.equal(res.text, 'complete delete successful');
          done();
        });
      });
      
    });
    
  });

});
