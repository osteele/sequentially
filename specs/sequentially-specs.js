/* Copyright 2008 by Oliver Steele.  All rights reserved. */

describe('Sequentially.trickle.forEach', {
    'should apply to all the elements': function() {
        withMockTimers(function() {
            var visited = [];
            Sequentially.trickle.forEach(
                ['a', 'b', 'c'],
                function(x) { visited.push(x) },
                1,
                function() {
                    value_of(visited.join(',')).should_be('a,b,c');
                });
        });
    }
});

describe('Sequentially.trickle.map', {
    'should apply to all the elements': function() {
        withMockTimers(function() {
            Sequentially.trickle.map(
                ['a', 'b', 'c'],
                function(x) { return x + 1 },
                1,
                function(result) {
                    value_of(result.join(',')).should_be('a1,b1,c1');
                });
        });
    }
});
