/*
 This program simulates a "data collection auditor", which joins a multicast
 group in order to receive the informations of musicians playing.
 The infos are transported in json payloads with the following format:

   {"uuid" : "aa7d8cb3-a15f-4f06-a0eb-b8feb6244a60","sound" : "ti-ta-ti"}

It then sends the informations of active musicians to a client, with the following format

   {"uuid" : "aa7d8cb3-a15f-4f06-a0eb-b8feb6244a60","instrument" : "piano","activeSince" : "2016-04-27T05:20:50.731Z"}

 Usage: to start the auditor, use the following command in a terminal

   docker run -d -p 2205:2205 api/auditor
*/

/*
 * We have defined the multicast address and port in a file, that can be imported both by
 * auditor.js and musician.js. The address and the port are part of our simple 
 * application-level protocol
 */
const protocol = require('./orchestra-protocol');

/*
 * Adding of different useful modules
 */
const dgram = require('dgram');
var net = require('net');
var moment = require('moment');

/* 
 * Let's create a datagram socket. We will use it to listen for datagrams published in the
 * multicast group by musicians and containing its infos
 */
const s = dgram.createSocket('udp4');
s.bind(protocol.PROTOCOL_PORT, function() {
  console.log("Joining multicast group");
  s.addMembership(protocol.PROTOCOL_MULTICAST_ADDRESS);
});


/* 
 * Let's create a map to store the active musicians' infos, the key being the corresponding uuid
 */

var activeMusiciansMap = new Map();

/*
 * Let's create a second map to store the correspondances of a sound with its instrument
 */
const instrumentsOfSounds = new Map();

instrumentsOfSounds.set("ti-ta-ti", "piano");
instrumentsOfSounds.set("pouet", "trumpet");
instrumentsOfSounds.set("trulu", "flute");
instrumentsOfSounds.set("gzi-gzi", "violin");
instrumentsOfSounds.set("boum-boum", "drum");

/* 
 * This call back is invoked when a new datagram has arrived.
 */
s.on('message', function(msg, source) {
	
	console.log("Data has arrived: " + msg);
	
	// Let's store the infos received from UDP datagram in meaningful variables
	var datagramReceived = JSON.parse(msg);
	
	var infoMusicien = {
		uuid: datagramReceived.uuid,
		instrument: instrumentsOfSounds.get(datagramReceived.sound),
		activeSince: moment().toISOString()
	};
	
	/* 
	 * If the key (uuid) is already mapped, won't add a new element
	 */
	activeMusiciansMap.set(infoMusicien.uuid, infoMusicien);
	
});

/* 
 * Let's create a client server to whom we're gonna send an array of JSON payload
 */
var server = net.createServer(s => {
	
	// Let's create an array in which we will store all the active musicians infos
	var musicianInfos = new Array();
	
	// Check if a musician has not been playing a sound in the lasts 5 seconds, removes it from map if so, adds it to the array to send to the client if not
	for (let [key, value] of  activeMusiciansMap.entries()) {
		
		if(moment().diff(value.activeSince, 'seconds') > 5) {
			
			activeMusiciansMap.delete(key);
			
		} else {
			
			musicianInfos.push(value);
		}
	}
	s.end(JSON.stringify(musicianInfos));
	
});

// The client server listens to the ports defined in the protocol
server.listen(protocol.PROTOCOL_TCP_PORT, protocol.PROTOCOL_TCP_ADDRESS);





















