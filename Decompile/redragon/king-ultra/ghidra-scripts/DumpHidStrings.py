# Find ASCII strings and xrefs without depending on CLI analyzers
from ghidra.program.model.address import AddressSet
from ghidra.program.model.symbol import SourceType
import java.io.FileWriter as FileWriter
import java.io.PrintWriter as PrintWriter

out_path = getScriptArgs()[0] if getScriptArgs() else "ghidra-dump.txt"
pw = PrintWriter(FileWriter(out_path))
pw.println("=== PROGRAM %s ===" % currentProgram.getName())
pw.println("language=%s" % currentProgram.getLanguageID())
mem = currentProgram.getMemory()
rm = currentProgram.getReferenceManager()
listing = currentProgram.getListing()
fm = currentProgram.getFunctionManager()

keys = [
  "HidD_SetFeature", "HidD_GetFeature", "HidD_GetAttributes",
  "SetCurrentConfig", "ReadConfig", "WriteDeviceData",
  "ReadWriteDeviceData", "ReadCurrentDPI", "ReadReportRate",
  "CS_UsbServer_SetCurrentConfig", "CS_UsbFinder_WriteDeviceData",
  "ReportId", "FeatureReportByteLength", "BufferToDPI",
  "MacroKeyToBuffer", "ReadAllFlashData"
]

def find_ascii(needle):
  results = []
  start = mem.getMinAddress()
  needle_bytes = bytearray(needle)
  # Ghidra findBytes
  while True:
    addr = mem.findBytes(start, needle_bytes, None, True, monitor)
    if addr is None:
      break
    results.append(addr)
    start = addr.add(1)
    if len(results) >= 20:
      break
  return results

for key in keys:
  pw.println("\n## KEY: " + key)
  addrs = find_ascii(key)
  for addr in addrs:
    pw.println("STR @ %s" % addr)
    refs = rm.getReferencesTo(addr)
    count = 0
    while refs.hasNext() and count < 25:
      r = refs.next()
      fa = r.getFromAddress()
      f = fm.getFunctionContaining(fa)
      fname = f.getName() if f else "?"
      fentry = f.getEntryPoint() if f else "?"
      pw.println("  XREF %s type=%s func=%s entry=%s" % (fa, r.getReferenceType(), fname, fentry))
      count += 1
    if count == 0:
      pw.println("  (no xrefs yet - may need analysis)")

# External symbols
pw.println("\n## EXTERNAL INTERESTING")
st = currentProgram.getSymbolTable()
ext = st.getExternalSymbols()
while ext.hasNext():
  s = ext.next()
  n = s.getName()
  low = n.lower()
  if ("hid" in low) or ("writefile" in low) or ("deviceiocontrol" in low) or ("setupdi" in low):
    pw.println("EXT %s @ %s" % (n, s.getAddress()))
    refs = rm.getReferencesTo(s.getAddress())
    c = 0
    while refs.hasNext() and c < 30:
      r = refs.next()
      fa = r.getFromAddress()
      f = fm.getFunctionContaining(fa)
      pw.println("  XREF %s func=%s" % (fa, f.getName() if f else "?"))
      c += 1

pw.println("\nDONE")
pw.close()
print("Wrote " + out_path)
