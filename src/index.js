/*
IMPORTANT:
  - After render, the main values for HTML, CSS
    are all from iframe DOM.
*/
// Shorthands
var log = console.log;
var str = JSON.stringify;
var obj = JSON.parse;

function OX_INDENT_check(){}
function _____PROTOTYPE_____(){}

// Prototypes
Element.prototype.on = function(Name,func){
    this.addEventListener(Name,func);
};
Element.prototype.attr = function(Name,Val){
    if (Val==null) return this.getAttribute(Name);
    this.setAttribute(Name,Val);
};

function _____GLOBALS_____(){}

// Globals
var Global_Css = 
`* { box-sizing:border-box; }`;

var Html_File  = null;
var Css_File   = null;
var Html       = "";
var Css        = "";
var Css_Comment= "";
var rendered   = false;

const MARKER1 = "[Generated by Novaeh Comvise]";
const MARKER2 = "[Only first comment is kept]";

function _____UTILS_____(){}

// Async lock
function new_lock(){
    var unlock,Lock=new Promise((res,rej)=>{ unlock=res; });
    return [Lock,unlock];
}

// Create element
function new_ele(Tag) {
    return document.createElement(Tag);
}

// Get attribute
function attr(Ele,Name){
    return Ele.getAttribute(Name);
}

// Select
function d$(Sel){
    return document.querySelector(Sel);
}

// Select
function e$(Ele,Sel){
    return Ele.querySelector(Sel);
}

// Select
function e$$(Ele,Sel){
    return [...Ele.querySelectorAll(Sel)];
}

function _____MISCS_____(){}

// Show html saving warning
function show_html_saving_warn(){
    alert("After rendering with 'Apply Edit' button, browser puts texts in structured tag "+
        "outside of the tag. Eg., some frameworks put 'for' loop outside of TR to loop TR tag, "+
        "but browser moves that 'for' loop outside of TABLE tag.");
}

function _____EDITORS_____(){}

// Set HTML
function set_editing_html(V){
    // Some how CodeMirror doesn't display gutter correctly with 
    // lines fewer than 10, add 10
    Html_Editor.setValue(V + "\n".repeat(10));
}

// Set CSS
function set_editing_css(V){
    // Some how CodeMirror doesn't display gutter correctly with 
    // lines fewer than 10, add 10
    Css_Editor.setValue(V + "\n".repeat(10));
}

// Get HTML
function get_editing_html(){
    // Need to trim the extra 10 lines added
    return Html_Editor.getValue().trim();
}

// Get CSS
function get_editing_css(){
    // Need to trim the extra 10 lines added
    return Css_Editor.getValue().trim();
}

// Set html editing content from iframe DOM
function set_editing_html_from_dom(){
    set_editing_html(get_component_dom_html());
}

// Set CSS with comment
function set_editing_css_with_cmt(Css){
    if (Css_Comment.trim().length>0)
        var Cmt = `${Css_Comment.trim()}\n`;
    else
        var Cmt = "";

    set_editing_css( 
        `/*\n${MARKER1}\n${MARKER2}\n`+
        `${Cmt}*/\n`+
        `${Css}`
    );
}

// Get html from dom
// WARN: CAN BE CALLED ONLY AFTER IFRAME RENDERED
function get_component_dom_html(){
    var Frame = d$("#Visual-Frame");
    var Html  = Frame.contentWindow.document.body.innerHTML;

    // Remove contenteditable
    var Ele = new_ele("div");
    Ele.innerHTML = Html;

    for (let E of e$$(Ele,"*"))
        E.removeAttribute("contenteditable");

    Html = Ele.innerHTML;

    // Format
    Html = html_beautify(Html,{
        indent_size:4, indent_char:"\x20", indent_with_tabs:false,
        eol:"\n", end_with_newline:false, indent_level:0, preserve_newlines:true,
        max_preserve_newlines:10, wrap_line_length:120
    });

    // Be aware that missing some structural tags, eg. tbody,
    // will make browser return innerHTML with some closing tag on the same line.
    return Html.replaceAll("<!-- EOF -->","").trim()+"\n<!-- EOF -->";
}

// Get live CSS from iframe DOM
async function get_component_dom_css(){
    var Livecss = await send_cmd_to_iframe("get-css");
    return Livecss;
}

function _____IFRAME_____(){}

