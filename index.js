/* Copyright 2007 by Oliver Steele.  Available under the MIT License. */

Event.observe(window, 'load', function() {
    new DocViewer({api:'sequentially.js',
                   examples:'examples.js',
                   onLoad:Examples.initialize.bind(null, true)});
    gMessageWindow = new MessageWindow();
});
