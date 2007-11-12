/* Copyright 2007 by Oliver Steele.  Released under the MIT License. */

// `output` is defined in the page javascript.  It simply writes the
// date and a message into the message area on this page.
output('message');

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

// run five times at 1s intervals
output.repeatedly(5, 1000);

// run while `runPeriodically` is not `false`
runPeriodically = true;
(function() {
    output('periodically');
    return runPeriodically;
}).periodically(1000);

// evaluate this to turn off the loop above
runPeriodically = false;

// iterate over the elements of an array
['a', 'b', 'c'].sequentially(
    function(elt, ix){
        output('sequentially', ix, elt);
    }, 1000);

// repeatedly calls this 50 times, but maxtimes filters all
// but the first three
(function(counter) {
    output('maxtimes', counter);
}).
  maxtimes(3).
  repeatedly(50, 1000);

// output() will be called at most once/second,
// no matter how fast fn is called
var fn = output.bind(null, 'throttled').throttled(1000);
fn(); fn(); fn(); fn();
