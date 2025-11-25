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

var cont = false;

function parseContent(textComponent) {
    let text = "";
    if (typeof textComponent == "string") text += textComponent;
    else {
        if (colors[textComponent.color]) text += colors[textComponent.color];
        else if (textComponent.color?.startsWith("#")) {
            let hcolor = Buffer.from(textComponent.color.replace("#", ""), "hex");
            let r = hcolor.readUInt8();
            let g = hcolor.readUInt8(1);
            let b = hcolor.readUInt8(2);
            text += `\x1b[38;2;${r};${g};${b}m`;
        }
        if (textComponent.obfuscated) text += format.obfuscated;
        if (textComponent.bold) text += format.bold;
        if (textComponent.strikethrough) text += format.strikethrough;
        if (textComponent.underlined) text += format.underlined;
        if (textComponent.italic) text += format.italic;
        if (textComponent.text) text += textComponent.text;
        if (textComponent.translate) {
            let content = translateContent[textComponent.translate];
            cont = true;
            for (let i in textComponent.with) {
                let w = parseContent(textComponent.with[i]);
                content = content.replace("%s", w);
                content = content.replace(`%${parseInt(i)+1}$s`, w);
            }
            text += content;
            cont = false;
        }
        if (textComponent.extra) {
            cont = true;
            for (let c of textComponent.extra) text += parseContent(c);
            cont = false;
        }
    }
    for (let i in formatSymbol) text = text.replace(formatSymbol[i], format[i]);
    for (let i in colorsByFormat) text = text.replace(colorsByFormat[i], colors[i]);
    return text + (!cont && "\x1b[0m" || "");
}

function parseWithoutFormatting(textComponent) {
    let text = "";
    if (typeof textComponent == "string") text += textComponent;
    else {
        if (textComponent.text) text += textComponent.text;
        if (textComponent.translate) {
            let content = translateContent[textComponent.translate];
            for (let i in textComponent.with) {
                let w = parseWithoutFormatting(textComponent.with[i]);
                content = content.replace("%s", w);
                content = content.replace(`%${parseInt(i)+1}$s`, w);
            }
            text += content;
        }
        if (textComponent.extra) {
            for (let c of textComponent.extra) {
                text += parseWithoutFormatting(c);
            }
        }
    }
    return text;
}

module.exports = function(data, formatting = true) {
    if (formatting) return parseContent(data);
    else return parseWithoutFormatting(data);
}