// Write to iframe
// Ref: https://stackoverflow.com/a/998241/5581893
function write_iframe(Html){
    var ifrm = document.getElementById('Visual-Frame');
    ifrm = ifrm.contentWindow || ifrm.contentDocument.document || ifrm.contentDocument;
    ifrm.document.open();
    ifrm.document.write(Html);
    ifrm.document.close();
}

// Message from iframe
var Msg_Handlers = {};

function on_message(Ev){
    try{
        var Obj = obj(Ev.data);    
        Msg_Handlers[Obj.Msg_Id](Obj.Result);
    }
    catch{
        log("Unknown message:",Ev.data);
    }
}
window.addEventListener("message",on_message);

// Send command
async function send_cmd_to_iframe(Cmd,Data={}){
    var Frame = d$("#Visual-Frame");

    if (Frame==null){
        alert("Click 'Visual' button first to render");
        return;
    }

    var Msg_Id = Math.random().toString().replace(".","");
    Frame.contentWindow.postMessage(str({Msg_Id,Cmd,Data}));

    var [Lock,unlock] = new_lock();
    Msg_Handlers[Msg_Id] = function(Result){
        unlock(Result);
    };
    return await Lock;
}

function _____DOM_____(){}

// Turn DOM to list to show on left panel
function recurse_for_items(List,Ele,depth,nth_child,Selector){
    var Item = {
        Tag:Ele.tagName, Id:attr(Ele,"id"), Classes:attr(Ele,"class"),
        depth, nth_child, Selector
    };
    if (Item.Id==null)      Item.Id="null";
    if (Item.Classes==null) Item.Classes="null";
    List.push(Item);

    for (let i=0; i<Ele.children.length; i++){
        let Child = Ele.children[i];
        recurse_for_items(
            List, Child, depth+1,
            i+1, Selector+`\x20>*:nth-child(${i+1})`
        );
    }
}

// Get UI row (from inside)
function row_ele(Ev){
    if (Ev.target.attr("item-row")=="yes") return Ev.target;
    var Ele = Ev.target;

    while (Ele!=null){
        if (Ele.attr("item-row")=="yes") return Ele;
        Ele = Ele.parentElement;
    }
    return null;
}

