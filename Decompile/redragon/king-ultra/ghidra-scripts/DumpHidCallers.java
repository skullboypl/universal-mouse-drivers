//@runtime Java
import ghidra.app.decompiler.DecompInterface;
import ghidra.app.decompiler.DecompileResults;
import ghidra.app.script.GhidraScript;
import ghidra.program.model.address.Address;
import ghidra.program.model.listing.Function;
import ghidra.program.model.listing.FunctionIterator;
import ghidra.program.model.listing.FunctionManager;
import ghidra.program.model.listing.Instruction;
import ghidra.program.model.listing.InstructionIterator;
import ghidra.program.model.listing.Listing;
import ghidra.program.model.mem.Memory;
import ghidra.program.model.mem.MemoryAccessException;
import ghidra.program.model.symbol.Symbol;
import ghidra.program.model.symbol.SymbolIterator;
import ghidra.program.model.symbol.SymbolTable;
import ghidra.util.task.ConsoleTaskMonitor;
import java.io.File;
import java.io.FileWriter;
import java.io.PrintWriter;
import java.nio.charset.StandardCharsets;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.Set;

public class DumpHidCallers extends GhidraScript {
	@Override
	public void run() throws Exception {
		String outPath = getScriptArgs().length > 0 ? getScriptArgs()[0] : "ghidra-callers.txt";
		PrintWriter pw = new PrintWriter(new FileWriter(new File(outPath)));
		pw.println("=== PROGRAM " + currentProgram.getName() + " ===");

		Memory mem = currentProgram.getMemory();
		Listing listing = currentProgram.getListing();
		FunctionManager fm = currentProgram.getFunctionManager();
		SymbolTable st = currentProgram.getSymbolTable();

		pw.println();
		pw.println("## SYMBOLS CS_Usb / Hid / Feature");
		SymbolIterator all = st.getAllSymbols(true);
		int symCount = 0;
		while (all.hasNext()) {
			Symbol s = all.next();
			String n = s.getName();
			if (n.contains("CS_Usb") || n.contains("HidD_") || n.toLowerCase().contains("setfeature")
					|| n.toLowerCase().contains("getfeature") || n.contains("WriteDevice")
					|| n.contains("SetCurrentConfig") || n.contains("ReadConfig")) {
				pw.println(s.getSymbolType() + " " + n + " @ " + s.getAddress() + " parent=" + s.getParentNamespace());
				symCount++;
				if (symCount > 400) {
					pw.println("... truncated symbols");
					break;
				}
			}
		}
		pw.println("symbolHits=" + symCount);

		pw.println();
		pw.println("## FUNCTION NAMES MATCHING");
		FunctionIterator funcs = fm.getFunctions(true);
		int fcount = 0;
		while (funcs.hasNext()) {
			Function f = funcs.next();
			String n = f.getName();
			String low = n.toLowerCase();
			if (low.contains("usb") || low.contains("hid") || low.contains("dpi") || low.contains("feature")
					|| low.contains("config") || low.contains("macro") || low.contains("report")) {
				pw.println(f.getEntryPoint() + " " + n);
				fcount++;
				if (fcount > 300) {
					pw.println("... truncated funcs");
					break;
				}
			}
		}
		pw.println("funcHits=" + fcount);

		String[] keys = new String[] {
			"HidD_SetFeature",
			"HID.DLL",
			"CS_UsbServer_SetCurrentConfig",
			"CS_UsbFinder_WriteDeviceData",
			"CS_UsbFinder_ReadWriteDeviceData",
			"FeatureReportByteLength",
			"ReportId",
			"BufferToDPI",
			"GetProcAddress"
		};

		DecompInterface decomp = new DecompInterface();
		decomp.openProgram(currentProgram);

		for (int k = 0; k < keys.length; k++) {
			String key = keys[k];
			pw.println();
			pw.println("## IMM32 / NEAR REFS: " + key);
			byte[] needle = key.getBytes(StandardCharsets.US_ASCII);
			Address start = mem.getMinAddress();
			int found = 0;
			Set<Address> seenFuncs = new LinkedHashSet<Address>();
			while (found < 8) {
				Address addr = mem.findBytes(start, needle, null, true, monitor);
				if (addr == null) {
					break;
				}
				pw.println("STR @ " + addr);
				byte[] imm = toImm32Le(addr);
				Set<Address> pushes = findImm32(mem, imm, 80);
				pw.println("  push/imm hits=" + pushes.size());
				for (Address p : pushes) {
					Function f = fm.getFunctionContaining(p);
					pw.println("  IMM @ " + p + " func=" + (f != null ? f.getName() : "?")
							+ " entry=" + (f != null ? f.getEntryPoint() : "?"));
					if (f != null) {
						seenFuncs.add(f.getEntryPoint());
					}
					dumpNearbyInsns(pw, listing, p, 6);
				}
				// also scan ±0x40 around string for code pointers stored nearby (export tables)
				dumpNearbyBytes(pw, mem, addr, 16);
				start = addr.add(1);
				found++;
			}

			int decompLimit = 0;
			for (Address entry : seenFuncs) {
				if (decompLimit >= 6) {
					break;
				}
				Function f = fm.getFunctionAt(entry);
				if (f == null) {
					continue;
				}
				pw.println("  --- DECOMP " + f.getName() + " @ " + entry + " ---");
				DecompileResults dr = decomp.decompileFunction(f, 60, new ConsoleTaskMonitor());
				if (dr != null && dr.getDecompiledFunction() != null) {
					String c = dr.getDecompiledFunction().getC();
					if (c.length() > 4500) {
						c = c.substring(0, 4500) + "\n/* truncated */\n";
					}
					pw.println(c);
				} else {
					pw.println("  (decomp failed)");
				}
				decompLimit++;
			}
		}

		pw.println();
		pw.println("## IMPORT THUNKS (external entry points containing hid/write/device)");
		SymbolIterator ext = st.getExternalSymbols();
		while (ext.hasNext()) {
			Symbol s = ext.next();
			String n = s.getName().toLowerCase();
			if (n.contains("hid") || n.contains("writefile") || n.contains("deviceiocontrol")
					|| n.contains("getprocaddress") || n.contains("loadlibrary") || n.contains("createfile")) {
				pw.println("EXT " + s.getName() + " @ " + s.getAddress());
			}
		}

		pw.println();
		pw.println("DONE");
		pw.close();
		decomp.dispose();
		println("Wrote " + outPath);
	}

