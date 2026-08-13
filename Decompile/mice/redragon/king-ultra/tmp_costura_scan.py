from pathlib import Path
exe=Path(r"x:\INNE\DEV_PROGRAMOWANIE\WEB_DRIVERS_REDRAGON_RAMPAGE\Decompile\redragon\king-ultra\bin\MouseDriveBeta.exe")
data=exe.read_bytes()
idx=0
found=[]
while True:
    i=data.find(b"costura.", idx)
    if i<0: break
    j=i
    while j<len(data) and 32<=data[j]<127: j+=1
    name=data[i:j].decode("ascii",errors="ignore")
    found.append((i,name))
    idx=i+1
print("costura names", len(found))
for off,name in found[:100]:
    print(f"{off:08x} {name}")
