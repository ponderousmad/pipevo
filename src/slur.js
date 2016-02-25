var SLUR = (function () {
    "use strict";
    
    function SlurException(name, message, environment) {
        this.name = name;
        this.environment = environment;
        this.message = message + this.context();
    }
    
    SlurException.prototype.toString = function () {
        return this.name + ": " + this.message;
    };
    
    SlurException.prototype.context = function () {
		var c = this.environment.context();
		var description = "";
		if ( c.length > 0 ) {
			description.append( " - In functions " );
			var first = true;
			for (var s = 0; s < c.length; ++c) {
				if (!first) {
					description += ", ";
				} else {
					first = false;
				}
				description += c[s];

			}
			description += ":\n";
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
        var exception = new SlurException(message, environment);
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
            BOOLEAN: 256
        },
        isFunction = makeIsType(ObjectType.FUNCTION),
        isSpecialForm = makeIsType(ObjectType.SPECIAL_FORM),
        isSymbol = makeIsType(ObjectType.SYMBOL),
        isCons = makeIsType(ObjectType.CONS),
        isNull = makeIsType(ObjectType.NULL),
        
        NULL = (function() {
            function Null() {}
            Null.prototype.type = typeIs(ObjectType.NULL);
            Null.prototype.eval = selfEval;
            Null.prototype.compile = selfCompile;
            Null.prototype.toString = function () { return "()"; }; 
        
            return new Null();
        }()),
    
        TRUE = (function() {
            function True() {}
            True.prototype.type = typeIs(ObjectType.BOOLEAN);
            True.prototype.eval = selfEval;
            True.prototype.compile = selfCompile;
            True.prototype.toString = function () { return "#t"; }; 
        
            return new True();
        }());
    
    // Represents the integer primitive.
    function FixNum(value) {
        this.value = Math.floor(value);
    }
    FixNum.prototype.type = typeIs(ObjectType.FIX_NUM);
    FixNum.prototype.eval = selfEval;
    FixNum.prototype.compile = selfCompile;
    FixNum.prototype.toString = function () { return this.value.toString(); };
    
    // Represent the floating point primitive.
    function Real(value) {
        this.value = value;
    }
    Real.prototype.type = typeIs(ObjectType.REAL);
    Real.prototype.eval = selfEval;
    Real.prototype.compile = selfCompile;
    Real.prototype.toString = function () { return this.value.toString(); };
    
    function String(value) {
        this.value = value;
    }
    String.prototype.type = typeIs(ObjectType.STRING);
    String.prototype.eval = selfEval;
    String.prototype.compile = selfCompile;
    String.prototype.toString = function () { return '"' + this.value + '"'; };

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
		var abort = env.abort();
		if (abort !== null) {
			throw abort;
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
        if (typeof list_or_single == 'undefined') {
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
            return prependList(args.car.complie(env), complieList(env, args.cdr));
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
        this.parameters = argNames;
        this.restParameter = restName;
        this.body = body;
        this.frame = frame ? frame : null; // For closures.
        
        if (!this.parameters || !this.body) {
            throw "Malformed function definition";
        }
    }
    Func.prototype.type = typeIs(ObjectType.FUNCTION);
    Func.prototype.eval = selfEval;
    Func.prototype.compile = selfCompile;
    Func.prototype.toString = selfName;
    
    Func.prototype.shadowArgs = function (env) {
        if (this.parameters.length === 0 && this.restParameter === null) {
            return env;
        }
        var frame = new Frame(env, this.name);
        for (var n = 0; n < this.parameters.length; ++n) {
            frame.shadow(this.parameters[i]);
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
        frame.useTail(env);
        return this.body.invoke(frame);
    };
    
    Func.prototype.bindArgs = function (env, args) {
        var frame = new Frame(this.frame ? frame : env, this.name),
            argsTail = args;
        for (var p = 0; p < this.parameters.length; ++p) {           
            if (isNull(argsTail)) {
                throw invocationException("Insufficient Arguments", this, args, env);
            }
			if (!isCons(argsTail)) {
				throw invocationException("Malformed expression", this, args, env);
			}
            frame.bind(this.parameters[p], argsTail.car.eval(env));
            argsTail = args.cdr;
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
            return new Cons(object.car.eval(env), evalList(env, object.cdr));
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
            throw compileException("Malformed body", env);
        }
        return new Cons(statements.car().compile(env), cdr);
    };
    
    Statements.prototype.invoke = function (env) {
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
    
    function SpecialForm(name, invoke, compile) {
        this.name = name;
        this.run = invoke;
        this.build = compile;
    }
    SpecialForm.prototype.type = typeIs(ObjectType.SPECIAL_FORM);
    SpecialForm.prototype.eval = selfEval;
    SpecialForm.prototype.compile = selfCompile;
    SpecialForm.prototype.toString = selfName;
    
    SpecialForm.prototype.compileSpecial = function(env, args) {
        if (this.build) {
            return this.build(this, env, args);
        } else {
            return prependList(this, compileList(env, arguments));
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
        this.env = env;
        this.abort = null;
        this.useTails = env ? env.useTails : false;
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
        if (typeof found != 'undefined') {
            if (binding == SHADOW) {
                return null;
            }
            return binding;
        }
		if (this.env !== null) {
			return env.tryLookupName( name );
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
		if (func !== null) {
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
		if (this.context !== null) {
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
			throw new EvalException( "Cons expected.", env );
        }
        return args.car;
    }
    
    function quoteCompile(self, env, args) {
        return prependList(self, arguments);
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
        return clause.eval();
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
        return new IfExpression(args.car(), clauses.car(), elseClause);
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
            if (!isNull(clause.predicate.eval(env)) ) {
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
    
    CondClauses.prototype.compileClauses = function () {
        for (var c = 0; c < this.clauses.length; ++c) {
            var clause = this.clauses[c];
            clause.predicate = clause.predicate.compile(env);
            clause.result = clause.result.compile(env);
        }
    };
    
    function processCond(env, args) {
        var clauses = new Clauses();
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
			var param = parameters.car;
			if (isSymbol(param)) {
				parameterNames.push(param.name);
			}
			parameters = parameters.cdr();
		}
		var restParam = null;
		if (isSymbol(parameters)) {
			restParam = parameters.name;
		} else if (!isNull(parameters)) {
			throw evalException("Malformed lambda parameters.", env);
		}

		if (isCons(body)) {
			var funcBody = new Statements(body);
			return new Func( name, parameterNames, restParam, funcBody);
		} else {
			throw evalException("Malformed lambda body.", env);
		}
    }

    function lambdaCompile(env, args) {
        if (!isCons(args)) {
            throw evalExpression("Malformed lambda.", env);
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
    LetExpression.prototype.type = typeIs(ObjecType.INTERNAL);
    LetExpression.compile = selfCompile;
    LetExpression.eval = function(env) {
        var frame = new Frame(env, null);
        for (var b = 0; b < this.bindings.length; ++b) {
            var binding = this.bindings[b];
            frame.bind(binding.target.name, binding.value.eval(this.sequential ? frame : env));
        }
        var result = null,
            body = this.body;
        while (isCons(body)) {
            result = body.car.eval(frame);
            body = body.cdr;
        }
        if (!isNull(body) || result === null ) {
            throw evalException("Malformed let body.", env);
        }
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
		var result = new LetExpression(sequential);
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

		// Build body last - if compiling, need the environment with shadowed variables.
		result.body = compile ? compileList(frame, args.cdr) : args.cdr;
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
        
        var result = null,
            body = this.body;
        while (isCons(body)) {
            result = statements.car.eval(frame);
            body = statements.cdr;
        }
        
        if (!isNull(body) || result === null) {
            throw evalException("Malformed lambda body.", env);
        }
        return result;
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
			if (isCons(parameters.isCons)) {
				throw evalException("Parameter list expected.", env);
			}
			if (isNull(definition.cdr)) {
				throw evalException("Function body expected.", env);
			}
			result.functions.push(Lambda.buildFunction(env, binding.name, parameters, definition.cdr));
			labels = labels.cdr;
		}
		if (!isNull(labels)) {
			throw evalException("Malformed labels clauses.", env);
		}

		if (compile) {
            for (var f = 0; f < result.functions.length; ++f) { 
				result.functions[f].compileBody(frame);
			}
            result.body = compileList(frame, args.cdr);
		} else {
            result.body = args.cdr;
        }
        
		return result;
    }
    
    function labelsInvoke(env, args) {
        var labels = processLabels(env, arguments, false);
		return labels.eval(env);
    }
    
    function labelsCompile(env, args) {
		return processLabels(env, args, true);
    }

/*

public class Define extends SpecialForm {
	public static class DefineException extends EvalException {
		private static final long serialVersionUID = 7047262781903808993L;

		public DefineException( String message, Environment env ) {
			super( message, env );
		}

		public DefineException( Environment env ) {
			super( "Malformed define.", env );
		}
	}

	public Obj compileSpecial(Environment env, Obj arguments) {
		if( !arguments.isCons() ) {
			throw new DefineException( env );
		}
		Cons args = (Cons)arguments;
		if( args.car().isCons() ) {
			Func function = processFunction((Cons)args.car(), args.cdr(), env);
			Frame selfFrame = new Frame(env, function.name() + " - compiling");
			selfFrame.bindFunction(function);
			function.compileBody(selfFrame);
			return Cons.list(this, new Symbol(function.name()), function);
		}
		if( args.car().isSymbol() ) {
			return Cons.list(this, args.cdr(), compileValue(args.cdr(), env));
		}
		throw new DefineException( env );
	}

	public Obj invoke(Environment env, Obj arguments) {
		if( !arguments.isCons() ) {
			throw new DefineException( env );
		}
		Cons args = (Cons)arguments;
		if( args.car().isCons() ) {
			Func func = processFunction( (Cons)args.car(), args.cdr(), env );
			return env.bindFunction( func );
		}
		if( args.car().isSymbol() ) {
			return defineValue( (Symbol)args.car(), args.cdr(), env );
		}
		throw new DefineException( env );
	}

	private Obj defineValue(Symbol symbol, Obj obj, Environment env) {
		if( !obj.isCons() ) {
			throw new DefineException( env );
		}
		Cons rest = (Cons)obj;
		if( !rest.cdr().isNull() ) {
			throw new DefineException( env );
		}
		Obj value = rest.car().eval( env );
		return env.bind( symbol.name(), value );
	}

	private Obj compileValue(Obj obj, Environment env) {
		if( !obj.isCons() ) {
			throw new DefineException( env );
		}
		Cons rest = (Cons)obj;
		if( !rest.cdr().isNull() ) {
			throw new DefineException( env );
		}
		return rest.car().compile( env );
	}

	private Func processFunction(Cons spec, Obj body, Environment env) {
		if( !spec.car().isSymbol() ) {
			throw new DefineException( env );
		}
		Symbol name = (Symbol)spec.car();

		Obj parameters = spec.cdr();
		List<String> paramList = new LinkedList<String>();
		while( parameters.isCons() ) {
			Cons params = (Cons)parameters;
			Obj param = params.car();
			if( param.isSymbol() ) {
				paramList.add( ((Symbol)param).name() );
			}
			parameters = params.cdr();
		}
		String restParam = null;
		if( parameters.isSymbol() ) {
			restParam = ((Symbol)parameters).name();
		} else if( !parameters.isNull() ) {
			throw new DefineException( env );
		}
		if( !body.isCons() ) {
			throw new DefineException( env );
		}
		Statements funcBody = new Statements( (Cons)body );
		return new Func( name.name(), paramList.toArray( new String[ paramList.size() ] ), restParam, funcBody );
	}

	public String toString() { return "define"; }
}

*/

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
		bind("let*", letInvoke(true), letComplie(true));
		bind("labels", labelsInvoke, lablesCompile);
		//bind("define", new Define());
    }

    function Builtin(invoke, name) {
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

	function installList(env) {
		define("cons", ["car", "cdr"], null, function (env) {
            return new Cons(env.lookupName("car"), env.lookupName("cdr"));
        });
        
		define("car", ["cons"], null, function (env) {
            var cons = env.lookupName("cons");
            if (isCons(cons)) {
                return cons.car;
            }
            throw evalException("Cons expected.", env);
        });
        
		define("cdr", ["cons"], null, function (env) {
            var cons = env.lookupName("cons");
            if (isCons(cons)) {
                return cons.cdr;
            }
            throw evalException("Cons expected.", env);
        });
        
		define("isList?", ["l"], null, function (env) {
            var list = env.lookupName("l");
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

		define( "list", [], "rest", function (env) { return env.lookupName( "rest" ); });
	}

	function installType(env) {
        function addTypeCheck(env, name, type) {
            define(env, name, ["entity"], null, function() {
                return env.lookupName("entity").type() === type ? TRUE : NULL;
            });
        }
        addTypeCheck(env, "isCons?",   ObjectType.CONS);
		addTypeCheck(env, "isSym?",    ObjectType.SYMBOL);
        addTypeCheck(env, "isString?", ObjectType.STRING);
        addTypeCheck(env, "isFn?",     ObjectType.FUNCTION);
        addTypeCheck(env, "isMacro?",  ObjectType.SPECIAL_FORM);
        addTypeCheck(env, "isNull?",   ObjectType.NULL);
        addTypeCheck(env, "isFixNum?", ObjectType.FIX_NUM);
        addTypeCheck(env, "isReal?",   ObjectType.REAL);
        addTypeCheck(env, "isCons?",   ObjectType.CONS);
        addTypeCheck(env, "isCons?",   ObjectType.CONS);
    }

/*
public class Numeric {
	static interface Operation {
		public Obj eval( int a, int b );
		public Obj eval( double a, double b );
	}

	static interface UnaryOperation {
		public Obj eval( int a );
		public Obj eval( double a );
	}

	static class Operator implements Func.Body {
		static final String[] sArgs = new String[] { "a", "b" };

		private Operation mOp;

		Operator( Operation op ) {
			mOp = op;
		}

		public Obj invoke( Environment env ) {
			Obj a = env.lookup( sArgs[0] );
			Obj b = env.lookup( sArgs[1] );
			if( a.isFixNum() ) {
				if( b.isFixNum() ) {
					return mOp.eval( ((FixNum)a).value(), ((FixNum)b).value() );
				} else if( b.isReal() ) {
					return mOp.eval( ((FixNum)a).value(), ((Real)b).value() );
				}
			} else if( a.isReal() ) {
				if( b.isFixNum() ) {
					return mOp.eval( ((Real)a).value(), ((FixNum)b).value() );
				} else if( b.isReal() ) {
					return mOp.eval( ((Real)a).value(), ((Real)b).value() );
				}
			}
			throw new EvalException( "Invalid types", env );
		}
	}

	static class UnaryOperator implements Func.Body {
		static final String[] sArgs = new String[] { "a" };

		private UnaryOperation mOp;

		UnaryOperator( UnaryOperation op ) {
			mOp = op;
		}

		public Obj invoke( Environment env ) {
			Obj a = env.lookup( sArgs[0] );
			if( a.isFixNum() ) {
				return mOp.eval(((FixNum)a).value());
			} else if( a.isReal() ) {
				return mOp.eval(((Real)a).value());
			}
			throw new EvalException( "Invalid type", env );
		}
	}

	static void install( Environment env, String name, Operation op ) {
		env.bindFunction( new Func( name, Operator.sArgs, null, new Operator( op ) ) );
	}

	static void install( Environment env, String name, UnaryOperation op ) {
		env.bindFunction( new Func( name, UnaryOperator.sArgs, null, new UnaryOperator( op ) ) );
	}

	private static double asReal(Environment env, String name) {
		return ((Real)env.lookup(name)).value();
	}

	private interface RealFunc
	{
		double calc(double x);
	}

	static void installRealFunc( Environment env, String name, final RealFunc func ) {
		env.bindFunction( new Func( name, new String[]{"x"}, null, new Func.Body() {
			public Obj invoke(Environment env) {
				return new Real(func.calc(asReal(env,"x")));
			}
		}));
	}

	private interface RealFunc2
	{
		double calc(double x, double y);
	}

	static void installRealFunc2( Environment env, String name, final RealFunc2 func ) {
		env.bindFunction( new Func( name, new String[]{"x", "y"}, null, new Func.Body() {
			public Obj invoke(Environment env) {
				return new Real(func.calc(asReal(env,"x"), asReal(env,"y")));
			}
		}));
	}

	private static int asInt(Environment env, String name) {
		return ((FixNum)env.lookup(name)).value();
	}

	private interface FixNumFunc
	{
		int calc(int x);
	}

	static void installFixNumFunc( Environment env, String name, final FixNumFunc func ) {
		env.bindFunction( new Func( name, new String[]{"x"}, null, new Func.Body() {
			public Obj invoke(Environment env) {
				return new FixNum(func.calc(asInt(env,"x")));
			}
		}));
	}

	private interface FixNumFunc2
	{
		int calc(int x, int y);
	}

	static void installFixNumFunc2( Environment env, String name, final FixNumFunc2 func ) {
		env.bindFunction( new Func( name, new String[]{"x", "y"}, null, new Func.Body() {
			public Obj invoke(Environment env) {
				return new FixNum(func.calc(asInt(env,"x"),asInt(env,"y")));
			}
		}));
	}

	public static void install( Environment env ) {
		final Obj T= True.TRUE;
		final Obj F= Null.NULL;

		env.bindFunction( new Func( "not", new String[] { "x" }, null, new Func.Body(){
			public Obj invoke(Environment env) {
				Obj x = env.lookup( "x" );
				return x.isNull() ? T : F;
			}
		}));

		install( env, "!=", new Operation() {
			public Obj eval( int a, int b ) { return a != b ? T : F; }
			public Obj eval( double a, double b ) { return a != b ? T : F; }
		});

		install( env, "=", new Operation() {
			public Obj eval( int a, int b ) { return a == b ? T : F; }
			public Obj eval( double a, double b ) { return a == b ? T : F; }
		});

		install( env, "+", new Operation() {
			public Obj eval( int a, int b ) { return new FixNum( a + b ); }
			public Obj eval( double a, double b ) { return new Real( a + b ); }
		});

		install( env, "-", new Operation() {
			public Obj eval( int a, int b ) { return new FixNum( a - b ); }
			public Obj eval( double a, double b ) { return new Real( a - b ); }
		});

		install( env, "*", new Operation() {
			public Obj eval( int a, int b ) { return new FixNum( a * b ); }
			public Obj eval( double a, double b ) { return new Real( a * b ); }
		});

		install( env, "/", new Operation() {
			public Obj eval( int a, int b ) { return new FixNum( a / b ); }
			public Obj eval( double a, double b ) { return new Real( a / b ); }
		});

		install( env, ">", new Operation() {
			public Obj eval( int a, int b ) { return ( a > b ) ? T : F; }
			public Obj eval( double a, double b ) { return ( a > b ) ? T : F; }
		});

		install( env, ">=", new Operation() {
			public Obj eval( int a, int b ) { return ( a >= b ) ? T : F; }
			public Obj eval( double a, double b ) { return ( a >= b ) ? T : F; }
		});

		install( env, "<", new Operation() {
			public Obj eval( int a, int b ) { return ( a < b ) ? T : F; }
			public Obj eval( double a, double b ) { return ( a < b ) ? T : F; }
		});

		install( env, "<=", new Operation() {
			public Obj eval( int a, int b ) { return ( a <= b ) ? T : F; }
			public Obj eval( double a, double b ) { return ( a <= b ) ? T : F; }
		});

		install( env, "min", new Operation() {
			public Obj eval( int a, int b ) { return new FixNum(Math.min(a, b)); }
			public Obj eval( double a, double b ) { return new Real(Math.min(a, b)); }
		});

		install( env, "max", new Operation() {
			public Obj eval( int a, int b ) { return new FixNum(Math.max(a, b)); }
			public Obj eval( double a, double b ) { return new Real(Math.max(a, b)); }
		});

		install( env, "abs", new UnaryOperation() {
			public Obj eval( int a ) { return new FixNum(Math.abs(a)); }
			public Obj eval( double a ) { return new Real(Math.abs(a)); }
		});

		installRealFunc(env, "sin", new RealFunc() { public double calc(double x) {return Math.sin(x);}});
		installRealFunc(env, "cos", new RealFunc() { public double calc(double x) {return Math.cos(x);}});
		installRealFunc(env, "tan", new RealFunc() { public double calc(double x) {return Math.tan(x);}});
		installRealFunc(env, "asin", new RealFunc() { public double calc(double x) {return Math.asin(x);}});
		installRealFunc(env, "acos", new RealFunc() { public double calc(double x) {return Math.acos(x);}});
		installRealFunc(env, "atan", new RealFunc() { public double calc(double x) {return Math.atan(x);}});
		installRealFunc2(env, "atan2", new RealFunc2() { public double calc(double y, double x) {return Math.atan2(y,x);}});

		env.bind("PI", new Real(Math.PI));
		env.bind("E", new Real(Math.E));

		installRealFunc2(env, "pow", new RealFunc2() { public double calc(double x, double y) {return Math.pow(x,y);}});

		env.bindFunction( new Func( "ciel", new String[]{"x"}, null, new Func.Body() {
			public Obj invoke(Environment env) {
				return new FixNum((int)Math.ceil(asReal(env,"x")));
			}
		}));

		env.bindFunction( new Func( "floor", new String[]{"x"}, null, new Func.Body() {
			public Obj invoke(Environment env) {
				return new FixNum((int)Math.floor(asReal(env,"x")));
			}
		}));

		env.bindFunction( new Func( "round", new String[]{"x"}, null, new Func.Body() {
			public Obj invoke(Environment env) {
				return new FixNum((int)Math.round(asReal(env,"x")));
			}
		}));
	}
}

public class Parser {
	public static class ParseException extends RuntimeException {
		private static final long serialVersionUID = 5694742982275844142L;

		public ParseException( String message ) {
			super( message );
		}
	}

	int mOffset = 0;
	boolean mIsEscape = false;
	String mString = null;

	public Parser() {
	}

	public Parser( String string ) {
		mOffset = 0;
		mString = string;
	}

	public static Obj parse( String string ) {
		Parser parser = new Parser( string );
		Obj result = parser.parse();
		return result;
	}

	public Obj parse() {
		skipCommentsAndWhitespace();
		if( !charsLeft() ) {
			return null;
		}
		if( isOpen() ) {
			return parseCons( true, false );
		}
		if( isDoubleQuote() ) {
			return parseString();
		}
		if( isNumber() ) {
			Obj number = parseNumber();
			if( charsLeft() && !( isWhitespace() ||
								  isOpen() ||
								  isClose() ) )
			{
				throw new ParseException( "Unexpected character after number" );
			}
			return number;
		}
		if( mString.startsWith( "#t", mOffset ) ) {
			mOffset += 2;
			return True.TRUE;
		}
		if( isQuote() ) {
			++mOffset;
			return new Cons( new Symbol("quote"), new Cons( parse(), Null.NULL ) );
		}
		Obj symbol = parseSymbol();
		if( symbol != null ) {
			return symbol;
		}
		throw new ParseException("Invalid expression.");
	}

	private Obj parseSymbol() {
		int start = mOffset;
		while( charsLeft() && isSymbolChar( mString.charAt( mOffset ) ) ) {
			++mOffset;
		}
		if( charsLeft() && !( isWhitespace() || isParen() ) ) {
			throw new ParseException( "Unexpected end of symbol." );
		}
		if( start == mOffset ) {
			return null;
		}
		return new Symbol( mString.substring( start, mOffset ) );
	}

	private Obj parseString() {
		mIsEscape = false;
		++mOffset;
		StringBuffer result = new StringBuffer();
		while( charsLeft() && !endOfString() ) {
			if( !mIsEscape ) {
				result.append( mString.charAt( mOffset ) );
			}
			++mOffset;
		}
		if( !charsLeft() ) {
			throw new ParseException( "Could not find end of string." );
		}
		++mOffset;
		return new StringObj( result.toString() );
	}

	private boolean endOfString() {
		if( mIsEscape ) {
			mIsEscape = false;
			return false;
		}
		if( mString.charAt( mOffset ) == '\\' ) {
			mIsEscape = true;
			return false;
		}
		return mString.charAt( mOffset ) == '"';
	}

	private Obj parseNumber() {
		int numberStart = mOffset;
		boolean negative = isMinus();
		if( negative ) ++mOffset;

		int wholeStart = mOffset;
		while( charsLeft() && isDigit( mString.charAt(mOffset) ) ) {
			++mOffset;
		}
		int wholeEnd = mOffset;
		boolean isReal = false;
		if( charsLeft() ) {
			isReal = isDot();
			if( isReal ) {
				++mOffset;
				int decimalStart = mOffset;
				while( charsLeft() && isDigit( mString.charAt(mOffset) ) ) {
					++mOffset;
				}
				int decimalEnd = mOffset;
				if( wholeStart == wholeEnd && decimalStart == decimalEnd ) {
					throw new ParseException( "Number expected, not found:" + mString.substring(numberStart,mOffset) );
				}
			}
			if( mString.startsWith("e",mOffset) ) {
				isReal = true;
				++mOffset;
				if( isMinus() ) ++mOffset;
				int exponentStart = mOffset;
				while( charsLeft() && isDigit( mString.charAt(mOffset) ) ) {
					++mOffset;
				}
				int exponentEnd = mOffset;
				if( exponentStart == exponentEnd ) {
					throw new ParseException( "Number expected, not found:" + mString.substring(numberStart,mOffset) );
				}
			}
		}
		if( !isReal )
		{
			if( wholeStart == wholeEnd ) {
				throw new ParseException( "Number expected, not found:" + mString.substring(numberStart,mOffset));
			}
			return new FixNum( Integer.valueOf( mString.substring( numberStart, mOffset )));
		}
		return new Real( Double.valueOf( mString.substring( numberStart, mOffset )));
	}

	private Obj parseCons( boolean areStart, boolean justCdr ) {
		if( areStart ) {
			++mOffset;
		}
		skipCommentsAndWhitespace();

		if( !charsLeft() ) {
			throw new ParseException( "Missing ')'" );
		}
		if( isClose() ) {
			if( justCdr ) {
				throw new ParseException( "Cannot follow '.' with ')'" );
			}
			++mOffset;
			return Null.NULL;
		}
		if( isDot() ) {
			++mOffset;
			if( !charsLeft() ) {
				throw new ParseException( "Missing ')'" );
			}
			if( isWhitespace() ) {
				if( areStart ) {
					return new Cons( Null.NULL, parseCons( false, true ) );
				} else {
					if( justCdr ) {
						throw new ParseException( "Multiple '.' in list" );
					}
					return parseCons( false, true );
				}
			} else {
				--mOffset;
			}
		} else if( justCdr ) {
			Obj cdr = parse();
			skipCommentsAndWhitespace();
			if( !isClose() ) {
				throw new ParseException( "List with '.' had multiple cdr items." );
			}
			++mOffset;
			return cdr;
		}
		Obj car = parse();
		Obj cdr = parseCons( false, false );
		return new Cons( car, cdr );
	}

	private boolean charsLeft() {
		return mOffset < mString.length();
	}

	private boolean isNumber() {
		if( isMinus() ) {
			++mOffset;
			boolean result = charsLeft() && ( isDigit() || isDot() );
			--mOffset;
			return result;
		}
		return isDot() || isDigit();
	}

	private boolean isMinus() {
		return mString.charAt( mOffset ) == '-';
	}

	private boolean isDigit(char c) {
		return '0' <= c && c <= '9';
	}

	private boolean isDigit() {
		return isDigit( mString.charAt(mOffset) );
	}

	private boolean isDot() {
		return mString.startsWith( ".", mOffset );
	}

	private boolean isSymbolChar( char c ) {
		return isAlphaNum( c ) || ( "_+-/*<>|&^%$@=?".indexOf( c ) != -1 );
	}

	private boolean isAlphaNum(char c) {
		return ( 'a' <= c && c <= 'z' ) ||
			   ( 'A' <= c && c <= 'Z' ) ||
			   ( '0' <= c && c <= '9' );
	}

	private boolean isQuote() {
		return mString.charAt( mOffset ) == '\'';
	}

	private boolean isDoubleQuote() {
		return mString.charAt( mOffset ) == '"';
	}

	private boolean isOpen() {
		return mString.charAt( mOffset ) == '(';
	}

	private boolean isClose() {
		return mString.startsWith(")",mOffset );
	}

	private boolean isParen() {
		return isOpen() || isClose();
	}

	private boolean isWhitespace() {
		String whitespace = " \t\n\r";
		return whitespace.indexOf( mString.charAt(mOffset) ) != -1;
	}

	private boolean isLineBreak() {
		Character nextChar = mString.charAt(mOffset);
		return nextChar == '\n' || nextChar == '\r';
	}

	private boolean isCommentStart() {
		return mString.charAt(mOffset) == ';';
	}

	private void skipCommentsAndWhitespace() {
		while( charsLeft() && ( isCommentStart() || isWhitespace() ) ) {
			if( isCommentStart() ) {
				while( charsLeft() && !isLineBreak() ) {
					++mOffset;
				}
			} else {
				++mOffset;
			}
		}
	}
}

public class Initialize {
	public static Environment init() {
		Environment env = new Frame();

		List.install( env );
		Numeric.install( env );
		Types.install( env );

		Special.install(env);

		return env;
	}

	public static Environment initWithLibraries() {
		Environment env = init();

		String[] libraries = new String[]{"consCombos.slur", "list.slur", "map.slur", "reduce.slur", "reverse.slur"};

		for( String library : libraries) {
			loadLibrary(library, env);
		}

		return env;
	}

	private static void loadLibrary(String library, Environment env) {
		try {
			URL path = ClassLoader.getSystemResource("slur/" + library);
			if( path == null ) {
				return;
			}
			String filePath = path.getFile();
			BufferedReader read = new BufferedReader(new FileReader(filePath));
			String line;
			StringBuffer buffer = new StringBuffer();
			do {
				line = read.readLine();
				if( line != null) {
					buffer.append(line);
					buffer.append(" ");
				}
			}
			while(line!=null);
			String contents = buffer.toString();
			if( contents.length() > 0 ) {
				try {
					Parser parser = new Parser( contents );
					Obj result;
					while( ( result = parser.parse() ) != null ) {
						result = result.compile(env);
						result.eval(env);
					}
				} catch( Parser.ParseException ex ) {
					ex.printStackTrace();
				}
			}

		} catch (IOException e) {
			e.printStackTrace();
		}
	}
}

public class Interpreter {
	public static void main(String[] args) {
		launchInterpreter();
	}

	public static void launchInterpreter() {
		BufferedReader read = new BufferedReader( new InputStreamReader( System.in ) );
		PrintStream out = System.out;

		Environment env = Initialize.initWithLibraries();

		try {
			String line;
			do {
				out.print( ":" );
				line = read.readLine();
				if( line != null && line.length() > 0 ) {
					try {
						Parser parser = new Parser( line );
						Obj result;
						while( ( result = parser.parse() ) != null ) {
							out.println( result.toString() );
							out.println( result.eval(env).toString() );
						}
					} catch( Parser.ParseException ex ) {
						out.println( ex.getMessage() );
					}
				} else if( line != null ) {
					line = null;
				}
			} while( line != null );

		} catch (IOException e) {
			e.printStackTrace();
		}
	}
}

*/

    return {
    };
}());
