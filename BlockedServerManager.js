const {join} = require("path");
const fs = require("fs");
const crypto = require("crypto");
const https = require("https");
const net = require('net');
const {tmpdir} = require("os");


/**
 * Retrieves server blocklist from Mojang
 * @async
 * @returns {Promise<String>} SHA1-hashed list of blocked servers
 */
function fetchBlockedServersList() {
    return new Promise((resolve, reject) => {
        if (fs.existsSync(join(tmpdir(), "blockedservers.txt")) && (Date.now() - fs.statSync(join(tmpdir(), "blockedservers.txt")).mtime) < 300000) return resolve(fs.readFileSync(join(tmpdir(), "blockedservers.txt"), {encoding: "utf-8"})); // this avoids hammering the mojang API
        https.get("https://sessionserver.mojang.com/blockedservers", res => {
            res.pipe(fs.createWriteStream(join(tmpdir(), "blockedservers.txt")));

            res.on("end", () => resolve(fs.readFileSync(join(tmpdir(), "blockedservers.txt"), {encoding: "utf-8"})));

            res.on("error", e => reject(e));
        }).on("error", e => reject(e));
    });
}

/**
 * Check if a url / ip is in the server Blocklist.
 * Not really a common function but you cant stop me!
 * @param url {String} Url / Ip to Check
 * @param blocked {Array<String>} Hashed Array of blocked servers
 * @returns {boolean} True / False
 */
function checkIfBlocked(url, blocked) {
    let shaSum = crypto.createHash('sha1');
    shaSum.update(url);
    url = shaSum.digest('hex');
    return blocked.indexOf(url) > -1;
}

/**
 * Checks if a minecraft server hostname / ip is blocked
 * @async
 * @param {String} host - Server Hostname / IP
 * @returns {Promise<Boolean>} True / False
 */
function isServerBlocked(host) {
    return new Promise((resolve, reject) => {
        fetchBlockedServersList()
            .then(data => {
                let blocked = data.split('\n');
                let parts = host.split('.');
                let isBlocked = false;

                if (net.isIP(host) === 4) {
                    isBlocked =
                        checkIfBlocked(parts.join('.'), blocked) ||
                        isBlocked;
                    for (let i = 0; i <= parts.length; i++) {
                        parts.pop();
                        isBlocked =
                            checkIfBlocked(
                                `${parts.join('.')}.*`,
                                blocked
                            ) || isBlocked;
                    }
                    resolve(isBlocked);
                }

                isBlocked =
                    checkIfBlocked(parts.join('.'), blocked) ||
                    isBlocked;
                for (let i = 0; i <= parts.length; i++) {
                    isBlocked =
                        checkIfBlocked(
                            `*.${parts.join('.')}`,
                            blocked
                        ) || isBlocked;
                    parts.shift();
                }
                resolve(isBlocked);
            })
            .catch(err => reject(err));
    });
}

module.exports = {
    isBlocked: isServerBlocked
};
