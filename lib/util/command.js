'use strict';

/**
 * countValidCommand
 *
 * Given a program, count how many commands are valid.
 *
 */
var countValidCommand = function countValidCommand(program) {
    var count = 0;
    if (program.args) {
        program.args.forEach(function(current) {
            if (current && current.commands) {
                count += 1;
            }
        });
    }

    return count;
};

/** **/
module.exports.countValidCommand = countValidCommand;
