/*
  SEA Happiness · 2025 (p5.js)
  - Sodaro palette (electric blue)
  - Top-right Sodaro logo badge (no glow)
  - All original interactions preserved
*/

// ---------- Data ----------
let SEA_DATA = [
  { country: "Myanmar",     score: 4.360, gdp: 0.710, support: 1.181, health: 0.555, freedom: 0.525, generosity: 0.566, corruption: 0.172 },
  { country: "Cambodia",    score: 4.476, gdp: 0.603, support: 1.184, health: 0.633, freedom: 0.605, generosity: 0.287, corruption: 0.046 },
  { country: "Vietnam",     score: 5.175, gdp: 0.748, support: 1.419, health: 0.871, freedom: 0.505, generosity: 0.165, corruption: 0.076 },
  { country: "Indonesia",   score: 5.196, gdp: 0.940, support: 1.159, health: 0.637, freedom: 0.513, generosity: 0.297, corruption: 0.038 },
  { country: "Laos",        score: 5.203, gdp: 0.528, support: 1.042, health: 0.449, freedom: 0.449, generosity: 0.228, corruption: 0.183 },
  { country: "Philippines", score: 5.631, gdp: 0.812, support: 1.209, health: 0.614, freedom: 0.662, generosity: 0.300, corruption: 0.120 },
  { country: "Thailand",    score: 6.008, gdp: 1.050, support: 1.408, health: 0.760, freedom: 0.520, generosity: 0.357, corruption: 0.055 },
  { country: "Malaysia",    score: 6.088, gdp: 1.156, support: 1.258, health: 0.766, freedom: 0.407, generosity: 0.291, corruption: 0.041 },
  { country: "Singapore",   score: 6.262, gdp: 1.574, support: 1.306, health: 1.141, freedom: 0.549, generosity: 0.271, corruption: 0.464 }
];

// ---------- Layout ----------
const CANVAS_W = 1400, CANVAS_H = 720;
const LEFT_PANEL_W = 520, RIGHT_PAD = 36;
const chart = { baselineY: CANVAS_H - 90, barW: 56, spacing: 86, startX: 0, leftMargin: LEFT_PANEL_W };
const donut = { cx: LEFT_PANEL_W * 0.5, cy: 320, r: 160, ir: 98 };

// ---------- Palette (Sodaro) ----------
const SODARO = {
  accent:  [  6, 182, 255], // electric blue (primary)
  accent2: [ 30, 146, 224], // deeper blue for range
  dark:    [ 26,  30,  38]
};
const colors = {
  barBase: 48, // neutral dark fill for bars at rest
  accent:  SODARO.accent,     // used for active/hover
  textPrimary:   [245,245,245],
  textSecondary: [205,213,224],
  textMuted:     [165,174,188]
};
// donut ring: nine blue shades → replaces brown palette
const BLUES_HEX = ["#0CAFFF","#1E92E0","#36A8FF","#2B8BD1","#56B7FF","#2F7FBF","#4AB6FF","#2B7AB5","#88D5FF"];

// ---------- Flags ----------
const FLAG = {
  "Myanmar": "🇲🇲","Cambodia":"🇰🇭","Vietnam":"🇻🇳","Indonesia":"🇮🇩",
  "Laos":"🇱🇦","Philippines":"🇵🇭","Thailand":"🇹🇭","Malaysia":"🇲🇾","Singapore":"🇸🇬"
};

// ---------- State ----------
let bgImg, logoImg;
let barStates = [];
let selectedIndex = -1;
let hoverBarIndex = -1;
let hoverDonutIndex = -1;
let startTime = 0;
const ENTER_STAGGER = 70, ENTER_DUR = 700;

// Detail modal animation
let detailAlpha = 0;
let detailScale = 0.96;
let detailOpenMs = 0;
const DETAIL_FADE_SPEED = 0.2;
const DETAIL_POP_DURATION = 260;

// Card geometry for hit testing (updated each draw)
const cardRect = { x:0,y:0,w:720,h:340 };
let closeBtn = { x:0,y:0,w:28,h:28 };

// ---------- Preload ----------
function preload(){
  bgImg = loadImage("image_b701a4.jpg");
  logoImg = loadImage("sodaro_logo.png"); // transparent PNG
}

