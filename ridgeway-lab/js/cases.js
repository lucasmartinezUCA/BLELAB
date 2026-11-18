// Case content: preserved verbatim from the validated version. Do not edit for aesthetic reasons.
export const CASES=[
{id:'northwind',client:'Dana Ruiz',role:'COO, Northwind Robotics',look:{skin:'#C9906B',hair:'#2B1D16',shirt:'#F1F3F5',jacket:'#2F4E6B',acc:'glasses',style:'bob'},
 title:'The supplier who broke the line',
 opening:'Our Michigan supplier, Lakeshore Components, sent us 400 servo motors that failed within a week. Our Ohio assembly line stopped for nine days, and we lost about $480,000. I want them to pay. Where can we sue, and how should we play this?',
 qs:[
  {q:'Where is Northwind incorporated and headquartered?',a:'Incorporated in Delaware. Headquarters and the plant are in Columbus, Ohio.',tag:'Northwind: DE corp, HQ Ohio',key:true},
  {q:'Where is Lakeshore incorporated and based?',a:'Michigan, on both counts. They shipped the motors straight to our Ohio plant.',tag:'Lakeshore: Michigan; shipped to Ohio',key:true},
  {q:'What exactly did Lakeshore promise?',a:'A written supply contract. The motors had to meet a torque specification, and they did not.',tag:'Written supply contract breached',key:false},
  {q:'How much do you depend on Lakeshore?',a:'Completely, for now. Certifying a new supplier would take us about 18 months.',tag:'Only qualified supplier for 18 months',key:true,hidden:true}],
 lines:{law:'So which law are we actually dealing with here?',court:'Can we choose where this gets heard?',advice:'Our general counsel already has some ideas. What would you sign off on?'},
 law:{q:'What body of law governs Northwind’s claim?',opts:[
  {t:'A federal statute, because the deal crossed state lines.',ok:false,fb:'Interstate dealings alone do not turn a contract claim into a federal question. Nothing here arises under a federal statute.'},
  {t:'State contract law, including each state’s version of the UCC for sales of goods.',ok:true,fb:'Right. A breach of a supply contract for goods is a state-law claim. That matters for the next question: it raises no federal question.'},
  {t:'The U.S. Constitution, because a business right is at stake.',ok:false,fb:'Constitutional claims involve government action. A dispute between two private companies over a contract is governed by state law.'}]},
 court:{q:'Which courts can hear this case?',opts:[
  {t:'Only a state court, because the claim arises under state law.',ok:false,fb:'State-law claims can still reach federal court through diversity jurisdiction.'},
  {t:'A state court, or a federal district court through diversity jurisdiction.',ok:true,fb:'Right. Northwind is a citizen of Delaware and Ohio, Lakeshore of Michigan: complete diversity, and $480,000 exceeds $75,000. Because Lakeshore shipped into Ohio, Ohio courts can also reach it.'},
  {t:'Only a federal court, because the companies are in different states.',ok:false,fb:'Diversity opens the federal door but does not close the state one. Jurisdiction here is concurrent.'}],
  show:{state:true,federal:true}},
 advice:{q:'Northwind’s general counsel wants a strategy. What do you advise?',opts:[
  {t:'File in federal court and serve sweeping discovery requests until Lakeshore settles under the cost.',L:60,E:15,out:'Fourteen months later Lakeshore settled for $230,000. Our legal bills hit $190,000, the judge called our discovery requests disproportionate, and Lakeshore ended the supply contract.'},
  {t:'Propose mediation now, with an Ohio lawsuit ready as the fallback if talks fail.',L:90,E:90,best:true,out:'Mediation took six weeks. Lakeshore agreed to $260,000, free replacement motors, and a two-year price credit. The line never stopped again.'},
  {t:'Tell Lakeshore you will post online that its motors are dangerous unless it pays $600,000 this week.',L:10,E:5,out:'Lakeshore’s lawyers treated it as a threat and filed claims of their own. Now we are defending a lawsuit instead of leading one.'},
  {t:'Sue in Ohio state court right away and take the case all the way to a verdict.',L:85,E:60,out:'Two and a half years later we won $480,000 at trial. We had spent about $310,000 getting there, and we lost our only qualified supplier.'}]},
 prof:'The strongest advice keeps litigation as a credible fallback while using mediation to protect a relationship Northwind cannot replace. Having both a state and a federal forum available is leverage, and parties bargain in the shadow of what a court would decide. Using discovery as a weapon is procedurally available, but the chapter treats it as abuse that erodes trust (Mallor et al., 2019; Treviño & Nelson, 2021).'},

{id:'birch',client:'Theo Marsh',role:'Owner, Birch & Loom',look:{skin:'#E9C4A3',hair:'#7A4E26',shirt:'#5E7D4F',jacket:null,acc:'beanie',style:'beard'},
 title:'Sued two thousand miles away',
 opening:'I was just served with papers from a court in Nevada. A customer there says a blanket she bought from us was defective, and she wants $2,400. We are a small textile shop in Vermont. I can’t afford to fly to Nevada. What do I do?',
 qs:[
  {q:'Can people buy from your website?',a:'No. It only has photos, our address, and a phone number. All sales happen in our Burlington shop.',tag:'Passive website, no online sales',key:true},
  {q:'How did she get the blanket?',a:'She bought it in our shop while she was on vacation in Vermont.',tag:'Sale made in Vermont',key:true},
  {q:'Do you advertise or ship to Nevada?',a:'Never. No ads, no shipments, no sales reps, nothing.',tag:'No ads or shipments to Nevada',key:true},
  {q:'Was the blanket actually defective?',a:'Honestly? Maybe. That batch had a dye problem, and a few other customers complained.',tag:'Dye defect likely real',key:true,hidden:true}],
 lines:{law:'Can a court in Nevada really make me show up?',court:'So do they have power over me or not?',advice:'Okay. What should I actually do?'},
 law:{q:'What sets the limits on Nevada’s power to hear a case against Theo?',opts:[
  {t:'Nevada law alone. Each state decides who its courts can reach.',ok:false,fb:'States have long-arm statutes, but the U.S. Constitution caps how far they can reach.'},
  {t:'The Due Process Clause of the U.S. Constitution, through the minimum-contacts test.',ok:true,fb:'Right. Whatever a state’s long-arm statute says, due process requires minimum contacts with the forum and a link between those contacts and the dispute.'},
  {t:'Federal consumer-protection statutes.',ok:false,fb:'Those statutes govern the merits of some consumer claims, not whether a court has power over this defendant.'}]},
 court:{q:'Can the Nevada court exercise personal jurisdiction over Birch & Loom?',opts:[
  {t:'Yes. The website can be viewed in Nevada.',ok:false,fb:'A passive, informational website is not purposeful contact aimed at Nevada.'},
  {t:'Yes. The customer lives in Nevada.',ok:false,fb:'The test looks at the defendant’s contacts with the forum, not the plaintiff’s home.'},
  {t:'No. Theo has no purposeful contacts with Nevada, and the sale happened in Vermont.',ok:true,fb:'Right. No sales, ads, or shipments into Nevada, and the dispute arises from a Vermont sale. At $2,400, this also stays in state court: far below the $75,000 diversity threshold.'}],
  show:{state:true,federal:false}},
 advice:{q:'Theo can probably get the case dismissed. What do you advise?',opts:[
  {t:'Move to dismiss for lack of personal jurisdiction, and do nothing more.',L:95,E:40,out:'The case was dismissed. Then she posted about the dye defect online, and two more customers came forward with the same complaint.'},
  {t:'Move to dismiss, and separately offer the customer a replacement or refund for the defect.',L:95,E:95,best:true,out:'The Nevada case was dismissed. She took a replacement and later left us a five-star review. It cost one motion and some wool.'},
  {t:'Ignore the papers. Nevada can’t touch you.',L:10,E:20,out:'The Nevada court entered a default judgment against me. Now I am paying a lawyer to attack it, when I could have raised the defense cleanly at the start.'},
  {t:'Fly to Nevada and fight the claim on the merits to show good faith.',L:45,E:70,out:'I spent about $6,000 on travel and a Nevada lawyer to defend a $2,400 claim, and appearing on the merits put my jurisdiction defense at risk.'}]},
 prof:'Personal jurisdiction protects a defendant from being forced into a remote, unpredictable forum, and a passive website is not enough to support it. But winning on procedure does not answer whether the customer was harmed. The defensible move uses the legal shield and still makes the customer whole: procedural strategy and integrity working together (Bagley, 2019; Treviño & Nelson, 2021).'},

{id:'pocketlend',client:'Priya Nair',role:'CEO, PocketLend',look:{skin:'#9A6A4D',hair:'#1A1414',shirt:'#E9D8C8',jacket:'#6E2F4C',acc:'earrings',style:'long'},
 title:'The clause no one can negotiate',
 opening:'We launch micro-loans next month for our two million app users. Our general counsel drafted the clause: every dispute goes to individual arbitration in Austin, customers pay their own filing fees, and no class actions. It’s efficient and it protects us. Should I sign off?',
 qs:[
  {q:'How do customers accept the terms?',a:'A checkbox at sign-up. Nobody can negotiate anything.',tag:'Standard form, checkbox, no bargaining',key:true},
  {q:'How big is a typical customer dispute?',a:'Small. Usually under $500 in fees or interest.',tag:'Typical claim under $500',key:true},
  {q:'Where do your users live?',a:'All fifty states.',tag:'Users in all 50 states',key:true},
  {q:'Why rule out class actions?',a:'Honestly? One class action could cost us more than a thousand individual claims ever would.',tag:'Goal: avoid group claims',key:true,hidden:true}],
 lines:{law:'Is a clause like this even enforceable?',court:'And if someone sues us anyway?',advice:'So, do I sign it as drafted?'},
 law:{q:'What law makes PocketLend’s arbitration clause enforceable?',opts:[
  {t:'The Federal Arbitration Act, a federal statute, subject to state contract defenses such as unconscionability.',ok:true,fb:'Right. The FAA makes written arbitration agreements in interstate commerce enforceable, while general state contract defenses still apply.'},
  {t:'Only Texas law, because PocketLend is based in Austin.',ok:false,fb:'State contract law matters, but the core source of enforceability is the federal FAA.'},
  {t:'No law. Arbitration is a private arrangement courts can disregard.',ok:false,fb:'Courts enforce written arbitration agreements and review awards only on narrow grounds (9 U.S.C. § 10).'}]},
 court:{q:'A customer sues PocketLend in a California state court anyway. What happens?',opts:[
  {t:'The state court applies the FAA and can send the case to arbitration.',ok:true,fb:'Right. The FAA binds state and federal courts alike, so either can compel arbitration under a valid clause.'},
  {t:'Only a federal court can enforce the clause.',ok:false,fb:'The FAA applies in state courts too. The customer’s choice of a state forum does not escape it.'},
  {t:'The state court may ignore federal arbitration law.',ok:false,fb:'Federal law is supreme. A state court must apply the FAA.'}],
  show:{state:true,federal:true}},
 advice:{q:'Priya wants a yes or no. What do you advise?',opts:[
  {t:'Sign it as drafted. It is likely enforceable, and that is what matters.',L:75,E:20,out:'The clause held up in most courts. Then a news story about “loans you can never challenge” brought regulator letters and a wave of users leaving.'},
  {t:'Revise it: PocketLend pays arbitration fees, hearings near the customer, a small-claims option, and plain-language notice.',L:90,E:90,best:true,out:'Disputes now close in about 90 days. A consumer group praised our terms, and complaints dropped in the first quarter.'},
  {t:'Drop arbitration entirely and send every dispute to public court.',L:85,E:75,out:'Every small complaint became a public lawsuit. Our costs went up, but people saw us as transparent.'},
  {t:'Keep the clause, but put it in a terms update customers will never notice.',L:15,E:5,out:'A court refused to enforce terms customers never meaningfully agreed to, and the hidden clause became the headline.'}]},
 prof:'Enforceable is not the same as legitimate. Under the FAA the aggressive clause may well survive. But in an adhesion contract with small claims, cost-shifting, distant hearings, and a class waiver can make a remedy unreal. A balanced clause keeps the efficiency of arbitration while attending to consent, cost allocation, and impartiality, the conditions the chapter names (Mallor et al., 2019; Treviño & Nelson, 2021).'}
];

// Book-cover labels for the three law options of each case (unchanged from the previous version)
export const BOOKS={northwind:['Federal statute','State contract law','U.S. Constitution'],birch:['Nevada law','U.S. Constitution','Federal statutes'],pocketlend:['Federal Arbitration Act','Texas law','No law at all']};
