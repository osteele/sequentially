/* Copyright 2007 by Oliver Steele.  Available under the MIT License. */

var gDocs;
var gMessageWindow;

function initialize() {
    $('noscript').innerHTML = $('noscript').innerHTML.replace(
            /<span.*?<\/span>/,
        'If this message remains on the screen,');
    new OSDoc.ExampleViewer().load('examples.js', {
        onSuccess: function() {
            Examples.initialize(true);
            noteCompletion('examples');
        },
        target: 'examples'});
    gDocs = new OSDoc.APIViewer().load('sequentially.js', {
        onSuccess: noteCompletion.saturate('docs'),
        target: 'docs'});
    initializeHeaderToggle();
    initializeTestLinks();

    gMessageWindow = new MessageWindow();
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


/*
 * Examples
 */

var Examples = {
    initialize: function(run) {
        Examples.format();
        Examples.bind();
        run && Examples.run();
    },

    format: function() {
        var e = $('examples');
        e.innerHTML =
            e.innerHTML.replace(/(<\/div>)((?:.+?\n)+)/g, '$1<div class="runnable">$2</div>');
    },

    bind: function() {
        var e = $('examples'),
            mw = gMessageWindow;
        $$('#examples .runnable').each(function(item) {
            var run = Examples.runOne.bind(null, item)
            item.observe('mouseover', mw.highlightMessagesFrom.bind(mw, item));
            item.observe('mouseout', mw.highlightMessagesFrom.bind(mw, null));
            item.observe('click', run);
        });
    },

    run: function() {
        var e = $('examples');
        $$('#examples .runnable').each(function(item) {
            Examples.runOne(item);
        });
    },

    runOne: function(item) {
        var mw = gMessageWindow,
            output = function() {
                mw.sourceElement = item;
                mw.output.apply(mw, arguments);
            };
        var outputter = function(msg){return output.bind(null, msg)},
            text = item.innerHTML.replace(/&amp;/g, '&');
        try {
            with ({output: output,
                   outputter: outputter})
                eval(text);
        } catch (e) {
            output(['<span class="error">', e, '</span>'].join(''));
        }
    }
}


/*
 * Message Window
 */

function MessageWindow() {
    this.initialize();
}

MessageWindow.prototype = {
    initialize: function() {
        this.bindEvents();
        this.startClock();
        this.messages = [];
    },

    bindEvents: function() {
        $$('#messages .left, #messages .right').map(function(e) {
            e.observe('click', function() {
                console.info(1, e);
                $('messages').removeClassName('left').removeClassName('right').addClassName(e.className);
            });
        });
    },

    startClock: function() {
        var clockDiv = $('clock');
        ticker();
        function ticker() {
            clockDiv.innerHTML = new Date().toLocaleTimeString();
            setTimeout(ticker, 1000 - new Date().getMilliseconds());
        }
    },

    output: function() {
        var msg = arguments.length ? Array.prototype.join.call(arguments, ' ') : '[no arguments]',
            messages = this.messages,
            src = this.sourceElement;
        if (src) {
            this.sourceElement = null;
            var id = $(src).requireId();
            msg = ['<a class="src src-for-', id,'" id="_s_',
                   id, '" title="Click to scroll to the source">',
                   msg, '</a>'].join('');
        }
        var line = [
            '<span class="timestamp">',
            new Date().toLocaleTimeString(),
            ' </span>',
            msg
        ].join('');
        messages.unshift(line);
        messages.splice(20, messages.length);
        $('output').innerHTML = messages.map(function(line, ix) {
            var opacity = 1 - .95*ix/messages.length;
            return ['<div style="opacity:', opacity,'">', line, '</div>'].join('');
        }).join('');
        if (src && src == this.highlighting)
            this.highlightMessagesFrom(src);
        // re-bind the events
        var self = this;
        $$('#output .src').each(function(elt) {
            elt.onclick = function() {
                var id = elt.id.replace(/^_s_/, ''),
                    src = $(id);
                src.scrollTo();
            }
            elt.onmouseover = function() {
                var id = elt.id.replace(/^_s_/, ''),
                    src = $(id);
                self.highlightMessagesFrom(id);
                src.addClassName('selected');
            }
            elt.onmouseout = function() {
                $$('#examples .selected, #messages .selected').invoke('removeClassName',
                                                                      'selected');
                this.highlighting = false;
            }
        });
    },

    highlightMessagesFrom: function(src) {
        this.highlighting = src;
        $$('#messages .selected').invoke('removeClassName', 'selected');
        if (src) {
            var id = $(src).requireId();
            $$('#messages .src-for-' + id).invoke('addClassName', 'selected');
        }
    }
}


/*
 * Utilities
 */

Element.nextId = 0;

Element.addMethods({
    requireId: function(e) {
        var id = e.id;
        if (!id)
            id = e.id = '_o_' + ++Element.nextId;
        return id;
    }
});


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
