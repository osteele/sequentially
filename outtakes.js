

// ^ Tracing Functions

// The JavaScript for this web page defines a couple of utility
// functions that are used above to trace what's going on.

// `output` writes the date and a message into the message area on
// this page.
output('message');

// `outputter` creates a function that calls `output` with an extra string.
// We use it in the examples to make it easier to see which expression a
// message is coming from.
var fn = outputter('outputter');
fn('argument');

// Each outputter prints an index number, if its called without arguments.
var f1 = outputter('f1'); var f2 = outputter('f2');
f1(); f2(); f1(); f1(); f1(); f2(); f1(); f2();
