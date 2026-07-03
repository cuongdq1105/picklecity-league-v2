import { json, openTournament } from './_utils.js';
export async function onRequestGet({env}){try{return json({ok:true,tournament:await openTournament(env)});}catch(e){return json({ok:false,error:e.message,tournament:null},{status:500});}}
