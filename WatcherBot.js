const botConnect = require('workonflow-bot-client');
const express = require('express')
const mongoClient = require('mongodb').MongoClient;
const url = 'mongodb://localhost:27017';
const bodyParser = require('body-parser');
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
    console.log('in>>>>>', findUsers);
    if(findUsers.length === 0) {
      await baseData.collection('users').insert({userId: userId,     
        newStream: false
      });
      const query = {
        to: userId,
        att: [{type: 'text', data: {text: 'Привет! Я Git watcher bot. Я помогаю следить за обновлениями в репозиториях. Чтобы начать работу, добавь меня в потоки, где ты хочешь получать обновления и мы продолжим работу в чатах этих потоков.'}}]
      }
      botClient.comment.create(teamId, query);
      await baseData.collection('users').update({userId: userId}, {$set: {newStream: true}}, {upsert: true});
      return;
    } else {
      query = {
        to: userId,
        att: [{type: 'text', data: {text: 'Извини я тебя не понял. Давай попробуем еще раз!'}}]
      }
      botClient.comment.create(teamId, query);
      return;
    }

    // if (findUsers[0].newStream === true) {
    
    //   const query = {
    //     to: userId,
    //     att: [{type: 'text', data: {text: 'Привет!'}}]
    //   }
    //   botClient.comment.create(teamId, query);
    //   await baseData.collection('users').update({userId: userId}, {$set: {newStream: false}}, {upsert: true});
    //   console.log('privet');
    //   return;
    // } else {
    //     query = {
    //       to: userId,
    //       att: [{type: 'text', data: {text: 'Извини я тебя не понял. Давай попробуем еще раз!'}}]
    //     }
    //     botClient.comment.create(teamId, query);
    //   return;
    // }
  }
    botClient.stream.onUserSet({self: true}, callback3);
    async function callback3(message) {
      streamId = message.data.streamId;
      teamId = message.teamId;
      query = {
        streamId,
        att: [{type: 'text', data: {text: `Вот адрес куда можно отправлять веб-хук, укажи его у себя в репозиторие, после этого напиши мне готово: https://f6e318ef.ngrok.io/${teamId}/${streamId}`}}]
      };
      botClient.comment.create(teamId, query);
      const findStreams = await baseData.collection('streams').find({streamId: streamId}).toArray();
      console.log('in>>>>>', findStreams);
      if(findStreams.length === 0) {
        await baseData.collection('streams').insert({streamId: streamId,
          answerUser: true
        });
      return;
      }
    }
  
    botClient.comment.onMention(callback4);
    async function callback4(message) {
      teamId = message.teamId;
      streamId = message.data.content.streamId;
      const findStreams = await baseData.collection('streams').find({streamId: streamId}).toArray();
      console.log('begin>>>', findStreams[0].answerUser);
      if (findStreams[0].answerUser === true) { 
      if (message.data.content.att[0].data.text.toLowerCase() === 'готово') {
        query = {
          streamId,
          att: [{type: 'text', data: {text: 'Отлично! Теперь я буду присылать уведомления (коммиты, мердж) в чате этого стрима. Чтобы прекратить работу, удали меня из потока'}}]
        };
        botClient.comment.create(teamId, query);
        // await baseData.collection('streams').update({streamId: streamId}, {$set: {answerUser: true}}, {upsert: true});
        app.listen(port, (err) => {
          if (err) {
            return console.log('something bad happened', err)
          }
          console.log(`server is listening on ${port}`)
        })

        app.use(bodyParser.json())

        app.post(`/${teamId}/${streamId}`, function(request, response){

          if (findStreams[0].answerUser === true) {
          if (request.body.hasOwnProperty('forkee') === true) {
            teamId = request.url.substr(1, 24);
            streamId = request.url.substr(26, 24);
            query = {
              streamId,
              att: [{type: 'text', data: {text: `${request.body.forkee.owner.login} fork repository`}}]
            }
            botClient.comment.create(teamId, query);
  
            return;
          }
          if (request.body.hasOwnProperty('pull_request') === true) {
            query = {
              streamId,
              att: [{type: 'text', data: {text: `${request.body.pull_request.user.login} ${request.body.action} pull request. Title: ${request.body.pull_request.title}. Description: ${request.body.pull_request.body}`}}]
            }
            botClient.comment.create(teamId, query);
            return;
          }  
        }
        return;
        });



      }else if(message.data.content.att[0].data.text.toLowerCase() === 'завершить') {
        query = {
          streamId,
          att: [{type: 'text', data: {text: 'Работа в данном чате завершена. Не забудь удалить меня из потока.'}}]
        }
        botClient.comment.create(teamId, query);
        await baseData.collection('streams').update({streamId: streamId}, {$set: {answerUser: false}}, {upsert: true});
        return;
      } else {
        query = {
          streamId, 
          att: [{type: 'text', data: {text: 'Извини я тебя не понял. Давай попробуем еще раз.'}}]
        }
        botClient.comment.create(teamId, query);
        return;
      }
      
    }
      return;
      
    }

    botClient.stream.onUserDeleted({self: true}, callback5);
    async function callback5(message) {
      // streamId = message.data.streamId;
      // const findStreams = await baseData.collection('streams').find({streamId: streamId}).toArray();
      // if(findStreams.length !== 0) {
      //   await baseData.collection('streams').remove({streamId: streamId});
      //   return;
      // }
      return;
    }
  return;
}
init();