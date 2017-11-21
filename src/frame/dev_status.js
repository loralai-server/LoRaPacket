/**
 * LoRaPacket 
 * (C) 2017 by Alexandru Radovici (alexandru.radovici@wyliodrin.com)
 * Released under the LGPL v3.0
 * 
 * Device Status MAC Command 
 * 
 */

'use strict';

// var log = require ('bunyan').getLogger ('lora.packet.mac.dev_status');
var debug = require ('debug')('lora.packet.mac.link_check');

// DEV_STATUS

// REQ

// ANS

var OFFSET_ANS_BATTERY = 0;
var OFFSET_ANS_MARGIN = 1;

var BITS_ANS_ABSOLUTE_MARGIN = 0b00011111;
var BITS_ANS_MINUS_MARGIN = 0b00100000;
var OFFSET_ANS_MINUS_MARGIN = 5;

function decodeDeviceStatusReq (buffer, offset)
{
	debug ('decodeReq', {buffer: buffer, offset: offset});
	return {
		
	};
}

function decodeDeviceStatusAns (buffer, offset)
{
	debug ('decodeAns', {buffer: buffer, offset: offset});
	let margin = (buffer.readUInt8 (offset+OFFSET_ANS_MARGIN) & BITS_ANS_ABSOLUTE_MARGIN);
	let minus = (margin & BITS_ANS_MINUS_MARGIN) >> OFFSET_ANS_MARGIN;
	if (minus === -1) margin = - margin;
	let decoded = {
		battery: buffer.readUInt8 (offset+OFFSET_ANS_BATTERY),
		margin: margin,
	};
	return decoded;
}

function encodeDeviceStatusReq (decoded, buffer, offset)
{
	debug ('encodeReq', {buffer: buffer, offset: offset});
	if (!buffer) 
	{
		buffer = new Buffer (DEV_STATUS.REQ.SIZE);
		offset = 0;
	}
	return buffer;
}

function encodeDeviceStatusAns (decoded, buffer, offset)
{
	debug ('decodeReq', {buffer: buffer, offset: offset});
	if (!buffer) 
	{
		buffer = new Buffer (DEV_STATUS.ANS.SIZE);
		offset = 0;
	}
	let margin = Math.abs (decoded.margin) & BITS_ANS_ABSOLUTE_MARGIN;
	if (decoded.margin < 0) margin = margin | (1 << OFFSET_ANS_MINUS_MARGIN);
	buffer.writeUInt8 (decoded.battery, offset + OFFSET_ANS_BATTERY);
	buffer.writeUInt8 (margin, offset+OFFSET_ANS_MARGIN);
	return buffer;
}

var DEV_STATUS = {
	REQ: {
		SIZE: 0,
		decode: decodeDeviceStatusReq,
		encode: encodeDeviceStatusReq
	},
	ANS: {
		SIZE: 2,
		decode: decodeDeviceStatusAns,
		encode: encodeDeviceStatusAns
	}
};
