/**
 * LoRaPacket 
 * (C) 2017 by Alexandru Radovici (alexandru.radovici@wyliodrin.com)
 * Released under the LGPL v3.0
 * 
 * MAC functions 
 * 
 */

'use strict';

// var log = require ('bunyan').getLogger ('lora.packet.mac');

var debug = require ('debug')('lora.packet.mac');

var frame = require ('../frame/frame.js');

var macError = require ('./error.js');

var join = require ('../frame/join.js');
var mic = require ('./mic.js');

var SIZE_KEY = 128/8;

var BITS_MAC_MTYPE = 0b11100000;
var OFFSET_MAC_MTYPE = 5;
var BITS_MAC_RFU = 0b00011100;
var OFFSET_MAC_RFU = 2;
var BITS_MAC_MAJOR = 0b00000011;

var MAX_MAC_RFU = 7;
var MIN_MAC_RFU = 0;
var MAX_MAC_MAJOR = 0;
var MIN_MAC_MAJOR = 0;

var MIN_MAC_LENGTH = 5;

var SIZE_MIC = 4;

var MTYPE_JOIN_REQUEST = 0b000;
var MTYPE_JOIN_ACCEPT = 0b001;
var MTYPE_UNCONFIRMED_DATA_UP = 0b010;
var MTYPE_UNCONFIRMED_DATA_DOWN = 0b011;
var MTYPE_CONFIRMED_DATA_UP = 0b100;
var MTYPE_CONFIRMED_DATA_DOWN = 0b101;
var MTYPE_RFU = 0b110;
var MTYPE_PROPIETARY = 0b111;

var STRING_MTYPE = {
	[MTYPE_JOIN_REQUEST]: 'Join Request',
	[MTYPE_JOIN_ACCEPT]: 'Join Accept',
	[MTYPE_UNCONFIRMED_DATA_UP]: 'Unconfirmed Uplink',
	[MTYPE_UNCONFIRMED_DATA_DOWN]: 'Unconfirmed Downlink',
	[MTYPE_CONFIRMED_DATA_UP]: 'Confirmed Uplink',
	[MTYPE_CONFIRMED_DATA_DOWN]: 'Confirmed Downlink',
	[MTYPE_RFU]: 'RFU',
	[MTYPE_PROPIETARY]: 'Propietary',
};

function decode (buffer, appSKey, netSKey, appKey)
{
	if (typeof buffer === 'string') buffer = new Buffer (buffer, 'base64');
	if (buffer.length >= MIN_MAC_LENGTH)
	{
		var mhdr = buffer.readUInt8 (0);
		var mac = {
			_original: buffer,
			mhdr: decodeMhdr (mhdr)
		};
		mac._mhdr = buffer.readUInt8 (0);
		mac._macPayloadOffset = 1;
		mac._macPayloadLength = buffer.length-1-SIZE_MIC;
		if (mac.mhdr.mtype === MTYPE_JOIN_ACCEPT)
		{
			if (appKey)
			{
				let payload = join.decryptJoinAccept (buffer.slice (1), appKey);
				for (let i = 0; i < payload.length; i++)
				{
					buffer.writeUInt8 (payload.readUInt8(i), i+1);
				}
			}
			else
			{
				debug ('decode: appKey is not available, unable to decrypt Join Accept');
				throw new Error ('decode: appKey is not available, unable to decrypt Join Accept');
			}
		}
		mac.mic = buffer.readUInt32LE (buffer.length-SIZE_MIC);
		if (mac.mhdr.mtype >= MTYPE_UNCONFIRMED_DATA_UP && mac.mhdr.mtype <= MTYPE_CONFIRMED_DATA_DOWN)
		{
			mac.frame = frame.decodeFramePacket (mac, buffer, mac._macPayloadOffset, mac._macPayloadLength, netSKey, appSKey);
		}
		else
		if (mac.mhdr.mtype === MTYPE_JOIN_REQUEST)
		{
			mac.payload = join.decodeJoinRequest (buffer, mac._macPayloadOffset, mac._macPayloadLength, appKey);
		}
		else
		if (mac.mhdr.mtype === MTYPE_JOIN_ACCEPT)
		{
			// console.log (buffer.length);
			// buffer = join.decryptJoinAccept (buffer, appKey);
			mac.payload = join.decodeJoinAccept (buffer.slice (1, mac._macPayloadLength+1));
		}
		else
		{
			mac.payload = buffer.slice (1, buffer.length-1-SIZE_MIC);
		}
		return mac;
	}
	else
	{
		
		throw macError ('size', 'MAC size '+buffer.length);
	}
}

