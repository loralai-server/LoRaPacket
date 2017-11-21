/**
 * LoRaPacket 
 * (C) 2017 by Alexandru Radovici (alexandru.radovici@wyliodrin.com)
 * Released under the LGPL v3.0
 * 
 * LoRa WAN Packet encoder and decoder 
 * 
 */

'use strict';
var debug = require ('debug')('lora.packet');
var validator = require ('validator');
var extend = require ('extend');

var mac = require ('./mac/mac.js');
var frame = require ('./frame/frame.js');
var join = require ('./frame/join.js');


/**
 * LoRaPacket
 * @class
 * @classdesc LoRa WAN Packet
 * 
 * @param {string|buffer} data 
 * @param {object} keys 
 * @param {*} keys.appSKey Application Shared Key
 * @param {*} keys.nwkSKey Network Shared Key
 * @param {*} keys.appKey Application Key
 * @param {String} keys.encoding keys encoding, base64 / hex / buffer
 * @param {object} options 
 * @param {String} options.encoding base64 / hex 
 * @param {boolean} options.rejectIfMicFail reject packet if mic fails
 */
function LoRaPacket (data, { appSKey, nwkSKey, appKey, encoding }, options)
{
	options = extend ({
		encoding: 'base64'
	}, options);

	if (typeof data === 'string')
	{
		data = new Buffer (data, options.encoding);
	}

	if (Buffer.isBuffer (data))
	{
		debug ('LoRaPacket: new lora packet from buffer '+data.toString('hex'));
		// debug ('LoRaPacket: read from buffer');
		this.mac = mac.decode (data, appSKey, nwkSKey, appKey);
		// this.verifyPacket ();
	}
	else 
	{
		debug ('LoRaPacket: new lora packet from data '+data.toString());
		debug ('LoRaPacket: read mtype');
		this.mac = {
			mhdr: {
				mtype: 0,
				rfu: 0,
				major: 0
			}
		};
		this.setMType (data.mtype);
		if (mac.hasFrame (this.mac))
		{
			this.mac.frame = {
				fhdr:
				{
					fCtrl: {
						adr: 0,
						adrAckReq: 0,
						ack: 0,
						pending: 0,
						fOptsLen: 0
					},
					fCnt: 0,
					fOpts: {}
				}
			};
			if (data.devAddr !== undefined) this.setDevAddr (data.devAddr, getEncoding (data.devAddr));
			if (data.fCtrl) 
			{
				if (data.fCtrl.adr !== undefined) this.setFrameAdr (data.fCtrl.adr, getEncoding (data.fCtrl.adr));
				if (data.fCtrl.adrAckReq !== undefined) this.setFrameAdr (data.fCtrl.adrAckReq, getEncoding (data.fCtrl.adrAckReq));
				if (data.fCtrl.ack !== undefined) this.setFrameAdr (data.fCtrl.ack, getEncoding (data.fCtrl.ack));
				if (data.fCtrl.fPending !== undefined) this.setFrameFPending (data.fCtrl.fPending, getEncoding (data.fCtrl.fPending));
			}
			if (data.fOpts !== undefined)
			{
				// TODO verify command
				this.mac.frame.fOpts = data.fOpts;
			}
			if (data.fPort !== undefined) this.setFPort (data.fPort);
			if (data.frmPayload !== undefined) this.setFrmPayload (data.frmPayload, getEncoding (data.frmPayload));
			else if (data.decryptedFrmPayload !== undefined) this.setDecryptedFrmPayload (data.decryptedFrmPayload, getEncoding (data.decryptedFrmPayload));
		}
		else if (mac.hasPayload (this.mac))
		{
			this.mac.payload = {

			};
			if (data.devEUI !== undefined) this.setDevEUI (data.devEUI, getEncoding (data.devEUI));
			if (data.appEUI !== undefined) this.setAppEUI (data.appEUI, getEncoding (data.appEUI));
			if (data.devNonce !== undefined) this.setDevNonce (data.devNonce, getEncoding (data.devNonce));

			if (data.appNonce !== undefined) this.setAppNonce (data.appNonce, getEncoding (data.appNonce));
			if (data.netId !== undefined) this.setNetId (data.netId, getEncoding (data.netId));
			if (data.devAddr !== undefined) this.setDevAddr (data.devAddr, getEncoding (data.devAddr));
			if (data.rx1DRoffset !== undefined) this.setRx1DRoffset (data.rx1DRoffset, getEncoding (data.rx1DRoffset));
			if (data.rx2DataRate !== undefined) this.setRx2DataRate (data.rx2DataRate, getEncoding (data.rx2DataRate));
			if (data.rxDelay !== undefined) this.setRxDelay (data.rxDelay, getEncoding (data.rxDelay));
			if (data.cfList !== undefined) this.setCFList (data.cfList, getEncoding (data.cfList));
		}
	}

	if (nwkSKey) this.setNwkSKey (nwkSKey, encoding);
	if (appSKey) this.setAppSKey (appSKey, encoding);
	if (appKey) this.setAppKey (appKey, encoding);

	this.verifyPacket ();

	// debug ('LoRaPacket: decode data');
	// if (mac.frame)
	// {
	// 	debug ('LoRaPacket: packet with frame');
	// 	this.mac.payload = frame.decryptFramePayload (mac.frame.frmPayload, mac.mhdr.mtype % 2, nwkSKey, appSKey);
	// }
	// else
	// {
	// 	debug ('LoRaPacket: packet without frame');
	// 	this.mac.payload = null;
	// }

	if (options.rejectIfMicFail)
	{
		if (!this.verifiedMic ())
		{
			throw new Error ('LoRaPacket: mic fail');
		}
	}
}

LoRaPacket.DIRECTION = {
	UP: 0,
	DOWN: 1
};

LoRaPacket.MTYPE = mac.MTYPE;
LoRaPacket.CID = frame.CID;
// TODO add frame size
LoRaPacket.SIZE = extend (mac.SIZE, join.SIZE, frame.SIZE);

// console.log (LoRaPacket.SIZE);

/**
 * Pack string with 0
 * @param {String} str string
 * @param {int} length the length it should have
 */
function zero (str, length)
{
	length = length*2;
	if (length)
	{
		let p = length - str.length;
		if (p > 0)
		{
			let b = Buffer.alloc (p, '0');
			str = b.toString ()+str;
		}
	}
	else
	{
		debug ('zero: error length missing');
		throw new Error ('Error length missing');
	}
	return str;
}

/**
 * Get a number from a string / int with encoded as encoding
 * @param {int|String} value 
 * @param {String} encoding - null for number, hex, base64
 */
function getNumberFromEncoding (value, encoding)
{
	if (typeof value === 'number') return value;
	if (!encoding || encoding === 'hex') return parseInt (value, 16);
	else if (encoding === 'base64') return parseInt (new Buffer (value, 'base64').toString ('hex'), 16);
	else 
	{
		debug ('getNumberFromEncoding: unknown encoding '+encoding+' for value '+value);
		throw new Error ('Unknown encoding '+encoding+' for value '+value);
	}
}

/**
 * Try to guiess the encoding from value
 * @param {int|String|Buffer} value the value
 */
function getEncoding (value)
{
	if (typeof value === 'number') return null;
	else if (Buffer.isBuffer (value)) return 'buffer';
	else if (typeof value === 'string')
	{
		if (validator.isHexadecimal (value)) return 'hex';
		else if (validator.isBase64(value)) return 'base64';
		else return 'string';
	}
	else
	{
		debug ('getEncoding: Unknown encoding '+value);
		throw new Error ('Unknown encoding '+value);
	}
}

/**
 * Get a number with encoding from an int
 * @param {int} number the number
 * @param {String} encoding - null for number, hex, base64
 */
function getNumberWithEncoding (number, encoding, length)
{
	// console.log (number);
	if (!encoding || encoding === 'number') return number;
	else if (encoding === 'hex') return zero (number.toString (16).toUpperCase (), length);
	else if (encoding === 'base64') return new Buffer (zero (number.toString(16), 'hex'), length).toString ('base64');
	else 
	{
		debug ('getNumberWithEncoding: unknown encoding '+encoding+' for value '+number);
		throw new Error ('Unknown encoding '+encoding+' for value '+number);
	}
}

/**
 * Get a string from a string / int / buffer with encoded as encoding
 * @param {int|String|Buffer} value - the value
 * @param {String} encoding - null for hex, number, buffer, base64
 */
function getStringFromEncoding (value, length, encoding)
{
	if (typeof value === 'number') return zero (value.toString (16).toUpperCase (), length);
	else
	if (Buffer.isBuffer (value) && encoding === 'buffer') return zero (value.toString ('hex').toUpperCase (), length);
	else
	if (!encoding || encoding === 'hex') return zero (value.toUpperCase(), length);
	else if (encoding === 'base64') zero (new Buffer (value, 'base64').toString ('hex').toUpperCase (), length);
	else 
	{
		debug ('getStringWithEncoding: unknown encoding '+encoding+' for value '+value);
		throw new Error ('Uknown encoding '+encoding+' for value '+value);
	}
}

