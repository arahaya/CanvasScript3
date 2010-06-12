var ByteArray = new Class(Array, function()
{
    var float_pbias = Math.pow(2, 126);
    var float_psgnd = Math.pow(2, 23);
    var FLOAT_POSITIVE_INFINITY = (2 - Math.pow(2, -23)) * Math.pow(2, 127);
    var FLOAT_NEGATIVE_INFINITY = -FLOAT_POSITIVE_INFINITY;
    var double_pbias = Math.pow(2, 1022);
    var double_psgnd = Math.pow(2, 52);
    var DOUBLE_POSITIVE_INFINITY = Number.POSITIVE_INFINITY;
    var DOUBLE_NEGATIVE_INFINITY = Number.NEGATIVE_INFINITY;
    
    function floatToBytes(n)
    {
        if (isNaN(n)) {
            return [0xff, 0xff, 0xff, 0xff];
        }
        if (n >= FLOAT_POSITIVE_INFINITY) {
            return [0x7f, 0x80, 0x00, 0x00];
        }
        if (n <= FLOAT_NEGATIVE_INFINITY) {
            return [0xff, 0x80, 0x00, 0x00];
        }
        if (Math.abs(n) === 0) {
            return [0x00, 0x00, 0x00, 0x00];
        }
        
        var s = n < 0 ? 0x80 : 0;
        var t = Math.log(Math.abs(n)) / Math.LN2;
        var p = Math.floor(t);
        var e, m;

        if (p < -126) {
            e = 0;
            m = float_psgnd * n * float_pbias;
        }
        else {
            e = p + 127;
            m = float_psgnd * (Math.pow(2, t - p) - 1);
        }

        var result = [];
        for (var i = 0; i < 3; i++)
        {
            var x = Math.floor(m / 0x100);
            result.push(m - x * 0x100);
            m = x;
        }

        result[0] = Math.round(result[0]);
        result[result.length - 1] += (e & 0x01) << (8 - 1);
        result.push((e >> 1) + s);
        return result.reverse();
    }
    
    function doubleToBytes(n)
    {
        if (isNaN(n)) {
            return [0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff];
        }
        if (n >= DOUBLE_POSITIVE_INFINITY) {
            return [0x7f, 0xf0, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00];
        }
        if (n <= DOUBLE_NEGATIVE_INFINITY) {
            return [0xff, 0xf0, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00];
        }
        if (Math.abs(n) === 0) {
            return [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00];
        }
        
        var s = n < 0 ? 0x80 : 0;
        var t = Math.log(Math.abs(n)) / Math.LN2;
        var p = Math.floor(t);
        var e, m;

        if (p < -1022) {
            e = 0;
            m = double_psgnd * n * double_pbias;
        }
        else {
            e = p + 1023;
            m = double_psgnd * (Math.pow(2, t - p) - 1);
        }

        var result = [];
        for (var i = 0; i < 7; i++)
        {
            var x = Math.floor(m / 0x100);
            result.push(m - x * 0x100);
            m = x;
        }

        result[0] = Math.round(result[0]);
        result[result.length - 1] += (e & 0x0f) << (8 - 4);
        result.push((e >> 4) + s);
        return result.reverse();
    }
    
    function bytesToNumber(bytes, bias, pbias, psgnd)
    {
        var n = bytes.length;
        var s = bytes[0] & 0x80;
        var e, m;
        if (n == 4) {
            e = ((bytes[0] & 0x7f) << 1) + (bytes[1] >> 7);
            m = bytes[1] & 0x7f;
        }
        else {
            e = ((bytes[0] & 0x7f) << 4) + (bytes[1] >> 4);
            m = bytes[1] & 0x0f;
        }

        for (var i = 2; i < n; i++)
        {
            m = m * 0x100 + bytes[i];
        }

        if (e == bias * 2 + 1) {
            if (m) { return 0 / 0; }
            return (s ? -1 : +1) / 0;
        }

        var result = e ?
            (m / psgnd + 1) * Math.pow(2, e - bias) :
            m / psgnd / pbias;

        return s ? -result : result;
    }
    
    function bytesToFloat(bytes)
    {
        return bytesToNumber(bytes, 127, float_pbias, float_psgnd);
    }
    
    function bytesToDouble(bytes)
    {
        return bytesToNumber(bytes, 1023, double_pbias, double_psgnd);
    }
    
    var EOFErrorMessage = 'Error #2030: End of file was encountered.';
    
    this.__bigEndian = true;
    this.__position = 0;
    this.__init__ = function()
    {
    };
    this.compress = function()
    {
    };
    this.uncompress = function()
    {
    };
    this.readBoolean = function()
    {
        return (this.readUnsignedByte() !== 0) ? true : false;
    };
    this.readByte = function()
    {
        var value = this.readUnsignedByte();
        if (value & 0x80) { value = -((value ^ 0xFF) + 1); }
        return value;
    };
    this.readUnsignedByte = function()
    {
        var start = this.__position;
        var end = start + 1;
        if (end > this.length) { throw new EOFError(EOFErrorMessage); }
        
        var value = this[start];
        this.__position = end;
        return value;
    };
    this.readShort = function()
    {
        var value = this.readUnsignedShort();
        if (value & 0x8000) { value = -((value ^ 0xFFFF) + 1); }
        return value;
    };
    this.readUnsignedShort = function()
    {
        var start = this.__position;
        var end = start + 2;
        if (end > this.length) { throw new EOFError(EOFErrorMessage); }
        
        var value;
        if (this.__bigEndian) {
            value = this[start] << 8 | (this[start+1] & 0xFF);
        }
        else {
            value = this[end] << 8 | (this[end-1] & 0xFF);
        }
        this.__position = end;
        return value;
    };
    this.readInt = function()
    {
        var value = this.readUnsignedInt();
        if (value & 0x80000000) { value = -((value ^ 0xFFFFFFFF) + 1); }
        return value;
    };
    this.readUnsignedInt = function()
    {
        var start = this.__position;
        var end = start + 4;
        if (end > this.length) { throw new EOFError(EOFErrorMessage); }
        
        var value;
        if (this.__bigEndian) {
            value = this[start] << 24 | (0xFF & this[start+1]) << 16 | (0xFF & this[start+2]) << 8 | (0xFF & this[start+3]);
        }
        else {
            value = this[end] << 24 | (0xFF & this[end-1]) << 16 | (0xFF & this[end-2]) << 8 | (0xFF & this[end-3]);
        }
        this.__position = end;
        return value >>> 0;
    };
    this.readFloat = function()
    {
        var start = this.__position;
        var end = start + 4;
        if (end > this.length) { throw new EOFError(EOFErrorMessage); }
        
        var value;
        if (this.__bigEndian) {
            value = bytesToFloat(this.slice(start, end));
        }
        else {
            value = bytesToFloat(this.slice(start, end).reverse());
        }
        this.__position = end;
        return value;
    };
    this.readDouble = function()
    {
        var start = this.__position;
        var end = start + 8;
        if (end > this.length) { throw new EOFError(EOFErrorMessage); }
        
        var value;
        if (this.__bigEndian) {
            value = bytesToDouble(this.slice(start, end));
        }
        else {
            value = bytesToDouble(this.slice(start, end).reverse());
        }
        this.__position = end;
        return value;
    };
    this.readMultiByte = function(length, charset)
    {
        //probably not going to support
        return this.readUTFBytes(length);
    };
    this.readObject = function()
    {
        //someday
    };
    this.readUTF = function()
    {
        var length = this.readShort();
        return this.readUTFBytes(length);
    };
    this.readUTFBytes = function(length)
    {
        var start = this.__position;
        var end = start + length;
        if (end > this.length) { throw new EOFError(EOFErrorMessage); }
        
        var chars = [];
        for (var i = start; i < end; ++i)
        {
            chars.push(String.fromCharCode(this[i]));
        }
        this.__position = end;
        
        var s = chars.join("");
        return decodeURIComponent(escape(s));
    };
    this.writeBoolean = function(value)
    {
        this.writeByte(value);
    };
    this.writeByte = function(value)
    {
        var position = this.__position;
        if (position == this.length) {
            this.push(value & 0xFF);
            position++;
        }
        else {
            this[position++] = value & 0xFF;
        }
        this.__position = position;
    };
    this.writeBytes = function(bytes, offset, length)
    {
        offset = offset | 0;
        length = length | 0 || bytes.length - offset;
        
        var position = this.__position;
        for (var i = offset; i < length; ++i)
        {
            this[position++] = bytes[i];
        }
        this.__position = position;
        if (position > this.length) { this.length = position; }
    };
    this.writeShort = function(value)
    {
        var position = this.__position;
        if (this.__bigEndian) {
            this[position++] = value >> 8  & 0xFF;
            this[position++] = value       & 0xFF;
        }
        else {
            this[position++] = value       & 0xFF;
            this[position++] = value >> 8  & 0xFF;
        }
        this.__position = position;
        if (position > this.length) { this.length = position; }
    };
    this.writeInt = function(value)
    {
        var position = this.__position;
        if (this.__bigEndian) {
            this[position++] = value >> 24 & 0xFF;
            this[position++] = value >> 16 & 0xFF;
            this[position++] = value >> 8  & 0xFF;
            this[position++] = value       & 0xFF;
        }
        else {
            this[position++] = value       & 0xFF;
            this[position++] = value >> 8  & 0xFF;
            this[position++] = value >> 16 & 0xFF;
            this[position++] = value >> 24 & 0xFF;
        }
        this.__position = position;
        if (position > this.length) { this.length = position; }
    };
    this.writeUnsignedInt = function(value)
    {
        this.writeInt(value >>> 0);
    };
    this.writeFloat = function(value)
    {
        var bytes = floatToBytes(+value);
        var position = this.__position;
        if (this.__bigEndian) {
            this[position++] = bytes[0];
            this[position++] = bytes[1];
            this[position++] = bytes[2];
            this[position++] = bytes[3];
        }
        else {
            this[position++] = bytes[3];
            this[position++] = bytes[2];
            this[position++] = bytes[1];
            this[position++] = bytes[0];
        }
        this.__position = position;
        if (position > this.length) { this.length = position; }
    };
    this.writeDouble = function(value)
    {
        var bytes = doubleToBytes(+value);
        var position = this.__position;
        if (this.__bigEndian) {
            this[position++] = bytes[0];
            this[position++] = bytes[1];
            this[position++] = bytes[2];
            this[position++] = bytes[3];
            this[position++] = bytes[4];
            this[position++] = bytes[5];
            this[position++] = bytes[6];
            this[position++] = bytes[7];
        }
        else {
            this[position++] = bytes[7];
            this[position++] = bytes[6];
            this[position++] = bytes[5];
            this[position++] = bytes[4];
            this[position++] = bytes[3];
            this[position++] = bytes[2];
            this[position++] = bytes[1];
            this[position++] = bytes[0];
        }
        this.__position = position;
        if (position > this.length) { this.length = position; }
    };
    this.writeMultiByte = function(value, charSet)
    {
        //probably not going to support
        this.writeUTFBytes(value);
    };
    this.writeObject = function(value)
    {
        //someday
    };
    this.writeUTF = function(value)
    {
        var bytes = [];
        var s = unescape(encodeURIComponent(value));
        var length = s.length;
        
        if (length > 0xFFFF) {
            throw new RangeError('Error #2006 : The supplied index is out of bounds.');
        }
        
        this.writeShort(length);
        
        var position = this.__position;
        for (var i = 0; i < length; ++i)
        {
            this[position++] = s.charCodeAt(i);
        }
        this.__position = position;
        if (position > this.length) { this.length = position; }
    };
    this.writeUTFBytes = function(value)
    {
        var bytes = [];
        var s = unescape(encodeURIComponent(value));
        var length = s.length;
        
        var position = this.__position;
        for (var i = 0; i < length; ++i)
        {
            this[position++] = s.charCodeAt(i);
        }
        this.__position = position;
        if (position > this.length) { this.length = position; }
    };
    
    this.getBytesAvailable = function()
    {
        return Math.max(this.length - this.__position, 0);
    };
    this.getEndian = function()
    {
        return (this.__bigEndian) ? Endian.BIG_ENDIAN : Endian.LITTLE_ENDIAN;
    };
    this.setEndian = function(v)
    {
        this.__bigEndian = (v == Endian.BIG_ENDIAN);
    };
    this.getPosition = function()
    {
        return this.__position;
    };
    this.setPosition = function(v)
    {
        v = Math.max(v | 0, 0);
        if (v > this.length) {
            //fill the array with zeros until length == position
            var len = v - this.length;
            for (var i = 0; i < len; ++i)
            {
                this.push(0);
            }
        }
        this.__position = Math.max(v, 0);
    };
});
ByteArray.prototype.__defineGetter__("bytesAvailable", ByteArray.prototype.getBytesAvailable);
ByteArray.prototype.__defineGetter__("endian", ByteArray.prototype.getEndian);
ByteArray.prototype.__defineSetter__("endian", ByteArray.prototype.setEndian);
ByteArray.prototype.__defineGetter__("position", ByteArray.prototype.getPosition);
ByteArray.prototype.__defineSetter__("position", ByteArray.prototype.setPosition);
ByteArray.prototype.toString = function()
{
    return this.map(function(element, index, array)
    {
        return String.fromCharCode(element);
    }, this).join("");
};
ByteArray.prototype.toArray = function()
{
    return this.splice(0);
};
