// Case progression state (content-agnostic). Progress is stored only in this browser (localStorage); nothing is sent to any LMS.
import {CASES} from './cases.js';
export const BEATS=['intake','law','court','advice','outcome'];
export const STEP_STATION={intake:'consult',law:'library',court:'courts',advice:'strategy',outcome:'results',end:'results'};
export const STATION_STEP={consult:'intake',library:'law',courts:'court',strategy:'advice',results:'outcome'};
const KEY='ridgeway-lab-v3';
export const S={ci:0,beat:'intake',asked:[],law:null,court:null,adv:null,pick:null,rec:[],started:false};
export const C=()=>CASES[S.ci];
export function save(){try{localStorage.setItem(KEY,JSON.stringify(S));}catch(e){}}
export function load(){try{const v=JSON.parse(localStorage.getItem(KEY)||'null');if(v&&typeof v.ci==='number'&&v.ci<CASES.length)Object.assign(S,v);}catch(e){}}
export function reset(){Object.assign(S,{ci:0,beat:'intake',asked:[],law:null,court:null,adv:null,pick:null,rec:[],started:true});save();}
export function nextCase(){S.ci++;S.asked=[];S.law=S.court=S.adv=S.pick=null;S.beat='intake';save();}
export function status(station){if(station==='reception')return 'open';if(S.beat==='end')return station==='results'?'current':'done';
  const cur=BEATS.indexOf(S.beat),idx=BEATS.indexOf(STATION_STEP[station]);return idx===cur?'current':idx<cur?'done':'locked';}
export function objective(){const c=C();return {intake:`Interview ${c.client} in the Consultation Room.`,law:'Identify the source of law in the Law Library.',court:'Decide which courts can hear the case in the Jurisdiction Room.',
  advice:'Choose the advice you would sign in the Strategy Room.',outcome:'See how your advice played out in the Results Room.',end:'Review your practice record in the Results Room.'}[S.beat];}
// Hook for a future AVA/Studio integration. Currently a no-op: no data leaves the browser.
export const LMS={report(){/* intentionally empty */}};