/**
 * Get a string with encoding from a string
 * @param {String} str 
 * @param {String} encoding - null for hex, buffer, base64
 */
function getStringWithEncoding (str, length, encoding)
{
	if (!encoding || encoding === 'hex') return zero (str, length);
	else if (encoding === 'buffer') return new Buffer (zero (str, length), 'hex');
	else if (encoding === 'base64') return new Buffer (zero (str, length), 'hex').toString ('base64');
	else 
	{
		debug ('getStringWithEncoding: unknown encoding '+encoding+' for value '+str);
		throw new Error ('Uknown encoding '+encoding+' for value '+str);
	}
}

/**
 * Get a buffer from a string / buffer with encoded as encoding
 * @param {String|Buffer} value 
 * @param {String} encoding - null for buffer, hex, base64
 */
function getBufferFromEncoding (value, encoding)
{
	if ((!encoding || encoding ==='buffer') && Buffer.isBuffer (value)) return value;
	else
	if (typeof value === 'string')
	{
		if (!encoding) encoding = getEncoding (value);
		if (encoding === 'hex') return new Buffer (value, 'hex');
		else
		if (encoding === 'base64') return new Buffer (value, 'base64');
		else 
		{
			debug ('getStringWithEncoding: unknown encoding '+encoding+' for value '+value);
			throw new Error ('Unknown encoding '+encoding+' for value '+value);
		}
	}
}

/**
 * Get a string with encoding from a buffer / int with encoded as encoding
 * @param {Buffer} buf 
 * @param {String} encoding - null for buffer, hex, base64
 */
function getBufferWithEncoding (buf, encoding)
{
	if (!encoding || encoding === 'buffer') return buf;
	else if (encoding === 'hex') return buf.toString ('hex').toUpperCase ();
	else if (encoding === 'base64') return buf.toString ('base64');
	else 
	{
		debug ('getStringWithEncoding: unknown encoding '+encoding);
		throw new Error ('Uknown encoding '+encoding);
	}
}
/**
 * Derive nwkSKey and appSKey
 * @param {int|String} devNonce
 * @param {String} encoding - null for number, hex, base64
 */
LoRaPacket.prototype.deriveKeys = function (devNonce, encoding)
{
	if (this.getMType () === LoRaPacket.MTYPE.MTYPE_JOIN_ACCEPT)
	{
		if (this.getAppKey ())
		{
			let keys = join.deriveKeysFromAppKey (this.mac, this.getAppNonce (), getNumberFromEncoding (devNonce, encoding), this.getNetId (), this.getAppKey ());
			debug ('LoRaPacket.deriveKeys appSKey '+getBufferWithEncoding (keys.appSKey, 'hex')+' nwkSKey '+getBufferWithEncoding (keys.nwkSKey, 'hex'));
			this.setNwkSKey (keys.nwkSKey);
			this.setAppSKey (keys.appSKey);
		}
		else
		{
			debug ('LoRaPacket.deriveKeys: AppKey is not available');
			throw new Error ('AppKey is not available');
		}
	}
	else
	{
		debug ('LoRaPacket.deriveKeys: error keys derived only for Join Accept, mtype is '+this.getMType ('string'));
		throw new Error ('Error keys derived only for Join Accept, mtype is '+this.getMType ('string'));
	}
};

/**
 * Get network shared key (nwkSKey)
 * @param {String} encoding - null for buffer, hex, base64
 */
LoRaPacket.prototype.getNwkSKey = function (encoding)
{
	if (this.nwkSKey) return getBufferWithEncoding (this.nwkSKey, encoding);
	else return null;
};

/**
 * Set network shared key
 * @param {String|Buffer} nwkSKey 
 * @param {String} encoding - null for buffer, hex, base64
 */
LoRaPacket.prototype.setNwkSKey = function (nwkSKey, encoding)
{
	nwkSKey = getBufferFromEncoding (nwkSKey, encoding);
	if (mac.verifyKey (nwkSKey))
	{
		this.nwkSKey = nwkSKey;
	}
	else
	{
		debug ('LoRaPacket.setNwkSKey: nwkSKey is out of of bounds '+getBufferWithEncoding (nwkSKey, 'hex'));
		throw new Error ('NwkSKey is out of of bounds '+getBufferWithEncoding (nwkSKey, 'hex'));
	}
	return this;
};

/**
 * verify mic
 * @param {String|Buffer} key - use this key instad of packet's nwkSKey
 * @param {String} encoding - null, base64, hex 
 */
LoRaPacket.prototype.verifyMic = function (key, encoding)
{
	// console.log (this.mac);
	// console.log (this.getComputedMic ());
	key = getBufferFromEncoding (key, encoding);
	// console.log (key);
	// console.log (this.getComputedMic (null, true, key));
	let verifiedMic = this.mac.mic === this.getComputedMic (null, true, key);
	if (!verifiedMic)
	{
		debug ('LoRaPacket: mic verification failed');
	}
	return verifiedMic;
};

/**
 * Get computed packet MIC 
 * @param {String} encoding - null for number, hex, base64
 * @param {boolean} useOriginal - use the original buffer is available
 * @param {String|Buffer} key - use this key instead of the nwkSKey
 */
LoRaPacket.prototype.getComputedMic = function (encoding, useOriginal, key)
{
	if (!key)
	{
		if (this.getMType () === LoRaPacket.MTYPE.MTYPE_JOIN_ACCEPT)
		{
			key = this.getAppKey ();
		}
		else
		{
			key = this.getNwkSKey ();
		}
	}
	if (key)
	{
		if (!key) key = this.nwkSKey;
		else key = getBufferFromEncoding (key, getEncoding (key));
		if (!useOriginal && !mac.macPayload) mac.encodePayload (this.mac, this.getAppKey ());
		return getNumberWithEncoding (mac.computeMic (this.mac, key, !useOriginal), encoding, LoRaPacket.SIZE.MIC);
	}
	else
	{
		debug ('LoRaPacket.getComputedMic: appKey or NwkSKey is not available');
		throw new Error ('appKey or NwkSKey is not available');
	}
};

/**
 * Get packet MIC 
 * @param {String} encoding - null for number, hex, base64
 */
LoRaPacket.prototype.getMic = function (encoding)
{
	if (!this.mac.mic) this.mac.mic = this.getComputedMic ();
	return getNumberWithEncoding (this.mac.mic, encoding, LoRaPacket.SIZE.MIC);
};

/**
 * Get application shared key (appSKey)
 * @param {String} encoding - null for buffer, hex, base64
 */
LoRaPacket.prototype.getAppSKey = function (encoding)
{
	if (this.appSKey) return getBufferWithEncoding (this.appSKey, encoding);
	else return null;
};

/**
 * Set application shared key
 * @param {String|Buffer} appSKey 
 * @param {String} encoding - null for buffer, hex, base64
 */
LoRaPacket.prototype.setAppSKey = function (appSKey, encoding)
{
	appSKey = getBufferFromEncoding (appSKey, encoding);
	if (mac.verifyKey (appSKey))
	{
		this.appSKey = appSKey;
	}
	else
	{
		debug ('LoRaPacket.setAppSKey: appSKey is out of of bounds '+getBufferWithEncoding (appSKey, 'hex'));
		throw new Error ('AppSKey is out of of bounds '+getBufferWithEncoding (appSKey, 'hex'));
	}
	return this;
};

/**
 * Get application key (appKey)
 * @param {String} encoding - null for buffer, hex, base64
 */
LoRaPacket.prototype.getAppKey = function (encoding)
{
	if (this.appKey) return getBufferWithEncoding (this.appKey, encoding);
	else return null;
};

/**
 * Set application key
 * @param {String|Buffer} appKey 
 * @param {String} encoding - null for buffer, hex, base64
 */
LoRaPacket.prototype.setAppKey = function (appKey, encoding)
{
	appKey = getBufferFromEncoding (appKey, encoding);
	if (mac.verifyKey (appKey))
	{
		this.appKey = appKey;
	}
	else
	{
		debug ('LoRaPacket.setNwkSKey: appSKey is out of of bounds '+getBufferWithEncoding (appKey, 'hex'));
		throw new Error ('AppSKey is out of of bounds '+getBufferWithEncoding (appKey, 'hex'));
	}
	return this;
};

/**
 * Verify packet data
 */
