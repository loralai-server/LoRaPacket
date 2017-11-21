/**
 * LoRaPacket 
 * (C) 2017 by Alexandru Radovici (alexandru.radovici@wyliodrin.com)
 * Released under the LGPL v3.0
 * 
 * Join functions
 * 
 */

'use strict';

var crypto = require ('crypto');
var validator = require ('validator');

var frame = require ('./frame.js');

// JOIN_REQUEST

var SIZE_JOIN_REQUEST_PAYLOAD = 18;

var SIZE_JOIN_REQUEST_NET_ID = 3;

var OFFSET_JOIN_REQUEST_APPEUI = 0;
var OFFSET_JOIN_REQUEST_DEVEUI = 8;
var OFFSET_JOIN_REQUEST_DEVNONCE = 16;

var OFFSET_NWK_ID_NET_ID = 0;
var BITS_NWK_ID_NET_ID = 0x00007F;
var OFFSET_NWK_ID_DEV_ADDR = 25;
var BITS_NWK_ID_DEV_ADDR = 0xFE000000;

var SIZE_DEVEUI = 8;
var SIZE_APPEUI = 8;
var SIZE_DEV_NONCE = 2;
var SIZE_APP_NONCE = 3;

var MAX_DEV_NONCE = Math.pow (2, SIZE_DEV_NONCE*8)-1;
var MAX_APP_NONCE = Math.pow (2, SIZE_APP_NONCE*8)-1;
var MAX_NET_ID = Math.pow (2, SIZE_JOIN_REQUEST_NET_ID*8)-1;

// var SIZE_MIC = 4;

// var SIZE_APP_KEY = 32;

// JOIN_ACCEPT

var SIZE_JOIN_ACCEPT_PAYLOAD = 12;
var SIZE_JOIN_ACCEPT_PAYLOAD_CF_LIST = 16;
var SIZE_JOIN_ACCEPT_FREQ = 3;

var MAX_RXDELAY = 255;

var OFFSET_JOIN_ACCEPT_APP_NONCE = 0;
var OFFSET_JOIN_ACCEPT_NET_ID = 3;
var OFFSET_JOIN_ACCEPT_DEV_ADDR = 6;
var OFFSET_JOIN_ACCEPT_DL_SETTINGS = 10;
var OFFSET_JOIN_ACCEPT_RX_DELAY = 11;
var OFFSET_JOIN_ACCEPT_CF_LIST = 12;

var MAX_RX1DROFFSET = 7;

var BITS_JOIN_ACCEPT_RX1DROFFSET = 0b01110000;
var OFFSET_JOIN_ACCEPT_RX1DROFFSET = 4;

var MAX_RX2DATARATE= 15;

var BITS_JOIN_ACCEPT_RX2DATARATE = 0b00001111;
var OFFSET_JOIN_ACCEPT_RX2DATARATE = 0;

var macError = require ('../mac/error.js');
// var log = require ('bunyan').getLogger ('lora.packet.mac.join');

function decodeJoinRequest (buffer, offset, length)
{
	if (length === SIZE_JOIN_REQUEST_PAYLOAD)
	{
		let payload = {
			appEUI: buffer.slice (offset+OFFSET_JOIN_REQUEST_APPEUI, offset+SIZE_APPEUI).toString ('hex').match(/.{2}/g).reverse().join('').toUpperCase (),
			devEUI: buffer.slice (offset+OFFSET_JOIN_REQUEST_DEVEUI, offset+OFFSET_JOIN_REQUEST_DEVEUI+SIZE_DEVEUI).toString ('hex').match(/.{2}/g).reverse().join('').toUpperCase (),
			devNonce: buffer.readUInt16LE (offset+OFFSET_JOIN_REQUEST_DEVNONCE)
		};
		// console.log ('devAddr: ');
		// console.log (frame.fhdr.devAddr.toString (16));
		return payload;
	}
	else
	{
		throw macError ('size', 'JOIN REQUEST payload size '+length);
	}
}

