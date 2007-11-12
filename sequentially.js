/*
 * Author: Oliver Steele
 * Copyright: Copyright 2007 by Oliver Steele.  All rights reserved.
 * License: MIT License
 * Homepage: http://osteele.com/javascripts/sequentially
 * Version: 1.0
 */

// In case this library is used without Functional or Prototype.
Function.K = Function.K || function(){};

// mozilla already supports this
Array.slice ||
    (Array.slice = (function() {
        var slice = Array.prototype.slice;
        return function(object) {
            return slice.apply(object, slice.call(arguments, 1));
        };
    })());


/**
 * ^ Timing
 */

/** Call this function after `ms` ms.   If this function is called with
 * additional arguments, they're passed to the basis function when it is
 * finally called.
 */
Function.prototype.eventually = function(ms) {
    var args = Array.slice(arguments, 1),
        self = this,
        fn = function() {self.apply(this, args)};
    setTimeout(fn, ms || 10);
}

/** Call this function at Date `when`, or immediately if `when` has
 * passed.
 */
Function.prototype.exactly = function(when) {
    var args = Array.slice(arguments, 1),
        self = this,
        fn = function() {self.apply(this, args)};
    setTimeout(fn, Math.max(10, when - new Date()));
}

/** Call this function every `ms` ms until it returns `false`. */
Function.prototype.periodically = function(ms) {
    var fn = this,
        thread = setInterval(tick, ms||10);
    function tick() {
        fn() == false && clearInterval(thread);
    }
}

/** Call this function every `ms` ms for a total of `count` times.
 * If `options.after` is defined, it is called `ms` ms after the
 * last call.
 */
Function.prototype.repeatedly = function(count, ms, options) {
    var fn = this,
        ix = 0;
    options = options || {};
    next.periodically(ms);
    function next() {
        if (count-- <= 0) return ((options.after||Function.K)(), true);
        fn.call(options.thisObject, ix++);
    }
}

/** Sequentially apply this function to each element of `array`,
 * every `ms` ms.  See `Array#sequentially` for additional `options`.
 */
Function.prototype.sequentially = function(array, ms, options) {
    return array.sequentially(this, ms, options);
}

/** Call each function in `array`, an array of functions. */
Function.sequentially = function(array, ms, options) {
    var ix = 0,
        len = array.length;
    options = options || {};
    next.periodically(ms);
    function next() {
        if (ix >= len) return ((options.after||Function.K)(), false);
        array[ix].call(options.thisObject, ix++);
    }
}

/** Apply `fn` to each element of this array, every `ms` ms.
 * Ignores the results.  `fn` is applied to `options.thisObject`
 * (as `this`), the array element, and its index.
 *
 * Options:
 *
 * options.after: call this function after the last item
 *
 * options.thisObject: `this` object for function call
 */
Array.prototype.sequentially = function(fn, ms, options) {
    var array = this,
        ix = 0;
    options = options || {};
    next.periodically(ms);
    function next() {
        // recompute the length each time, in case it's changing
        if (ix >= array.length) return ((options.after||Function.K)(), false);
        fn.call(options.thisObject, array[ix], ix);
        ix += 1;
    }
}


/**
 * ^ Throttling
 */

/** Returns a new function that will call the basis function the first
 * `n` times that it's called, and then do nothing.  If `after` is
 * defined, it will be used the `n`+1 time.
 */
Function.prototype.maxtimes = function(count, after) {
    var fn = this;
    return function() {
        if (--count < 0) {
            fn = after;
            after = undefined;
        }
        return fn && fn.apply(this, arguments);
    }
}


/**
 * Returns a new function that, no matter how frequently it is called,
 * won't execute the body of the original function more than a certain
 * frequency.  The frequence is specified by `interval`, which is in
 * units of ms.
 *
 * Options:
 *
 * options.backoff (false): if a number, increase the delay between calls by
 * this factor.  A value of true is equivalent to 2.
 *
 * options.fromEnd (false): if true, the delay is from end to start instead
 * of start-to-start.
 */
Function.prototype.throttled = function(interval, options) {
    interval = interval || 10;
    options = options || {};
    var fn = this,
        lastTime = null,
        backoffRatio = options.backoff == true ? 2 : options.backoff;
    return function() {
        var self = this,
            args = Array.slice(arguments, 0);
        setTimeout(run, 10);
        function run() {
            var now = new Date,
                wait = interval - (now - lastTime);
            // false for wait==NaN
            if (wait > 0)
                return setTimeout(run, wait);
            if (backoffRatio)
                interval = Math.ceil(interval * backoffRatio);
            lastTime = now;
            fn.apply(self, args);
            if (options.fromEnd)
                lastTime = new Date();
        }
    }
}


// This is a function that returns the instance, not a constructor.
// All readers are called before any taker.
function MVar() {
    var value,
        readers = [],
        writers = [],
        takers = [];
    return {
        writer: function(writer) {
            value
                ? writers.push(writer)
                : writer(put);
            return this;
        },
        reader: function(reader) {
            value
                ? reader(value[0])
                : readers.push(reader);
            return this;
        },
        taker: function(taker) {
            if (!value)
                return takers.push(taker);
            var x = value[0];
            value = null;
            taker(value);
            value || runNextWriter();
            return this;
        },
        put: put,
        tryPut: function(x) {
            value ? false : (value = [x], true);
        },
        tryTake: function(x) {
            var was = value;
            value = null;
            return was;
        }
    }
    function put(x) {
        if (value)
            return writers.push(Function.K(x));
        value = [x];
        if (readers.length) {
            readers.each(function(fn){fn.call(null, x)});
            readers = [];
        }
        if (takers.length) {
            var taker = takers.shift();
            taker(x);
        }
        value || runNextWriter();
    }
    function runNextWriter() {
        if (!value && writers.length) {
            var writer = writers.shift();
            writer(put);
        }
    }
}

function RemoteMVar(options) {
    var mvar = MVar();
    this.reader = mvar.reader;
    ajax(Hash.merge({success:mvar.put}, options));
}

var Pi = {
    Name: function(options) {
        var mvar = MVar();
        this.oninput = mvar.reader;
        var throttledGetter = Function.maxtimes(5,
            Function.throttled(
                getter, 2000,
                {fromEnd:true, backoff:true}),
                                                reportError.bind(null, "couldn't connecto the server"));
        throttledGetter();
        function getter() {
            ajax(Hash.merge({success:mvar.put, error:throttledGetter}, options));
        }
    }
}