LoRaPacket.prototype.verifyPacket = function ()
{
	// console.log (this.mac);
	if (mac.verifyMhdr (this.mac.mhdr))
	{
		if (this.mac.mhdr.mtype === LoRaPacket.MTYPE.MTYPE_JOIN_REQUEST)
		{
			if (this.mac.payload)
			{
				if (!join.verifyDevEUI(this.mac.payload.devEUI))
				{
					debug ('LoRaPacket.verifyPacket: error at devEUI  '+this.mac.payload.devEUI);
					throw new Error ('Error at devEUI  '+this.mac.payload.devEUI);
				}
				if (!join.verifyAppEUI(this.mac.payload.appEUI))
				{
					debug ('LoRaPacket.verifyPacket: error at appEUI  '+this.mac.payload.appEUI);
					throw new Error ('Error at appEUI  '+this.mac.payload.appEUI);
				}
				if (!join.verifyDevNonce(this.mac.payload.devNonce))
				{
					debug ('LoRaPacket.verifyPacket: error at devNonce  '+ this.mac.payload.devNonce);
					throw new Error ('Error at devNonce  '+ this.mac.payload.devNonce);
				}
			}
			else
			{
				debug ('LoRaPacket.verifyPacket: packet has no payload, mtype is '+this.getMType ('string'));
				throw new Error ('Packet has no payload, mtype is '+this.getMType ('string'));
			}
		}
		else
		if (this.mac.mhdr.mtype === LoRaPacket.MTYPE.MTYPE_JOIN_ACCEPT)
		{
			if (this.mac.payload)
			{
				if (!join.verifyAppNonce(this.mac.payload.appNonce))
				{
					debug ('LoRaPacket.verifyPacket: error at appNonce  ', this.mac.payload.appNonce);
					throw new Error ('Error at appNonce  ', this.mac.payload.appNonce);
				}
				if (!join.verifyNetId(this.mac.payload.netId))
				{
					// console.log (this.mac);
					debug ('LoRaPacket.verifyPacket: error at netId  '+getNumberWithEncoding (this.mac.payload.netId, 'hex', LoRaPacket.SIZE.NET_ID));
					throw new Error ('Error at netId  '+getNumberWithEncoding (this.mac.payload.netId, 'hex', LoRaPacket.SIZE.NET_ID));
				}
				if (!join.verifyDevAddr(this.mac.payload.devAddr))
				{
					debug ('LoRaPacket.verifyPacket: error at devAddr  '+getNumberWithEncoding (this.mac.payload.devAddr, 'hex', LoRaPacket.SIZE.DEV_ADDR));
					throw new Error ('Error at devAddr  '+ getNumberWithEncoding (this.mac.payload.devAddr, 'hex', LoRaPacket.SIZE.DEV_ADDR));
				}
				if (!join.verifyNetIdAndDevAddr(this.mac.payload.netId, this.mac.payload.devAddr))
				{
					debug ('LoRaPacket.verifyPacket: error at nwkId, netId '+getNumberWithEncoding (this.mac.payload.netId, 'hex', LoRaPacket.SIZE.NET_ID)+' devAddr '+getNumberWithEncoding (this.mac.payload.devAddr, 'hex', LoRaPacket.SIZE.DEV_ADDR));
					throw new Error ('Error at nwkId, netId '+getNumberWithEncoding (this.mac.payload.netId, 'hex', LoRaPacket.SIZE.NET_ID)+' devAddr '+getNumberWithEncoding (this.mac.payload.devAddr, 'hex', LoRaPacket.SIZE.DEV_ADDR));
				}
				if (!join.verifyRx1DRoffset(this.mac.payload.rx1DRoffset))
				{
					debug ('LoRaPacket.verifyPacket: error at rx1DRoffset '+this.mac.payload.rx1DRoffset);
					throw new Error ('Error at rx1DRoffset  '+this.mac.payload.rx1DRoffset);
				}
				if (!join.verifyRx2DataRate(this.mac.payload.rx2DataRate))
				{
					debug ('LoRaPacket.verifyPacket: error at rx2DataRate '+this.mac.payload.rx2DataRate);
					throw new Error ('Error at rx2DataRate '+this.mac.payload.rx2DataRate);
				}
				if (!join.verifyRxDelay(this.mac.payload.rxDelay))
				{
					debug ('LoRaPacket.verifyPacket: error at rxDelay  '+this.mac.payload.rxDelay);
					throw new Error ('Error at rxDelay  '+this.mac.payload.rxDelay);
				}
				if (!join.verifyCFList(this.mac.payload.cfList))
				{
					debug ('LoRaPacket.verifyPacket: error at cfList  '+JSON.stringify (this.mac.payload.cfList));
					throw new Error ('Error at cfList  '+JSON.stringify (this.mac.payload.cfList));
				}
			}
			else
			{
				debug ('LoRaPacket.verifyPacket: packet has no payload, mtype is '+this.getMType ('string'));
				throw new Error ('Packet has no payload, mtype is '+this.getMType ('string'));
			}
		}
		else
		if (this.mac.mhdr.mtype >= LoRaPacket.MTYPE.MTYPE_UNCONFIRMED_DATA_UP && this.mac.mhdr.mtype <= LoRaPacket.MTYPE.MTYPE_CONFIRMED_DATA_DOWN)
		{
			// TODO verify frame size
			if (!this.mac.frame)
			{
				debug ('LoRaPacket.verifyPacket: packet has no frame, mtype is '+this.getMType ('string'));
				throw new Error ('Packet has no frame, mtype is '+this.getMType ('string'));
			}
			if (!frame.verifyDevAddr (this.mac.frame.fhdr.devAddr))
			{
				debug ('LoRaPacket.verifyPacket: error at devAddr '+getNumberWithEncoding (this.mac.frame.fhdr.devAddr, 'hex'));
				throw new Error ('Error at devAddr '+getNumberWithEncoding (this.mac.frame.fhdr.devAddr, 'hex'));
			}
			if (this.mac.frame.fPort && !this.mac.frame.frmPayload)
			{
				this.mac.frame.frmPayload = Buffer.alloc (0);
				debug ('LoRaPacket.verifyPacket: frame has port but no payload, fPort '+this.mac.frame.fPort);
			}
			if (this.mac.frame.frmPayload && !this.mac.frame.fPort)
			{
				debug ('LoRaPacket.verifyPacket: frame has payload but no port, frmPayload '+getBufferWithEncoding (this.mac.frame.frmPayload, 'hex'));
				throw new Error ('Frame has payload but no port, frmPayload '+getBufferWithEncoding (this.mac.frame.frmPayload, 'hex'));
			}
		}
	}
	else
	{
		debug ('LoRaPacket.verifyPacket: Error in mhdr ', JSON.stringify (this.mac.mhdr));
		throw new Error ('Error in mhdr ', JSON.stringify (this.mac.mhdr));
	}
};


/**
 * Get packet MHDR
 * @param {String} encoding - null for object, number for actual number, hex for text
 */
LoRaPacket.prototype.getMHDR = function (encoding)
{
	if (!encoding) return this.mac.mhdr;
	else 
	{
		if (!this.mac._mhdr) this.mac._mhdr = mac.encodeMhdr (this.mac.mhdr);
		return getNumberWithEncoding (this.mac._mhdr, encoding, LoRaPacket.SIZE.MHDR);
	}
};

/**
 * pack 
 * @param {String} encoding - null for buffer, hex, base64
 * @param {boolean} useOriginal - use the original buffer if it is available
 */
LoRaPacket.prototype.pack = function (encoding, useOriginal)
{
	if (this.mac._original && useOriginal) 
	{
		debug ('LoRaPacket.pack: using original');
		return getBufferWithEncoding (this.mac._original, encoding);
	}
	else
	{
		return getBufferWithEncoding (mac.encode (this.mac, this.nwkSKey, this.appKey), encoding);
	}
};

/**
 * Reset
 */
LoRaPacket.prototype.reset = function ()
{
	delete this.mac._original;
	delete this.mac.macPayload;
};

/**
 * Set packet MHDR
 * @param {String} encoding - null for object, number for actual number, hex for text
 */
LoRaPacket.prototype.setMHDR = function (mhdr, encoding)
{
	if (typeof mhdr === 'object')
	{
		if (mac.verifyMhdr (mhdr))
		{
			this.mac.mhdr = mhdr;
			delete this.mac._mhdr;
			this.reset ();
		}
		else
		{
			debug ('Wrong mhdr object '+JSON.stringify (mhdr));
		}
	}
	else 
	{
		let mhdr = getNumberFromEncoding (mhdr, encoding, LoRaPacket.SIZE.MHDR);
		if (mhdr >= 0 && mhdr <=255)
		{
			this.mac.mhdr = mac.decodeMhdr (mhdr);
			this.mac._mhdr = mhdr;
		}
		else
		{
			debug ('LoRaPacket.setMHDR: mhdr out of of bounds, '+mhdr);
			throw new Error ('MHDR value should be between 0 and 255, the actual value is '+mhdr);
		}
	}
	return this;
};

/**
 * Get packet MType
 * @param {String} encoding - null for number, string for text
 */
LoRaPacket.prototype.getMType = function (encoding)
{
	if (!encoding) return this.mac.mhdr.mtype;
	else if (encoding === 'string') return mac.STRING_MTYPE[this.mac.mhdr.mtype];
	else debug ('LoRaPacket.getMType: unknown encoding '+encoding);
};