function encodePayload (mac, appKey)
{
	if (mac.mhdr.mtype === MTYPE_CONFIRMED_DATA_UP || mac.mhdr.mtype === MTYPE_CONFIRMED_DATA_DOWN || mac.mhdr.mtype === MTYPE_UNCONFIRMED_DATA_UP || mac.mhdr.mtype === MTYPE_UNCONFIRMED_DATA_DOWN)
	{
		mac.macPayload = frame.encodeFramePacket (mac);
	}
	else
	if (mac.mhdr.mtype === MTYPE_JOIN_REQUEST)
	{
		mac.macPayload = join.encodeJoinRequest (mac);
	}
	else
	if (mac.mhdr.mtype === MTYPE_JOIN_ACCEPT)
	{
		if (!appKey)
		{
			throw new Error ('appKey is not available, unable to encrypt Join Accept');
		}
		mac.macPayload = join.encodeJoinAccept (mac, appKey);
	}
	else
	{
		throw macError ('mtype', 'unknown mtype '+mac.mhdr.mtype);
	}
}

function encode (mac, netSKey, appKey)
{
	let mhdr = encodeMhdr (mac.mhdr);
	// console.log (mhdr);
	encodePayload (mac, appKey);
	// console.log (mac);
	if (mac.mhdr.mtype !== MTYPE_JOIN_REQUEST && mac.mhdr.mtype !== MTYPE_JOIN_ACCEPT)
	{
		if (!netSKey)
		{
			throw new Error ('netSKey is not available, unable to resolve mic');
		}
		mac.mic = computeMic (mac, netSKey);
	}
	else
	{
		if (!appKey)
		{
			throw new Error ('appKey is not available, unable to resolve mic');
		}
		mac.mic = computeMic (mac, appKey);
	}
	// console.log (1+mac.macPayload.length+SIZE_MIC);
	let buffer;
	if (mac.mhdr.mtype === MTYPE_JOIN_ACCEPT)
	{
		buffer = new Buffer (mac.macPayload.length+SIZE_MIC);
		// console.log (1+mac.macPayload.length+SIZE_MIC);
		for (let l = 0; l<mac.macPayload.length; l++)
		{
			// console.log (l);
			buffer.writeUInt8 (mac.macPayload.readUInt8 (l), l);
		}
		buffer.writeUInt32LE (mac.mic, mac.macPayload.length);
		// buffer.writeUInt32LE (mac.mic,1+mac.macPayload.length);
		// console.log (buffer);
		let payload = join.encryptJoinAccept (buffer, appKey);
		buffer = new Buffer (1+payload.length);
		// console.log (1+mac.macPayload.length+SIZE_MIC);
		buffer.writeUInt8 (mhdr, 0);
		for (let l = 0; l<payload.length; l++)
		{
			// console.log (l);
			buffer.writeUInt8 (payload.readUInt8 (l), l+1);
		}
		// console.log (buffer);
		// console.log (buffer);
	}
	else
	{
		buffer = new Buffer (1+mac.macPayload.length+SIZE_MIC);
		// console.log (1+mac.macPayload.length+SIZE_MIC);
		buffer.writeUInt8 (mhdr, 0);
		for (let l = 0; l<mac.macPayload.length; l++)
		{
			// console.log (l);
			buffer.writeUInt8 (mac.macPayload.readUInt8 (l), l+1);
		}
		buffer.writeUInt32LE (mac.mic,1+mac.macPayload.length);
		// console.log (buffer);
	}
	return buffer;
}

function encodeMhdr (mhdr)
{
	// console.log (mhdr);
	let valuemhdr = 0;
	valuemhdr = valuemhdr | ((mhdr.mtype << OFFSET_MAC_MTYPE)>>>0) & BITS_MAC_MTYPE;
	valuemhdr = valuemhdr | ((mhdr.rfu << OFFSET_MAC_RFU)>>>0) & BITS_MAC_RFU;
	valuemhdr = valuemhdr | (mhdr.major) & BITS_MAC_MAJOR;
	return valuemhdr;
}

function decodeMhdr (valuemhdr)
{
	return {
		mtype: (valuemhdr & BITS_MAC_MTYPE) >>> OFFSET_MAC_MTYPE,
		rfu: (valuemhdr & BITS_MAC_RFU) >>> OFFSET_MAC_RFU,
		major: (valuemhdr & BITS_MAC_MAJOR)
	};
}

function mhdrPlusPayload (mac, mhdr)
{
	let buffer = new Buffer (1+mac.macPayload.length);
	if (!mhdr) mhdr = encodeMhdr (mac.mhdr);
	buffer.writeUInt8 (mhdr, 0);
	for (let l = 0; l < mac.macPayload.length; l++)
	{
		buffer.writeUInt8 (mac.macPayload.readUInt8 (l), l+1);
	}
	return buffer;
}

