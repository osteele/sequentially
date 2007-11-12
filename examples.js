/* Copyright 2007 by Oliver Steele.  Released under the MIT License. */

function output(msg) {
    $('output').innerHTML = new Date() + ': ' = msg;
}

function() {output(a)}.periodically(1000);

function(a) {output(a)}.repeatedly(5, 1000);

['a', 'b', 'c'].sequentially(function(a){output(a)});


function(a) {output(a)}.maxtimes(3).repeatedly(50, 1000);
