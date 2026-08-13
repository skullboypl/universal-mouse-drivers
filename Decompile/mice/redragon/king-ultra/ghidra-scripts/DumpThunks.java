//@runtime Java
import ghidra.app.script.GhidraScript;
import ghidra.program.model.address.Address;
import ghidra.program.model.address.AddressSetView;
import ghidra.program.model.listing.Function;
import ghidra.program.model.listing.FunctionManager;
import ghidra.program.model.listing.Instruction;
import ghidra.program.model.listing.InstructionIterator;
import ghidra.program.model.listing.Listing;
import ghidra.program.model.mem.Memory;
import ghidra.program.model.symbol.Reference;
import ghidra.program.model.symbol.ReferenceIterator;
import ghidra.program.model.symbol.ReferenceManager;
import java.io.File;
import java.io.FileWriter;
import java.io.PrintWriter;

public class DumpThunks extends GhidraScript {
	@Override
	public void run() throws Exception {
		String outPath = getScriptArgs().length > 0 ? getScriptArgs()[0] : "ghidra-thunks.txt";
		PrintWriter pw = new PrintWriter(new FileWriter(new File(outPath)));
		pw.println("=== THUNK DUMP " + currentProgram.getName() + " ===");

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
			"FindHidDevicesByDeviceId",
			"UsbFinder_OpenDevice",
			"UsbFinder_CloseDevice",
			"ReadDPILed",
			"SetMacroKey",
			"SetChangeDPIKey"
		};

		FunctionManager fm = currentProgram.getFunctionManager();
		Listing listing = currentProgram.getListing();
		Memory mem = currentProgram.getMemory();
		ReferenceManager rm = currentProgram.getReferenceManager();

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
			pw.println("## " + name);
			if (f == null) {
				pw.println("(not found)");
				continue;
			}
			Address entry = f.getEntryPoint();
			AddressSetView body = f.getBody();
			long naddr = body.getNumAddresses();
			pw.println("entry=" + entry + " bodyBytes=" + naddr);

			int dumpLen = (int) Math.min(Math.max(naddr, 32), 128);
			byte[] bytes = new byte[dumpLen];
			mem.getBytes(entry, bytes);
			StringBuilder hex = new StringBuilder("bytes:");
			for (int b = 0; b < bytes.length; b++) {
				hex.append(String.format(" %02x", bytes[b] & 0xff));
			}
			pw.println(hex.toString());

			pw.println("--- insns in body ---");
			InstructionIterator it = listing.getInstructions(body, true);
			int count = 0;
			while (it.hasNext() && count < 80) {
				Instruction ins = it.next();
				pw.println(ins.getAddress() + "  " + ins.toString());
				Reference[] refs = ins.getReferencesFrom();
				for (int r = 0; r < refs.length; r++) {
					Address to = refs[r].getToAddress();
					Function tf = fm.getFunctionAt(to);
					String label = currentProgram.getSymbolTable().getPrimarySymbol(to) != null
							? currentProgram.getSymbolTable().getPrimarySymbol(to).getName()
							: "";
					pw.println("    -> " + to + " " + refs[r].getReferenceType()
							+ (tf != null ? " FUNC " + tf.getName() : "")
							+ (label.length() > 0 ? " SYM " + label : ""));
				}
				count++;
			}

			pw.println("--- refs TO entry ---");
			ReferenceIterator rin = rm.getReferencesTo(entry);
			int c = 0;
			while (rin.hasNext() && c < 30) {
				Reference r = rin.next();
				Address from = r.getFromAddress();
				Function caller = fm.getFunctionContaining(from);
				pw.println("  from " + from + " type=" + r.getReferenceType()
						+ " caller=" + (caller != null ? caller.getName() : "?"));
				c++;
			}
			if (c == 0) {
				pw.println("  (none)");
			}
		}

		pw.println();
		pw.println("DONE");
		pw.close();
		println("Wrote " + outPath);
	}
}
