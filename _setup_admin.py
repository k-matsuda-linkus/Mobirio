import os,sys
b="app/(admin)/dashboard"
for d in ["vendors/[id]","users/[id]","reports/[vendorId]"]:
  os.makedirs(os.path.join(b,d),exist_ok=True)
print("directories created")