/**
 * Set packet MType
 * @param {Number|String} mtype - number or string ()
 */
LoRaPacket.prototype.setMType = function (valuemtype)
{
	let mtype = undefined;
	if (typeof valuemtype === 'string')
	{
		mtype = mac.searchMType (valuemtype);
	}
	else
	{
		mtype = valuemtype;
	}
	if (mac.verifyMType (mtype))
	{
		this.mac.mhdr.mtype = mtype;
		delete this.mac._mhdr;
		this.reset ();
	}
	else
	{
		throw new Error ('MType value is out of of bounds '+mtype);
	}
	return this;
};

/**
 * Get packet major
 */
LoRaPacket.prototype.getMajor = function ()
{
	return mac.mhdr.major;
};

/**
 * Set packet major
 * @param {Number} major - number 
 */
LoRaPacket.prototype.setMajor = function (major)
{
	if (mac.verifyMajor (major))
	{
		this.mac.mhdr.major = major;
		delete this.mac._mhdr;
		this.reset ();
	}
	else
	{
		throw new Error ('Major value is out of of bounds '+major);
	}
	return this;
};

/**
 * Get packet DevAddr
 * @param {String} encoding - null for number, hex or base64
 */
LoRaPacket.prototype.getDevAddr = function (encoding)
{
	let devAddr = undefined;
	if (mac.hasFrame (this.mac))
	{
		devAddr = getNumberWithEncoding (this.mac.frame.fhdr.devAddr, encoding, LoRaPacket.SIZE.DEV_ADDR);
	}
	else
	if (this.getMType () === LoRaPacket.MTYPE.MTYPE_JOIN_ACCEPT)
	{
		devAddr = getNumberWithEncoding (this.mac.payload.devAddr, encoding, LoRaPacket.SIZE.DEV_ADDR);
	}
	else
	{
		debug ('LoRaPacket.getDevAddr: packet has no frame, mtype is '+this.getMType ('string'));
		throw new Error ('packet has no frame, mtype is '+this.getMType ('string'));
	}
	return devAddr;
};

/**
 * Set packet DevAddr
 * @param {Number|String} devAddr - number or string
 * @param {String} encoding - null for number or hex, base64 
 */
LoRaPacket.prototype.setDevAddr = function (devAddr, encoding)
{
	if (mac.hasFrame(this.mac))
	{
		devAddr = getNumberFromEncoding (devAddr, encoding);
		if (frame.verifyDevAddr (devAddr))
		{
			this.mac.frame.fhdr.devAddr = devAddr;
			this.reset ();
		}
		else
		{
			throw new Error ('DevAddr value is out of of bounds '+devAddr);
		}
	}
	else
	if (mac.hasPayload(this.mac) && this.getMType() === LoRaPacket.MTYPE.MTYPE_JOIN_ACCEPT)
	{
		devAddr = getNumberFromEncoding (devAddr, encoding);
		if (frame.verifyDevAddr (devAddr))
		{
			this.mac.payload.devAddr = devAddr;
			this.reset ();
		}
		else
		{
			throw new Error ('DevAddr value is out of of bounds '+devAddr);
		}
	}
	else
	{
		debug ('LoRaPacket.setDevAddr: packet has no frame, mtype is '+this.getMType ('string'));
		throw new Error ('Packet has no frame, mtype is '+this.getMType ('string'));
	}
	return this;
};

/**
 * Get packet fPort
 * @param {String} encoding - null for number, hex, base64
 */
LoRaPacket.prototype.getFCnt = function (encoding)
{
	let fCnt = undefined;
	if (mac.hasFrame (this.mac))
	{
		fCnt = getNumberWithEncoding (this.mac.frame.fhdr.fCnt, encoding, LoRaPacket.SIZE.FCNT);
	}
	else
	{
		debug ('LoRaPacket.getFCnt: packet has no frame, mtype is '+this.getMType ('string'));
		throw new Error ('Packet has no frame, mtype is '+this.getMType ('string'));
	}
	return fCnt;
};

/**
 * Set packet fPort
 * @param {Number|String} fCnt
 * @param {String} encoding - null for number, hex, base64
 */
LoRaPacket.prototype.setFCnt = function (fCnt, encoding)
{
	if (mac.hasFrame (this.mac))
	{
		fCnt = getNumberFromEncoding (fCnt, encoding);
		if (frame.verifyFCnt (fCnt))
		{
			this.mac.frame.fhdr.fCnt = fCnt;
			this.reset ();
		}
		else
		{
			throw new Error ('FCnt value is out of bounds '+fCnt);
		}
	}
	else
	{
		debug ('LoRaPacket.setFCnt: packet has no frame, mtype is '+this.getMType ('string'));
		throw new Error ('Packet has no frame, mtype is '+this.getMType ('struing'));
	}
	return this;
};

/**
 * Verify if packet has frame payload
 */
LoRaPacket.prototype.hasFramePayload = function ()
{
	return mac.hasFrmPayload (this.mac);
};

/**
 * Get packet fPort
 * @param {String} encoding - null for number, hex, base64
 */
LoRaPacket.prototype.getFPort = function (encoding)
{
	let fPort = undefined;
	if (mac.hasFrame (this.mac))
	{
		if (mac.hasFrmPayload (this.mac))
		{
			fPort = getNumberWithEncoding (this.mac.frame.fPort, encoding, LoRaPacket.SIZE.FPORT);
		}
		else
		{
			debug ('LoRaPacket.getFPort: packet has no frame payload');
			throw new Error ('Packet has no frame payload');
		}
	}
	else
	{
		debug ('LoRaPacket.getFPort: packet has no frame, mtype is '+this.getMType ('string'));
		throw new Error ('Packet has no frame, mtype is '+this.getMType ('string'));
	}
	return fPort;
};

/**
 * Set packet fPort
 * @param {String|Number} fPort
 * @param encoding - null for number, hex, base64
 */
LoRaPacket.prototype.setFPort = function (fPort, encoding)
{
	if (mac.hasFrame (this.mac))
	{
		fPort = getNumberFromEncoding (fPort, encoding);
		if (frame.verifyFPort (fPort))
		{
			this.mac.frame.fPort = fPort;
			this.reset ();
		}
		else
		{
			throw new Error ('FPort value is out of bounds '+fPort);
		}
	}
	else
	{
		debug ('LoRaPacket.setFPort: packet has no frame payload');
		throw new Error ('Packet has no frame payload');
	}
	return this;
};

/**
 * Get packet frmPayload
 * @param {String} encoding - null for buffer, hex, base64
 */
LoRaPacket.prototype.getFrmPayload = function (encoding)
{
	let frmPayload = undefined;
	if (mac.hasFrame (this.mac))
	{
		if (mac.hasFrmPayload (this.mac))
		{
			frmPayload = this.mac.frame.frmPayload;
			if (encoding === 'hex') frmPayload = frmPayload.toString ('hex').toUpperCase ();
			else if (encoding === 'base64') frmPayload = frmPayload.toString ('base64');
		}
		else
		{
			debug ('LoRaPacket.getFrmPayload: packet has no frame payload');
			throw new Error ('Packet has no frame payload');
		}
	}
	else
	{
		debug ('LoRaPacket.getFrmPayload: packet has no frame, mtype is '+this.getMType ('string'));
		throw new Error ('Packet has no frame, mtype is '+this.getMType ('string'));
	}
	return frmPayload;
};

/**
 * Set packet frmPayload
 * @param {Number|String} fPort
 * @param {String|Buffer} frmPayload
 * @param {String} encoding - null for buffer, hex, base64
 */
LoRaPacket.prototype.setFrmPayload = function (fPort, frmPayload, encoding)
{
	// console.log (fPort);
	if (typeof fPort === 'string')
	{
		encoding = frmPayload;
		frmPayload = fPort;
		fPort = undefined;
	}
	if (mac.hasFrame (this.mac))
	{
		if (fPort)
		{
			if (frame.verifyFPort (fPort))
			{
				this.mac.frame.fPort = fPort;
				this.reset ();
			}
			else
			{
				throw new Error ('FPort value is out of bounds '+fPort);
			}
		}

		if (encoding === 'hex') frmPayload = new Buffer (frmPayload, 'hex');
		else if (encoding === 'base64') frmPayload = new Buffer (frmPayload, 'base64');
		
		if (frame.verifyFrmPayload (frmPayload))
		{
			this.mac.frame.frmPayload = frmPayload;
			this.reset ();
		}
		else
		{
			throw new Error ('FrmPayload value is out of bounds '+frmPayload);
		}
	}
	else
	{
		debug ('LoRaPacket.setFrmPayload: packet has no frame payload');
		throw new Error ('Packet has no frame payload');
	}
	return this;
};

/**
 * Get packet decrypted frmPayload
 * @param {String} encoding - null for buffer, hex, base64
 */
