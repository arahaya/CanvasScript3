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
    
    /*
     * http://with-love-from-siberia.blogspot.com/2009/11/ieee754-converter.html
     */
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
        if (n === 0) {
            return [0x00, 0x00, 0x00, 0x00];
        }
        
        var s = n < 0 ? 0x80 : 0;
        var t = Math.log((s ? -n : n)) / 0.6931471805599453;
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

        var result = [0, 0, 0, 0];
        for (var i = 3; i > 0; --i)
        {
            var x = Math.floor(m / 0x100);
            result[i] = m - x * 0x100;
            m = x;
        }

        result[3]  = (result[3] + 0.5) | 0;
        result[1] += (e & 0x01) << 7;
        result[0]  = (e >> 1) + s;
        
        return result;
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
        if (n === 0) {
            return [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00];
        }
        
        var s = n < 0 ? 0x80 : 0;
        var t = Math.log((s ? -n : n)) / 0.6931471805599453;
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

        var result = [0, 0, 0, 0, 0, 0, 0, 0];
        for (var i = 7; i > 0; --i)
        {
            var x = Math.floor(m / 0x100);
            result[i] = m - x * 0x100;
            m = x;
        }
        
        result[7]  = (result[7] + 0.5) | 0;
        result[1] += (e & 0x0f) << 4;
        result[0]  = (e >> 4) + s;
        
        return result;
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
    
    this.__init__ = function()
    {
        this.__bigEndian = true;
        this.__position = 0;
    };
    this.compress = function()
    {
    };
    this.uncompress = function()
    {
    };
    this.readBoolean = function()
    {
        var start = this.__position;
        var end = start + 1;
        if (end > this.length) { throw new EOFError(EOFErrorMessage); }
        
        var value = this[start];
        this.__position = end;
        return (value) ? true : false;
    };
    this.readByte = function()
    {
        var start = this.__position;
        var end = start + 1;
        if (end > this.length) { throw new EOFError(EOFErrorMessage); }
        
        var value = this[start];
        this.__position = end;
        return (value & 0x80) ? -((value ^ 0xFF) + 1) : value;
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
    this.__readShortB = function()
    {
        var start = this.__position;
        var end = start + 2;
        if (end > this.length) { throw new EOFError(EOFErrorMessage); }
        var value = this[start] << 8 | (this[start+1] & 0xFF);
        this.__position = end;
        return (value & 0x8000) ? -((value ^ 0xFFFF) + 1) : value;
    };
    this.__readShortL = function()
    {
        var start = this.__position;
        var end = start + 2;
        if (end > this.length) { throw new EOFError(EOFErrorMessage); }
        var value = this[end] << 8 | (this[end-1] & 0xFF);
        this.__position = end;
        return (value & 0x8000) ? -((value ^ 0xFFFF) + 1) : value;
    };
    this.readShort = this.__readShortB;
    this.__readUnsignedShortB = function()
    {
        var start = this.__position;
        var end = start + 2;
        if (end > this.length) { throw new EOFError(EOFErrorMessage); }
        var value = this[start] << 8 | (this[start+1] & 0xFF);
        this.__position = end;
        return value;
    };
    this.__readUnsignedShortL = function()
    {
        var start = this.__position;
        var end = start + 2;
        if (end > this.length) { throw new EOFError(EOFErrorMessage); }
        var value = this[start] << 8 | (this[start+1] & 0xFF);
        this.__position = end;
        return value;
    };
    this.readUnsignedShort = this.__readUnsignedShortB;
    this.__readIntB = function()
    {
        var start = this.__position;
        var end = start + 4;
        if (end > this.length) { throw new EOFError(EOFErrorMessage); }
        var value = (this[start] << 24 | (0xFF & this[start+1]) << 16 | (0xFF & this[start+2]) << 8 | (0xFF & this[start+3])) >>> 0;
        this.__position = end;
        return  (value & 0x80000000) ? -((value ^ 0xFFFFFFFF) + 1) : value;
    };
    this.__readIntL = function()
    {
        var start = this.__position;
        var end = start + 4;
        if (end > this.length) { throw new EOFError(EOFErrorMessage); }
        var value = (this[end] << 24 | (0xFF & this[end-1]) << 16 | (0xFF & this[end-2]) << 8 | (0xFF & this[end-3])) >>> 0;
        this.__position = end;
        return  (value & 0x80000000) ? -((value ^ 0xFFFFFFFF) + 1) : value;
    };
    this.readInt = this.__readIntB;
    this.__readUnsignedIntB = function()
    {
        var start = this.__position;
        var end = start + 4;
        if (end > this.length) { throw new EOFError(EOFErrorMessage); }
        var value = (this[start] << 24 | (0xFF & this[start+1]) << 16 | (0xFF & this[start+2]) << 8 | (0xFF & this[start+3])) >>> 0;
        this.__position = end;
        return value;
    };
    this.__readUnsignedIntL = function()
    {
        var start = this.__position;
        var end = start + 4;
        if (end > this.length) { throw new EOFError(EOFErrorMessage); }
        var value = (this[end] << 24 | (0xFF & this[end-1]) << 16 | (0xFF & this[end-2]) << 8 | (0xFF & this[end-3])) >>> 0;
        this.__position = end;
        return value;
    };
    this.readUnsignedInt = this.__readUnsignedIntB;
    this.__readFloatB = function()
    {
        var start = this.__position;
        var end = start + 4;
        if (end > this.length) { throw new EOFError(EOFErrorMessage); }
        var value = bytesToFloat(this.slice(start, end));
        this.__position = end;
        return value;
    };
    this.__readFloatL = function()
    {
        var start = this.__position;
        var end = start + 4;
        if (end > this.length) { throw new EOFError(EOFErrorMessage); }
        var value = bytesToFloat(this.slice(start, end).reverse());
        this.__position = end;
        return value;
    };
    this.readFloat = this.__readFloatB;
    this.__readDoubleB = function()
    {
        var start = this.__position;
        var end = start + 8;
        if (end > this.length) { throw new EOFError(EOFErrorMessage); }
        var value = bytesToDouble(this.slice(start, end));
        this.__position = end;
        return value;
    };
    this.__readDoubleL = function()
    {
        var start = this.__position;
        var end = start + 8;
        if (end > this.length) { throw new EOFError(EOFErrorMessage); }
        var value = bytesToDouble(this.slice(start, end).reverse());
        this.__position = end;
        return value;
    };
    this.readDouble = this.__readDoubleB;
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
        for (var i = start, c = 0; i < end;)
        {
            chars[c++] = String.fromCharCode(this[i++]);
        }
        this.__position = end;
        
        var s = chars.join("");
        return decodeURIComponent(escape(s));
    };
    this.writeByte = function(value)
    {
        var position = this.__position;
        this[position++] = value & 0xFF;
        this.__position = position;
        if (position > this.length) { this.length = position; }
    };
    this.writeBoolean = this.writeByte;
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
    this.__writeShortB = function(value)
    {
        var position = this.__position;
        this[position++] = value >> 8 & 0xFF;
        this[position++] = value      & 0xFF;
        this.__position = position;
        if (position > this.length) { this.length = position; }
    };
    this.__writeShortL = function(value)
    {
        var position = this.__position;
        this[position++] = value      & 0xFF;
        this[position++] = value >> 8 & 0xFF;
        this.__position = position;
        if (position > this.length) { this.length = position; }
    };
    this.writeShort = this.__writeShortB;
    this.__writeIntB = function(value)
    {
        var position = this.__position;
        this[position++] = value >> 24 & 0xFF;
        this[position++] = value >> 16 & 0xFF;
        this[position++] = value >> 8  & 0xFF;
        this[position++] = value       & 0xFF;
        this.__position = position;
        if (position > this.length) { this.length = position; }
    };
    this.__writeIntL = function(value)
    {
        var position = this.__position;
        this[position++] = value       & 0xFF;
        this[position++] = value >> 8  & 0xFF;
        this[position++] = value >> 16 & 0xFF;
        this[position++] = value >> 24 & 0xFF;
        this.__position = position;
        if (position > this.length) { this.length = position; }
    };
    this.writeInt = this.__writeIntB;
    this.writeUnsignedInt = function(value)
    {
        this.writeInt(value >>> 0);
    };
    this.__writeFloatB = function(value)
    {
        var bytes = floatToBytes(value);
        var position = this.__position;
        this[position++] = bytes[0];
        this[position++] = bytes[1];
        this[position++] = bytes[2];
        this[position++] = bytes[3];
        this.__position = position;
        if (position > this.length) { this.length = position; }
    };
    this.__writeFloatL = function(value)
    {
        var bytes = floatToBytes(value);
        var position = this.__position;
        this[position++] = bytes[3];
        this[position++] = bytes[2];
        this[position++] = bytes[1];
        this[position++] = bytes[0];
        this.__position = position;
        if (position > this.length) { this.length = position; }
    };
    this.writeFloat = this.__writeFloatB;
    this.__writeDoubleB = function(value)
    {
        var bytes = doubleToBytes(value);
        var position = this.__position;
        this[position++] = bytes[0];
        this[position++] = bytes[1];
        this[position++] = bytes[2];
        this[position++] = bytes[3];
        this[position++] = bytes[4];
        this[position++] = bytes[5];
        this[position++] = bytes[6];
        this[position++] = bytes[7];
        this.__position = position;
        if (position > this.length) { this.length = position; }
    };
    this.__writeDoubleL = function(value)
    {
        var bytes = doubleToBytes(value);
        var position = this.__position;
        this[position++] = bytes[7];
        this[position++] = bytes[6];
        this[position++] = bytes[5];
        this[position++] = bytes[4];
        this[position++] = bytes[3];
        this[position++] = bytes[2];
        this[position++] = bytes[1];
        this[position++] = bytes[0];
        this.__position = position;
        if (position > this.length) { this.length = position; }
    };
    this.writeDouble = this.__writeDoubleB;
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
        var str = unescape(encodeURIComponent(value));
        var length = str.length;
        
        if (length > 0xFFFF) {
            throw new RangeError('Error #2006 : The supplied index is out of bounds.');
        }
        
        this.writeShort(length);
        
        var position = this.__position;
        for (var i = 0; i < length; ++i)
        {
            this[position++] = str.charCodeAt(i);
        }
        this.__position = position;
        if (position > this.length) { this.length = position; }
    };
    this.writeUTFBytes = function(value)
    {
        var str = unescape(encodeURIComponent(value));
        var length = str.length;
        
        var position = this.__position;
        for (var i = 0; i < length; ++i)
        {
            this[position++] = str.charCodeAt(i);
        }
        this.__position = position;
        if (position > this.length) { this.length = position; }
    };
    
    this.__get__bytesAvailable = function()
    {
        return this.length - this.__position;
    };
    this.__get__endian = function()
    {
        return (this.__bigEndian) ? Endian.BIG_ENDIAN : Endian.LITTLE_ENDIAN;
    };
    this.__set__endian = function(v)
    {
        this.__bigEndian = (v == Endian.BIG_ENDIAN);
        var suffix = (this.__bigEndian) ? 'B' : 'L';
        this.readShort = this['__readShort' + suffix];
        this.readUnsignedShort = this['__readUnsignedShort' + suffix];
        this.readInt = this['__readInt' + suffix];
        this.readUnsignedInt = this['__readUnsignedInt' + suffix];
        this.readFloat = this['__readFloat' + suffix];
        this.readDouble = this['__readDouble' + suffix];
        this.writeShort = this['__writeShort' + suffix];
        this.writeInt = this['__writeInt' + suffix];
        this.writeFloat = this['__writeFloat' + suffix];
        this.writeDouble = this['__writeDouble' + suffix];
    };
    this.__get__position = function()
    {
        return this.__position;
    };
    this.__set__position = function(v)
    {
        if (v > this.length) {
            //fill the array with zeros until length == position
            var len = v - this.length;
            for (var i = 0; i < len; ++i)
            {
                this.push(0);
            }
        }
        this.__position = v | 0;
    };
    
    this.toString = function()
    {
        return this.map(function(element, index, array)
        {
            return String.fromCharCode(element);
        }, this).join("");
    };
    
    this.toArray = function()
    {
        return this.splice(0);
    };
});
