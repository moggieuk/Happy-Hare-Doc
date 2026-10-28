/* Cutter-after-extruder example from Macro-Toolhead-Tip-Cutting.md.
 * Heights are mm above the internal nozzle reference. Melt mixing is schematic.
 */
window.HHAnimations.register("tip-cutting-purge", {
  title: "Tip cutting and purging",
  secondsPerStage: 3.4,
  height: 390,
  caption: "Cutter after extruder · example dimensions in mm · motion slowed · melt and color mixing schematic",
  legend: [["outgoing", "Outgoing filament"], ["cut", "Cut fragment"],
           ["residual", "Residual melt"], ["incoming", "Incoming filament"]],
  stages: [
 ['Printing → park','park_toolchange: …, 2','Example parking retract: 2 mm; residual melt represented by 2 mm of filament.'],
 ['Retract out of the melt zone','retract_length: 42 · toolhead_residual_filament: 2','The tip reaches 42 mm above the nozzle reference; prior retraction is accounted for.'],
 ['Cut at the blade','blade_pos: 52 · cut_iterations: 1','52 − 42 = 10 mm of cut filament remains below the blade.'],
 ['Rip free of the blade','rip_length: 1','The upstream filament retracts 1 mm; the cut fragment stays in place.'],
 ['Push the fragment into the hotend','pushback_length: 25','The first millimeter closes the rip gap; the fragment moves down to 18–28 mm.'],
 ['Return after pushback','pushback_dwell_time · pushback_length: 25','After any configured dwell, the upstream filament returns; the fragment stays in the hotend.'],
 ['Unload the outgoing filament','toolhead_extruder_to_nozzle: 72','The MMU withdraws the outgoing filament. Cut filament and residual melt remain.'],
 ['Home the incoming filament','toolhead_sensor_to_nozzle: 62','The next filament advances to the toolhead sensor, above the retained fragment.'],
 ['Complete the toolhead load','toolhead_residual_filament: 2 · toolhead_ooze_reduction: 0','The final load accounts for the 10 mm fragment, 2 mm residual and 2 mm parking retract.'],
 ['Recover the parking retract','park_toolchange: …, 2','The 2 mm parking retract is recovered as the toolchange proceeds to extrusion.'],
 ['Purge the retained material','purge_macro: _MMU_PURGE · extruder_purge_speed','New filament pushes residual melt and the cut fragment through the nozzle.'],
 ['Flush the color transition','printer.mmu.toolchange_purge_volume','Suggested purge includes retained material plus the color purge and applicable material-change allowance.'],
 ['New filament ready','purge_material_change_volume · purge_change_min_volume','Continue for the configured purge volume; the clean-color endpoint here is illustrative.']
 ],
  render(svg, position, width) {
    const i = Math.min(this.stages.length - 1, Math.floor(position));
    const t = position - i;
    const interpolate = (a, b, fraction) => a + (b - a) * fraction;
    const y = height => 330 - height * 2.8;
    const x=width<440?width*.65:width*.52;
   let end=2,top=108,fragTop=52,fragBottom=42,fragment=false,incoming=false,residual=2,blade=0,purge=0;
   if(i===0)end=interpolate(2,4,t);
   if(i===1)end=interpolate(4,42,t);
   if(i===2){end=t<.5?42:52;fragment=t>=.5;blade=Math.sin(Math.PI*t);}
   if(i===3){end=interpolate(52,53,t);fragment=true;}
   if(i===4){end=interpolate(53,28,t);fragment=true;const shift=Math.max(0,25*t-1);fragTop=52-shift;fragBottom=42-shift;}
   if(i>=5){fragment=true;fragTop=28;fragBottom=18;end=53;}
   if(i===5)end=interpolate(28,53,t);
   if(i===6)end=interpolate(53,112,t);
   if(i===7){incoming=true;end=interpolate(108,62,t);}
   if(i===8){incoming=true;end=interpolate(62,14,t);const shift=Math.max(0,28-end);fragTop=28-shift;fragBottom=18-shift;}
   if(i===9){incoming=true;end=interpolate(14,12,t);fragTop=end;fragBottom=end-10;}
   if(i>=10){incoming=true;const advance=i===10?t*12:12;end=Math.max(0,12-advance);fragTop=Math.max(0,12-advance);fragBottom=Math.max(0,2-advance);residual=Math.max(0,2-advance);purge=i===10?t:i===11?1:1;fragment=fragTop>0;}
   const rect=(xx,yy,w,h,fill,extra='')=>'<rect x="'+xx+'" y="'+yy+'" width="'+w+'" height="'+Math.max(0,h)+'" fill="'+fill+'" '+extra+'/>';
   const label=(xx,yy,s)=>'<text class="hh-animation-label" x="'+xx+'" y="'+yy+'">'+s+'</text>';
   let s='<title>Tip cutting and purging: '+this.stages[i][0]+'</title>';
   s+=rect(x-12,y(108),24,y(3)-y(108),'var(--hh-surface)','class="hh-animation-structure"');
   s+=rect(x-37,y(22),74,56,'var(--hh-surface)','class="hh-animation-structure" rx="5"');
   for(const [h,name] of [[80,'Entry sensor · 80'],[72,'Extruder gears · 72'],[62,'Toolhead sensor · 62'],[52,'Blade · 52'],[0,'Nozzle reference · 0']]){
     s+='<line class="hh-animation-line" x1="8" x2="'+(x-42)+'" y1="'+y(h)+'" y2="'+y(h)+'"/>'+label(8,y(h)-7,name);
   }
   for(const h of [80,62])s+=rect(x+14,y(h)-4,10,8,'var(--hh-text)');
   for(const dx of [-26,26]){s+='<circle class="hh-animation-structure" cx="'+(x+dx)+'" cy="'+y(72)+'" r="15"/>';const a=(incoming?-end:end)*.4;s+='<line stroke="var(--hh-text)" x1="'+(x+dx-Math.cos(a)*10)+'" y1="'+(y(72)-Math.sin(a)*10)+'" x2="'+(x+dx+Math.cos(a)*10)+'" y2="'+(y(72)+Math.sin(a)*10)+'"/>';}
   s+='<path class="hh-animation-structure" d="M'+(x-15)+','+y(3)+' L'+(x+15)+','+y(3)+' L'+(x+5)+',337 L'+(x-5)+',337 Z"/>';
   if(end<top)s+=rect(x-5,y(top),10,y(end)-y(top),incoming?'var(--hh-incoming)':'var(--hh-outgoing)');
   if(fragment)s+=rect(x-5,y(fragTop),10,y(fragBottom)-y(fragTop),'var(--hh-cut)');
   if(residual)s+=rect(x-7,y(residual),14,y(0)-y(residual),'var(--hh-residual)');
   const bx=x+15-28*blade;s+='<path d="M'+bx+','+y(52)+' l42,-5 v10 Z" fill="var(--hh-metal)"/>';
   if(i>=3&&i<=9){const yy=y((fragTop+fragBottom)/2);s+='<path d="M'+(x+10)+','+yy+' h18" stroke="var(--hh-text)"/>'+label(x+31,yy-3,'Cut tip')+label(x+31,yy+13,'10 mm');}
   if(i>0&&i<10)s+=label(x+30,322,'Residual');
   if(i>=10){let col=i===10?(t<.17?'var(--hh-residual)':'var(--hh-cut)'):'var(--hh-incoming)';s+='<path d="M'+x+',333 v12 q24,8 0,15 t0,15" fill="none" stroke="'+col+'" stroke-width="5" stroke-dasharray="'+(80*purge)+' 100"/>';if(i===11)s+='<path d="M'+x+',348 q24,8 0,15 t0,15" fill="none" stroke="var(--hh-cut)" stroke-width="5" opacity="'+(1-t)+'"/>';s+=label(8,373,i===10?'Retained material exits':i===11?'Old → new color':'Purge complete');}

    svg.innerHTML = s;
    svg.setAttribute("viewBox", "0 0 " + width + " 390");
  }
});
