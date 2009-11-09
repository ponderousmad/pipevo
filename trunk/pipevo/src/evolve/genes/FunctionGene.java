/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package evolve.genes;

import java.io.Serializable;

import evolve.Context;
import evolve.Gene;
import evolve.Mutation;
import functional.Cons;
import functional.Null;
import functional.Obj;
import functional.Symbol;
import functional.type.FunctionType;
import functional.type.Type;

public class FunctionGene implements Gene, Serializable {
	private static final long serialVersionUID = -8494109078787886616L;
	private FunctionType mType;
	private String mName;
	private Gene mBody;
	private boolean mIsLambda;

	public FunctionGene( FunctionType type, String name, Gene body ) {
		mType = type;
		mName = name;
		mBody = body;
		mIsLambda = false;
	}

	public FunctionGene( FunctionType type, String name, Gene body, boolean isLambda ) {
		mType = type;
		mName = name;
		mBody = body;
		mIsLambda = isLambda;
	}

	public Type type() {
		return mType;
	}

	public Obj express(Context context) {
		String[] arguments = argumentNames();
		pushArguments( context, arguments );
		Cons body = Cons.list(mBody.express(context));
		popArguments( context );

		if( mIsLambda ) {
			return expressLambda( argumentList(arguments), body );
		} else {
			return expressFunction( mName, argumentList(arguments), body );
		}
	}

	private Obj argumentList( String[] arguments ) {
		Obj list = Null.NULL;
		for( int i = arguments.length - 1; i >=0; --i ) {
			list = new Cons( new Symbol( arguments[i] ), list );
		}
		return list;
	}

	private Obj expressFunction(String name, Obj arguments, Cons body) {
		return Cons.prependList( new Symbol("define"), Cons.prependList(new Symbol(mName), arguments), body);
	}

	private Obj expressLambda(Obj arguments, Cons body) {
		return Cons.prependList(new Symbol("lambda"), arguments, body);
	}

	private void pushArguments(Context context, String[] argumentNames ) {
		for( int i = 0; i < argumentNames.length; ++i ) {
			context.pushSymbol( argumentNames[i], mType.argumentTypes()[i] );
		}
	}

	private void popArguments(Context context) {
		context.popSymbols( mType.argumentTypes().length );
	}

	public static String[] argumentNames( FunctionType functionType, String baseName ) {
		baseName = baseName + "p";
		String[] arguments = new String[ functionType.argumentTypes().length ];
		for( int i = 0; i < arguments.length; ++i ) {
			arguments[i] = baseName + Integer.toString(i);
		}
		return arguments;
	}

	public String[] argumentNames() {
		return argumentNames( mType, mName );
	}

	public Gene mutate(Mutation mutation, Context context, java.util.Random random) {
		pushArguments(context, argumentNames());
		Gene mutatedBody = mutation.mutateGene(mType.returnType(), mBody, context, random);
		popArguments(context);

		if( mutatedBody != mBody ) {
			return new FunctionGene(mType, mName, mutatedBody, mIsLambda);
		} else {
			return this;
		}
	}

}
