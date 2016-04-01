var SLUR = (function (TEST) {
    "use strict";

    function SlurException(name, message, environment) {
        this.name = name;
        this.environment = environment;
        this.message = message + this.context();
    }

    SlurException.prototype.toString = function () {
        return this.name + ": " + this.message;
    };

    SlurException.prototype.toLocaleStringString = function () {
        return this.toString();
    };

    SlurException.prototype.context = function () {
        var description = "";
        if (this.environment) {
            var contexts = this.environment.context();
            if (contexts.length > 0) {
                description += " - In functions ";
                for (var c = 0; c < contexts.length; ++c) {
                    if (c > 0) {
                        description += ", ";
                    }
                    description += contexts[c];

                }
            }
        }
        return description;
    };

    function evalException(message, environment) {
        return new SlurException("EvalException", message, environment);
    }

    function compileException(message, environment) {
        return new SlurException("CompileException", message, environment);
    }

    function invocationException(message, func, args, environment) {
        var exception = new SlurException("InvocationException", message, environment);
        exception.func = func;
        exception.args = args;
        return exception;
    }

    function typeIs(type) {
        return function() { return type; };
    }

    function makeIsType(type) {
        return function(object) { return object.type() === type; };
    }

    function selfEval(env) {
        // jshint validthis: true
        return this;
    }

    function selfCompile(env) {
        // jshint validthis: true
        return this;
    }

    function selfName() {
        // jshint validthis: true
        return this.name;
    }

    function makeType(constructor, type) {
        constructor.prototype.type = typeIs(type);
        constructor.prototype.eval = selfEval;
        constructor.prototype.compile = selfCompile;
    }

    // Every object has a type and can be compiled or evaluated.
    // Evaluation calculates the value of the object given the environment.
    // Compilation creates an efficent version of this object based on the environment.

    var ObjectType = {
            INTERNAL: 0, // For stuff used to implement special forms.
            FUNCTION: 1,
            SPECIAL_FORM: 2,
            FIX_NUM: 4,
            REAL: 8,
            STRING: 16,
            SYMBOL: 32,
            CONS: 64,
            NULL: 128,
            BOOLEAN: 256 // Just for TRUE, NULL is false.
        },
        isFunction = makeIsType(ObjectType.FUNCTION),
        isSpecialForm = makeIsType(ObjectType.SPECIAL_FORM),
        isInt = makeIsType(ObjectType.FIX_NUM),
        isReal = makeIsType(ObjectType.REAL),
        isString = makeIsType(ObjectType.STRING),
        isSymbol = makeIsType(ObjectType.SYMBOL),
        isCons = makeIsType(ObjectType.CONS),
        isNull = makeIsType(ObjectType.NULL),

        NULL = (function() {
            function Null() { this.value = false; }
            makeType(Null, ObjectType.NULL);
            Null.prototype.toString = function () { return "()"; };

            return new Null();
        }()),

        TRUE = (function() {
            function True() { this.value = true; }
            makeType(True, ObjectType.BOOLEAN);
            True.prototype.toString = function () { return "#t"; };

            return new True();
        }());

    // Represents the integer primitive.
    function FixNum(value) {
        this.value = value > 0 ? Math.floor(value) : Math.ceil(value);
    }
    makeType(FixNum, ObjectType.FIX_NUM);
    FixNum.prototype.toString = function () { return this.value.toString(); };

    // Represent the floating point primitive.
    function Real(value) {
        this.value = value;
    }
    makeType(Real, ObjectType.REAL);
    Real.prototype.toString = function () { return this.value.toString(); };

    function StringValue(value) {
        this.value = value;
    }
    makeType(StringValue, ObjectType.STRING);
    StringValue.prototype.toString = function () { return '"' + this.value + '"'; };

    function Symbol(name) {
        this.name = name;
    }
    Symbol.prototype.type = typeIs(ObjectType.SYMBOL);
    Symbol.prototype.eval = function (env) { return env.lookup(this); };
    Symbol.prototype.compile = function (env) {
        var found = env.tryLookup(this);
        if (found !== null) {
            return found;
        }
        return this;
    };
    Symbol.prototype.toString = selfName;

    // Define a cons cell.
    function Cons(car, cdr) {
        this.car = car;
        this.cdr = cdr;
    }
    Cons.prototype.type = typeIs(ObjectType.CONS);

    Cons.prototype.eval = function (env) {
        // Since a cons cell can contain a function or special form,
        // this provides us with a place to hook into the abort mechanism.
        // So every time a cons is evaluated, we check if the interpreter
        // has aborted, and throw the abort exception.
        if (env.abort !== null) {
            throw env.abort;
        }

        // Evaluate the cons cell as an application or a special form.
        // It also has support for limited tail call elimination, but
        // it's a little experimental.
        var result = null,
            cons = this,
            isTail = false;
        do {
            isTail = false;
            var carEval = cons.car.eval(env);

            env.setupTail();
            if (isFunction(carEval) || isSpecialForm(carEval)) {
                result = carEval.invoke(env, cons.cdr);
            } else {
                // Since this is neither an application or a special form,
                // it evaluates to itself.
                result = cons;
            }
            env.clearTail();

            if (result === null) {
                var tail = env.getTail();
                cons = tail.Cons();
                env = tail.Environment();
                isTail = true;
            }
        } while (isTail);
        return result;
    };

    function prependList(list_or_single, tail) {
        if (Array.isArray(list_or_single)) {
            var cons = tail;
            for (var i = list_or_single.length - 1; i >=0; --i) {
                cons = new Cons(list_or_single[i], cons);
            }
            return cons;
        } else {
            return new Cons(list_or_single, tail);
        }
    }

    function makeList(list_or_single) {
        if (typeof list_or_single === 'undefined') {
            return NULL;
        }
        else if (Array.isArray(list_or_single)) {
            var cons = NULL;
            for (var i = list_or_single.length - 1; i >=0; --i) {
                cons = new Cons(list_or_single[i], cons);
            }
            return cons;
        } else {
            return new Cons(list_or_single, NULL);
        }
    }

    function compileList(env, args) {
        if (isNull(args)) {
            return args;
        } else if(isCons(args)) {
            return prependList(args.car.compile(env), compileList(env, args.cdr));
        }
        throw compileException("Malformed list", env);
    }

    Cons.prototype.compile = function (env) {
        var carCompile = this.car.compile(env);
        if (isFunction(carCompile)) {
            return new Cons(carCompile, compileList(env, this.cdr));
        } else if(isSpecialForm(carCompile)) {
            return carCompile.compileSpecial(env, this.cdr);
        } else {
            return new Cons(carCompile, this.cdr.compile(env));
        }
    };

    Cons.prototype.innerString = function () {
        var inner = this.car.toString();
        if (isCons(this.cdr)) {
            inner += " " + this.cdr.innerString();
        } else if (!isNull(this.cdr)) {
            inner += " . " + this.cdr.toString();
        }
        return inner;
    };
    Cons.prototype.toString = function() {
        return "(" + this.innerString() + ")";
    };

    function Func(name, parameters, restParameter, body, frame) {
        this.name = name;
        this.parameters = parameters;
        this.restParameter = restParameter;
        this.body = body;
        this.frame = frame ? frame : null; // For closures.

        if (!this.parameters || !this.body) {
            throw "Malformed function definition";
        }
    }
    makeType(Func, ObjectType.FUNCTION);
    Func.prototype.toString = selfName;

    Func.prototype.shadowArgs = function (env) {
        if (this.parameters.length === 0 && this.restParameter === null) {
            return env;
        }
        var frame = new Frame(env, this.name);
        for (var p = 0; p < this.parameters.length; ++p) {
            frame.shadow(this.parameters[p]);
        }
        if (this.restParameter !== null) {
            frame.shadow(this.restParameter);
        }
        return frame;
    };

    Func.prototype.compileBody = function(env) {
        this.body = this.body.compile(this.shadowArgs(env));
    };

    Func.prototype.invoke = function(env, args) {
        var frame = this.bindArgs(env, args);
        frame.useTails = env.useTails;
        return this.body.eval(frame);
    };

    Func.prototype.bindArgs = function (env, args) {
        var frame = new Frame(this.frame ? frame : env, this.name),
            argsTail = args;
        for (var p = 0; p < this.parameters.length; ++p) {
            if (isNull(argsTail)) {
                throw invocationException("Insufficient arguments", this, args, env);
            }
            if (!isCons(argsTail)) {
                throw invocationException("Malformed expression", this, args, env);
            }
            frame.bind(this.parameters[p], argsTail.car.eval(env));
            argsTail = argsTail.cdr;
        }
        if (this.restParameter !== null) {
            frame.bind(this.restParameter, this.evalList(env, argsTail));
        } else if(!isNull(argsTail)) {
            throw invocationException("Too many arguments", this, args, env);
        }
        return frame;
    };

    Func.prototype.evalList = function (env, object) {
        if (isNull(object)) {
            return object;
        } else if(!isCons(object)) {
            throw invocationException("Malformed expression", this, object, env);
        } else {
            return new Cons(object.car.eval(env), this.evalList(env, object.cdr));
        }
    };

    function Statements(body) {
        this.body = body;
    }

    Statements.prototype.compile = function(env) {
        this.body = this.compileStatements(this.body, env);
        return this;
    };

    Statements.prototype.compileStatements = function (statements, env) {
        var cdr = statements.cdr;
        if (isCons(cdr)) {
            cdr = this.compileStatements(cdr, env);
        } else if(!isNull(cdr)) {
            throw compileException("Malformed statements", env);
        }
        return new Cons(statements.car.compile(env), cdr);
    };

    Statements.prototype.eval = function (env) {
        var result = null,
            body = this.body,
            tail = env.getTail();
        while (isCons(body)) {
            if (tail !== null && isNull(body.cdr) && isCons(body.car)) {
                tail.set(body.car, env);
            }
            result = body.car.eval(env);
            body = body.cdr;
        }

        if (!isNull(body) || result === null) {
            throw evalException("Malformed statements", env);
        }

        return result;
    };

    Statements.prototype.toString = function () {
        return this.body.toString();
    };

    function SpecialForm(name, invoke, compile) {
        this.name = name;
        this.run = invoke;
        this.build = compile;
    }
    makeType(SpecialForm, ObjectType.SPECIAL_FORM);
    SpecialForm.prototype.toString = selfName;

    SpecialForm.prototype.compileSpecial = function(env, args) {
        if (this.build) {
            return this.build(env, args);
        } else {
            return prependList(this, compileList(env, args));
        }
    };

    SpecialForm.prototype.invoke = function(env, args) {
        return this.run(env, args);
    };

    // Attempt to implement tail call elimination in limited cases.
    function Tail() {
        this.set(null, null);
    }

    Tail.prototype.set = function(cons, env) {
        this.cons = cons;
        this.env = env;
    };

    var SHADOW = {};

    function Frame(env, context) {
        this.contextName = context ? context : null;
        this.symbols = {};
        this.env = env ? env : null;
        this.abort = null;
        this.useTails = env ? env.useTails : false;
        this.tail = null;
    }

    Frame.prototype.enableTails = function () {
        var frame = new Frame(this, "TailFrame");
        frame.useTails = true;
        return frame;
    };

    Frame.prototype.nameLookup = function (name) {
        var result = this.tryLookupName(name);
        if (result === null) {
            throw evalException("Symbol not found: " + name, this);
        }
        return result;
    };

    Frame.prototype.lookup = function (symbol) {
        return this.nameLookup(symbol.name);
    };

    Frame.prototype.tryLookupName = function (name) {
        if (typeof name !== "string") {
            throw evalException("Lookup name is not a string", this);
        }

        var binding = this.symbols[name];
        if (typeof binding !== 'undefined') {
            if (binding == SHADOW) {
                return null;
            }
            return binding;
        }
        if (this.env !== null) {
            return this.env.tryLookupName(name);
        }
        return null;
    };

    Frame.prototype.tryLookup = function (symbol) {
        return this.tryLookupName(symbol.name);
    };

    Frame.prototype.bind = function (name, value) {
        if ((typeof name !== "string") || value === null) {
            throw "Bad binding call";
        }
        this.symbols[name] = value;
        return new Symbol(name);
    };

    Frame.prototype.bindFunction = function (func) {
        if (func === null) {
            throw "Bad binding call";
        }
        return this.bind(func.name, func);
    };

    Frame.prototype.set = function (name, value) {
        if (this.env !== null) {
            return this.env.set(name, value);
        }
        return this.bind(name, value);
    };

    Frame.prototype.shadow = function (name) {
        this.bind(name, SHADOW);
    };

    Frame.prototype.context = function () {
        var c = this.env ? this.env.context() : [];
        if (this.contextName) {
            c.push(this.contextName);
        }
        return c;
    };

    Frame.prototype.getTail = function () {
        return this.tail;
    };

    Frame.prototype.setTail = function (cons, env) {
        if (this.tail === null) {
            throw evalException("Tails not active.", this);
        }
        this.tail.set(cons, env);
    };

    Frame.prototype.setupTail = function () {
        if (this.useTails) {
            this.tail = new Tail();
        }
    };

    Frame.prototype.clearTail = function () {
        this.tail = null;
    };

    function quoteInvoke(env, args) {
        if (!isCons(args)) {
            throw evalException("Cons expected.", env);
        }
        return args.car;
    }

    function quoteCompile(env, args) {
        // jshint validthis: true
        return prependList(this, args);
    }

    function IfExpression(predicate, thenClause, elseClause) {
        if (!predicate || !thenClause || !elseClause) {
            throw "Must provide predicate and both clauses";
        }
        this.predicate = predicate;
        this.thenClause = thenClause;
        this.elseClause = elseClause;
    }

    IfExpression.prototype.type = typeIs(ObjectType.INTERNAL);

    IfExpression.prototype.eval = function (env) {
        var clause = isNull(this.predicate.eval(env)) ? this.elseClause : this.thenClause,
            tail = env.getTail();
        if (tail !== null) {
            if(isCons(clause)) {
                tail.set(clause, env);
                return null;
            }
        }
        return clause.eval(env);
    };

    IfExpression.prototype.compile = selfCompile;

    IfExpression.prototype.toString = function () {
        var result = "(if " + this.predicate.toString() + " " + this.thenClause.toString();
        if (this.elseClause !== null) {
            result += " " + this.elseClause.toString();
        }
        return result + ")";
    };

    IfExpression.prototype.compileClauses = function (env) {
        this.predicate = this.predicate.compile(env);
        this.thenClause = this.thenClause.compile(env);
        this.elseClause = this.elseClause.compile(env);
    };

    function processIf(env, args) {
        if (!isCons(args.cdr)) {
            throw evalException("Malformed if.", env);
        }
        var clauses = args.cdr,
            elseClause = NULL;
        if (isCons(clauses.cdr)) {
            var elseCons = clauses.cdr;
            if (!isNull(elseCons.cdr)) {
                // Shouldn't be anything after an else clause
                throw evalException("Malformed else clause.", env);
            }
            elseClause = elseCons.car;
        }
        return new IfExpression(args.car, clauses.car, elseClause);
    }

    function ifInvoke(env, args) {
        return processIf(env, args).eval(env);
    }

    function ifCompile(env, args) {
        var result = processIf(env, args);
        result.compileClauses(env);
        return result;
    }

    function andInvoke(env, args) {
        while (isCons(args)) {
            var next = args.car.eval(env);
            if (isNull(next)) {
                return NULL;
            }
            if (isNull(args.cdr)) {
                return TRUE;
            }
            args = args.cdr;
        }
        throw evalException("Malformed and", env);
    }

    function orInvoke(env, args) {
        while (isCons(args)) {
            var next = args.car.eval(env);
            if (!isNull(next)) {
                // There are two resonable options here.
                // 1. Return TRUE - or should only be a boolean calculation
                // 2. Return next - or can double as a way to handle potentially nulls.
                // Since Slur has a type system layer, went with option 1, since option 2
                // would require special handling.
                return TRUE;
            }
            if (isNull(args.cdr)) {
                return NULL;
            }
            args = args.cdr;
        }
        throw evalException("Malformed or", env);
    }


    function CondClauses() {
        this.clauses = [];
    }

    CondClauses.prototype.type = typeIs(ObjectType.INTERNAL);

    CondClauses.prototype.eval = function (env) {
        for (var c = 0; c < this.clauses.length; ++c) {
            var clause = this.clauses[c];
            if (!isNull(clause.predicate.eval(env))) {
                var tail = env.getTail();
                if (tail !== null) {
                    if (isCons(clause.result)) {
                        tail.set(clause.result, env);
                        return null;
                    }
                }
                return clause.result.eval(env);
            }
        }
        return NULL;
    };

    CondClauses.prototype.compile = selfCompile;

    CondClauses.prototype.toString = function () {
        var result = "(";
        for (var c = 0; c < this.clauses.length; ++c) {
            var clause = this.clauses[c];
            result += "(" + clause.predicate.toString();
            result += " " + clause.result.toString() + ")";
        }
        return result + ")";
    };

    CondClauses.prototype.compileClauses = function (env) {
        for (var c = 0; c < this.clauses.length; ++c) {
            var clause = this.clauses[c];
            clause.predicate = clause.predicate.compile(env);
            clause.result = clause.result.compile(env);
        }
    };

    function processCond(env, args) {
        var clauses = new CondClauses();
        while (isCons(args)) {
            if (!isCons(args.car)) {
                throw evalException("Malformed clause.", env);
            }
            var clause = args.car;
            if (!isCons(clause.cdr)) {
                throw evalException("Malformed clause.", env);
            }
            var statement = clause.cdr;
            if (!isNull(statement.cdr)) {
                throw evalException("Malformed clause.", env);
            }
            clauses.clauses.push({predicate: clause.car, result: statement.car});
            args = args.cdr;
        }
        if (!isNull(args)) {
            throw evalException("Malformed clauses.", env);
        }
        return clauses;
    }

    function condInvoke(env, args) {
        return processCond(env, args).eval(env);
    }

    function condCompile(env, args) {
        var result = processCond(env, args);
        result.compileClauses(env);
        return result;
    }

    var lambdaID = 10001;

    function CompiledLambda(func) {
        this.name = "lambda#" + lambdaID;
        lambdaID += 1;
        this.func = func;
    }
    CompiledLambda.prototype.type = typeIs(ObjectType.INTERNAL);
    CompiledLambda.prototype.eval = function (env) {
        return new Func(this.name, this.func.parameters, this.func.restParameter, this.func.body, env);
    };
    CompiledLambda.prototype.compile = selfCompile;
    CompiledLambda.prototype.toString = selfName;

    function buildFunction(env, name, parameters, body) {
        var parameterNames = [];
        while (isCons(parameters)) {
            if (isSymbol(parameters.car)) {
                parameterNames.push(parameters.car.name);
            }
            parameters = parameters.cdr;
        }
        var restParameter = null;
        if (isSymbol(parameters)) {
            restParameter = parameters.name;
        } else if (!isNull(parameters)) {
            throw evalException("Malformed function parameters.", env);
        }

        if (!isCons(body)) {
            throw evalException("Malformed function body.", env);
        }
        return new Func(name, parameterNames, restParameter, new Statements(body));
    }

    function lambdaCompile(env, args) {
        if (!isCons(args)) {
            throw evalException("Malformed lambda.", env);
        }
        var func = buildFunction(env, null, args.car, args.cdr);
        func.compileBody(env);
        return new CompiledLambda(func);
    }

    function lambdaInvoke(env, args) {
        return lambdaCompile(env, args).eval(env);
    }

    function LetExpression(sequential) {
        this.sequential = sequential;
        this.bindings = [];
        this.body = null;
    }
    LetExpression.prototype.type = typeIs(ObjectType.INTERNAL);
    LetExpression.compile = selfCompile;
    LetExpression.eval = function(env) {
        var frame = new Frame(env, null);
        for (var b = 0; b < this.bindings.length; ++b) {
            var binding = this.bindings[b];
            frame.bind(binding.target.name, binding.value.eval(this.sequential ? frame : env));
        }
        return this.body.eval(frame);
    };
    LetExpression.toString = function () {
        var result = "(";
        for (var b = 0; b < this.bindings.length; ++b) {
            var binding = this.bindings[b];
            result += "(" + binding.target.toString();
            result += " " + binding.value.toString();
        }
        result += ") " + this.body.toString();
        return result;
    };
    LetExpression.prototype.bind = function(target, value) {
        this.bindings.push({target: target, value: value});
    };

    function processLet(env, args, sequential, compile) {
        var result = new LetExpression(sequential),
            frame = new Frame(env, null);

        if (isCons(args)) {
            throw evalException("Malformed let.", env);
        }
        var lets = args.car;
        while (isCons(lets)) {
            if (!isCons(lets.car)) {
                throw evalException("Malformed let clauses.", env);
            }
            var binding = lets.car;
            if (!isSymbol(binding.car)) {
                throw evalException("Malformed let, Symbol expected.", env);
            }
            if (!isCons(binding.cdr) || !isNull(binding.cdr.cdr)) {
                throw evalException("Malformed let clause.", env);
            }
            var target = binding.car,
                value = binding.cdr.car;
            if (compile) {
                frame.shadow(target.name);
                value = value.compile(sequential ? frame : env);
            }
            result.add(target, value);
            lets = lets.cdr;
        }
        if (!isNull(lets)) {
            throw evalException("Malformed let clause.", env);
        }

        result.body = new Statements(args.cdr);
        if (compile) {
            // Make sure to compile in the frame with variables shadowed.
            result.body.compile(frame);
        }
        return result;
    }

    function letInvoke(sequential) {
        return function (env, args) {
            var result = processLet(env, args, sequential, false);
            return result.eval(env);
        };
    }

    function letCompile(sequential) {
        return function (env, args) {
            return processLet(env, args, sequential, true);
        };
    }

    function LabelsExpression() {
        this.functions = [];
        this.body = null;
    }
    LabelsExpression.prototype.type = typeIs(ObjectType.INTERNAL);
    LabelsExpression.prototype.compile = selfCompile;
    LabelsExpression.prototype.eval = function (env) {
        var frame = new Frame(env);
        for (var f = 0; f < this.functions.length; ++f) {
            frame.bindFunction(this.functions[f]);
        }

        return this.body.eval(frame);
    };
    LabelsExpression.prototype.toString = function () {
        var result = "(";
        for (var f = 0; f < this.functions.length; ++f) {
            if (f > 0) {
                result += " ";
            }
            result += "(" + this.functions[f].toString() + ")";
        }
        result += ") " + this.body.toString();
    };

    function processLabels(env, args, compile) {
        if (!isCons(args)) {
            throw evalException("Malformed labels.", env);
        }

        var result = new LabelsExpression(),
            frame = new Frame(env, null),
            labels = args.car;

        while (isCons(labels)) {
            if (!isCons(labels.car)) {
                throw evalException("Malformed labels clauses.", env);
            }
            var func = labels.car;
            if (!isSymbol(func.car)) {
                throw evalException("Symbol expected.", env);
            }
            if (!isCons(func.cdr)) {
                throw evalException("Malformed labels clause.", env);
            }
            var binding = func.car;
            if (compile) {
                frame.shadow(binding.name);
            }

            var definition = func.cdr,
                parameters = definition.car;
            if (!isCons(parameters)) {
                throw evalException("Parameter list expected.", env);
            }
            if (isNull(definition.cdr)) {
                throw evalException("Function body expected.", env);
            }
            result.functions.push(buildFunction(env, binding.name, parameters, definition.cdr));
            labels = labels.cdr;
        }
        if (!isNull(labels)) {
            throw evalException("Malformed labels clauses.", env);
        }

        result.body = new Statements(args.cdr);
        if (compile) {
            for (var f = 0; f < result.functions.length; ++f) {
                result.functions[f].compileBody(frame);
            }
            result.body.compile(frame);
        }

        return result;
    }

    function labelsInvoke(env, args) {
        var labels = processLabels(env, args, false);
        return labels.eval(env);
    }

    function labelsCompile(env, args) {
        return processLabels(env, args, true);
    }

    function processDefine(spec, body, env) {
        if (!isSymbol(spec.car)) {
            throw evalException("Malformed define", env);
        }
        return buildFunction(env, spec.car.name, spec.cdr, body);
    }

    function defineCheckTarget(env, target) {
        if (!isCons(target)) {
            throw evalException("Malformed define", env);
        }
        if (!isNull(target.cdr)) {
            throw evalException("Malformed define", env);
        }
    }

    function defineInvoke(env, args) {
        if (!isCons(args)) {
            throw evalException("Malformed define", env);
        }
        if (isCons(args.car)) {
            var func = processDefine(args.car, args.cdr, env);
            return env.bindFunction(func);
        } else if (isSymbol(args.car)) {
            defineCheckTarget(env, args.cdr);
            return env.bind(args.car.name, args.cdr.car.eval(env));
        } else {
            throw evalException("Malformed define", env);
        }
    }

    function defineCompile(env, args) {
        // jshint validthis: true
        if (!isCons(args)) {
            throw evalException("Malformed define", env);
        }
        if (isCons(args.car)) {
            var func = processDefine(args.car, args.cdr, env),
                frame = new Frame(env, func.name + " - compiled");
            frame.bindFunction(func);
            func.compileBody(frame);
            return makeList([this, new Symbol(func.name), func]);
        } else if (isSymbol(args.car)) {
            defineCheckTarget(args.cdr);
            return makeList([this, args.car, args.cdr.car.compile(env)]);
        } else {
            throw evalException("Malformed define", env);
        }
    }

    function installSpecial(env) {
        function bind(name, invoke, compile) {
            env.bind(name, new SpecialForm(name, invoke, compile));
        }

        bind("quote", quoteInvoke, quoteCompile);
        bind("if", ifInvoke, ifCompile);
        bind("and", andInvoke);
        bind("or", orInvoke);
        bind("cond", condInvoke, condCompile);
        bind("lambda", lambdaInvoke, lambdaCompile);
        bind("let", letInvoke(false), letCompile(false));
        bind("let*", letInvoke(true), letCompile(true));
        bind("labels", labelsInvoke, labelsCompile);
        bind("define", defineInvoke, defineCompile);
    }

    function Builtin(name, invoke) {
        this.name = name;
        this.invoke = invoke;
    }
    Builtin.prototype.type = typeIs(ObjectType.INTERNAL);
    Builtin.prototype.compile = selfCompile;
    Builtin.prototype.eval = function (env) {
        return this.invoke(env);
    };
    Builtin.prototype.toString = selfName;

    function define(env, name, parameters, restParameter, invoke) {
        env.bindFunction(new Func(name, parameters, restParameter, new Builtin(name, invoke)));
    }

    function installList(root) {
        define(root, "cons", ["car", "cdr"], null, function (env) {
            return new Cons(env.nameLookup("car"), env.nameLookup("cdr"));
        });

        define(root, "car", ["cons"], null, function (env) {
            var cons = env.nameLookup("cons");
            if (isCons(cons)) {
                return cons.car;
            }
            throw evalException("Cons expected.", env);
        });

        define(root, "cdr", ["cons"], null, function (env) {
            var cons = env.nameLookup("cons");
            if (isCons(cons)) {
                return cons.cdr;
            }
            throw evalException("Cons expected.", env);
        });

        define(root, "isList?", ["l"], null, function (env) {
            var list = env.nameLookup("l");
            if (isNull(list)) {
                return TRUE;
            }
            if (isCons(list)) {
                while (isCons(list.cdr)) {
                    list = list.cdr;
                }
                if (isNull(list.cdr)) {
                    return TRUE;
                }
            }
            return NULL;
        });

        define(root, "list", [], "rest", function (env) { return env.nameLookup("rest"); });
    }

    function installType(root) {
        function addTypeCheck(name, type) {
            define(root, name, ["entity"], null, function(env) {
                return env.nameLookup("entity").type() === type ? TRUE : NULL;
            });
        }
        addTypeCheck("isCons?",   ObjectType.CONS);
        addTypeCheck("isSym?",    ObjectType.SYMBOL);
        addTypeCheck("isString?", ObjectType.STRING);
        addTypeCheck("isFn?",     ObjectType.FUNCTION);
        addTypeCheck("isMacro?",  ObjectType.SPECIAL_FORM);
        addTypeCheck("isNull?",   ObjectType.NULL);
        addTypeCheck("isFixNum?", ObjectType.FIX_NUM);
        addTypeCheck("isReal?",   ObjectType.REAL);
        addTypeCheck("isCons?",   ObjectType.CONS);
        addTypeCheck("isCons?",   ObjectType.CONS);
    }

    function installNumeric(root) {
        root.bind("PI", new Real(Math.PI));
        root.bind("E", new Real(Math.E));

        var INT = ObjectType.FIX_NUM,
            REAL = ObjectType.REAL,
            BOOL = ObjectType.BOOLEAN;

        function unary(name, type, operator) {
            var args = ["a"];
            define(root, name, args, null, function(env) {
                var a = env.nameLookup(args[0]),
                    aType = a.type(),
                    result = operator(aType == INT || aType == REAL ? a.value : a);
                if (type === BOOL) {
                    return result ? TRUE : NULL;
                } else if (type === INT || (type === null && a.type() === INT)) {
                    return new FixNum(result);
                } else {
                    return new Real(result);
                }
            });
        }

        unary("not",  BOOL, function (a) { return !isNull(a); });
        unary("abs",  null, function (a) { return Math.abs(a); });
        unary("sin",  REAL, function (a) { return Math.sin(a); });
        unary("cos",  REAL, function (a) { return Math.cos(a); });
        unary("tan",  REAL, function (a) { return Math.tan(a); });
        unary("asin", REAL, function (a) { return Math.asin(a); });
        unary("acos", REAL, function (a) { return Math.acos(a); });
        unary("atan", REAL, function (a) { return Math.atan(a); });
        unary("ceil",  INT, function (a) { return Math.ceil(a); });
        unary("floor", INT, function (a) { return Math.floor(a); });
        unary("trunc", INT, function (a) { return a > 0 ? Math.floor(a) : Math.ceil(a); });
        unary("round", INT, function (a) { return Math.round(a); });

        function binary(name, type, operator) {
            var args = ["a", "b"];
            define(root, name, args, null, function(env) {
                var a = env.nameLookup(args[0]),
                    b = env.nameLookup(args[1]),
                    result = operator(a.value, b.value);
                if (type === BOOL) {
                    return result ? TRUE : NULL;
                } else if (type === INT || (type === null && a.type() === INT && b.type() === INT)) {
                    return new FixNum(result);
                } else {
                    return new Real(result);
                }
            });
        }

        binary("!=", BOOL, function (a, b) { return a !==b; });
        binary("=",  BOOL, function (a, b) { return a ===b; });
        binary(">",  BOOL, function (a, b) { return a >  b; });
        binary(">=", BOOL, function (a, b) { return a >= b; });
        binary("<",  BOOL, function (a, b) { return a <  b; });
        binary("<=", BOOL, function (a, b) { return a <= b; });
        binary("+",  null, function (a, b) { return a +  b; });
        binary("-",  null, function (a, b) { return a -  b; });
        binary("*",  null, function (a, b) { return a *  b; });
        binary("/",  null, function (a, b) { return a /  b; });
        binary("min",null, function (a, b) { return Math.min(a, b); });
        binary("max",null, function (a, b) { return Math.min(a, b); });
        binary("pow",null, function (a, b) { return Math.pow(a, b); });
        binary("atan2",REAL, function (a, b) { return Math.atan2(b, a); });
    }


    function parseException(message) {
        return new SlurException("ParseException", message);
    }

    function Parser(code) {
        this.offset = 0;
        this.inEscape = false;
        this.code = code;
        this.truth = TRUE.toString();
    }

    Parser.prototype.advance = function (distance) {
        this.offset += distance;
    };

    Parser.prototype.next = function () {
        return this.code[this.offset];
    };

    Parser.prototype.codeFrom = function (start) {
        return this.code.substring(start, this.offset);
    };

    Parser.prototype.atEnd = function() {
        return this.offset >= this.code.length;
    };

    Parser.prototype.isDigit = function(code) {
        return "0".charCodeAt(0) <= code && code <= "9".charCodeAt(0);
    };

    Parser.prototype.atDigit = function () { return this.isDigit(this.next().charCodeAt(0)); };
    Parser.prototype.isDot = function(c) { return c === "."; };
    Parser.prototype.atDot = function () { return this.isDot(this.next()); };
    Parser.prototype.atMinus = function () { return this.next() === "-"; };
    Parser.prototype.atQuote = function () { return this.next() === "'"; };
    Parser.prototype.atDoubleQuote = function () { return this.next() === '"'; };
    Parser.prototype.atOpen  = function () { return this.next() === "("; };
    Parser.prototype.atClose = function () { return this.next() === ")"; };
    Parser.prototype.atComment = function () { return this.next() === ";"; };
    Parser.prototype.isLineBreak = function (c) { return c === "\n" || c === "\r"; };
    Parser.prototype.atLineBreak = function () { return this.isLineBreak(this.next()); };
    Parser.prototype.isWhitespace = function (c) { return c === " " || c === "\t" || this.isLineBreak(c); };
    Parser.prototype.atWhitespace = function () { return this.isWhitespace(this.next()); };

    Parser.prototype.atTerminator = function () {
        return this.atEnd() || this.atWhitespace() || this.atOpen() || this.atClose();
    };

    Parser.prototype.isAlphaNum = function(code) {
        return ("a".charCodeAt(0) <= code && code <= "z".charCodeAt(0)) ||
               ("A".charCodeAt(0) <= code && code <= "Z".charCodeAt(0)) ||
               this.isDigit(code);
    };

    Parser.prototype.isSymbolChar = function(c) {
        var code = c.charCodeAt(0);
        if(this.isAlphaNum(code)) {
            return true;
        }
        var valid = "_+-/*<>|&^%$@=?";
        for (var i = 0; i < valid.length; ++i) {
            if (code === valid.charCodeAt(i)) {
                return true;
            }
        }
        return false;
    };

    Parser.prototype.skipCommentsAndWhitespace = function () {
        while (!this.atEnd() && (this.atComment() || this.atWhitespace())) {
            if (this.atComment()) {
                while (!this.atEnd() && !this.atLineBreak()) {
                    this.advance(1);
                }
            } else {
                this.advance(1);
            }
        }
    };

    Parser.prototype.parseCons = function (atStart, justCdr) {
        if (atStart) { // Skip open parenthesis
            this.advance(1);
        }
        this.skipCommentsAndWhitespace();

        if (this.atEnd()) {
            throw parseException("Missing ')'");
        }
        if (this.atClose()) {
            if (justCdr) {
                throw parseException("Cannot follow '.' with ')'");
            }
            this.advance(1);
            return NULL;
        }
        if (this.atDot()) {
            if (this.atEnd()) {
                throw parseException("Missing ')'");
            }
            var peek = this.offset + 1;
            if (peek < this.code.length && this.isWhitespace(this.code[peek])) {
                this.advance(1);
                if (atStart) {
                    return new Cons(NULL, this.parseCons(false, true));
                }
                if (justCdr) {
                    throw parseException("Multiple '.' in list");
                }
                return this.parseCons(false, true);
            }
            // probably a floating point number,
            // will get handled by recursive parse below.
        } else if (justCdr) {
            var cdr = this.parse();
            this.skipCommentsAndWhitespace();
            if (!this.atClose()) {
                throw parseException("List with '.' had multiple cdr items.");
            }
            this.advance(1);
            return cdr;
        }
        var car = this.parse();
        return new Cons(car, this.parseCons(false, false));
    };

    Parser.prototype.atStringEnd = function () {
        if (this.inEscape) {
            this.inEscape = false;
            return false;
        }
        if (this.next() === "\\") {
            this.inEscape = true;
            return false;
        }
        return this.atDoubleQuote();
    };

    Parser.prototype.parseString = function () {
        this.inEscape = false;
        this.advance(1); // Skip opening quote.
        var result = "";
        while (!this.atEnd() && !this.atStringEnd()) {
            if (!this.inEscape) {
                result += this.next();
            }
            this.advance(1);
        }
        if (this.atEnd()) {
            throw parseException("Could not find end of string.");
        }
        this.advance(1); // Skip closing quote.
        return new StringValue(result);
    };

    Parser.prototype.atNumber = function () {
        if (this.atMinus()) {
            var peek = this.offset + 1;
            if (peek < this.code.length) {
                return this.isDigit(this.code[peek].charCodeAt(0)) || this.isDot(this.code[peek]);
            }
            return false;
        }
        return this.atDot() || this.atDigit();
    };

    Parser.prototype.consumeDigits = function () {
        while (!this.atEnd() && this.atDigit()) {
            this.advance(1);
        }
        return this.offset;
    };

    Parser.prototype.parseNumber = function () {
        var start = this.offset;

        if (this.atMinus()) {
            this.advance(1);
        }

        var wholeStart = this.offset,
            wholeEnd = this.consumeDigits(),
            isReal = false;
        if (!this.atEnd()) {
            isReal = this.atDot();
            if (isReal) {
                this.advance(1);
                var decimalStart = this.offset,
                    decimalEnd = this.consumeDigits();
                if (wholeStart === wholeEnd && decimalStart === decimalEnd) {
                    throw parseException("Number expected, not found:" + this.codeFrom(start));
                }
            }
            if (this.next() === "e") {
                isReal = true;
                this.advance(1);
                if (this.atMinus()) {
                    this.advance(1);
                }
                var exponentStart = this.offset,
                    exponentEnd = this.consumeDigits();
                if (exponentStart === this.offset) {
                    throw parseException("Number expected, not found:" + this.codeFrom(start));
                }
            }
        }
        var value = this.codeFrom(start);
        if (isReal) {
            return new Real(parseFloat(value));
        }
        if (wholeStart === wholeEnd) {
            throw parseException("Number expected, not found:" + value);
        }
        return new FixNum(parseInt(value));
    };

    Parser.prototype.parseSymbol = function () {
        var start = this.offset;
        while (!this.atEnd() && this.isSymbolChar(this.next())) {
            this.advance(1);
        }
        if (!this.atTerminator()) {
            throw parseException("Unexpected end of symbol.");
        }
        if (start === this.offset) {
            return null;
        }
        return new Symbol(this.codeFrom(start));
    };

    Parser.prototype.parse = function () {
        this.skipCommentsAndWhitespace();
        if (this.atEnd()) {
            return null;
        }
        if (this.atOpen()) {
            return this.parseCons(true, false);
        }
        if (this.atDoubleQuote()) {
            return this.parseString();
        }
        if (this.atNumber()) {
            var number = this.parseNumber();
            if (!this.atTerminator()){
                throw parseException("Unexpected character after number");
            }
            return number;
        }
        if (this.code.substring(this.offset, this.offset + this.truth.length) === this.truth) {
            this.advance(this.truth.length);
            return TRUE;
        }
        if (this.atQuote()) {
            this.offset += 1;
            return makeList([new Symbol("quote"), this.parse()]);
        }
        var symbol = this.parseSymbol();
        if (symbol === null) {
            throw parseException("Invalid expression.");
        }
        return symbol;
    };

    function parse(code) {
        var parser = new Parser(code),
            result = parser.parse();
        return result;
    }

    function baseEnvironment() {
        var env = new Frame();

        installSpecial(env);
        installList(env);
        installNumeric(env);
        installType(env);

        return env;
    }

    function SlurFile(resource) {
        this.resource = resource;
        this.loaded = false;
        this.code = null;

        this.load();
    }

    SlurFile.prototype.load = function() {
        var self = this,
            path = "src/slur/" + this.resource,
            request = new XMLHttpRequest();

        request.open("GET", path, true);
        request.responseType = "text";
        request.onload = function () {
            self.code = request.response;
            self.loaded = true;
        };
        request.send();
    };

    SlurFile.prototype.execute = function(env) {
        if (this.code.length > 0) {
            try {
                var parser = new Parser(this.code);
                for(;;) {
                    var result = parser.parse();
                    if (result === null) {
                        return;
                    }
                    result = result.compile(env);
                    result.eval(env);
                }
            } catch (error) {
                console.log(error.toString());
            }
        }
    };

    var libraries = [
        new SlurFile("consCombos.slur"),
        new SlurFile("list.slur"),
        new SlurFile("map.slur"),
        new SlurFile("reduce.slur"),
        new SlurFile("reverse.slur")
    ];

    function defaultEnvironment() {
        for (var i = 0; i < libraries.length; ++i) {
            if (!libraries[i].loaded) {
                return null;
            }
        }

        var env = baseEnvironment();
        for (i = 0; i < libraries.length; ++i) {
            libraries[i].execute(env);
        }
        return env;
    }

    function testSuite() {
        var parseTests = [
        	function testEmpty() {
                TEST.isNull(parse(""));
            },
            function testFixNum() {
                var number = parse("1");
                TEST.isTrue(isInt(number));
                TEST.equals(number.value, 1);

                number = parse("10");
                TEST.isTrue(isInt(number));
                TEST.equals(number.value, 10);

                number = parse("-1");
                TEST.isTrue(isInt(number));
                TEST.equals(number.value, -1);

                number = parse("9");
                TEST.isTrue(isInt(number));
                TEST.equals(number.value, 9);

                number = parse("0");
                TEST.isTrue(isInt(number));
                TEST.equals(number.value, 0);

                number = parse("-2345");
                TEST.isTrue(isInt(number));
                TEST.equals(number.value, -2345);
            },
            function testReal() {
                var number = parse(".1");
                TEST.isTrue(isReal(number));
                TEST.equals(number.value, 0.1);

                number = parse("-.1");
                TEST.isTrue(isReal(number));
                TEST.equals(number.value, -0.1);

                number = parse("1e5");
                TEST.isTrue(isReal(number));
                TEST.equals(number.value, 1e5);

                number = parse("1.");
                TEST.isTrue(isReal(number));
                TEST.equals(number.value, 1.0);

                number = parse("1.6");
                TEST.isTrue(isReal(number));
                TEST.equals(number.value, 1.6);

                number = parse("1.7e2");
                TEST.isTrue(isReal(number));
                TEST.equals(number.value, 1.7e2);

                number = parse("-1e4");
                TEST.isTrue(isReal(number));
                TEST.equals(number.value, -1e4);

                number = parse("-1.8e5");
                TEST.isTrue(isReal(number));
                TEST.equals(number.value, -1.8e5);
            },
            function testString() {
                var string = parse("\"Hello\"");
                TEST.isTrue(isString(string));
                TEST.equals(string.value, "Hello");

                string = parse("\"\"");
                TEST.isTrue(isString(string));
                TEST.equals(string.value, "");

                string = parse("\"\\\"\"");
                TEST.isTrue(isString(string));
                TEST.equals(string.value, "\"");
            },
            function testSymbol() {
                var symbol = parse("symbol");
                TEST.isTrue(isSymbol(symbol));
                TEST.equals(symbol.name, "symbol");
            },
            function testTrue() {
                var truth = parse("#t");
                TEST.same(truth, TRUE);
            },
            function testCons() {
                var cons = parse("()");
                TEST.isTrue(isNull(cons));

                cons = parse("(1)");
                TEST.isTrue(isCons(cons));
                TEST.isTrue(isInt(cons.car));
                TEST.isTrue(isNull(cons.cdr));

                cons = parse("(1 2)");
                TEST.isTrue(isCons(cons));
                TEST.isTrue(isInt(cons.car));
                TEST.isTrue(isCons(cons.cdr));
                TEST.isTrue(isNull(cons.cdr.cdr));

                cons = parse("(1 . 2)");
                TEST.isTrue(isCons(cons));
                TEST.isFalse(isCons(cons.car));
                TEST.isFalse(isCons(cons.cdr));
            },
            function testBadCons() {
                try {
                    parse(")");
                    TEST.fail("Exception expected");
                } catch(e) {
                }
            },
            function testNestedCons() {
                var cons = parse("((1) (2))");
                TEST.isTrue(isCons(cons));
                TEST.isTrue(isCons(cons.car));
                TEST.isTrue(isCons(cons.cdr));
                TEST.isTrue(isInt(cons.car.car));
                TEST.isTrue(isNull(cons.car.cdr));
                cons = cons.cdr;
                TEST.isTrue(isCons(cons.car));
                TEST.isTrue(isInt(cons.car.car));
                TEST.isTrue(isNull(cons.car.cdr));
                TEST.isTrue(isNull(cons.cdr));
            },
            function testDeepCons() {
                var obj = parse("((((5 4) (1 2 3 4) ((-1) . 2)) \"Hello\" (goodbye)))");
                TEST.equals(obj.toString(), "((((5 4) (1 2 3 4) ((-1) . 2)) \"Hello\" (goodbye)))");

                obj = parse("(define (map fn list) (if (isNull? list) () (cons (fn (car list)) (map fn (cdr list)))))");
                TEST.equals(obj.toString(), "(define (map fn list) (if (isNull? list) () (cons (fn (car list)) (map fn (cdr list)))))");
            },
            function testParseNestedConsDot() {
                var obj = parse("((lambda (a . b) b) 1 2 3)");
                TEST.equals(obj.toString(), "((lambda (a . b) b) 1 2 3)");
            },
            function testParseSkipComments() {
                var obj = parse(";Nothing to see here\n(foo)");
                TEST.equals(obj.toString(), "(foo)");
                obj = parse("(foo);Nothing to see here");
                TEST.equals(obj.toString(), "(foo)");
                obj = parse("(foo ;Nothing to see here \n)");
                TEST.equals(obj.toString(), "(foo)");
                obj = parse("(;Nothing to see here \n foo)");
                TEST.equals(obj.toString(), "(foo)");
                obj = parse("(foo . ;Nothing to see here \r bar)");
                TEST.equals(obj.toString(), "(foo . bar)");
            },
            function testParseMultiple() {
                var parser = new Parser("(+ 1 2) (- 3 4)");
                TEST.equals(parser.parse().toString(), "(+ 1 2)");
                TEST.equals(parser.parse().toString(), "(- 3 4)");
                TEST.isNull(parser.parse());
            }
        ];

        var evalTests = [
            function testFixNum() {
                var env = new Frame(),
                    num = new FixNum(1),
                    result = num.eval(env);
                TEST.same(num, result);
                TEST.equals(result.value, 1);
            },
            function testReal() {
                var env = new Frame(),
                    num = new Real(1.0),
                    result = num.eval(env);
                TEST.same(num, result);
                TEST.equals(result.value, 1.0);
            },
            function testString() {
                var env = new Frame(),
                    string = new StringValue("a");
                TEST.same(string, string.eval(env));
            },
            function testSymbol() {
                var env = new Frame(),
                    num = new FixNum(1),
                    symbol = new Symbol("a");
                env.bind("a", num);
                TEST.same(num, symbol.eval(env));
            },
            function testNull() {
                var env = new Frame();
                TEST.same(NULL.eval(env), NULL);
            },
            function testTrue() {
                var env = new Frame();
                TEST.same(TRUE.eval(env), TRUE);
            },
            function testSpecial() {
                var env = new Frame(),
                    obj = new SpecialForm(ifInvoke, ifCompile),
                    result = obj.eval(env);
                TEST.same(obj, result);
            },
            function testRecurse() {
                var env = baseEnvironment();
                parse("(define (square x) (* x x))").eval(env);
                parse("(define (map fn list) (if (isNull? list) () (cons (fn (car list)) (map fn (cdr list)))))").eval(env);
                TEST.equals(parse("(map square '(1 2 3))").eval(env).toString(), "(1 4 9)");
            },
            function testReverse() {
                var env = baseEnvironment();
                parse("(define (reverse list) (labels ((revAcc (list acc) (if (isNull? list) acc (revAcc (cdr list) (cons (car list) acc))))) (revAcc list ())))").eval(env);
                TEST.equals(parse("(reverse '(1 2 3))").eval(env).toString(), "(3 2 1)");
            },
            function testRemove() {
                var env = baseEnvironment();
                parse("(define (remove l pred) (cond ((isNull? l) l) ((pred (car l)) (remove (cdr l) pred)) (#t (cons (car l) (remove (cdr l) pred)))))").eval(env);
                TEST.equals(parse("(remove (list 1 2 3 4) (lambda (x) (= x 2)))").eval(env).toString(), "(1 3 4)");
            },
            function testLambda() {
                var env = baseEnvironment();
                parse("(define (bar x) (lambda (y) (+ x y)))").eval(env);
                TEST.equals(parse("((bar 6) 5)").eval(env).toString(), "11");
            }
        ];

        TEST.run("Parse", parseTests);
        TEST.run("Eval", evalTests);
    }

    testSuite();

    return {
        evalException: evalException,
        ObjectType: ObjectType,
        makeType: makeType,
        isFunction: isFunction,
        isSpecialForm: isSpecialForm,
        isInt: isInt,
        isReal: isReal,
        isString: isString,
        isSymbol: isSymbol,
        isCons: isCons,
        isNull: isNull,
        NULL: NULL,
        TRUE: TRUE,
        Cons: Cons,
        FixNum: FixNum,
        Real: Real,
        Func: Func,
        StringValue: StringValue,
        Symbol: Symbol,
        IfExpression: IfExpression,
        makeList: makeList,
        define: define,
        Parser: Parser,
        baseEnvironment: baseEnvironment,
        defaultEnvironment: defaultEnvironment
    };
}(TEST));
