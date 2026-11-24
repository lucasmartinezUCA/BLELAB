// Case progression state (content-agnostic). Progress is stored only in this browser (localStorage); nothing is sent to any LMS.
import {ACTIVITY,ACT_CASES as CASES,isOpen} from './activity.js';
export const BEATS=['intake','law','court','advice','outcome'];
export const STEP_STATION=ACTIVITY.steps;
const KEY=ACTIVITY.storageKey;
export const S={ci:0,beat:'intake',asked:[],law:null,court:null,extra:null,adv:null,pick:null,rec:[],started:false,called:false};
export const C=()=>CASES[S.ci];
export function save(){try{localStorage.setItem(KEY,JSON.stringify(S));}catch(e){}}
export function load(){try{const v=JSON.parse(localStorage.getItem(KEY)||'null');if(v&&typeof v.ci==='number'&&v.ci<CASES.length)Object.assign(S,v);}catch(e){}}
export function reset(){Object.assign(S,{ci:0,beat:'intake',asked:[],law:null,court:null,extra:null,adv:null,pick:null,rec:[],started:true,called:false});save();}
export function nextCase(){S.ci++;S.asked=[];S.law=S.court=S.extra=S.adv=S.pick=null;S.beat='intake';S.called=false;save();}
// 'closed' = room not part of this activity; 'current' / 'done' / 'locked' = position in the current client's steps.
export function status(station){if(station==='reception')return 'open';if(!isOpen(station))return 'closed';
  if(S.beat==='end')return STEP_STATION.end===station?'current':'done';
  if(STEP_STATION[S.beat]===station)return 'current';
  const cur=BEATS.indexOf(S.beat);for(let i=0;i<cur;i++)if(STEP_STATION[BEATS[i]]===station)return 'done';return 'locked';}
const ROOM={consult:'the Consultation Room',library:'the Law Library',courts:'the Jurisdiction Room',strategy:'the Strategy Room',results:'the Results Room'};
export function objective(){const c=C();return {intake:`Interview ${c.client} in the Consultation Room.`,law:'Identify the source of law in the Law Library.',court:'Decide which courts can hear the case in the Jurisdiction Room.',
  advice:`Choose the advice you would sign in ${ROOM[STEP_STATION.advice]}.`,outcome:`See how your advice played out in ${ROOM[STEP_STATION.outcome]}.`,end:`Review your practice record in ${ROOM[STEP_STATION.end]}.`}[S.beat];}
// Hook for a future AVA/Studio integration. Currently a no-op: no data leaves the browser.
export const LMS={report(){/* intentionally empty */}};
