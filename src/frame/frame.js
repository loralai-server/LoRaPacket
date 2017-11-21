/**
 * LoRaPacket 
 * (C) 2017 by Alexandru Radovici (alexandru.radovici@wyliodrin.com)
 * Released under the LGPL v3.0
 * 
 * Frame functions
 * 
 */

'use strict';

// var log = require ('bunyan').getLogger ('lora.packet.frame');
var debug = require ('debug')('lora.packet.frame');
var crypto = require ('crypto');

var BITS_FRAME_ADR = 0b10000000;
var OFFSET_FRAME_ADR = 7;
var BITS_FRAME_RFU = 0b01000000;
var OFFSET_FRAME_ADR_ACK_REQ = 6;
var BITS_FRAME_ACK = 0b00100000;
var OFFSET_FRAME_ACK = 5;
var BITS_FRAME_PENDING = 0b00010000;
var OFFSET_FRAME_PENDING = 4;
var BITS_FRAME_F_OPTS_LEN = 0b00001111;
var OFFSET_FRAME_F_OPTS_LEN = 0;

var MIN_FRAME_LENGTH = 7;

var MAX_FPORT = 255;

var MAX_FOPTS_LEN = 15;

var MAX_FRAME_FCNT = Math.pow (2, 16)-1;

var OFFSET_FRAME_DEV_ADDR = 0;
var OFFSET_FRAME_FCTRL = 4;
var OFFSET_FRAME_FCNT = 5;

var MAX_DEV_ADDR = Math.pow (2, 32)-1;

var SIZE_FRAME_DEV_ADDR = 4;
var SIZE_FRAME_FCTRL = 1;
var SIZE_FRAME_FCNT = 2;

var CID_LINK_CHECK = 0x02;
var CID_LINK_ADR = 0x03;
var CID_DUTY_CYCLE = 0x04;
var CID_RX_PARAM_SETUP = 0x05;
var CID_DEV_STATUS = 0x06;
var CID_NEW_CHANNEL = 0x07;
var CID_RX_TIMING_SETUP = 0x08;


var CID = {
	[CID_LINK_CHECK]: require ('./link_check'),
	[CID_LINK_ADR]: require ('./link_adr.js'),
	[CID_DUTY_CYCLE]: require ('./duty_cycle.js'),
	[CID_RX_PARAM_SETUP]: require ('./rx_param_setup.js'),
	[CID_DEV_STATUS]: require ('./dev_status.js'),
	[CID_NEW_CHANNEL]: require ('./new_channel.js'),
	[CID_RX_TIMING_SETUP]: require ('./rx_timing_setup.js')
};


function computeCidLength (reqAns, decoded)
{
	debug ('computeCidLength', {reqAns: reqAns, decoded: decoded});
	let length = 0;
	for (let cid in decoded)
	{
		if (CID[cid] !== undefined)
		{
			length = 1 + CID[cid][reqAns].SIZE;
		}
		else
		{
			throw ('computeCidLength: unrecognized CID');
		}
	}
	return length;
}

function encodeCid (reqAns, decoded, buffer, offset)
{
	debug ('encodeCid', {reqAns: reqAns, decoded: decoded, buffer: buffer, offset: offset});
	if (!buffer) 
	{
		buffer = new Buffer (computeCidLength (decoded));
		offset = 0;
	}
	for (let cidId in decoded)
	{
		// TODO select version 1 first
		encodeCommand (cidId, reqAns, decoded[cidId], buffer, offset);
		offset = offset + 1 + CID[cidId][reqAns].SIZE;
	}
	return buffer;
}

function decodeCid (reqAns, buffer, offset=0, length)
{
	var decoded = {};
	var len;
	debug ('decodeCid', {reqAns: reqAns, offset: offset, length: length, buffer:buffer});
	if (!length) 
	{
		len = buffer.length;
	}
	else
	{
		len = offset+length;
	}
	if (len < 0 || buffer.length < len) 
	{
		debug ('decodeCid: buffer overflow', {offset: offset, length: length, buffer_length: buffer.length, buffer:buffer});
		throw new Error ('decodeCid: Buffer overflow');
	}
	for (let index=offset; index < offset+length; index++)
	{
		decodeCommand (reqAns, buffer, len, index);
		index = index + CID[buffer[index]][reqAns].SIZE;
	}
	return decoded;
}

