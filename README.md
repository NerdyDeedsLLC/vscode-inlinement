![Basic Execution](images/title.gif)

# Justify the comments you used to justify that code.

## Features

Inline comments can provide a great deal of additional insight and information into the code they accompany. Unfortunately, they can also add clutter and be difficult to read.

Inlinement simply adjusts them into a single, aligned column, off in the margin of the viewport. Out of the way, easy to read, easy to follow. And NOT mixed in with useful code.

![Basic Execution](images/inlinement.gif)

### Bloat? Nope.

When your code is built (or uglified, or minified, or CICD'd, or in just about ANY WAY made ready for deployment), inline comments (and any attendant trailing whitespace preceding them) are stripped anyway, making them an excellent mechanism for detailed code explainations without adding any bloat to your output files. 

Add comments for you, your fellow devs, QA, code reviewers, and for those that come after (and remember: 9 times outta 10? The dev to come after is YOU). As long as they're out of the way and not intrusive, NOBODY dislikes having too MUCH knowledge about what a piece of code does.


### AI-Friendly and Compatible!
<img align="right" width="250" src="./images/ai-a-ok.png">

With the recent advances in AI, this becomes an even more powerful tool. It takes only a short time to train your AI of choice to begin auto-inserting inline comments for you!

(And let's face it: isn't _any_ leg-up we can offer to our human bretheren before those synthetic bastards take all of our jobs anyway? When it comes down to you or the guy one cube over, you really think being the one whose code is _well_-documented is gonna _burn_ you?)

## Commands

In the interest of keeping the extension as utilitarian and lightweight as possible, it adds only a single command, executed on-demand (no background processes, no passive memory consumption).

* `inlinement.align`: Aligns your inline comments using the extensive settings described below. 
  
  Hotkey: `Alt` + `/` , `/` or `⌥` + `/` , `/` (thats TWO forward slashes while holding the Alt or Option key. Yanno, like a comment?).

## Extension Settings

Include if your extension adds any VS Code settings through the `contributes.configuration` extension point.

This extension contributes the following settings:

* `inlinement.alignTo`: (Default: hybrid) Tells inlinement how to align your comments. Options: `fixed` (align all comments to specified column), `longest` (align all comments to the one that follows the longest line, `hybrid` (aligns all to the longer of longest line OR to specified column)
* `inlinement.alignWholeFile`: (Default: selection) Ignore the current selection and just auto-align the whole file. Options: `never` (align only the selected lines), `always` (only align the whole file) `selection` (align whole file only when no lines are selected)
* `inlinement._automatic`: (Default: false) EXPERIMENTAL. Automatically align the previous line on paste and when a newline is inserted.
* `inlinement.minimumColumn`: (Default: 120) Sets a fixed column number to align inline comments to. Set to -1 to ignore.
* `inlinement.includeSingles`: (Default: false) Also align inline comments that are standlone on their own line.
* `inlinement.nearestTabStop`: (Default: true) Rounds the alignment point up to the nearest tab-stop (recommended). For example, if the determined alignment column is 141 and the configured tab size is 4, it will self-adjust to 144.
* `inlinement.offset`: (Default: 4) The number of spaces, minimum that follows each line before beginning the comment. Set to -1 to ignore.
* `inlinement.collisionProtection`: (Default: true) If your code extends beyond the column number set in `inlinement.minimumColumn` the line will be skipped (as opposed to overwriting the code). Overrides all other settings.
* `inlinement.trimSpaces`: (Default: none) Automatically trim: `none` (do not trim spaces in comment), `leading` (only leading spaces in comment), `trailing` (only trailing spaces in comment), `all` (leading and trailing spaces in comment)

## Known Issues

* There really isn't a great way to ascertain where an inline comment begins if one insists on adding a bunch of `//` TO said comment. This is problematic, as I'd love to be able to support hyperlinks in them. I'm open to ideas if anyone has one.
* There's still some corner-case oddball reactions to certain combinations of tabs and spaces for you psychopaths that still use tabs to indent. This appears to happen when the line's leading whitespace is a combination of tabs and spaces. I'm aware of the issue, and I'm working on it. If it REALLY pisses you off? Indent with spaces like a normal human being. 

## (ಠ .ಠ)

## Release Notes

|Ver|Date|Notes|
|---|----|-----|
|**1.0.0**|07.16.2022|Initial release. Enabled automatic alignment to longest line.
|---|-----------|-----------------------------------------------------------
|**1.0.1**|09.21.2022|Added: 
|||☆ `inlinement.alignTo` setting.           (added fixed/longest/hybrid modes)
|||☆ `inlinement.alignWholeFile             (allows for aligning the selection only)
|||☆ `inlinement.minimumColumn` setting.     (added minimum column)
|||☆ `inlinement.collisionProtection` setting.   (provided safeguards against code overwrite)
|---|-----------|-----------------------------------------------------------
|**1.1.0**|01.07.2024|Adding:
|||☆ `inlinement.includeSingles` setting.    (Default: false) Also align inline comments that are standlone on their own line.
|||☆ `inlinement.offset` setting.            (Specify a minimum offset from the end of the longest line)
|||☆ `inlinement.nearestTabStop` setting.   (Round alignment column up to nearest tabstop)
|||☆ `inlinement.trimSpaces` setting.        (Optionally trim leading/trailing spaces from comment)
|||---
||_Experimental_|**(Enable at your own risk! This can void your warranty!)**
|||☆ `inlinement._automatic` setting.          (Automatically align the previous line on paste and when a newline is inserted.)
|---|-----------|-----------------------------------------------------------
|???|**UPCOMING**|_What to expect in future releases_
|||☆ **Adjust settings** inside VSCode's settings GUI (_instead of the `settings.json` file_).
|||☆ **Auto-conceal** comments that are outside the current block.
|||☆ **Conceal all** inline comments unless "view inline comments" is toggled on.
