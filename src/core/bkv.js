// big endian

/**
 * bkv schema:
 * [
 *   {
 *     "key": 0x01,
 *     "key_type": "number|string",
 *     "key_name": "",
 *     "key_id": "", // optional
 *     "remark": "", // optional
 *     "value_type": "uint8|uint16|uint32|uint64|string|bkv"
 *   }
 * ]
 */


/**
 * @param v
 * @returns {boolean}
 */
function isString(v) {
  return typeof v === 'string' || v instanceof String
}

/**
 * @param v
 * @returns {boolean}
 */
function isNumber(v) {
  return Number.isInteger(v)
}

/**
 * @param v
 * @returns {Uint8Array}
 */
function ensureBuffer(v) {
  if (v instanceof ArrayBuffer) {
    return new Uint8Array(v);
  }

  if (v instanceof Uint8Array) {
    return v;
  }

  if (isString(v)) {
    return new stringToBuffer(v);
  }

  if (isNumber(v)) {
    return encodeNumber(v);
  }

  throw new Error("invalid value, can not be converted to buffer")
}

/**
 *
 * @param v
 * @returns {Uint8Array}
 */
function encodeNumber(v) {
  let b = new Uint8Array(8);
  let i = 0;
  while (v > 0) {
    b[i] = v & 0xFF;
    v >>= 8;
    i++;
  }

  return b.slice(0, i).reverse();
}

/**
 * @param v {Uint8Array}
 * @returns {number}
 */
function decodeNumber(v) {
  let n = 0;
  if (v.length > 8) {
    v = v.slice(0, 8);
  }

  for (let i = 0; i < v.length; i++) {
    let b = v[i];
    n <<= 8;
    n |= b;
  }

  return n;
}

/**
 * @param l {number}
 * @returns {Uint8Array}
 */
function encodeLength(l) {
  let b = new Uint8Array(8);
  let i = 0;
  while (l > 0) {
    b[i] = (l & 0x7F) | 0x80;
    l >>= 7;
    i++;
    if (i > 8) {
      throw new Error("invalid length");
    }
  }
  let la = b.slice(0, i);
  la = la.reverse();
  let lastByte = la[i - 1];
  lastByte &= 0x7F;
  la[i - 1] = lastByte;
  return la;
}

/**
 *
 * @param {Uint8Array} buffer
 * @return {{code: number, length: number, lengthByteSize: number}}
 */
function decodeLength(buffer) {
  let la = new Uint8Array(8);
  let lengthByteSize = 0;
  for (let i = 0; i < buffer.length; i++) {
    let b = buffer[i];
    la[i] = b & 0x7F;
    lengthByteSize++;
    if ((b & 0x80) === 0) {
      break;
    }
  }
  if (lengthByteSize === 0 || lengthByteSize > 4) {
    console.log("[BKV] wrong lengthByteSize: ", lengthByteSize);
    return {code: 1, length: 0, lengthByteSize: 0}
  }

  let length = 0;
  for (let i = 0; i < lengthByteSize; i++) {
    length <<= 7;
    length |= la[i];
  }

  return {
    code: 0,
    length: length,
    lengthByteSize: lengthByteSize
  };
}

function hexToBuffer(hex) {
  if (typeof hex !== 'string') {
    throw new TypeError('Expected input to be a string')
  }

  if ((hex.length % 2) !== 0) {
    throw new RangeError('Expected string to be an even number of characters')
  }

  let array = new Uint8Array(hex.length / 2);

  for (let i = 0; i < hex.length; i += 2) {
    array[i / 2] = parseInt(hex.substring(i, i + 2), 16)
  }

  return array
}

function bufferToString(buffer) {
  let content = '';
  for (let i = 0; i < buffer.length; i++) {
    content += String.fromCharCode(buffer[i]);
  }
  return content;
}

/**
 *
 * @param {string} content
 * @return {Uint8Array}
 */
function stringToBuffer(content) {
  let buf = new Uint8Array(content.length);
  for (let i = 0; i < content.length; i++) {
    buf[i] = content.charCodeAt(i);
  }
  return buf;
}

/**
 * @param buffer {Uint8Array}
 * @returns {string}
 */
function bufferToHex(buffer) {
  let hex = '';
  for (let i = 0; i < buffer.length; i++) {
    let h = '00' + buffer[i].toString(16);
    hex += h.substr(-2);
  }
  return hex
}

function concatenateBuffer(resultConstructor, ...arrays) {
  let totalLength = 0;
  for (const arr of arrays) {
    totalLength += arr.length;
  }
  const result = new resultConstructor(totalLength);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}

/**
 * parse buffer to js value
 * @param buffer {Uint8Array}
 * @param type {string}
 */
function parseBuffer(buffer, type) {
  let dv = new DataView(buffer.buffer);
  switch (type) {
    case 'uint8': {
      return buffer[0];
    }

    case 'int8': {
      dv.setInt8(0, value);
      return dv.getInt8(0);
    }

    case 'int16': {
      return dv.getInt16(0);
    }

    case 'uint16': {
      return dv.getUint16(0);
    }

    case 'int32': {
      return dv.getInt32(0);
    }

    case 'uint32': {
      return dv.getInt32(0);
    }

    case 'float32': {
      return dv.getFloat32(0);
    }

    case 'float64': {
      return dv.getFloat64(0);
    }

    case 'string': {
      return bufferToString(buffer);
    }

    default:
      return bufferToHex(buffer).toUpperCase();
  }
}


