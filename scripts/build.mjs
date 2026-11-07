import {build} from 'esbuild';
import {cp,mkdir,writeFile} from 'node:fs/promises';
await mkdir('runtime/public',{recursive:true});
await cp('dist','runtime/public',{recursive:true});
await build({entryPoints:['server.js'],outfile:'runtime/server.js',bundle:true,platform:'node',format:'esm',target:'node22',packages:'bundle'});
await build({entryPoints:['scripts/report-widget.js'],outfile:'runtime/public/report-widget.js',bundle:true,platform:'browser',format:'esm',target:'es2022'});
await cp('runtime/public/report-widget.js','dist/report-widget.js');
await writeFile('runtime/package.json',JSON.stringify({name:'hospital-connect-runtime',type:'module',scripts:{start:'node server.js'}},null,2));
