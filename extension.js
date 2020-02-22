/*
// EXAMPLE USED IN GIF
// Waxing rheposodic about inlinement...
const little = (a,b) => a + Math.random() * (b - a); // Helper fn: Night at the Opera
try {
    assert(life.real);                      // N - Is this the real life?
    assert(!life.real && life.fantasy);             // E - Is this just fantasy?
}catch(landslide){                      // R - Caught in a landslide,
    while((c = Array.from(/[^\\r\\e\\a\\l\\i\\t\\y]/gi))){    // D - No escape from reality.
        [i1,i2] = c.filter((I,c)=>skies.__lookupGetter__((I.open()) && c)); // Y - Open your eyes, look up to the skies and see
        var self = {...'XY'}.hasOwnProperty(false) && !(require("SYMPATHY")); // D - I'm just a poor boy, I need no sympathy,
        do {                                                                    // E - Because...
            !(easy=true) && self.insertAdjacentHTML('afterEnd', easy).remove(); // E - I'm easy come, easy go
        } while(little(-1,1) < Infinity || little(-1,1) > -Infinity)                      // D - Little high, little low
        blow = windDirection => windDirection || !windDirection;  // S - Any way the wind blows doesn't really matter to me, to me.
    }
}
*/

const vscode = require('vscode');
console.log('vscode :', vscode);
function activate(context) {
    
    console.log ("EXTENSION - Inlinement (Aligns inline comments to the right of your code) - is now listening for trigger keyboard shortcut: ⟦⌘⟧ + ⟦/⟧, ⟦⌘⟧ + ⟦/⟧")
    let inlinement = vscode.commands.registerCommand('inlinement', function () {
        const paddingSpaces  = new Array(128).fill(' ').join(' ');                          // Yields a 256-space string for the padding offset when aligning.
        let activeTextEditor = vscode.window.activeTextEditor;                              // Active window's instance of VSCode
        let activeDocument   = activeTextEditor.document;                                   // Active document (tab) within VSCode
        let selection        = activeTextEditor.selection;                                  // Selected block of code, within the active document, within the active instance. That Jack built.
        let startLine        = selection.start.line;                                        // Line number of the topmost line in the selection
        let endLine          = selection.end.line;                                          // Line number of the bottommost line in the selection
        let endLineLength    = activeDocument.lineAt(endLine).text.length                   // Number of chars in the bottommost line. Prevents user from having to select the whole line.
        let replaceRange     = new vscode.Range(startLine, 0, endLine, endLineLength);      // VSCode Range (see their API) defining region within selection
        let textToReplace    = activeDocument.getText(replaceRange);                        // Code contained within replaceRange
        
        const ltrim = (v) => v.replace(/^[\t\l\v ]/gi, '') || '';                           // HelperFN: trimes whitespace on the left side of the value, v, passed in
        const rtrim = (v) => v.replace(/[\t\l\v ]$/gi, '') || '';                           // HelperFN: trimes whitespace on the right side of the value, v, passed in

        const repositionInlineComments = (strInput, ...params) => {                         // The magic wot makes the pixies dance.
            if(/\t/gim.test(strInput)) strInput = strInput.replace(/\t/gim, '    ');        // Normalize tabs to spaces. TODO: Convert it back to tabs if it started that way. I guess. If someone complains.
            const inlineDelimiter = params.inlineDelimiter || "\\/{2}",                     // The inline-comment charater(s) that we'll be aligning by (regex)
                  minColumnOffset = params.minColumnOffset || 20,                           // Any additional padding to tack on
                  commentRE       = new RegExp('^([\\S\\t\\l\\v ]*?\\S{1})(?:[\\t\\l\\v ]*)' + inlineDelimiter + '([^/\\n\\r]+){1}$', 'gim'), // Construct the regex we'll need to perform the operation.
                  maxColPos       = Math.max(...[...strInput.matchAll(commentRE)].map(v=>v[1].length)); // Find the longest pre-delimeter line
            return strInput.replace(commentRE, (_x_, p1, p2)=>rtrim(p1) + (paddingSpaces).slice(0, (minColumnOffset + maxColPos-rtrim(p1).length)) + ' // '+ ltrim(p2)); // Add sufficient padding spaces to align each line.
        }

        activeTextEditor.edit((TextEditorEdit) => {                                         // Knock the editor back into "edit" mode
            TextEditorEdit.replace(replaceRange, repositionInlineComments(textToReplace));  // Replace the selected text with the now-comment-inined version
        });

    });

    context.subscriptions.push(inlinement);
}
exports.activate = activate;

function deactivate() {}
exports.deactivate = deactivate;

module.exports = {
    activate,
    deactivate
}
