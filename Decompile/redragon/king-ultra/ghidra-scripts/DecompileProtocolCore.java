//@runtime Java
import ghidra.app.decompiler.DecompInterface;
import ghidra.app.decompiler.DecompileResults;
import ghidra.app.script.GhidraScript;
import ghidra.program.model.address.Address;
import ghidra.program.model.listing.Function;
import ghidra.program.model.listing.FunctionManager;
import ghidra.program.model.symbol.Symbol;
import ghidra.program.model.symbol.SymbolIterator;
import ghidra.util.task.ConsoleTaskMonitor;
import java.io.File;
import java.io.FileWriter;
import java.io.PrintWriter;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

public class DecompileProtocolCore extends GhidraScript {
	@Override
	public void run() throws Exception {
		String outPath = getScriptArgs().length > 0 ? getScriptArgs()[0] : "ghidra-protocol-core.txt";
		PrintWriter pw = new PrintWriter(new FileWriter(new File(outPath)));
		pw.println("=== PROTOCOL CORE " + currentProgram.getName() + " ===");

		String[] names = new String[] {
			"FUN_18000f060",
			"UsbServer_ReadFalshData",
			"CS_UsbServer_ReadFalshData",
			"MouseConfigParser",
			"FUN_180015cb0",
			"FUN_180014cb0",
			"UsbReaderWriterServer",
			"CS_UsbServer_SetClearSetting",
			"CS_UsbServer_SetLongRangeMode",
			"CS_UsbServer_ReadBatteryLevel",
			"CS_UsbServer_ReadOnLine",
			"CS_UsbServer_ReadVersion",
			"CS_UsbServer_SetPCDriverStatus",
			"CS_UsbServer_EnterDonglePair",
			"CS_ProtocolDataCompareUpdate",
			"CS_UsbFinder_GetBatteryLevel"
		};

		// also collect all CS_UsbServer_* / CS_UsbFinder_* / CS_*Buffer* exports
		SymbolIterator sit = currentProgram.getSymbolTable().getSymbolIterator();
		Set<String> extras = new LinkedHashSet<String>();
		while (sit.hasNext()) {
			Symbol s = sit.next();
			String n = s.getName();
			if (n.startsWith("CS_UsbServer_") || n.startsWith("CS_UsbFinder_") || n.startsWith("CS_Buffer")
					|| n.startsWith("CS_Protocol") || n.startsWith("CS_Macro") || n.startsWith("CS_Get")
					|| n.equals("MouseConfigParser") || n.contains("ReadFalsh") || n.contains("ReadFlash")) {
				extras.add(n);
			}
		}
		pw.println("export-like symbols=" + extras.size());
		for (String e : extras) {
			pw.println("  SYM " + e);
		}

		List<String> all = new ArrayList<String>();
		for (int i = 0; i < names.length; i++) {
			all.add(names[i]);
		}
		for (String e : extras) {
			if (!all.contains(e)) {
				all.add(e);
			}
		}

		FunctionManager fm = currentProgram.getFunctionManager();
		DecompInterface decomp = new DecompInterface();
		decomp.openProgram(currentProgram);

		int done = 0;
		for (String name : all) {
			if (done >= 45) {
				pw.println("\n/* truncated type list */");
				break;
			}
			Function f = findFunc(fm, name);
			if (f == null) {
				continue;
			}
			// skip tiny trampolines that already dumped unless core
			long sz = f.getBody().getNumAddresses();
			boolean force = name.contains("f060") || name.contains("ReadFalsh") || name.contains("MouseConfig")
					|| name.contains("015cb0") || name.contains("014cb0") || name.contains("UsbReaderWriter")
					|| name.contains("CompareUpdate") || name.contains("SetLongRange")
					|| name.contains("SetClear") || name.contains("ReadBattery") || name.contains("ReadVersion")
					|| name.contains("SetPCDriver") || name.contains("ReadOnLine");
			if (!force && sz <= 20 && !name.startsWith("CS_UsbServer_Set") && !name.startsWith("CS_UsbServer_Read")) {
				continue;
			}
			pw.println();
			pw.println("################################################################");
			pw.println("## " + f.getName() + " @ " + f.getEntryPoint() + " size=" + sz);
			DecompileResults dr = decomp.decompileFunction(f, 120, new ConsoleTaskMonitor());
			if (dr != null && dr.getDecompiledFunction() != null) {
				String code = dr.getDecompiledFunction().getC();
				if (code.length() > 14000) {
					code = code.substring(0, 14000) + "\n/* truncated */\n";
				}
				pw.println(code);
			} else {
				pw.println("(decomp failed)");
			}
			done++;
		}

		pw.println("\nDONE funcs=" + done);
		pw.close();
		decomp.dispose();
		println("Wrote " + outPath);
	}

	private Function findFunc(FunctionManager fm, String name) {
		if (name.startsWith("FUN_")) {
			try {
				Address a = currentProgram.getAddressFactory().getAddress(name.substring(4));
				Function f = fm.getFunctionAt(a);
				if (f != null) {
					return f;
				}
			} catch (Exception ignored) {
			}
		}
		for (Function cand : fm.getFunctions(true)) {
			if (name.equals(cand.getName())) {
				return cand;
			}
		}
		return null;
	}
}
