import{writeFileSync as w,mkdirSync as m}from"fs";import{join as j,dirname as d}from"path";
const B="/Volumes/LINKUS_SSD/cursor制作/Mobirio_website";function f(p,c){const x=j(B,p);m(d(x),{recursive:true});w(x,c,"utf8");console.log("OK:"+p);}
console.log("test");
