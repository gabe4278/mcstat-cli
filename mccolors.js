module.exports = function (text, includeAndChar, parseBedrock) {
    var pre = "\u00A7";

    if (includeAndChar) pre = "&";

    text = text.replaceAll(`${pre}0`, "\x1B[30m");
    text = text.replaceAll(`${pre}1`, "\x1B[34m");
    text = text.replaceAll(`${pre}2`, "\x1B[32m");
    text = text.replaceAll(`${pre}3`, "\x1B[36m");
    text = text.replaceAll(`${pre}4`, "\x1B[31m");
    text = text.replaceAll(`${pre}5`, "\x1B[35m");
    text = text.replaceAll(`${pre}6`, "\x1B[33m");
    text = text.replaceAll(`${pre}7`, "\x1B[37m");
    text = text.replaceAll(`${pre}8`, "\x1B[90m");
    text = text.replaceAll(`${pre}9`, "\x1B[94m");
    text = text.replaceAll(`${pre}a`, "\x1B[92m");
    text = text.replaceAll(`${pre}b`, "\x1B[96m");
    text = text.replaceAll(`${pre}c`, "\x1B[91m");
    text = text.replaceAll(`${pre}d`, "\x1B[95m");
    text = text.replaceAll(`${pre}e`, "\x1B[93m");
    text = text.replaceAll(`${pre}f`, "\x1B[97m");
    text = text.replaceAll(`${pre}k`, "\x1B[6m");
    text = text.replaceAll(`${pre}l`, "\x1B[1m");
    text = text.replaceAll(`${pre}m`, "\x1B[9m");
    if (!parseBedrock) text = text.replaceAll(`${pre}n`, "\x1B[4m");
    text = text.replaceAll(`${pre}o`, "\x1B[3m");
    text = text.replaceAll(`${pre}r`, "\x1B[0m");
    if (parseBedrock) {
        text = text.replaceAll(`${pre}g`, "\x1B[38;2;221;214;5m");
        text = text.replaceAll(`${pre}h`, "\x1B[38;2;227;212;209m");
        text = text.replaceAll(`${pre}i`, "\x1B[38;2;206;202;202m");
        text = text.replaceAll(`${pre}j`, "\x1B[38;2;68;58;59m");
        text = text.replaceAll(`${pre}m`, "\x1B[38;2;151;22;7m");
        text = text.replaceAll(`${pre}n`, "\x1B[38;2;180;104;77m");
        text = text.replaceAll(`${pre}p`, "\x1B[38;2;222;177;45m");
        text = text.replaceAll(`${pre}q`, "\x1B[38;2;17;159;54m");
        text = text.replaceAll(`${pre}s`, "\x1B[38;2;44;186;168m");
        text = text.replaceAll(`${pre}t`, "\x1B[38;2;33;73;123m");
        text = text.replaceAll(`${pre}u`, "\x1B[38;2;154;92;198m");
        text = text.replaceAll(`${pre}v`, "\x1B[38;2;235;114;20m");
    }

    return text + "\x1B[0m";
}
