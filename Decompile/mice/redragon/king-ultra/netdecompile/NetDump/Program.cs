using System;
using System.IO;
using System.Linq;
using ICSharpCode.Decompiler;
using ICSharpCode.Decompiler.CSharp;
using ICSharpCode.Decompiler.Metadata;
using ICSharpCode.Decompiler.TypeSystem;

var exe = args[0];
var outDir = args[1];
Directory.CreateDirectory(outDir);
var settings = new DecompilerSettings { ThrowOnAssemblyResolveErrors = false };
var resolver = new UniversalAssemblyResolver(exe, false, null);
var decompiler = new CSharpDecompiler(exe, resolver, settings);
var ts = decompiler.TypeSystem;
string[] want = {
  "DriverLib.REPORT_RATE",
  "FileManager.ConfigFile",
  "Mouse_Drive_Beta.ComboControlLibrary._3In1",
  "Mouse_Drive_Beta.ComboControlLibrary._2In1",
};
foreach (var full in want) {
  var t = ts.GetAllTypeDefinitions().FirstOrDefault(x => x.FullName == full);
  if (t == null) { Console.WriteLine("MISS " + full); continue; }
  var code = decompiler.DecompileTypeAsString(t.FullTypeName);
  var safe = string.Join("_", full.Split(Path.GetInvalidFileNameChars()));
  File.WriteAllText(Path.Combine(outDir, safe + ".cs"), code);
  Console.WriteLine("OK " + full + " " + code.Length);
}
