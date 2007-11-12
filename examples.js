/* Copyright 2007 by Oliver Steele.  Released under the MIT License. */

// `output` is defined in the page javascript.  It simply writes the
// date and a message into an area near the top of this page.
output('message');

// wait 2000 ms, and then call output('done')
output.delay(2000, 'done');

// wait 2000 ms, and then call output with no arguments
output.delay(2000);

// run infinitely for as long as `running` is true
var running = true;
(function() {output(); return running}).periodically(1000);

// run this to turn off the loop above
var running = false;

// run five times
output.repeatedly(5, 1000);

// iterate over the elements of an array
['a', 'b', 'c'].sequentially(function(elt){output(elt)}, 1000);

// repeatedly calls this 50 times, but maxtimes filters all
// but the first three
(function(counter) {output(counter)}).maxtimes(3).repeatedly(50, 1000);
