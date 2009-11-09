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
import functional.type.ListType;
import junit.framework.TestCase;

public class ListGeneTest extends TestCase {

	public void testType() {
		Gene gene = new ListGene(new ListType(BaseType.FIXNUM));
		assertEquals(gene.type(), new ListType(BaseType.FIXNUM));
	}

	public void testExpress() {
		ListGene gene = new ListGene(new ListType(BaseType.FIXNUM));
		Context c = new Context(new ObjectRegistry());
		Obj phene = gene.express(c);
		assertNotNull(phene);
		assertEquals(phene.toString(),"(list)");

		gene.add(new FixNumGenerator(0,0,2));
		phene = gene.express(c);
		assertNotNull(phene);
		assertEquals(phene.toString(),"(list 0)");

		gene.add(new FixNumGenerator(1,0,2));
		phene = gene.express(c);
		assertNotNull(phene);
		assertEquals(phene.toString(),"(list 0 1)");

		gene.add(new FixNumGenerator(2,0,2));
		phene = gene.express(c);
		assertNotNull(phene);
		assertEquals(phene.toString(),"(list 0 1 2)");
	}

	public void testCopy() {
		ListGene gene = new ListGene(new ListType(BaseType.FIXNUM));
		gene.add(new FixNumGenerator(0,0,2));
		gene.add(new FixNumGenerator(1,0,2));
		gene.add(new FixNumGenerator(2,0,2));

		Gene copy = gene.copy();
		assertNotSame(gene,copy);

		Context c = new Context(new ObjectRegistry());
		Obj phene = gene.express(c);
		Obj copyPhene = copy.express(c);
		assertEquals(phene.toString(),copyPhene.toString());
	}

}
