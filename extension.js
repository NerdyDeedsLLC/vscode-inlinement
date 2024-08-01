// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    console.log('context :', context);
    // send a message to the output channel
    // vscode.window.showInformationMessage('Hello World from Inlinement!');
    //@@ CONFIGURATION 
    //@ Read extension settings, set defaults if necessary, and define some constants.
    let config, tabSize,       indentWithSpaces,  tabEquivalentInSpaces, indentationRE, 
        matchAllButCommentsRE, matchALLInlinesRE, matchONLYTrailingsRE,  applicableRE,
        
        paddingSpaces          = new Array(128).fill('  ').join('  ');                                                                  // Yield a string of 512 spaces. This is used to pad the inline comments into alignment.
    const refreshConfig = () => {
        let userConfig             = vscode.workspace.getConfiguration('inlinement');
        config              = {
              alignTo         : userConfig.get('alignTo')                                                            // ascertainIndentCol() will return a column number based on this value.
            , alignWholeFile  : userConfig.get('alignWholeFile')                                                               // If true, the entire file will be aligned. Otherwise, only the selected text will be aligned.
            , minimumColumn   : userConfig.get('minimumColumn')                                                                 // ascertainIndentCol() will compare the length of the longest line to this value.
            , includeSingles  : userConfig.get('includeSingles')                                                               // If true, matchALLInlinesRE will be used. Otherwise, matchONLYTrailingsRE will be used.
            , nearestTabStop  : userConfig.get('nearestTabStop')                                                                // roundToTabStop() will round to the nearest tab stop if this is true.
            , offset          : userConfig.get('offset')                                                                   // ascertainIndentCol() will add this value to the length of the longest line.
            , collisionProtection : userConfig.get('collisionProtection')                                                                // protectOverlaps() will return true if this is true and the last instance of "                                                                                                                                               //" is greater than the cut-off point.
            , trimSpaces      : userConfig.get('trimSpaces')                                                              // trim() will trim whitespace from the left, right, or both sides of the line.
            , _automatic      : userConfig.get('_automatic')
        };
        console.log('config :', config);
        tabSize               = +vscode.workspace.getConfiguration('editor').get('tabSize'),                                             // Determine the tab size.
        indentWithSpaces      = !!vscode.workspace.getConfiguration('editor').get('insertSpaces'),                                       // Deterimine if the IDE is set to indent with spaces or tabs.
        tabEquivalentInSpaces = paddingSpaces.slice(0, tabSize),                                                                         // If we're indenting with spaces, then we'll need to know how many spaces are in a tab.
        indentationRE         = new RegExp('^(\t|' + tabEquivalentInSpaces + ')+', 'gm'),                                                // Regex to match the indentation at the beginning of the line.
        matchAllButCommentsRE = /^(.+?)\s+(?<!:)\/\/.+$/gim,                                                                             // Regex to match all but the trailing comment.
        matchALLInlinesRE     = /^(.*)(?<!:)\s+\/\/(.+)$/gim,                                                                            // Regex to match a single-line comment, 
        matchONLYTrailingsRE  = /^(.*?[\S].*?)(?<!:)\s+\/\/(.+)$/gim,                                                                    // Regex to match a single inline comment trailing a line of code.
        applicableRE          = (config.includeSingles) ? matchALLInlinesRE : matchONLYTrailingsRE;                                      // If we're including single-line comments, then we'll match all comments. Otherwise, we'll only match trailing comments.
    }

    let align = vscode.commands.registerCommand('inlinement.align', function () {                                                       // Executed every time the user activates the command
        //## RANGE AND SELECTION SCOPE 
        //# Ascertain the range of the selection (or the whole file if alignWholeFile is true).
        let activeTextEditor      = vscode.window.activeTextEditor                                                                           // Active instance (window) of VSCode
            , editorDoc            = activeTextEditor.document                                                                                // Active editorDoc (tab) within VSCode
            , selection           = activeTextEditor.selection                                                                               // Selected block of code (range) within the active editorDoc
            , startLine           = selection.start.line                                                                                     // Topmost line in selection's line number
            , endLine             = selection.end.line                                                                                       // Bottommost line in selection's line number
            , endLineLength       = editorDoc.lineAt(endLine).text.length                                                                     // Length of bottommost line in the selection
            , replaceRange        = new vscode.Range(startLine, 0, endLine, endLineLength)                                                   // VSCode Range (see their API) defining region within selection
            , textToReplace       = editorDoc.getText(replaceRange);                                                                          // Code contained within replaceRange
        refreshConfig();

        if(config.alignWholeFile) {                                                                                                          // Redefine our range to encompass the whole file, if alignWholeFile is true.
            startLine             = 0;                                                                                                       // The topmost line in the file (0)
            endLine               = editorDoc.lineCount - 1;                                                                                  // The bottommost line in the file.
            endLineLength         = editorDoc.lineAt(endLine).text.length;                                                                    // The length of the bottommost line
            replaceRange          = new vscode.Range(0, 0, endLine, endLineLength);                                                  // Redefine the replaceRange to encompass the whole file.
            textToReplace         = editorDoc.getText(replaceRange);                                                                          // Redefine the textToReplace to encompass the whole file.
        }
        
        //$$ HELPER FUNCTIONS 
        //$ These are used in the main function below, typically to perform a single task related to a configuration setting.
        const offsetMod = config.offset > 0 ? config.offset : 0;                                                                             // The number of spaces to offset the comments from the end of the line.
        const lnLen = (v) => (/\/\//g.test(v)) ? v.replace(matchAllButCommentsRE,'$1').length : 0;                                                                   // HelperFN: returns length of string v sans trailing whitespace or comments.
        const longestLine = (v) => Math.max(...v.split('\n').map(lnLen));                                                                    // HelperFN: returns longest line's length in the multi-line string, v.
        const roundToTabStop = (num) => (!config.nearestTabStop) ? +num : Math.ceil(+num / tabSize * tabSize);                               // HelperFN: either rounds num to the nearest tab stop or returns it as-is.
        const ltrim = (v) => v.replace(/^[\s]*(\/\/)?[\s]+/gi, '')                                                                 // HelperFN: trims whitespace on the left side of value v
        const rtrim = (v) => v.replace(/^(.*?)[\s]+$/gi, '$1')                                                                         // HelperFN: trims whitespace on the right side of value v
        
        // HelperFN: trims whitespace from the left, right, or both sides of the line.
        const trim = (v) => {
            switch (config.trimSpaces) {
                case 'trailing': return rtrim(v);                                                                                            // If 'trailing', trim the right side.
                case 'leading' : return rtrim(v);                                                                                            // If 'leading',  trim the left side.
                case 'both'    : return ltrim(rtrim(v));                                                                                     // If 'both',     trim both sides.
                default        : return v;                                                                                                   // Otherwise,     just return the line as-is.
            } 
        }
        
        // HelperFN: returns the column number to which the comments should be aligned.
        const ascertainIndentCol = (v) => {
            console.log('config :', config);
            switch (config.alignTo) { 
                case 'hybrid' : return roundToTabStop(Math.max(+config.minimumColumn, +longestLine(v)));                                     // If 'hybrid',  align to minimumColumn or longest line, whichever is greater.
                case 'fixed'  : return roundToTabStop(+config.minimumColumn);                                                                // If 'fixed',   align to the minimumColumn.
                case 'longest': return roundToTabStop(+longestLine(v));                                                                      // If 'longest', align to the longest line.
            }
        }

        //%% CORE FUNCTIONALITY 
        //% This is the main function that does the work of aligning the comments.
        // vscode.window.showInformationMessage('targetCol:' + targetCol);
        const inlinement = (strInput) => {
        refreshConfig();

            strInput = strInput.replace(/\t/gm, tabEquivalentInSpaces);                                                                      // Convert all tabs to spaces, for consistency.
            let targetCol = ascertainIndentCol(strInput);                                                                                    // Obtain the column number to which the comments should be aligned.
            let contentInRange = strInput.split('\n').map((v) => {                                                                           // Iterate each line in the array...
                let lineComponents = [...v.matchAll(applicableRE)][0] || [null, v, null];                                                    // ... and either match the applicable regex or provide a dummy set...
                let [code, comment] = lineComponents.slice(1,3);                                                                             // ... that can be split into code (and comment, where applicable) elements.
                    comment = comment != null ? paddingSpaces.slice(-offsetMod) + '//' + trim(comment) : null;                               // If a comment exists, rebuild it with spaces, operator, and its text.
                if(comment == null) return v;                                                                                                // If there's no comment, just return the original line.
                let safeguardedCol = (config.collisionProtection) ? Math.max(targetCol, code.length) : targetCol;                                // Decide where to truncate the line based on whether we're preventing overlaps.
                return (rtrim(code) + paddingSpaces).slice(0, safeguardedCol) + comment;                                                     // Return the padded code, truncated to targetCol, plus the comment.
            });
            contentInRange = contentInRange.join('\n');                                                                                      // Join the array back into a string.
            return (!indentWithSpaces) ? contentInRange.replace(indentationRE, '\t') : contentInRange;                                       // If we're indenting with tabs, then we'll need to convert indentation to tabs.
            
        }

        //^^ EXECUTION 
        //^ This is where the magic happens. We'll replace the selected text with the now-comment-inlined version.
        activeTextEditor.edit((TextEditorEdit) => {                                                                                          // Knock the editor back into "edit" mode
            TextEditorEdit.replace(replaceRange, inlinement(textToReplace));                                                                 // Replace the selected text with the now-comment-inined version
        });
    });

    //&& AUTO-ALIGNMENT: ON SAVE
    //& Add a means to _automatically align the comments whenever the user saves the file.
    let performDocumentWideAlignment = () => {                                                                                                           // Define a function that will be executed whenever the user saves the file.
        refreshConfig();
        let currentWholeFileSetting = config.alignWholeFile;                                                                                // Read the current setting for alignWholeFile.
        config.alignWholeFile = true;
        vscode.commands.executeCommand('inlinement.align');                                                                             // ... execute the align command.
        config.alignWholeFile = currentWholeFileSetting;                                                                                // Reset the alignWholeFile setting.
    }

    context.globalState.update('alignOnDocSaveListener', null);
    context.globalState.update('alignOnNewlineListener', null);
    let killExistingListeners = () => {
        if(context.globalState.get('alignOnDocSaveListener') != null) {
            context.globalState.get('alignOnDocSaveListener').dispose();
            context.globalState.update('alignOnDocSaveListener', null);
        }
        if(context.globalState.get('alignOnNewlineListener') != null) {
            context.globalState.get('alignOnNewlineListener').dispose();
            context.globalState.update('alignOnNewlineListener', null);
        }
    }

    let debounce = null;

    let autoAlignOnNewline = (e) => {
        if(debounce != null || e == null || e.contentChanges == null || e.contentChanges.length == 0 || e.contentChanges[0].text.indexOf('\n') === -1 || config._automatic == 'never') return;
        debounce = setTimeout(() => { debounce = null; }, 1000);
        performDocumentWideAlignment();
    };

    const establishAutomaticListeners = () => {
        refreshConfig();
        killExistingListeners();
        let alignOnDocSaveListener, alignOnNewlineListener;
        switch(config._automatic) {
            case 'save':
                console.log('config._automatic: SAVE mode engaged.');
                alignOnDocSaveListener = vscode.workspace.onDidSaveTextDocument(performDocumentWideAlignment);                                     // Add a listener to the workspace that will execute performDocumentWideAlignment whenever the user saves the file.
                context.globalState.update('alignOnDocSaveListener', alignOnDocSaveListener);                                                       // Update the alignOnDocSaveListener in global state.
                break;
                case 'newline':
                console.log('config._automatic: NEWLINE mode engaged.');
                alignOnNewlineListener = vscode.workspace.onDidChangeTextDocument(autoAlignOnNewline);
                context.globalState.update('alignOnNewlineListener', alignOnNewlineListener);
                break;
                case 'both':
                console.log('config._automatic: BOTH newline AND save modes engaged.');
                alignOnDocSaveListener = vscode.workspace.onDidSaveTextDocument(performDocumentWideAlignment);                                     // Add a listener to the workspace that will execute performDocumentWideAlignment whenever the user saves the file.
                context.globalState.update('alignOnDocSaveListener', alignOnDocSaveListener);                                                       // Update the alignOnDocSaveListener in global state.
                alignOnNewlineListener = vscode.workspace.onDidChangeTextDocument(autoAlignOnNewline);
                context.globalState.update('alignOnNewlineListener', alignOnNewlineListener);
                break;
        }
    }

    establishAutomaticListeners();
    //&& AUTO-ALIGNMENT: ON NEWLINE
    //& Add a means to _automatically align the comments whenever the user hits the enter key.    


    //&& CLEAR INLINES
    //& Add a means to remove all inline comments from the editorDoc when the user activates the command.
    const clearInlines = vscode.commands.registerCommand('inlinement.clearInlines', function () {                                           // Executed every time the user activates the command
        refreshConfig();
        let activeTextEditor      = vscode.window.activeTextEditor                                                                           // Active instance (window) of VSCode
            , editorDoc            = activeTextEditor.editorDoc                                                                                // Active editorDoc (tab) within VSCode
            , endLine             = editorDoc.lineCount - 1
            , endLineLength       = editorDoc.lineAt(endLine).text.length                                                                     // Length of bottommost line in the selection
            , replaceRange        = new vscode.Range(0, 0, endLine, endLineLength)                                                   // VSCode Range (see their API) defining region within selection
            , textToReplace       = editorDoc.getText(replaceRange);                                                                          // Code contained within replaceRange
        
        textToReplace.split('\n').map((v) => v.replace(matchAllButCommentsRE,'$1'));                                                        // Iterate each line in the array and remove the comments.
        textToReplace = textToReplace.join('\n');                                                                                           // Join the array back into a string.
        activeTextEditor.edit((TextEditorEdit) => {                                                                                          // Knock the editor back into "edit" mode
            TextEditorEdit.replace(replaceRange, textToReplace);                                                                             // Replace the selected text with the now-comment-inined version
        });
    });

    // Finally, add the commands to the context so that they can be disposed of later.

    context.subscriptions.push(align);                                                                                     // Add the inlinementAlignCommand to the context so that it can be disposed of later
    context.subscriptions.push(clearInlines);                                                                                                  // Add the inlinementAlignCommand to the context so that it can be disposed of later


}

// This method is called when your extension is deactivated
function deactivate() {}                                                                                                                     // Nothing to do here. Yet.

module.exports = {                                                                                                                           // Export the activate and deactivate functions so that VSCode can call them.
    activate, 
    deactivate
}
