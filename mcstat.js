#!/usr/bin/env node
const Packet = require("./Packet");
const NetSocket = require("./NetSocket");
const net = require("net");
const dgram = require("dgram");
const crypto = require("crypto");
const dns = require("dns");
const parseExtra = require("./chatParser");
const mccolors = require("./mccolors");

const magicBytes = Buffer.from("00ffff00fefefefefdfdfdfd12345678", "hex");

var verbose = false;

function handleError(err) {
	if (err.syscall == "getaddrinfo") console.error(`Could not stat ${serverAddress}:${serverPort}: Unknown host`);
	else {
		switch (err.code) {
			case "ECONNREFUSED":
				console.error(`Could not stat ${serverAddress}:${serverPort}: Connection refused`);
			break;

			case "ETIMEDOUT":
				console.error(`Could not stat ${serverAddress}:${serverPort}: Timed out`);
			break;

			case "ENETUNREACH":
				console.error(`Could not stat ${serverAddress}:${serverPort}: Network is unreachable`);
			break;

			case "EHOSTUNREACH":
				console.error(`Could not stat ${serverAddress}:${serverPort}: Host is unreachable`);
			break;

			default:
				console.error(`Could not stat ${serverAddress}:${serverPort}: ${err.code}`);
		}
	}
	process.exit();
}

function removeArray(a, item) {
	let m = [];
	for (let i in a) {
		if (a[i] !== item) {
			m.push(a[i]);
		}
	}
	return m;
}

function removeItemFromArray(a, item) {
	let m = [];
	for (let i in a) {
		if (i !== item) {
			m.push(a[i]);
		}
	}
	return m;
}

var helpFlag = false;

var protocolVersion = 773;
var overrideHost;
var overridePort;

var bedrock = false;

if (process.argv.includes("--verbose")) {
	process.argv = removeArray(process.argv, "--verbose");
	verbose = true;
}

if (process.argv.includes("--bedrock")) {
	process.argv = removeArray(process.argv, "--bedrock");
	bedrock = true;
}

if (process.argv.includes("--serverhost")) {
	let index = process.argv.findIndex(i => i == "--serverhost");
	let value = process.argv[index + 1];
	if (!value) {
		console.error("--serverhost: requires parameter");
		console.error("Try 'mcstat --help' for more information.");
		process.exit(-1);
	}
	overrideHost = value;
	process.argv = removeArray(process.argv, "--serverhost");
	process.argv = removeItemFromArray(process.argv, index.toString());
}

if (process.argv.includes("--serverport")) {
	let index = process.argv.findIndex(i => i == "--serverport");
	let value = process.argv[index + 1];
	if (!value) {
		console.error("--serverport: requires parameter");
		console.error("Try 'mcstat --help' for more information.");
		process.exit(-1);
	}
	if (parseInt(value) > 65535 || parseInt(value) < 0) {
		console.error("--serverport: value out of range");
		console.error("Try 'mcstat --help' for more information.");
		process.exit(-1);
	}
	overridePort = parseInt(value);
	process.argv = removeArray(process.argv, "--serverport");
	process.argv = removeItemFromArray(process.argv, index.toString());
}

if (process.argv.includes("--protocolversion")) {
	let index = process.argv.findIndex(i => i == "--protocolversion");
	let value = process.argv[index + 1];
	if (!value) {
		console.error("--protocolversion: requires parameter");
		console.error("Try 'mcstat --help' for more information.");
		process.exit(-1);
	}
	if (parseInt(value) < -2147483648 || parseInt(value) > 2147483647) {
		console.error("--protocolversion: value out of range");
		console.error("Try 'mcstat --help' for more information.");
		process.exit(-1);
	}
	protocolVersion = parseInt(value);
	process.argv = removeArray(process.argv, "-protocolversion");
	process.argv = removeItemFromArray(process.argv, index.toString());
}

if (process.argv.includes("--help")) {
	process.argv = removeArray(process.argv, "--help");
	helpFlag = true;
}

