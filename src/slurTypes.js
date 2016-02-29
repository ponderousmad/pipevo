var SLUR_TYPES = (function () {
    "use strict";

/*
public interface Type {
    public Match match(Type other);
    public boolean involves(Parameter parameter);
    public boolean isParameterized();
    public void findParameters(Set<Parameter> result);
    public Type substitute(List<ParameterMapping> mappings);
}
*/

    var parameterID = 2001,
        MATCH = null,
        NO_MATCH = null;
    
    function Parameter() {
        this.id = parameterID;
        parameterID += 1;
    }
    
    Parameter.prototype.match = function (other) {
        if (other == this) {
            return MATCH;
        }
        return new Match(this, other);
    };
    
    Parameter.prototype.involves = function (parameter) {
        return this.id === parameter.id;
    };
    
    Parameter.prototype.substitute = function (mappings) {
        for (var m = 0; m < mappings.length; ++m) {
            var map = mappings[m];
            if (this.involves(this.parameter)) {
                return map.type;
            }
        }
        return this;
    };
    
    Parameter.prototype.findParameters = function (result) {
        result.add(this);
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
    };
    
    ParameterMapping.prototype.equals = function (other) {
        return this.parameter.id == other.parameter.id && this.type.equals(other.type);
    };

    
    function BaseType(type) {
        if (!type) {
            throw "Type expected";
        }
        this.type = type;
    }
    
    BaseType.prototype.match = function (other) {
        if (this.equals(other)) {
            return  MATCH;
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
        return "BaseType" + this.type;
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
            var match = this.car.match(other.car);
            if (!match.matches()) {
                return match;
            }
            var cdrMatch = this.cdr.match(other.cdr);
            if (!cdrMatch.matches()) {
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
        return this.car.involves(parameter) || this.cdr.involves(parameter);
    };

    ConsType.prototype.isParameterized = function () {
        return this.car.isParameterized() || this.cdr.isParameterized();
    };

    ConsType.prototype.substitute = function (mappings) {
        var newCar = this.car.substitute(mappings);
            newCdr = this.cdr.substitute(mappings);
        if (newCar.equals(this.car) && newCdr.equals(this.cdr)) {
            return this;
        }
        return new ConsType(newCar, newCdr);
    };

    ConsType.prototype.findParameters = function (result) {
        this.car.findParameters(result);
        this.cdr.findParameters(result);
    };

    ConsType.prototype.toString = function () {
        return "Cons[" + this.car.toString() + ", " + this.cdr.toString() + "]";
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
            return MATCH;
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
            if (!match.matches()) {
                return NO_MATCH;
            }
            for (var a = 0; a < this.argumentTypes.length; ++a) {
                match.combine(this.argumentTypes[a].match(other.argumentTypes[a]));
                if (!match.matches()) {
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
            if (!useNew && !argTypes[i].equals(this.argumentTypes[a])) {
                useNew = true;
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

/*
public class Match {
    private boolean mMatched = true;
    private List<ParameterMapping> mMappings = new ArrayList<ParameterMapping>();

    private Match(boolean matched) {
        mMatched = matched;
    }

    public Match(Parameter parameter, Type type) {
        map(parameter, type);
    }

    protected Match(List<ParameterMapping> mappings) {
        mMappings.addAll(mappings);
    }

    public boolean matches() {
        return mMatched;
    }

    public List<ParameterMapping> mappings() {
        return mMappings;
    }

    public void map(Parameter parameter, Type type) {
        if (type.involves(parameter)) {
            mMatched = false;
        } else {
            boolean added = add(parameter, type);
            if (!added) {
                mMatched = false;
            }
        }
    }

    private boolean add(Parameter parameter, Type type) {
        return add(new ParameterMapping(parameter, type));
    }

    private ParameterMapping find(Parameter parameter) {
        for (ParameterMapping map : mMappings) {
            if (parameter == map.parameter()) {
                return map;
            }
        }
        return null;
    }

    private boolean add(ParameterMapping toAdd) {
        ParameterMapping same = find(toAdd.parameter());
        if (same == null) {
            return addAndSubstitute(toAdd);
        }
        if (toAdd.equals(same)) {
            return true;
        }

        Match match = same.type().match(toAdd.type());
        if (!match.matches()) {
            match = toAdd.type().match(same.type());
            if (!match.matches()) {
                return false;
            }
        }
        for (ParameterMapping newMap : match.mappings()) {
            if (!add(newMap)) {
                return false;
            }
        }
        return true;
    }

    private boolean addAndSubstitute(ParameterMapping toAdd) {
        Type addType = toAdd.type().substitute(mMappings);
        if (addType.involves(toAdd.parameter())) {
            // Cyclic dependencies are not allowed.
            return false;
        }
        for (ParameterMapping map : mMappings) {
            if (!map.substitute(toAdd)) {
                return false;
            }
        }
        mMappings.add(toAdd);
        return true;
    }

    public Match combine(Match other) {
        assert(other != null);
        if (!mMatched || !other.mMatched) {
            return NO_MATCH;
        }
        if (mMappings.isEmpty()) {
            return other;
        }
        if (other.mMappings.isEmpty()) {
            return this;
        }
        Match combined = new Match(other.mMappings);
        for (ParameterMapping map : mMappings) {
            if (!combined.add(map)) {
                return NO_MATCH;
            }
        }
        return combined;
    }

    public static Match result(boolean matched) {
        return matched ? MATCHED : NO_MATCH;
    }

    public static final Match MATCHED = new Match(true);
    public static final Match NO_MATCH = new Match(false);
}

public class CompareTypes {
    public static boolean equalModuloParameters(Type first, Type second) {
        if (first.isParameterized() && second.isParameterized()) {
            Match match = first.match(second);
            if (!match.matches()) {
                return false;
            }
            for (ParameterMapping mapping : match.mappings()) {
                if (!(mapping.type() instanceof Parameter)) {
                    return false;
                }
            }
            first = first.substitute(match.mappings());
        }
        return first.equals(second);
    }
}


public class ParameterUtils {
    public static Set<Parameter> findParameters(Type type) {
        Set<Parameter> result = new HashSet<Parameter>();
        type.findParameters(result);
        return result;
    }

    public static Type uniqueParameters(Type type) {
        Set<Parameter> parameters = findParameters(type);
        if (parameters.isEmpty()) {
            return type;
        }
        List<ParameterMapping> mappings = new java.util.ArrayList<ParameterMapping>();
        for (Parameter p : parameters) {
            mappings.add(new ParameterMapping(p, new Parameter()));
        }
        return type.substitute(mappings);
    }
}
*/
    return {
    };
}());
