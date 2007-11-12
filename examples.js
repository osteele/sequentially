/* Copyright 2007 by Oliver Steele.  Released under the MIT License. */

// `output` is defined in the page javascript.  It simply writes the
// date and a message into an area near the top of this page.
output('message');

// wait 1s, and then call output('done')
output.eventually(1000, 'eventually from', new Date().toLocaleTimeString());

// wait 1s, and then call output with no arguments
output.eventually(1000);

// run five times at 1s intervals
output.repeatedly(5, 1000);

// run while `running` is not `false`
running = true;
(function() {output('periodically'); return running}).periodically(1000);

// run this to turn off the loop above
running = false;

// iterate over the elements of an array
['a', 'b', 'c'].sequentially(function(elt, ix){
    output('sequentially', ix, elt);
}, 1000);

// repeatedly calls this 50 times, but maxtimes filters all
// but the first three
(function(counter) {output('maxtimes', counter)}).maxtimes(3).repeatedly(50, 1000);