LoRaPacket.prototype.getDecryptedFrmPayload = function (encoding)
{
	let decryptedFrmPayload;
	let key;
	if (mac.hasFrame (this.mac))
	{
		if (this.getFPort () === 0)
		{
			key = this.nwkSKey;
		}
		else
		{
			key = this.appSKey;
		}
		if (key)
		{
			decryptedFrmPayload = frame.decryptFramePayload (this.mac.frame, this.getDirection (), this.nwkSKey, this.appSKey);
			if (encoding === 'hex') decryptedFrmPayload = decryptedFrmPayload.toString ('hex').toUpperCase ();
			else if (encoding === 'base64') decryptedFrmPayload = decryptedFrmPayload.toString ('base64');
		}
		else
		{
			debug ('LoRaPacket.getDecryptedFrmPayload: decryption key is not available');
			throw new Error ('LoRaPacket.getDecryptedFrmPayload: decryption key is not available');
		}
	}
	else
	{
		debug ('LoRaPacket.getDecryptedFrmPayload: packet has no frame, mtype is '+this.getMType ('string'));
		throw new Error ('Packet has no frame, mtype is '+this.getMType ('string'));
	}
	return decryptedFrmPayload;
};

/**
 * Set packet frmPayload
 * @param {Number|String} fPort
 * @param {String|Buffer} frmPayload
 * @param {String} encoding - null for buffer, hex, base64
 */
LoRaPacket.prototype.setFrmPayload = function (fPort, frmPayload, encoding)
{
	if (typeof fPort !== 'number')
	{
		encoding = frmPayload;
		frmPayload = fPort;
		fPort = undefined;
	}
	if (mac.hasFrame (this.mac))
	{
		if (fPort)
		{
			if (frame.verifyFPort (fPort))
			{
				this.mac.frame.fPort = fPort;
				this.reset ();
			}
			else
			{
				throw new Error ('FPort value is out of bounds '+fPort);
			}
		}

		if (encoding === 'hex') frmPayload = new Buffer (frmPayload, 'hex');
		else if (encoding === 'base64') frmPayload = new Buffer (frmPayload, 'base64');
		
		if (frame.verifyFrmPayload (frmPayload))
		{
			this.mac.frame.frmPayload = frmPayload;
			this.reset ();
		}
		else
		{
			throw new Error ('FrmPayload value is out of bounds '+frmPayload);
		}
	}
	else
	{
		debug ('LoRaPacket.setFrmPayload: packet has no frame payload');
		throw new Error ('Packet has no frame payload');
	}
	return this;
};

/**
 * Set packet decrypted frmPayload
 * @param {Number|String} fPort
 * @param {String|Buffer} decryptedFrmPayload
 * @param {String} encoding - null for buffer, hex, base64
 */
LoRaPacket.prototype.setDecryptedFrmPayload = function (fPort, decryptedFrmPayload, encoding)
{
	if (typeof fPort !== 'number')
	{
		encoding = decryptedFrmPayload;
		decryptedFrmPayload = fPort;
		fPort = undefined;
	}
	if (mac.hasFrame (this.mac))
	{
		if (fPort)
		{
			if (frame.verifyFPort (fPort))
			{
				this.mac.frame.fPort = fPort;
				this.reset ();
			}
			else
			{
				throw new Error ('FPort value is out of bounds '+fPort);
			}
		}

		let key;
		if (this.getFPort () === 0)
		{
			key = this.nwkSKey;
		}
		else
		{
			key = this.appSKey;
		}
		if (key)
		{
			if (encoding === 'hex') decryptedFrmPayload = new Buffer (decryptedFrmPayload, 'hex');
			else if (encoding === 'base64') decryptedFrmPayload = new Buffer (decryptedFrmPayload, 'base64');
			else if (typeof decryptedFrmPayload === 'string') decryptedFrmPayload = new Buffer (decryptedFrmPayload);
			// console.log (decryptedFrmPayload);
			if (frame.verifyFrmPayload (decryptedFrmPayload))
			{
				this.mac.frame.frmPayload = decryptedFrmPayload;
				this.mac.frame.frmPayload = frame.encryptFramePayload (this.mac.frame, this.getDirection (), this.getNwkSKey (), this.getAppSKey ());
				this.reset ();
			}
			else
			{
				throw new Error ('DecryptedFrmPayload value is out of bounds '+decryptedFrmPayload);
			}
		}
		else
		{
			debug ('LoRaPacket.setDecryptedFrmPayload: encryption key is not available');
			throw new Error ('LoRaPacket.setDecryptedFrmPayload: encryption key is not available');
		}
	}
	else
	{
		debug ('LoRaPacket.setDecryptedFrmPayload: packet has no frame payload');
		throw new Error ('Packet has no frame payload');
	}
	return this;
};

/**
 * Get packet frame ADR
 * @param {String} encoding - null for number, boolean
 */
LoRaPacket.prototype.getFrameAdr = function (encoding)
{
	let frameAdr = undefined;
	if (mac.hasFrame (this.mac))
	{
		frameAdr = this.mac.frame.fhdr.fCtrl.adr;
		if (encoding === 'boolean') frameAdr = frameAdr === 1?true:false;
	}
	else
	{
		debug ('LoRaPacket.getFrameAdr: packet has no frame, mtype is '+this.getMType ('string'));
		throw new Error ('Packet has no frame, mtype is '+this.getMType ('string'));
	}
	return frameAdr;
};

/**
 * Set packet frame ADR
 * @param {boolean|Number} adr
 */
LoRaPacket.prototype.setFrameAdr = function (adr)
{
	if (mac.hasFrame (this.mac))
	{
		if (typeof adr === 'boolean') adr = adr?1:0;
		
		if (adr === 1 || adr === 0)
		{
			this.mac.frame.fhdr.fCtrl.adr = adr;
			this.reset ();
		}
		else
		{
			throw new Error ('FrameAdr value is out of bounds '+adr);
		}
	}
	else
	{
		debug ('LoRaPacket.setFrameAdr: packet has no frame payload');
		throw new Error ('Packet has no frame payload');
	}
	return this;
};

/**
 * Get packet frame ADR ACK Req
 * @param {String} encoding - null for number, boolean
 */
LoRaPacket.prototype.getFrameAdrAckReq = function (encoding)
{
	let frameAdrAckReq = undefined;
	if (mac.hasFrame (this.mac) && this.getDirection() === LoRaPacket.DIRECTION.UP)
	{
		frameAdrAckReq = this.mac.frame.fhdr.fCtrl.adrAckReq;
		if (encoding === 'boolean') frameAdrAckReq = frameAdrAckReq === 1?true:false;
	}
	else
	{
		debug ('LoRaPacket.getFrameAdrAckReq: packet has no frame or is not an uplink, mtype is '+this.getMType ('string'));
		throw new Error ('Packet has no frame or is not an uplink, mtype is '+this.getMType ('string'));
	}
	return frameAdrAckReq;
};

/**
 * Set packet frame ADR ACK Req
 * @param {boolean|Number} adrAckReq
 */
LoRaPacket.prototype.setFrameAdrAckReq = function (adrAckReq)
{
	if (mac.hasFrame (this.mac) && this.getDirection() === LoRaPacket.DIRECTION.UP)
	{
		if (typeof adrAckReq === 'boolean') adrAckReq = adrAckReq?1:0;
		
		if (adrAckReq === 1 || adrAckReq === 0)
		{
			this.mac.frame.fhdr.fCtrl.adrAckReq = adrAckReq;
			this.reset ();
		}
		else
		{
			throw new Error ('AdrAckReq value is out of bounds '+adrAckReq);
		}
	}
	else
	{
		debug ('LoRaPacket.setFrameAdrAckReq: packet has no frame payload or is not an uplink, mtype is '+this.getMType ('string'));
		throw new Error ('Packet has no frame payload or is not an uplink, mtype is '+this.getMType ('string'));
	}
	return this;
};

/**
 * Get packet frame FPending
 * @param {String} encoding - null for number, boolean
 */
LoRaPacket.prototype.getFrameFPending = function (encoding)
{
	let fPending = undefined;
	if (mac.hasFrame (this.mac) && this.getDirection () === LoRaPacket.DIRECTION.DOWN)
	{
		fPending = this.mac.frame.fhdr.fCtrl.pending;
		if (encoding === 'boolean') fPending = fPending === 1?true:false;
	}
	else
	{
		debug ('LoRaPacket.getFPending: packet has no frame or is not a downlink, mtype is '+this.getMType ('string'));
		throw new Error ('Packet has no frame or is not a downlink, mtype is '+this.getMType ('string'));
	}
	return fPending;
};

/**
 * Set packet frame FPending
 * @param {boolean|Number} fPending
 */
