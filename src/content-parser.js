import {parse} from 'yaml';
export function parseDocument(raw,path){
 const match=raw.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)([\s\S]*)$/);
 if(!match)throw new Error(`Missing front matter: ${path}`);
 return {...parse(match[1]),body:match[2].trim(),path};
}