function encodeJoinRequest (mac, buffer, offset)
{
	if (!buffer)
	{
		buffer = new Buffer (SIZE_JOIN_REQUEST_PAYLOAD);
		offset = 0;
	}
	if (mac.payload.devEUI && mac.payload.devEUI.length === 2*SIZE_DEVEUI)
	{
		buffer.write (mac.payload.devEUI.match(/.{2}/g).reverse().join(''), offset+OFFSET_JOIN_REQUEST_DEVEUI, 2*SIZE_DEVEUI, 'hex');
	}
	else
	{
		throw ('deveui', 'deveui size '+mac.devEUI);
	}
	if (mac.payload.appEUI && mac.payload.appEUI.length === 2*SIZE_APPEUI)
	{
		buffer.write (mac.payload.appEUI.match(/.{2}/g).reverse().join(''), offset+OFFSET_JOIN_REQUEST_APPEUI, 2*SIZE_DEVEUI, 'hex');
	}
	else
	{
		throw ('appeui', 'appeui size '+mac.appEUI);
	}
	if (mac.payload.devNonce)
	{
		buffer.writeUInt16LE (mac.payload.devNonce, offset+OFFSET_JOIN_REQUEST_DEVNONCE);
	}
	else
	{
		throw ('devnonce', 'devnonce '+mac.payload.devNonce);
	}
	return buffer;
}

function deriveKeysFromAppKey (mac, appNonce, devNonce, netId, appKey)
{
	if (typeof (appKey) === 'string') appKey = new Buffer (appKey, 'hex');
	let aes128 = crypto.createCipheriv('aes-128-ecb', appKey, Buffer.alloc (0, 0));
	aes128.setAutoPadding (false);
	let bufferSize = 1+SIZE_APP_NONCE+SIZE_JOIN_REQUEST_NET_ID+SIZE_DEV_NONCE;
	if (bufferSize % 16 !== 0)
	{
		bufferSize = bufferSize / 16 + 16;
	}
	let keyBuffer = Buffer.alloc (bufferSize, 0);
	// for (let i = 0; i<appKey.length; i++)
	// {
	// 	keyBuffer.writeUInt8 (appKey.readUInt8(i), i);
	// }
	// write appNonetIdnce (3 bytes and first byte 0)
	keyBuffer.writeUInt32LE (appNonce, 1);
	keyBuffer.writeUInt32LE (netId, 1+SIZE_APP_NONCE);
	// write 1 for nwkSKey
	keyBuffer.writeUInt8 (1, 0);
	keyBuffer.writeUInt16LE (devNonce, 1+SIZE_APP_NONCE+SIZE_JOIN_REQUEST_NET_ID);
	// console.log (keyBuffer);
	let nwkSKey = aes128.update (keyBuffer);
	aes128 = crypto.createCipheriv('aes-128-ecb', appKey, Buffer.alloc (0, 0));
	aes128.setAutoPadding (false);
	// write 1 for appSKey
	keyBuffer.writeUInt8 (2, 0);
	// console.log (keyBuffer);
	let appSKey = aes128.update (keyBuffer);
	return {
		nwkSKey,
		appSKey
	};
}

function decodeJoinAccept (buffer)
{
	if (buffer.length === SIZE_JOIN_ACCEPT_PAYLOAD || buffer.length === SIZE_JOIN_ACCEPT_PAYLOAD + SIZE_JOIN_ACCEPT_PAYLOAD_CF_LIST)
	{
		let dlSettings = buffer.readUInt8 (OFFSET_JOIN_ACCEPT_DL_SETTINGS);
		let payload = {
			appNonce: (buffer.readUInt32LE (OFFSET_JOIN_ACCEPT_APP_NONCE) & 0x00FFFFFF),
			netId: (buffer.readUInt32LE (OFFSET_JOIN_ACCEPT_NET_ID) & 0x00FFFFFF),
			devAddr: buffer.readUInt32LE (OFFSET_JOIN_ACCEPT_DEV_ADDR),
			rx1DRoffset: (dlSettings & BITS_JOIN_ACCEPT_RX1DROFFSET) >>> OFFSET_JOIN_ACCEPT_RX1DROFFSET,
			rx2DataRate: (dlSettings & BITS_JOIN_ACCEPT_RX2DATARATE) >>> OFFSET_JOIN_ACCEPT_RX2DATARATE,
			rxDelay: buffer.readUInt8 (OFFSET_JOIN_ACCEPT_RX_DELAY),
		};
		// console.log (payload.netId.toString (16).toUpperCase ());
		if (buffer.length === SIZE_JOIN_ACCEPT_PAYLOAD + SIZE_JOIN_ACCEPT_PAYLOAD_CF_LIST)
		{
			let cfList = [];
			for (let cfListIndex = 0; cfListIndex <5 ; cfListIndex++)
			{
				let frequency = (buffer.readUInt32LE (OFFSET_JOIN_ACCEPT_CF_LIST+cfListIndex*SIZE_JOIN_ACCEPT_FREQ) & 0x00FFFFFF) * 100;
				cfList[cfListIndex] = frequency;
			}
			payload.cfList = cfList;
		}
		return payload;
	}
	else
	{
		throw macError ('size', 'JOIN ACCEPT payload size '+buffer.length);
	}
}

