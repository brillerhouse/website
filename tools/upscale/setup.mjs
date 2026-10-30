import path from 'node:path';
import { spawn } from 'node:child_process';
import { runtimeDirectory } from './runtime.mjs';
const folder=runtimeDirectory(),npm=process.env.npm_execpath;
if(!npm)throw new Error('Run this installer with npm run gallery:compare:setup');
console.log('Installing isolated CPU runtime'+(path.basename(folder)==='legacy'?' (compatible with older macOS)':'')+'…');
const child=spawn(process.execPath,[npm,'ci','--ignore-scripts','--no-audit','--no-fund'],{cwd:folder,stdio:'inherit',env:process.env});
child.on('error',error=>{console.error(error.message);process.exitCode=1;});
child.on('close',code=>{process.exitCode=code===0?0:1;});
