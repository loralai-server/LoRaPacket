# LoRaPacket
LoRa WAN Packet decoder / encoder. For the moment it implements the LoRa WAN v1.0.2 standard.

## Install

    npm install lorapacket

## API

## Classes

<dl>
<dt><a href="#LoRaPacket">LoRaPacket</a></dt>
<dd><p>LoRa WAN Packet</p>
</dd>
</dl>

## Functions

<dl>
<dt><a href="#zero">zero(str, length)</a></dt>
<dd><p>Pack string with 0</p>
</dd>
<dt><a href="#getNumberFromEncoding">getNumberFromEncoding(value, encoding)</a></dt>
<dd><p>Get a number from a string / int with encoded as encoding</p>
</dd>
<dt><a href="#getEncoding">getEncoding(value)</a></dt>
<dd><p>Try to guiess the encoding from value</p>
</dd>
<dt><a href="#getNumberWithEncoding">getNumberWithEncoding(number, encoding)</a></dt>
<dd><p>Get a number with encoding from an int</p>
</dd>
<dt><a href="#getStringFromEncoding">getStringFromEncoding(value, encoding)</a></dt>
<dd><p>Get a string from a string / int / buffer with encoded as encoding</p>
</dd>
<dt><a href="#getStringWithEncoding">getStringWithEncoding(str, encoding)</a></dt>
<dd><p>Get a string with encoding from a string</p>
</dd>
<dt><a href="#getBufferFromEncoding">getBufferFromEncoding(value, encoding)</a></dt>
<dd><p>Get a buffer from a string / buffer with encoded as encoding</p>
</dd>
<dt><a href="#getBufferWithEncoding">getBufferWithEncoding(buf, encoding)</a></dt>
<dd><p>Get a string with encoding from a buffer / int with encoded as encoding</p>
</dd>
</dl>

<a name="LoRaPacket"></a>

## LoRaPacket
LoRa WAN Packet

**Kind**: global class  