let args = process.argv;
for (const i in args) {
	let arg = args[i];
	if (!arg) continue;
	if (arg.startsWith("--")) process.argv[i] = null;
	if (arg.startsWith('-')) {
		const flags = arg.slice(1);

		for (const flag of flags) {
			if (flag === 'v') verbose = true;
			else if (flag === 'b') bedrock = true;
			else if (flag === 'h') helpFlag = true;
			else if (flag == "p") {
				let value = args[parseInt(i) + 1];
				if (!value) {
					console.error("-p: requires parameter");
					console.error("Try 'mcstat --help' for more information.");
					process.exit(-1);
				}
				if (parseInt(value) > 65535 || parseInt(value) < 0) {
					console.error("-p: value out of range");
					console.error("Try 'mcstat --help' for more information.");
					process.exit(-1);
				}
				process.argv[parseInt(i) + 1] = null;
				overridePort = parseInt(value);
			}
			else if (flag == "s") {
				let value = process.argv[parseInt(i) + 1];
				if (!value) {
					console.error("-s: requires parameter");
					console.error("Try 'mcstat --help' for more information.");
					process.exit(-1);
				}
				process.argv[parseInt(i) + 1] = null;
				overrideHost = value;
			}
			else if (flag == "r") {
				let value = process.argv[parseInt(i) + 1];
				if (!value) {
					console.error("-r: requires parameter");
					console.error("Try 'mcstat --help' for more information.");
					process.exit(-1);
				}
				if (parseInt(value) < -2147483648 || parseInt(value) > 2147483647) {
					console.error("-r: value out of range");
					console.error("Try 'mcstat --help' for more information.");
					process.exit(-1);
				}
				process.argv[parseInt(i) + 1] = null;
				protocolVersion = parseInt(value);
			}
		}
		process.argv[i] = null;
	}
}

// clean up null items and refresh cli arguments after parsing
let newArgs = [];
for (let arg of process.argv) {
	if (arg !== null) newArgs.push(arg);
}
process.argv = newArgs;

if (helpFlag) {
	console.log(`Usage: mcstat [options] <address>[:<port>]`);
	console.log("");
	console.log(`Options:`);
	console.log("-b | --bedrock - Ping a bedrock server");
	console.log("-s | --serverhost <string> - override server host");
	console.log("-p | --serverport <number> - override server port");
	console.log("-r | --protocolversion <number> - set protocol version");
	console.log("-v | --verbose - verbose log output");
	console.log("-h | --help - shows help");
	process.exit(1);
}

if (!process.argv[2]) {
	console.error("No server address specified");
	console.log("Try 'mcstat --help' for more information.");
	process.exit(-1);
}

let servaddress = process.argv[2];
let addr;
let ipv6 = servaddress.match(/\[(.*)\]:?([0-9]+)?/);
if (ipv6) addr = [ipv6[1], ipv6[2]];
else addr = servaddress.split(":");

var hasData = false;
var hasFullData = false;

var serverAddress = addr[0];

