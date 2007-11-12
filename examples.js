/* Copyright 2007 by Oliver Steele.  Released under the MIT License. */

// ^ Utilities

// The JavaScript for this web page defines `output` ---
// the library doesn't.  It simply writes the
// date and a message into the message area on this page.
output('message');

// `outputter` creates a function that calls `output` with an extra string.
// We use it in the examples to make it easier to see which expression a
// message is coming from.
// [Prototype (and lots of other libraries) defines `bind` --- this library
// doesn't.  `bind` creates a new function with some built-in parameters.]
outputter = function(msg){return output.bind(null, msg)}
outputter('outputter')('argument');

// Finally, this library *does* define `incrementing` (and the rest
// of the functions that are used below).  It calls its basis function
// with an increasing counter each time.
var fn = outputter('incrementing').incrementing();
fn(); fn(); fn();

// ^ Deferred Evaluation

// wait 1s, and then call `output`
outputter('eventually').eventually(1000);

// wait 1s, and then call `output` with no arguments
output.eventually(1000);

// call `output` at a specific time
var when = new Date();
when.setSeconds(when.getSeconds()+1);
outputter('exactly').exactly(when);

// ^ Repeated Evaluation

// run five times at 1/2s intervals
outputter('repeatedly').repeatedly(5, 500);

// run until the basis function returns `false`
stop = false;
(function() {
    output('periodically');
    return !stop;
}).periodically(1000);

// evaluate this to turn off the loop above
stop = true;

// ^ Sequential Execution

// Three different ways of applying a function to a sequence of elements.
// Each defaults to a 10ms frequency; override this with an additonal
// argument to any of the functions below.

// Sequentially apply the argument function to the elements of this array.
// This is equivalent to `Array#forEach`, except that the function
// applications are temporally staggered.
['[0]', '[1]', '[2]'].sequentially(
    outputter('Array#sequentially'));

// Sequentially apply this function to each element of the argument array.
// Equivalent to `Array#sequentially`.
output.sequentially(['fn.sequentially[0]',
                     'fn.sequentially[1]',
                     'fn.sequentially[2]']);

// Call each function in turn.
Function.sequentially([
    outputter('Function.sequentially[0]'),
    outputter('Function.sequentially[1]'),
    outputter('Function.sequentially[2]'),
]);


// ^ Throttling and other limits

// Make a new functions that only calls the old one the first `n` times
// it's called.  After this, it does nothing.  Note that there are four
// function calls, but it only prints the message twice.
var fn = outputter('maxtimes').maxtimes(2);
fn(); fn(); fn(); fn();

// `output` will be called at most once/second,
// no matter how fast fn is called
var fn = outputter('throttled').
  incrementing().
  throttled(1000);
fn(); fn(); fn(); fn();

// Same as above, but with incremental backoff
var fn = outputter('throttled w/backoff').
  incrementing().
  throttled(1000, {backoff:true});
fn(); fn(); fn();


// ^ MVar

// An `MVar` is an asynchronous channel that synchronizes
// readers and writers.  `MVar` implements (most of) the
// Haskell `MVar` interface, but using funargs instead of
// the `IO` monad.

// multiple readers wait for a write:
var mv = MVar();
mv.taker(outputter('mvar.take'));
mv.taker(outputter('mvar.take'));
mv.put(1);
mv.put(2);

// writes are queued for the next read:
var mv = MVar();
mv.put(1);
mv.put(2);
mv.taker(outputter('mvar.take'));
mv.taker(outputter('mvar.take'));

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
mv.taker(outputter('mvar.taker'));
mv.taker(outputter('mvar.taker'));
