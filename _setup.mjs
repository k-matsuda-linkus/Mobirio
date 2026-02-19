import{renameSync as r,mkdirSync as m}from"fs";
const B="/Volumes/LINKUS_SSD/cursor制作/Mobirio_website/app/(vendor)/vendor";
r(B+"/bikes/xid",B+"/bikes/[id]");
m(B+"/reservations/[id]",{recursive:true});
console.log("setup done");
