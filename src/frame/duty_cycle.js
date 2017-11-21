/**
 * LoRaPacket 
 * (C) 2017 by Alexandru Radovici (alexandru.radovici@wyliodrin.com)
 * Released under the LGPL v3.0
 * 
 * Duty Cycle MAC Command 
 * 
 */

'use strict';

// var log = require ('bunyan').getLogger ('lora.packet.mac.duty_cycle');
var debug = require ('debug')('lora.packet.mac.duty_cycle');

// DUTY CYCLE

var BITS_MAXDCYCLE = 0b00001111;
var OFFSET_MAXDCYCLE = 0;

function decodeDutyCycleReq (buffer, offset)
{
	debug ('decodeReq', {buffer: buffer, offset: offset});
	let decoded = {
		maxDCycle: (buffer.readUInt8 (offset) & BITS_MAXDCYCLE) >>> OFFSET_MAXDCYCLE
	};
	return decoded;
}

function decodeDutyCycleAns (buffer, offset)
{
	debug ('decodeAns', {buffer: buffer, offset: offset});
	return {

	};
}

function encodeDutyCycleReq (decoded, buffer, offset)
{
	debug ('encodeReq', {buffer: buffer, offset: offset});
	if (!buffer) 
	{
		buffer = new Buffer (DUTY_CYCLE.REQ.SIZE);
		offset = 0;
	}
	buffer.writeUInt8 (((decoded.maxDCycle << OFFSET_MAXDCYCLE)>>>0) & BITS_MAXDCYCLE);
	return buffer;
}

function encodeDutyCycleAns (decoded, buffer, offset)
{
	debug ('decodeReq', {buffer: buffer, offset: offset});
	if (!buffer) 
	{
		buffer = new Buffer (DUTY_CYCLE.ANS.SIZE);
		offset = 0;
	}
	return buffer;
}

var DUTY_CYCLE = {
	REQ: {
		SIZE: 1,
		decode: decodeDutyCycleReq,
		encode: encodeDutyCycleReq
	},
	ANS: {
		SIZE: 0,
		decode: decodeDutyCycleAns,
		encode: encodeDutyCycleAns
	}
};

module.exports = DUTY_CYCLE;