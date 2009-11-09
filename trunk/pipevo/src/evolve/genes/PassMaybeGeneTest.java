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
import functional.type.Maybe;
import functional.type.Type;
import junit.framework.TestCase;

public class PassMaybeGeneTest extends TestCase {

	private Gene buildPassMaybeGene() {
		FunctionType type = new FunctionType(new Maybe(BaseType.FIXNUM),new Type[]{BaseType.FIXNUM});
		Gene function = new FunctionGene(type,"l",new FixNumGenerator(1,0,1),true);
		Gene ifGene = new IfGene(new Maybe(BaseType.FIXNUM), new TrueGene(), new FixNumGenerator(0,0,1), new NullGene());
		Gene gene = new PassMaybeGene(new Maybe(BaseType.FIXNUM), function, new Gene[]{ifGene}, "a");
		return gene;
	}

	public void testType() {
		Gene gene = buildPassMaybeGene();
		assertEquals(gene.type(),new Maybe(BaseType.FIXNUM));
	}

	public void testExpress() {
		Gene gene = buildPassMaybeGene();
		Obj phene = gene.express(new Context(new ObjectRegistry()));
		assertNotNull(phene);
		String pheneString = phene.toString();
		assertEquals(pheneString,"(let ((pm_a0 (if #t 0 ()))) (if pm_a0 ((lambda (lp0) 1) pm_a0) ()))");
	}
}
