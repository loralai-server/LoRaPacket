/**
 * LoRaPacket 
 * (C) 2017 by Alexandru Radovici (alexandru.radovici@wyliodrin.com)
 * Released under the LGPL v3.0
 * 
 * RX Timing Setup MAC Command 
 * 
 */

'use strict';

// var log = require ('bunyan').getLogger ('lora.packet.mac.rx_timing_setup');
var debug = require ('debug')('lora.packet.mac.rx_timing_setup');

// RX_TIMING_SETUP

// REQ

var OFFSET_REQ_DEL = 0;
var BITS_REQ_DEL = 0b00001111;

// ANS

function decodeRxParamSetupReq (buffer, offset)
{
	debug ('decodeReq', {buffer: buffer, offset: offset});
	let decoded = {
		del: (buffer.readUInt8 (offset) & BITS_REQ_DEL) >>> OFFSET_REQ_DEL,
	};
	return decoded;
}

function decodeRxParamSetupAns (buffer, offset)
{
	debug ('decodeAns', {buffer: buffer, offset: offset});
	return {
	
	};
}

function encodeRxParamSetupReq (decoded, buffer, offset)
{
	debug ('encodeReq', {buffer: buffer, offset: offset});
	if (!buffer) 
	{
		buffer = new Buffer (RX_TIMING_SETUP.REQ.SIZE);
		offset = 0;
	}
	buffer.writeUIn8 (((decoded.del & BITS_REQ_DEL) << OFFSET_REQ_DEL)>>>0, offset);
	return buffer;
}

function encodeRxParamSetupAns (decoded, buffer, offset)
{
	debug ('decodeReq', {buffer: buffer, offset: offset});
	if (!buffer) 
	{
		buffer = new Buffer (RX_TIMING_SETUP.ANS.SIZE);
		offset = 0;
	}
	return buffer;
}

var RX_TIMING_SETUP = {
	REQ: {
		SIZE: 1,
		decode: decodeRxParamSetupReq,
		encode: encodeRxParamSetupReq
	},
	ANS: {
		SIZE: 0,
		decode: decodeRxParamSetupAns,
		encode: encodeRxParamSetupAns
	}
};

module.exports = RX_TIMING_SETUP;