/**
 *
 * @param items [{key: number|string, key_name: string, value_type: string}]
 */
function validateSchema(items) {
  if (!Array.isArray(items)) {
    throw Error("schema items is not array")
  }

  function validateRequiredProperty(item, key, types) {
    let prop = item[key];
    if (prop === undefined) {
      throw Error(`schema items contains item which has undefined key[${key}]`)
    }

    let propType = typeof prop
    if (types.indexOf(propType) < 0) {
      throw Error(`schema items contains item which has wrong key[${key}] type: ${propType}`)
    }
  }

  let keys = [];

  for (let i in items) {
    let item = items[i];
    if (item == null) {
      throw Error("schema items contains null item")
    }
    if (typeof item !== "object") {
      throw Error("schema items contains none object item")
    }

    validateRequiredProperty(item, 'key', ['number', 'string'])
    let key = item.key;
    if (keys.indexOf(key) >= 0) {
      throw Error(`schema items contains duplicate key[${key}]`)
    }
    keys.push(key);

    validateRequiredProperty(item, 'key_name', ['string'])
    validateRequiredProperty(item, 'value_type', ['string'])
  }
}

function getValueType(key, schema) {
  if (!Array.isArray(schema)) {
    return
  }

  for (let i in schema) {
    let item = schema[i];
    if (typeof item !== 'object') {
      throw new Error("invalid schema")
    }
    if (item.key === key) {
      return item.value_type;
    }
  }
}

function getKeyName(key, schema) {
  if (!Array.isArray(schema)) {
    return
  }

  for (let i in schema) {
    let item = schema[i];
    if (typeof item !== 'object') {
      throw new Error("invalid schema")
    }
    if (item.key === key) {
      return item.key_name;
    }
  }
}

const UNPACK_RESULT_CODE_EMPTY_BUF = 1;
const UNPACK_RESULT_CODE_DECODE_LENGTH_FAIL = -1;
const UNPACK_RESULT_CODE_BUF_NOT_ENOUGH = -2;
const UNPACK_RESULT_CODE_WRONG_KEY_SIZE = -3;

class KV {
  constructor(key, value) {
    this._key = ensureBuffer(key);
    this._value = ensureBuffer(value);
    this._isStringKey = isString(key);
    this._checkKey(key);
  }

  _checkKey(key) {
    if (!isString(key) && !isNumber(key)) {
      throw new Error("key is not string or number")
    }
  }

  /**
   * total length bytes + Key length byte(1 bit number / string flag + 7 bit length) + Key bytes + Value bytes
   * @returns {Uint8Array}
   */
  pack() {
    let keyLength = this._key.length;
    let totalLength = 1 + keyLength + this._value.length;
    let lengthBuffer = encodeLength(totalLength);
    let lengthBufferSize = lengthBuffer.length;
    let finalLength = lengthBufferSize + totalLength;

    let keyLengthByte = keyLength & 0x7F;
    if (this._isStringKey) {
      keyLengthByte |= 0x80;
    }


    let buffer = new Uint8Array(finalLength);
    buffer.set(lengthBuffer, 0);
    buffer[lengthBufferSize] = keyLengthByte;
    buffer.set(this._key, lengthBufferSize + 1);
    buffer.set(this._value, lengthBufferSize + 1 + keyLength);

    return buffer;
  }

  /**
   *
   * @param {Uint8Array} buffer
   * @return {{code: number, kv: KV, pendingParseBuffer: Uint8Array}}
   */
  static unpack(buffer) {
    if (!buffer || buffer.length === 0) {
      return {code: UNPACK_RESULT_CODE_EMPTY_BUF, kv: null, pendingParseBuffer: buffer};
    }

    let dlr = decodeLength(buffer);
    if (dlr.code !== 0) {
      return {code: UNPACK_RESULT_CODE_DECODE_LENGTH_FAIL, kv: null, pendingParseBuffer: null};
    }

    let payloadLength = dlr.length;

    let remainingLength = buffer.length - dlr.lengthByteSize - payloadLength;
    if (remainingLength < 0 || (buffer.length - dlr.lengthByteSize) < 0) {
      return {code: UNPACK_RESULT_CODE_BUF_NOT_ENOUGH, kv: null, pendingParseBuffer: buffer};
    }

    let payload = buffer.slice(dlr.lengthByteSize, dlr.lengthByteSize + dlr.length);
    if (payload.length === 0) {
      return {code: UNPACK_RESULT_CODE_BUF_NOT_ENOUGH, kv: null, pendingParseBuffer: buffer};
    }

    let isStringKey = false;
    let keySizeByte = payload[0];
    let keyLength = keySizeByte & 0x7F;
    if ((keySizeByte & 0x80) !== 0) {
      isStringKey = true;
    }

    let valueLength = payload.length - 1 - keyLength;
    if (valueLength < 0) {
      return {code: UNPACK_RESULT_CODE_WRONG_KEY_SIZE, kv: null, pendingParseBuffer: buffer};
    }

    let keyBuffer = payload.slice(1, 1 + keyLength);
    let key = isStringKey ? bufferToString(keyBuffer) : decodeNumber(keyBuffer);
    let valueBuffer = payload.slice(1 + keyLength);
    let kv = new KV(key, valueBuffer);

    return {
      code: 0,
      kv: kv,
      pendingParseBuffer: buffer.slice(dlr.lengthByteSize + dlr.length)
    }
  }

