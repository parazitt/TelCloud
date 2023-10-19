"use strict"
// config
const SERVER = "https://my.domain.org" // nextcloud url root
const ADMIB = "ADMIN" // Your Nextcloud user.
const USER = "USER" // Nextcloud User You should create for your bot.
const PASS = "PASSWORD" // Password above user.
const room = 'ROOM_ID' // Chat RoomID (whene You open chat in the end of url eg: https://my.domain.org/call/ROOM_ID)
const token = '1234:fbhdfhdfsghjnsfjhnfgjnfgjndfgjndfgjh';

const TelegramBot =  require('node-telegram-bot-api');

const tbot = new TelegramBot(token, { polling: true,});

const https = require('https');

const cp = require('child_process');

const d = console.log

let request = (uri, data = false) => {
	if(data) data = JSON.stringify(data)

	let options = {
		method: data ? 'POST' : 'GET',
		headers: {
			'Authorization': 'Basic ' + Buffer.from(USER + ":" + PASS).toString('base64'),
			'Content-Type': 'application/json',
			'Accept':'application/json',
			'OCS-APIRequest': 'true'
		}
	}

	return new Promise((resolve, reject) => {
		const req = https.request(uri, options, (res) => {
			let responseBody = '';
			res.setEncoding('utf8');
			res.on('data', (chunk) => { responseBody += chunk })
			res.on('end', () => {
				try{
					responseBody = JSON.parse(responseBody)
				}catch(e){
					d(responseBody)
					responseBody = false
				}
				resolve(responseBody)
			})
		})
		req.on('error', (err) => { reject(err) })
		if(data) req.write(data)
		req.end()
	})
}

let execSync = (cmd) => {
	return cp.execSync(cmd,{encoding:'utf8'})
}

let sleep = (sec) => {
	return execSync(`sleep ${sec}`)
}

let NextcloudTalk_ReadLatest = async (lastKnownMessageId) => {
	let uri = `${SERVER}/ocs/v2.php/apps/spreed/api/v1/chat/${room}?lookIntoFuture=1&timeout=10&lastKnownMessageId=${lastKnownMessageId}&includeLastKnown=0`
	return await request(uri)
}

let NextcloudTalk_SendMessage = async (message) => {
	let uri = `${SERVER}/ocs/v2.php/apps/spreed/api/v1/chat/${room}`
	let r = await request(uri,{"token": room, "message": message})
	return r.ocs.data.id
}

let main = async () => {
	let lastId = await NextcloudTalk_SendMessage(`@${USER} Bot Starting.`)
	while(true){
		let lastMsg = await NextcloudTalk_ReadLatest(lastId)
		lastId = lastMsg ? lastMsg.ocs.data[0].id : lastId
		if(lastMsg) await       bot(lastMsg)
	}
}

let bot = async (lastMsg) => {
	let article = lastMsg.ocs.data[0]
	let actor = article.actorId
	let lastId = article.id
	if(article.message.substr(0,16) != "{mention-user1}\n"){
		let send = await tbot.sendMessage(token.split(":")[0], article.message);
	}
}

tbot.on('text', async (msg) =>  {
	const chatId = msg.chat.id;
	const text = msg.text;
	await NextcloudTalk_SendMessage("@${ADMIN}\n"+text);
});

main()