// ---------- Setup ----------
function setup(){
  const c = createCanvas(CANVAS_W, CANVAS_H);
  if (document.getElementById("app")) c.parent("app");
  textFont("system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial");

  reflowBarsLayout();

  for (let i=0;i<SEA_DATA.length;i++){
    const baseH = valueToBarHeight(SEA_DATA[i].score);
    const x = chart.startX + i*chart.spacing;
    barStates[i] = { x, tx:x, h:0, th:baseH, delay:i*ENTER_STAGGER, alphaMul:0 };
  }

  startTime = millis(); frameRate(60);
}

// ---------- Draw ----------
function draw(){
  drawBackgroundCover();

  // Divider
  stroke(255,22); line(LEFT_PANEL_W, 0, LEFT_PANEL_W, height);

  // Header
  noStroke(); fill(...colors.textPrimary); textAlign(LEFT,TOP);
  textSize(20); textStyle(BOLD);
  text("Southeast Asia — Happiness Index (2019)", 24, 24);
  textSize(12); textStyle(NORMAL); fill(...colors.textSecondary);
  text("Hover bars or slices • Click to open Score Detail", 24, 48);

  // Hover detection
  hoverBarIndex = barHitIndex(mouseX, mouseY);
  hoverDonutIndex = donutHitIndex(mouseX, mouseY);

  const visualHoverIndex = (hoverBarIndex >= 0) ? hoverBarIndex :
                           (selectedIndex < 0 ? hoverDonutIndex : -1);

  drawBars(visualHoverIndex);
  drawDonutSynced(visualHoverIndex);

  // Top-right Sodaro logo badge (no glow)
  drawLogoTopRight();

  // Click hint
  if (selectedIndex < 0) drawClickHint();

  // Detail modal animation
  const targetAlpha = (selectedIndex >= 0) ? 1 : 0;
  detailAlpha = lerp(detailAlpha, targetAlpha, DETAIL_FADE_SPEED);

  const popElapsed = max(0, millis() - detailOpenMs);
  const popT = constrain(popElapsed / DETAIL_POP_DURATION, 0, 1);
  const popEase = 1 - pow(1 - popT, 3);
  const targetScale = (selectedIndex >= 0) ? 1.0 : 0.96;
  detailScale = lerp(0.96, targetScale, popEase);

  if (detailAlpha > 0.01) drawScoreDetailCentered(selectedIndex, detailAlpha, detailScale);
}

// ---------- Background ----------
function drawBackgroundCover(){
  if (!bgImg) { background(12); return; }
  const imgAR = bgImg.width / bgImg.height;
  const canAR = width / height;
  let w,h,x,y;
  if (canAR > imgAR){ w = width; h = width / imgAR; x = 0; y = (height - h)/2; }
  else { h = height; w = height * imgAR; x = (width - w)/2; y = 0; }
  image(bgImg, x, y, w, h);

  // subtle dark overlay
  noStroke(); fill(0,0,0,110); rect(0,0,width,height);

  // thin frame
  noFill(); stroke(255,200,120,22); strokeWeight(2);
  rect(8,8,width-16,height-16,16);
}

// ---------- Bars ----------
function drawBars(visualHoverIndex){
  const t = millis() - startTime; textAlign(CENTER,BOTTOM);

  for (let i=0;i<SEA_DATA.length;i++){
    const d = SEA_DATA[i], s = barStates[i];
    const local = max(0, t - s.delay), prog = constrain(local/ENTER_DUR, 0, 1);
    const ease = 1 - pow(1 - prog, 3);
    s.alphaMul = ease; s.x = lerp(s.x, s.tx, 0.14);

    const baseH = valueToBarHeight(d.score);
    const isSel = i===selectedIndex, isHov = i===visualHoverIndex;
    const growth = isSel ? 72 : (isHov ? 38 : 0);
    const th = baseH*ease + growth;
    s.h = lerp(s.h, th, 0.17);

    let alpha = 220;
    if (selectedIndex>=0) alpha = isSel ? 255 : 70;
    else if (visualHoverIndex>=0) alpha = (isHov ? 255 : 110);
    alpha *= s.alphaMul;

    const barX = s.x - chart.barW/2, barY = chart.baselineY - s.h;

    // bar body — active uses Sodaro accent
    if (isSel || isHov){
      noStroke(); fill(colors.accent[0], colors.accent[1], colors.accent[2], alpha);
    } else {
      stroke(70, alpha); fill(colors.barBase, alpha);
    }
    rect(barX, barY, chart.barW, s.h, 6);

    // label
    noStroke();
    fill(...(isSel || isHov ? colors.textPrimary : colors.textSecondary));
    textSize(12); text(d.country, s.x, barY - 10);
  }
}