function decryptJoinAccept (buffer, key)
{
	// console.log (a);
	if (typeof (key) === 'string') key = new Buffer (key, 'hex');
	// console.log ('decrypt');
	// console.log (buffer);
	let aes128 = crypto.createCipheriv('aes-128-ecb', key, Buffer.alloc (0, 0));
	aes128.setAutoPadding (false);
	let payload = aes128.update (buffer);
	// console.log (payload);
	return payload;
}

function encryptJoinAccept (buffer, key)
{
	// console.log (a);
	if (typeof (key) === 'string') key = new Buffer (key, 'hex');
	let aes128 = crypto.createDecipheriv('aes-128-ecb', key, Buffer.alloc (0, 0));
	aes128.setAutoPadding (false);
	let payload = aes128.update (buffer);
	// console.log (payload);
	// console.log ('encrypt');
	// console.log (buffer);
	// console.log (payload);
	return payload;
}

function encodeJoinAccept (mac)
{
	let size = SIZE_JOIN_ACCEPT_PAYLOAD;
	if (mac.payload.cfList && mac.payload.cfList.length === 5) size = SIZE_JOIN_ACCEPT_PAYLOAD + SIZE_JOIN_ACCEPT_PAYLOAD_CF_LIST;
	// console.log (mac.payload.cfList.length);
	// console.log (size);
	let payload = new Buffer (size);
	// console.log (mac);
	// console.log (mac.payload.appNonce << 8);
	payload.writeUInt32LE (mac.payload.appNonce, OFFSET_JOIN_ACCEPT_APP_NONCE);
	// console.log (mac.payload.netId.toString(16).toUpperCase ());
	payload.writeUInt32LE (mac.payload.netId, OFFSET_JOIN_ACCEPT_NET_ID);
	payload.writeUInt32LE (mac.payload.devAddr, OFFSET_JOIN_ACCEPT_DEV_ADDR);
	// console.log (payload);
	let dlSettings = 0;
	dlSettings = dlSettings | (((mac.payload.rx1DRoffset << OFFSET_JOIN_ACCEPT_RX1DROFFSET)>>>0) & BITS_JOIN_ACCEPT_RX1DROFFSET);
	dlSettings = dlSettings | (((mac.payload.rx2DataRate << OFFSET_JOIN_ACCEPT_RX2DATARATE)>>>0) & BITS_JOIN_ACCEPT_RX2DATARATE);
	payload.writeUInt8 (dlSettings, OFFSET_JOIN_ACCEPT_DL_SETTINGS);
	payload.writeUInt8 (mac.payload.rxDelay, OFFSET_JOIN_ACCEPT_RX_DELAY);
	if (mac.payload.cfList)
	{
		if (mac.payload.cfList && mac.payload.cfList.length === 5)
		{
			for (let cfListIndex in mac.payload.cfList)
			{
				// console.log (OFFSET_JOIN_ACCEPT_CF_LIST+(cfListIndex*SIZE_JOIN_ACCEPT_FREQ));
				payload.writeUInt32LE (mac.payload.cfList[cfListIndex]/100, OFFSET_JOIN_ACCEPT_CF_LIST+(cfListIndex*SIZE_JOIN_ACCEPT_FREQ));
			}
			payload.writeUInt8 (0, OFFSET_JOIN_ACCEPT_CF_LIST+SIZE_JOIN_ACCEPT_PAYLOAD_CF_LIST-1);
		}
		else if (mac.payload.cfList.length !== 0)
		{
			throw new macError ('cflist', 'CFLIST length '+mac.payload.cfList.length);
		}
	}
	return payload;
}

