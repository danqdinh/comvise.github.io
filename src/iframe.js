// Shorthands
var log = console.log;
var str = JSON.stringify;
var obj = JSON.parse;

// Utils
function d$$(Sel){
    return [...document.querySelectorAll(Sel)];
}

// 
function toks_to_lines(Toks){
    var Lines = [];

    for (let Tok of Toks){
        let n = Lines.length;

        // First item
        if (n==0){
            Lines.push(Tok+";\x20");
            continue;
        }

        // Add to current line
        if (Lines[n-1].length<80){
            Lines[n-1] += Tok+";\x20";
            continue
        }

        // New line
        Lines.push(Tok+";\x20");
    }
    return Lines;
}

// 
function format_nomedia(Css) {
    Css = Css.replaceAll("}","");
    var Toks = Css.split("{");
    var Open = Toks[0].trim();
    var Propstr = Toks[1].trim();

    // Put props into multiple lines
    Toks = Propstr.split(";").filter(X => X.trim().length>0).map(X=>X.trim());
    var Lines = toks_to_lines(Toks);

    // Join lines
    Propstr = Lines.map(X => "\x20\x20\x20\x20"+X).join("\n");

    // Combine back
    Promcss = Open + "\x20{\n" + Propstr + "\n}\n";
    return Promcss;
}

// 
function format_withmedia(Css) {
    // Get @media line
    var Toks   = Css.split("{");
    var Media  = Toks[0].trim();
    var Trunks = Toks.slice(1).join("{").split("}").map(X=>X.trim()).filter(X=>X.length>0);
    var Promcss= Media+"\x20{\n";

    // Process trunks of selectors
    for (let Trunk of Trunks){
        let Selector = Trunk.split("{")[0].trim();
        let Propstr  = Trunk.split("{")[1]; 
        let Toks     = Propstr.split(";").filter(X => X.trim().length>0).map(X=>X.trim());
        let Lines    = toks_to_lines(Toks);

        let Prefix = "\x20\x20\x20\x20\x20\x20\x20\x20";
        Promcss += "\x20\x20\x20\x20"+ Selector+ "\x20{\n";
        Promcss += Lines.map(X=>Prefix+X).join("\n");
        Promcss += "\n\x20\x20\x20\x20}\n";
    }

    Promcss += "\n}\n";
    return Promcss;
}

// 
function get_css() {
    var Full_Css = "";

    for (let sheet of document.styleSheets) 
        for (let rule of sheet.cssRules){
            // Skip global CSS
            if (rule.parentStyleSheet.title=="global-css") continue;
            
            // Format rule without @media
            let Css = rule.cssText;

            if (Css.indexOf("@media")==-1)
                Css = format_nomedia(Css);
            else
                Css = format_withmedia(Css);

            // No space after colon
            Css = Css.replaceAll(":\x20",":");

            Full_Css += Css+"\n";
        }

    // Remove empty lines
    Full_Css = Full_Css.split("\n").filter(X=>X.trim().length>0).join("\n");

    return Full_Css+"\n/* EOF */";
}

// 
function respond(Data,Result){
    window.parent.postMessage(str({
        Msg_Id:Data.Msg_Id, Result
    }));
}

//
function blink(Selector){ 
    var Eles = d$$(Selector); 
    for (let Ele of Eles) Ele.classList.add("blink");

    setTimeout(()=>{
        for (let Ele of Eles) Ele.classList.remove("blink");
    },1500);
}

// 
function blink_classes(Classes){
}

// 
window.addEventListener("message",Ev=>{
    var Msg = obj(Ev.data);
    var Cmd = Msg.Cmd;

    if (Cmd=="get-css"){
        let Css = get_css();
        respond(Msg,Css);
    }
    else
    if (Cmd=="blink-id"){
        blink(Msg.Data.Id2blink);
    }
    else
    if (Cmd=="blink-classes"){
        blink(Msg.Data.Classes2blink);
    }
});

function _____MAIN_____(){}

// Main
async function main(){
    log("Iframe loaded");
}
window.onload = main;
// EOF