// ---------- Donut ----------
function drawDonutSynced(visualHoverIndex){
  const values = SEA_DATA.map(d => max(0.0001, d.score));
  const total  = values.reduce((a,b)=>a+b, 0);

  const donutHover = donutHitIndex(mouseX, mouseY);
  const activeFromHover = (visualHoverIndex >= 0) ? visualHoverIndex : donutHover;
  const activeIdx = (selectedIndex >= 0) ? selectedIndex : activeFromHover;

  // shadow
  noStroke(); fill(0, 90);
  ellipse(donut.cx + 2, donut.cy + 5, donut.r*2.06, donut.r*2.06);

  let start = -HALF_PI, cur = start;
  for (let i=0;i<SEA_DATA.length;i++){
    const a = (values[i]/total)*TWO_PI;

    let col = color(BLUES_HEX[i % BLUES_HEX.length]);
    let alpha = (activeIdx >= 0 && i !== activeIdx) ? 110 : 225;
    let expand = 0;

    if (i === activeIdx){
      col = color(SODARO.accent[0], SODARO.accent[1], SODARO.accent[2]); // match bars
      alpha = 255;
      expand = (selectedIndex >= 0) ? 12 : 8;
    }

    noStroke(); col.setAlpha(alpha); fill(col);
    ringSlice(donut.cx, donut.cy, donut.r + expand, donut.ir, cur, cur + a);

    cur += a;
  }

  // center labels
  noStroke(); fill(0,165); ellipse(donut.cx, donut.cy, donut.ir*1.46, donut.ir*1.46);
  const labelIdx = (selectedIndex>=0) ? selectedIndex : activeIdx;
  const title = (labelIdx>=0) ? SEA_DATA[labelIdx].country : "SCORE";
  const sub   = (labelIdx>=0) ? `${nf(SEA_DATA[labelIdx].score,1,3)} score` : "distribution";
  fill(...colors.textPrimary); textAlign(CENTER,CENTER); textStyle(BOLD); textSize(14);
  text(title, donut.cx, donut.cy-8);
  textStyle(NORMAL); fill(...colors.textSecondary); textSize(12);
  text(sub, donut.cx, donut.cy+12);
}

function ringSlice(cx,cy,or,ir,a,b){
  beginShape();
  for (let ang=a; ang<=b; ang+=radians(4)) vertex(cx+cos(ang)*or, cy+sin(ang)*or);
  vertex(cx+cos(b)*or, cy+sin(b)*or);
  for (let ang=b; ang>=a; ang-=radians(4)) vertex(cx+cos(ang)*ir, cy+sin(ang)*ir);
  vertex(cx+cos(a)*ir, cy+sin(a)*ir);
  endShape(CLOSE);
}