// Get DOM item to UI
function add_struct_item(Box,Item){
    var Pad = "";

    for (let _ of Array(Item.depth)) 
        Pad+=`<span style="display:inline-flex; width:1.5rem;
        justify-content:center; align-items:center;">·</span>`;

    // Add dots
    Item.Classes = Item.Classes.replace(/[\s]{2,}/g, "\x20\x20").replaceAll("\x20",".");

    // Hilight
    if (Item.Id!="null") 
        var Item_Id=`<span style="color:green;"><b>${Item.Id}</b></span>`;
    else                 
        var Item_Id=Item.Id;

    if (Item.Classes!="null") 
        var Item_Classes=`<span style="color:cyan;"><b>${Item.Classes}</b></span>`;
    else                 
        var Item_Classes=Item.Classes;

    if (Item.Id=="Comvise-Root")
        var Html = 
        `${Pad}<span>🔷</span>
        <a class="item-name" href="javascript:" title="Drag to reorder" 
        style="user-select:none;">${Item.Tag} #${Item_Id} .${Item_Classes}</a>
        <span class="add-child-ele" style="display:none; cursor:pointer;">x</span>
        <span class="edit-attr" style="display:none; cursor:pointer;">x</span>
        <span class="del-ele" style="display:none; cursor:pointer;">x</span>`;
    else
        var Html = 
        `${Pad}<span class="edit-innerh" title="Click to edit innerHTML">🧩</span>
        <a class="item-name" href="javascript:" title="Drag to reorder" 
        style="user-select:none;">${Item.Tag} #${Item_Id} .${Item_Classes}</a>        
        <span class="del-ele" style="cursor:pointer; float:right;">❌</span>
        <span class="edit-attr" style="cursor:pointer; float:right;">📝</span>
        <span class="add-child-ele" style="cursor:pointer; float:right;">➕</span>`;

    var Ele = new_ele("div");    
    Ele.attr("item-row","yes");
    Ele.attr("selector",Item.Selector);
    Ele.innerHTML = Html;
    Box.appendChild(Ele);

    // For blink
    var Atag = e$(Ele,"a");
    Atag.setAttribute("ui-id",`#${Item.Id}`);
    Atag.setAttribute("ui-classes",`.${Item.Classes}`);

    // Events
    // Blink
    e$(Ele,".item-name").on("click",Ev=>{
        var Selector = row_ele(Ev).attr("selector");
        send_cmd_to_iframe("blink-sel",{Selector});
    });

    // Set inner html
    e$(Ele,".edit-innerh")?.on("click",async(Ev)=>{
        var Selector = row_ele(Ev).attr("selector");
        var Html = await send_cmd_to_iframe("get-innerh",{Selector});

        var V = prompt("Quick edit innerHTML, type -- to remove:",Html);
        if (V==null || V.trim().length==0) return;        
        
        if (V.trim()=="--")
            await send_cmd_to_iframe("set-innerh",{Selector,Html:""});
        else
            await send_cmd_to_iframe("set-innerh",{Selector,Html:V.trim()});

        show_dom_struct();
        set_editing_html_from_dom();
    });

    // Add child
    e$(Ele,".add-child-ele").on("click",async(Ev)=>{
        var Tag = prompt("Enter HTML tag name:","span");
        if (Tag==null || Tag.trim().length==0) return;

        var Selector = row_ele(Ev).attr("selector");
        await send_cmd_to_iframe("add-child",{Selector,Tag});

        show_dom_struct();
        set_editing_html_from_dom();
    });

    // Edit attribute
    e$(Ele,".edit-attr").on("click",async(Ev)=>{
        var Attr = prompt("Enter attribute to edit:");
        if (Attr==null || Attr.trim().length==0) return;

        var Selector = row_ele(Ev).attr("selector");
        var Curattr = await send_cmd_to_iframe("get-attr",{Selector,Attr});
        if (Curattr==null) Curattr="";
        Curattr = Curattr.trim();

        var Val = prompt("Enter attribute value, type '--' to del attribute:",Curattr);
        if (Val==null || Val.trim().length==0) return;

        if (Val.trim()=="--")
            await send_cmd_to_iframe("del-attr",{Selector,Attr});
        else
            await send_cmd_to_iframe("set-attr",{Selector,Attr,Val});

        show_dom_struct();
        set_editing_html_from_dom();
    });

    // Del ele
    e$(Ele,".del-ele").on("click",async(Ev)=>{
        var conf = confirm("Sure to delete that tag?");
        if (!conf) return;

        var Selector = row_ele(Ev).attr("selector");
        await send_cmd_to_iframe("del-ele",{Selector});

        show_dom_struct();
        set_editing_html_from_dom();
    });

    // Drag
    Ele.on("dragstart",Ev=>{
        var Selector = row_ele(Ev).attr("selector");
        Ev.dataTransfer.setData("text/plain",str({ 
            Selector
        }));
    });

    // Dragover (allow dropping here)
    Ele.on("dragover",Ev=>{ Ev.preventDefault(); });
    Ele.on("dragenter",Ev=>{ Ev.target.style.backgroundColor="ivory"; });
    Ele.on("dragleave",Ev=>{ Ev.target.style.backgroundColor="transparent"; });

    // Dropzone
    Ele.on("drop",async(Ev)=>{
        // Clear bg
        Ev.target.style.backgroundColor = "transparent";

        // Get data
        try{
            var Obj = obj(Ev.dataTransfer.getData("text"));
        }
        catch{
            alert("Invalid item");
            return;
        }        
        if (Obj.Selector==null){
            alert("Won't take that item");
            return;
        }

        var Orig_Sel = Obj.Selector;
        var Dest_Sel = row_ele(Ev).attr("selector");

        // Ignore #Comvise-Root
        if (Orig_Sel.trim().length==0 || Dest_Sel.trim().length==0) return;

        // Send to iframe
        var Result = await send_cmd_to_iframe("move-ele",{Orig_Sel,Dest_Sel});
        if (Result=="err") return;

        show_dom_struct();
        set_editing_html_from_dom();
    });
}

function _____UI_AREAS_____(){}

// Check if iframe ready
function iframe_ready() {
    var Frame = d$("#Visual-Frame");
    return Frame?.contentWindow?.document?.body!=null;
}

// Show DOM of component being edited
function show_dom_struct() {
    var Frame     = d$("#Visual-Frame");
    var Html      = get_component_dom_html();
    var Ele       = new_ele("div");    
    Ele.innerHTML = Html;
    Ele.attr("id","Comvise-Root");

    var Items = [];
    recurse_for_items(Items,Ele,0,1,"");
    var Box = d$("#Struct-Box");
    Box.innerHTML = "<div>Click to blink in UI</div>";
    
    for (let Item of Items)
        add_struct_item(Box,Item);
}

