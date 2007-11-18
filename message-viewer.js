/* Copyright 2007 by Oliver Steele.  Available under the MIT License. */

var gMessageWindow;


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
        var e = $('examples'),
            text = (e.innerHTML
                    .replace(/(<\/div>)((?:.+?\n)+)/g,
                            '$1<div class="runnable">$2</div>')
                    .replace(/(\(Click on(?:.|\n)*?\))/,
                             '<span class="instr">$1</span>'));
        e.innerHTML = text;
    },

    bind: function() {
        var e = $('examples'),
            mw = gMessageWindow;
        $$('#examples .runnable').each(function(item) {
            var run = Examples.runOne.bind(null, item, true)
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

    runOne: function(item, clicked) {
        clicked && $$('.instr').invoke('removeClassName', 'instr');
        var mw = gMessageWindow,
            counters = {},
            text = item.innerHTML.replace(/&amp;/g, '&');
        function output(name) {
                var args = Array.slice(arguments, 0);
                if (args.length == 1 && typeof name == 'string') {
                    var count = counters[name] || 0;
                    args.push(count);
                    counters[name] = count + 1;
                }
                mw.sourceElement = item;
                mw.output.apply(mw, args);
            };
        var outputter = function(){
            var args = Array.slice(arguments, 0);
            return function() {
                output.apply(this, args.concat(Array.slice(arguments, 0)));
            }
            return output.bind.apply(output.bind, null, arguments);
        };
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
