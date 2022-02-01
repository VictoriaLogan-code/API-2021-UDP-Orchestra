/*
 This program simulates a "smart" musician, which publishes its sound
 on a multicast group. Other programs can join the group and receive the sounds. The
 sounds are transported in json payloads with the following format:

 {"uuid" : "aa7d8cb3-a15f-4f06-a0eb-b8feb6244a60","instrument" : "piano","activeSince" : "2016-04-27T05:20:50.731Z"}

 Usage: to start a musician, type the following command in a terminal
        (of course, you can run several musicians in parallel and observe that all
        are transmitted via the multicast group):
   docker run -d api/musician instrument_name 

instrument_name can be piano, trumpet, flute, violin or drum
*/

var protocol = require('./orchestra-protocol');

/*
 * We use a standard Node.js module to work with UDP
 */
var dgram = require('dgram');

/*
 * We use a standard Node.js module to work with uuid
 */
const { v4: uuidv4 } = require(‘uuid’);

/*
 * Let's create a datagram socket. We will use it to send our UDP datagrams 
 */
var s = dgram.createSocket('udp4');

/* 
* We take note of the time of the first play of the musician
*/
const firstPlay = new Date(now());

/*
 * Let's define a javascript class for our musician. The constructor accepts
 * a name of instrument and will create an uuidv4
 */
function Musician(instrument) {

	this.instrument = instrument;
	this.uuid = uuidv4();
	this.activeSince = firstPlay.toISOString();

/*
   * We will the play function, so we can create the payload to send to the auditors
   */
	Musician.prototype.play = function() {

/*
	* Let's create the infos as a dynamic javascript object, 
	  * add the 3 properties (uuid, instrument and the time it started playing)
	  * and serialize the object to a JSON string
	  */
		var musicianInfos = {
			uuid: this.uuid,
			instrument: this.instrument,
			activeSince: this.activeSince
		};
		var payload = JSON.stringify(musicianInfos);

/*
	   * Finally, let's encapsulate the payload in a UDP datagram, which we publish on
	   * the multicast address. All subscribers to this address will receive the message.
	   */
		message = new Buffer(payload);
		s.send(message, 0, message.length, protocol.PROTOCOL_PORT, protocol.PROTOCOL_MULTICAST_ADDRESS, function(err, bytes) {
			console.log("Musician playing: " + payload);
		});

	}

/*
* Let's send a sound every 100 ms
*/
	setInterval(this.play.bind(this), 100);

}

/*
 * Let's get the musician properties from the command line attributes
 */
var instrument = process.argv[2];

/*
 * Let's create a new musician - the regular publication of musician will
 * be initiated within the constructor
 */
var t1 = new Musician(instrument);