/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package evolve.genes;

import evolve.Context;
import evolve.Gene;
import evolve.ObjectRegistry;
import functional.Obj;
import functional.type.BaseType;
import functional.type.FunctionType;
import functional.type.Type;
import junit.framework.TestCase;

public class FunctionGeneTest extends TestCase {

	public void testType() {
		Gene gene = new FunctionGene(new FunctionType(BaseType.FIXNUM, new Type[]{BaseType.FIXNUM}),"fn",new FixNumGenerator(1,0,1));
		assertEquals(gene.type(), new FunctionType(BaseType.FIXNUM, new Type[]{BaseType.FIXNUM}));
	}

	public void testExpressNoArgs() {
		Gene gene = new FunctionGene(new FunctionType(BaseType.FIXNUM, new Type[]{}),"fn",new FixNumGenerator(1,0,1));
		Obj phene = gene.express(new Context(new ObjectRegistry()));
		assertNotNull(phene);
		assertEquals(phene.toString(), "(define (fn) 1)");
	}

	public void testExpressOneArg() {
		Gene gene = new FunctionGene(new FunctionType(BaseType.FIXNUM, new Type[]{BaseType.FIXNUM}),"fn",new FixNumGenerator(1,0,1));
		Obj phene = gene.express(new Context(new ObjectRegistry()));
		assertNotNull(phene);
		assertEquals(phene.toString(), "(define (fn fnp0) 1)");
	}

	public void testExpressTwoArgs() {
		Gene gene = new FunctionGene(new FunctionType(BaseType.FIXNUM, new Type[]{BaseType.FIXNUM,BaseType.BOOL}),"fn",new FixNumGenerator(1,0,1));
		Obj phene = gene.express(new Context(new ObjectRegistry()));
		assertNotNull(phene);
		assertEquals(phene.toString(), "(define (fn fnp0 fnp1) 1)");
	}

	public void testExpressLambda() {
		Gene gene = new FunctionGene(new FunctionType(BaseType.FIXNUM, new Type[]{BaseType.FIXNUM}),"fn",new FixNumGenerator(1,0,1), true);
		Obj phene = gene.express(new Context(new ObjectRegistry()));
		assertNotNull(phene);
		assertEquals(phene.toString(), "(lambda (fnp0) 1)");
	}
}
