/**
 * LoRaPacket 
 * (C) 2017 by Alexandru Radovici (alexandru.radovici@wyliodrin.com)
 * Released under the LGPL v3.0
 * 
 * MAC Error 
 * 
 */

'use strict';

function macError (error, message)
{
	var err = new Error (message);
	err.type = 'mac';
	err.error = error;
	return err;
}

module.exports = macError;