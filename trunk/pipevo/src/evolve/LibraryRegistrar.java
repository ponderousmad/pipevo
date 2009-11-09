/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package evolve;

import functional.Symbol;
import functional.type.BaseType;
import functional.type.FunctionType;
import functional.type.ListType;
import functional.type.Parameter;
import functional.type.Type;

public class LibraryRegistrar {
	private ObjectRegistry mReg;

	public void add(String name, Type type) {
		mReg.add(new Symbol(name), type);
	}

	public static void registerLibrary(ObjectRegistry reg) {
		LibraryRegistrar registrar = new LibraryRegistrar();
		registrar.register( reg );
	}

	public void register( ObjectRegistry reg ) {
		mReg = reg;
		registerList();
	}

	private void registerList() {
		add("length", new FunctionType(BaseType.FIXNUM, new Type[]{new ListType(new Parameter())}));
		Parameter p = new Parameter();
		add("first", new FunctionType(p, new Type[]{new ListType(p)}));
		p = new Parameter();
		add("second", new FunctionType(p, new Type[]{new ListType(p)}));
		p = new Parameter();
		add("third", new FunctionType(p, new Type[]{new ListType(p)}));
		p = new Parameter();
		add("last", new FunctionType(p, new Type[]{new ListType(p)}));
		p = new Parameter();
		add("nth", new FunctionType(p, new Type[]{new ListType(p), BaseType.FIXNUM}));
		p = new Parameter();
		add("append", new FunctionType(new ListType(p), new Type[]{new ListType(p), p}));
		p = new Parameter();
		add("remove", new FunctionType(new ListType(p), new Type[]{new ListType(p), new FunctionType(BaseType.BOOL, new Type[]{p})}));
		p = new Parameter();
		add("reverse", new FunctionType(new ListType(p), new Type[]{new ListType(p)}));
		p = new Parameter();
		Parameter q = new Parameter();
		add("map", new FunctionType(new ListType(q), new Type[]{new FunctionType(q, new Type[]{p}),new ListType(p)}));
		p = new Parameter();
		q = new Parameter();
		add("reduce", new FunctionType(q, new Type[]{new FunctionType(q, new Type[]{p, q}), new ListType(p), q}));
	}
}
