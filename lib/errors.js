'use strict';

// Juttle exception classes and related helper functions.

var messages = require('./messages');

// Base class of all Juttle exceptions. Idally, all exceptions thrown by the
// Juttle compiler and runtime would be subclasses of this class, and all other
// exceptions would indicate bugs. But we aren't there yet.
//
// Don't throw this exception directly, use its subclasses and related helpers
// instead.
class JuttleError extends Error {
    constructor(message, code, info) {
        super(message);
        this.name = 'JuttleError';
        this.code = code;
        this.info = info;

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }

    toJSON() {
        return { message: this.message, code: this.code, info: this.info };
    }
}

// Exception thrown when Juttle program parsing fails.
//
// Don't throw this exception directly, use the syntaxError helper instead.
class SyntaxError_ extends JuttleError {
    constructor(message, code, info) {
        super(message, code, info);
        this.name = 'SyntaxError';
    }
}

// Exception thrown when Juttle program compilation fails. Compilation includes
// everything that happens before points start flowing through the graph (e.g.
// proc initialization).
//
// Don't throw this exception directly, use the compileError helper instead.
class CompileError extends JuttleError {
    constructor(message, code, info) {
        super(message, code, info);
        this.name = 'CompileError';
    }
}

// Exception thrown when Juttle program fails at runtime. Runtime is the time
// when points flow through the graph.
//
// Don't throw this exception directly, use the runtimeError helper instead.
class RuntimeError extends JuttleError {
    constructor(message, code, info) {
        super(message, code, info);
        this.name = 'RuntimeError';
    }
}

// Build a SyntaxError with given code and info. Its message will be created
// automatically using the messages file.
//
// Use this helper instead of creating SyntaxError directly.
function syntaxError(code, info) {
    return new SyntaxError_(messageForCode(code, info), code, info || {});
}

// Build a CompileError with given code and info. Its message will be created
// automatically using the messages file.
//
// Use this helper instead of creating CompileError directly.
function compileError(code, info) {
    return new CompileError(messageForCode(code, info), code, info || {});
}

// Build a RuntimeError with given code and info. Its message will be created
// automatically using the messages file.
//
// Use this helper instead of creating RuntimeError directly.
function runtimeError(code, info) {
    return new RuntimeError(messageForCode(code, info), code, info || {});
}

function messageForCode(code, info) {
    return messages[code].replace(/\{([^}]*)\}/g, function(match, key) {
        return info[key];
    });
}

// Adds specified location to any Juttle exception thrown when executing
// specified function. If the function does not throw any exception, returns its
// result.
function locate(fn, location) {
    try {
        return fn();
    } catch (e) {
        if (e instanceof JuttleError && !e.info.location) {
            e.info.location = location;
        }

        throw e;
    }
}

module.exports = {
    JuttleError: JuttleError,
    SyntaxError: SyntaxError_,
    CompileError: CompileError,
    RuntimeError: RuntimeError,
    syntaxError: syntaxError,
    compileError: compileError,
    runtimeError: runtimeError,
    locate: locate
};
