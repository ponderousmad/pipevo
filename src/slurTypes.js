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
        result.push(this);
    };

    Parameter.prototype.toString = function () {
        return "P[" + this.parameterID + "]";
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
        return this.elementType.findParameters(result);
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
        if (other.type == SLUR.ObjectType.NULL) {
            return MATCHED;
        }
        return NO_MATCH;
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
        return this.maybeType.findParameters(result);
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
                match.combine(this.argumentTypes[a].match(other.argumentTypes[a]));
                if (!match.matches) {
                    return NO_MATCH;
                }
            }
            return match;
        }
        return NO_MATCH;
    };

    FunctionType.prototype.equals = function (other) {
        if (!this.returnType.equals(other.returnType))  {
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
            if (!changed && !argTypes[i].equals(this.argumentTypes[a])) {
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
        return false;
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
        } else {
            this.add(new ParameterMapping(parameter, type));
        }
    }

    Match.prototype.match = function (parameter, type) {
        if (type.involves(parameter)) {
            this.matches = false;
        } else if(!this.add(new ParameterMapping(parameter, type))) {
            this.matches = false;
        }
    };

    Match.prototype.find = function (parameter) {
        for (var m = 0; m < this.mappings; ++m) {
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

    function typesEqualModuloParamaters(first, second) {
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

    function makeParmatersUnique(type) {
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
    }());
    
    function testSuite() {
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
        
        TEST.run("BaseType", baseTypeTests);
        TEST.run("ConsType", consTypeTests);
    }

    testSuite();
    
    return {
        Parameter: Parameter,
        BaseType: BaseType,
        ConsType: ConsType,
        ListType: ListType,
        Maybe: Maybe,
        Match: Match,
        typesEqualModuloParamaters: typesEqualModuloParamaters,
        makeParmatersUnique: makeParmatersUnique
    };
}(SLUR));
