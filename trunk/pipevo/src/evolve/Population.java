/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package evolve;

import java.io.FileOutputStream;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.ObjectOutput;
import java.io.ObjectOutputStream;
import java.io.ObjectInputStream;
import java.util.Iterator;
import java.util.List;

import functional.type.CompareTypes;
import functional.type.FunctionType;

public class Population implements java.lang.Iterable<Genome>{
	FunctionType mTarget;
	List<Genome> mCrowd = new java.util.ArrayList<Genome>();

	public Population(FunctionType target) {
		mTarget = target;
	}

	public boolean isTarget(FunctionType target) {
		return CompareTypes.equalModuloParameters(mTarget, target);
	}

	public Iterator<Genome> iterator() {
		return mCrowd.iterator();
	}

	public void add(Genome genome) {
		mCrowd.add(genome);
	}

	public Genome get(int i) {
		return mCrowd.get(i);
	}

	public int size() {
		return mCrowd.size();
	}

	public void store(String path) {
		FileOutputStream f;
		try {
			f = new FileOutputStream(path);
			ObjectOutput s = new ObjectOutputStream(f);
			s.writeObject(mTarget);
			s.writeInt(mCrowd.size());
			for( Genome genome : mCrowd ) {
				s.writeObject(genome);
			}
			s.flush();
			s.close();
		} catch (IOException e) {
			e.printStackTrace(System.out);
		}
	}

	static public Population load(String path) {
		FileInputStream f;
		try {
			f = new FileInputStream(path);
			ObjectInputStream s = new ObjectInputStream(f);
			Population pop = new Population((FunctionType)s.readObject());
			int count = s.readInt();
			for( int i = 0; i < count; ++i) {
				pop.mCrowd.add( (Genome)s.readObject() );
			}
			s.close();
			return pop;
		} catch (IOException e) {
			e.printStackTrace(System.out);
		} catch (ClassNotFoundException e) {
			e.printStackTrace(System.out);
		} catch (ClassCastException e) {
			e.printStackTrace(System.out);
		}
		return null;
	}
}