LoRaPacket.prototype.setFrameFPending = function (fPending)
{
	if (mac.hasFrame (this.mac && this.getDirection () === LoRaPacket.DIRECTION.DOWN))
	{
		if (typeof fPending === 'boolean') fPending = fPending?1:0;
		
		if (fPending === 1 || fPending === 0)
		{
			this.mac.frame.fhdr.fCtrl.pending = fPending;
			this.reset ();
		}
		else
		{
			throw new Error ('FPending value is out of bounds '+fPending);
		}
	}
	else
	{
		debug ('LoRaPacket.setFrameFPending: packet has no frame payload or is not a downlink, mtype is '+this.getMType ('string'));
		throw new Error ('Packet has no frame payload or is not a downlink, mtype is '+this.getMType ('string'));
	}
	return this;
};

/**
 * Get packet frame ACK
 * @param {String} encoding - null for number, boolean
 */
LoRaPacket.prototype.getFrameAck = function (encoding)
{
	let ack = undefined;
	if (mac.hasFrame (this.mac))
	{
		ack = this.mac.frame.fhdr.fCtrl.ack;
		if (encoding === 'boolean') ack = ack === 1?true:false;
	}
	else
	{
		debug ('LoRaPacket.getFrameAck: packet has no frame, mtype is '+this.getMType ('string'));
		throw new Error ('Packet has no frame, mtype is '+this.getMType ('string'));
	}
	return ack;
};

/**
 * Set packet frame ACK
 * @param {boolean|Number} ack
 */
LoRaPacket.prototype.setFrameAck = function (ack)
{
	if (mac.hasFrame (this.mac))
	{
		if (typeof fPending === 'boolean') ack = ack?1:0;
		
		if (ack === 1 || ack === 0)
		{
			this.mac.frame.fhdr.fCtrl.ack = ack;
			this.reset ();
		}
		else
		{
			throw new Error ('Ack value is out of bounds '+ack);
		}
	}
	else
	{
		debug ('LoRaPacket.setFrameAck: packet has no frame payload');
		throw new Error ('Packet has no frame payload');
	}
	return this;
};

/**
 * Get packet frame fOptsLen
 * @param {String} encoding - null for number, hex, base64
 */
LoRaPacket.prototype.getFrameFOptsLen = function (encoding)
{
	let fOptsLen = undefined;
	if (mac.hasFrame (this.mac))
	{
		fOptsLen = getNumberWithEncoding (this.mac.frame.fhdr.fCtrl.fOptsLen, encoding, LoRaPacket.SIZE.FOPTSLEN);
	}
	else
	{
		debug ('LoRaPacket.getFrameFOptsLen: packet has no frame, mtype is '+this.getMType ('string'));
		throw new Error ('Packet has no frame, mtype is '+this.getMType ('string'));
	}
	return fOptsLen;
};

/**
 * Set packet frame fOptsLen
 * @param {Number|String} fOptsLen
 * @param {String} encoding - null is number, hex, base64
 */
LoRaPacket.prototype.setFrameFOptsLen = function (fOptsLen, encoding)
{
	if (mac.hasFrame (this.mac))
	{
		fOptsLen = getNumberFromEncoding (fOptsLen, encoding);
		
		if (frame.verifyFOptsLen(fOptsLen))
		{
			this.mac.frame.fhdr.fCtrl.fOptsLen = fOptsLen;
			this.reset ();
		}
		else
		{
			throw new Error ('fOptsLen value is out of bounds '+fOptsLen);
		}
	}
	else
	{
		debug ('LoRaPacket.setFrameFOptsLen: packet has no frame payload');
		throw new Error ('Packet has no frame payload');
	}
	return this;
};

/**
 * Get packet fOpts
 * @param {Object} option - null for all options
 * @param {String} encoding - null for object, hex, base64
 */
LoRaPacket.prototype.getFOpts = function (option, encoding)
{
	if (mac.hasFrame (this.mac))
	{
		if (!(typeof option === 'number'))
		{
			encoding = option;
			option = null;
		}
		if (typeof option === 'number')
		{
			if (frame.verifyFOpts (option))
			{
				let fOption = this.mac.frame.fOpts[option];
				if (!encoding) return fOption;
				else if (encoding === 'hex') frame.encodeCommand (option, this.getDirection()===0?'REQ':'ANS').toString ('hex').toUpperCase ();
				else if (encoding === 'base64') frame.encodeCommand (option, this.getDirection()===0?'REQ':'ANS').toString ('base64');
				else
				{
					debug ('LoRaPacket.getFOpts: unknown encoding '+encoding);
					throw new Error ('LoRaPacket.getFOpts: unknown encoding '+encoding);
				}
			}
			else
			{
				debug ('LoRaPacket.getFOpts: unknown option '+option);
				throw new Error ('Unknown option '+option);
			}
		}
		else if (!option)
		{
			return this.mac.frame.fOpts;
		}
		else
		{
			debug ('LoRaPacket.getFOpts: unknown option '+option);
			throw new Error ('Unknown option '+option);
		}
	}
	else
	{
		debug ('LoRaPacket.getFOpts: packet has no frame payload, mtype is '+this.getMType ('string'));
		throw new Error ('Packet has no frame payload, mtype is '+this.getMType ('string'));
	}
};

/**
 * Set packet fOpts
 * @param {Number|String} option - null for all options
 * @param {Object} fOpts
 * @param {String} encoding - null for object, hex, base64
 */
LoRaPacket.prototype.setFOpts = function (option, fOpts, encoding)
{
	if (mac.hasFrame (this.mac))
	{
		if (!(typeof option === 'number'))
		{
			encoding = fOpts;
			fOpts = option;
			option = null;
		}
		if (typeof option === 'number')
		{
			if (frame.verifyFOpts (option))
			{
				if (!encoding);
				else if (encoding === 'hex') fOpts = frame.decodeCommand (this.getDirection()===0?'REQ':'ANS', new Buffer (fOpts, 'hex'), null, 0, option);
				else if (encoding === 'base64') fOpts = frame.decodeCommand (this.getDirection()===0?'REQ':'ANS', new Buffer (fOpts, 'base64'), null, 0, option);
				else
				{
					debug ('LoRaPacket.setFOpts: unknown encoding '+encoding);
					throw new Error ('LoRaPacket.setFOpts: unknown encoding '+encoding);
				}
				// TODO verify command
				this.mac.frame.fOpts[option] = fOpts;
				this.reset ();
			}
			else
			{
				debug ('LoRaPacket.setFOpts: unknown option '+option);
				throw new Error ('Unknown option '+option);
			}
		}
		else if (!option)
		{
			if (!encoding && fOpts === 'object');
			else if (encoding === 'hex') fOpts = frame.decodeCommand (this.getDirection()===0?'REQ':'ANS', new Buffer (fOpts, 'hex'), null, 0, option);
			else if (encoding === 'base64') fOpts = frame.decodeCommand (this.getDirection()===0?'REQ':'ANS', new Buffer (fOpts, 'base64'), null, 0, option);
			else
			{
				debug ('LoRaPacket.setFOpts: unknown encoding '+encoding);
				throw new Error ('LoRaPacket.setFOpts: unknown encoding '+encoding);
			}
			// TODO verify command
			this.mac.frame.fOpts[option] = fOpts;
			this.reset ();
		}
		else
		{
			debug ('LoRaPacket.setFOpts: unknown option '+option);
			throw new Error ('Unknown option '+option);
		}
	}
	else
	{
		debug ('LoRaPacket.setFOpts: packet has no frame payload, mtype is '+this.getMType ('string'));
		throw new Error ('Packet has no frame payload, mtype is '+this.getMType ('string'));
	}
	return this;
};

/**
 * Get packet direction
 * @param {String} encoding - null for number, string
 */
LoRaPacket.prototype.getDirection = function (encoding)
{
	let direction = this.mac.mhdr.mtype % 2;
	if (encoding === 'string')
	{
		direction = (direction === LoRaPacket.DIRECTION.UP)?'up':'down';
	}
	return direction;
};

/**
 * Is packet a data packet
 */
LoRaPacket.prototype.isDataPacket = function ()
{
	return mac.hasFrame (this.mac);
};

/**
 * Is packet a join packet
 */
LoRaPacket.prototype.isJoin = function ()
{
	return mac.hasPayload (this.mac);
};

/**
 * Get packet in string format
 * @param {String} encoding - null for default, hex, buffer, base64
 */
LoRaPacket.prototype.toString = function (encoding)
{
	debug ('LoRaPacket.toString');
	return JSON.stringify (this.toJSON (encoding));
};


/**
 * Get packet in JSON format
 * @param {String} encoding - null for default, hex, buffer, base64
 */
