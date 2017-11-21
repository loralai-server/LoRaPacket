/**
 * LoRaPacket 
 * (C) 2017 by Alexandru Radovici (alexandru.radovici@wyliodrin.com)
 * Released under the LGPL v3.0
 * 
 * Test 
 * 
 */

'use strict';

var assert = require ('assert');

var faker = require ('faker');

var uuid = require ('uuid');

var packs = require ('./packet.json');
var node = require ('./node.json');

var PACKS = 3;

function hexRandom (length)
{
	return uuid.v4().replace (/-/g, '').substring (0, length/4);
}

describe ('Up: Packets message integrity', function ()
{
	let LoRaPacket = require ('../index.js');

	// let packet = new LoRaPacket ('IDvvYWVPlHR9ekZsn0rk32zKGXPZRwTS1WsaG/vN6dXN', {appKey: '78D7443DDB788F032F35E10A5FC18709', encoding: 'hex'}, {encoding: 'base64'});
	// console.log (packet.toString ());
	// packet.reset ();
	// console.log (packet.pack ('base64'));
	
	for (let packetindex = 0; packetindex < PACKS; packetindex++)
	{
		let nwkSKey = node[packs[packetindex].node].nwkSKey;
		// let appSkey = node[packs[packetindex].node].appSKey;
		// let appKey = node[packs[packetindex].node].appKey;

		// console.log (packs[packetindex]);
		// console.log (node[packs[packetindex].node]);
		it ('Packet '+packs[packetindex].data, function ()
		{
			let packet = new LoRaPacket (packs[packetindex].data, {nwkSKey: nwkSKey, encoding: 'hex'}, 'base64');
			// console.log (mac);
			assert (packet.verifyMic ());
		});
	}

});

// describe ('Up LoraPacket: Packets message integrity', function ()
// {
// 	let LoRaPacket = require ('../index.js');
	
// 	for (let packetindex = 0; packetindex < PACKS; packetindex++)
// 	{
// 		let nwkSKey = node[packs[packetindex].node].nwkSKey;
// 		// let appSkey = node[packs[packetindex].node].appSKey;
// 		// let appKey = node[packs[packetindex].node].appKey;

// 		// console.log (packs[packetindex]);
// 		// console.log (node[packs[packetindex].node]);

// 		it ('Packet '+packs[packetindex].data, function ()
// 		{
// 			let packet = new LoRaPacket (packs[packetindex].data, {nwkSKey: nwkSKey, encoding: 'hex'}, 'base64');
// 			let lora = loraPacket.fromWire(new Buffer(packs[packetindex].data, 'base64'));
// 			// console.log (mac);
// 			assert (packet.verifyMic()===loraPacket.verifyMIC(lora, new Buffer (nwkSKey, 'hex')));
// 		});
// 	}

// });

describe ('Up: Packets recode', function ()
{
	let LoRaPacket = require ('../index.js');
	
	for (let packetindex = 0; packetindex < PACKS; packetindex++)
	{
		let nwkSKey = node[packs[packetindex].node].nwkSKey;
		let appSKey = node[packs[packetindex].node].appSKey;
		let appKey = node[packs[packetindex].node].appKey;

		// console.log (packs[packetindex]);
		// console.log (node[packs[packetindex].node]);
		it ('Packet '+packs[packetindex].data, function ()
		{
			let packet = new LoRaPacket (packs[packetindex].data, {nwkSKey: nwkSKey, appSKey: appSKey, appKey: appKey, encoding: 'hex'}, 'base64');
			// console.log (mac);
			// console.log (packet.verifyMic (mac, nwkSKey));
			// delete mac._original;
			let packetRecode = packet.pack ('base64');
			assert.equal (packs[packetindex].data, packetRecode);
		});
	}

});

describe ('Up: Packets recode', function ()
{
	let LoRaPacket = require ('../index.js');

	for (let packetindex = 0; packetindex < PACKS; packetindex++)
	{
		let nwkSKey = hexRandom (128);
		let appSKey = hexRandom (128);
		let appKey = hexRandom (128);

		// console.log (appSkey);

		// let mac = {
		// 	mtype: 2,
		// 	devAddr: faker.random.number (Math.pow (2, 32)-1),
		// 	fCtrl:
		// 	{
		// 		adr: faker.random.number (1),
		// 		adrAckReq: faker.random.number (1),
		// 		ack: faker.random.number (1),
		// 		pending: faker.random.number (1),
		// 		fOptsLen: 0
		// 	},
		// 	fCnt: faker.random.number (65535),
		// 	fPort: faker.random.number (255),
		// 	frmPayload: new Buffer (faker.internet.ip ())
		// };

		it ('Packet '+packetindex, function ()
		{
			let packet = new LoRaPacket ({
				mtype: faker.random.number (3)+2,
				devAddr: faker.random.number (Math.pow (2, 32)-1),
				fCtrl:
				{
					adr: faker.random.number (1),
					adrAckReq: faker.random.number (1),
					ack: faker.random.number (1),
					pending: faker.random.number (1),
					fOptsLen: 0
				},
				fCnt: faker.random.number (65535),
				fPort: faker.random.number (255),
				frmPayload: new Buffer (faker.internet.ip ())
			}, {nwkSKey: nwkSKey, appSkey: appSKey, appKey:appKey});
			let data = packet.pack ();	
			let macRecode = new LoRaPacket (data, {nwkSKey: nwkSKey, appSkey: appSKey, appKey:appKey});
			// console.log (data);
			// console.log (macRecode.verifyMic (nwkSKey));
			assert.equal (packet.getMHDR ('number'), macRecode.getMHDR ('number'));
			// TODO verify all fields
			assert.equal (packet.getFPort (), macRecode.getFPort ());
			assert.deepEqual (packet.getFrmPayload (), macRecode.getFrmPayload ());
		});
	}
});

