/**
 * LoRaPacket 
 * (C) 2017 by Alexandru Radovici (alexandru.radovici@wyliodrin.com)
 * Released under the LGPL v3.0
 * 
 * New Channel MAC Command 
 * 
 */

'use strict';

// var log = require ('bunyan').getLogger ('lora.packet.mac.new_channel');
var debug = require ('debug')('lora.packet.mac.new_channel');

// NEW_CHANNEL

// REQ

var OFFSET_REQ_CHINDEX = 0;
var BITS_REQ_FREQ = 0x0FFF;
var OFFSET_REQ_FREQ = 0;
var OFFSET_REQ_DRRANGE = 4;

var BITS_REQ_MAXDR = 0b11110000;
var OFFSET_REQ_MAXDR = 3;

var BITS_REQ_MINDR = 0b00001111;
var OFFSET_REQ_MINDR = 0;

// ANS

var BITS_ANS_DATARATERANGEOK = 0b00000010;
var OFFSET_ANS_DATARATERANGEOK = 1;

var BITS_ANS_CHANNELFREQUENCYOK = 0b00000001;
var OFFSET_ANS_CHANNELFREQUENCYOK = 0;

function decodeLinkCheckReq (buffer, offset)
{
	debug ('decodeReq', {buffer: buffer, offset: offset});
	let freq = buffer.readUInt32 (offset + OFFSET_REQ_FREQ);
	let drRange = buffer.readUInt8 (offset + OFFSET_REQ_DRRANGE);
	return {
		chIndex: buffer.readUInt8 (offset + OFFSET_REQ_CHINDEX),
		freq: (freq & BITS_REQ_FREQ) * 100,
		maxDr: (drRange & BITS_REQ_MAXDR) >>> OFFSET_REQ_MAXDR,
		minDr: (drRange & BITS_REQ_MINDR) >>> OFFSET_REQ_MINDR
	};
}

function decodeLinkCheckAns (buffer, offset)
{
	debug ('decodeAns', {buffer: buffer, offset: offset});
	let status = buffer.readUInt8 (offset);
	let decoded = {
		dataRateRangeOk: (status & BITS_ANS_DATARATERANGEOK) >>> OFFSET_ANS_DATARATERANGEOK,
		channelFrequencyOk: (status & BITS_ANS_CHANNELFREQUENCYOK) >>> OFFSET_ANS_CHANNELFREQUENCYOK,
	};
	
	return decoded;
}

function encodeLinkCheckReq (decoded, buffer, offset)
{
	debug ('encodeReq', {buffer: buffer, offset: offset});
	if (!buffer) 
	{
		buffer = new Buffer (NEW_CHANNEL.REQ.SIZE);
		offset = 0;
	}
	buffer.writeUInt32 (parseInt (decoded.freq / 100) & BITS_REQ_FREQ, offset);
	buffer.writeUInt8 (decoded.chIndex, offset + OFFSET_REQ_CHINDEX);
	let drRange = 0;
	drRange = drRange | (((decoded.maxDr << OFFSET_REQ_MAXDR)>>>0) & BITS_REQ_MAXDR);
	drRange = drRange | (((decoded.minDr << OFFSET_REQ_MINDR)>>>0) & BITS_REQ_MINDR);
	buffer.writeUInt8 (drRange, offset+OFFSET_REQ_DRRANGE);
	return buffer;
}

function encodeLinkCheckAns (decoded, buffer, offset)
{
	debug ('decodeReq', {buffer: buffer, offset: offset});
	if (!buffer) 
	{
		buffer = new Buffer (NEW_CHANNEL.ANS.SIZE);
		offset = 0;
	}
	let status = 0;
	status = status | (((decoded.dataRateRangeOk << OFFSET_ANS_DATARATERANGEOK)>>>0) & BITS_ANS_DATARATERANGEOK);
	status = status | (((decoded.channelFrequencyOk << OFFSET_ANS_CHANNELFREQUENCYOK)>>>0) & BITS_ANS_CHANNELFREQUENCYOK);
	buffer.writeUIn8 (status, offset);
	return buffer;
}

var NEW_CHANNEL = {
	REQ: {
		SIZE: 4,
		decode: decodeLinkCheckReq,
		encode: encodeLinkCheckReq
	},
	ANS: {
		SIZE: 1,
		decode: decodeLinkCheckAns,
		encode: encodeLinkCheckAns
	}
};

module.exports = NEW_CHANNEL;