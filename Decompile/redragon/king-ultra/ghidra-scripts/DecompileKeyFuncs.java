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

public class DecompileKeyFuncs extends GhidraScript {
	@Override
	public void run() throws Exception {
		String outPath = getScriptArgs().length > 0 ? getScriptArgs()[0] : "ghidra-decomp.txt";
		PrintWriter pw = new PrintWriter(new FileWriter(new File(outPath)));
		pw.println("=== DECOMPILE KEY FUNCS " + currentProgram.getName() + " ===");

		String[] names = new String[] {
			"SetCurrentConfig",
			"ReadConfig",
			"UsbFinder_WriteDeviceData",
			"UsbFinder_ReadWriteDeviceData",
			"ReadCurrentDPI",
			"ReadReportRate",
			"BufferToDPILed",
			"USBReadAllFlashData",
			"UpdataUSBData",
			"ValueToDPI",
			"GetSensorDPI",
			"SetReportRateHz",
			"EnterPairByFeature",
			"SetVidPid",
			"GetUsbDeviceAttribute",
			"FindHidDevicesByDeviceId"
		};

		FunctionManager fm = currentProgram.getFunctionManager();
		ReferenceManager rm = currentProgram.getReferenceManager();
		DecompInterface decomp = new DecompInterface();
		decomp.openProgram(currentProgram);

		for (int i = 0; i < names.length; i++) {
			String name = names[i];
			Function f = null;
			for (Function cand : fm.getFunctions(true)) {
				if (name.equals(cand.getName())) {
					f = cand;
					break;
				}
			}
			pw.println();
			pw.println("################################################################");
			pw.println("## " + name);
			if (f == null) {
				pw.println("(not found)");
				continue;
			}
			Address entry = f.getEntryPoint();
			pw.println("entry=" + entry + " size=" + f.getBody().getNumAddresses());
			pw.println("--- CALLERS ---");
			ReferenceIterator refs = rm.getReferencesTo(entry);
			int c = 0;
			while (refs.hasNext() && c < 40) {
				Reference r = refs.next();
				Address fa = r.getFromAddress();
				Function caller = fm.getFunctionContaining(fa);
				pw.println("  " + fa + " <- " + (caller != null ? caller.getName() : "?"));
				c++;
			}
			pw.println("--- C ---");
			DecompileResults dr = decomp.decompileFunction(f, 90, new ConsoleTaskMonitor());
			if (dr != null && dr.getDecompiledFunction() != null) {
				String code = dr.getDecompiledFunction().getC();
				if (code.length() > 12000) {
					code = code.substring(0, 12000) + "\n/* truncated */\n";
				}
				pw.println(code);
			} else {
				pw.println("(decomp failed: " + (dr != null ? dr.getErrorMessage() : "null") + ")");
			}
		}

		pw.println();
		pw.println("DONE");
		pw.close();
		decomp.dispose();
		println("Wrote " + outPath);
	}
}
