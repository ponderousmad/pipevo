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
import junit.framework.TestCase;

public class IfGeneTest extends TestCase {
	public void testType() {
		Gene ifGene = new IfGene(
				BaseType.FIXNUM,
				new NullGene(),
				new FixNumGenerator(0,0,1),
				new FixNumGenerator(1,0,1)
		);
		assertEquals(ifGene.type(),BaseType.FIXNUM);
	}

	public void testExpress() {
		Context c = new Context(new ObjectRegistry());

		Gene gene = new IfGene(
				BaseType.FIXNUM,
				new NullGene(),
				new FixNumGenerator(0,0,1),
				new FixNumGenerator(1,0,1)
		);

		Obj result = gene.express(c);
		assertNotNull(result);
		assertEquals("(if () 0 1)", result.toString());
	}
}
