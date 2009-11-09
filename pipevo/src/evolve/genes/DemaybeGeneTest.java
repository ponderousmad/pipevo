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
import functional.type.Maybe;
import junit.framework.TestCase;

public class DemaybeGeneTest extends TestCase {

	public void testType() {
		Gene ifGene = new IfGene(new Maybe(BaseType.FIXNUM), new NullGene(), new FixNumGenerator(1,0,1), new NullGene());
		Gene gene = new DemaybeGene(ifGene, new FixNumGenerator(0,0,1), "a");
		assertEquals(gene.type(), BaseType.FIXNUM);
	}

	public void testExpress() {
		Gene ifGene = new IfGene(new Maybe(BaseType.FIXNUM), new NullGene(), new FixNumGenerator(1,0,1), new NullGene());
		Gene gene = new DemaybeGene(ifGene, new FixNumGenerator(0,0,1), "a");
		Obj phene = gene.express(new Context(new ObjectRegistry()));
		assertNotNull(phene);
		assertEquals(phene.toString(),"(let ((dm_a (if () 1 ()))) (if dm_a dm_a 0))");
	}
}
