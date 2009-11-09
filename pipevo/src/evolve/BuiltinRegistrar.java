/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package evolve;

import java.util.ArrayList;
import java.util.List;

import functional.Symbol;
import functional.type.BaseType;
import functional.type.ConsType;
import functional.type.FunctionType;
import functional.type.ListType;
import functional.type.Maybe;
import functional.type.Parameter;
import functional.type.Type;

public class BuiltinRegistrar {
	private ObjectRegistry mReg;

	public void add(String name, Type type) {
		mReg.add(new Symbol(name), type);
	}

	public static void registerBuiltins(ObjectRegistry reg) {
		BuiltinRegistrar registrar = new BuiltinRegistrar();
		registrar.register( reg );
	}

	public void register( ObjectRegistry reg ) {
		mReg = reg;
		registerNumeric();
		registerLogic();
		registerList();
		registerTypes();
	}

	private void addNumerical(String name) {
		add( name, new FunctionType( BaseType.FIXNUM, new Type[]{BaseType.FIXNUM, BaseType.FIXNUM}) );
		add( name, new FunctionType( BaseType.REAL, new Type[]{BaseType.REAL, BaseType.REAL}) );
		add( name, new FunctionType( BaseType.REAL, new Type[]{BaseType.REAL, BaseType.FIXNUM}) );
		add( name, new FunctionType( BaseType.REAL, new Type[]{BaseType.FIXNUM, BaseType.REAL}) );
	}

	private void addRelational(String name ) {
		add( name, new FunctionType( BaseType.BOOL, new Type[]{BaseType.FIXNUM,BaseType.FIXNUM}));
		add( name, new FunctionType( BaseType.BOOL, new Type[]{BaseType.REAL,BaseType.REAL}));
		add( name, new FunctionType( BaseType.BOOL, new Type[]{BaseType.FIXNUM,BaseType.REAL}));
		add( name, new FunctionType( BaseType.BOOL, new Type[]{BaseType.REAL,BaseType.FIXNUM}));
	}

	private FunctionType RealFunc() {
		return new FunctionType( BaseType.REAL, new Type[]{BaseType.REAL});
	}

	private FunctionType RealFunc2() {
		return new FunctionType( BaseType.REAL, new Type[]{BaseType.REAL, BaseType.REAL});
	}

	private FunctionType FixNumFunc() {
		return new FunctionType( BaseType.FIXNUM, new Type[]{BaseType.FIXNUM});
	}

	private FunctionType FixNumFunc2() {
		return new FunctionType( BaseType.FIXNUM, new Type[]{BaseType.FIXNUM, BaseType.FIXNUM});
	}

	private FunctionType ToFixNum() {
		return new FunctionType( BaseType.FIXNUM, new Type[]{BaseType.REAL});
	}

	public void registerNumeric() {
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

		add("PI", BaseType.REAL);
		add("E", BaseType.REAL);
		add("sin", RealFunc());
		add("cos", RealFunc());
		add("tan", RealFunc());
		add("asin", RealFunc());
		add("acos", RealFunc());
		add("atan", RealFunc());
		add("atan2", RealFunc2());
		add("pow", RealFunc2());

		add("abs", RealFunc());
		add("max", RealFunc2());
		add("min", RealFunc2());

		add("abs", FixNumFunc());
		add("max", FixNumFunc2());
		add("min", FixNumFunc2());

		add("floor", ToFixNum());
		add("ciel", ToFixNum());
		add("round", ToFixNum());
	}

	public void registerLogic() {
		add("and", binaryPredicateFn());
		add("or",  binaryPredicateFn());
		add("not", new FunctionType(BaseType.BOOL, new Type[]{anyBool()}));

		Parameter p = new Parameter();
		add("if", new FunctionType(p, new Type[]{anyBool(), p, p}));
	}

	private void registerList() {
		Parameter p = new Parameter();
		Parameter q = new Parameter();
		add("cons", new FunctionType(new ConsType(p, q), new Type[]{p, q}));

		p = new Parameter();
		q = new Parameter();
		add("car", new FunctionType(p, new Type[]{new ConsType(p, q)}));

		p = new Parameter();
		q = new Parameter();
		add("cdr", new FunctionType(q, new Type[]{new ConsType( p, q )}));

		p = new Parameter();
		add("isList?", new FunctionType(BaseType.BOOL, new Type[]{p}));

		// TODO Is this a resonable way of handling rest parameter types?
		List<Parameter> ps = new ArrayList<Parameter>();
		for(int i = 0; i < 10; ++ i) {
			ps.clear();
			p = new Parameter();
			for(int j = 0; j < i; ++j) {
				ps.add(p);
			}

			add("list", new FunctionType(new ListType(p), ps.toArray(new Type[i])));
		}
	}

	private void registerTypes() {
		add( "isCons?",   isTypeFn() );
		add( "isSym?",    isTypeFn() );
		add( "isString?", isTypeFn() );
		add( "isFn?",     isTypeFn() );
		add( "isMacro?",  isTypeFn() );
		add( "isNull?",   isTypeFn() );
		add( "isFixNum?", isTypeFn() );
		add( "isReal?",   isTypeFn() );
	}

	private FunctionType isTypeFn() {
		return new FunctionType(BaseType.BOOL, new Type[]{new Parameter()});
	}

	private Type anyBool() {
		return new Maybe(new Parameter());
	}

	private FunctionType binaryPredicateFn() {
		return new FunctionType(
			BaseType.BOOL,
			new Type[]{anyBool(), anyBool()}
		);
	}
}
