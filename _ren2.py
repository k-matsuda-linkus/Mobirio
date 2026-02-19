import os; s="app/(admin)/dashboard/vendors/tmpid"; d=s.replace("tmpid",chr(91)+"id"+chr(93)); os.rename(s,d); print("renamed to",d)
