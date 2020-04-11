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

  MongoClient.connect(CONNECTION_STRING, { useNewUrlParser: true}, (err, client) => {
    if(err) {
      console.log('Database error: ' + err);
    } else {
      console.log('Successful database connection');    
      const db = client.db('issueTracker');

      app.route('/api/issues/:project')
        // I can GET /api/issues/{projectname} for an array of all issues on that 
        // specific project with all the information for each issue as was returned when posted.
        .get(function (req, res){
          var project = req.params.project;
          var query = req.query;
          db.collection(project).find(query).toArray((err, doc) => {
            if (err) console.error(err);
            res.send(doc);
          });
        })
        // I can POST /api/issues/{projectname} with form data containing:
        // required: issue_title, issue_text and created_by
        // optional: assigned_to and status_text.
        .post(function (req, res){
          var project = req.params.project;

          // The object saved (and returned) will include all of those fields (blank for optional no input)
          // and also include created_on(date/time), updated_on(date/time), open(boolean, true for open, false for closed), and _id.
          let issue = {
            issue_title : req.body.issue_title,
            issue_text : req.body.issue_text,
            created_by : req.body.created_by,
            assigned_to : req.body.assigned_to || '',
            status_text : req.body.status_text || '',
            created_on : new Date(),
            updated_on : new Date(),
            open : true
          };
        
          // Save the object
          if(!issue.issue_title || !issue.issue_text || !issue.created_by) {
            res.send('missing required fields')
          } else {        
            db.collection(project).insertOne(issue, function(err, doc) {
              if (err) console.error(err);
              res.json(issue);
            });
          }
        })
        // I can PUT /api/issues/{projectname} with a _id and any fields in the object with a value to object said object.
        // Returned will be 'successfully updated' or 'could not update '+_id. This should always update updated_on. 
        // If no fields are sent return 'no updated field sent'.
        .put(function (req, res){
          var project = req.params.project;
          
          if (Object.keys(req.body).length === 1) {
            res.send('no updated field sent');
          } else {
            let issue = {
              _id: ObjectId(req.body._id),
              issue_title : req.body.issue_title || '',
              issue_text : req.body.issue_text || '',
              created_by : req.body.created_by || '',
              assigned_to : req.body.assigned_to || '',
              status_text : req.body.status_text || '',
              updated_on : new Date(),
              open : req.body.open === 'false' ? false : true
            };
            
            Object.keys(issue).forEach(function (key) {
              if (issue[key] === '') {
                delete issue[key];
              }
            });

            db.collection(project)
              .findOneAndUpdate(
                {_id: issue['_id']},
                {$set: issue},
                function(err, doc) {
                  if (err) {
                    res.send('could not update ' + issue['_id']);
                  } else {
                    res.send('successfully updated ' + issue['_id']); 
                  }
                });
          }
        })
        // I can DELETE /api/issues/{projectname} with a _id to completely delete an issue.
        // If no _id is sent return '_id error', success: 'deleted '+_id, failed: 'could not delete '+_id.
        .delete(function (req, res){
          var project = req.params.project;
          if (!req.body._id) {
            res.send('_id error');
          } else {
            db.collection(project).findOneAndDelete({_id: ObjectId(req.body._id)}, function(err, doc) {
              if (err) {
                res.send('could not delete ' + ObjectId(req.body._id));
              } else {
                res.send('deleted ' + ObjectId(req.body._id)); 
              }
            });
          }
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
