/*
*
*
*       FILL IN EACH FUNCTIONAL TEST BELOW COMPLETELY
*       -----[Keep the tests in the same order!]-----
*       (if additional are added, keep them at the very end!)
*/

var chaiHttp = require('chai-http');
var chai = require('chai');
var assert = chai.assert;
var expect = chai.expect;
var server = require('../server');

const delete_password = 'password';
const fakeId = '111111111111111111111111';
const totalThreads = 15;
const totalReplies = 5;

chai.use(chaiHttp);

suite('Functional Tests', function() {
  
  let id1, id2;  
  let replyId1, replyId2;

  suite('API ROUTING FOR /api/threads/:board', function() {
    
    suite('POST', function() {
      
      for (let i = 1; i <= totalThreads; i++) {
        test(`${i}: Every field filled in`, function(done) {
         chai.request(server)
          .post('/api/threads/boardTest')
          .send({
            text: `Text ${i} for boardTest`,
            delete_password: delete_password
          })
          .end(function(err, res){
            assert.equal(res.status, 200);
            expect(res).to.redirect;
            done();
          });        
        });     
      }
      
      test('Missing required fields', function(done) {
        chai.request(server)
          .post('/api/threads/boardTest')
          .send({})
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.equal(res.text, 'missing required fields');
            done();
          });        
      });      
      
    });
    
    suite('GET', function() {
      
      test('Request max. of 10 threads from boardTest', function(done) {
       chai.request(server)
        .get('/api/threads/boardTest')
        .end(function(err, res){
          assert.equal(res.status, 200);
          assert.isAtMost(res.body.length, 10);
          assert.property(res.body[0], 'text');
          assert.property(res.body[0], 'created_on');
          assert.property(res.body[0], 'bumped_on');
          assert.notProperty(res.body[0], 'reported');
          assert.notProperty(res.body[0], 'delete_password');
          assert.isArray(res.body[0].replies);
          assert.isAtMost(res.body[0].replies.length, 3);
          if (res.body[0].replies.length > 0) {
            assert.property(res.body[0].replies[0], 'text');
            assert.property(res.body[0].replies[0], 'created_on');
            assert.notProperty(res.body[0].replies[0], 'reported');
            assert.notProperty(res.body[0].replies[0], 'delete_password');             
          }
          id1 = res.body[0]._id;
          id2 = res.body[1]._id;
          done();
        });        
      });       
      
    });
    
    suite('DELETE', function() {
      
      test('Missing required fields', function(done) {
        chai.request(server)
          .post('/api/threads/boardTest')
          .send({})
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.equal(res.text, 'missing required fields');
            done();
          });        
      });       
      
      test('Non-existent thread_id', function(done) {
        chai.request(server)
          .delete('/api/threads/boardTest')
          .send({
            thread_id: fakeId,
            delete_password: delete_password
          })
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.equal(res.text, 'incorrect board, thread_id or password');
            done();
          });           
      });     
      
      test('Incorrect password', function(done) {
        chai.request(server)
          .delete('/api/threads/boardTest')
          .send({
            thread_id: id1,
            delete_password: '1234'
          })
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.equal(res.text, 'incorrect board, thread_id or password');
            done();
          });           
      });       
      
      test('Successfull delete', function(done) {
        chai.request(server)
          .delete('/api/threads/boardTest')
          .send({
            thread_id: id2,
            delete_password: delete_password
          })
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.equal(res.text, 'success');
            done();
          });           
      });       
      
    });
    
    suite('PUT', function() {
      
      test('Missing required fields', function(done) {
        chai.request(server)
          .put('/api/threads/boardTest')
          .send({})
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.equal(res.text, 'missing required fields');
            done();
          });        
      });   
      
      test('Non-existent thread_id', function(done) {
        chai.request(server)
          .put('/api/threads/boardTest')
          .send({thread_id: fakeId})
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.equal(res.text, `could not update thread ${fakeId}`);
            done();
          });        
      });     
      
      test('Successfull thread reported', function(done) {
        chai.request(server)
          .put('/api/threads/boardTest')
          .send({thread_id: id1})
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.equal(res.text, 'success');
            done();
          });           
      });       
      
    });    

  });
  
  suite('API ROUTING FOR /api/replies/:board', function() {
    
    suite('POST', function() {

      for (let i = 1; i <= totalReplies; i++) {
        test(`${i}: Every field filled in`, function(done) {          
         chai.request(server)
          .post('/api/replies/boardTest')
          .send({
            thread_id: id1,
            text: `Text ${i} reply to boardTest - Thread id: ${id1}`,
            delete_password: delete_password
          })
          .end(function(err, res){
            assert.equal(res.status, 200);
            expect(res).to.redirect;
            done();
          });        
        });   
      }
      
      test('Missing required fields', function(done) {
        chai.request(server)
          .post('/api/replies/boardTest')
          .send({})
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.equal(res.text, 'missing required fields');
            done();
          });        
      });   
      
      test('Non-existent thread_id', function(done) {
        chai.request(server)
          .post('/api/replies/boardTest')
          .send({
            thread_id: fakeId,
            text: `Text reply to boardTest - Thread id: ${fakeId}`,
            delete_password: delete_password
          })
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.equal(res.text, `could not update thread ${fakeId}`);
            done();
          });        
      });      
      
    });
    
    suite('GET', function() {
      
      test('Request entire thread with all replies from boardTest', function(done) {
       chai.request(server)
        .get('/api/replies/boardTest')
        .query({thread_id : id1})
        .end(function(err, res){
          assert.equal(res.status, 200);          
          assert.property(res.body, 'text');
          assert.property(res.body, 'created_on');
          assert.property(res.body, 'bumped_on');
          assert.notProperty(res.body, 'reported');
          assert.notProperty(res.body, 'delete_password');
          assert.isArray(res.body.replies);    
          assert.equal(res.body.replies.length, totalReplies);
          assert.property(res.body.replies[0], 'text');
          assert.property(res.body.replies[0], 'created_on');
          assert.notProperty(res.body.replies[0], 'reported');
          assert.notProperty(res.body.replies[0], 'delete_password');  
          replyId1 = res.body.replies[0]._id;
          replyId2 = res.body.replies[1]._id;
          done();
        });        
      });       
      
    });
    
    suite('PUT', function() {
      
      test('Missing required fields', function(done) {
        chai.request(server)
          .put('/api/replies/boardTest')
          .send({})
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.equal(res.text, 'missing required fields');
            done();
          });        
      });   
      
      test('Non-existent thread_id', function(done) {
        chai.request(server)
          .put('/api/replies/boardTest')
          .send({
            thread_id: fakeId,
            reply_id: replyId2
          })
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.equal(res.text, 'incorrect board, thread_id or reply_id');
            done();
          });        
      });    
      
      test('Non-existent reply_id', function(done) {
        chai.request(server)
          .put('/api/replies/boardTest')
          .send({
            thread_id: id1,
            reply_id: fakeId
          })
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.equal(res.text, 'incorrect board, thread_id or reply_id');
            done();
          });           
      });       
      
      test('Successfull reply reported', function(done) {
        chai.request(server)
          .put('/api/replies/boardTest')
          .send({
            thread_id: id1,
            reply_id: replyId2
          })
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.equal(res.text, 'success');
            done();
          });           
      });       
      
    });
    
    suite('DELETE', function() {
      
      test('Missing required fields', function(done) {
        chai.request(server)
          .post('/api/replies/boardTest')
          .send({})
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.equal(res.text, 'missing required fields');
            done();
          });        
      });      
      
      test('Non-existent thread_id', function(done) {
        chai.request(server)
          .delete('/api/replies/boardTest')
          .send({
            thread_id: fakeId,
            reply_id: replyId1,
            delete_password: delete_password
          })
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.equal(res.text, 'incorrect board, thread_id, reply_id or password');
            done();
          });           
      });  
      
      test('Non-existent reply_id', function(done) {
        chai.request(server)
          .delete('/api/replies/boardTest')
          .send({
            thread_id: id1,
            reply_id: fakeId,
            delete_password: delete_password
          })
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.equal(res.text, 'incorrect board, thread_id, reply_id or password');
            done();
          });           
      });       
      
      test('Incorrect password', function(done) {
        chai.request(server)
          .delete('/api/replies/boardTest')
          .send({
            thread_id: id1,
            reply_id: replyId1,
            delete_password: '1234'
          })
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.equal(res.text, 'incorrect board, thread_id, reply_id or password');
            done();
          });           
      });    
      
      test('Successfull delete', function(done) {
        chai.request(server)
          .delete('/api/replies/boardTest')
          .send({
            thread_id: id1,
            reply_id: replyId1,
            delete_password: delete_password
          })
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.equal(res.text, 'success');
            done();
          });           
      });       
      
    });
    
  });

});