  /**
   * @return {boolean}
   */
  isStringKey() {
    return this._isStringKey;
  }

  key() {
    return this._isStringKey ? bufferToString(this._key) : decodeNumber(this._key);
  }

  /**
   * @return {number}
   */
  keyLength() {
    return this._key.length;
  }

  /**
   * @return {Uint8Array}
   */
  value() {
    return this._value;
  }

  /**
   * @return {string}
   */
  stringValue() {
    return bufferToString(this._value);
  }

  /**
   * @return {number}
   */
  numberValue() {
    return decodeNumber(this._value)
  }
}

/**
 * @export
 * @class BKV
 */
class BKV {
  constructor() {
    this._kvs = [];

  }

  /**
   * @return {Uint8Array}
   */
  pack() {
    if (this._kvs.length === 0) {
      return new Uint8Array(0);
    }

    let buffer = new Uint8Array(0);
    this._kvs.forEach(kv => {
      buffer = concatenateBuffer(Uint8Array, buffer, kv.pack())
    });

    return buffer;
  }

  /**
   * @param {Uint8Array} buffer
   * @return {{code: number, bkv: BKV, pendingParseBuffer: Uint8Array}}
   */
  static unpack(buffer) {
    let bkv = new BKV();
    while (true) {
      let pr = KV.unpack(buffer);
      if (pr.code === 0) {
        if (pr.kv != null) {
          bkv.add(pr.kv);
        }
        buffer = pr.pendingParseBuffer;
      } else {
        if (pr.code === UNPACK_RESULT_CODE_EMPTY_BUF) {
          break;
        } else {
          return {code: pr.code, bkv: null, pendingParseBuffer: pr.pendingParseBuffer}
        }
      }
    }
    return {code: 0, bkv: bkv, pendingParseBuffer: null};
  }

  /**
   *
   * @return {Array<KV>}
   */
  items() {
    return this._kvs;
  }

  /**
   *
   * @param {KV} kv
   */
  add(kv) {
    this._kvs.push(kv)
  }

  /**
   * @param {string} key
   * @param value
   */
  addByStringKey(key, value) {
    this.add(new KV(key, value));
  }

  /**
   * @param {number} key
   * @param value
   */
  addByNumberKey(key, value) {
    this.add(new KV(key, value));
  }

  getStringValue(key) {
    for (let k in this._kvs) {
      let kv = this._kvs[k];
      if (kv.key() === key) {
        return kv.stringValue();
      }
    }
  }

  getNumberValue(key) {
    for (let k in this._kvs) {
      let kv = this._kvs[k];
      if (kv.key() === key) {
        return kv.numberValue();
      }
    }
  }

  /**
   * @param key
   * @return {boolean}
   */
  containsKey(key) {
    let flag = false;
    for (let k in this._kvs) {
      let kv = this._kvs[k];
      if (kv.key() === key) {
        flag = true;
        break;
      }
    }

    return flag;
  }

  /**
   *
   * @param key
   * @return {Uint8Array}
   */
  get(key) {
    for (let k in this._kvs) {
      let kv = this._kvs[k];
      if (kv.key() === key) {
        return kv.value()
      }
    }
  }

  parse(key, schema) {
    let valueType = getValueType(key, schema);
    let value = this.get(key);
    if (value === undefined) {
      return;
    }

    console.log(key, valueType)

    return parseBuffer(value, valueType);
  }

  dump() {
    for (let i in this._kvs) {
      let kv = this._kvs[i];
      let valueString = bufferToHex(kv.value());
      let valueFirstByte = kv.value()[0];
      if (0x20 <= valueFirstByte && valueFirstByte <= 0x7E) {
        valueString += " (s: " + bufferToString(kv.value()) + ")";
      }

      if (kv.isStringKey()) {
        console.log("[BKV] key[s]: %s -> value[%d]: %s ", kv.key(), kv.value().length, valueString)
      } else {
        console.log("[BKV] key[n]: %s -> value[%d]: %s ", kv.key().toString(16), kv.value().length, valueString)
      }
    }
  }
}

const bkv = {
  BKV: BKV,
  KV: KV,
  bufferToHex: bufferToHex,
  hexToBuffer: hexToBuffer,
  concatenateBuffer: concatenateBuffer,
  stringToBuffer: stringToBuffer,
  validateSchema: validateSchema,
  getKeyName: getKeyName,
  getValueType: getValueType,
  parseBuffer: parseBuffer,
};
// module.exports = bkv;
export default bkv;
