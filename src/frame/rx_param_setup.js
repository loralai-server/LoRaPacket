/**
 * LoRaPacket 
 * (C) 2017 by Alexandru Radovici (alexandru.radovici@wyliodrin.com)
 * Released under the LGPL v3.0
 * 
 * RX Parameters Setup Command 
 * 
 */

'use strict';

// var log = require ('bunyan').getLogger ('lora.packet.mac.rx_param_setup');
var debug = require ('debug')('lora.packet.mac.rx_param_setup');

// RX_PARAM_SETUP

// REQ

var OFFSET_REQ_DLSETTINGS = 0;
// var SIZE_REQ_DLSETTINGS = 1;
var OFFSET_REQ_FREQUENCY = 0;
var BITS_REQ_FREQUENCY = 0x0FFF;

var BITS_REQ_RX1DROFFSET = 0b01110000;
var OFFSET_REQ_RX1DROFFSET = 4;

var BITS_REQ_RX2DATARATE = 0b00001111;
var OFFSET_REQ_RX2DATARATE = 0;

// ANS

var BITS_ANS_RX1DROFFSETACK = 0b00000100;
var OFFSET_ANS_RX1DROFFSETACK = 2;
var BITS_ANS_RX2DATARATEACK = 0b00000010;
var OFFSET_ANS_RX2DATARATEACK = 1;
var BITS_ANS_CHANNELACK = 0b00000001;
var OFFSET_ANS_CHANNELACK = 0;


function decodeRxParamSetupReq (buffer, offset)
{
	debug ('decodeReq', {buffer: buffer, offset: offset});
	let dlSettings = buffer.readUInt8 (offset+OFFSET_REQ_DLSETTINGS);
	let frequency = buffer.readUInt32 (offset+OFFSET_REQ_FREQUENCY);
	let decoded = {
		rx1DROffset: (dlSettings & BITS_REQ_RX1DROFFSET) >>> OFFSET_REQ_RX1DROFFSET,
		rx2DataRate: (dlSettings & BITS_REQ_RX2DATARATE) >>> OFFSET_REQ_RX2DATARATE,
		frequency: (frequency & BITS_REQ_FREQUENCY) * 100
	};
	return decoded;
}

function decodeRxParamSetupAns (buffer, offset)
{
	debug ('decodeAns', {buffer: buffer, offset: offset});
	let status = buffer.readUInt8 (offset);
	let decoded = {
		rx1DROffsetAck: (status & BITS_ANS_RX1DROFFSETACK) >>> OFFSET_ANS_RX1DROFFSETACK,
		rx2DataRateAck: (status & BITS_ANS_RX2DATARATEACK) >>> OFFSET_ANS_RX2DATARATEACK,
		channelAck: (status & BITS_ANS_CHANNELACK) >>> OFFSET_ANS_CHANNELACK
	};
	return decoded;
}

function encodeRxParamSetupReq (decoded, buffer, offset)
{
	debug ('encodeReq', {buffer: buffer, offset: offset});
	if (!buffer) 
	{
		buffer = new Buffer (RX_PARAM_SETUP.REQ.SIZE);
		offset = 0;
	}
	let status = 0;
	status = status | (((decoded.rx1DROffset << OFFSET_REQ_RX1DROFFSET)>>>0) & BITS_REQ_RX1DROFFSET);
	status = status | (((decoded.rx2DataRate << OFFSET_REQ_RX2DATARATE)>>>0) & BITS_REQ_RX2DATARATE);
	buffer.writeUInt32 (parseInt (decoded.frequency / 100) & BITS_REQ_FREQUENCY, offset);
	buffer.writeUIn8 (status, offset);
	return buffer;
}

function encodeRxParamSetupAns (decoded, buffer, offset)
{
	debug ('decodeReq', {buffer: buffer, offset: offset});
	if (!buffer) 
	{
		buffer = new Buffer (RX_PARAM_SETUP.ANS.SIZE);
		offset = 0;
	}
	let status = 0;
	status = status | (((decoded.rx1DROffsetAck << OFFSET_ANS_RX1DROFFSETACK)>>>0) & BITS_ANS_RX1DROFFSETACK);
	status = status | (((decoded.rx2DataRateAck << OFFSET_ANS_RX2DATARATEACK)>>>0) & BITS_ANS_RX2DATARATEACK);
	status = status | (((decoded.channelAck << OFFSET_ANS_CHANNELACK)>>>0) & BITS_ANS_CHANNELACK);
	buffer.writeUInt8 (status, offset);
	return buffer;
}

var RX_PARAM_SETUP = {
	REQ: {
		SIZE: 4,
		decode: decodeRxParamSetupReq,
		encode: encodeRxParamSetupReq
	},
	ANS: {
		SIZE: 1,
		decode: decodeRxParamSetupAns,
		encode: encodeRxParamSetupAns
	}
};

module.exports = RX_PARAM_SETUP;