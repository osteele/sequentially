/*
 * Author: Oliver Steele
 * Copyright: Copyright 2007 by Oliver Steele.  All rights reserved.
 * License: MIT License
 * Homepage: http://osteele.com/javascripts/functional
 * Created: 2007-07-11
 * Modified: 2007-07-21
 */

function initialize() {
    $('noscript').innerHTML = $('noscript').innerHTML.replace(
            /<span.*?<\/span>/,
        'If this message remains on the screen,');
    new OSDoc.Examples().load('examples.js', {
        onSuccess: formatExamples,
        target: 'examples'});
    new OSDoc.APIDoc().load('sequentially.js', {
        onSuccess: noteCompletion.saturate('docs'),
        target: 'docs'});
    initializeHeaderToggle();
    initializeTestLinks();
    
    var dragging = false, m = $('messages');
    Event.observe('messages', 'mousedown', function(e) {
        dragging = {x:e.clientX, y:e.clientY};
        Event.observe(window, 'mouseover', mv);
        Event.observe(window, 'mouseup', mve);
        function mve() {
            Event.stopObserving(window, 'mouseover', mv);
            Event.stopObserving(window, 'mouseup', mve);
        }
    });
    function mv(e) {
        var dx = e.clientX - dragging.x,
            dy = e.clientY - dragging.y;
        if (!dx && !dy) return;
        if (!dragging.o) {
            Position.absolutize(m);
            dragging.o = {x:parseInt(m.style.left), y:parseInt(m.style.top)};
        }
        var x = dragging.o.x + dx,
            y = dragging.o.y + dy;
        m.style.left = x + 'px';
        m.style.top = y + 'px';
    }
    
    var clockDiv = $('clock');
    ticker();
    function ticker() {
        clockDiv.innerHTML = new Date().toLocaleTimeString();
        setTimeout(ticker, 1000 - new Date().getMilliseconds());
    }
    
    function formatExamples() {
        noteCompletion('examples');
        var e = $('examples');
        e.innerHTML = e.innerHTML.replace(/(<\/div>)((?:.+?\n)+)/g, '$1<div class="runnable">$2</div>');
        $$('#examples .runnable').each(function(item) {
            Event.observe(item, 'click', function() {
                try {
                    eval(item.innerHTML);
                } catch (e) {
                    output(['<span class="error">', e, '</span>'].join(''));
                }
            });
        });
    }
}

function initializeHeaderToggle() {
    Event.observe('header-toggle', 'click', updateHeaderState);
    updateHeaderState();
    function updateHeaderState(e) {
        $$('#header').invoke($F('header-toggle') ? 'show' : 'hide');
    }
}

function initializeTestLinks() {
    Event.observe('run-tests', 'click', function(e) {
        Event.stop(e);
        var results = gDocs.runTests();
        alert(results.toHTML());
    });
    Event.observe('write-tests', 'click', function(e) {
        Event.stop(e);
        var text = gDocs.getTestText();
        document.write('<pre>'+text.escapeHTML()+'</pre>');
    });
}

function noteCompletion(flag) {
    var flags = arguments.callee;
    flags[flag] = true;
    if (flags.docs && flags.examples) {
        $('noscript').hide();
        var inputs = $$('kbd');
        if (window.location.search.match(/[\?&]test\b/)) {
            var results = gDocs.runTests();
            alert(results.toHTML());
        }
        scheduleGradientReset();
    }
}

function output() {
    var msg = arguments.length ? Array.prototype.join.call(arguments, ' ') : '[no arguments]',
        lines = arguments.callee.lines = arguments.callee.lines || [],
        line = [
            '<span class="timestamp">',
            new Date().toLocaleTimeString(),
            '</span>',
            msg == null ? '' : ': ' + msg
        ].join('');
    lines.unshift(line);
    lines.splice(20,lines.length);
    $('output').innerHTML = lines.map(function(line, ix) {
        var opacity = 1 - .95*ix/lines.length;
        return ['<div style="opacity:', opacity,'">', line, '</div>'].join('');
    }).join('');
}


/*
 * Gradients
 */

var scheduleGradientReset = (function() {
    var resizer;
    return function() {
        resizer = resizer || window.setTimeout(function() {
            resizer = null;
            resetGradients();
        }, 60);
    }
})();

function resetGradients() {
    resetGradient('intro', 0xeeeeff);
}

function resetGradient(name, startColor, endColor) {
    if (arguments.length < 3) endColor = 0xffffff;
    var parent = $(name);
    var old = ($A(parent.childNodes).select('.className=="grad"'.lambda()));
    old.each(parent.removeChild.bind(parent));
    var children = $A(parent.childNodes).slice(0);
    OSGradient.applyGradient({'gradient-start-color': startColor,
                              'gradient-end-color': endColor,
                              'border-radius': 15},
                             parent);
    var newed = $A(parent.childNodes).reject(children.include.bind(children));
    newed.each('.className="grad"'.lambda());
}

Event.observe(window, 'load', initialize);
