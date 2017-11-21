# LoRaPacket
LoRa WAN Packet decoder / encoder. For the moment it implements the LoRa WAN v1.0.2 standard.

## Install

    npm install lorapacket

## Usage

Here are a few usage examples, for more please use the full [documentation](DOCUMENTATION.md).

### Decode data (buffer or string)
````javascript
var LoRaPacket = require ('lorapacket');

var nwkSKey = getNwkSKey ();
var appSKey = getAppSKey ();

// from Buffer
var bufferData = getPacketBuffer ();

var packet = new LoRaPacket (bufferData, {
    nwkSKey,
    appSKey,
    encoding: 'hex'
});

// from String
var bufferData = getPacketString ();

var packet = new LoRaPacket (bufferData, {
    nwkSKey,
    appSKey,
    encoding: 'hex'
},
{
    encoding: 'base64'
});
````

### Encode data 
````javascript
var LoRaPacket = require ('lorapacket');

var nwkSKey = getNwkSKey ();
var appSKey = getAppSKey ();

var packet = new LoRaPacket ({
        mtype: LoRaPacket.MTYPE.MTYPE_UNCONFIRMEWD_DOWNLINK,
        devAddr: '010A020A',
        fCtrl:
        {
            adr: 0),
            adrAckReq: 0,
            ack: 0,
            pending: 0,
            fOptsLen: 0
        },
        fCnt: 1,
        fPort: 2,
        frmPayload: new Buffer ('packet buffer')
    }, {
        nwkSKey,
        appSKey,
        encoding: 'hex'
    }
    );
````


&copy; 2017 Wyliodrin SRL

