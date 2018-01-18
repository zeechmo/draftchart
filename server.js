const express = require('express')  
const https = require('https')
const nodemailer = require('nodemailer')
const xml2js = require('xml2js')
const _ = require('underscore')
const config = require('./config')
const bodyParser = require("body-parser");
const csvtojson = require("csv-to-json");
const parentApp = express()  
const port = 3000

// server html
parentApp.use(express.static('public'))
// server js libaries
parentApp.use('/jquery', express.static(__dirname + '/node_modules/jquery/dist/'));
parentApp.use('/gridstack', express.static(__dirname + '/node_modules/gridstack/dist/'));
parentApp.use('/underscore', express.static(__dirname + '/node_modules/underscore/'));

//Here we are configuring express to use body-parser as middle-ware.
parentApp.use(bodyParser.urlencoded({ extended: false }));
parentApp.use(bodyParser.json());

parentApp.get('/', (request, response) => {  
  response.send('Hello from Express!')
})

parentApp.post('/email', (request, response) => {

	var players = request.body.players;
	var email = request.body.email;
	
	// create reusable transporter object using the default SMTP transport
	let transporter = nodemailer.createTransport({
		service: config.emailhost,
		auth: {
			user: config.emailuser,
			pass: config.emailpass
		}
	});
	
	// format html for email
	var players = _.values(players);
	let html = '<html><body><table>';
	html += '<p>Here are your custom draft rankings courtesy of <a href="http://www.draftchart.com">DraftChart</a>.</p>';
	html += '<th>Your Rank</th><th>Player</th><th>Position</th><th>Team</th>';
	for (var i = 0; i < players.length; i++) {

		var isDark = !!players[i].dark;
		html += '<tr><td>' + (!!players[i].favorite ? "&#9733;" : "") + '</td><td>' + (i+1) + '</td><td>' + (isDark ? '<s>' : '') + players[i].playerName + (isDark ? '</s>' : '') + '</td><td>' + players[i].position + '</td><td>' + players[i].team + '</td></tr>';
	}
	html += '</table></body><p>Good Luck!</p><p>Your friends at <a href="http://www.draftchart.com">DraftChart</a></html>';

	// setup email data with unicode symbols
	let mailOptions = {
		from: '"Support" <draftchart@gmail.com>', // sender address
		to: email, // list of receivers
		subject: 'DraftChart - Custom Fantasy Football Rankings', // Subject line
		text: '', // plain text body
		html: html // html body
	};

	// send mail with defined transport object
	transporter.sendMail(mailOptions, (error, info) => {
		if (error) {
			console.log(error);
			response.send(JSON.stringify({
				"errorMsg": error
			}));
		}
		console.log('Message %s sent: %s', info.messageId, info.response);
		response.send(JSON.stringify({
			success: true
		}));
	});
})

parentApp.get('/draftboard', (request, response) => {  

	var format = request.query.format || 'standard';
	var teams = request.query.teams;
	
	if (teams === '8 team') {
		teams = 8;
	}
	else if (teams === '10 team') {
		teams = 10;
	}
	else if (teams === '12 team') {
		teams = 12;
	}
	else if (teams === '14 team') {
		teams = 14;
	}
	else {
		teams = 12;
	}
	
	var obj = {
		filename: format === "PPR" ? 'public/ppr_rank.csv' : 'public/standard_rank.csv'
	};
	csvtojson.parse(obj, function(err, json) {
		response.send(JSON.stringify(json));
	});
	
	
	
	/*
	var options = {
		host: 'fantasyfootballcalculator.com',
		port: 443,
		path: '/adp_xml.php?format=' + format + '&teams=' + teams,
		rejectUnauthorized: false,
		requestCert: true,
		agent: false
	};
	
	https.get(options, function(resp){
		resp.setEncoding('utf8');
		
		let allData = "";
		
		resp.on('data', function(chunk){
			allData += chunk;
		});
		resp.on('end', function() {
			
			var xml = allData;
			xml2js.parseString(xml, function(err, result) {
				
				// parse xml into meaningful data to send to client
				var players = result.root.adp_data[0].player;
				
				var results = [];
				for (var i = 0; i < players.length; i++) {
					
					results.push({
						"playerName": players[i].name[0],
						"position": players[i].pos[0],
						"team": players[i].team[0]
					});
				}
				
				response.send(JSON.stringify(results));
			});
			
		});
	}).on("error", function(e){
		console.log("Got error: " + e.message);
	});
	*/
})


parentApp.listen(port, (err) => {  
  if (err) {
    return console.log('something bad happened', err)
  }

  console.log(`server is listening on ${port}`)
})