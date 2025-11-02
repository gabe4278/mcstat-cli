function toUUID(hex) {
	let b1 = hex.slice(0, 8);
	let b2 = hex.slice(8, 12);
	let b3 = hex.slice(12, 16);
	let b4 = hex.slice(16, 20);
	let b5 = hex.slice(20, 32);

	return `${b1}-${b2}-${b3}-${b4}-${b5}`;
}

class Packet {
	constructor() {
		this.buffer = Buffer.alloc(0);
		this.bufferUtilConstants = {
			SEGMENT_BITS: 0x7F,
			CONTINUE_BIT: 0x80,
		}
	}

	readByte() {
		let value = this.buffer.readInt8();
		this.buffer = this.buffer.slice(1);
		return value;
	}

	writeByte(value) {
		let b = Buffer.alloc(1);
		b.writeInt8(value);
		this.writeBuffer(b);
	}

	readUByte() {
		let value = this.buffer.readUInt8();
		this.buffer = this.buffer.slice(1);
		return value;
	}

	writeUByte(value) {
		let b = Buffer.alloc(1);
		b.writeUInt8(value);
		this.writeBuffer(b);
	}

	readVarInt() {
		var value = 0;
		var position = 0;
		var currentByte;

		while (true) {
			currentByte = this.readUByte();
			value |= (currentByte & this.bufferUtilConstants.SEGMENT_BITS) << position;

			if ((currentByte & this.bufferUtilConstants.CONTINUE_BIT) == 0) break;

			position += 7;

			if (position >= 32) throw new Error("VarInt is too big");
		}

		return value;
	}

	writeVarInt(value) {
		while (true) {
			if ((value & ~this.bufferUtilConstants.SEGMENT_BITS) == 0) {
				this.writeUByte(value);
				return;
			}

			this.writeUByte((value & this.bufferUtilConstants.SEGMENT_BITS) | this.bufferUtilConstants.CONTINUE_BIT);

			// Note: >>> means that the sign bit is shifted with the rest of the number rather than being left alone
			value >>>= 7;
		}
	}

	readVarLong() {
		var value = 0;
		var position = 0;
		var currentByte;

		while (true) {
			currentByte = this.readUByte();
			value |= (currentByte & this.bufferUtilConstants.SEGMENT_BITS) << position;

			if ((currentByte & this.bufferUtilConstants.CONTINUE_BIT) == 0) break;

			position += 7;

			if (position >= 64) throw new Error("VarLong is too big");
		}

		return value;
	}

	writeVarLong(value) {
		while (true) {
			if ((value & ~(this.bufferUtilConstants.SEGMENT_BITS)) == 0) {
				this.writeUByte(value);
				return;
			}

			this.writeUByte((value & this.bufferUtilConstants.SEGMENT_BITS) | this.bufferUtilConstants.CONTINUE_BIT);

			// Note: >>> means that the sign bit is shifted with the rest of the number rather than being left alone
			value >>>= 7;
		}

	}

	readFloatBE() {
		let value = this.buffer.readFloatBE();
		this.buffer = this.buffer.slice(4);
		return value;
	}

	writeFloatBE(value) {
		let b = Buffer.alloc(4);
		b.writeFloatBE(value);
		this.writeBuffer(b);
	}

	readString() {
		var length = this.readVarInt();
		let value = this.buffer.slice(0, length).toString();
		this.buffer = this.buffer.slice(Buffer.from(value).byteLength);
		return value;
	}

	writeString(value) {
		let b = Buffer.from(value);
		this.writeVarInt(b.byteLength);
		this.writeBuffer(b);
	}

	readUShortBE() {
		let value = this.buffer.readUint16BE();
		this.buffer = this.buffer.slice(2);
	}

	writeUShortBE(value) {
		let b = Buffer.alloc(2);
		b.writeUInt16BE(value);
		this.writeBuffer(b);
	}

	writeBuffer(value) {
		this.buffer = Buffer.concat([this.buffer, value]);
	}

	readBuffer(length) {
		let value = this.buffer.slice(0, length ?? this.buffer.byteLength);
		this.buffer = this.buffer.slice(length ?? this.buffer.byteLength);
		return value;
	}

	readLongBE() {
		let value = this.buffer.readBigInt64BE();
		this.buffer = this.buffer.slice(8);
		return value;
	}

	writeLongBE(value) {
		let b = Buffer.alloc(8);
		b.writeBigInt64BE(value);
		this.writeBuffer(b);
	}

	readDoubleBE() {
		let value = this.buffer.readDoubleBE();
		this.buffer = this.buffer.slice(8);
		return value;
	}

	writeDoubleBE(value) {
		let b = Buffer.alloc(8);
		b.writeDoubleBE(value);
		this.writeBuffer(b)
	}

	writeIntBE(value) {
		let b = Buffer.alloc(4);
		b.writeInt32BE(value);
		this.writeBuffer(b);
	}

	readIntBE() {
		let value = this.buffer.readInt32BE();
		this.buffer = this.buffer.slice(4);
		return value;
	}

	readNTString(readNull) {
		var value = Buffer.alloc(0);
		var byte = this.readByte();
		if (readNull) {
			while (byte !== 0) {
				value = Buffer.concat([value, Buffer.from([byte])]);
				byte = this.readByte();
			}
			return value.toString();
		}
		else return this.readBuffer().toString();
	}

	writeNTString(value, writeNull) {
		this.writeBuffer(Buffer.from(value));
		if (writeNull) this.writeByte(0);
	}

	readBoolean() {
		let value = this.readUByte();
		if (value == 1) return true;
		else if (value == 0) return false;
		else throw new Error(`Invalid boolean byte ${value}`);
	}

	writeBoolean(value) {
		if (typeof value !== "boolean") throw new Error(`The value of 'value' should be of type boolean. Received a type of ${typeof value}`);
		if (value) this.writeUByte(1);
		else this.writeUByte(0);
	}

	readUUID() {
		return toUUID(this.readBuffer(16).toString("hex"));
	}

	writeUUID(value) {
		let uuid = Buffer.from(value.replaceAll("-", ""), "hex");
		if (uuid.byteLength !== 16) throw new Error("The length of UUID should be 16 bytes long");
		this.writeBuffer(uuid);
	}
}

module.exports = Packet;
