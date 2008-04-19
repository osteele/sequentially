/*
 * Author: Oliver Steele
 * Copyright: Copyright 2007 by Oliver Steele.  All rights reserved.
 * License: MIT License
 * Homepage: http://osteele.com/javascripts/sequentially
 * Repository: http://github.com/osteele/sequentially
 * Version: 1.1
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
 * ^ Temporal Adverbs
 */

/** Call this function after `ms` ms.   If this function is called with
 * additional arguments, they're passed to the basis function when it is
 * finally called.
 */
Function.prototype.eventually = function(ms) {
    var args = Array.slice(arguments, 1),
        self = this,
        fn = function() {self.apply(this, args)},
        thread = setTimeout(fn, ms || 10);
    return {cancel:function(){clearTimeout(thread)}};
}

/** Call this function at Date `when`, or immediately if `when` is
 * in the past.
 */
Function.prototype.at = function(when) {
    var args = Array.slice(arguments, 1),
        self = this,
        fn = function() {self.apply(this, args)},
        thread = setTimeout(fn, Math.max(10, when - new Date()));
    return {cancel:function(){clearTimeout(thread)}};
}


/// ^ Frequency Adverbs

/** Call this function every `ms` ms (default 1000ms) until it returns nil. */
Function.prototype.periodically = function(ms) {
    var fn = this,
        thread = null;
    start();
    return {stop:stop, start:start};
    function stop() {thread && clearTimeout(thread); thread=null}
    function start() {thread || (thread = setInterval(tick, ms||1000))}
    function tick() {fn() === Sequentially.nil && stop(thread)}
}

/** Call the function repeatedly until it returns nil.  If `count` is supplied,
 * only run this many times. */
Function.prototype.repeatedly = function(count) {
    // Write the first test this way because !(undefined-- < 0) is true
    while (!(--count < 0) && this.apply(null, arguments) !== Sequentially.nil)
        ;
    return Sequentially.nil;
}

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
        // Always run after the caller returns.  This makes the
        // throttled and unthrottled case look the same to the caller,
        // which avoids a subtle source of bugs.
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


/// ^ Sequencing Adverbs
///
/// These sequence a function across an array.

/** Return a function that sequentially applies this function to each
 * element of `array`.  Each time the return function is called, it applies
 * this function to the next element each.of the array, finally returning
 * `Sequentially.nil`. */
Function.prototype.sequentially = function(array, thisObject) {
    var fn = this,
        ix = -1;
    return next;
    function next() {
        if (++ix >= array.length) return Sequentially.nil;
        return fn.call(thisObject, array[ix], ix);
    }
}

/** Each time the result function is called, it calls the next
 * function in the original argument list.  Finally returns
 * `Sequentially.nil`. */
Sequentially.sequentially = function() {
    var fns = Array.slice(arguments, 0),
        ix = -1;
    return next;
    function next() {
        if (++ix >= fns.length) return Sequentially.nil;
        return fns[ix].apply(this, arguments);
    }
}

/** Same as `Sequentially.sequentially`, except starts with the first
 * function again after the last one has been called. */
Sequentially.cyclicly = function() {
    var fns = Array.slice(arguments, 0),
        ix = -1;
    return next;
    function next() {
        if (!fns.length) return Sequentially.nil;
        ix = (ix + 1) % fns.length;
        return fns[ix].apply(this, arguments);
    }
}

/** Apply `fn` to each element of this array, every `ms` ms.
 * Ignores the results.  `fn` is applied to `thisObject`
 * (as `this`), the array element, and its index.
 */
Array.prototype.sequentially = function(fn, ms, thisObject) {
    var array = this,
        ix = -1;
   return next;
    function next() {
        // recompute the length each time, in case it's changing
        if (++ix >= array.length) return Sequentially.nil;
        fn.call(thisObject, array[ix], ix);
    }
}


/**
 * ^ Utilities
 */

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

var Sequentially = {
    trickle: {
        /** Call `fn` on each element of `array`, and finally call `k`.
          * The function is applied to a slice of elements until
          * `ms` has elapsed; the caller then waits a frame before
          * applying it to the next slice.
          */
        forEach: function(array, fn, ms, k) {
            var i = 0;
            return schedule();
            function schedule() {
                // check the length each time, in case it changes
                if (i >= array.length) {
                    if (!i)
                        // on next tick, to minimize code path count
                        return setTimeout(function() { k && k() }, 10);
                    return k && k();
                }
                return setTimeout(next, 10);
            }
            function next() {
                var t0 = new Date;
                while (i < array.length) {
                    fn(array[i++]);
                    if (new Date - t0 > ms)
                        break;
                }
                schedule();
            }
        },
        
        /** Call `fn` on each element of `array`, collecting the results
          * into an array that is returned and passed as an argument to
          * `k`.  The function is applied to a slice of elements until
          * `ms` has elapsed; the caller then waits a frame before
          * applying it to the next slice.  The return value is initially
          * empty.
          */
        map: function(array, fn, ms, k) {
            var i = 0,
                results = [];
            schedule();
            return results;
            function schedule() {
                // check the length each time, in case it changes
                if (i >= array.length)
                    return k && k(results);
                setTimeout(next, 10);
            }
            function next() {
                var t0 = new Date;
                while (i < array.length) {
                    results[i] = fn(array[i++]);
                    if (new Date - t0 > ms)
                        break;
                }
                schedule();
            }
        }
    }
}