// Show visual
// NOTICE: ONLY THIS FUNC IS Editors->DOM
// This takes from editors (HTML,css), an other DOM edit funcs 
// should put to editors.
async function show_visual(){
    // if (Html_File==null || Css_File==null){
    //     alert("Must load both HTML and CSS files");
    //     return;
    // }
    d$("#Caption").innerHTML = 
        `<big><b>WYSIWYG</b></big> (Edit CSS with DevTools, contenteditable attr is stripped)`;
    d$("#Visual-Box").style.display = "block";
    d$("#Html-Box").style.display = "none";
    d$("#Css-Box").style.display = "none";

    // Show contents
    var C = get_editing_css();
    var H = get_editing_html();
    var Html = 
    `<iframe id="Visual-Frame" frameBorder="0"
        style="width:calc(66.66vw - 3rem); height:calc(100vh - 12rem);
        outline:none; overflow:auto; overflow-x:hidden;">
    </iframe>`;
    d$("#Visual-Box").innerHTML = Html;

    // Blink: https://stackoverflow.com/a/72819596/5581893
    var Comhtml = 
    `<script src="iframe.js"></script>
    <style title="global-css">
        .blink {
            animation: blinkIt 0.5s infinite; background-color:yellow;
        }
        @keyframes blinkIt {
            from { opacity: 0; }  
            to { opacity: 1; }
        }
    </style>
    <style title="global-css">${Global_Css}</style>
    <style>${C}</style>
    <body style="margin:0 !important; padding:0 !important;">${H}</body>`;
    write_iframe(Comhtml);

    var [Lock,unlock] = new_lock();
    setTimeout(function check(){
        if (!iframe_ready()){
            setTimeout(check,100);
            return;
        }
        log("Iframe is written and ready");
        show_dom_struct();
        send_cmd_to_iframe("set-wysiwyg",{});
        rendered = true;
        unlock();
    },100);
    await Lock;
}

// Apply dom to editors
async function apply_dom(){
    show_html();
    await show_css();
    show_visual();
}

// Show html (takes from DOM to show)
function show_html(){
    if (!iframe_ready()) return;

    d$("#Caption").innerHTML = "Edit HTML:";
    d$("#Visual-Box").style.display = "none";
    d$("#Html-Box").style.display = "block";
    d$("#Css-Box").style.display = "none";

    var H = get_component_dom_html();
    if (H!=null && H.trim().length>0) set_editing_html(H);
}

// Show css (takes from DOM to show)
async function show_css(){
    if (!iframe_ready()) return;    

    d$("#Caption").innerHTML = "Edit CSS:";
    d$("#Visual-Box").style.display = "none";
    d$("#Html-Box").style.display = "none";
    d$("#Css-Box").style.display = "block";

    var Css = await get_component_dom_css();
    if (Css!=null) set_editing_css_with_cmt(Css);
}

// Show status text
function show_status(Str){
    d$("#Status").innerHTML = Str;
}

function _____FILES_____(){}

// Read file
// NOTE: CODE FROM COPILOT
async function read_file() {    
    // Open the file picker
    const [fileHandle] = await window.showOpenFilePicker();
    // Get the file
    const file = await fileHandle.getFile();
    // Read the file content as text
    const content = await file.text();
    return [fileHandle,content];    
}

// Write file
// NOTE: CODE FROM COPILOT
async function write_to_file(Handle,Text) {
    const writable = await Handle.createWritable();
    // Write data to the file
    await writable.write(Text);
    // Close the stream
    await writable.close();
}

function _____LOAD_N_SAVE_____(){}

// Get comment from CSS file
function extract_comment(C){
    if (C.indexOf("*/")>=0 && C.trim().substring(0,2)=="/*"){
        let pos = C.indexOf("*/");
        let Cmt = C.substring(0,pos).replaceAll("/*","").trim();
        Css_Comment = Cmt;        
        Css_Comment = Css_Comment.replaceAll(MARKER1,"");
        Css_Comment = Css_Comment.replaceAll(MARKER2,"");
        log("Comment found in CSS:",Css_Comment);
    }
    else
        Css_Comment="";
}

