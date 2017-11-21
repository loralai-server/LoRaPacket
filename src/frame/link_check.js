/**
 * LoRaPacket 
 * (C) 2017 by Alexandru Radovici (alexandru.radovici@wyliodrin.com)
 * Released under the LGPL v3.0
 * 
 * Link Check MAC command 
 * 
 */

'use strict';

// var log = require ('bunyan').getLogger ('lora.packet.mac.link_check');
var debug = require ('debug')('lora.packet.mac.link_check');

// LINK_CHECK

var OFFSET_ANS_MARGIN = 0;
var OFFSET_ANS_GWCNT= 1;

function decodeLinkCheckReq (buffer, offset)
{
	debug ('decodeReq', {buffer: buffer, offset: offset});
	return {

	};
}

function decodeLinkCheckAns (buffer, offset)
{
	debug ('decodeAns', {buffer: buffer, offset: offset});
	let decoded = {
		margin: buffer.readUInt8 (offset+OFFSET_ANS_MARGIN),
		gwCnt: buffer.readUInt8 (offset+OFFSET_ANS_GWCNT),
	};
	return decoded;
}

function encodeLinkCheckReq (decoded, buffer, offset)
{
	debug ('encodeReq', {buffer: buffer, offset: offset});
	if (!buffer) 
	{
		buffer = new Buffer (LINK_CHECK.REQ.SIZE);
		offset = 0;
	}
	return buffer;
}

function encodeLinkCheckAns (decoded, buffer, offset)
{
	debug ('decodeReq', {buffer: buffer, offset: offset});
	if (!buffer) 
	{
		buffer = new Buffer (LINK_CHECK.ANS.SIZE);
		offset = 0;
	}
	buffer.writeUInt8 (decoded.margin, offset+OFFSET_ANS_MARGIN);
	buffer.writeUInt8 (decoded.gwCnt, offset+OFFSET_ANS_GWCNT);
	return buffer;
}

var LINK_CHECK = {
	REQ: {
		SIZE: 0,
		decode: decodeLinkCheckReq,
		encode: encodeLinkCheckReq
	},
	ANS: {
		SIZE: 1,
		decode: decodeLinkCheckAns,
		encode: encodeLinkCheckAns
	}
};

module.exports = LINK_CHECK;