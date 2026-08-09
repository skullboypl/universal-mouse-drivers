//@runtime Java
import ghidra.app.decompiler.DecompInterface;
import ghidra.app.decompiler.DecompileResults;
import ghidra.app.script.GhidraScript;
import ghidra.program.model.listing.Function;
import ghidra.program.model.symbol.Symbol;
import ghidra.program.model.symbol.SymbolIterator;
import ghidra.util.task.ConsoleTaskMonitor;
import java.io.*;

public class DumpCompareUpdate extends GhidraScript {
  public void run() throws Exception {
    String outPath = getScriptArgs().length > 0 ? getScriptArgs()[0] : "compare.txt";
    PrintWriter pw = new PrintWriter(new FileWriter(outPath));
    DecompInterface ifc = new DecompInterface();
    ifc.openProgram(currentProgram);
    String[] names = {
      "CS_ProtocolDataCompareUpdate",
      "CS_ProtocolDataParser",
      "CS_ProtocolDataUpdate",
      "MouseConfigParser"
    };
    for (String name : names) {
      SymbolIterator si = currentProgram.getSymbolTable().getSymbolIterator(name, true);
      while (si.hasNext()) {
        Symbol s = si.next();
        if (!s.getName().equals(name)) continue;
        Function f = getFunctionAt(s.getAddress());
        if (f == null) f = getFunctionContaining(s.getAddress());
        // resolve thunk
        if (f != null && f.getBody().getNumAddresses() <= 16) {
          var refs = f.getFunctionThunkAddresses();
        }
        pw.println("################################################################");
        pw.println("## " + name + " @ " + s.getAddress());
        if (f == null) { pw.println("NO FUNCTION"); continue; }
        // follow thunk jump
        Function target = f;
        if (f.isThunk()) {
          Function t = f.getThunkedFunction(true);
          if (t != null) target = t;
        }
        pw.println("func=" + target.getName() + " entry=" + target.getEntryPoint() + " bodyN=" + target.getBody().getNumAddresses());
        DecompileResults res = ifc.decompileFunction(target, 120, new ConsoleTaskMonitor());
        if (res != null && res.decompileCompleted()) {
          pw.println(res.getDecompiledFunction().getC());
        } else {
          pw.println("DECOMPILE FAILED");
        }
      }
    }
    pw.close();
    println("Wrote " + outPath);
  }
}
