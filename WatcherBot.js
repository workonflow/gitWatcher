const botConnect = require('workonflow-bot-client');
const express = require('express')
const mongoClient = require('mongodb').MongoClient;
const bodyParser = require('body-parser');
const url = 'mongodb://localhost:27017';
const app = express();
const port = 3000;
const log = botConnect.log;
const Creds = {
  email: 'gitWatcher@mail.ru',
  password: '123456'
};

async function init() {
  const botClient = await botConnect.connect(Creds);
  const mongo = await mongoClient.connect(url);
  const baseData = await mongo.db('clients');

  botClient.team.onUserInvited({self: true}, callback1); 
  async function callback1(message) {
    const userId = message.headers.userId;
    const findUsers = await baseData.collection('users').find({userId: userId}).toArray();
    console.log('in>>>>>', findUsers);
    if(findUsers.length === 0) {
      await baseData.collection('users').insert({userId: userId,     
        newStream: false, 
        userSet: false,
        answerUser: false
      });
      return;
    }
    return;
  }
  
  botClient.team.onUserRemoved({self: true}, callback2);
  async function callback2(message) {
    const userId = message.headers.userId;
    const findUsers = await baseData.collection('users').find({userId: userId}).toArray();
    if(findUsers.length !== 0) {
      await baseData.collection('users').remove
    }
  }
  
  botClient.comment.onDirect(callback);
  async function callback(message) {
    const userText = message.data.content.att[0].data.text;
    const userId = message.data.userId;
    const teamId = message.teamId;
    const findUsers = await baseData.collection('users').find({userId: userId}).toArray();
    console.log('in>>>>>', findUsers);
    // if(findUsers.length === 0) {
    //   await baseData.collection('users').insert({userId: userId,     
    //     newStream: false, 
    //     userSet: false,
    //     answerUser: false
    //   });
    //   return;
    // }
    // const answer = await baseData.collection('users').find({}).toArray(); 
    // console.log(JSON.stringify(answer));
    //if (State.newStream === false) {
    if (findUsers[0].newStream === false) {
      const query = {
        to: userId,
        att: [{type: 'text', data: {text: 'Привет! Я Git watcher bot. Я помогаю следить за обновлениями в репозиториях. Чтобы начать работу, добавь меня в потоки, где ты хочешь получать обновления и мы продолжим работу в чатах этих потоков.'}}]
      }
      botClient.comment.create(teamId, query);
      await baseData.collection('users').update({userId: userId}, {$set: {newStream: true}}, {upsert: true});
      console.log('privet');
      State.newStream = true;
      return;
    } else {
        query = {
          to: userId,
          att: [{type: 'text', data: {text: 'Извини я тебя не понял. Давай попробуем еще раз!'}}]
        }
        botClient.comment.create(teamId, query);
      return;
    }

  }
    botClient.stream.onUserSet({self: true}, cb);
    async function cb(message) {
      if (State.newStream === true) {
        console.log('Good');
        return;
      }
      streamId = message.data.streamId;
      teamId = message.teamId;
      query = {
        streamId,
        att: [{type: 'text', data: {text: `Вот адрес куда можно отправлять веб-хук, укажи его у себя в репозиторие, после этого напиши мне готово: https://b9099910.ngrok.io/${teamId}/${streamId}`}}]
      };
      botClient.comment.create(teamId, query);
      return;
    }
  
    botClient.comment.onMention(c);
    async function c(message) {
      teamId = message.teamId;
      streamId = message.data.content.streamId;
      // if (state)
      if (message.data.content.att[0].data.text.toLowerCase() === 'готово') {
        query = {
          streamId,
          att: [{type: 'text', data: {text: 'Отлично! Теперь я буду присылать уведомления (коммиты, мердж) в чате этого стрима. Чтобы прекратить работу, удали меня из потока'}}]
        };
        botClient.comment.create(teamId, query);
        app.use(bodyParser.json())
        // app.get('/', function(request, response) {
        // response.send('hello');
        // })
        app.post(`/${teamId}/${streamId}`, function(request, response){
        //console.log(request.url);
        //State.answerUser = true;
        //if (State.answerUser === true) {
          if (request.body.hasOwnProperty('forkee') === true) {
            //console.log(request.url.substring(1))
            teamId = request.url.substr(1, 24);
            streamId = request.url.substr(26, 24);
            query = {
              streamId,
              att: [{type: 'text', data: {text: `${request.body.forkee.owner.login} fork repository`}}]
            }
            botClient.comment.create(teamId, query);
            //console.log(`${request.body.forkee.owner.login} fork repository`);
            return;
          }
          if (request.body.hasOwnProperty('pull_request') === true) {
            query = {
              streamId,
              att: [{type: 'text', data: {text: `${request.body.pull_request.user.login} ${request.body.action} pull request. Title: ${request.body.pull_request.title}. Description: ${request.body.pull_request.body}`}}]
            }
            botClient.comment.create(teamId, query);
          }
          return;  
        //}
        //response.send(request.body);
        });    
        // меняю стейт
        // listen port
        return;
      } else {
        query = {
          streamId, 
          att: [{type: 'text', data: {text: 'Извини я тебя не понял. Давай попробуем еще раз.'}}]
        }
        botClient.comment.create(teamId, query);
      }

      return;
    }
    app.listen(port, (err) => {
      if (err) {
        return console.log('something bad happened', err)
      }

      console.log(`server is listening on ${port}`)
    })

  return;
}
init();