	private static byte[] toImm32Le(Address addr) {
		long off = addr.getOffset();
		return new byte[] {
			(byte) (off & 0xff),
			(byte) ((off >> 8) & 0xff),
			(byte) ((off >> 16) & 0xff),
			(byte) ((off >> 24) & 0xff)
		};
	}

	private Set<Address> findImm32(Memory mem, byte[] imm, int max) throws Exception {
		Set<Address> out = new LinkedHashSet<Address>();
		Address start = mem.getMinAddress();
		while (out.size() < max) {
			Address hit = mem.findBytes(start, imm, null, true, monitor);
			if (hit == null) {
				break;
			}
			out.add(hit);
			start = hit.add(1);
		}
		return out;
	}

	private void dumpNearbyInsns(PrintWriter pw, Listing listing, Address at, int radius) {
		InstructionIterator it = listing.getInstructions(at, true);
		int n = 0;
		Instruction prev = listing.getInstructionBefore(at);
		for (int i = 0; i < radius && prev != null; i++) {
			Instruction p2 = listing.getInstructionBefore(prev.getAddress());
			if (p2 == null) {
				break;
			}
			prev = p2;
		}
		Address walk = prev != null ? prev.getAddress() : at;
		InstructionIterator back = listing.getInstructions(walk, true);
		while (back.hasNext() && n < radius * 2 + 1) {
			Instruction ins = back.next();
			pw.println("    " + ins.getAddress() + "  " + ins.toString());
			n++;
			if (ins.getAddress().compareTo(at) > 0 && n > radius) {
				break;
			}
		}
	}

	private void dumpNearbyBytes(PrintWriter pw, Memory mem, Address addr, int n) {
		try {
			byte[] b = new byte[n];
			mem.getBytes(addr, b);
			StringBuilder sb = new StringBuilder("  bytes:");
			for (int i = 0; i < b.length; i++) {
				sb.append(String.format(" %02x", b[i] & 0xff));
			}
			pw.println(sb.toString());
		} catch (MemoryAccessException e) {
			pw.println("  (bytes unreadable)");
		}
	}
}