function encodeCommand (id, reqAns, decoded, buffer, offset=0)
{
	let cid = CID[id];
	if (cid !== undefined)
	{
		debug ('encodeCommand: '+id);
		if (!buffer)
		{
			buffer = new Buffer (1+cid[reqAns].SIZE);
		}
		buffer.writeUInt8 (id, offset);
		offset = offset + 1;
		cid[reqAns].encode (decoded, buffer, offset);
	}
	else
	{
		throw new Error ('encodeCommand: unrecognized CID');
	}
	return buffer;
}

function decodeCommand (reqAns, buffer, len, index=0, id)
{
	let decoded;
	if (!len) len = buffer.length;
	if (!id) id = buffer[index];
	if (CID[id] !== undefined)
	{
		let cid = CID[id];
		if (len === cid[reqAns].SIZE+1 && id === buffer[index])
		{
			index = index+1;
		}
		debug ('decodeCommand: '+id);
		if (index+cid[reqAns].SIZE < len)
		{
			decoded = cid[reqAns].decode (buffer, index);
		}
		else
		{
			debug ('decodeCommand: CID buffer overflow', {cid: id, cidLength: cid[reqAns].SIZE, offset: index, length: len});
			throw new Error ('decodeCommand: CID buffer overflow');
		}
	}
	else
	{
		debug ('decodeCommand: unrcognized CID', {cid: buffer[index]});
	}
	return decoded;
}

function decodeFramePacket (mac, buffer, offset, length)
{
	if (buffer.length < offset+length <= buffer.length)
	{
		if (length >= MIN_FRAME_LENGTH)
		{
			var fctrl = buffer.readUInt8 (offset+OFFSET_FRAME_FCTRL);
			var frame = {
				fhdr:
				{
					devAddr: buffer.readUInt32LE (offset+OFFSET_FRAME_DEV_ADDR),
					fCtrl:
					{
						adr: (fctrl & BITS_FRAME_ADR) >>> OFFSET_FRAME_ADR,
						adrAckReq: (fctrl & BITS_FRAME_RFU) >>> OFFSET_FRAME_ADR_ACK_REQ,
						ack: (fctrl & BITS_FRAME_ACK) >>> OFFSET_FRAME_ACK,
						pending: (fctrl & BITS_FRAME_PENDING) >>> OFFSET_FRAME_PENDING,
						fOptsLen: (fctrl & BITS_FRAME_F_OPTS_LEN) >>> OFFSET_FRAME_F_OPTS_LEN
					},
					fCnt: buffer.readUInt16LE (offset+OFFSET_FRAME_FCNT),
					fOpts: {}
				}
			};
			var frameHeaderLength = SIZE_FRAME_DEV_ADDR + SIZE_FRAME_FCTRL + SIZE_FRAME_FCNT + frame.fhdr.fCtrl.fOptsLen;
			let payloadLength = buffer.length - (frameHeaderLength);
			if (payloadLength > 0)
			{
				payloadLength = payloadLength - 1;
				frame.fPort = buffer.readUInt8 (offset+frameHeaderLength);
				frame.frmPayload = buffer.slice (offset+frameHeaderLength+1, offset+length);
			}
			else
			if (payloadLength < 0)
			{
				throw frameError ('payload_size', 'FRAME payload size '+payloadLength);
			}
			// CHECK INTEGRITY
			if (frame.fhdr.fCtrl.fOptsLen > 0 && frame.fhdr.fCtrl.fOptsLen <= MAX_FOPTS_LEN)
			{
				if (frame.fhdr.fOptsLength > 0)
				{
					frame.fhdr.fOpts = decodeCid (mac.mhdr.mtype % 2 === 0?'REQ':'ANS', buffer, 6, frame.fhdr.fOptsLength);
				}
			}
			else if (frame.fhdr.fCtrl.fOptsLen < 0 || frame.fhdr.fCtrl.fOptsLen > MAX_FOPTS_LEN)
			{
				throw frameError ('options_size', 'FRAME options size '+frame.fhdr.fCtrl.fOptsLen);
			}
			// console.log ('devAddr: ');
			// console.log (frame.fhdr.devAddr.toString (16));
			return frame;
		}
		else
		{
			throw frameError ('size', 'FRAME size '+buffer.length);
		}
	}
	else
	{
		throw frameError ('size', 'buffer length is too small '+buffer.length+' '+offset+' '+length);
	}
}

function frameError (error, message)
{
	var err = new Error (message);
	err.type = 'frame';
	err.error = error;
	return err;
}