// Load html
async function load_html(Ev){
    var [F,H] = await read_file();

    if (F.name.match(/\.html$/)==null){
        alert("Must be .html file");
        return;
    }
    Html_File = F;
    Html      = H.replace(/\t/g, "\x20\x20\x20\x20").replace(/\r\n/g, "\n");
    log("HTML loaded:",F);
    show_status("Loaded HTML, length: "+H.length);

    set_editing_html(H); // Set in editor    
    await show_visual(); // Editor -> DOM
    show_html();         // DOM -> Editor
}

// Load css
async function load_css(Ev){
    var [F,C] = await read_file();

    if (F.name.match(/\.css/)==null){
        alert("Must be .css file");
        return;
    }
    // Save the first comment
    extract_comment(C);

    // Show css
    Css_File  = F;
    Css       = C.trim().replace(/\t/g, "\x20\x20\x20\x20").replace(/\r\n/g, "\n");
    log("CSS loaded:",F);
    show_status("Loaded CSS, length: "+C.length);

    set_editing_css(C);  // Set in editor
    await show_visual(); // Editor -> DOM
    show_css();          // DOM -> Editor
}

// Load global css
async function load_global_css(Ev){
    var [F,C] = await read_file();

    if (F.name.match(/\.css/)==null){
        alert("Must be .css file");
        return;
    }
    Global_Css= C.replace(/\t/g, "\x20\x20\x20\x20").replace(/\r\n/g, "\n");
    log("Global CSS loaded:",F);
    show_status("Loaded global CSS, length: "+C.length);
}

// Save html
async function save_html(){
    if (Html_File==null){
        alert("HTML file not loaded yet");
        return;
    }
    if (!rendered){
        alert("Must click 'Visual' at least once, coz CSS is taken from live UI");
        return;
    }    

    // Value
    var Html;    
    Html = get_component_dom_html();

    // Save
    Html_File.requestPermission({mode:"readwrite"});
    await write_to_file(Html_File, Html);
    show_status("HTML written to file");

    // From DOM
    show_html();
}

// Save css
async function save_css(){
    if (Css_File==null){
        alert("CSS file not loaded yet");
        return;
    }
    if (!rendered){
        alert("Must click 'Visual' at least once, coz CSS is taken from live UI");
        return;
    }

    // Value
    var Livecss = await send_cmd_to_iframe("get-css");
    extract_comment( get_editing_css() );
    set_editing_css_with_cmt(Livecss); // Add comment to editor

    // Save
    Css_File.requestPermission({mode:"readwrite"});
    await write_to_file(Css_File, get_editing_css()); // Write with comment too.
    show_status("CSS written to file");

    // From DOM
    show_css();
}

function _____MAIN_____(){}

// Main
var Html_Editor = null;
var Css_Editor  = null;

async function main(){
    Html_Editor = CodeMirror.fromTextArea(d$("#Html-Edit"),{
        lineNumbers:true, mode:"htmlmixed", indentUnit:4, tabSize:4,
        indentWithTabs:false, lineWrapping:true, gutter:true
    });
    Css_Editor = CodeMirror.fromTextArea(d$("#Css-Edit"),{
        lineNumbers:true, mode:"css", indentUnit:4, tabSize:4,
        indentWithTabs:false, lineWrapping:true, gutter:true
    });
    window.Hed = Html_Editor;
    window.Ced = Css_Editor;

    // Indent wrapped lines: 
    // view-source:codemirror.net/5/demo/indentwrap.html
    var charWidth = Html_Editor.defaultCharWidth(), basePadding = 4;
    Html_Editor.on("renderLine", function(cm, line, elt) {
        var off = CodeMirror.countColumn(line.text, null, cm.getOption("tabSize")) * charWidth;
        elt.style.textIndent = "-" + off + "px";
        elt.style.paddingLeft = (basePadding + off) + "px";
    });
    Html_Editor.refresh();

    var charWidth = Css_Editor.defaultCharWidth(), basePadding = 4;
    Css_Editor.on("renderLine", function(cm, line, elt) {
        var off = CodeMirror.countColumn(line.text, null, cm.getOption("tabSize")) * charWidth;
        elt.style.textIndent = "-" + off + "px";
        elt.style.paddingLeft = (basePadding + off) + "px";
    });
    Css_Editor.refresh();

    set_editing_html("HTML here");
    set_editing_css("CSS here");
};
window.onload = main;
// EOF
