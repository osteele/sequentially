/*
 * Author: Oliver Steele
 * Copyright: Copyright 2007 by Oliver Steele.  All rights reserved.
 * License: MIT License
 * Homepage: http://osteele.com/javascripts/sequentially
 * Version: 1.0preview2
 */


/*
 * ^ Globals
 */

// rhino compatibility
typeof window == 'undefined' && (window = {});

// The global namespace.
var Sequentially = window.Sequentially || {};

/// Return this to indicate that a process has stopped.
Sequentially.nil = Sequentially.nil || {toString:function(){return "Sequentially.nil"}};


/**
 * ^ Utilities
 */

Function.I = function(x){return x};
Function.K = function(x){return function(){return x}};

// mozilla already supports this
Array.slice ||
    (Array.slice = (function() {
        var slice = Array.prototype.slice;
        return function(object) {
            return slice.apply(object, slice.call(arguments, 1));
        };
    })());

/** Returns a function that calls this one with an incrementing
 * zero-based counter spliced into the beginning of the argument
 * list.  If there are additional arguments, they're prepended
 * (after the counter) too.
 */
Function.prototype.incrementally = function() {
    var fn = this,
        args = Array.slice(arguments);
    args.unshift(-1);
    return function() {
        args[0] += 1;
        return fn.apply(this, args.concat(Array.slice(arguments)));
    }
}

/**
 * ^ Temporal Adverbs
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

/** Call this function at Date `when`, or immediately if `when` is
 * in the past.
 */
Function.prototype.at = function(when) {
    var args = Array.slice(arguments, 1),
        self = this,
        fn = function() {self.apply(this, args)};
    setTimeout(fn, Math.max(10, when - new Date()));
}

/** Call this function every `ms` ms (default 1000ms) until it returns nil. */
Function.prototype.periodically = function(ms) {
    var fn = this,
        thread = setInterval(tick, ms||1000);
    function tick() {
        fn() === Sequentially.nil && clearInterval(thread);
    }
}

/** Call the function repeatedly until it returns nil.  If `count` is supplied,
 * only run this many times. */
Function.prototype.repeatedly = function(count) {
    // !(undefined-- < 0) is true
    while (!(--count < 0) && this.apply(null, arguments) !== Sequentially.nil)
        ;
    return Sequentially.nil;
}

/** Sequentially apply this function to each element of `array`.
 */
Function.prototype.sequentially = function(array, options) {
    options = options || {};
    var fn = this,
        ix = -1;
    return next;
    function next() {
        if (++ix >= array.length) return Sequentially.nil;
        return fn.call(options.thisObject, array[ix], ix);
    }
}

/** Call each function in `array`, an array of functions. */
Function.sequentially = function() {
    var array = Array.slice(arguments, 0),
        ix = -1;
    return next;
    function next() {
        if (++ix >= array.length) return Sequentially.nil;
        return array[ix].call(this);
    }
}

/** Call each function in `array`, an array of functions. */
Function.cyclicly = function() {
    var fns = Array.slice(arguments, 0),
        ix = -1;
    return next;
    function next() {
        ix = (++x) % array.length;
        return array[ix].call(this);
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
    options = options || {};
    var array = this,
        ix = -1;
   return next;
    function next() {
        // recompute the length each time, in case it's changing
        if (++ix >= array.length) return Sequentially.nil;
        fn.call(options.thisObject, array[ix], ix);
    }
}


/**
 * ^ Limits
 */

/** Returns a new function that will call the basis function the first
 * `n` times that it's called, and then do nothing.  If `after` is
 * defined, it will be called the `n`+1 time.
 */
Function.prototype.only = function(count, after) {
    var fn = this;
    return function() {
        if (--count < 0) {
            fn = after;
            after = undefined;
        }
        return fn ? fn.apply(this, arguments) : Sequentially.nil;
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
Function.prototype.infrequently = function(interval, options) {
    interval = interval || 1000;
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
        // put if empty, else wait in line
        writer: function(writer) {
            value
                ? writers.push(writer)
                : put(writer());
            return this;
        },
        // apply `reader` to the value if full, else wait in line
        reader: function(reader) {
            value
                ? reader(value[0])
                : readers.push(reader);
            return this;
        },
        // take the value if full, else wait in line
        taker: function(taker) {
            if (!value)
                return takers.push(taker);
            var x = value[0];
            value = null;
            taker(x);
            runNextWriter();
            return this;
        },
        // put a value if empty, else wait in line with the writers
        put: put,
        // `put` and return true if empty, else return false
        tryPut: function(x) {
            value ? false : (put(x), true);
        },
        // return false if empty, else take the value and returns it
        // in a list
        tryTake: function() {
            var was = value;
            value = null;
            runNextWriter();
            return was;
        },
        isEmpty: function() {return !value}
    }
    function put(x) {
        if (value)
            return writers.push(Function.K(x));
        while (readers.length)
            readers.shift().call(null, x);
        if (takers.length) {
            var taker = takers.shift();
            taker(x);
            runNextWriter();
        } else
            value = [x];
    }
    function runNextWriter() {
        if (!value && writers.length) {
            var writer = writers.shift();
            put(writer());
        }
    }
}