function computeMic (mac, key, fromPayload)
{
	if (typeof key === 'string') key = new Buffer (key, 'hex');
	let bufferLength;
	let buffer;
	if (!fromPayload) buffer = mac._original;
	if (buffer)
	{
		bufferLength = buffer.length - SIZE_MIC;
	}
	// console.log (mac._original);
	// if (mac.macPayload) console.log (mhdrPlusPayload (mac));
	if (!buffer)
	{
		buffer = mhdrPlusPayload (mac);
		// console.log (mac._original);
		// console.log (buffer);
		bufferLength = buffer.length;
	}
	if (mac.mhdr.mtype === MTYPE_CONFIRMED_DATA_UP || mac.mhdr.mtype === MTYPE_CONFIRMED_DATA_DOWN || mac.mhdr.mtype === MTYPE_UNCONFIRMED_DATA_UP || mac.mhdr.mtype === MTYPE_UNCONFIRMED_DATA_DOWN)
	{
		let n = mic.computeFrame (mac, buffer, bufferLength, key);
		// console.log (n);
		// console.log (mac.mic);
		return n;
	}
	else
	if (mac.mhdr.mtype === MTYPE_JOIN_REQUEST || mac.mhdr.mtype === MTYPE_JOIN_ACCEPT)
	{
		return mic.computeJoin (buffer, bufferLength, key);
	}
	else
	{
		return 0;
	}
}

function verifyMhdr (mhdr)
{
	var verified = true;
	if (typeof mhdr !== 'object') verified = false;
	verified = verified && verifyMType (mhdr.mtype);
	verified = verified && verifyRFU (mhdr.rfu);
	verified = verified && verifyMajor (mhdr.major);
	return verified;
}

function verifyMType (mtype)
{
	var verified = true;
	if (!(typeof mtype === 'number' && mtype >= MTYPE_JOIN_REQUEST && mtype <= MTYPE_PROPIETARY))
	{
		debug ('verifyMType: mtype is out of bounds, '+mtype);
		verified = false;
	}
	return verified;
}

function verifyKey (key)
{
	var verified = true;
	if (!(Buffer.isBuffer (key) && key.length === SIZE_KEY))
	{
		debug ('verifyKey: key is out of bounds, '+key.toString ('hex'));
		verified = false;
	}
	return verified;
}

function verifyRFU (rfu)
{
	var verified = true;
	if (!(typeof rfu === 'number' && rfu >= MIN_MAC_RFU && rfu <= MAX_MAC_RFU))
	{
		debug ('verifyRFU: rfu is out of bounds, '+rfu);
		verified = false;
	}
	return verified;
}

function verifyMajor (major)
{
	var verified = true;
	if (!(typeof major === 'number' && major >= MIN_MAC_MAJOR && major <= MAX_MAC_MAJOR))
	{
		debug ('verifyMajor: major is out of bounds, '+major);
		verified = false;
	}
	return verified;
}

function searchMType (strmtype)
{
	var mtype = undefined;
	for (let valuemtype in STRING_MTYPE)
	{
		if (STRING_MTYPE[valuemtype] === strmtype) mtype = valuemtype;
	}
	if (!mtype)
	{
		debug ('searchMType: mtype unknown '+strmtype);
	}
	return mtype;
}

function hasFrame (mac)
{
	return (mac.mhdr.mtype === MTYPE_CONFIRMED_DATA_UP || mac.mhdr.mtype === MTYPE_CONFIRMED_DATA_DOWN || mac.mhdr.mtype === MTYPE_UNCONFIRMED_DATA_UP || mac.mhdr.mtype === MTYPE_UNCONFIRMED_DATA_DOWN);
}

function hasFrmPayload (mac)
{
	return (hasFrame (mac) && mac.frame && mac.frame.frmPayload);
}

function hasPayload (mac)
{
	return ((mac.mhdr.mtype === MTYPE_JOIN_REQUEST || mac.mhdr.mtype === MTYPE_JOIN_ACCEPT));
}

module.exports.SIZE = {
	MHDR: 1,
	MIC: SIZE_MIC
};

// Packet
module.exports.decode = decode;
module.exports.encode = encode;

// MIC
module.exports.computeMic = computeMic;

// VALUE
module.exports.STRING_MTYPE = STRING_MTYPE;

// MHDR
module.exports.decodeMhdr = decodeMhdr;
module.exports.encodeMhdr = encodeMhdr;
module.exports.verifyMhdr = verifyMhdr;
module.exports.verifyKey = verifyKey;
module.exports.verifyMType = verifyMType;
module.exports.searchMType = searchMType;
module.exports.verifyRFU = verifyRFU;
module.exports.verifyMajor = verifyMajor;

module.exports.MTYPE = {
	MTYPE_JOIN_REQUEST,
	MTYPE_JOIN_ACCEPT,
	MTYPE_CONFIRMED_DATA_UP,
	MTYPE_CONFIRMED_DATA_DOWN,
	MTYPE_UNCONFIRMED_DATA_UP,
	MTYPE_UNCONFIRMED_DATA_DOWN,
	MTYPE_RFU,
	MTYPE_PROPIETARY
};

// Payload
module.exports.encodePayload = encodePayload;
module.exports.hasFrame = hasFrame;
module.exports.hasFrmPayload = hasFrmPayload;
module.exports.hasPayload = hasPayload;