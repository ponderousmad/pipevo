/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package pipes.stats;

import java.net.InetAddress;
import java.net.UnknownHostException;

import java.io.File;
import java.io.IOException;
import java.io.PrintWriter;
import java.io.BufferedWriter;
import java.io.FileWriter;

import pipes.ai.players.Player;

/**
 * Keep track of stats by writing them to disk.
 */
public class StatsManager {

	/**
	 * Get the stat tracker for the current session.
	 */
	public static Session getSession() {
		return mActiveSession;
	}

	private static Session mActiveSession = new Session();

	/**
	 * Write the stats to disk, appending to any existing stats files.
	 */
	public static void writeStats() {
		String fileName = new String("Pipes_Player_Header.csv");
		PrintWriter statsWriter = getStatsWriter(fileName);
		writePlayerSessionHeader( statsWriter );
		statsWriter.close();

		for( Player player : Player.values() ) {
			fileName = new String("Pipes_" + player.toString() + "_ver" + player.version + ".csv");
			statsWriter = getStatsWriter(fileName);
			writePlayerSession( statsWriter, mActiveSession, player );
			statsWriter.close();
		}
	}

	private static void writePlayerSession(PrintWriter writer, Session session, Player player) {
		Session.Results results = session.results(player);
		if( results.count() > 0 ) {
			for( int i = 0; i < results.count(); ++i ) {
				writer.println( player.toString() + " ver " + player.version + ","
						+ results.mRuns.get( i ) + ","
						+ results.mSeeds.get( i ) );
			}
		}
	}

	private static void writePlayerSessionHeader(PrintWriter writer) {
		writer.println("Player, Run Result, Seed");
	}

	/**
	 * Build a PrintWriter for the specified file name, set to append if the file already exists.
	 */
	private static PrintWriter getStatsWriter(String fileName) {
		assert(fileName.length() > 0);
		File statsFile = new File( getStatsDir(), fileName );

		PrintWriter statsWriter;
		try {
			statsWriter = new PrintWriter( new BufferedWriter( new FileWriter( statsFile, true ) ) );
		} catch( IOException e) {
			throw new RuntimeException( "Error writing to file." );
		}
		return statsWriter;
	}

	/**
	 * Get a computer specific folder for writing stats files.
	 */
	private static File getStatsDir() {
		String statsDirName;
		try {
			InetAddress addr = InetAddress.getLocalHost();
			statsDirName = addr.getHostName();
		} catch( UnknownHostException e ) {
			statsDirName = "Local";
		}

		File statsDir = new File( new File( System.getProperty( "user.dir" ), "stats" ), statsDirName );
		try {
			statsDir.mkdirs();
		} catch( SecurityException e ) {
			System.out.println( "Invalid permsions." );
			throw e;
		}
		return statsDir;
	}
}