// ---------- Score Detail (CENTERED MODAL) ----------
function drawScoreDetailCentered(idx, alpha, scaleAmt){
  if (idx < 0) return;
  const d = SEA_DATA[idx];

  // modal backdrop
  noStroke(); fill(0,0,0, 140 * alpha); rect(0,0,width,height);

  // card size/position
  cardRect.w = 720; cardRect.h = 340;
  const cx = width/2, cy = height/2;
  cardRect.x = cx - cardRect.w/2;
  cardRect.y = cy - cardRect.h/2;

  push();
  translate(cx, cy);
  scale(scaleAmt);     // pop
  translate(-cardRect.w/2, -cardRect.h/2);

  // glass card
  noStroke(); fill(14,18,26, 220 * alpha); rect(0,0,cardRect.w,cardRect.h,16);
  stroke(255,255,255, 36 * alpha); noFill(); rect(0,0,cardRect.w,cardRect.h,16);

  // close button
  closeBtn.x = cardRect.w - 36; closeBtn.y = 12; closeBtn.w = 24; closeBtn.h = 24;
  noStroke(); fill(34,36,42, 220*alpha); rect(closeBtn.x, closeBtn.y, closeBtn.w, closeBtn.h, 6);
  stroke(255,255,255, 160*alpha); strokeWeight(1.5);
  line(closeBtn.x+7, closeBtn.y+7, closeBtn.x+17, closeBtn.y+17);
  line(closeBtn.x+17, closeBtn.y+7, closeBtn.x+7, closeBtn.y+17);
  noStroke();

  // Title
  const flag = FLAG[d.country] || "🏳️";
  const title = `${flag}  ${d.country}`;
  textAlign(CENTER, TOP);
  textStyle(BOLD);
  fill(...colors.textPrimary, 255*alpha);
  textSize(22);
  text(title, cardRect.w/2, 22);

  // score badge (Sodaro accent)
  drawScoreBadge(cardRect.w/2 - 70, 52, 140, 30, d.score, alpha);

  // explanation
  textStyle(NORMAL); textSize(13); fill(...colors.textSecondary, 255*alpha);
  textAlign(LEFT, TOP);
  const leftX = 24, leftY = 96, leftW = cardRect.w/2 - 36;
  text(explainWhyHappy(d), leftX, leftY, leftW, 90);

  // key/values
  const rx = cardRect.w/2 + 12, ry = 96;
  drawKV(rx, ry +   0, "GDP per capita",  nf(d.gdp,1,3), alpha);
  drawKV(rx, ry +  28, "Social support",   nf(d.support,1,3), alpha);
  drawKV(rx, ry +  56, "Healthy life",     nf(d.health,1,3), alpha);
  drawKV(rx, ry +  84, "Freedom",          nf(d.freedom,1,3), alpha);
  drawKV(rx, ry + 112, "Generosity",       nf(d.generosity,1,3), alpha);
  drawKV(rx, ry + 140, "Lower corruption", nf(1 - d.corruption,1,3), alpha, " (inv)");

  // hint
  textAlign(RIGHT,BOTTOM); textSize(11); fill(...colors.textMuted, 220*alpha);
  text("Click background, press ESC, or × to close", cardRect.w - 16, cardRect.h - 12);

  pop();
}

function drawKV(x,y,label,value,alpha,extra=""){
  textAlign(LEFT,CENTER); textStyle(NORMAL); textSize(12);
  fill(225,225,225, 255*alpha);
  text(label, x, y);
  // dotted leader
  const padR = 120;
  const dotsStart = x + textWidth(label) + 8;
  const dotsEnd = x + padR + 200;
  stroke(255,255,255, 60*alpha); strokeWeight(1);
  for (let xx = dotsStart; xx < dotsEnd; xx += 4) line(xx, y, min(xx+2, dotsEnd), y);
  noStroke();
  // value
  textAlign(RIGHT,CENTER); textStyle(BOLD);
  fill(...colors.textPrimary, 255*alpha);
  text(value + (extra||""), x + padR + 200, y);
}

function drawScoreBadge(x,y,w,h,score,alpha){
  noStroke(); fill(34,36,42, 210*alpha); rect(x,y,w,h,999);
  stroke(SODARO.accent[0], SODARO.accent[1], SODARO.accent[2], 160*alpha); noFill(); rect(x,y,w,h,999);
  fill(...colors.textPrimary, 255*alpha); textAlign(CENTER,CENTER); textSize(12); textStyle(BOLD);
  text(`Score ${nf(score,1,3)}`, x+w/2, y+h/2+1);
}

// ---------- Top-right logo ----------
function drawLogoTopRight(){
  if (!logoImg) return;
  const pad = 14;
  const size = 48; // tweak if you want it smaller/larger
  // clean badge container (no glow)
  noStroke(); fill(14,18,26, 180);
  rect(width - size - pad - 8, pad, size + 8, size + 8, 10);
  stroke(255,255,255, 26); noFill();
  rect(width - size - pad - 8, pad, size + 8, size + 8, 10);
  image(logoImg, width - size - pad - 4, pad + 4, size, size);
}

// ---------- Small bottom hint ----------
function drawClickHint(){
  const txt = "Click a bar or donut slice to open Score Detail";
  textSize(12); const tw = textWidth(txt) + 24;
  const w = min(max(280, tw), 520), h = 28;
  const x = width - w - 24, y = height - h - 18;
  noStroke(); fill(14,18,26,200); rect(x,y,w,h,8);
  stroke(255,255,255,36); noFill(); rect(x,y,w,h,8);
  noStroke(); fill(...colors.textSecondary); textAlign(CENTER,CENTER);
  text(txt, x + w/2, y + h/2 + 0.5);
}

