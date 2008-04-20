/* Copyright 2008 by Oliver Steele.  All rights reserved.
 * Available under the MIT License.
 */

/* Calls `fn`, and returns its value.  Within the dynamic extent
 * of the call, the {set,clear}{Timeout,Interval} family of functions
 * is replaced by an implementation that manages its own scheduling,
 * and then runs functions in order by their scheduled time, but
 * before `withMockTimers` returns and without paying attention to
 * real time.
 */
function withMockTimers(fn) {
    var result;
    MockTimers.install();
    try {
        result = fn();
        MockTimers.run();
    } catch (ex) {
        // some version of MSIE can't parse 'finally'
        MockTimers.remove();
        throw ex;
    }
    MockTimers.remove();
    return result;
}

var MockTimers = {
    install: function() {
        var intervals = {}, timeouts = {};
        var sequenceId = 0;
        var threads = [];
        var now = new Date;
        function newThread(fn, ms, index, repeat) {
            var thread = {
                fn:fn, ms:ms, repeat:repeat, nextTime:now+ms,
                remove:function () { removeThread(id, index) }
            };
            threads.push(thread);
            var id = ++sequenceId;
            index[id] = thread;
            return id;
        }
        function removeThread(id, index) {
            var thread = index[id];
            if (thread) {
                delete index[id];
                thread.cancelled = true;
            }
        }
        var methods = {
            setInterval: function(fn, ms) {
                return newThread(fn, ms, intervals, true);
            },
            setTimeout: function(fn, ms) {
                return newThread(fn, ms, timeouts, false);
            },
            clearInterval: function(interval) {
                removeThread(intervals, interval);
            },
            clearTimeout: function(timeout) {
                removeThread(timeouts, timeout);
            }
        };
        var saved = {}
        for (var name in methods) {
            saved[name] = window[name];
            window[name] = methods[name];
        }
        this.remove = function() {
            for (var name in saved)
                window[name] = saved[name];
            delete this.remove;
            delete this.run;
        }
        this.run = function() {
            while (threads.length) {
                threads.sort(function(a, b) { return a.nextTime < b.nextTime });
                var thread = threads.shift();
                if (thread.cancelled) continue;
                now = thread.nextTime;
                thread.fn();
                if (thread.repeat)
                    thread.nextTime = now + thread.ms;
                else
                    thread.remove();
                
            }
        }
    }
}