* [LoRaPacket](#LoRaPacket)
    * [new LoRaPacket(data, keys, options)](#new_LoRaPacket_new)
    * [.deriveKeys(devNonce, encoding)](#LoRaPacket+deriveKeys)
    * [.getNwkSKey(encoding)](#LoRaPacket+getNwkSKey)
    * [.setNwkSKey(nwkSKey, encoding)](#LoRaPacket+setNwkSKey)
    * [.verifyMic(key, encoding)](#LoRaPacket+verifyMic)
    * [.getComputedMic(encoding, useOriginal, key)](#LoRaPacket+getComputedMic)
    * [.getMic(encoding)](#LoRaPacket+getMic)
    * [.getAppSKey(encoding)](#LoRaPacket+getAppSKey)
    * [.setAppSKey(appSKey, encoding)](#LoRaPacket+setAppSKey)
    * [.getAppKey(encoding)](#LoRaPacket+getAppKey)
    * [.setAppKey(appKey, encoding)](#LoRaPacket+setAppKey)
    * [.verifyPacket()](#LoRaPacket+verifyPacket)
    * [.getMHDR(encoding)](#LoRaPacket+getMHDR)
    * [.pack(encoding, useOriginal)](#LoRaPacket+pack)
    * [.reset()](#LoRaPacket+reset)
    * [.setMHDR(encoding)](#LoRaPacket+setMHDR)
    * [.getMType(encoding)](#LoRaPacket+getMType)
    * [.setMType(mtype)](#LoRaPacket+setMType)
    * [.getMajor()](#LoRaPacket+getMajor)
    * [.setMajor(major)](#LoRaPacket+setMajor)
    * [.getDevAddr(encoding)](#LoRaPacket+getDevAddr)
    * [.setDevAddr(devAddr, encoding)](#LoRaPacket+setDevAddr)
    * [.getFCnt(encoding)](#LoRaPacket+getFCnt)
    * [.setFCnt(fCnt, encoding)](#LoRaPacket+setFCnt)
    * [.hasFramePayload()](#LoRaPacket+hasFramePayload)
    * [.getFPort(encoding)](#LoRaPacket+getFPort)
    * [.setFPort(fPort, encoding)](#LoRaPacket+setFPort)
    * [.getFrmPayload(encoding)](#LoRaPacket+getFrmPayload)
    * [.setFrmPayload(fPort, frmPayload, encoding)](#LoRaPacket+setFrmPayload)
    * [.getDecryptedFrmPayload(encoding)](#LoRaPacket+getDecryptedFrmPayload)
    * [.setFrmPayload(fPort, frmPayload, encoding)](#LoRaPacket+setFrmPayload)
    * [.setDecryptedFrmPayload(fPort, decryptedFrmPayload, encoding)](#LoRaPacket+setDecryptedFrmPayload)
    * [.getFrameAdr(encoding)](#LoRaPacket+getFrameAdr)
    * [.setFrameAdr(adr)](#LoRaPacket+setFrameAdr)
    * [.getFrameAdrAckReq(encoding)](#LoRaPacket+getFrameAdrAckReq)
    * [.setFrameAdrAckReq(adrAckReq)](#LoRaPacket+setFrameAdrAckReq)
    * [.getFrameFPending(encoding)](#LoRaPacket+getFrameFPending)
    * [.setFrameFPending(fPending)](#LoRaPacket+setFrameFPending)
    * [.getFrameAck(encoding)](#LoRaPacket+getFrameAck)
    * [.setFrameAck(ack)](#LoRaPacket+setFrameAck)
    * [.getFrameFOptsLen(encoding)](#LoRaPacket+getFrameFOptsLen)
    * [.setFrameFOptsLen(fOptsLen, encoding)](#LoRaPacket+setFrameFOptsLen)
    * [.getFOpts(option, encoding)](#LoRaPacket+getFOpts)
    * [.setFOpts(option, fOpts, encoding)](#LoRaPacket+setFOpts)
    * [.getDirection(encoding)](#LoRaPacket+getDirection)
    * [.isDataPacket()](#LoRaPacket+isDataPacket)
    * [.isJoin()](#LoRaPacket+isJoin)
    * [.toString(encoding)](#LoRaPacket+toString)
    * [.toJSON(encoding)](#LoRaPacket+toJSON)
    * [.getDevEUI(encoding)](#LoRaPacket+getDevEUI)
    * [.setDevEUI(devEUI, encoding)](#LoRaPacket+setDevEUI)
    * [.getAppEUI(encoding)](#LoRaPacket+getAppEUI)
    * [.setAppEUI(appEUI, encoding)](#LoRaPacket+setAppEUI)
    * [.getDevNonce(encoding)](#LoRaPacket+getDevNonce)
    * [.setDevNonce(devNonce, encoding)](#LoRaPacket+setDevNonce)
    * [.getAppNonce(encoding)](#LoRaPacket+getAppNonce)
    * [.setAppNonce(appNonce, encoding)](#LoRaPacket+setAppNonce)
    * [.getNetId(encoding)](#LoRaPacket+getNetId)
    * [.setNetId(netId, encoding)](#LoRaPacket+setNetId)
    * [.getRx1DRoffset(encoding)](#LoRaPacket+getRx1DRoffset)
    * [.setRx1DRoffset(rx1DRoffset, encoding)](#LoRaPacket+setRx1DRoffset)
    * [.getRx2DataRate(encoding)](#LoRaPacket+getRx2DataRate)
    * [.setRx2DataRate(Rx2DataRate, encoding)](#LoRaPacket+setRx2DataRate)
    * [.getRxDelay(encoding)](#LoRaPacket+getRxDelay)
    * [.setRxDelay(rxDelay, encoding)](#LoRaPacket+setRxDelay)
    * [.getCFList()](#LoRaPacket+getCFList)
    * [.setCFList(cfList)](#LoRaPacket+setCFList)
    * [.setFlag(namespace, flag, data)](#LoRaPacket+setFlag)
    * [.getFlag(namespace, flag)](#LoRaPacket+getFlag)

<a name="new_LoRaPacket_new"></a>

### new LoRaPacket(data, keys, options)
LoRaPacket


| Param | Type | Description |
| --- | --- | --- |
| data | <code>string</code> \| <code>buffer</code> |  |
| keys | <code>object</code> |  |
| keys.appSKey | <code>\*</code> | Application Shared Key |
| keys.nwkSKey | <code>\*</code> | Network Shared Key |
| keys.appKey | <code>\*</code> | Application Key |
| keys.encoding | <code>String</code> | keys encoding, base64 / hex / buffer |
| options | <code>object</code> |  |
| options.encoding | <code>String</code> | base64 / hex |
| options.rejectIfMicFail | <code>boolean</code> | reject packet if mic fails |

<a name="LoRaPacket+deriveKeys"></a>

### loRaPacket.deriveKeys(devNonce, encoding)
Derive nwkSKey and appSKey

**Kind**: instance method of [<code>LoRaPacket</code>](#LoRaPacket)  

| Param | Type | Description |
| --- | --- | --- |
| devNonce | <code>int</code> \| <code>String</code> |  |
| encoding | <code>String</code> | null for number, hex, base64 |

<a name="LoRaPacket+getNwkSKey"></a>

### loRaPacket.getNwkSKey(encoding)
Get network shared key (nwkSKey)

**Kind**: instance method of [<code>LoRaPacket</code>](#LoRaPacket)  

| Param | Type | Description |
| --- | --- | --- |
| encoding | <code>String</code> | null for buffer, hex, base64 |

<a name="LoRaPacket+setNwkSKey"></a>

### loRaPacket.setNwkSKey(nwkSKey, encoding)
Set network shared key

**Kind**: instance method of [<code>LoRaPacket</code>](#LoRaPacket)  

| Param | Type | Description |
| --- | --- | --- |
| nwkSKey | <code>String</code> \| <code>Buffer</code> |  |
| encoding | <code>String</code> | null for buffer, hex, base64 |

<a name="LoRaPacket+verifyMic"></a>

### loRaPacket.verifyMic(key, encoding)
verify mic

**Kind**: instance method of [<code>LoRaPacket</code>](#LoRaPacket)  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>String</code> \| <code>Buffer</code> | use this key instad of packet's nwkSKey |
| encoding | <code>String</code> | null, base64, hex |

<a name="LoRaPacket+getComputedMic"></a>

### loRaPacket.getComputedMic(encoding, useOriginal, key)
Get computed packet MIC

**Kind**: instance method of [<code>LoRaPacket</code>](#LoRaPacket)  

| Param | Type | Description |
| --- | --- | --- |
| encoding | <code>String</code> | null for number, hex, base64 |
| useOriginal | <code>boolean</code> | use the original buffer is available |
| key | <code>String</code> \| <code>Buffer</code> | use this key instead of the nwkSKey |

<a name="LoRaPacket+getMic"></a>

### loRaPacket.getMic(encoding)
Get packet MIC

**Kind**: instance method of [<code>LoRaPacket</code>](#LoRaPacket)  

| Param | Type | Description |
| --- | --- | --- |
| encoding | <code>String</code> | null for number, hex, base64 |

<a name="LoRaPacket+getAppSKey"></a>

### loRaPacket.getAppSKey(encoding)
Get application shared key (appSKey)

**Kind**: instance method of [<code>LoRaPacket</code>](#LoRaPacket)  

| Param | Type | Description |
| --- | --- | --- |
| encoding | <code>String</code> | null for buffer, hex, base64 |

<a name="LoRaPacket+setAppSKey"></a>

### loRaPacket.setAppSKey(appSKey, encoding)
Set application shared key

**Kind**: instance method of [<code>LoRaPacket</code>](#LoRaPacket)  

| Param | Type | Description |
| --- | --- | --- |
| appSKey | <code>String</code> \| <code>Buffer</code> |  |
| encoding | <code>String</code> | null for buffer, hex, base64 |

<a name="LoRaPacket+getAppKey"></a>

### loRaPacket.getAppKey(encoding)
Get application key (appKey)

**Kind**: instance method of [<code>LoRaPacket</code>](#LoRaPacket)  

| Param | Type | Description |
| --- | --- | --- |
| encoding | <code>String</code> | null for buffer, hex, base64 |

<a name="LoRaPacket+setAppKey"></a>

### loRaPacket.setAppKey(appKey, encoding)
Set application key

**Kind**: instance method of [<code>LoRaPacket</code>](#LoRaPacket)  

| Param | Type | Description |
| --- | --- | --- |
| appKey | <code>String</code> \| <code>Buffer</code> |  |
| encoding | <code>String</code> | null for buffer, hex, base64 |

<a name="LoRaPacket+verifyPacket"></a>

### loRaPacket.verifyPacket()
Verify packet data

**Kind**: instance method of [<code>LoRaPacket</code>](#LoRaPacket)  
<a name="LoRaPacket+getMHDR"></a>

### loRaPacket.getMHDR(encoding)
Get packet MHDR

**Kind**: instance method of [<code>LoRaPacket</code>](#LoRaPacket)  

| Param | Type | Description |
| --- | --- | --- |
| encoding | <code>String</code> | null for object, number for actual number, hex for text |

<a name="LoRaPacket+pack"></a>

### loRaPacket.pack(encoding, useOriginal)
pack

**Kind**: instance method of [<code>LoRaPacket</code>](#LoRaPacket)  

| Param | Type | Description |
| --- | --- | --- |
| encoding | <code>String</code> | null for buffer, hex, base64 |
| useOriginal | <code>boolean</code> | use the original buffer if it is available |

<a name="LoRaPacket+reset"></a>

### loRaPacket.reset()
Reset

**Kind**: instance method of [<code>LoRaPacket</code>](#LoRaPacket)  
<a name="LoRaPacket+setMHDR"></a>

### loRaPacket.setMHDR(encoding)
Set packet MHDR

**Kind**: instance method of [<code>LoRaPacket</code>](#LoRaPacket)  

| Param | Type | Description |
| --- | --- | --- |
| encoding | <code>String</code> | null for object, number for actual number, hex for text |

<a name="LoRaPacket+getMType"></a>

### loRaPacket.getMType(encoding)
Get packet MType

**Kind**: instance method of [<code>LoRaPacket</code>](#LoRaPacket)  

| Param | Type | Description |
| --- | --- | --- |
| encoding | <code>String</code> | null for number, string for text |

<a name="LoRaPacket+setMType"></a>

### loRaPacket.setMType(mtype)
Set packet MType

**Kind**: instance method of [<code>LoRaPacket</code>](#LoRaPacket)  

| Param | Type | Description |
| --- | --- | --- |
| mtype | <code>Number</code> \| <code>String</code> | number or string () |

<a name="LoRaPacket+getMajor"></a>

### loRaPacket.getMajor()
Get packet major

**Kind**: instance method of [<code>LoRaPacket</code>](#LoRaPacket)  
<a name="LoRaPacket+setMajor"></a>

### loRaPacket.setMajor(major)
Set packet major

**Kind**: instance method of [<code>LoRaPacket</code>](#LoRaPacket)  

| Param | Type | Description |
| --- | --- | --- |
| major | <code>Number</code> | number |

<a name="LoRaPacket+getDevAddr"></a>

### loRaPacket.getDevAddr(encoding)
Get packet DevAddr

**Kind**: instance method of [<code>LoRaPacket</code>](#LoRaPacket)  

| Param | Type | Description |
| --- | --- | --- |
| encoding | <code>String</code> | null for number, hex or base64 |

<a name="LoRaPacket+setDevAddr"></a>

### loRaPacket.setDevAddr(devAddr, encoding)
Set packet DevAddr

**Kind**: instance method of [<code>LoRaPacket</code>](#LoRaPacket)  

| Param | Type | Description |
| --- | --- | --- |
| devAddr | <code>Number</code> \| <code>String</code> | number or string |
| encoding | <code>String</code> | null for number or hex, base64 |

<a name="LoRaPacket+getFCnt"></a>

### loRaPacket.getFCnt(encoding)
Get packet fPort

**Kind**: instance method of [<code>LoRaPacket</code>](#LoRaPacket)  

| Param | Type | Description |
| --- | --- | --- |
| encoding | <code>String</code> | null for number, hex, base64 |

<a name="LoRaPacket+setFCnt"></a>

### loRaPacket.setFCnt(fCnt, encoding)
Set packet fPort

**Kind**: instance method of [<code>LoRaPacket</code>](#LoRaPacket)  

| Param | Type | Description |
| --- | --- | --- |
| fCnt | <code>Number</code> \| <code>String</code> |  |
| encoding | <code>String</code> | null for number, hex, base64 |

<a name="LoRaPacket+hasFramePayload"></a>

### loRaPacket.hasFramePayload()
Verify if packet has frame payload

**Kind**: instance method of [<code>LoRaPacket</code>](#LoRaPacket)  
<a name="LoRaPacket+getFPort"></a>

### loRaPacket.getFPort(encoding)
Get packet fPort

**Kind**: instance method of [<code>LoRaPacket</code>](#LoRaPacket)  

| Param | Type | Description |
| --- | --- | --- |
| encoding | <code>String</code> | null for number, hex, base64 |

<a name="LoRaPacket+setFPort"></a>

### loRaPacket.setFPort(fPort, encoding)
Set packet fPort

**Kind**: instance method of [<code>LoRaPacket</code>](#LoRaPacket)  

| Param | Type | Description |
| --- | --- | --- |
| fPort | <code>String</code> \| <code>Number</code> |  |
| encoding |  | null for number, hex, base64 |

<a name="LoRaPacket+getFrmPayload"></a>

### loRaPacket.getFrmPayload(encoding)
Get packet frmPayload

**Kind**: instance method of [<code>LoRaPacket</code>](#LoRaPacket)  

| Param | Type | Description |
| --- | --- | --- |
| encoding | <code>String</code> | null for buffer, hex, base64 |

<a name="LoRaPacket+setFrmPayload"></a>

### loRaPacket.setFrmPayload(fPort, frmPayload, encoding)
Set packet frmPayload

**Kind**: instance method of [<code>LoRaPacket</code>](#LoRaPacket)  

| Param | Type | Description |
| --- | --- | --- |
| fPort | <code>Number</code> \| <code>String</code> |  |
| frmPayload | <code>String</code> \| <code>Buffer</code> |  |
| encoding | <code>String</code> | null for buffer, hex, base64 |

<a name="LoRaPacket+getDecryptedFrmPayload"></a>

### loRaPacket.getDecryptedFrmPayload(encoding)
Get packet decrypted frmPayload

**Kind**: instance method of [<code>LoRaPacket</code>](#LoRaPacket)  

| Param | Type | Description |
| --- | --- | --- |
| encoding | <code>String</code> | null for buffer, hex, base64 |

<a name="LoRaPacket+setFrmPayload"></a>

### loRaPacket.setFrmPayload(fPort, frmPayload, encoding)
Set packet frmPayload

**Kind**: instance method of [<code>LoRaPacket</code>](#LoRaPacket)  

| Param | Type | Description |
| --- | --- | --- |
| fPort | <code>Number</code> \| <code>String</code> |  |
| frmPayload | <code>String</code> \| <code>Buffer</code> |  |
| encoding | <code>String</code> | null for buffer, hex, base64 |

<a name="LoRaPacket+setDecryptedFrmPayload"></a>

### loRaPacket.setDecryptedFrmPayload(fPort, decryptedFrmPayload, encoding)
Set packet decrypted frmPayload

**Kind**: instance method of [<code>LoRaPacket</code>](#LoRaPacket)  

| Param | Type | Description |
| --- | --- | --- |
| fPort | <code>Number</code> \| <code>String</code> |  |
| decryptedFrmPayload | <code>String</code> \| <code>Buffer</code> |  |
| encoding | <code>String</code> | null for buffer, hex, base64 |

<a name="LoRaPacket+getFrameAdr"></a>

### loRaPacket.getFrameAdr(encoding)
Get packet frame ADR

**Kind**: instance method of [<code>LoRaPacket</code>](#LoRaPacket)  

| Param | Type | Description |
| --- | --- | --- |
| encoding | <code>String</code> | null for number, boolean |

<a name="LoRaPacket+setFrameAdr"></a>

### loRaPacket.setFrameAdr(adr)
Set packet frame ADR

**Kind**: instance method of [<code>LoRaPacket</code>](#LoRaPacket)  

| Param | Type |
| --- | --- |
| adr | <code>boolean</code> \| <code>Number</code> | 

<a name="LoRaPacket+getFrameAdrAckReq"></a>

### loRaPacket.getFrameAdrAckReq(encoding)
Get packet frame ADR ACK Req

**Kind**: instance method of [<code>LoRaPacket</code>](#LoRaPacket)  

| Param | Type | Description |
| --- | --- | --- |
| encoding | <code>String</code> | null for number, boolean |

<a name="LoRaPacket+setFrameAdrAckReq"></a>

### loRaPacket.setFrameAdrAckReq(adrAckReq)
Set packet frame ADR ACK Req

**Kind**: instance method of [<code>LoRaPacket</code>](#LoRaPacket)  

| Param | Type |
| --- | --- |
| adrAckReq | <code>boolean</code> \| <code>Number</code> | 

<a name="LoRaPacket+getFrameFPending"></a>

### loRaPacket.getFrameFPending(encoding)
Get packet frame FPending

**Kind**: instance method of [<code>LoRaPacket</code>](#LoRaPacket)  

| Param | Type | Description |
| --- | --- | --- |
| encoding | <code>String</code> | null for number, boolean |

<a name="LoRaPacket+setFrameFPending"></a>

### loRaPacket.setFrameFPending(fPending)
Set packet frame FPending

**Kind**: instance method of [<code>LoRaPacket</code>](#LoRaPacket)  

| Param | Type |
| --- | --- |
| fPending | <code>boolean</code> \| <code>Number</code> | 

<a name="LoRaPacket+getFrameAck"></a>

### loRaPacket.getFrameAck(encoding)
Get packet frame ACK

**Kind**: instance method of [<code>LoRaPacket</code>](#LoRaPacket)  

| Param | Type | Description |
| --- | --- | --- |
| encoding | <code>String</code> | null for number, boolean |

<a name="LoRaPacket+setFrameAck"></a>

### loRaPacket.setFrameAck(ack)
Set packet frame ACK

**Kind**: instance method of [<code>LoRaPacket</code>](#LoRaPacket)  

| Param | Type |
| --- | --- |
| ack | <code>boolean</code> \| <code>Number</code> | 

<a name="LoRaPacket+getFrameFOptsLen"></a>

### loRaPacket.getFrameFOptsLen(encoding)
Get packet frame fOptsLen

**Kind**: instance method of [<code>LoRaPacket</code>](#LoRaPacket)  

| Param | Type | Description |
| --- | --- | --- |
| encoding | <code>String</code> | null for number, hex, base64 |

<a name="LoRaPacket+setFrameFOptsLen"></a>

### loRaPacket.setFrameFOptsLen(fOptsLen, encoding)
Set packet frame fOptsLen

**Kind**: instance method of [<code>LoRaPacket</code>](#LoRaPacket)  

| Param | Type | Description |
| --- | --- | --- |
| fOptsLen | <code>Number</code> \| <code>String</code> |  |
| encoding | <code>String</code> | null is number, hex, base64 |

<a name="LoRaPacket+getFOpts"></a>

### loRaPacket.getFOpts(option, encoding)
Get packet fOpts

**Kind**: instance method of [<code>LoRaPacket</code>](#LoRaPacket)  

| Param | Type | Description |
| --- | --- | --- |
| option | <code>Object</code> | null for all options |
| encoding | <code>String</code> | null for object, hex, base64 |

<a name="LoRaPacket+setFOpts"></a>

### loRaPacket.setFOpts(option, fOpts, encoding)
Set packet fOpts

**Kind**: instance method of [<code>LoRaPacket</code>](#LoRaPacket)  

| Param | Type | Description |
| --- | --- | --- |
| option | <code>Number</code> \| <code>String</code> | null for all options |
| fOpts | <code>Object</code> |  |
| encoding | <code>String</code> | null for object, hex, base64 |

<a name="LoRaPacket+getDirection"></a>

### loRaPacket.getDirection(encoding)
Get packet direction

**Kind**: instance method of [<code>LoRaPacket</code>](#LoRaPacket)  

| Param | Type | Description |
| --- | --- | --- |
| encoding | <code>String</code> | null for number, string |

<a name="LoRaPacket+isDataPacket"></a>

### loRaPacket.isDataPacket()
Is packet a data packet

**Kind**: instance method of [<code>LoRaPacket</code>](#LoRaPacket)  
<a name="LoRaPacket+isJoin"></a>

### loRaPacket.isJoin()
Is packet a join packet

**Kind**: instance method of [<code>LoRaPacket</code>](#LoRaPacket)  
<a name="LoRaPacket+toString"></a>

### loRaPacket.toString(encoding)
Get packet in string format

**Kind**: instance method of [<code>LoRaPacket</code>](#LoRaPacket)  

| Param | Type | Description |
| --- | --- | --- |
| encoding | <code>String</code> | null for default, hex, buffer, base64 |

<a name="LoRaPacket+toJSON"></a>

### loRaPacket.toJSON(encoding)
Get packet in JSON format

**Kind**: instance method of [<code>LoRaPacket</code>](#LoRaPacket)  

| Param | Type | Description |
| --- | --- | --- |
| encoding | <code>String</code> | null for default, hex, buffer, base64 |

<a name="LoRaPacket+getDevEUI"></a>

### loRaPacket.getDevEUI(encoding)
Get packet payload DevEUI

**Kind**: instance method of [<code>LoRaPacket</code>](#LoRaPacket)  

| Param | Type | Description |
| --- | --- | --- |
| encoding | <code>String</code> | null for hex, buffer, base64 |

<a name="LoRaPacket+setDevEUI"></a>

### loRaPacket.setDevEUI(devEUI, encoding)
Set packet payload devEUI

**Kind**: instance method of [<code>LoRaPacket</code>](#LoRaPacket)  

| Param | Type | Description |
| --- | --- | --- |
| devEUI | <code>String</code> \| <code>Buffer</code> |  |
| encoding | <code>String</code> | null is hex, buffer, base64 |

<a name="LoRaPacket+getAppEUI"></a>

### loRaPacket.getAppEUI(encoding)
Get packet payload AppEUI

**Kind**: instance method of [<code>LoRaPacket</code>](#LoRaPacket)  

| Param | Type | Description |
| --- | --- | --- |
| encoding | <code>String</code> | null for hex, buffer, base64 |

<a name="LoRaPacket+setAppEUI"></a>

### loRaPacket.setAppEUI(appEUI, encoding)
Set packet payload appEUI

**Kind**: instance method of [<code>LoRaPacket</code>](#LoRaPacket)  

| Param | Type | Description |
| --- | --- | --- |
| appEUI | <code>String</code> \| <code>Buffer</code> |  |
| encoding | <code>String</code> | null is hex, buffer, base64 |

<a name="LoRaPacket+getDevNonce"></a>

### loRaPacket.getDevNonce(encoding)
Get packet payload DevNonce

**Kind**: instance method of [<code>LoRaPacket</code>](#LoRaPacket)  

| Param | Type | Description |
| --- | --- | --- |
| encoding | <code>String</code> | null for number, hex, base64 |

<a name="LoRaPacket+setDevNonce"></a>

### loRaPacket.setDevNonce(devNonce, encoding)
Set packet payload devNonce

**Kind**: instance method of [<code>LoRaPacket</code>](#LoRaPacket)  

| Param | Type | Description |
| --- | --- | --- |
| devNonce | <code>Number</code> \| <code>String</code> \| <code>Buffer</code> |  |
| encoding | <code>String</code> | null is hex, buffer, base64 |

<a name="LoRaPacket+getAppNonce"></a>

### loRaPacket.getAppNonce(encoding)
Get packet payload AppNonce

**Kind**: instance method of [<code>LoRaPacket</code>](#LoRaPacket)  

| Param | Type | Description |
| --- | --- | --- |
| encoding | <code>String</code> | null for number, hex, base64 |

<a name="LoRaPacket+setAppNonce"></a>

### loRaPacket.setAppNonce(appNonce, encoding)
Set packet payload AppNonce

**Kind**: instance method of [<code>LoRaPacket</code>](#LoRaPacket)  

| Param | Type | Description |
| --- | --- | --- |
| appNonce | <code>Number</code> \| <code>String</code> \| <code>Buffer</code> |  |
| encoding | <code>String</code> | null is hex, buffer, base64 |

<a name="LoRaPacket+getNetId"></a>

### loRaPacket.getNetId(encoding)
Get packet payload NetID

**Kind**: instance method of [<code>LoRaPacket</code>](#LoRaPacket)  

| Param | Type | Description |
| --- | --- | --- |
| encoding | <code>String</code> | null for number, hex, base64 |

<a name="LoRaPacket+setNetId"></a>

### loRaPacket.setNetId(netId, encoding)
Set packet payload NetID

**Kind**: instance method of [<code>LoRaPacket</code>](#LoRaPacket)  

| Param | Type | Description |
| --- | --- | --- |
| netId | <code>Number</code> \| <code>Buffer</code> |  |
| encoding | <code>String</code> | null is number, hex, base64 |

<a name="LoRaPacket+getRx1DRoffset"></a>

### loRaPacket.getRx1DRoffset(encoding)
Get packet payload Rx1DRoffset

**Kind**: instance method of [<code>LoRaPacket</code>](#LoRaPacket)  

| Param | Type | Description |
| --- | --- | --- |
| encoding | <code>String</code> | null for number, hex, base64 |

<a name="LoRaPacket+setRx1DRoffset"></a>

### loRaPacket.setRx1DRoffset(rx1DRoffset, encoding)
Set packet payload Rx1DRoffset

**Kind**: instance method of [<code>LoRaPacket</code>](#LoRaPacket)  

| Param | Type | Description |
| --- | --- | --- |
| rx1DRoffset | <code>Number</code> \| <code>Buffer</code> \| <code>String</code> |  |
| encoding | <code>String</code> | null is hex, buffer, base64 |

<a name="LoRaPacket+getRx2DataRate"></a>

### loRaPacket.getRx2DataRate(encoding)
Get packet payload Rx2DataRate

**Kind**: instance method of [<code>LoRaPacket</code>](#LoRaPacket)  

| Param | Type | Description |
| --- | --- | --- |
| encoding | <code>String</code> | null for number, hex, base64 |

<a name="LoRaPacket+setRx2DataRate"></a>

### loRaPacket.setRx2DataRate(Rx2DataRate, encoding)
Set packet payload rx2DataRate

**Kind**: instance method of [<code>LoRaPacket</code>](#LoRaPacket)  

| Param | Type | Description |
| --- | --- | --- |
| Rx2DataRate | <code>Number</code> \| <code>Buffer</code> \| <code>String</code> |  |
| encoding | <code>String</code> | null is hex, buffer, base64 |

<a name="LoRaPacket+getRxDelay"></a>

### loRaPacket.getRxDelay(encoding)
Get packet payload RxDelay

**Kind**: instance method of [<code>LoRaPacket</code>](#LoRaPacket)  

| Param | Type | Description |
| --- | --- | --- |
| encoding | <code>String</code> | null for number, hex, base64 |

<a name="LoRaPacket+setRxDelay"></a>

### loRaPacket.setRxDelay(rxDelay, encoding)
Set packet payload rxDelay

**Kind**: instance method of [<code>LoRaPacket</code>](#LoRaPacket)  

| Param | Type | Description |
| --- | --- | --- |
| rxDelay | <code>Number</code> \| <code>Buffer</code> \| <code>String</code> |  |
| encoding | <code>String</code> | null is hex, buffer, base64 |

<a name="LoRaPacket+getCFList"></a>

### loRaPacket.getCFList()
Get packet payload CFList

**Kind**: instance method of [<code>LoRaPacket</code>](#LoRaPacket)  
<a name="LoRaPacket+setCFList"></a>

### loRaPacket.setCFList(cfList)
Set packet payload cfList

**Kind**: instance method of [<code>LoRaPacket</code>](#LoRaPacket)  

| Param | Type |
| --- | --- |
| cfList | <code>Array.&lt;Number&gt;</code> | 

<a name="LoRaPacket+setFlag"></a>

### loRaPacket.setFlag(namespace, flag, data)
Set flag

**Kind**: instance method of [<code>LoRaPacket</code>](#LoRaPacket)  

| Param | Type |
| --- | --- |
| namespace | <code>String</code> | 
| flag | <code>String</code> | 
| data | <code>\*</code> | 

<a name="LoRaPacket+getFlag"></a>

### loRaPacket.getFlag(namespace, flag)
Get flag

**Kind**: instance method of [<code>LoRaPacket</code>](#LoRaPacket)  

| Param | Type |
| --- | --- |
| namespace | <code>String</code> | 
| flag | <code>String</code> | 

<a name="zero"></a>

## zero(str, length)
Pack string with 0

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| str | <code>String</code> | string |
| length | <code>int</code> | the length it should have |

<a name="getNumberFromEncoding"></a>

## getNumberFromEncoding(value, encoding)
Get a number from a string / int with encoded as encoding

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| value | <code>int</code> \| <code>String</code> |  |
| encoding | <code>String</code> | null for number, hex, base64 |

<a name="getEncoding"></a>

## getEncoding(value)
Try to guiess the encoding from value

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| value | <code>int</code> \| <code>String</code> \| <code>Buffer</code> | the value |

<a name="getNumberWithEncoding"></a>

## getNumberWithEncoding(number, encoding)
Get a number with encoding from an int

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| number | <code>int</code> | the number |
| encoding | <code>String</code> | null for number, hex, base64 |

<a name="getStringFromEncoding"></a>

## getStringFromEncoding(value, encoding)
Get a string from a string / int / buffer with encoded as encoding

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| value | <code>int</code> \| <code>String</code> \| <code>Buffer</code> | the value |
| encoding | <code>String</code> | null for hex, number, buffer, base64 |

<a name="getStringWithEncoding"></a>

## getStringWithEncoding(str, encoding)
Get a string with encoding from a string

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| str | <code>String</code> |  |
| encoding | <code>String</code> | null for hex, buffer, base64 |

<a name="getBufferFromEncoding"></a>

## getBufferFromEncoding(value, encoding)
Get a buffer from a string / buffer with encoded as encoding

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| value | <code>String</code> \| <code>Buffer</code> |  |
| encoding | <code>String</code> | null for buffer, hex, base64 |

<a name="getBufferWithEncoding"></a>

## getBufferWithEncoding(buf, encoding)
Get a string with encoding from a buffer / int with encoded as encoding

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| buf | <code>Buffer</code> |  |
| encoding | <code>String</code> | null for buffer, hex, base64 |


&copy; 2017 Wyliodrin SRL

