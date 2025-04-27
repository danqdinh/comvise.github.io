// Shorthands
var log = console.log;
var str = JSON.stringify;
var obj = JSON.parse;

function _____UTILS_____(){}

// Select 1
function d$(Sel){
    return document.querySelector(Sel);
}

// Select many
function d$$(Sel){
    return [...document.querySelectorAll(Sel)];
}

// Join tokens to lines
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

// Format CSS without @media
function format_nomedia(Css) {
    Css         = Css.replaceAll("}","");
    var Toks    = Css.split("{");
    var Open    = Toks[0].trim();
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

// Format css with @media
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
        Promcss   += "\x20\x20\x20\x20"+ Selector+ "\x20{\n";
        Promcss   += Lines.map(X=>Prefix+X).join("\n");
        Promcss   += "\n\x20\x20\x20\x20}\n";
    }

    Promcss += "\n}\n";
    return Promcss;
}

// Callable by parent window
function _____CALLABLES_____(){}

// Get css excluding global css (doesn't belong to component)
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

// Blink element
function blink(Selector){ 
    var Eles = d$$(Selector); 
    for (let Ele of Eles) Ele.classList.add("blink");

    setTimeout(()=>{
        for (let Ele of Eles) Ele.classList.remove("blink");
    },1500);
}

// Get event to put contenteditable
function set_wysiwyg(){
    var Eles = d$$("body *");
    for (let Ele of Eles) Ele.setAttribute("contenteditable","true");
}

// Move element
function move_ele(Data){
    var Orig    = Data.Orig_Sel;
    var Dest    = Data.Dest_Sel;
    var Origele = d$("body "+Orig);
    var Destele = d$("body "+Dest);
    if (Orig==Dest)                     return "err";
    if (Origele==null || Destele==null) return "err";

    // Dest can't be inside orig, dragging inside descendants
    var Ele = Destele;

    while (Ele.parentElement!=null){
        if (Ele==Origele) {
            alert("Can't move inside");
            return "err";
        }
        Ele = Ele.parentElement;
    }

    // Move
    Destele.appendChild(Origele);
}

function _____INTERFRAME_____(){}

// Respond to parent window
function respond(Data,Result){
    window.parent.postMessage(str({
        Msg_Id:Data.Msg_Id, Result
    }));
}

// Listen to command from parent window
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
        respond(Msg,"");
    }
    else
    if (Cmd=="blink-classes"){
        blink(Msg.Data.Classes2blink);
        respond(Msg,"");
    }
    else
    if (Cmd=="blink-sel"){
        let Sel = "body "+Msg.Data.Selector;
        blink(Sel);
        respond(Msg,"");
    }
    else
    if (Cmd=="add-child"){
        let Sel = "body "+Msg.Data.Selector;
        let Tag = Msg.Data.Tag;
        let Ele = document.createElement(Tag);
        d$(Sel).appendChild(Ele);
        respond(Msg,"");
    }
    else
    if (Cmd=="get-innerh"){
        let Sel = "body "+Msg.Data.Selector;
        respond(Msg,d$(Sel).innerHTML);
    }
    else
    if (Cmd=="set-innerh"){
        let Sel = "body "+Msg.Data.Selector;
        d$(Sel).innerHTML = Msg.Data.Html;
        respond(Msg,"");
    }
    else
    if (Cmd=="edit-ele"){
        let Sel = "body "+Msg.Data.Selector;
        d$(Sel).innerHTML = Msg.Data.Html;
        respond(Msg,"");
    }
    else
    if (Cmd=="get-attr"){
        let Sel = "body "+Msg.Data.Selector;
        let V = d$(Sel).getAttribute(Msg.Data.Attr);
        respond(Msg,V);
    }
    else
    if (Cmd=="del-attr"){
        let Sel = "body "+Msg.Data.Selector;
        d$(Sel).removeAttribute(Msg.Data.Attr);
        respond(Msg,"");
    }
    else
    if (Cmd=="del-ele"){
        let Sel = "body "+Msg.Data.Selector;
        d$(Sel).remove();
        respond(Msg,"");
    }
    else
    if (Cmd=="set-attr"){
        let Sel = "body "+Msg.Data.Selector;
        d$(Sel).setAttribute(Msg.Data.Attr,Msg.Data.Val);
        respond(Msg,"");
    }
    else
    if (Cmd=="set-wysiwyg"){
        set_wysiwyg();
        respond(Msg,"");
    }
    else
    if (Cmd=="move-ele"){
        respond(Msg,move_ele(Msg.Data));
    }
});

function _____MAIN_____(){}

// Main
async function main(){
    log("Iframe loaded");
}
window.onload = main;
// EOF