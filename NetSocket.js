const {EventEmitter} = require("events");
const Packet = require("./Packet");

class NetSocket extends EventEmitter {
	constructor(conn) {
		super();

		this.conn = conn;
		this.packet = new Packet();
		this.read = false;
		this.packetLength = 0;
		this.offset = 0;

		this.encryption = null;
		this.compression = null;

		this.conn.on("connect", () => {
			this.emit("connect");
		});
		this.conn.on("error", err => this.emit("error", err));

		this.conn.on("data", data => {
			if (data) {
				if (this.encryption) this.packet.buffer = Buffer.concat([this.packet.buffer, this.encryption.decryptPacket(data)]);
				else this.packet.buffer = Buffer.concat([this.packet.buffer, data]);
			}
			if (!this.read) {
				this.read = true;
				this.packetLength = this.packet.readVarInt();
			}
			if (this.packet.buffer.byteLength >= this.packetLength) {
				let packet = new Packet();
				packet.buffer = this.packet.readBuffer(this.packetLength);
				if (this.compression) {
					let packetData = this.compression.decompressPacket(packet);
					this.emit("packet", packetData);
				}
				else {
					this.emit("packet", packet);
				}
				this.read = false;
				this.packetLength = 0;
				if (this.packet.buffer.length !== 0) this.conn.emit("data");
			}
		});

		this.conn.on("end", () => {
			this.emit("end");
		});
	}

	sendPacket(packet) {
		let final = new Packet();
		if (this.compression) {
			let compressedPacket = this.compression.compressPacket(packet).buffer;
			final.writeVarInt(compressedPacket.byteLength);
			final.writeBuffer(compressedPacket);
		}
		else {
			final.writeVarInt(packet.buffer.byteLength);
			final.writeBuffer(packet.buffer);
		}
		if (this.encryption) this.conn.write(this.encryption.encryptPacket(final.buffer));
		else this.conn.write(final.buffer);
	}

	end() {
		this.conn.end();
	}
}

module.exports = NetSocket;