function verifyDevEUI (devEUI)
{
	return typeof devEUI === 'string' && validator.isAlphanumeric (devEUI) && devEUI.length === SIZE_DEVEUI*2;
}

function verifyAppEUI (appEUI)
{
	return typeof appEUI === 'string' && validator.isAlphanumeric (appEUI) && appEUI.length === SIZE_APPEUI*2;
}

function verifyDevNonce (devNonce)
{
	return typeof devNonce === 'number' && devNonce >= 0 && devNonce <= MAX_DEV_NONCE;
}

function verifyAppNonce (appNonce)
{
	return typeof appNonce === 'number' && appNonce >= 0 && appNonce <= MAX_APP_NONCE;
}

function verifyRx1DRoffset (rx1DRoffset)
{
	return typeof rx1DRoffset === 'number' && rx1DRoffset >= 0 && rx1DRoffset <= MAX_RX1DROFFSET;
}

function verifyRx2DataRate (rx2DataRate)
{
	return typeof rx2DataRate === 'number' && rx2DataRate >= 0 && rx2DataRate <= MAX_RX2DATARATE;
}

function verifyRxDelay(rxDelay)
{
	return typeof rxDelay === 'number' && rxDelay >= 0 && rxDelay <= MAX_RXDELAY;
}

function verifyNetId (netId)
{
	return typeof netId === 'number' && netId >= 0 && netId <= MAX_NET_ID;
}

function verifyCFList (cfList)
{
	// TODO verify values
	return (!cfList || (Array.isArray (cfList) && (cfList.length === 0 || cfList.length === 5)));
}

function verifyNwkId (netId, devAddr)
{
	var verified = true;
	verified = verified && frame.verifyDevAddr (devAddr);
	verified = verified && verifyNetId (netId);
	// console.log ((netId & BITS_NWK_ID_NET_ID)>>>OFFSET_NWK_ID_NET_ID);
	// console.log ((devAddr & BITS_NWK_ID_DEV_ADDR)>>>OFFSET_NWK_ID_DEV_ADDR);
	if ((netId & BITS_NWK_ID_NET_ID)>>>OFFSET_NWK_ID_NET_ID !== (devAddr & BITS_NWK_ID_DEV_ADDR)>>>OFFSET_NWK_ID_DEV_ADDR)
	{
		verified = false;
	}
	return verified;
}

function verifyNetIdAndDevAddr (netId, devAddr)
{
	var verified = true;
	verified = verified && frame.verifyDevAddr (devAddr);
	verified = verified && verifyNetId (netId);
	verified = verified && verifyNwkId (netId, devAddr);
	return verified;
}

module.exports.SIZE = {
	DEV_EUI: SIZE_DEVEUI,
	APP_EUI: SIZE_APPEUI,
	DEV_NONCE: SIZE_DEV_NONCE,
	APP_NONCE: SIZE_APP_NONCE,
	NET_ID: SIZE_JOIN_REQUEST_NET_ID,
	RX1DROFFSET: 1,
	RX2DATARATE: 1,
	RXDELAY: 1
};

module.exports.decodeJoinRequest = decodeJoinRequest;
module.exports.encodeJoinRequest = encodeJoinRequest;
module.exports.decodeJoinAccept = decodeJoinAccept;
module.exports.encodeJoinAccept = encodeJoinAccept;
module.exports.deriveKeysFromAppKey = deriveKeysFromAppKey;
module.exports.decryptJoinAccept = decryptJoinAccept;
module.exports.encryptJoinAccept = encryptJoinAccept;
module.exports.verifyDevEUI = verifyDevEUI;
module.exports.verifyRx1DRoffset = verifyRx1DRoffset;
module.exports.verifyRx2DataRate = verifyRx2DataRate;
module.exports.verifyRxDelay = verifyRxDelay;
module.exports.verifyAppEUI = verifyAppEUI;
module.exports.verifyNetIdAndDevAddr = verifyNetIdAndDevAddr;
module.exports.verifyNetId = verifyNetId;
module.exports.verifyNwkId = verifyNwkId;
module.exports.verifyCFList = verifyCFList;
module.exports.verifyDevAddr = frame.verifyDevAddr;
module.exports.verifyDevNonce = verifyDevNonce;
module.exports.verifyAppNonce = verifyAppNonce;
