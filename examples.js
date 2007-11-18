/* Copyright 2007 by Oliver Steele.  Released under the MIT License. */

// ^ One-liners

// Here's a sample of what's in this library.  (Click on a blue block
// below to execute it.  Click on a message in the message window to
// see where it came from.)

// `outputter` returns a function that prints a message to the message
// panel.  It's not part of this library and it doesn't use it, but
// it's useful in these examples.
var fn = outputter('message');
fn(); fn();

// Defines a function that calls the outputter only once per second,
// no matter how frequently you call `fn`.
var fn = outputter('infrequently').infrequently();
fn(); fn(); fn(); fn();

// Defines a function that calls the outputter only twice, no matter
// how many times you call `fn`.
var fn = outputter('only').only(2);
fn(); fn(); fn(); fn(); fn();

// This calls the outputter five times in a row, right now.
outputter('repeatedly').only(5).repeatedly();

// This calls it five times, once per second.
outputter('periodically').only(5).periodically();

// Apply the outputter sequentially to each element of the array, once
// per second.
outputter('seq').sequentially(['a','b','c']).periodically();


// ^ Deferred Execution (Temporal Adverbs)

// wait one second, and then call `output` with no arguments
output.eventually(1000);

// wait one second, and then call the outputter
outputter('eventually').eventually(1000);

// call `output` at a specific date and time (here, one second in the
// future)
var when = new Date();
when.setSeconds(when.getSeconds()+1);
outputter('at', when.toTimeString()).at(when);


// ^ Repeated Execution (Frequency Adverbs)

// run five times immediately
outputter('repeatedly').only(5).repeatedly();

// same as above
outputter('repeatedly').repeatedly(5);

// run five times at one second intervals
outputter('repeatedly').only(5).periodically();

// run one function once a second, and another
// twice a second
outputter('repeatedly 1s').only(5).periodically(1000);
outputter('repeatedly .5s').only(10).periodically(500);

// once a second until `stop` is set true
stop = false;
(function() {
    output('periodically');
    return stop && Sequentially.nil;
}).periodically();

// evaluate this to stop the loop above
stop = true;


// ^ Sequential Execution

// Sequentially returns a function that sequentially applies this
// function to the elements of the argument array each time it is
// called.
var fn = outputter('Function#sequentially')
  .sequentially(['[0]', '[1]', '[2]']);
fn(); fn(); fn();

// We could also write it as a method on the array.  This looks
// more like `Array#forEach` and friends.
var fn = ['[0]', '[1]', '[2]'].sequentially(
    outputter('Array#sequentially'));
fn(); fn(); fn();

// This is equivalent to `Array#forEach`.
['[0]', '[1]', '[2]'].sequentially(
    outputter('Array#sequentially.repeatedly')).repeatedly();

// The same as above, except the function is called only once per second.
// (We could do the same with `fn.infrequently().repeatedly()`.)
['[0]', '[1]', '[2]'].sequentially(
    outputter('Array#sequentially.periodically')).periodically();

// Create a function that invokes each of its arguments in turn.
// We'll call it a number of times in a row to invoke them
// all immediately, but this could also be used as a target to
// `repeatedly` or `periodically`, possibly with an intermediate
// `infrequently` to throttle its.
var fn = Function.sequentially(
    outputter('Function.sequentially[0]'),
    outputter('Function.sequentially[1]'),
    outputter('Function.sequentially[2]')
)
fn(); fn(); fn();


// ^ Throttling

// `fn` only invokes the outputter the first `n` times it's called.
// After this, it does nothing.  Note that there are four function
// calls, but it only prints the message twice.
var fn = outputter('only').only(2);
fn(); fn(); fn(); fn();

// `fn` calls `output` at most once per second, no matter
// how fast `fn` is called.
var fn = outputter('infrequently').infrequently(1000);
fn(); fn(); fn(); fn();

// Same as above, but with incremental backoff
var fn = outputter('infrequently w/backoff').
  infrequently(250, {backoff:true});
fn(); fn(); fn(); fn();


// ^ MVar

// An `MVar` is an asynchronous channel that synchronizes
// readers and writers.  `MVar` implements (most of) the
// Haskell `MVar` interface, but using funargs instead of
// the `IO` monad.

// multiple readers wait for a write:
var mv = MVar();
mv.taker(outputter('mvar.take (before put) 1'));
mv.taker(outputter('mvar.take (before put) 2'));
mv.put(1);
mv.put(2);

// writes are queued for the next read:
var mv = MVar();
mv.put(1);
mv.put(2);
mv.taker(outputter('mvar.take (after put) 1'));
mv.taker(outputter('mvar.take (after put) 2'));

// writers are also queued.  A writer isn't
// called until the MVar is empty.
var mv = MVar();
mv.writer(function() {
    output('mvar.write 0');
    return 0;
});
mv.writer(function() {
    output('mvar.write 1');
    return 1;
});
mv.taker(outputter('mvar.taker 1'));
mv.taker(outputter('mvar.taker 2'));