function encodeFramePacket (mac)
{
	// TODO verify packet sizes
	var payloadOffset = SIZE_FRAME_DEV_ADDR+SIZE_FRAME_FCTRL+SIZE_FRAME_FCNT+mac.frame.fhdr.fCtrl.fOptsLen+(mac.frame.frmPayload.length>0?1:0);
	mac.macPayload = new Buffer (payloadOffset+mac.frame.frmPayload.length);
	// console.log (payloadOffset+mac.frame.frmPayload.length);
	// console.log (mac.macPayload.length);
	// FHDR
	mac.macPayload.writeUInt32LE (mac.frame.fhdr.devAddr, OFFSET_FRAME_DEV_ADDR);
	var fctrl = 0;
	fctrl = fctrl | ((mac.frame.fhdr.fCtrl.adr << OFFSET_FRAME_ADR & BITS_FRAME_ADR)>>>0);
	fctrl = fctrl | ((mac.frame.fhdr.fCtrl.adrAckReq << OFFSET_FRAME_ADR_ACK_REQ & BITS_FRAME_RFU)>>>0);
	fctrl = fctrl | ((mac.frame.fhdr.fCtrl.ack << OFFSET_FRAME_ACK & BITS_FRAME_ACK)>>>0);
	fctrl = fctrl | ((mac.frame.fhdr.fCtrl.pending << OFFSET_FRAME_PENDING & BITS_FRAME_PENDING)>>>0);
	fctrl = fctrl | ((mac.frame.fhdr.fCtrl.fOptsLen << OFFSET_FRAME_F_OPTS_LEN & BITS_FRAME_ADR)>>>0);
	mac.macPayload.writeUInt8 (fctrl, OFFSET_FRAME_FCTRL);
	mac.macPayload.writeUInt16LE (mac.frame.fhdr.fCnt, OFFSET_FRAME_FCNT);
	if (mac.frame.fhdr.fCtrl.fOptsLen > 0)
	{
		encodeCid (mac.mhdr.mtype % 2 === 0?'REQ':'ANS', mac.frame.fhdr.fOpts, mac.macPayload, SIZE_FRAME_DEV_ADDR+SIZE_FRAME_FCTRL+SIZE_FRAME_FCNT);
	}
	if (mac.frame.frmPayload.length>0)
	{
		mac.macPayload.writeUInt8 (mac.frame.fPort, payloadOffset-1);
	}
	for (let index = 0; index < mac.frame.frmPayload.length; index++)
	{
		mac.macPayload.writeUInt8 (mac.frame.frmPayload.readUInt8 (index), payloadOffset+index);
	}
	return mac.macPayload;
}

function decryptFramePayload (frame, direction, netSKey, appSKey)
{
	var encryptedPayloadLength = Math.ceil (frame.frmPayload.length / 16);
	var s = Buffer.alloc (encryptedPayloadLength*16, 0);
	var a = Buffer.alloc (16, 0);
	a.writeUInt8 (0x01, 0);
	a.writeUInt32LE (0x00, 1);
	a.writeUInt8 (direction, 5);
	a.writeUInt32LE (frame.fhdr.devAddr, 6);
	a.writeUInt32LE (frame.fhdr.fCnt, 10);
	a.writeUInt8 (0x00, 14);
	var key = netSKey;
	if (frame.fPort !== 0) key = appSKey;
	if (typeof (key) === 'string') key = new Buffer (key, 'hex');
	for (let i = 1; i <= encryptedPayloadLength; i++)
	{
		a.writeUInt8 (i, 15);
		// console.log (a);
		let aes128 = crypto.createCipheriv('aes-128-ecb', key, Buffer.alloc (0, 0));
		aes128.setAutoPadding (false);
		let si = aes128.update (a);
		for (var index = 0; index < si.length; index++)
		{
			s.writeUInt8 (si.readUInt8 (index), (i-1)*si.length+index);
		}
		// console.log (s);
	}
	var plainPayload = Buffer.alloc (frame.frmPayload.length);
	// console.log (s);
	for (var payloadIndex = 0; payloadIndex < frame.frmPayload.length; payloadIndex++)
	{
		plainPayload.writeUInt8 (frame.frmPayload.readUInt8 (payloadIndex) ^ s.readUInt8 (payloadIndex), payloadIndex);
	}
	return plainPayload;
}

