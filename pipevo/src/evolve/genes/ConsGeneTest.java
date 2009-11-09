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
import functional.type.ConsType;
import junit.framework.TestCase;

public class ConsGeneTest extends TestCase {

	public void testType() {
		Gene gene = new ConsGene(new ConsType(BaseType.NULL,BaseType.NULL), new NullGene(), new NullGene());
		assertEquals(gene.type(), new ConsType(BaseType.NULL,BaseType.NULL));
	}

	public void testExpress() {
		Gene gene = new ConsGene(new ConsType(BaseType.NULL,BaseType.NULL), new NullGene(), new NullGene());
		Obj phene = gene.express(new Context(new ObjectRegistry()));
		assertNotNull(phene);
		assertEquals(phene.toString(),"(cons () ())");
	}
}