describe ('Join Request: Packets recode', function ()
{
	let LoRaPacket = require ('../index.js');

	for (let packetindex = 0; packetindex < PACKS; packetindex++)
	{
		let nwkSKey = hexRandom (128);
		let appSKey = hexRandom (128);
		let appKey = hexRandom (128);

		// console.log (appSkey);

		// let mac = {
		// 	mhdr: {
		// 		mtype: 0,
		// 		rfu: 0,
		// 		major: 0
		// 	},
		// 	payload:
		// 	{
		// 		devEUI: hexRandom (64),
		// 		appEUI: hexRandom (64),
		// 		devNonce: faker.random.number (65535)
		// 	}
		// };

		it ('Packet '+packetindex, function ()
		{
			let packet = new LoRaPacket ({
				mtype: LoRaPacket.MTYPE.MTYPE_JOIN_REQUEST,
				devEUI: hexRandom (64),
				appEUI: hexRandom (64),
				devNonce: faker.random.number (65535)
			}, {nwkSKey: nwkSKey, appSKey:appSKey, appKey:appKey});
			let data = packet.pack ();		
			// console.log (data.toString ('base64'));
			let macRecode = new LoRaPacket (data, {nwkSKey: nwkSKey, appSKey:appSKey, appKey:appKey});
			// console.log (macRecode);
			assert.equal (packet.getMHDR ('number') , macRecode.getMHDR ('number'));
			assert.equal (packet.getDevEUI () , macRecode.getDevEUI ());
			assert.equal (packet.getAppEUI () , macRecode.getAppEUI ());
			assert.equal (packet.getDevNonce () , macRecode.getDevNonce ());
		});
	}
});

describe ('Join Accept: Packets recode', function ()
{
	let LoRaPacket = require ('../index.js');

	for (let packetindex = 0; packetindex < PACKS; packetindex++)
	{
		let nwkSKey = hexRandom (128);
		let appSKey = hexRandom (128);
		let appKey = hexRandom (128);

		// console.log (appSkey);

		// let mac = {
		// 	mhdr: {
		// 		mtype: 1,
		// 		rfu: 0,
		// 		major: 0
		// 	},
		// 	payload:
		// 	{
		// 		appNonce: faker.random.number (Math.pow (2, 24)-1),
		// 		netId: netId,
		// 		devAddr: devAddr,
		// 		rx1DROffset: faker.random.number (7),
		// 		rx2DataRate: faker.random.number (15),
		// 		rxDelay: faker.random.number (255),
		// 		cfList: []
		// 	}
		// };

		it ('Packet '+packetindex, function ()
		{
			let devAddr = faker.random.number (Math.pow (2, 32)-1);
			let nwkId = devAddr >>> 25;
			let netId = (faker.random.number (Math.pow (2, 17)-1) << 7)>>>0;
			// console.log (nwkId);
			netId = (netId) + nwkId;

			let packet = new LoRaPacket ({
				mtype: LoRaPacket.MTYPE.MTYPE_JOIN_ACCEPT,
				appNonce: faker.random.number (Math.pow (2, 24)-1),
				netId: netId,
				devAddr: devAddr,
				rx1DRoffset: faker.random.number (7),
				rx2DataRate: faker.random.number (15),
				rxDelay: faker.random.number (255)
			}, {nwkSKey: nwkSKey, appSKey:appSKey, appKey:appKey});

			let data = packet.pack ();		
			// console.log (data);
			let macRecode = new LoRaPacket (data, {nwkSKey: nwkSKey, appSKey:appSKey, appKey:appKey});
			// console.log (macRecode);
			assert.equal (packet.getMHDR ('number') , macRecode.getMHDR ('number'));
			assert.equal (packet.getAppNonce () , macRecode.getAppNonce ());
			assert.equal (packet.getNetId () , macRecode.getNetId ());
			assert.equal (packet.getDevAddr () , macRecode.getDevAddr ());
			assert.equal (packet.getRx1DRoffset () , macRecode.getRx1DRoffset ());
			assert.equal (packet.getRx2DataRate () , macRecode.getRx2DataRate ());
			assert.equal (packet.getRxDelay () , macRecode.getRxDelay ());
		});
	}
});




