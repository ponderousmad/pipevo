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

public class ApplicationGeneTest extends TestCase {
	public void testType() {
		FunctionType type = new FunctionType(BaseType.FIXNUM,new Type[]{BaseType.FIXNUM});
		Gene gene = new ApplicationGene(new FunctionGene(type,"l",new FixNumGenerator(1,0,1),true), new Gene[]{new FixNumGenerator(0,0,1)});
		assertEquals(gene.type(), BaseType.FIXNUM);
	}

	public void testExpress() {
		FunctionType type = new FunctionType(BaseType.FIXNUM,new Type[]{BaseType.FIXNUM});
		Gene gene = new ApplicationGene(new FunctionGene(type,"l",new FixNumGenerator(1,0,1),true), new Gene[]{new FixNumGenerator(0,0,1)});
		Obj phene = gene.express(new Context(new ObjectRegistry()));
		assertNotNull(phene);
		assertEquals(phene.toString(), "((lambda (lp0) 1) 0)");
	}
}
