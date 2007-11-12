/* Copyright 2007 by Oliver Steele.  Released under the MIT License. */

// `output` is defined in the page javascript.  It simply writes the
// date and a message into the message area on this page.
output('message');

// ^ Deferred Evaluation

// wait 1s, and then call output('done')
output.eventually(
    1000,
    'eventually from',
    new Date().toLocaleTimeString());

// wait 1s, and then call output with no arguments
output.eventually(1000);

// call output at an exact time (approximately)
var when = new Date();
when.setSeconds(when.getSeconds()+1);
output.exactly(when, 'exactly');

// ^ Periodical Evaluation

// run five times at 1s intervals
output.repeatedly(5, 1000);

// run while `runPeriodically` (below) is not `false`
runPeriodically = true;
(function() {
    output('periodically');
    return runPeriodically;
}).periodically(1000);

// evaluate this to turn off the loop above
runPeriodically = false;

// ^ Sequential Execution

// Three different ways of applying a function to a sequence of elements:

// Sequentially apply the argument function to the elements of this array.
['a', 'b', 'c'].sequentially(
    output.bind(null, '[...].sequentially'));

// Sequentially apply this function to each element of the argument array.
output.sequentially(['fn.sequentially a',
                     'fn.sequentially b',
                     'fn.sequentially c']);

// Call each function sequentially.
Function.sequentially([
    output.bind(null, 'Function.sequentially first'),
    output.bind(null, 'Function.sequentially second'),
    output.bind(null, 'Function.sequentially third'),
]);


// ^ Throttling and other limits

// repeatedly calls this 50 times, but `maxtimes` filters all
// but the first three
output.bind(null, 'maxtimes').
  maxtimes(3).
  repeatedly(50);

// output() will be called at most once/second,
// no matter how fast fn is called
var fn = output.bind(null, 'throttled').throttled(1000);
fn(); fn(); fn(); fn();

