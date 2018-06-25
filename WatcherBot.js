const botConnect = require('workonflow-bot-client');
const express = require('express')
const mongoClient = require('mongodb').MongoClient;
const url = 'mongodb://localhost:27017';
const bodyParser = require('body-parser');
const app = express();
const port = 3000;
const log = botConnect.log;
const creds = require('./creds');

async function init() {
  const botClient = await botConnect.connect(creds);
  const mongo = await mongoClient.connect(url);
  const baseData = await mongo.db('clients');
  await baseData.collection('users');
  await baseData.collection('streams');


  await botClient.team.onUserRemoved({self: true}, callback); 
  async function callback(message) {
    const userId = message.headers.userId;
    const findUsers = await baseData.collection('users').find({userId: userId}).toArray();
    if(findUsers.length !== 0) {
      await baseData.collection('users').remove({userId: userId});
      return;
    }
    return;
  }

  botClient.comment.onDirect(callback1);
  async function callback1(message) {
    const userText = message.data.content.att[0].data.text;
    const userId = message.data.userId;
    const teamId = message.teamId;
    const findUsers = await baseData.collection('users').find({userId: userId}).toArray();
    if(findUsers.length === 0) {
      await baseData.collection('users').insert({userId: userId,     
        newStream: false
      });
      const query = {
        to: userId,
        att: [{type: 'text', data: {text: 'Hello, I’m Git watcher bot. It’s my job to keep track of updates in repositories. To get started, add me to a stream where you like to get update notifications. We can continue our chat there. '}}]
      }
      botClient.comment.create(teamId, query);
      await baseData.collection('users').update({userId: userId}, {$set: {newStream: true}}, {upsert: true});
      return;
    } else {
      query = {
        to: userId,
        att: [{type: 'text', data: {text: 'I’m sorry, I didn’t get that. Please try again!'}}]
      }
      botClient.comment.create(teamId, query);
      return;
    }
  }
    botClient.stream.onUserSet({self: true}, callback3);
    async function callback3(message) {
      const streamId = message.data.streamId;
      const teamId = message.teamId;
      const query = {
        streamId,
        att: [{type: 'text', data: {text: `Here’s the address where you can send a webhook. Indicate it in your repository and then type "ok": https://c26bb197.ngrok.io/${teamId}/${streamId}`}}]
      };
      botClient.comment.create(teamId, query);
      const findStreams = await baseData.collection('streams').find({streamId: streamId}).toArray();
      if(findStreams.length === 0) {
        await baseData.collection('streams').insert({streamId: streamId,
          answerUser: true
        });
      return;
      }

      return;
    }
  
    botClient.comment.onMention(callback4);
    async function callback4(message) {
      teamId = message.teamId;
      streamId = message.data.content.streamId;
      const findStreams = await baseData.collection('streams').find({streamId: streamId}).toArray();
      if (findStreams[0].answerUser === true) { 
      if (message.data.content.att[0].data.text.toLowerCase() === 'ok') {
        query = {
          streamId,
          att: [{type: 'text', data: {text: 'Excellent! I’ll send you notifications (commits, merge) in the chat for this stream. To finish the work of the deleted webhook created, and also do not forget to remove me from the stream'}}]
        };
        botClient.comment.create(teamId, query);
        await baseData.collection('streams').update({streamId: streamId}, {$set: {answerUser: false}}, {upsert: true});
        app.use(bodyParser.json())

        app.post(`/${teamId}/${streamId}`, function(request, response){
          teamId = request.url.substr(1, 24);
          streamId = request.url.substr(26, 24);
          const options = {
            weekday: 'long',
            year: 'numeric',
            month: 'long', 
            day: 'numeric',
            hour:'numeric',
            minute:'numeric',
            second:'numeric',
          };   
          if (request.body.hasOwnProperty('forkee') === true) {
              
            query = {
              streamId,
              att: [{type: 'text', data: {text: `${request.body.forkee.owner.login} fork repository "${request.body.forkee.name}" ${new Date().toLocaleDateString("ru-RU", options)}`}}]
            }
            botClient.comment.create(teamId, query);
  
            return;
          }
          if (request.body.hasOwnProperty('pull_request') === true) {
            query = {
              streamId,
              att: [{type: 'text', data: {text: `${request.body.pull_request.user.login} ${request.body.action} pull request. Title: ${request.body.pull_request.title}. Description: ${request.body.pull_request.body}. Date: ${new Date().toLocaleDateString("ru-RU", options)}`}}]
            }
            botClient.comment.create(teamId, query);
            return;
          }
          if (request.body.ref_type === 'branch') { 
            query = {
              streamId,
              att: [{type: 'text', data: {text: `${request.body.sender.login} created a branch "${request.body.ref} in repository ${request.body.repository.name}. Date: ${new Date().toLocaleDateString("ru-RU", options)} "`}}]
            }
            botClient.comment.create(teamId, query);
            return;
          }
          if (request.body.hasOwnProperty('pusher') === true) {
            query = {
              streamId,
              att: [{type: 'text', data: {text: `${request.body.pusher.name} push in repository "${request.body.repository.name}". Commit: "${request.body.head_commit.message}". Date: ${new Date().toLocaleDateString("ru-RU", options)} "`}}]
            }
            botClient.comment.create(teamId, query);
            return;
          }  
        
        return;
        });

    } 
  } else {
      query = {
        streamId, 
        att: [{type: 'text', data: {text: 'I’m sorry, I didn’t get that. Please try again!'}}]
      }
      botClient.comment.create(teamId, query);
      return;
    }
      return;
      
  }

    botClient.stream.onUserDeleted({self: true}, callback5);
    async function callback5(message) {
      const findStreams = await baseData.collection('streams').find({streamId: streamId}).toArray();
      await baseData.collection('streams').remove({streamId: streamId});
      return;
    }
  
app.listen(port, (err) => {
  if (err) {
    return console.log('something bad happened', err)
  }
  console.log(`server is listening on ${port}`)
})
}
init();