function encryptFramePayload (frame, direction, netSKey, appSKey)
{
	var encryptedPayloadLength = Math.ceil (frame.frmPayload.length / 16);
	var s = Buffer.alloc (encryptedPayloadLength*16, 0);
	var a = Buffer.alloc (16, 0);
	a.writeUInt8 (0x01, 0);
	a.writeUInt32LE (0x00, 1);
	a.writeUInt8 (direction, 5);
	a.writeUInt32LE (frame.fhdr.devAddr, 6);
	a.writeUInt32LE (frame.fhdr.fCnt, 10);
	a.writeUInt8 (0x00, 14);
	var key = netSKey;
	if (frame.fPort !== 0) key = appSKey;
	if (typeof (key) === 'string') key = new Buffer (key, 'hex');
	for (let i = 1; i <= encryptedPayloadLength; i++)
	{
		a.writeUInt8 (i, 15);
		// console.log (a);
		let aes128 = crypto.createCipheriv('aes-128-ecb', key, Buffer.alloc (0, 0));
		aes128.setAutoPadding (false);
		let si = aes128.update (a);
		for (var index = 0; index < si.length; index++)
		{
			s.writeUInt8 (si.readUInt8 (index), (i-1)*si.length+index);
		}
		// console.log (s);
	}
	var plainPayload = Buffer.alloc (frame.frmPayload.length);
	// console.log (s);
	for (var payloadIndex = 0; payloadIndex < frame.frmPayload.length; payloadIndex++)
	{
		plainPayload.writeUInt8 (frame.frmPayload.readUInt8 (payloadIndex) ^ s.readUInt8 (payloadIndex), payloadIndex);
	}
	return plainPayload;
}

function verifyDevAddr (valueDevAddr)
{
	var verified = true;
	if (!(typeof valueDevAddr === 'number' && valueDevAddr >= 0 && valueDevAddr <= MAX_DEV_ADDR))
	{
		debug ('verifyDevAddr: devAddr is out of bounds, '+valueDevAddr);
		verified = false;
	}
	return verified;
}

function verifyFCnt (valueFCnt)
{
	var verified = true;
	if (!(typeof valuefCnt === 'number' && valueFCnt >= 0 && valueFCnt <= MAX_FRAME_FCNT))
	{
		debug ('verifyFCnt: fCnt is out of bounds, '+valueFCnt);
		verified = false;
	}
	return verified;
}

function verifyFrmPayload (valueFrmPayload)
{
	var verified = true;
	if (!(Buffer.isBuffer (valueFrmPayload) && valueFrmPayload.length > 0))
	{
		debug ('verifyFrmPayload: frmPayload is out of bounds, '+valueFrmPayload);
		verified = false;
	}
	return verified;
}

function verifyFOptsLen (valueFOptsLen)
{
	var verified = true;
	if (!(typeof valueFOptsLen === 'number' && valueFOptsLen >= 0 && valueFOptsLen <= MAX_FOPTS_LEN))
	{
		debug ('verifyFOptsLen: fOptsLen is out of bounds, '+valueFOptsLen);
		verified = false;
	}
	return verified;
}

function verifyFPort (fPort)
{
	return (typeof fPort === 'number' && fPort >= 0 && fPort <= MAX_FPORT);
}

module.exports.SIZE = {
	DEV_ADDR: SIZE_FRAME_DEV_ADDR,
	FCNT: SIZE_FRAME_FCNT,
	FCTRL: SIZE_FRAME_FCTRL
};

module.exports.decodeFramePacket = decodeFramePacket;
module.exports.encodeFramePacket = encodeFramePacket;
module.exports.decryptFramePayload = decryptFramePayload;
module.exports.encryptFramePayload = encryptFramePayload;
module.exports.verifyDevAddr = verifyDevAddr;
module.exports.verifyFCnt = verifyFCnt;
module.exports.verifyFPort = verifyFPort;
module.exports.verifyFrmPayload = verifyFrmPayload;
module.exports.verifyFOptsLen = verifyFOptsLen;
module.exports.encodeCommand = encodeCommand;
module.exports.decodeCommand = decodeCommand;

module.exports.CID = {
	CID_DEV_STATUS,
	CID_DUTY_CYCLE,
	CID_LINK_ADR,
	CID_LINK_CHECK,
	CID_NEW_CHANNEL,
	CID_RX_PARAM_SETUP,
	CID_RX_TIMING_SETUP
};