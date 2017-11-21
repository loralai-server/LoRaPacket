/**
 * LoRaPacket 
 * (C) 2017 by Alexandru Radovici (alexandru.radovici@wyliodrin.com)
 * Released under the LGPL v3.0
 * 
 * Link ADR MAC Command 
 * 
 */

'use strict';

// var log = require ('bunyan').getLogger ('lora.packet.mac.link_adr');
var debug = require ('debug')('lora.packet.mac.link_adr');

// LINK_ADR

// REQ

var OFFSET_REQ_DATARATE_TX = 0;
var SIZE_REQ_DATARATE_TX = 1;
var OFFSET_REQ_CHMASK = SIZE_REQ_DATARATE_TX;
var SIZE_REQ_CHMASK = 2;
var OFFSET_REDUNDANCY = SIZE_REQ_DATARATE_TX + SIZE_REQ_CHMASK;

var BITS_REQ_DATARATE = 0b11110000;
var OFFSET_REQ_DATARATE = 4;
var BITS_REQ_TXPOWER = 0b00001111;
var OFFSET_REQ_TXPOWER = 0;

var BITS_REQ_CHMASKCNTL = 0b01110000;
var OFFSET_REQ_CHMASKCNTL = 4;

var BITS_REQ_NBTRANS = 0b00001111;
var OFFSET_REQ_NBTRANS = 0;

// ANS

var BITS_ANS_POWERACK = 0b00000100;
var OFFSET_ANS_POWERACK = 2;

var BITS_ANS_DATARATEACK = 0b00000010;
var OFFSET_ANS_DATARATEACK = 1;

var BITS_ANS_CHANNELMASKACK = 0b00000001;
var OFFSET_ANS_CHANNELMASKACK = 0;

function decodeLinkAdrReq (buffer, offset)
{
	debug ('decodeReq', {buffer: buffer, offset: offset});
	let dataRateTxPower = buffer.readUInt8 (offset+OFFSET_REQ_DATARATE_TX);
	let redundancy = buffer.readUInt8 (offset+OFFSET_REDUNDANCY);
	let decoded = {
		dataRate: (dataRateTxPower & BITS_REQ_DATARATE) >>> OFFSET_REQ_DATARATE,
		txPower: (dataRateTxPower & BITS_REQ_TXPOWER),
		chMask: buffer.readUInt16 (offset+OFFSET_REQ_CHMASK),
		chMaskCntl: (redundancy & BITS_REQ_CHMASKCNTL) >>> OFFSET_REQ_CHMASKCNTL,
		nbTrans: (redundancy & BITS_REQ_NBTRANS) >>> OFFSET_REQ_NBTRANS
	};
	return decoded;
}

function decodeLinkAdrAns (buffer, offset)
{
	debug ('decodeAns', {buffer: buffer, offset: offset});
	let status = buffer.readUInt8 (offset);
	let decoded = {
		powerAck: (status & BITS_ANS_POWERACK) >>> OFFSET_ANS_POWERACK,
		dataRateAck: (status & BITS_ANS_DATARATEACK) >>> OFFSET_ANS_DATARATEACK,
		channelMaskAck: (status & BITS_ANS_CHANNELMASKACK) >>> OFFSET_ANS_CHANNELMASKACK
	};
	return decoded;
}

function encodeLinkAdrReq (decoded, buffer, offset)
{
	debug ('encodeReq', {buffer: buffer, offset: offset});
	if (!buffer) 
	{
		buffer = new Buffer (LINK_ADR.REQ.SIZE);
		offset = 0;
	}
	let dataRateTxPower = 0;
	let redundancy = 0;
	dataRateTxPower = dataRateTxPower | (((decoded.dataRate << OFFSET_REQ_DATARATE)>>>0) & BITS_REQ_DATARATE);
	dataRateTxPower = dataRateTxPower | (((decoded.txPower << OFFSET_REQ_TXPOWER)>>>0) & BITS_REQ_TXPOWER);
	buffer.writeUInt8 (dataRateTxPower, offset+OFFSET_REQ_DATARATE_TX);
	buffer.writeUInt16 (decoded.chMask, offset+OFFSET_REQ_CHMASK);
	redundancy = redundancy | (((decoded.chMaskCntl << OFFSET_REQ_CHMASKCNTL)>>>0) & BITS_REQ_CHMASKCNTL);
	redundancy = redundancy | (((decoded.nbTrans << OFFSET_REQ_NBTRANS)>>>0) & BITS_REQ_NBTRANS);
	buffer.writeUInt8 (redundancy, offset+OFFSET_REDUNDANCY);
	return buffer;
}

function encodeLinkAdrAns (decoded, buffer, offset)
{
	debug ('decodeReq', {buffer: buffer, offset: offset});
	if (!buffer) 
	{
		buffer = new Buffer (LINK_ADR.ANS.SIZE);
		offset = 0;
	}
	let status = 0;
	status = status | (((decoded.powerAck << OFFSET_ANS_POWERACK)>>>0) & BITS_ANS_POWERACK);
	status = status | (((decoded.dataRateAck << OFFSET_ANS_DATARATEACK)>>>0) & BITS_ANS_DATARATEACK);
	status = status | (((decoded.channelMaskAck << OFFSET_ANS_CHANNELMASKACK)>>>0) & BITS_ANS_CHANNELMASKACK);
	buffer.writeUInt8 (status, offset);
	return buffer;
}

var LINK_ADR = {
	REQ: {
		SIZE: 4,
		decode: decodeLinkAdrReq,
		encode: encodeLinkAdrReq
	},
	ANS: {
		SIZE: 1,
		decode: decodeLinkAdrAns,
		encode: encodeLinkAdrAns
	}
};