if (bedrock) {
	if (overrideHost && verbose) console.warn(`Statting a bedrock server, option '--serverhost' will be omitted`);
	if (overridePort && verbose) console.warn(`Statting a bedrock server, option '--serverport' will be omitted`);
	var serverPort = parseInt(addr[1] ?? 19132);
	dns.lookup(serverAddress, (err, addr, family) => {
		if (!err) {
			if (verbose) {
				if (family == 6) console.log(`* Trying [${addr}]:${serverPort}...`);
				else console.log(`* Trying ${addr}:${serverPort}...`);
			}
			let socket = dgram.createSocket(`udp${family}`);
			if (verbose) console.log(`* Using UDP version ${family}`);
			socket.connect(serverPort, addr);

			socket.on("connect", () => {
				let now = Date.now();
				let clientGUID = crypto.randomBytes(8).readBigInt64BE();
				let unconnectedPing = new Packet();
				unconnectedPing.writeByte(1);
				unconnectedPing.writeLongBE(BigInt(now));
				unconnectedPing.writeBuffer(magicBytes);
				unconnectedPing.writeLongBE(clientGUID);
				if (verbose) {
					console.log("* Sending unconnected ping packet:");
					console.log("< Packet ID: 1");
					console.log(`< Time: ${now}`);
					console.log(`< Magic: ${magicBytes.toString("hex")}`);
					console.log(`< Client GUID: ${parseInt(clientGUID)}`);
				}
				socket.send(unconnectedPing.buffer);

				socket.on("message", (message, recv) => {
					if (recv.address == addr) {
						let packet = new Packet();
						packet.buffer = message;
						let packetId = packet.readByte();
						if (packetId == 0x1c) {
							let time = packet.readLongBE();
							let serverGUID = packet.readLongBE();
							let magic = packet.readBuffer(16);
							if (magic.equals(magicBytes)) {
								if (verbose) {
									console.log("* Response data:");
									console.log("> Packet ID: 28");
									console.log(`> Time: ${parseInt(time)}`);
									console.log(`> Server GUID: ${parseInt(serverGUID)}`);
									console.log(`> Magic: ${magicBytes.toString("hex")}`);
									console.log("> Response data:");
								}
								let serverInfoLen = packet.readUShortBE();
								let serverInfo = packet.readBuffer(serverInfoLen).toString().split(";");
								console.log(`Server type: ${serverInfo[0]}`);
								console.log(`Players online: ${serverInfo[4]}/${serverInfo[5]}`);
								console.log(`Version: ${serverInfo[3]} (protocol version: ${serverInfo[2]})`);
								console.log(`Game Mode: ${serverInfo[8]}`);
								console.log("MOTD:");
								console.log(mccolors(serverInfo[1], false, true));
								console.log("World Name:");
								console.log(mccolors(serverInfo[7], false, true));
								console.log(`Ping: ${Date.now() - now} ms`)
								if (verbose) console.log("* Closing connection");
								socket.close();
								clearTimeout(connectionTimeout);
							}
						}
					}
				});
			});

			socket.on("error", handleError);

			let connectionTimeout = setTimeout(() => {
				if (verbose) console.log("* Closing connection");
				socket.close();
				handleError({code: "ETIMEDOUT"});
			}, 10000);
		}
		else {
			handleError(err);
		}
	});
}
else {
	var serverPort = parseInt(addr[1] ?? 25565);
	dns.resolveSrv(`_minecraft._tcp.${addr[0]}`, (err, addrs) => {
		var conn;
		if (!err && addrs[0]) {
			serverAddress = addrs[0].name;
			serverPort = addrs[0].port;
		}

		if (verbose) {
			if (net.isIPv6(serverAddress)) console.log(`* Trying [${serverAddress}]:${serverPort}...`);
			else console.log(`* Trying ${serverAddress}:${serverPort}...`);
			dns.lookup(serverAddress, (err, addr, family) => {
				if (addr == serverAddress) return;
				if (!err) {
					if (family == 6) console.log(`* Trying [${addr}]:${serverPort}...`);
					else console.log(`* Trying ${addr}:${serverPort}...`);
				}
			});
		}

		conn = net.createConnection({
			host: serverAddress,
			port: serverPort
		});

		conn.setTimeout(30000, () => {
			if (verbose) console.log("* Closing connection");
			console.error(`Could not stat ${serverAddress}:${serverPort}: Timed out`);
			conn.end();
			process.exit();
		});

		const socket = new NetSocket(conn);

		socket.on("error", handleError);

		socket.on("connect", () => {
			if (verbose) console.log("* Connected to server.");
			let hs = new Packet();
			hs.writeVarInt(0x00);
			hs.writeVarInt(protocolVersion);
			hs.writeString(overrideHost ?? addr[0].toLowerCase());
			hs.writeUShortBE(overridePort ?? parseInt(addr[1] ?? 25565));
			hs.writeVarInt(1);
			if (verbose) {
				console.log("* Sending handshake packet:");
				console.log("< Packet ID: 0");
				console.log("< Protocol Version: " + protocolVersion);
				console.log("< Server Address: " + (overrideHost ?? addr[0].toLowerCase()));
				console.log("< Server Port: " + (overridePort ?? parseInt(addr[1] ?? 25565)));
				console.log("< Next State: 1");
			}

			socket.sendPacket(hs);

			let status = new Packet();
			status.writeVarInt(0x00);

			if (verbose) {
				console.log("* Sending status request packet:");
				console.log("< Packet ID: 0");
			}

			socket.sendPacket(status);

			var beforePing;

			socket.on("packet", packet => {
				let packetId = packet.readVarInt();
				if (packetId == 0x00) {
					if (verbose) {
						console.log("* Received status response packet:");
						console.log("> Packet ID: 0");
						console.log("> Response data:");
					}
					let status = JSON.parse(packet.readString());
					if (status.enforcesSecureChat) {
						if (verbose) console.log("* Secure chat is enforced for chat messages to be signed");
					}
					if (status.preventsChatReports) {
						if (verbose) console.log("* NoChatReports plugin installed or ways to prevent chat message reporting on server");
					}
					if (status.players)	console.log(`Players online: ${status.players.online}/${status.players.max}`);
					else console.log("Players online: ???");
					if (status.players?.sample?.length > 0) {
						console.log("Sample players:");
						let samplePlayers = [];
						for (let i in status.players.sample) samplePlayers.push(mccolors(status.players.sample[i].name));
						console.log(samplePlayers.join("\n"));
						if (status.players.online - status.players.sample.length > 0) console.log(`... and ${status.players.online - status.players.sample.length} more ...`);
					}
					if (status.modinfo) {
						console.log(`Mod Type: ${status.modinfo.type}`);
						console.log(`Active mods (${status.modinfo.modList.length}): ${status.modinfo.modList.map(mod => `${mod.modid} ${mod.version}`).join(", ")}`);
					}
					if (status.forgeData) {
						console.log(`FML Network Version: ${status.forgeData.fmlNetworkVersion}`);
						console.log(`Channels (${status.forgeData.channels.length}): ${status.forgeData.channels.map(channel => `${channel.res} ${channel.version}${channel.required && " (required)" || ""}`).join(", ")}`);
						console.log(`Active mods (${status.forgeData.mods.length}): ${status.forgeData.mods.map(mod => `${mod.modId} ${mod.modmarker}`).join(", ")}`);
					}
					console.log(`Version: ${mccolors(status.version.name)} (Protocol version ${status.version.protocol})`);
					console.log(`MOTD:`);
					console.log(parseExtra(status.description));
					let ping = new Packet();
					ping.writeVarInt(0x01);
					beforePing = Date.now();
					ping.writeLongBE(BigInt(beforePing));
					if (verbose) {
						console.log("* Sending ping packet:");
						console.log("< Packet ID: 1");
						console.log("< Time: " + beforePing);
					}
					socket.sendPacket(ping);
					hasData = true;
				}
				else if (packetId == 0x01) {
					let time = packet.readLongBE();
					if (verbose) {
						console.log("* Received pong packet:");
						console.log("> Packet ID: 1");
						console.log("> Time: " + parseInt(time));
					}
					console.log(`Ping: ${Date.now() - beforePing} ms`);
					if (verbose) console.log("* Closing connection");
					socket.end();
					hasFullData = true;
				}
				else {
					if (hasFullData) {
						if (verbose) console.log(`* Read ${packet.buffer.byteLength} bytes extra from status`);
						return;
					};
					if (verbose) console.log("* Could not understand packet id " + packetId);
					throw new Error(`Bad packet id ${packetId}`);
				}
			});
		});

		socket.on("end", () => {
			if (verbose && hasData) console.log(`* Connection to ${serverAddress}:${serverPort} left intact`);
			if (!hasData) console.error(`Could not stat ${serverAddress}:${serverPort}: No data response from server`);
		});
	});
}
