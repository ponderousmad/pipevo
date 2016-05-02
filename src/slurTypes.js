var SLUR_TYPES = (function (SLUR) {
    "use strict";

    var parameterID = 2001,
        MATCHED = null,
        NO_MATCH = null,
        Primitives = {};

    function Parameter() {
        this.id = parameterID;
        parameterID += 1;
    }

    Parameter.prototype.match = function (other) {
        if (this.equals(other)) {
            return MATCHED;
        }
        return new Match(this, other);
    };

    Parameter.prototype.involves = function (parameter) {
        return this.equals(parameter);
    };

    Parameter.prototype.isParameterized = function () {
        return true;
    };

    Parameter.prototype.equals = function (other) {
        return other.id === this.id;
    };

    Parameter.prototype.substitute = function (mappings) {
        for (var m = 0; m < mappings.length; ++m) {
            var map = mappings[m];
            if (this.involves(map.parameter)) {
                return map.type;
            }
        }
        return this;
    };

    Parameter.prototype.findParameters = function (result) {
        for (var i = 0; i < result.length; ++i) {
            if (result[i].equals(this)) {
                return;
            }
        }
        result.push(this);
    };

    Parameter.prototype.findConcrete = function (result) {
    };

    Parameter.prototype.toString = function () {
        return "P[" + this.id + "]";
    };

    function ParameterMapping(parameter, type) {
        if (!parameter || !type) {
            throw "Null arguments";
        }
        this.parameter = parameter;
        this.type = type;
    }

    ParameterMapping.prototype.substitute = function (other) {
        if (other.type.involves(this.parameter)) {
            return false;
        }
        var mappings = [other];
        this.type = this.type.substitute(mappings);
        return true;
    };

    ParameterMapping.prototype.equals = function (other) {
        return this.parameter.id == other.parameter.id && this.type.equals(other.type);
    };

    function BaseType(type, name) {
        if (!type) {
            throw "Type expected";
        }
        this.type = type;
        this.name = name;
    }

    BaseType.prototype.match = function (other) {
        if (this.equals(other)) {
            return MATCHED;
        }
        return NO_MATCH;
    };

    BaseType.prototype.equals = function (other) {
        return other.type && other.type === this.type;
    };

    BaseType.prototype.involves = function (other) {
        return false;
    };

    BaseType.prototype.isParameterized = function () {
        return false;
    };

    BaseType.prototype.substitute = function (mappings) {
        return this;
    };

    BaseType.prototype.findParameters = function (result) {
    };

    BaseType.prototype.findConcrete = function (result) {
        result.push(this);
    };

    BaseType.prototype.toString = function () {
        return this.name ? this.name : "BaseType" + this.type;
    };

    function ConsType(carType, cdrType) {
        if (!carType || !cdrType) {
            throw "Expected car and cdr types";
        }
        this.carType = carType;
        this.cdrType = cdrType;
    }

    ConsType.prototype.match = function (other) {
        if (other.carType) {
            var match = this.carType.match(other.carType);
            if (!match.matches) {
                return match;
            }
            var cdrMatch = this.cdrType.match(other.cdrType);
            if (!cdrMatch.matches) {
                return cdrMatch;
            }
            return match.combine(cdrMatch);
        }
        return NO_MATCH;
    };

    ConsType.prototype.equals = function (other) {
        return other.carType && this.carType.equals(other.carType) && this.cdrType.equals(other.cdrType);
    };

    ConsType.prototype.involves = function (parameter) {
        return this.carType.involves(parameter) || this.cdrType.involves(parameter);
    };

    ConsType.prototype.isParameterized = function () {
        return this.carType.isParameterized() || this.cdrType.isParameterized();
    };

    ConsType.prototype.substitute = function (mappings) {
        var newCar = this.carType.substitute(mappings),
            newCdr = this.cdrType.substitute(mappings);
        if (newCar.equals(this.carType) && newCdr.equals(this.cdrType)) {
            return this;
        }
        return new ConsType(newCar, newCdr);
    };

    ConsType.prototype.findParameters = function (result) {
        this.carType.findParameters(result);
        this.cdrType.findParameters(result);
    };

    ConsType.prototype.findConcrete = function (result) {
        this.carType.findConcrete(result);
        this.cdrType.findConcrete(result);
    };

    ConsType.prototype.toString = function () {
        return "Cons[" + this.carType.toString() + ", " + this.cdrType.toString() + "]";
    };

    function ListType(elementType) {
        if (!elementType) {
            throw "Expected list element type";
        }
        this.elementType = elementType;
    }

    ListType.prototype.match = function (other) {
        if (other.elementType) {
            return this.elementType.match(other.elementType);
        }
        return NO_MATCH;
    };

    ListType.prototype.equals = function (other) {
        return other.elementType && this.elementType.equals(other.elementType);
    };

    ListType.prototype.involves = function (parameter) {
        return this.elementType.involves(parameter);
    };

    ListType.prototype.isParameterized = function () {
        return this.elementType.isParameterized();
    };

    ListType.prototype.substitute = function (mappings) {
        var elementType = this.elementType.substitute(mappings);
        if (this.elementType.equals(elementType)) {
            return this;
        }
        return new ListType(elementType);
    };

    ListType.prototype.findParameters = function (result) {
        this.elementType.findParameters(result);
    };

    ListType.prototype.findConcrete = function (result) {
        this.elementType.findConcrete(result);
    };

    ListType.prototype.toString = function () {
        return "List[" + this.elementType.toString() + "]";
    };

    function Maybe(maybeType) {
        if (!maybeType) {
            throw "Expected list element type";
        }
        if (maybeType.type === SLUR.ObjectType.NULL) {
            throw "Can't use NULL as maybe type.";
        }
        if (maybeType.maybeType) {
            maybeType = maybeType.maybeType;
        }
        this.maybeType = maybeType;
    }

    Maybe.prototype.match = function (other) {
        if (other.maybeType) {
            return this.maybeType.match(other.maybeType);
        }
        if (other.type === SLUR.ObjectType.NULL) {
            return MATCHED;
        }
        return this.maybeType.match(other);
    };

    Maybe.prototype.equals = function (other) {
        return other.maybeType && this.maybeType.equals(other.maybeType);
    };

    Maybe.prototype.involves = function (parameter) {
        return this.maybeType.involves(parameter);
    };

    Maybe.prototype.isParameterized = function () {
        return this.maybeType.isParameterized();
    };

    Maybe.prototype.substitute = function (mappings) {
        var maybeType = this.maybeType.substitute(mappings);
        if (this.maybeType.equals(maybeType)) {
            return this;
        }
        return new Maybe(maybeType);
    };

    Maybe.prototype.findParameters = function (result) {
        this.maybeType.findParameters(result);
    };

    Maybe.prototype.findConcrete = function (result) {
        this.maybeType.findConcrete(result);
    };

    Maybe.prototype.toString = function () {
        return "Maybe[" + this.maybeType.toString() + "]";
    };

    function FunctionType(returnType, argumentTypes) {
        if (!returnType || !Array.isArray(argumentTypes)) {
            throw "Expected return and argument types";
        }
        this.returnType = returnType;
        this.argumentTypes = argumentTypes;
    }

    FunctionType.prototype.match = function (other) {
        if (other.returnType) {
            if (other.argumentTypes.length != this.argumentTypes.length) {
                return NO_MATCH;
            }
            var match = this.returnType.match(other.returnType);
            if (!match.matches) {
                return NO_MATCH;
            }
            for (var a = 0; a < this.argumentTypes.length; ++a) {
                match = match.combine(this.argumentTypes[a].match(other.argumentTypes[a]));
                if (!match.matches) {
                    return NO_MATCH;
                }
            }
            return match;
        }
        return NO_MATCH;
    };

    FunctionType.prototype.equals = function (other) {
        if (!other.returnType) {
            return false;
        }
        if (!this.returnType.equals(other.returnType)) {
            return false;
        }
        if (this.argumentTypes.length != other.argumentTypes.length) {
            return false;
        }
        for (var a = 0; a < this.argumentTypes.length; ++a) {
            if (!this.argumentTypes[a].equals(other.argumentTypes[a])) {
                return false;
            }
        }
        return true;
    };

    FunctionType.prototype.involves = function(parameter) {
        if (this.returnType.involves(parameter)) {
            return true;
        }
        for (var a = 0; a < this.argumentTypes.length; ++a) {
            if (this.argumentTypes[a].involves(parameter)) {
                return true;
            }
        }
        return false;
    };

    FunctionType.prototype.isParameterized = function() {
        if (this.returnType.isParameterized()) {
            return true;
        }
        for (var a = 0; a < this.argumentTypes.length; ++a) {
            if (this.argumentTypes[a].isParameterized()) {
                return true;
            }
        }
        return false;
    };

    FunctionType.prototype.substitute = function(mappings) {
        var newReturn = this.returnType.substitute(mappings),
            argTypes = [],
            changed = !newReturn.equals(this.returnType);
        for (var a = 0; a < this.argumentTypes.length; ++a) {
            argTypes.push(this.argumentTypes[a].substitute(mappings));
            if (!changed && !argTypes[a].equals(this.argumentTypes[a])) {
                changed = true;
            }
        }
        if (!changed) {
            return this;
        }
        return new FunctionType(newReturn, argTypes);
    };

    FunctionType.prototype.findParameters = function(result) {
        this.returnType.findParameters(result);
        for (var a = 0; a < this.argumentTypes.length; ++a) {
            this.argumentTypes[a].findParameters(result);
        }
    };

    FunctionType.prototype.findConcrete = function (result, includeArguments) {
        this.returnType.findConcrete(result);
        if (includeArguments) {
            for (var a = 0; a < this.argumentTypes.length; ++a) {
                this.argumentTypes[a].findConcrete(result);
            }
        }
    };

    FunctionType.prototype.toString = function() {
        var result = "F[";
        for (var a = 0; a < this.argumentTypes.length; ++a) {
            if (a > 0) {
                result += ", ";
            }
            result += this.argumentTypes[a].toString();
        }
        return result + "]->[" + this.returnType.toString() + "]";
    };

    function Match(parameter, type) {
        this.matches = true;
        this.mappings = [];
        if (!parameter) {
            this.matches = false;
        } else if (Array.isArray(parameter)) {
            this.mappings = parameter.slice();
        } else if (!this.add(new ParameterMapping(parameter, type))) {
            this.matches = false;
        }
    }

    Match.prototype.match = function (parameter, type) {
        if (type.involves(parameter)) {
            this.matches = false;
        } else if (!this.add(new ParameterMapping(parameter, type))) {
            this.matches = false;
        }
    };

    Match.prototype.find = function (parameter) {
        for (var m = 0; m < this.mappings.length; ++m) {
            var mapping = this.mappings[m];
            if (mapping.parameter.equals(parameter)) {
                return mapping;
            }
        }
        return null;
    };

    Match.prototype.add = function (mapping) {
        var same = this.find(mapping.parameter);
        if (same === null) {
            return this.addAndSubstitute(mapping);
        }
        if (mapping.equals(same)) {
            return true;
        }

        var match = same.type.match(mapping.type);
        if (!match.matches) {
            match = mapping.type.match(same.type);
            if (!match.matches) {
                return false;
            }
        }
        for (var m = 0; m < match.mappings.length; ++m) {
            if (!this.add(match.mappings[m])) {
                return false;
            }
        }
        return true;
    };

    Match.prototype.addAndSubstitute = function (mapping) {
        var addType = mapping.type.substitute(this.mappings);
        if (addType.involves(mapping.parameter)) {
            // Cyclic dependencies are not allowed.
            return false;
        }
        for (var m = 0; m < this.mappings.length; ++m) {
            if (!this.mappings[m].substitute(mapping)) {
                return false;
            }
        }
        this.mappings.push(mapping);
        return true;
    };

    Match.prototype.combine = function (other) {
        if (!other) {
            throw "Expected match";
        }
        if (!this.matches || !other.matches) {
            return NO_MATCH;
        }
        if (this.mappings.length === 0) {
            return other;
        }
        if (other.mappings.length === 0) {
            return this;
        }

        var combined = new Match(other.mappings);
        for (var m = 0; m < this.mappings.length; ++m) {
            if (!combined.add(this.mappings[m])) {
                return NO_MATCH;
            }
        }
        return combined;
    };

    function typesEqualModuloParameters(first, second) {
        if (first.isParameterized() && second.isParameterized()) {
            var match = first.match(second);
            if (!match.matches) {
                return false;
            }
            for (var m = 0; m < match.mappings.length; ++m) {
                if (!match.mappings[m].type.id) {
                    return false;
                }
            }
            first = first.substitute(match.mappings);
        }
        return first.equals(second);
    }

    function findParameters(type) {
        var result = [];
        type.findParameters(result);
        return result;
    }

    function makeParametersUnique(type) {
        var parameters = findParameters(type);
        if (parameters.length === 0) {
            return type;
        }
        var mappings = [];
        for (var p = 0; p < parameters.length; ++p) {
            mappings.push(new ParameterMapping(parameters[p], new Parameter()));
        }
        return type.substitute(mappings);
    }

    (function () {
        MATCHED = new Match([]);
        NO_MATCH = new Match();

        for (var type in SLUR.ObjectType) {
            if (SLUR.ObjectType.hasOwnProperty(type) && SLUR.ObjectType[type]) {
                Primitives[type] = new BaseType(SLUR.ObjectType[type], type);
            }
        }
        Primitives.BOOL = new Maybe(Primitives.BOOLEAN);
    }());

    function Registry() {
        this.entries = [];
    }

    Registry.prototype.register = function (name, type) {
        this.entries.push({symbol: new SLUR.Symbol(name), type: type});
    };

    // Requires that type's parameters are unique.
    Registry.prototype.findMatch = function (type) {
        var matching = [];
        for (var e = 0; e < this.entries.length; ++e) {
            var entry = this.entries[e];
            if (type.match(entry.type).matches) {
                matching.push(entry.symbol);
            }
        }
        return matching;
    };

    // Requires that returnType's parameters are unique.
    Registry.prototype.findFunctionReturning = function (returnType) {
        var matching = [];
        for (var e = 0; e < this.entries.length; ++e) {
            var entry = this.entries[e];
            if (entry.type.returnType) {
                var match = returnType.match(entry.type.returnType);
                if (match.matches) {
                    matching.push({symbol: entry.symbol, type: entry.type.substitute(match.mappings)});
                }
            }
        }
        return matching;
    };

    function registerBuiltins(registry, includeLibrary) {
        function add(name, type) {
            registry.register(name, type);
        }

        function anyBool() {
            return new Maybe(new Parameter());
        }

        function isTypeFn() {
            return new FunctionType(Primitives.BOOL, [new Parameter()]);
        }

        var unaryInt = new FunctionType(Primitives.FIX_NUM, [Primitives.FIX_NUM]),
            unaryReal = new FunctionType(Primitives.REAL, [Primitives.REAL]),
            binaryInt = new FunctionType(Primitives.FIX_NUM, [Primitives.FIX_NUM, Primitives.FIX_NUM]),
            binaryReal = new FunctionType(Primitives.REAL, [Primitives.REAL, Primitives.REAL]),
            toInt = new FunctionType(Primitives.FIX_NUM, [Primitives.REAL]),
            p = null,
            q = null;

        function addNumerical(name) {
            add(name, binaryInt);
            add(name, binaryReal);
            add(name, new FunctionType(Primitives.REAL, [Primitives.REAL, Primitives.FIX_NUM]));
            add(name, new FunctionType(Primitives.REAL, [Primitives.FIX_NUM, Primitives.REAL]));
        }

        function addRelational(name) {
            add(name, new FunctionType(Primitives.BOOL, [Primitives.FIX_NUM,Primitives.FIX_NUM]));
            add(name, new FunctionType(Primitives.BOOL, [Primitives.REAL,Primitives.REAL]));
            add(name, new FunctionType(Primitives.BOOL, [Primitives.FIX_NUM,Primitives.REAL]));
            add(name, new FunctionType(Primitives.BOOL, [Primitives.REAL,Primitives.FIX_NUM]));
        }

        // Numeric:
        addNumerical("+");
        addNumerical("-");
        addNumerical("*");
        addNumerical("/");

        addRelational(">");
        addRelational("<");
        addRelational(">");
        addRelational("<=");
        addRelational(">=");
        addRelational("=");
        addRelational("!=");

        add("PI", Primitives.REAL);
        add("E", Primitives.REAL);
        add("sin", unaryReal);
        add("cos", unaryReal);
        add("tan", unaryReal);
        add("asin", unaryReal);
        add("acos", unaryReal);
        add("atan", unaryReal);
        add("atan2", binaryReal);
        add("pow", binaryReal);

        add("abs", unaryReal);
        add("max", binaryReal);
        add("min", binaryReal);

        add("abs", unaryInt);
        add("max", binaryInt);
        add("min", binaryInt);

        add("floor", toInt);
        add("ceil", toInt);
        add("round", toInt);

        // Logic:
        add("and", new FunctionType(Primitives.BOOL, [anyBool(), anyBool()]));
        add("or",  new FunctionType(Primitives.BOOL, [anyBool(), anyBool()]));
        add("not", new FunctionType(Primitives.BOOL, [anyBool()]));

        p = new Parameter();
        add("if", new FunctionType(p, [anyBool(), p, p]));

        // List:
        p = new Parameter();
        q = new Parameter();
        add("cons", new FunctionType(new ConsType(p, q), [p, q]));

        p = new Parameter();
        q = new Parameter();
        add("car", new FunctionType(p, [new ConsType(p, q)]));

        p = new Parameter();
        q = new Parameter();
        add("cdr", new FunctionType(q, [new ConsType(p, q)]));

        p = new Parameter();
        add("isList?", new FunctionType(Primitives.BOOL, [p]));

        // TODO Is this a resonable way of handling rest parameter types?
        for (var i = 0; i < 10; ++i) {
            var ps = [];
            p = new Parameter();
            for (var j = 0; j < i; ++j) {
                ps.push(p);
            }

            add("list", new FunctionType(new ListType(p), ps));
        }

        // Types:
        add("isCons?",   isTypeFn());
        add("isSym?",    isTypeFn());
        add("isString?", isTypeFn());
        add("isFn?",     isTypeFn());
        add("isMacro?",  isTypeFn());
        add("isNull?",   isTypeFn());
        add("isFixNum?", isTypeFn());
        add("isReal?",   isTypeFn());

        if (!includeLibrary) {
            return;
        }

        // List library
        add("length", new FunctionType(Primitives.FIX_NUM, [new ListType(new Parameter())]));

        p = new Parameter();
        add("first", new FunctionType(p, [new ListType(p)]));

        p = new Parameter();
        add("second", new FunctionType(p, [new ListType(p)]));

        p = new Parameter();
        add("third", new FunctionType(p, [new ListType(p)]));

        p = new Parameter();
        add("last", new FunctionType(p, [new ListType(p)]));

        p = new Parameter();
        add("nth", new FunctionType(p, [new ListType(p), Primitives.FIX_NUM]));

        p = new Parameter();
        add("append", new FunctionType(new ListType(p), [new ListType(p), p]));

        p = new Parameter();
        add("remove", new FunctionType(new ListType(p), [new ListType(p), new FunctionType(Primitives.BOOL, [p])]));

        p = new Parameter();
        add("reverse", new FunctionType(new ListType(p), [new ListType(p)]));

        p = new Parameter();
        q = new Parameter();
        add("map", new FunctionType(new ListType(q), [new FunctionType(q, [p]), new ListType(p)]));

        p = new Parameter();
        q = new Parameter();
        add("reduce", new FunctionType(q, [new FunctionType(q, [p, q]), new ListType(p), q]));
    }

    function testSuite() {
        var parameterTests = [
            function testParameter() {
                var p = new Parameter(),
                    q = new Parameter();

                TEST.isTrue(p.isParameterized());
                TEST.isTrue(q.isParameterized());

                TEST.isTrue(p.involves(p));
                TEST.isTrue(q.involves(q));
                TEST.isFalse(p.involves(q));
                TEST.isFalse(q.involves(p));

                TEST.inList(findParameters(p), p);
                TEST.equals(findParameters(p).length, 1);
                TEST.inList(findParameters(q), q);
                TEST.equals(findParameters(q).length, 1);
            },
            function testEquals() {
                var p = new Parameter(),
                    q = new Parameter();

                TEST.isTrue(p.equals(p));
                TEST.isFalse(p.equals(q));
                TEST.isFalse(q.equals(p));
            },
            function testMatch() {
                var p = new Parameter(),
                    q = new Parameter(),
                    match = p.match(Primitives.NULL);
                TEST.isTrue(match.matches);
                TEST.isTrue(match.mappings[0].parameter.equals(p));
                TEST.isTrue(match.mappings[0].type.equals(Primitives.NULL));

                match = p.match(new ListType(p));
                TEST.isFalse(match.matches);

                match = p.match(new ListType(q));
                TEST.isTrue(match.matches);
                TEST.isTrue(match.mappings[0].parameter.equals(p));
                TEST.isTrue(match.mappings[0].type.equals(new ListType(q)));
            },
            function testSubstitute() {
                var p = new Parameter(),
                    match = p.match(Primitives.STRING),
                    result = p.substitute(match.mappings);
                TEST.isTrue(result.equals(Primitives.STRING));

                var q = new Parameter();

                result = q.substitute(match.mappings);
                TEST.isTrue(result.equals(q));
            },
            function testToString() {
                var p = new Parameter();
                TEST.equals(p.toString(), "P[" + p.id + "]");
            },
            function testEquals() {
                var p = new Parameter(),
                    q = new Parameter(),
                    m1 = new ParameterMapping(p, Primitives.STRING),
                    m2 = new ParameterMapping(q, Primitives.FIX_NUM);
                TEST.isFalse(m1.equals(m2));
                TEST.isFalse(m2.equals(m1));

                m2 = new ParameterMapping(p, Primitives.FIX_NUM);
                TEST.isFalse(m1.equals(m2));
                TEST.isFalse(m2.equals(m1));

                m2 = new ParameterMapping(p, Primitives.STRING);
                TEST.isTrue(m1.equals(m2));
            }
        ];

        var baseTypeTests = [
            function testParameter () {
                TEST.isFalse(Primitives.NULL.isParameterized());
                TEST.isFalse(Primitives.FIX_NUM.involves(new Parameter()));
                TEST.isEmpty(findParameters(Primitives.FIX_NUM));
            },
            function testEquals () {
                TEST.equals(Primitives.NULL.type, SLUR.ObjectType.NULL);
                TEST.isFalse(Primitives.FIX_NUM.equals(Primitives.REAL));
            },
            function testMatch () {
                TEST.isTrue(Primitives.STRING.match(Primitives.STRING).matches);
                TEST.isFalse(Primitives.SYMBOL.match(Primitives.NULL).matches);
            },
            function testSubstitute () {
                TEST.equals(Primitives.STRING.substitute([]), Primitives.STRING);
            },
            function testToString () {
                TEST.equals(Primitives.NULL.toString(), "NULL");
                TEST.equals(Primitives.SYMBOL.toString(), "SYMBOL");
            }
        ];

        var cons = new ConsType(Primitives.REAL, Primitives.STRING),
            pcar = new ConsType(new Parameter(), Primitives.STRING),
            pcdr = new ConsType(Primitives.REAL, new Parameter());

        var consTypeTests = [
            function testParameter() {
                TEST.isFalse(cons.isParameterized());
                TEST.isFalse(cons.involves(new Parameter()));

                TEST.isTrue(pcar.isParameterized());
                TEST.isTrue(pcdr.isParameterized());
                TEST.isTrue(pcar.involves(pcar.carType));
                TEST.isTrue(pcdr.involves(pcdr.cdrType));

                TEST.isEmpty(findParameters(cons));
                TEST.equals(findParameters(pcar).length, 1);
                TEST.equals(findParameters(pcdr).length, 1);
            },
            function testEquals() {
                TEST.isTrue(cons.equals(cons));
                TEST.isTrue(cons.equals(new ConsType(Primitives.REAL, Primitives.STRING)));
                TEST.isFalse(cons.equals(pcar));
                TEST.isFalse(pcar.equals(pcdr));
            },
            function testMatch() {
                var match = pcar.match(cons);

                TEST.isTrue(cons.match(cons).matches);
                TEST.isFalse(cons.match(pcar).matches);
                TEST.isFalse(cons.match(pcdr).matches);
                TEST.isFalse(pcar.match(pcdr).matches);
                TEST.isFalse(pcdr.match(pcar).matches);

                TEST.isTrue(match.matches);
                TEST.equals(match.mappings.length, 1);
                TEST.equals(match.mappings[0].parameter, pcar.carType);
                TEST.equals(match.mappings[0].type, cons.carType);

                match = pcdr.match(cons);

                TEST.isTrue(match.matches);
                TEST.equals(match.mappings.length, 1);
                TEST.equals(match.mappings[0].parameter, pcdr.cdrType);
                TEST.equals(match.mappings[0].type, cons.cdrType);

                TEST.isFalse(pcar.match(Primitives.REAL).matches);
                TEST.isFalse(pcar.match(new ConsType(Primitives.REAL, Primitives.SYMBOL)).matches);
            },
            function testSubsitute() {
                var p = new Parameter(),
                    parameterized = new ConsType(p, Primitives.REAL),
                    target = new ConsType(Primitives.STRING, Primitives.REAL),
                    match = parameterized.match(target),
                    result = parameterized.substitute(match.mappings);

                TEST.isTrue(result.equals(target));

                p = new Parameter();
                parameterized = new ConsType(Primitives.SYMBOL, p);
                target = new ConsType(Primitives.SYMBOL, Primitives.FIX_NUM);
                match = parameterized.match(target);
                result = parameterized.substitute(match.mappings);
                TEST.isTrue(result.equals(target));
            },
            function testToString() {
                TEST.equals(cons.toString(), "Cons[REAL, STRING]");
            }
        ];

        var listTypeTests = [
            function testParameter() {
                var list = new ListType(Primitives.STRING);
                TEST.isFalse(list.isParameterized());
                TEST.isFalse(list.involves(new Parameter()));
                TEST.isEmpty(findParameters(list));

                var p = new Parameter(),
                    listP = new ListType(p);
                TEST.isTrue(listP.isParameterized());
                TEST.isTrue(listP.involves(p));
                TEST.inList(findParameters(listP), p);
            },
            function testEquals() {
                var list = new ListType(Primitives.STRING);
                TEST.isFalse(list.equals(Primitives.STRING));
                TEST.isTrue(list.equals(new ListType(Primitives.STRING)));

                var p = new Parameter(),
                    listP = new ListType(p);

                TEST.isFalse(list.equals(listP));
                TEST.isTrue(listP.equals(new ListType(p)));
            },
            function testMatch() {
                var list = new ListType(Primitives.STRING);
                TEST.isFalse(list.match(Primitives.STRING).matches);
                TEST.isTrue(list.match(new ListType(Primitives.STRING)).matches);

                var p = new Parameter(),
                    listP = new ListType(p);
                TEST.isFalse(listP.match(Primitives.STRING).matches);

                var match = listP.match(list);
                TEST.isTrue(match.matches);
                TEST.isTrue(match.mappings[0].parameter.equals(p));
                TEST.isTrue(match.mappings[0].type.equals(Primitives.STRING));
            },
            function testSubstitute() {
                var p = new Parameter(),
                    list = new ListType(p),
                    target = new ListType(Primitives.STRING),
                    match = list.match(target),
                    result = list.substitute(match.mappings);
                TEST.isTrue(result.equals(target));

                list = new ListType(new Parameter());
                result = list.substitute(match.mappings);
                TEST.isTrue(list.equals(result));
            },
            function testToString() {
                TEST.equals(new ListType(Primitives.NULL).toString(), "List[NULL]");
            }
        ];

        var maybeTests = [
            function testParameter() {
                var maybe = new Maybe(Primitives.FIX_NUM);
                TEST.isFalse(maybe.isParameterized());
                TEST.isFalse(maybe.involves(new Parameter()));
                TEST.isEmpty(findParameters(maybe));

                var p = new Parameter();
                maybe = new Maybe(p);

                TEST.isTrue(maybe.isParameterized());
                TEST.isTrue(maybe.involves(p));
                TEST.inList(findParameters(maybe), p);
            },
            function testEquals() {
                var maybe = new Maybe(Primitives.REAL);

                TEST.isFalse(maybe.equals(Primitives.REAL));
                TEST.isTrue(maybe.equals(new Maybe(Primitives.REAL)));

                var p = new Parameter(),
                    maybeP = new Maybe(p);
                TEST.isFalse(maybe.equals(maybeP));
                TEST.isTrue(maybeP.equals(new Maybe(p)));
            },
            function testMatch() {
                var maybe = new Maybe(Primitives.STRING);

                TEST.isTrue(maybe.match(Primitives.NULL).matches);
                TEST.isTrue(maybe.match(Primitives.STRING).matches);
                TEST.isTrue(maybe.match(new Maybe(Primitives.STRING)).matches);
                TEST.isFalse(maybe.match(Primitives.FIX_NUM).matches);

                var p = new Parameter(),
                    maybeP = new Maybe(p),
                    match = maybeP.match(maybe);

                TEST.isTrue(match.matches);
                TEST.isTrue(match.mappings[0].parameter.equals(p));
                TEST.isTrue(match.mappings[0].type.equals(Primitives.STRING));
            },
            function testSubstitute() {
                var p = new Parameter(),
                    maybe = new Maybe(p),
                    target = new Maybe(Primitives.SYMBOL),
                    match = maybe.match(target),
                    result = maybe.substitute(match.mappings);
                TEST.isTrue(result.equals(target));
            },
            function testToString() {
                TEST.equals(new Maybe(Primitives.SYMBOL).toString(), "Maybe[SYMBOL]");
            }
        ];

        var functionTypeTests = [
            function testParameter() {
                var func = new FunctionType(Primitives.FIX_NUM, [Primitives.FIX_NUM]);
                TEST.isFalse(func.isParameterized());
                TEST.isFalse(func.involves(new Parameter()));
                TEST.isEmpty(findParameters(func));

                var p = new Parameter(),
                    q = new Parameter(),
                    funcP = new FunctionType(p, [p,q]);
                TEST.isTrue(funcP.isParameterized());
                TEST.isTrue(funcP.involves(p));
                TEST.isTrue(funcP.involves(q));
                TEST.isFalse(funcP.involves(new Parameter()));

                var parameters = findParameters(funcP);
                TEST.inList(parameters, q);
                TEST.inList(parameters, p);
                TEST.equals(parameters.length, 2);

                var r = new Parameter(),
                    funcR = new FunctionType(r, [Primitives.FIX_NUM]);
                TEST.isTrue(funcR.isParameterized());
                TEST.isTrue(funcR.involves(r));
                TEST.isFalse(funcR.involves(p));
                TEST.inList(findParameters(funcR), r);
            },
            function testEquals() {
                var func = new FunctionType(Primitives.FIX_NUM, [Primitives.FIX_NUM]),
                    again= new FunctionType(Primitives.FIX_NUM, [Primitives.FIX_NUM]);
                TEST.isTrue(func.equals(again));
                TEST.isFalse(func.equals(Primitives.FIX_NUM));

                var p = new Parameter(),
                    q = new Parameter(),
                    funcP = new FunctionType(p, [p]);
                TEST.isFalse(func.equals(funcP));

                var funcQ = new FunctionType(q, [q]);
                TEST.isFalse(funcP.equals(funcQ));

                var func2  = new FunctionType(Primitives.BOOL, [Primitives.STRING,Primitives.STRING]),
                    again2 = new FunctionType(Primitives.BOOL, [Primitives.STRING,Primitives.STRING]);
                var unfunc2= new FunctionType(Primitives.BOOL, [Primitives.STRING,Primitives.SYMBOL]);
                TEST.isTrue(func2.equals(again2));
                TEST.isFalse(func2.equals(unfunc2));
            },
            function testMatch() {
                var func = new FunctionType(Primitives.FIX_NUM, [Primitives.FIX_NUM]),
                    again= new FunctionType(Primitives.FIX_NUM, [Primitives.FIX_NUM]);
                TEST.isTrue(func.match(again).matches);
                TEST.isFalse(func.match(Primitives.FIX_NUM).matches);

                var p = new Parameter(),
                    q = new Parameter(),
                    funcP = new FunctionType(p, [p]);
                TEST.isFalse(func.match(funcP).matches);

                var match = funcP.match(func);
                TEST.isTrue(match.matches);
                TEST.isTrue(match.mappings[0].parameter.equals(p));
                TEST.isTrue(match.mappings[0].type.equals(Primitives.FIX_NUM));

                var funcQ = new FunctionType(q, [q]);
                match = funcP.match(funcQ);
                TEST.isTrue(match.matches);
                TEST.isTrue(match.mappings[0].parameter.equals(p));
                TEST.isTrue(match.mappings[0].type.equals(q));

                var func2  = new FunctionType(Primitives.BOOL, [Primitives.STRING,Primitives.STRING]),
                    again2 = new FunctionType(Primitives.BOOL, [Primitives.STRING,Primitives.STRING]),
                    unfunc2= new FunctionType(Primitives.BOOL, [Primitives.STRING,Primitives.SYMBOL]);
                TEST.isTrue(func2.match(again2).matches);
                TEST.isFalse(func2.match(unfunc2).matches);
                TEST.isFalse(func2.match(funcP).matches);
            },
            function testSubstitute() {
                var p = new Parameter(),
                    q = new Parameter(),
                    r = new Parameter(),
                    func = new FunctionType(p, [q]),
                    target = new FunctionType(Primitives.FIX_NUM, [Primitives.FIX_NUM]),
                    match = func.match(target),
                    result = func.substitute(match.mappings);
                TEST.isTrue(result.equals(target));

                TEST.same(target.substitute(match.mappings), target);

                func = new FunctionType(p, [q, r]);
                target = new FunctionType(Primitives.BOOL, [Primitives.REAL, Primitives.STRING]);
                match = func.match(target);
                result = func.substitute(match.mappings);
                TEST.isTrue(result.equals(target));

                TEST.same(target.substitute(match.mappings), target);
            },
            function testToString() {
                var funcVoid = new FunctionType(Primitives.FIX_NUM, []);
                TEST.equals(funcVoid.toString(),"F[]->[FIX_NUM]");

                var func = new FunctionType(Primitives.FIX_NUM, [Primitives.REAL]);
                TEST.equals(func.toString(),"F[REAL]->[FIX_NUM]");

                var func2 = new FunctionType(Primitives.BOOL, [Primitives.STRING,Primitives.STRING]);
                TEST.equals(func2.toString(),"F[STRING, STRING]->[Maybe[BOOLEAN]]");
            }
        ];

        var matchTests = [
            function testResult() {
                TEST.isTrue(MATCHED.matches);
                TEST.isEmpty(MATCHED.mappings);

                TEST.isFalse(NO_MATCH.matches);
                TEST.isEmpty(NO_MATCH.mappings);
            },
            function testConstruct() {
                var p = new Parameter(),
                    q = new Parameter(),
                    match = new Match(p, Primitives.FIX_NUM);
                TEST.isTrue(match.matches);
                TEST.equals(match.mappings.length, 1);
                TEST.same(match.mappings[0].parameter, p);
                TEST.isTrue(match.mappings[0].type.equals(Primitives.FIX_NUM));

                TEST.isTrue(match.add(new ParameterMapping(q, Primitives.STRING)));
                TEST.isTrue(match.matches);
                TEST.equals(match.mappings.length, 2);
                TEST.same(match.mappings[1].parameter, q);
            },
            function testCombinePassFail() {
                TEST.isTrue(MATCHED.combine(MATCHED).matches);
                TEST.isFalse(MATCHED.combine(NO_MATCH).matches);
                TEST.isFalse(NO_MATCH.combine(MATCHED).matches);
                TEST.isFalse(NO_MATCH.combine(NO_MATCH).matches);
            },
            function testCombineMatchPassFail() {
                var p = new Parameter(),
                    match = new Match(p, Primitives.FIX_NUM);

                TEST.isFalse(match.combine(NO_MATCH).matches);
                TEST.isFalse(NO_MATCH.combine(match).matches);
                TEST.isTrue(match.combine(MATCHED).matches);
                TEST.isTrue(MATCHED.combine(match).matches);
                TEST.equals(match.combine(MATCHED).mappings, match.mappings);
                TEST.equals(MATCHED.combine(match).mappings, match.mappings);
            },
            function testCombine() {
                var p = new Parameter(),
                    q = new Parameter(),
                    match = new Match(p, Primitives.FIX_NUM),
                    other = new Match(q, Primitives.REAL),
                    combined = match.combine(other);

                TEST.isTrue(combined.matches);
                TEST.equals(combined.mappings.length, 2);

                var mappings = combined.mappings,
                    m1 = mappings[0],
                    m2 = mappings[1];
                TEST.equals(mappings.length, 2);
                if (m1.parameter.equals(q)) {
                    var temp = m1;
                    m1 = m2;
                    m2 = temp;
                }
                TEST.isTrue(m1.parameter.equals(p));
                TEST.isTrue(m1.type.equals(Primitives.FIX_NUM));
                TEST.isTrue(m2.parameter.equals(q));
                TEST.isTrue(m2.type.equals(Primitives.REAL));
            },
            function testCombineIncompatible() {
                var p = new Parameter(),
                    match = new Match(p, Primitives.FIX_NUM),
                    other = new Match(p, Primitives.REAL);

                TEST.isFalse(match.combine(other).matches);
            },
            function testCombineNested() {
                for (var i = 0; i < 2; ++i) {
                    var p = new Parameter(),
                        q = new Parameter(),
                        match = new Match(p, i === 0 ? new ListType(q) : new ListType(Primitives.STRING)),
                        other = new Match(p, i !== 0 ? new ListType(q) : new ListType(Primitives.STRING)),
                        combined = match.combine(other);

                    TEST.isTrue(combined.matches);

                    var mappings = combined.mappings,
                        m1 = mappings[0],
                        m2 = mappings[1];
                    TEST.equals(mappings.length, 2);
                    if (m1.parameter.equals(q)) {
                        var temp = m1;
                        m1 = m2;
                        m2 = temp;
                    }
                    TEST.isTrue(m1.parameter.equals(p));
                    TEST.isTrue(m1.type.equals(new ListType(Primitives.STRING)));
                    TEST.isTrue(m2.parameter.equals(q));
                    TEST.isTrue(m2.type.equals(Primitives.STRING));
                }
            }
        ];

        var uniqueTests = [
            function testUniqueFunction() {
                var func = new FunctionType(Primitives.FIX_NUM, [Primitives.STRING]);
                TEST.isTrue(makeParametersUnique(func).equals(func));

                var p = new Parameter();
                func = new FunctionType(p,[Primitives.STRING, Primitives.STRING]);
                TEST.isFalse(makeParametersUnique(func).equals(func));
                TEST.isTrue(makeParametersUnique(func).match(func).matches);

                func = new FunctionType(Primitives.STRING, [p, new Parameter()]);
                TEST.isFalse(makeParametersUnique(func).equals(func));
                TEST.isTrue(makeParametersUnique(func).match(func).matches);

                func = new FunctionType(p, [new Parameter(), p]);
                TEST.isFalse(makeParametersUnique(func).equals(func));
                TEST.isTrue(makeParametersUnique(func).match(func).matches);
            },
            function testUniqueBaseType() {
                TEST.isTrue(makeParametersUnique(Primitives.FIX_NUM).equals(Primitives.FIX_NUM));
                TEST.isTrue(makeParametersUnique(Primitives.STRING).equals(Primitives.STRING));
            },
            function testUniqueMaybe() {
                TEST.isTrue(makeParametersUnique(new Maybe(Primitives.REAL)).equals(new Maybe(Primitives.REAL)));

                var p = new Parameter();
                TEST.isTrue(makeParametersUnique(new Maybe(p)).match(new Maybe(p)).matches);

                var maybe = new Maybe(p);
                TEST.notSame(makeParametersUnique(maybe), maybe);
                TEST.isFalse(makeParametersUnique(maybe).equals(maybe));
            },
            function testUniqueList() {
                TEST.isTrue(makeParametersUnique(new ListType(Primitives.REAL)).equals(new ListType(Primitives.REAL)));

                var p = new Parameter();
                TEST.isTrue(makeParametersUnique(new ListType(p)).match(new ListType(p)).matches);

                var list = new ListType(p);
                TEST.notSame(makeParametersUnique(list), list);
                TEST.isFalse(makeParametersUnique(list).equals(list));
            },
            function testUniqueParameter() {
                var p = new Parameter();
                TEST.notSame(makeParametersUnique(p), p);
                TEST.isFalse(makeParametersUnique(p).equals(p));
            }
        ];

        function testCompareAreEqual(a, b) { TEST.isTrue (typesEqualModuloParameters(a, b)); }
        function testCompareNotEqual(a, b) { TEST.isFalse(typesEqualModuloParameters(a, b)); }

        var compareTests = [
            function testBaseTypes() {
                testCompareAreEqual(Primitives.STRING, Primitives.STRING);
                testCompareNotEqual(Primitives.FIX_NUM, Primitives.REAL);
            },
            function testMaybe() {
                testCompareAreEqual(new Maybe(Primitives.STRING), new Maybe(Primitives.STRING));
                testCompareNotEqual(new Maybe(Primitives.FIX_NUM), new Maybe(Primitives.REAL));
                testCompareNotEqual(new Maybe(Primitives.FIX_NUM), Primitives.FIX_NUM);
            },
            function testCons() {
                testCompareAreEqual(new ConsType(Primitives.STRING,Primitives.NULL),
                                    new ConsType(Primitives.STRING,Primitives.NULL));
                testCompareNotEqual(new ConsType(Primitives.REAL,Primitives.NULL),
                                    new ConsType(Primitives.FIX_NUM,Primitives.NULL));
                testCompareNotEqual(new ConsType(Primitives.REAL,Primitives.NULL),
                                    new Maybe(Primitives.REAL));
                testCompareAreEqual(new ConsType(Primitives.STRING, new ConsType(Primitives.BOOL,Primitives.NULL)),
                                    new ConsType(Primitives.STRING, new ConsType(Primitives.BOOL,Primitives.NULL)));
            },
            function testList() {
                testCompareAreEqual(new ListType(Primitives.STRING), new ListType(Primitives.STRING));
                testCompareNotEqual(new ListType(Primitives.FIX_NUM), new ListType(Primitives.REAL));
                testCompareNotEqual(new ListType(Primitives.FIX_NUM), new ConsType(Primitives.FIX_NUM, Primitives.NULL));
                testCompareAreEqual(new ListType(new ListType(Primitives.REAL)), new ListType(new ListType(Primitives.REAL)));
            },
            function testFunction() {
                testCompareAreEqual(new FunctionType(new ListType(Primitives.STRING),
                                        [new ConsType(Primitives.FIX_NUM, Primitives.FIX_NUM), Primitives.BOOL]),
                                    new FunctionType(new ListType(Primitives.STRING),
                                        [new ConsType(Primitives.FIX_NUM, Primitives.FIX_NUM), Primitives.BOOL]));
                testCompareNotEqual(new FunctionType(new ListType(Primitives.STRING),
                                        [new ConsType(Primitives.FIX_NUM, Primitives.FIX_NUM), Primitives.BOOL]),
                                    new FunctionType(new ListType(Primitives.STRING),
                                        [new ConsType(Primitives.REAL, Primitives.FIX_NUM), Primitives.BOOL]));
                testCompareNotEqual(new FunctionType(new ListType(Primitives.STRING),
                                        [new ConsType(Primitives.FIX_NUM, Primitives.FIX_NUM), Primitives.BOOL]),
                                    new FunctionType(new ListType(Primitives.SYMBOL),
                                        [new ConsType(Primitives.FIX_NUM, Primitives.FIX_NUM), Primitives.BOOL]));
                testCompareNotEqual(new FunctionType(new ListType(Primitives.STRING),
                                        [new ConsType(Primitives.FIX_NUM, Primitives.FIX_NUM), Primitives.BOOL]),
                                    new FunctionType(new ListType(Primitives.STRING),
                                        [new ConsType(Primitives.FIX_NUM, Primitives.FIX_NUM)]));
                testCompareNotEqual(new FunctionType(new ListType(Primitives.STRING),
                                        [new ConsType(Primitives.FIX_NUM,Primitives.FIX_NUM), Primitives.BOOL]),
                                    new ListType(Primitives.STRING));
            },
            function testParameter() {
                var p = new Parameter(),
                    q = new Parameter();
                testCompareAreEqual(p, p);
                testCompareAreEqual(p, q);
                testCompareNotEqual(p, Primitives.FIX_NUM);
                testCompareAreEqual(new Maybe(p), new Maybe(p));
                testCompareAreEqual(new ListType(p), new ListType(q));
            },
            function testMultiParameter() {
                var p = new Parameter(),
                    q = new Parameter(),
                    r = new Parameter();
                testCompareAreEqual(new ConsType(p,p), new ConsType(q,q));
                testCompareNotEqual(new ConsType(p,p), new ConsType(q,r));
                testCompareAreEqual(new FunctionType(p, [p]), new FunctionType(q, [q]));
                testCompareAreEqual(new FunctionType(p, [p, q]), new FunctionType(r, [r, q]));
            }
        ];

        var registryTests = [
            function testBuiltin() {
                var registry = new Registry();
                registerBuiltins(registry, false);
                TEST.equals(registry.entries.length, 89);
            },
            function testLibrary() {
                var registry = new Registry();
                registerBuiltins(registry, true);
                TEST.equals(registry.entries.length, 100);
            }
        ];

        TEST.run("Parameter", parameterTests);
        TEST.run("BaseType", baseTypeTests);
        TEST.run("ConsType", consTypeTests);
        TEST.run("ListType", listTypeTests);
        TEST.run("Maybe", maybeTests);
        TEST.run("FunctionType", functionTypeTests);
        TEST.run("Match", matchTests);
        TEST.run("Unique", uniqueTests);
        TEST.run("Compare", compareTests);
        TEST.run("Registry", registryTests);
    }

    return {
        Primitives: Primitives,
        Parameter: Parameter,
        BaseType: BaseType,
        ConsType: ConsType,
        ListType: ListType,
        Maybe: Maybe,
        FunctionType: FunctionType,
        isParameter: function (type) { return type instanceof Parameter; },
        isConsType: function (type) { return type instanceof ConsType; },
        isListType: function (type) { return type instanceof ListType; },
        isMaybe: function (type) { return type instanceof Maybe; },
        isFunctionType: function (type) { return type instanceof FunctionType; },
        Match: Match,
        typesEqualModuloParameters: typesEqualModuloParameters,
        makeParametersUnique: makeParametersUnique,
        Registry: Registry,
        registerBuiltins: registerBuiltins,
        testSuite: testSuite
    };
}(SLUR));
