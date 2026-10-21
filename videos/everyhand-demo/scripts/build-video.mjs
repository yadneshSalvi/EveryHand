import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {sourcePose, focusRect, stageCss, escapeHtml, STAGE} from './lib/screen-stage.mjs';

const project = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = file => JSON.parse(fs.readFileSync(path.join(project,file),'utf8'));
const audio = read('audio_meta.json');
const script = read('script.json');
const capture = read('capture/manifest.json');
const captures = new Map(capture.steps.map(s=>[s.id,s]));
const fonts = fs.readFileSync(path.join(project,'src/fonts.css'),'utf8').replaceAll('../assets/','assets/');
const total = audio.total_duration_s;
const mark = fs.readFileSync(path.join(project,'assets/brand/favicon.svg'),'utf8').trim();
const plan = {format:'1920x1080',fps:60,duration:total,timing:'Actual Deepgram word timestamps',audio:'audio_meta.json',estimatedCues:0,acts:[]};
if (total>=180) throw new Error('Film exceeds the three-minute boundary.');

const numberWords = {21:'twenty one',23:'twenty three',24:'twenty four',28:'twenty eight',30:'thirty',32:'thirty two',36:'thirty six'};
const norm = s => String(s).toLowerCase().replace(/\b\d+\b/g,n=>numberWords[n]||n).replace(/[’']/g,'').replace(/[^a-z0-9]+/g,' ').trim().split(/\s+/).filter(Boolean);
const e=escapeHtml;
const f = n => Number(n.toFixed(5));

function makeCue(act) {
  const words=act.words.flatMap(w=>norm(w.text).map(token=>({token,start:w.start-act.act_start_s,end:w.end-act.act_start_s,wordId:w.id})));
  return (phrase, occurrence=0) => {
    const target=norm(phrase);
    const found=[];
    for(let i=0;i<=words.length-target.length;i++) if(target.every((t,j)=>t===words[i+j].token)) found.push(i);
    if(found.length<=occurrence) throw new Error(`Deepgram cue missing in ${act.id}: ${phrase} #${occurrence}`);
    const item=words[found[occurrence]];
    return {time:f(item.start),phrase,wordId:item.wordId};
  };
}

function createAct(index,configure) {
  const voice=audio.voices[index], id='everyhand-'+voice.id;
  const cue=makeCue(voice);
  const C=(phrase,offset=0,occurrence=0)=>{const c=cue(phrase,occurrence);return {...c,spokenTime:c.time,time:f(Math.max(0,c.time+offset))};};
  const duration=f(voice.act_end_s-voice.act_start_s);
  const segments=[];
  function add(at,kind,asset,rect,options={}) {
    const boundary=typeof at==='number'?{time:at,phrase:'act boundary',wordId:null}:at;
    segments.push({start:boundary.time,cue:boundary,kind,asset,rect,...options});
  }
  configure({add,C,cue,duration});
  segments.sort((a,b)=>a.start-b.start);
  segments.forEach((s,i)=>{s.end=f(segments[i+1]?.start??duration);s.duration=f(s.end-s.start);if(s.duration<=0)throw new Error('Overlapping segment '+s.asset);});
  const app=[],paper=[],overlays=[],animations=[];
  const shotRecords=[];
  const cover=sourcePose({fit:'cover',cy:400});
  const initialApp=segments[0].kind==='app'&&segments[0].rect?focusRect(segments[0].rect,{maxScale:3.1}):cover;
  let appPose=initialApp,paperPose={x:560,y:0,scale:.3575};
  for(let i=0;i<segments.length;i++) {
    const s=segments[i],sid=id+'-shot-'+String(i+1).padStart(2,'0');
    const timed=`class="clip" data-start="${s.start}" data-duration="${s.duration}" data-track-index="1"`;
    if(s.kind==='app') {
      const item=captures.get(s.asset);
      if(!item) throw new Error('No verified capture '+s.asset);
      const pose=s.rect ? focusRect(s.rect,{maxScale:3.1}) : cover;
      const prev=appPose;
      const transition=s.start===0?0:(s.move??.8);
      if(s.start+transition>s.end)throw new Error('Source move exceeds shot');
      s.camera={departure:s.start,arrival:f(s.start+transition),spokenCue:s.cue.spokenTime??null};
      animations.push(`tl.fromTo("#${id}-world",${JSON.stringify(prev)},${JSON.stringify({...pose,duration:transition,ease:'power3.inOut',immediateRender:false})},${s.start});`);
      appPose=pose;
      let actionDuration=0,rate=1;
      if(s.action && item.source_frame_count>1) {
        const natural=item.timing.encoded_clip_duration_seconds;
        actionDuration=f(Math.min(s.duration-.18,Math.max(1.35,natural)));
        rate=f(natural/actionDuration);
        if(rate<.1||rate>10)throw new Error('Invalid playback rate');
        app.push(`<video id="${sid}-action" class="clip" src="${item.video.path}" data-start="${s.start}" data-duration="${actionDuration}" data-media-start="0" data-playback-rate="${rate}" data-track-index="1" muted playsinline preload="auto"></video>`);
      }
      const stillStart=f(s.start+actionDuration);
      app.push(`<img id="${sid}-still" class="clip" src="${item.still.path}" data-start="${stillStart}" data-duration="${f(s.end-stillStart)}" data-track-index="1" alt="Actual Every Hand capture: ${e(s.asset)}"/>`);
      for(const beat of s.focus??[]) {
        const at=f(Math.max(s.start+transition+.1,beat.cue.time-.85));
        if(at+.8>s.end)throw new Error('Camera cue outside shot '+s.asset);
        beat.camera={departure:at,arrival:f(at+.8),spokenCue:beat.cue.spokenTime};
        const next=focusRect(beat.rect,{maxScale:3.1});
        animations.push(`tl.fromTo("#${id}-world",${JSON.stringify(appPose)},${JSON.stringify({...next,duration:.8,ease:'power3.inOut',immediateRender:false})},${at});`);
        appPose=next;
      }
      shotRecords.push({...s,pose,media:{still:item.still.path,action:s.action?item.video.path:null,actionDuration,playbackRate:rate},retiming:actionDuration?'Real action retimed uniformly; high-resolution final state follows.':'Actual final-state still.'});
    } else if(s.kind==='paper') {
      const source={width:1697,height:2400};
      const pose=s.rect?focusRect(s.rect,{source,maxScale:2.4,cover:false}):sourcePose({source,fit:'contain'});
      paper.push(`<img id="${sid}-paper" ${timed} src="${s.asset}" alt="Actual generated facilitator kit page"/>`);
      animations.push(`tl.fromTo("#${id}-paper-world",${JSON.stringify(paperPose)},${JSON.stringify({...pose,duration:.8,ease:'power3.inOut',immediateRender:false})},${s.start});`);
      paperPose=pose;
      if(s.crop){animations.push(`tl.set("#${sid}-paper",{clipPath:"${s.crop}"},${s.start});`);}
      s.camera={departure:s.start,arrival:f(s.start+.8),spokenCue:s.cue.spokenTime??null};
      for(const beat of s.focus??[]) {
        const at=f(Math.max(s.start+.9,beat.cue.time-.9));
        if(at+.9>s.end)throw new Error('Paper cue outside shot '+s.asset);
        beat.camera={departure:at,arrival:f(at+.9),spokenCue:beat.cue.spokenTime};
        const next=focusRect(beat.rect,{source,maxScale:2.4,cover:false});
        animations.push(`tl.fromTo("#${id}-paper-world",${JSON.stringify(paperPose)},${JSON.stringify({...next,duration:.9,ease:'power3.inOut',immediateRender:false})},${at});`);
        paperPose=next;
        if(beat.crop){animations.push(`tl.fromTo("#${sid}-paper",{clipPath:"inset(0px 0px 0px 0px)"},{clipPath:"${beat.crop}",duration:.9,ease:"power3.inOut",immediateRender:false},${at});`);}
      }
      shotRecords.push({...s,pose,sourcePixels:[1697,2400],provenance:'Rendered page of the actual PDF generated through the app.'});
    } else {
      const isEnd=s.kind==='outro';
      const body=isEnd
        ? `<div class="${id}-end-mark">${mark}</div><p class="${id}-kicker">EVERY HAND</p><h1>Make room for<br/>every hand.</h1><p class="${id}-end-note">Planned opportunities. Real individual turns.</p><p class="${id}-repo">github.com/yadneshSalvi/EveryHand</p>`
        : `<p class="${id}-kicker">${e(s.kicker??'THE PROTECTED ASSUMPTION')}</p><h2>${e(s.title)}</h2><p class="${id}-bridge-note">${e(s.note??'')}</p>${s.note2?`<p id="${sid}-note2" class="${id}-bridge-note ${id}-second-note">${e(s.note2)}</p>`:''}`;
      overlays.push(`<section id="${sid}" class="clip ${id}-bridge ${isEnd?id+'-outro':''}" data-start="${s.start}" data-duration="${s.duration}" data-track-index="3"><div id="${sid}-content">${body}</div></section>`);
      animations.push(`tl.fromTo("#${sid}-content",{y:22,opacity:0},{y:0,opacity:1,duration:.65,ease:"power3.out",immediateRender:false},${s.start});`);
      if(s.reveal){animations.push(`tl.fromTo("#${sid}-note2",{y:16,opacity:0},{y:0,opacity:1,duration:.6,ease:"power3.out",immediateRender:false},${f(s.reveal.time-.65)});`);}
      shotRecords.push(s);
    }
  }
  const chapter=['A missing turn','A workable choice','When the room changes','Keep the work already done','From the plan to the room'][index];
  const footer='Fictional lesson · Schedule preview';
  const paperFirst=segments.find(s=>s.kind==='paper')?.start;
  const paperLast=segments.filter(s=>s.kind==='paper').at(-1)?.end;
  const footerLeft=index===4?`<span class="${id}-footer-left"><span id="${id}-footer-intro" class="clip" data-start="0" data-duration="${paperFirst}" data-track-index="4">Fictional workshop · Actual product demo</span><span id="${id}-footer-kit" class="clip" data-start="${paperFirst}" data-duration="${f(paperLast-paperFirst)}" data-track-index="4">Actual facilitator kit · Generated from the applied plan</span><span id="${id}-footer-close" class="clip" data-start="${paperLast}" data-duration="${f(duration-paperLast)}" data-track-index="4">Fictional workshop · Actual product demo</span></span>`:`<span>${footer}</span>`;
  const html=`<template>
<style>
${fonts}
#root{position:absolute;inset:0;width:100%;height:100%;overflow:hidden;color:#293e32;font-family:"DM Sans",sans-serif;}
#${id}-ground{position:absolute;inset:0;background:#f7f5ee;}
${stageCss(id,{paper:'#f7f5ee',ink:'#293e32',accent:'#a94d2b',line:'#d9dfd1'})}
#${id}-world{width:1600px;height:1000px;}
#${id}-world>img,#${id}-world>video{position:absolute;inset:0;width:1600px;height:1000px;object-fit:fill;}
#${id}-paper-world{position:absolute;left:0;top:0;width:1697px;height:2400px;transform-origin:0 0;}
#${id}-paper-world>img{position:absolute;inset:0;width:1697px;height:2400px;object-fit:fill;}
#${id}-brand{font-family:"DM Sans",sans-serif;font-weight:700;}
#${id}-chapter{font-size:26px;}
#${id}-footer{font-size:24px;}
.${id}-footer-left{position:relative;display:block;width:1200px;height:34px;}
.${id}-bridge{position:absolute;inset:0;background:#f7f5ee;padding:112px 122px;box-sizing:border-box;}
.${id}-bridge h2{font-family:"DM Serif Display",serif;font-weight:400;font-size:158px;line-height:1.04;letter-spacing:-.045em;max-width:1400px;margin:62px 0 32px;}
.${id}-kicker{font-family:"DM Sans",sans-serif;font-size:26px;line-height:1.3;letter-spacing:.12em;font-weight:600;margin:0;color:#526750;}
.${id}-bridge-note{font-size:44px;font-weight:400;max-width:1400px;line-height:1.3;margin:0;}
.${id}-second-note{margin-top:32px;color:#526750;}
.${id}-outro{padding:77px 116px;}
.${id}-end-mark{width:60px;height:60px;display:block;margin-bottom:30px;}
.${id}-end-mark>svg{display:block;width:100%;height:100%;}
.${id}-outro h1{font-family:"DM Serif Display",serif;font-weight:400;font-size:128px;line-height:.99;letter-spacing:-.045em;margin:22px 0 35px;max-width:1500px;}
.${id}-end-note{font-size:33px;line-height:1.3;margin:0 0 25px;}
.${id}-repo{font-size:29px;line-height:1.3;font-weight:600;margin:0;color:#293e32;}
</style>
<div id="root" data-composition-id="${id}" data-width="1920" data-height="1080" data-duration="${duration}">
<div id="${id}-ground" class="clip" data-start="0" data-duration="${duration}" data-track-index="0"></div>
<div id="${id}-header"><div id="${id}-brand"><img src="assets/brand/favicon.svg" alt=""/><span>every hand.</span></div><div id="${id}-chapter"><span>0${index+1}</span>${e(chapter)}</div></div>
<div id="${id}-stage"><div id="${id}-world" data-layout-allow-overflow>${app.join('\n')}</div><div id="${id}-paper-world" data-layout-allow-overflow>${paper.join('\n')}</div>${overlays.join('\n')}</div>
<div id="${id}-footer">${footerLeft}<span>${index===4?'Local proof of concept':'Full turns include reset'}</span></div>
</div>
<script src="assets/vendor/gsap.min.js"></script>
<script>
{ const tl=gsap.timeline({paused:true});
tl.set("#${id}-world",${JSON.stringify({...initialApp,transformOrigin:'0 0'})},0);
tl.set("#${id}-paper-world",{x:560,y:0,scale:.3575,transformOrigin:"0 0"},0);
${animations.join('\n')}
window.__timelines["${id}"]=tl; }
</script>
</template>
`;
  fs.mkdirSync(path.join(project,'compositions/frames'),{recursive:true});
  const file=`compositions/frames/${voice.id}.html`;
  fs.writeFileSync(path.join(project,file),html.replace(/[ \t]+$/gm, '').trimEnd()+'\n');
  plan.acts.push({id,start:voice.act_start_s,end:voice.act_end_s,duration,composition:file,shots:shotRecords});
}

createAct(0,({add,C})=>{
  add(0,'app','01-missing-zara',[520,305,560,390]);
  add(C('For teachers',-.85),'app','02-workshop-overview',null,{action:true,focus:[{cue:C('every hand'),rect:[85,75,1350,720]}]});
  add(C('This fictional lesson',-.85),'app','03-whole-turns',[85,85,1400,600],{action:true,focus:[{cue:C('four full minutes'),rect:[1145,395,315,145]},{cue:C('twenty one'),rect:[1110,20,380,360]}]});
  add(C('Zara is',-.85),'app','01-missing-zara',[520,305,560,390]);
});
createAct(1,({add,C})=>{
  add(0,'app','04-compare-options',[315,25,975,780],{action:true,focus:[{cue:C('Keep the equipment'),rect:[340,305,585,255]},{cue:C('or keep'),rect:[630,305,600,255]}]});
  add(C('Neither choice',-.85),'bridge',null,null,{title:'4 minutes.',note:'Full turns stay fixed.'});
  add(C('If extra equipment',-.85),'app','05-lock-equipment',[340,150,920,410],{action:true,focus:[{cue:C('lock it'),rect:[340,235,470,310]}]});
  add(C('Unlock it',-.85),'app','06-preview-extra-place',[340,150,920,410],{action:true,focus:[{cue:C('Now Zara'),rect:[920,305,345,260]},{cue:C('This is still a preview'),rect:[920,305,345,260]}]});
});
createAct(2,({add,C})=>{
  add(0,'app','07-apply-extra-place',[100,30,1375,650],{action:true,focus:[{cue:C('twenty eight'),rect:[1120,20,360,390]}]});
  add(C('The room',-.85),'app','09-find-zara-in-room',[90,160,1050,610],{action:true});
  add(C('Select a learner',-.85),'app','08-zara-scheduled',[520,300,560,400],{action:true});
  add(C('But workshops change',-.85),'app','10-before-disruption',[90,50,1400,720],{focus:[{cue:C('At minute eight'),rect:[100,510,1000,190]}]});
  add(C('one microscope',-.85),'app','11-lose-microscope',[90,60,1400,720],{action:true});
  add(C('Every hand preserves',-.85),'app','17-loss-overview',[90,20,1400,700],{focus:[{cue:C('eight completed'),rect:[1120,330,370,180]},{cue:C('twenty three'),rect:[1110,20,380,360]},{cue:C('without erasing'),rect:[1120,330,370,180]}]});
});
createAct(3,({add,C})=>{
  add(0,'app','12-six-minute-recovery',[315,25,975,780],{action:true,focus:[{cue:C('six extra minutes'),rect:[340,350,590,265]},{cue:C('The planner carries'),rect:[340,155,920,180]}]});
  add(C('Apply the',-.85),'app','13-apply-recovery',[90,30,1400,710],{action:true,focus:[{cue:C('All twenty eight'),rect:[1120,25,370,440]}]});
  add(C('Zaras turn',-.85),'app','14-zara-recovered',[520,300,560,400],{action:true});
  add(C('Earlier completed',-.85),'app','15-history-preserved',[520,300,560,400],{action:true});
  add(C('The recovery changes',-.85),'bridge',null,null,{kicker:'RECOVER WITHOUT STARTING OVER',title:'The past stays put.',note:'8 completed turns preserved.',note2:'Every full turn stays intact.',reveal:C('every scheduled')});
});
createAct(4,({add,C,duration})=>{
  add(0,'app','16-facilitator-kit',[520,295,560,410],{action:true});
  add(C('The real run sheet',-.85),'paper','assets/outputs/kit-page-1.png',[90,90,1500,1640],{focus:[{cue:C('lists every scheduled learner'),rect:[105,330,1475,720]},{cue:C('Zaras row'),rect:[105,1660,1325,240],crop:'inset(1590px 120px 585px 105px)'}]});
  add(C('Individual cards',-.85),'paper','assets/outputs/kit-page-3.png',[860,1870,720,270],{crop:'inset(1865px 112px 260px 860px)'});
  add(C('This is a local',-.85),'app','18-finish-preview',[90,20,1400,690],{action:true});
  add(C('Every hand',-.85),'outro',null,null);
});

const hosts=plan.acts.map(a=>`<div id="${a.id}" class="clip" data-composition-id="${a.id}" data-composition-src="${a.composition}" data-start="${a.start}" data-duration="${a.duration}" data-width="1920" data-height="1080" data-track-index="1"></div>`).join('\n');
const html=`<!doctype html>
<html><head><meta charset="utf-8"><title>Every Hand — A full turn for every learner</title>
<style>${fonts}
html,body{margin:0;padding:0;width:100%;height:100%;overflow:hidden;background:#f7f5ee;}
#root{position:relative;width:100%;height:100%;overflow:hidden;background:#f7f5ee;}
.clip{position:absolute;inset:0;}
</style></head><body>
<div id="root" data-composition-id="everyhand-demo" data-width="1920" data-height="1080" data-fps="60" data-duration="${total}">
${hosts}
<audio id="narration" src="${audio.stems.narration}" data-start="0" data-duration="${total}" data-track-index="10" data-volume="1" data-audio-group="voiceover"></audio>
<audio id="music" src="${audio.stems.music}" data-start="0" data-duration="${total}" data-track-index="11" data-volume="0.7" data-audio-group="music"></audio>
<audio id="effects" src="${audio.stems.effects}" data-start="0" data-duration="${total}" data-track-index="12" data-volume="0.7" data-audio-group="sfx"></audio>
</div>
<script src="assets/vendor/gsap.min.js"></script>
<script>window.__timelines["everyhand-demo"]=gsap.timeline({paused:true});</script>
</body></html>
`;
fs.writeFileSync(path.join(project,'index.html'),html.replace(/[ \t]+$/gm, '').trimEnd()+'\n');
fs.mkdirSync(path.join(project,'shotplan'),{recursive:true});
fs.writeFileSync(path.join(project,'shotplan/film.json'),JSON.stringify(plan,null,2)+'\n');
fs.writeFileSync(path.join(project,'shotplan/README.md'),`# Word-timed shot plan

All 38 narration-linked source changes, camera cues, and text reveals in film.json name actual Deepgram phrases and word IDs; there are zero timing estimates. Five act openings use their actual audio act boundaries. Camera arrivals are 0–0.05s before the recorded phrase. Times are scene-local, with actual act starts in audio_meta.json. Total: ${total}s. Source stills remain native 1600×1000 geometry despite 2× capture. The PDF pages use their actual 1697×2400 geometry.

Interaction clips contain real browser actions. Their uniform playback-rate changes are recorded per shot, followed by the true high-resolution final state. No source motion is interpolated. Arjun's preserved interval is 0:00–4:00 at Place 4; Zara's final interval is 32:00–36:00 at Place 2. The video of minute 32→36 is explicitly a fictional schedule preview.

Source captures and generated PDF are preserved separately. No UI, result count, learner time, or output row is recreated. Text bridges state verified assumptions and do not impersonate app controls. No burned-in narration; transcript.srt is delivered separately.
`);
console.log(JSON.stringify({duration:total,fps:60,acts:plan.acts.map(a=>({id:a.id,start:a.start,end:a.end,shots:a.shots.length})),deepgramCues:plan.acts.flatMap(a=>a.shots).reduce((n,s)=>n+(s.cue.wordId?1:0)+(s.focus?.length??0)+(s.reveal?1:0),0),estimatedCues:0}));
