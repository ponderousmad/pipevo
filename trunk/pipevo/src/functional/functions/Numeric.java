/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package functional.functions;

import functional.Environment;
import functional.EvalException;
import functional.FixNum;
import functional.Function;
import functional.Null;
import functional.Obj;
import functional.Real;
import functional.True;

public class Numeric {
	static interface Operation {
		public Obj eval( int a, int b );
		public Obj eval( double a, double b );
	}

	static interface UnaryOperation {
		public Obj eval( int a );
		public Obj eval( double a );
	}

	static class Operator implements Function.Body {
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

	static class UnaryOperator implements Function.Body {
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
		env.add( new Function( name, Operator.sArgs, null, new Operator( op ) ) );
	}

	static void install( Environment env, String name, UnaryOperation op ) {
		env.add( new Function( name, UnaryOperator.sArgs, null, new UnaryOperator( op ) ) );
	}

	private static double asReal(Environment env, String name) {
		return ((Real)env.lookup(name)).value();
	}

	private interface RealFunc
	{
		double calc(double x);
	}

	static void installRealFunc( Environment env, String name, final RealFunc func ) {
		env.add( new Function( name, new String[]{"x"}, null, new Function.Body() {
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
		env.add( new Function( name, new String[]{"x", "y"}, null, new Function.Body() {
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
		env.add( new Function( name, new String[]{"x"}, null, new Function.Body() {
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
		env.add( new Function( name, new String[]{"x", "y"}, null, new Function.Body() {
			public Obj invoke(Environment env) {
				return new FixNum(func.calc(asInt(env,"x"),asInt(env,"y")));
			}
		}));
	}

	public static void install( Environment env ) {
		final Obj T= True.TRUE;
		final Obj F= Null.NULL;

		env.add( new Function( "not", new String[] { "x" }, null, new Function.Body(){
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

		env.add("PI", new Real(Math.PI));
		env.add("E", new Real(Math.E));

		installRealFunc2(env, "pow", new RealFunc2() { public double calc(double x, double y) {return Math.pow(x,y);}});

		env.add( new Function( "ciel", new String[]{"x"}, null, new Function.Body() {
			public Obj invoke(Environment env) {
				return new FixNum((int)Math.ceil(asReal(env,"x")));
			}
		}));

		env.add( new Function( "floor", new String[]{"x"}, null, new Function.Body() {
			public Obj invoke(Environment env) {
				return new FixNum((int)Math.floor(asReal(env,"x")));
			}
		}));

		env.add( new Function( "round", new String[]{"x"}, null, new Function.Body() {
			public Obj invoke(Environment env) {
				return new FixNum((int)Math.round(asReal(env,"x")));
			}
		}));
	}
}
