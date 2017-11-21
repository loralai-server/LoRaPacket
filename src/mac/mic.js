/**
 * LoRaPacket 
 * (C) 2017 by Alexandru Radovici (alexandru.radovici@wyliodrin.com)
 * Released under the LGPL v3.0
 * 
 * MIC functions 
 * 
 */


'use strict';

var aescmac = require ('node-aes-cmac').aesCmac;

function computeJoin (buffer, bufferLength, key)
{
	// console.log (buffer);
	return aescmac (key, buffer, {
		returnAsBuffer: true
	}).readUInt32LE ();
}

function computeFrame (mac, buffer, length, key)
{
	var b0 = Buffer.alloc (16, 0);
	b0.writeUInt8 (0x49, 0);
	b0.writeUInt32LE (0x00, 1);
	var direction = mac.mhdr.mtype % 2;
	b0.writeUInt8 (direction, 5);
	b0.writeUInt32LE (mac.frame.fhdr.devAddr, 6);
	b0.writeUInt16LE (mac.frame.fhdr.fCnt, 10);
	b0.writeUInt8 (0x00, 14);
	b0.writeUInt8 (length, 15);
	return aescmac (key, Buffer.concat ([b0, buffer.slice (0, length)]), {
		returnAsBuffer: true
	}).readUInt32LE ();
}

module.exports.computeJoin = computeJoin;
module.exports.computeFrame = computeFrame;

