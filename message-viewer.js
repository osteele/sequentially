/* Copyright 2007 by Oliver Steele.  Available under the MIT License. */

var gMessageWindow;


/*
 * Examples
 */

var Examples = {
    initialize: function(run) {
        this.view = $('#examples')[0];
        Examples.format();
        Examples.bindEvents();
        run && Examples.run();
    },

    format: function() {
        var e = this.view,
            text = (e.innerHTML
                    .replace(/(<\/div>)((?:.+?\n)+)/g,
                            '$1<div class="runnable">$2</div>')
                    .replace(/(\(Click on(?:.|\n)*?\))/,
                             '<span class="startup-instructions">$1</span>'));
        if ($('#examples .runnable') <= 1) {
            $('#noscript').html().show();
            $('#message').hide();
        }
        e.innerHTML = text;
    },

    bindEvents: function() {
        var self = this,
            e = this.view,
            mw = gMessageWindow;
        $('#examples .runnable').each(function() {
            var item = this,
                runner = self.runOne.bind(self, item, true);
            $(item).click(runner);
            $(item).mouseover(mw.highlightMessagesFrom.bind(mw, item));
            $(item).mouseout(mw.highlightMessagesFrom.bind(mw, null));
        });
    },

    run: function() {
        var self = this;
        $('#examples .runnable').each(function() {
            self.runOne(this);
        });
    },

    runOne: function(item, clicked) {
        clicked && $('.startup-instructions').removeClass('startup-instructions');
        var mw = gMessageWindow,
            counters = {},
            text = item.innerHTML.replace(/&gt;/g, '>').replace(/&amp;/g, '&');
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
        this.messages = [];
        this.startClock();
        this.bindEvents();
    },

    bindEvents: function() {
        $('#messages .left, #messages .right').click(function() {
            $('#messages').removeClass('left').removeClass('right').addClass(this.className);
        });
    },

    startClock: function() {
        var clockDiv = $('#clock')[0];
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
        $('#output').html(messages.map(function(line, ix) {
            var opacity = 1 - .95*ix/messages.length;
            return ['<div style="opacity:', opacity,'">', line, '</div>'].join('');
        }).join(''));
        if (src && src == this.highlighting)
            this.highlightMessagesFrom(src);
        // re-bind the events
        var self = this;
        $('#output .src').click(function() {
            var id = this.id.replace(/^_s_/, ''),
                src = $('#'+id)[0];
            $.scrollTo(src, {speed:1000, easing:'elasout'});
        }).mouseover(function() {
            var id = this.id.replace(/^_s_/, ''),
                src = $('#'+id);
            self.highlightMessagesFrom(src[0]);
            src.addClass('selected');
        }).mouseout(function() {
            $('#examples .selected, #messages .selected').removeClass('selected');
            self.highlighting = false;
        });
    },

    highlightMessagesFrom: function(src) {
        this.highlighting = src;
        $('#messages .selected').removeClass('selected');
        if (src) {
            var id = $(src).requireId();
            $('#messages .src-for-' + id).addClass('selected');
        }
    }
}


/*
 * Utilities
 */

jQuery.fn.requireId = function() {
    if (!this.length) return null;
    var e = this[0],
        id = e.id;
    if (!id)
        id = e.id = '_o_' + ++arguments.callee.nextId;
    return id;
}

jQuery.fn.requireId.nextId = 0;

//borrowed from jQuery easing plugin
//http://gsgd.co.uk/sandbox/jquery.easing.php
$.easing.elasout = function(x, t, b, c, d) {
    var s=1.70158;var p=0;var a=c;
    if (t==0) return b;  if ((t/=d)==1) return b+c;  if (!p) p=d*.3;
    if (a < Math.abs(c)) { a=c; var s=p/4; }
    else var s = p/(2*Math.PI) * Math.asin (c/a);
    return a*Math.pow(2,-10*t) * Math.sin( (t*d-s)*(2*Math.PI)/p ) + c + b;
};