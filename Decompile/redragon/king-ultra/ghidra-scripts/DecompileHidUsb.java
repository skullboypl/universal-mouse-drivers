//@runtime Java
import ghidra.app.decompiler.DecompInterface;
import ghidra.app.decompiler.DecompileResults;
import ghidra.app.script.GhidraScript;
import ghidra.program.model.address.Address;
import ghidra.program.model.listing.Function;
import ghidra.program.model.listing.FunctionManager;
import ghidra.program.model.symbol.Reference;
import ghidra.program.model.symbol.ReferenceIterator;
import ghidra.program.model.symbol.ReferenceManager;
import ghidra.util.task.ConsoleTaskMonitor;
import java.io.File;
import java.io.FileWriter;
import java.io.PrintWriter;

public class DecompileHidUsb extends GhidraScript {
	@Override
	public void run() throws Exception {
		String outPath = getScriptArgs().length > 0 ? getScriptArgs()[0] : "ghidra-hidusb-decomp.txt";
		PrintWriter pw = new PrintWriter(new FileWriter(new File(outPath)));
		pw.println("=== HIDUSB DECOMP " + currentProgram.getName() + " ===");

		String[] names = new String[] {
			"CS_UsbServer_SetCurrentConfig",
			"CS_UsbServer_ReadConfig",
			"CS_UsbServer_ReadCurrentDPI",
			"CS_UsbServer_ReadReportRate",
			"CS_UsbServer_ReadAllFlashData",
			"CS_UsbFinder_WriteDeviceData",
			"CS_UsbFinder_ReadWriteDeviceData",
			"CS_BufferToDPILed",
			"CS_ProtocolDataParser",
			"CS_MacroKeyToBuffer",
			"UsbReaderWriterServer",
			"FUN_180015cb0"
		};

		FunctionManager fm = currentProgram.getFunctionManager();
		ReferenceManager rm = currentProgram.getReferenceManager();
		DecompInterface decomp = new DecompInterface();
		decomp.openProgram(currentProgram);

		// also resolve HidD_SetFeature callers by name search of functions containing SetFeature xref target
		Address setFeatureExt = null;
		for (ghidra.program.model.symbol.Symbol s : currentProgram.getSymbolTable().getExternalSymbols()) {
			if ("HidD_SetFeature".equals(s.getName())) {
				setFeatureExt = s.getAddress();
				break;
			}
		}
		if (setFeatureExt != null) {
			pw.println();
			pw.println("## CALLERS OF HidD_SetFeature");
			ReferenceIterator refs = rm.getReferencesTo(setFeatureExt);
			while (refs.hasNext()) {
				Reference r = refs.next();
				Function f = fm.getFunctionContaining(r.getFromAddress());
				pw.println("  " + r.getFromAddress() + " in " + (f != null ? f.getName() + " @ " + f.getEntryPoint() : "?"));
				if (f != null) {
					boolean already = false;
					for (int i = 0; i < names.length; i++) {
						if (names[i].equals(f.getName())) {
							already = true;
							break;
						}
					}
					if (!already) {
						String[] n2 = new String[names.length + 1];
						System.arraycopy(names, 0, n2, 0, names.length);
						n2[names.length] = f.getName();
						names = n2;
					}
				}
			}
		}

		for (int i = 0; i < names.length; i++) {
			String name = names[i];
			Function f = null;
			for (Function cand : fm.getFunctions(true)) {
				if (name.equals(cand.getName())) {
					f = cand;
					break;
				}
			}
			if (f == null && name.startsWith("FUN_")) {
				Address a = currentProgram.getAddressFactory().getAddress(name.substring(4));
				f = fm.getFunctionAt(a);
			}
			pw.println();
			pw.println("################################################################");
			pw.println("## " + name);
			if (f == null) {
				pw.println("(not found)");
				continue;
			}
			pw.println("entry=" + f.getEntryPoint() + " size=" + f.getBody().getNumAddresses());
			pw.println("--- CALLERS ---");
			ReferenceIterator rin = rm.getReferencesTo(f.getEntryPoint());
			int c = 0;
			while (rin.hasNext() && c < 25) {
				Reference r = rin.next();
				Function caller = fm.getFunctionContaining(r.getFromAddress());
				pw.println("  " + r.getFromAddress() + " <- " + (caller != null ? caller.getName() : "?"));
				c++;
			}
			pw.println("--- C ---");
			DecompileResults dr = decomp.decompileFunction(f, 120, new ConsoleTaskMonitor());
			if (dr != null && dr.getDecompiledFunction() != null) {
				String code = dr.getDecompiledFunction().getC();
				if (code.length() > 16000) {
					code = code.substring(0, 16000) + "\n/* truncated */\n";
				}
				pw.println(code);
			} else {
				pw.println("(decomp failed)");
			}
		}

		pw.println();
		pw.println("DONE");
		pw.close();
		decomp.dispose();
		println("Wrote " + outPath);
	}
}
