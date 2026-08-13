//@runtime Java
import ghidra.app.decompiler.DecompInterface;
import ghidra.app.script.GhidraScript;
import ghidra.program.model.listing.Function;
import ghidra.util.task.ConsoleTaskMonitor;
import java.io.*;

public class DumpOnlineEnc extends GhidraScript {
  public void run() throws Exception {
    String outPath = getScriptArgs()[0];
    PrintWriter pw = new PrintWriter(new FileWriter(outPath));
    DecompInterface ifc = new DecompInterface();
    ifc.openProgram(currentProgram);
    String[] names = {"CS_isDeviceOnLine","CS_UsbServer_ReadEncryption","CS_ProtocolDataParser","FUN_180011a40","FUN_180007830","CS_UsbServer_ReadCurrentDPI"};
    for (String name : names) {
      var si = currentProgram.getSymbolTable().getSymbolIterator(name, true);
      while (si.hasNext()) {
        var s = si.next();
        if (!s.getName().equals(name)) continue;
        Function f = getFunctionAt(s.getAddress());
        if (f == null) f = getFunctionContaining(s.getAddress());
        if (f != null && f.isThunk()) f = f.getThunkedFunction(true);
        pw.println("#### " + name + " entry=" + (f==null?"?":f.getEntryPoint()));
        if (f == null) continue;
        var res = ifc.decompileFunction(f, 90, new ConsoleTaskMonitor());
        if (res.decompileCompleted()) pw.println(res.getDecompiledFunction().getC());
        else pw.println("FAIL");
      }
    }
    pw.close();
  }
}
