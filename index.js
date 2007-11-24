/* Copyright 2007 by Oliver Steele.  Available under the MIT License. */

$(function() {
    new DocViewer({api:'sequentially.js',
                   examples:'examples.js',
                   onLoad:Examples.initialize.bind(Examples, true)});
    gMessageWindow = new MessageWindow();
});