LoRaPacket.prototype.toJSON = function (encoding)
{
	debug ('LoRaPacket.toJSON');
	var json = {
		mhdr: {
			mtype: this.mac.mhdr.mtype,
			rfu: this.mac.mhdr.rfu,
			major: this.mac.mhdr.major
		}
	};
	if (mac.hasPayload (this.mac))
	{
		if (this.getMType () === LoRaPacket.MTYPE.MTYPE_JOIN_REQUEST)
		{
			json.payload = {
				devEUI: this.getDevEUI (encoding),
				appEUI: this.getAppEUI (encoding),
				devNonce: this.getDevNonce (encoding)
			};
		}
		else if (this.getMType () === LoRaPacket.MTYPE.MTYPE_JOIN_ACCEPT)
		{
			json.payload = {
				appNonce: this.getAppNonce (encoding),
				netId: this.getNetId (encoding),
				devAddr: this.getDevAddr (encoding),
				rx1DRoffset: this.getRx1DRoffset (encoding),
				rx2DataRate: this.getRx2DataRate (encoding),
				rxDelay: this.getRxDelay (encoding),
				cfList: this.getCFList (encoding)
			};
		}
	}
	else
	if (mac.hasFrame (this.mac))
	{
		json.frame = {
			fhdr: {
				devAddr: this.getDevAddr (encoding),
				fCtrl:
				{
					adr: this.getFrameAdr (),
					adrAckReq: (this.getDirection () === LoRaPacket.DIRECTION.UP)?this.getFrameAdrAckReq ():0,
					ack: this.getFrameAck (),
					pending: (this.getDirection () === LoRaPacket.DIRECTION.DOWN)?this.getFrameFPending ():0,
					fOptsLen: this.getFrameFOptsLen ()
				},
				fCnt: this.getFCnt (),
				fOpts: this.getFOpts (encoding)
			},
			fPort: this.getFPort (encoding),
			frmPayload: this.getFrmPayload (encoding)
		};
	}
	json.mic = this.getMic (encoding);
	return json;
};


/**
 * Get packet payload DevEUI
 * @param {String} encoding - null for hex, buffer, base64
 */
LoRaPacket.prototype.getDevEUI = function (encoding)
{
	let devEUI;
	if (mac.hasPayload (this.mac) && this.getDirection () === LoRaPacket.DIRECTION.UP)
	{
		devEUI = getStringWithEncoding (this.mac.payload.devEUI, LoRaPacket.SIZE.DEV_EUI, encoding);
	}
	else
	{
		debug ('LoRaPacket.getDevEUI: packet has no payload or is not an uplink packet, mtype is '+this.getMType ('string'));
		throw new Error ('Packet has no payload or is not an uplink packet, mtype is '+this.getMType ('string'));
	}
	return devEUI;
};

/**
 * Set packet payload devEUI
 * @param {String|Buffer} devEUI
 * @param {String} encoding - null is hex, buffer, base64
 */
LoRaPacket.prototype.setDevEUI = function (devEUI, encoding)
{
	if (mac.hasPayload (this.mac) && this.getDirection () === LoRaPacket.DIRECTION.UP)
	{
		devEUI = getStringFromEncoding (devEUI, LoRaPacket.SIZE.DEV_EUI, encoding);
		
		if (join.verifyDevEUI(devEUI))
		{
			this.mac.payload.devEUI = devEUI;
			this.reset ();
		}
		else
		{
			throw new Error ('devEUI value is out of bounds '+devEUI);
		}
	}
	else
	{
		debug ('LoRaPacket.setDevEUI: packet has no payload or is not a downlink, mtype is '+this.getMType ('string'));
		throw new Error ('Packet has no payload or is not a downlink, mtype is '+this.getMType ('string'));
	}
	return this;
};

/**
 * Get packet payload AppEUI
 * @param {String} encoding - null for hex, buffer, base64
 */
LoRaPacket.prototype.getAppEUI = function (encoding)
{
	let appEUI;
	if (mac.hasPayload (this.mac) && this.getMType () === LoRaPacket.MTYPE.MTYPE_JOIN_REQUEST)
	{
		appEUI = getStringWithEncoding (this.mac.payload.appEUI, LoRaPacket.SIZE.APP_EUI, encoding);
	}
	else
	{
		debug ('LoRaPacket.getAppEUI: packet has no payload or is not a Join Request packet, mtype is '+this.getMType ('string'));
		throw new Error ('Packet has no payload or is not a Join Request, mtype is '+this.getMType ('string'));
	}
	return appEUI;
};

/**
 * Set packet payload appEUI
 * @param {String|Buffer} appEUI
 * @param {String} encoding - null is hex, buffer, base64
 */
LoRaPacket.prototype.setAppEUI = function (appEUI, encoding)
{
	if (mac.hasPayload (this.mac) && this.getMType () === LoRaPacket.MTYPE.MTYPE_JOIN_REQUEST)
	{
		appEUI = getStringFromEncoding (appEUI, LoRaPacket.SIZE.APP_EUI, encoding);
		
		if (join.verifyAppEUI(appEUI))
		{
			this.mac.payload.appEUI = appEUI;
			this.reset ();
		}
		else
		{
			throw new Error ('appEUI value is out of bounds '+appEUI);
		}
	}
	else
	{
		debug ('LoRaPacket.setAppEUI: packet has no payload or is not a Join Request, mtype is '+this.getMType ('string'));
		throw new Error ('Packet has no payload is not a Join Request, mtype is '+this.getMType ('string'));
	}
	return this;
};

/**
 * Get packet payload DevNonce
 * @param {String} encoding - null for number, hex, base64
 */
LoRaPacket.prototype.getDevNonce = function (encoding)
{
	let devNonce;
	if (mac.hasPayload (this.mac) && this.getMType () === LoRaPacket.MTYPE.MTYPE_JOIN_REQUEST)
	{
		devNonce = getNumberWithEncoding (this.mac.payload.devNonce, encoding, LoRaPacket.SIZE.DEV_NONCE);
	}
	else
	{
		debug ('LoRaPacket.getDevNonce: packet has no payload or is not a Join Request packet, mtype is '+this.getMType ('string'));
		throw new Error ('Packet has no payload or is not a Join Request, mtype is '+this.getMType ('string'));
	}
	return devNonce;
};

/**
 * Set packet payload devNonce
 * @param {Number|String|Buffer} devNonce
 * @param {String} encoding - null is hex, buffer, base64
 */
LoRaPacket.prototype.setDevNonce = function (devNonce, encoding)
{
	if (mac.hasPayload (this.mac) && this.getMType () === LoRaPacket.MTYPE.MTYPE_JOIN_REQUEST)
	{
		devNonce = getNumberFromEncoding (devNonce, encoding);
		
		if (join.verifyDevNonce(devNonce))
		{
			this.mac.payload.devNonce = devNonce;
			this.reset ();
		}
		else
		{
			throw new Error ('devNonce value is out of bounds '+devNonce);
		}
	}
	else
	{
		debug ('LoRaPacket.setDevNonce: packet has no payload or is not a Join Request packet, mtype is '+this.getMType ('string'));
		throw new Error ('Packet has no payload or is not a Join Request packet, mtype is '+this.getMType ('string'));
	}
	return this;
};

/**
 * Get packet payload AppNonce
 * @param {String} encoding - null for number, hex, base64
 */
LoRaPacket.prototype.getAppNonce = function (encoding)
{
	let appNonce;
	if (mac.hasPayload (this.mac) && this.getMType () === LoRaPacket.MTYPE.MTYPE_JOIN_ACCEPT)
	{
		appNonce = getNumberWithEncoding (this.mac.payload.appNonce, encoding, LoRaPacket.SIZE.APP_NONCE);
	}
	else
	{
		debug ('LoRaPacket.getAppNonce: packet has no payload or is not a Join Accept packet, mtype is '+this.getMType ('string'));
		throw new Error ('Packet has no payload or is not a Join Accept packet, mtype is '+this.getMType ('string'));
	}
	return appNonce;
};

/**
 * Set packet payload AppNonce
 * @param {Number|String|Buffer} appNonce
 * @param {String} encoding - null is hex, buffer, base64
 */
LoRaPacket.prototype.setAppNonce = function (appNonce, encoding)
{
	if (mac.hasPayload (this.mac) && this.getMType () === LoRaPacket.MTYPE.MTYPE_JOIN_ACCEPT)
	{
		appNonce = getNumberFromEncoding (appNonce, encoding);
		
		if (join.verifyAppNonce(appNonce))
		{
			this.mac.payload.appNonce = appNonce;
			this.reset ();
		}
		else
		{
			throw new Error ('appNonce value is out of bounds '+appNonce);
		}
	}
	else
	{
		debug ('LoRaPacket.setAppNonce: packet has no payload or is Join Accept packet, mtype is '+this.getMType ('string'));
		throw new Error ('Packet has no payload or is not a Join Accept packet, mtype is '+this.getMType ('string'));
	}
	return this;
};

/**
 * Get packet payload NetID
 * @param {String} encoding - null for number, hex, base64
 */
LoRaPacket.prototype.getNetId = function (encoding)
{
	let netId;
	if (mac.hasPayload (this.mac) && this.getMType () === LoRaPacket.MTYPE.MTYPE_JOIN_ACCEPT)
	{
		netId = getNumberWithEncoding (this.mac.payload.netId, encoding, LoRaPacket.SIZE.NET_ID);
	}
	else
	{
		debug ('LoRaPacket.getNetId: packet has no payload or is not a Join Request packet, mtype is '+this.getMType ('string'));
		throw new Error ('Packet has no payload or is not a Join Request, mtype is '+this.getMType ('string'));
	}
	return netId;
};