// ---------- Explain ----------
function explainWhyHappy(d){
  const positives = [
    {k:"gdp", v:d.gdp, label:"GDP per capita"},
    {k:"support", v:d.support, label:"social support"},
    {k:"health", v:d.health, label:"healthy life expectancy"},
    {k:"freedom", v:d.freedom, label:"freedom to choose"},
    {k:"generosity", v:d.generosity, label:"generosity"}
  ].sort((a,b)=>b.v-a.v);
  const a = positives[0].label, b = positives[1].label;
  const corr = d.corruption <= 0.08 ? "with low perceived corruption" :
               d.corruption <= 0.15 ? "with moderate corruption concerns" : "despite higher perceived corruption";
  return `Strong ${a} and solid ${b} ${corr} help drive the overall score.`;
}

// ---------- Interactions ----------
function mousePressed(){
  // modal close or backdrop
  if (detailAlpha > 0.9 && selectedIndex >= 0){
    const cx = width/2, cy = height/2;
    const mx = mouseX - (cx - cardRect.w/2);
    const my = mouseY - (cy - cardRect.h/2);

    if (mx > closeBtn.x && mx < closeBtn.x + closeBtn.w &&
        my > closeBtn.y && my < closeBtn.y + closeBtn.h){
      selectedIndex = -1; return;
    }
    const insideCard =
      mouseX >= cardRect.x && mouseX <= cardRect.x + cardRect.w &&
      mouseY >= cardRect.y && mouseY <= cardRect.y + cardRect.h;
    if (!insideCard){ selectedIndex = -1; return; }
    return;
  }

  // bars
  const bi = barHitIndex(mouseX, mouseY);
  if (bi >= 0){ selectedIndex = (selectedIndex === bi) ? -1 : bi; if (selectedIndex >= 0) detailOpenMs = millis(); return; }

  // donut
  const di = donutHitIndex(mouseX, mouseY);
  if (di >= 0){ selectedIndex = (selectedIndex === di) ? -1 : di; if (selectedIndex >= 0) detailOpenMs = millis(); return; }
}

function keyPressed(){
  if (keyCode === ESCAPE && selectedIndex >= 0){ selectedIndex = -1; }
}

// ---------- Hit Tests ----------
function barHitIndex(mx,my){
  if (mx < chart.leftMargin) return -1;
  for (let i=0;i<SEA_DATA.length;i++){
    const s = barStates[i];
    const x = s.x - chart.barW/2, y = chart.baselineY - s.h;
    if (mx>x && mx<x+chart.barW && my>y && my<chart.baselineY) return i;
  }
  return -1;
}

function donutHitIndex(mx,my){
  const dx = mx - donut.cx, dy = my - donut.cy;
  const distR = sqrt(dx*dx + dy*dy);
  const inside = (mx < chart.leftMargin) && distR >= donut.ir && distR <= donut.r + 10;
  if (!inside) return -1;

  const values = SEA_DATA.map(d => max(0.0001, d.score));
  const total  = values.reduce((a,b)=>a+b, 0);
  let angleM = atan2(dy, dx); if (angleM < -HALF_PI) angleM += TWO_PI;

  let start = -HALF_PI, s = start;
  for (let i=0;i<values.length;i++){
    const a = (values[i]/total)*TWO_PI, e = s + a;
    let am = angleM; if (am < s) am += TWO_PI;
    const wrap = (e < s) ? e + TWO_PI : e;
    if (am >= s && am < wrap) return i;
    s = e;
  }
  return -1;
}

// ---------- Utilities ----------
function reflowBarsLayout(){
  chart.leftMargin = LEFT_PANEL_W;
  const rightW = width - chart.leftMargin - RIGHT_PAD;
  const N = SEA_DATA.length, pad = 40;
  const spacing = (rightW - pad*2) / N;
  chart.spacing = constrain(spacing, 64, 110);
  chart.barW = min(56, spacing*0.60);
  const total = N*chart.spacing;
  chart.startX = chart.leftMargin + pad + chart.spacing/2 + (rightW - pad*2 - total)/2;
}

function valueToBarHeight(val){ return map(val, 4.3, 6.3, 80, 520, true); }
