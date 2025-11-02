const translateContent = require("./en_us.json");

const colors = {
    black: "\x1b[30m",
    dark_blue: "\x1b[34m",
    dark_green: "\x1b[32m",
    dark_aqua: "\x1b[36m",
    dark_red: "\x1b[31m",
    dark_purple: "\x1b[35m",
    gold: "\x1b[33m",
    gray: "\x1b[37m",
    dark_gray: "\x1b[90m",
    blue: "\x1b[94m",
    green: "\x1b[92m",
    aqua: "\x1b[96m",
    red: "\x1b[91m",
    light_purple: "\x1b[95m",
    yellow: "\x1b[93m",
    white: "\x1b[97m"
}

const colorsByFormat = {
    black: "§0",
    dark_blue: "§1",
    dark_green: "§2",
    dark_aqua: "§3",
    dark_red: "§4",
    dark_purple: "§5",
    gold: "§6",
    gray: "§7",
    dark_gray: "§8",
    blue: "§9",
    green: "§a",
    aqua: "§b",
    red: "§c",
    light_purple: "§d",
    yellow: "§e",
    white: "§f",
}

const format = {
    obfuscated: "\x1b[5m",
    bold: "\x1b[1m",
    strikethrough: "\x1b[9m",
    underlined: "\x1b[4m",
    italic: "\x1b[3m",
    reset: "\x1b[0m"
}

const formatSymbol = {
    obfuscated: "\u00a7k",
    bold: "\u00a7l",
    strikethrough: "\u00a7m",
    underlined: "\u00a7n",
    italic: "\u00a7o",
    reset: "\u00a7r"
}

var textMessage = "";

var exactContent = "";

function parseContent(extra) {
    if (typeof extra == "string") exactContent += extra;
    else {
        if (colors[extra.color]) exactContent += colors[extra.color];
        else if (extra.color?.startsWith("#")) {
            let hcolor = Buffer.from(extra.color.replace("#", ""), "hex");
            let r = hcolor.readUInt8();
            let g = hcolor.readUInt8(1);
            let b = hcolor.readUInt8(2);
            exactContent += `\x1b[38;2;${r};${g};${b}m`;
        }
        if (extra.obfuscated) exactContent += format.obfuscated;
        if (extra.bold) exactContent += format.bold;
        if (extra.strikethrough) exactContent += format.strikethrough;
        if (extra.underlined) exactContent += format.underlined;
        if (extra.italic) exactContent += format.italic;
        if (extra.text) exactContent += extra.text;
        if (extra.translate) {
            let content = translateContent[extra.translate];
            for (let i in extra.with) {
                content.replace("%s", );
                content.replace(`%${parseInt(i)+1}$s`, );
            }
        }
        if (extra.extra) {
            for (let i of extra.extra) {
                parseExtra(i);
            }
        }
    }
    for (let i in colors) textMessage = textMessage.replaceAll(colorsByFormat[i], colors[i]);
    for (let i in format) textMessage = textMessage.replaceAll(formatSymbol[i], format[i]);
    exactContent += "\x1b[0m";
}

function parseExtra(extra) {
    if (typeof extra == "string") textMessage += extra;
    else {
        if (colors[extra.color]) textMessage += colors[extra.color];
        else if (extra.color?.startsWith("#")) {
            let hcolor = Buffer.from(extra.color.replace("#", ""), "hex");
            let r = hcolor.readUInt8();
            let g = hcolor.readUInt8(1);
            let b = hcolor.readUInt8(2);
            textMessage += `\x1b[38;2;${r};${g};${b}m`;
        }
        if (extra.obfuscated) textMessage += format.obfuscated;
        if (extra.bold) textMessage += format.bold;
        if (extra.strikethrough) textMessage += format.strikethrough;
        if (extra.underlined) textMessage += format.underlined;
        if (extra.italic) textMessage += format.italic;
        if (extra.text) textMessage += extra.text;
        if (extra.extra) {
            for (let i of extra.extra) {
                parseExtra(i);
            }
        }
    }
    for (let i in colors) textMessage = textMessage.replaceAll(colorsByFormat[i], colors[i]);
    for (let i in format) textMessage = textMessage.replaceAll(formatSymbol[i], format[i]);
    textMessage += "\x1b[0m";
}

function parseWithoutFormatting(extra) {
    if (typeof extra == "string") textMessage += extra;
    else {
        if (extra.text) textMessage += extra.text;
        if (extra.translate) {
            let content = translateContent[extra.translate];
            for (let i in extra.with) {
                parseContent(extra.with[i]);
                content = content.replace("%s", exactContent);
                content = content.replace(`%${parseInt(i)+1}$s`, exactContent);
            }
            textMessage = content;
        }
        if (extra.extra) {
            for (let i of extra.extra) {
                parseWithoutFormatting(i);
            }
        }
    }
}

module.exports = function(data, formatting = true) {
    textMessage = "";
    if (formatting) parseExtra(data);
    else parseWithoutFormatting(data);
    return textMessage;
}