/**
 * Set packet payload NetID
 * @param {Number|Buffer} netId
 * @param {String} encoding - null is number, hex, base64
 */
LoRaPacket.prototype.setNetId = function (netId, encoding)
{
	if (mac.hasPayload (this.mac) && this.getMType () === LoRaPacket.MTYPE.MTYPE_JOIN_ACCEPT)
	{
		netId = getNumberFromEncoding (netId, encoding);
		
		if (join.verifyNetId(netId))
		{
			this.mac.payload.netId = netId;
			this.reset ();
		}
		else
		{
			throw new Error ('netId value is out of bounds '+netId);
		}
	}
	else
	{
		debug ('LoRaPacket.setNetId: packet has no payload or is not a Join Request, mtype is '+this.getMType ('string'));
		throw new Error ('Packet has no payload is not a Join Request, mtype is '+this.getMType ('string'));
	}
	return this;
};

/**
 * Get packet payload Rx1DRoffset
 * @param {String} encoding - null for number, hex, base64
 */
LoRaPacket.prototype.getRx1DRoffset = function (encoding)
{
	let rx1DRoffset;
	if (mac.hasPayload (this.mac) && this.getMType () === LoRaPacket.MTYPE.MTYPE_JOIN_ACCEPT)
	{
		rx1DRoffset = getNumberWithEncoding (this.mac.payload.rx1DRoffset, encoding, LoRaPacket.SIZE.RX1DROFFSET);
	}
	else
	{
		debug ('LoRaPacket.getRx1DRoffset: packet has no payload or is not a Join Accept packet, mtype is '+this.getMType ('string'));
		throw new Error ('Packet has no payload or is not a Join Accept packet, mtype is '+this.getMType ('string'));
	}
	return rx1DRoffset;
};

/**
 * Set packet payload Rx1DRoffset
 * @param {Number|Buffer|String} rx1DRoffset
 * @param {String} encoding - null is hex, buffer, base64
 */
LoRaPacket.prototype.setRx1DRoffset = function (rx1DRoffset, encoding)
{
	if (mac.hasPayload (this.mac) && this.getMType () === LoRaPacket.MTYPE.MTYPE_JOIN_ACCEPT)
	{
		rx1DRoffset = getNumberFromEncoding (rx1DRoffset, encoding);
		
		if (join.verifyRx1DRoffset(rx1DRoffset))
		{
			this.mac.payload.rx1DRoffset = rx1DRoffset;
			this.reset ();
		}
		else
		{
			throw new Error ('rx1DRoffset value is out of bounds '+rx1DRoffset);
		}
	}
	else
	{
		debug ('LoRaPacket.setRx1DRoffset: packet has no payload or is Join Accept packet, mtype is '+this.getMType ('string'));
		throw new Error ('Packet has no payload or is not a Join Accept packet, mtype is '+this.getMType ('string'));
	}
	return this;
};

/**
 * Get packet payload Rx2DataRate
 * @param {String} encoding - null for number, hex, base64
 */
LoRaPacket.prototype.getRx2DataRate = function (encoding)
{
	let rx2DataRate;
	if (mac.hasPayload (this.mac) && this.getMType () === LoRaPacket.MTYPE.MTYPE_JOIN_ACCEPT)
	{
		rx2DataRate = getNumberWithEncoding (this.mac.payload.rx2DataRate, encoding, LoRaPacket.SIZE.RX2DATARATE);
	}
	else
	{
		debug ('LoRaPacket.getRx2DataRate: packet has no payload or is not a Join Accept packet, mtype is '+this.getMType ('string'));
		throw new Error ('Packet has no payload or is not a Join Accept packet, mtype is '+this.getMType ('string'));
	}
	return rx2DataRate;
};

/**
 * Set packet payload rx2DataRate
 * @param {Number|Buffer|String} Rx2DataRate
 * @param {String} encoding - null is hex, buffer, base64
 */
LoRaPacket.prototype.setRx2DataRate = function (rx2DataRate, encoding)
{
	if (mac.hasPayload (this.mac) && this.getMType () === LoRaPacket.MTYPE.MTYPE_JOIN_ACCEPT)
	{
		rx2DataRate = getNumberFromEncoding (rx2DataRate, encoding);
		
		if (join.verifyRx2DataRate(rx2DataRate))
		{
			this.mac.payload.rx2DataRate = rx2DataRate;
			this.reset ();
		}
		else
		{
			throw new Error ('rx2DataRate value is out of bounds '+rx2DataRate);
		}
	}
	else
	{
		debug ('LoRaPacket.setRx2DataRate: packet has no payload or is Join Accept packet, mtype is '+this.getMType ('string'));
		throw new Error ('Packet has no payload or is not a Join Accept packet, mtype is '+this.getMType ('string'));
	}
	return this;
};

/**
 * Get packet payload RxDelay
 * @param {String} encoding - null for number, hex, base64
 */
LoRaPacket.prototype.getRxDelay = function (encoding)
{
	let rxDelay;
	if (mac.hasPayload (this.mac) && this.getMType () === LoRaPacket.MTYPE.MTYPE_JOIN_ACCEPT)
	{
		rxDelay = getNumberWithEncoding (this.mac.payload.rxDelay, encoding, LoRaPacket.SIZE.RXDELAY);
	}
	else
	{
		debug ('LoRaPacket.getRxDelay: packet has no payload or is not a Join Accept packet, mtype is '+this.getMType ('string'));
		throw new Error ('Packet has no payload or is not a Join Accept packet, mtype is '+this.getMType ('string'));
	}
	return rxDelay;
};


/**
 * Set packet payload rxDelay
 * @param {Number|Buffer|String} rxDelay
 * @param {String} encoding - null is hex, buffer, base64
 */
LoRaPacket.prototype.setRxDelay = function (rxDelay, encoding)
{
	if (mac.hasPayload (this.mac) && this.getDirection () === LoRaPacket.MTYPE.MTYPE_JOIN_ACCEPT)
	{
		rxDelay = getNumberFromEncoding (rxDelay, encoding);
		
		if (join.verifyRxDelay(rxDelay))
		{
			this.mac.payload.rxDelay = rxDelay;
			this.reset ();
		}
		else
		{
			throw new Error ('rxDelay value is out of bounds '+rxDelay);
		}
	}
	else
	{
		debug ('LoRaPacket.setRxDelay: packet has no payload or is not Join Accept packet, mtype is '+this.getMType ('string'));
		throw new Error ('Packet has no payload or is not Join Accept packet, mtype is '+this.getMType ('string'));
	}
	return this;
};

/**
 * Get packet payload CFList
 */
LoRaPacket.prototype.getCFList = function ()
{
	let cfList;
	if (mac.hasPayload (this.mac) && this.getDirection () === LoRaPacket.DIRECTION.DOWN)
	{
		cfList = this.mac.payload.cfList;
	}
	else
	{
		debug ('LoRaPacket.getCFList: packet has no payload or is not a Join Accept packet, mtype is '+this.getMType ('string'));
		throw new Error ('Packet has no payload or is not a Join Accept packet, mtype is '+this.getMType ('string'));
	}
	return cfList;
};

/**
 * Set packet payload cfList
 * @param {Number[]} cfList
 */
LoRaPacket.prototype.setCFList = function (cfList)
{
	if (mac.hasPayload (this.mac) && this.getDirection () === LoRaPacket.DIRECTION.DOWN)
	{	
		if (join.verifyCFList(cfList))
		{
			this.mac.payload.cfList = cfList;
			this.reset ();
		}
		else
		{
			throw new Error ('cfList has to be empty or have 5 elements '+cfList);
		}
	}
	else
	{
		debug ('LoRaPacket.setAppNonce: packet has no payload or is not a JoinAccept packet, mtype is '+this.getMType ('string'));
		throw new Error ('Packet has no payload or is not a Join Accept packet, mtype is '+this.getMType ('string'));
	}
	return this;
};

/**
 * Set flag
 * @param {String} namespace
 * @param {String} flag
 * @param {*} data
 */
LoRaPacket.prototype.setFlag = function (namespace, flag, data)
{
	if (!this.flags[namespace]) this.flags[namespace] = {};
	this.flags[namespace][flag] = data;
};

/**
 * Get flag
 * @param {String} namespace
 * @param {String} flag
 */
LoRaPacket.prototype.getFlag = function (namespace, flag)
{
	let data = null;
	if (this.flags[namespace])
	{
		data = this.flags[namespace][flag];
	}
	return data;
};

module.exports = LoRaPacket;

module.exports.decode = mac.decode;
module.exports.compute = mac.computeMic;
module.exports.decryptFramePayload = frame.decryptFramePayload;
module.exports.encryptFramePayload = frame.encryptFramePayload;
// module.exports.verifyMic = verifyMic;
module.exports.encode = mac.encode;

