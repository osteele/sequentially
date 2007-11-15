/* Copyright 2007 by Oliver Steele.  Released under the MIT License. */

// ^ One-liners

// Here's a quick taste of what's below.  Here's a function that
// receives a different argument each time you call it.
var fn = outputter('incrementally').incrementally();
fn(); fn(); fn();

// Here's one that runs only twice, no matter how often you call it.
var fn = outputter('only').incrementally().only(2);
fn(); fn(); fn(); fn(); fn();

// Here's one that runs only once per second, now matter how *fast*
// you call it.
var fn = outputter('infrequently').incrementally().infrequently();
fn(); fn(); fn(); fn();

// This one runs once per second, for a total of five times.
var fn = outputter('periodically').incrementally().only(5).periodically();

// Finally, here's a function that is applied to each element
// of an array, once per second.
outputter('mondo').sequentially(['a', 'b', 'c']).periodically();


// ^ Utilities

// The JavaScript for this web page defines a couple of utility functions
// that we can use to see what's going on.  `output` writes the
// date and a message into the message area on this page.
output('message');

// `outputter` creates a function that calls `output` with an extra string.
// We use it in the examples to make it easier to see which expression a
// message is coming from.
var fn = outputter('outputter');
fn('argument');


// ^ Deferred Evaluation

// wait 1s, and then call `output`
outputter('eventually').eventually(1000);

// wait 1s, and then call `output` with no arguments
output.eventually(1000);

// call `output` at a specific time
var when = new Date();
when.setSeconds(when.getSeconds()+1);
outputter('at').at(when);


// ^ Repeated Evaluation

// run five times at 1/2s intervals
outputter('repeatedly').only(5).periodically(500);

// run until the basis function returns stop
stop = false;
(function() {
    output('periodically');
    return stop && Sequentially.nil;
}).periodically(1000);

// evaluate this to turn off the loop above
stop = true;


// ^ Sequential Execution

// Sequentially apply the argument function to the elements of this array.
// This is equivalent to `Array#forEach`.
['[0]', '[1]', '[2]'].sequentially(
    outputter('Array#sequentially.repeatedly')).repeatedly();

// The same as above. except the function is called only once per second.
['[0]', '[1]', '[2]'].sequentially(
    outputter('Array#sequentially.periodically')).periodically();

// A new function that calls each function in turn.
Function.sequentially(
    outputter('Function.sequentially[0]'),
    outputter('Function.sequentially[1]'),
    outputter('Function.sequentially[2]')
).repeatedly();


// ^ Throttling

// Make a new functions that only calls the old one the first `n` times
// it's called.  After this, it does nothing.  Note that there are four
// function calls, but it only prints the message twice.
var fn = outputter('only').only(2);
fn(); fn(); fn(); fn();

// `output` will be called at most once/second,
// no matter how fast `fn` is called.
var fn = outputter('infrequently').
  incrementally().
  infrequently(1000);
fn(); fn(); fn(); fn();

// Same as above, but with incremental backoff
var fn = outputter('infrequently w/backoff').
  incrementally().
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
