'use strict';

var tap = require('tap');

var command = require('../../../lib/util/command');

tap.test('command', function(t) {
    t.equal(typeof command.countValidCommand, 'function');
    t.equal(0, command.countValidCommand({}));
    t.equal(1, command.countValidCommand({ args: [{ commands: 'mock' }] }));
    t.equal(1, command.countValidCommand({ args: ['mock', { commands: 'mock' }] }));
    t.end();
});
