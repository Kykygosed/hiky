// Données du monde: exporte un tableau de blocs et d'entités simples
export const WORLD = (() => {
const blocks = [];
const size = 64; // monde généré (carre)
const half = size/2;


// couche de sol plate (y = 0)
for(let x = -half; x < half; x++){
for(let z = -half; z < half; z++){
blocks.push({x, y:0, z, type:'grass'});
// couche sous-jacente
blocks.push({x, y:-1, z, type:'dirt'});
blocks.push({x, y:-2, z, type:'stone'});
}
}


// Ajout de quelques arbres (primitive)
const rng = (s)=>Math.abs(Math.sin(s*9301+49297)*10000)%1;
let seed = 42;
for(let i=0;i<120;i++){
seed += i*7.3;
const tx = Math.floor((rng(seed)*size)-half);
const tz = Math.floor((rng(seed+1)*size)-half);
const groundY = 1; // position au dessus de la couche de sol
// tronc
const height = 4 + Math.floor(rng(seed+2)*3);
for(let h=0; h<height; h++){
blocks.push({x:tx, y:groundY+h, z:tz, type:'wood'});
}
// feuilles (simple cube autour du sommet)
const top = groundY+height-1;
for(let dx=-2; dx<=2; dx++) for(let dz=-2; dz<=2; dz++) for(let dy=-1; dy<=1; dy++){
if(Math.abs(dx)+Math.abs(dz)+Math.abs(dy) <= 4){
blocks.push({x:tx+dx, y:top+dy, z:tz+dz, type:'leaf'});
}
}
}


// quelques rochers
for(let i=0;i<40;i++){
seed += i*13.1;
const rx = Math.floor((rng(seed)*size)-half);
const rz = Math.floor((rng(seed+3)*size)-half);
const ry = 1;
const s = 1 + Math.floor(rng(seed+4)*3);
for(let x=-s;x<=s;x++) for(let z=-s; z<=s; z++) for(let y=0;y<=s;y++){
if(Math.abs(x)+Math.abs(z)+y <= s+1) blocks.push({x:rx+x, y:ry+y, z:rz+z, type:'stone'});
}
}


return blocks;
})();
