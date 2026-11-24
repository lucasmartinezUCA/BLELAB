// Activity configuration. Each activity (Formative 1, Formative 2, Final) ships the same engine with its own config.
// Activity 1 (Formative 1): Chapters 1 and 2, two clients, four rooms open, not graded.
import {CASES} from './cases.js';

export const ACTIVITY={
  id:'act1',
  number:1,
  title:'Activity 1',
  chapters:'Chapters 1 and 2',
  rank:'Junior Consultant',
  storageKey:'ridgeway-activity1-v1',
  // Rooms the student can enter. Others are built with closed doors.
  open:['reception','consult','library','courts'],
  closedNote:{strategy:'Opens in Activity 2',results:'Opens in the final activity'},
  // Where each step happens. Advice and outcome happen in the Consultation Room in this activity.
  steps:{intake:'consult',law:'library',court:'courts',advice:'consult',outcome:'consult',end:'consult'},
  caseIds:['northwind','pocketlend'],
  models:{northwind:'client_dana.glb',pocketlend:'client_priya.glb',birch:'client_theo.glb'},
  // NEW CONTENT FOR ACTIVITY 1 (proposed; awaiting the professor's validation).
  // One chapter-1 question per client, asked in the room named by `station`, right after that room's main question.
  extra:{
    northwind:{station:'courts',heading:'Civil or criminal?',
      say:'Honestly? I want someone at Lakeshore to answer for this. Can we get their managers jailed?',
      q:'Can Northwind’s lawsuit send Lakeshore’s managers to prison?',
      opts:[
        {t:'Yes. A civil court can order imprisonment when a company’s conduct causes serious business losses.',
         fb:'A civil lawsuit seeks compensation for the injured party: damages or court orders. It cannot result in imprisonment.'},
        {t:'No. Northwind’s lawsuit is civil and seeks compensation. Criminal liability would require a prosecution brought by public authorities, based on the managers’ own conduct and state of mind.',ok:true,
         fb:'Right. Civil liability compensates the injured party and is pursued by that party. Criminal liability punishes conduct harmful to society, is pursued by public authorities, and reaches individual managers only when their own conduct and state of mind meet the elements of an offense. The same conduct can, in principle, trigger both, but Northwind controls only the civil claim.'},
        {t:'Only if Northwind asks the judge for criminal penalties in its complaint.',
         fb:'A private party cannot request criminal penalties in a civil complaint. Criminal cases are brought by public authorities, not by the injured company.'}]},
    pocketlend:{station:'library',heading:'When state and federal law collide',
      say:'One more thing: a few states are debating bans on arbitration in consumer loans. If one passes, are we exposed there?',
      q:'Suppose a state enacts a law banning arbitration clauses in consumer loan agreements. Which rule governs PocketLend’s clause in that state?',
      opts:[
        {t:'The state law. Consumer contracts are governed by the law of the state where the consumer lives.',
         fb:'Contract law is largely state law, but a valid federal statute displaces an incompatible state rule within the scope of federal authority.'},
        {t:'The Federal Arbitration Act. A valid federal statute prevails over an incompatible state rule within its scope (federal preemption), although general state contract defenses still apply.',ok:true,
         fb:'Right. Under the hierarchy of sources and the doctrine of federal preemption, a valid federal law displaces an incompatible state rule within the scope of the federal provision. Preemption is not automatic for every shared subject, but a state law that singles out arbitration conflicts directly with the FAA. Defenses that apply to contracts generally, such as unconscionability, remain available.'},
        {t:'Neither. When federal and state law conflict, the clause becomes void until a court decides.',
         fb:'A conflict between sources is resolved through the hierarchy of law, not by voiding the agreement. Under preemption, the valid federal rule controls within its scope.'}]}
  }
};

export const ACT_CASES=ACTIVITY.caseIds.map(id=>CASES.find(c=>c.id===id));
export const isOpen=st=>st==='reception'||ACTIVITY.open.includes(st);
export const extraFor=(c,st)=>{const x=ACTIVITY.extra[c.id];return x&&(!st||x.station===st)?x:null;};
