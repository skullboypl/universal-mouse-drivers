//@runtime Java
import ghidra.app.script.GhidraScript;
import ghidra.program.model.address.Address;
import ghidra.program.model.listing.Function;
import ghidra.program.model.listing.FunctionManager;
import ghidra.program.model.mem.Memory;
import ghidra.program.model.symbol.Reference;
import ghidra.program.model.symbol.ReferenceIterator;
import ghidra.program.model.symbol.ReferenceManager;
import ghidra.program.model.symbol.Symbol;
import ghidra.program.model.symbol.SymbolIterator;
import ghidra.program.model.symbol.SymbolTable;
import java.io.File;
import java.io.FileWriter;
import java.io.PrintWriter;
import java.nio.charset.StandardCharsets;

public class DumpHidProtocolHints extends GhidraScript {
	@Override
	public void run() throws Exception {
		String outPath = getScriptArgs().length > 0 ? getScriptArgs()[0] : "ghidra-dump.txt";
		PrintWriter pw = new PrintWriter(new FileWriter(new File(outPath)));
		pw.println("=== PROGRAM " + currentProgram.getName() + " ===");
		pw.println("language=" + currentProgram.getLanguageID());

		Memory mem = currentProgram.getMemory();
		ReferenceManager rm = currentProgram.getReferenceManager();
		FunctionManager fm = currentProgram.getFunctionManager();
		SymbolTable st = currentProgram.getSymbolTable();

		String[] keys = new String[] {
			"HidD_SetFeature",
			"HidD_GetFeature",
			"HidD_GetAttributes",
			"SetCurrentConfig",
			"ReadConfig",
			"WriteDeviceData",
			"ReadWriteDeviceData",
			"ReadCurrentDPI",
			"ReadReportRate",
			"CS_UsbServer_SetCurrentConfig",
			"CS_UsbFinder_WriteDeviceData",
			"ReportId",
			"FeatureReportByteLength",
			"BufferToDPI",
			"MacroKeyToBuffer",
			"ReadAllFlashData"
		};

		for (int k = 0; k < keys.length; k++) {
			String key = keys[k];
			pw.println();
			pw.println("## KEY: " + key);
			byte[] needle = key.getBytes(StandardCharsets.US_ASCII);
			Address start = mem.getMinAddress();
			int found = 0;
			while (found < 20) {
				Address addr = mem.findBytes(start, needle, null, true, monitor);
				if (addr == null) {
					break;
				}
				pw.println("STR @ " + addr);
				ReferenceIterator refs = rm.getReferencesTo(addr);
				int count = 0;
				while (refs.hasNext() && count < 25) {
					Reference r = refs.next();
					Address fa = r.getFromAddress();
					Function f = fm.getFunctionContaining(fa);
					String fname = f != null ? f.getName() : "?";
					String fentry = f != null ? f.getEntryPoint().toString() : "?";
					pw.println("  XREF " + fa + " type=" + r.getReferenceType() + " func=" + fname + " entry=" + fentry);
					count++;
				}
				if (count == 0) {
					pw.println("  (no xrefs)");
				}
				start = addr.add(1);
				found++;
			}
			if (found == 0) {
				pw.println("  (string not found in memory)");
			}
		}

		pw.println();
		pw.println("## EXTERNAL INTERESTING");
		SymbolIterator ext = st.getExternalSymbols();
		while (ext.hasNext()) {
			Symbol s = ext.next();
			String n = s.getName();
			String low = n.toLowerCase();
			if (low.contains("hid") || low.contains("writefile") || low.contains("deviceiocontrol") || low.contains("setupdi")) {
				pw.println("EXT " + n + " @ " + s.getAddress());
				ReferenceIterator refs = rm.getReferencesTo(s.getAddress());
				int c = 0;
				while (refs.hasNext() && c < 30) {
					Reference r = refs.next();
					Address fa = r.getFromAddress();
					Function f = fm.getFunctionContaining(fa);
					pw.println("  XREF " + fa + " func=" + (f != null ? f.getName() : "?"));
					c++;
				}
			}
		}

		pw.println();
		pw.println("DONE");
		pw.close();
		println("Wrote " + outPath);
	}
}
