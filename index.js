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
            Event.observe(item, 'click', function() {console.info(item.innerHTML)});
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

function output(msg) {
    var now = new Date;
    $('output').innerHTML = new Date().toLocaleTimeString() +
                             (msg == undefined ? '' : ': ' + msg) + '<br/>' +
        $('output').innerHTML.split(/<br\/?>/).slice(0,5).join('<br/>');
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
