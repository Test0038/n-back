/* Extension of the original engine: generation/selection only, shared timers and scoring. */
const PART_NAMES = {noun:'Существительные',verb:'Глаголы',adj:'Прилагательные',adv:'Наречия',pron:'Местоимения',num:'Числительные'};
const PART_KEYS = Object.keys(PART_NAMES);
let selectedParts = new Set(['noun']);
let languageKind = 'word';
let languageEnabled = true;
let wordData = null, manifestData = null, dataPromise = null;
let phraseDeck = [];
let preparing = false;
const phraseInput = document.getElementById('phrase-input');
const wordInput = document.getElementById('native-input');
const startButtonMarkup = document.getElementById('start-btn').innerHTML;
function isPhraseMode() { return currentMode.startsWith('phrase:'); }
function isReverseMode() { return currentMode.startsWith('reverse:'); }
function modeName(mode) {
    if (MODE_NAMES[mode]) return MODE_NAMES[mode];
    if (PART_NAMES[mode]) return PART_NAMES[mode];
    const [kind, value] = mode.split(':');
    if (kind === 'phrase') return 'Фраза · ' + value + ' сл.';
    const names = value === 'mix' ? 'Микс' : (value || '').split('+').map(k => PART_NAMES[k] || k).join(' + ');
    return kind === 'reverse' ? 'Обратное слово · ' + names : names || mode;
}
function languageModeKey() {
    const parts = PART_KEYS.filter(k => selectedParts.has(k));
    const key = parts.length === PART_KEYS.length ? 'mix' : parts.join('+');
    if (languageKind === 'phrase') return 'phrase:' + getWheelValue('p');
    if (languageKind === 'reverse') return 'reverse:' + key;
    return parts.length === 1 || key === 'mix' ? key : 'words:' + key;
}
function refreshLanguageSelection() {
    languageEnabled = true; isMathMode = false;
    currentMode = languageModeKey();
    document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('[data-pos]').forEach(b => {b.classList.toggle('active', selectedParts.has(b.dataset.pos)); b.setAttribute('aria-pressed',selectedParts.has(b.dataset.pos));});
    document.getElementById('mix-btn').classList.toggle('active',selectedParts.size === PART_KEYS.length);
    document.getElementById('reverse-btn').classList.toggle('active',languageKind === 'reverse');
    document.getElementById('phrase-btn').classList.toggle('active',languageKind === 'phrase');
}
function selectPart(key) {
    if (!languageEnabled || languageKind === 'phrase') { selectedParts = new Set([key]); languageKind = 'word'; }
    else if (selectedParts.has(key)) { if (selectedParts.size > 1) selectedParts.delete(key); }
    else selectedParts.add(key);
    refreshLanguageSelection();
}
function selectMix() {
    const reset = languageEnabled && selectedParts.size === PART_KEYS.length;
    if (!languageEnabled || (reset && languageKind === 'phrase')) languageKind = 'word';
    selectedParts = new Set(reset ? ['noun'] : PART_KEYS);
    refreshLanguageSelection();
}
function selectLanguageKind(kind) {
    languageKind = languageEnabled && languageKind === kind ? 'word' : kind;
    if (languageKind === 'phrase') selectedParts = new Set(PART_KEYS);
    refreshLanguageSelection();
}
function leaveLanguageMode() { languageEnabled = false; }
async function readData(path) {
    const response = await fetch('./data/' + path);
    if (!response.ok) throw new Error('Data: ' + response.status);
    return response.json();
}
function loadWordData() {
    if (wordData) return Promise.resolve(wordData);
    if (!dataPromise) dataPromise = readData('words-v2.json').then(data => {
        if (!PART_KEYS.every(k => Array.isArray(data.categories[k]) && data.categories[k].length)) throw new Error('Invalid vocabulary');
        wordData = data.categories;
        wordsNoun=wordData.noun;wordsVerb=wordData.verb;wordsAdj=wordData.adj;
        wordsMix=[...new Set(PART_KEYS.flatMap(k=>wordData[k]))];
        wordsDual=wordsNoun.filter(w=>w.length<=9);
        return wordData;
    }).catch(error => { dataPromise = null; throw error; });
    return dataPromise;
}
function gcd(a,b) { while (b) [a,b] = [b,a%b]; return a; }
function coprimeStep(size,seed) { let step = 1 + seed % Math.max(1,size-1); while (gcd(step,size)!==1) step = step % size + 1; return step; }
function randomSeed() { const a = new Uint32Array(1); crypto.getRandomValues(a); return a[0]; }
async function preparePhrases(length,count) {
    if (!manifestData) manifestData = await readData('phrases-v2.json');
    const info = manifestData.lengths[length];
    const key = 'nback_phrase_cursor_v2_' + manifestData.revision + '_' + length;
    let state;
    try {state=JSON.parse(localStorage.getItem(key));} catch (_) {}
    if (!state || !Number.isInteger(state.cursor) || state.cursor<0 || state.cursor>=info.count || !Number.isInteger(state.seed) || state.seed<0 || state.seed>0xffffffff) state={cursor:0,seed:randomSeed()};
    const deck=[]; let lastChunk=-1,chunkData;
    while (deck.length<count) {
        // Visit every chunk once, permute words inside it: usually 1–2 chunks per session.
        const chunks=info.chunks, chunkStep=coprimeStep(chunks.length,state.seed);
        let remaining=state.cursor, chunkIndex=0;
        for (let j=0;j<chunks.length;j++) {
            const index=(j*chunkStep + state.seed%chunks.length)%chunks.length;
            if (remaining<chunks[index].count) {chunkIndex=index;break;}
            remaining-=chunks[index].count;
        }
        if (lastChunk!==chunkIndex) {chunkData=await readData(chunks[chunkIndex].file);lastChunk=chunkIndex;}
        const size=chunkData.length,step=coprimeStep(size,state.seed+chunkIndex);
        deck.push(chunkData[(remaining*step+state.seed%size)%size]);
        state.cursor++;
        if (state.cursor===info.count) {state={cursor:0,seed:randomSeed()};lastChunk=-1;}
    }
    // Reorder only this prepared deck: no skipped sentences or lost cursor entries.
    const opening = s => normalizePhrase(s).split(' ').slice(0,2).join(' ');
    for (let i=1;i<deck.length;i++) {
        const recent = deck.slice(Math.max(0,i-2),i).map(opening);
        if (recent.includes(opening(deck[i]))) {
            const next = deck.findIndex((s,j)=>j>i&&!recent.includes(opening(s)));
            if (next>=0) [deck[i],deck[next]]=[deck[next],deck[i]];
        }
    }
    return {deck,commit(){try {localStorage.setItem(key,JSON.stringify(state));}catch(_){}}};
}
async function prepareGame() {
    if (preparing) return;
    preparing=true;
    const button=document.getElementById('start-btn'), original=startButtonMarkup;
    button.disabled=true;setupScreen.classList.add('loading');
    const settings=Object.fromEntries(['n','r','t','p'].map(k=>[k,getWheelValue(k)]));
    setupScreen.inert=true;
    try {
        if (languageEnabled) {
            currentMode=languageModeKey();
            if (isPhraseMode()) {
                const count=Math.max(getWheelValue('r'),getWheelValue('n')+1);
                const prepared=await preparePhrases(getWheelValue('p'),count);
                phraseDeck=prepared.deck;activeWordList=phraseDeck.slice();prepared.commit();
            } else {
                const data=await loadWordData();
                activeWordList=[...new Set(PART_KEYS.filter(k=>selectedParts.has(k)).flatMap(k=>data[k]))];
            }
        }
        // Keep DUAL's original short-noun restriction and the original mixed-mode algorithm.
        if (currentMode==='dual' || currentMode==='super_mix') {await loadWordData();if(currentMode==='dual')activeWordList=wordsDual;}
        nativeInput=isPhraseMode()?phraseInput:wordInput;
        wordInput.classList.toggle('hidden',isPhraseMode());
        phraseInput.classList.toggle('hidden',!isPhraseMode());
        gameScreen.classList.toggle('phrase-game',isPhraseMode());
        wordDisplay.style.fontSize='';wordCard.style.minHeight='';wordCard.style.padding='';
        for (const [key,value] of Object.entries(settings)) setWheelValue(key,value);
        startGame();
    } catch (error) {
        console.error(error);
        button.textContent='ПОВТОРИТЬ ЗАГРУЗКУ';
        return;
    } finally {
        preparing=false;button.disabled=false;setupScreen.inert=false;setupScreen.classList.remove('loading');
        if (isGameRunning) button.innerHTML=original;
    }
}
function normalizePhrase(s) { return s.toLowerCase().replace(/ё/g,'е').replace(/[^\p{L}\p{N}\s]/gu,' ').replace(/\s+/g,' ').trim(); }
function resizePhraseInput() {
    if (!isPhraseMode()) return;
    phraseInput.style.height='auto';
    phraseInput.style.height=Math.min(innerWidth<350?90:150,Math.max(60,phraseInput.scrollHeight+2))+'px';
    requestAnimationFrame(fitPhrase);
}
function fitPhrase() {
    if (!isPhraseMode() || wordDisplay.classList.contains('countdown-big')) return;
    wordDisplay.style.fontSize='22px';
    const padding=needsInput?34:78;
    wordCard.style.padding=needsInput?'16px 0':'40px 0 36px';
    wordCard.style.minHeight=Math.max(165,wordDisplay.scrollHeight+padding)+'px';
}
phraseInput.addEventListener('input',resizePhraseInput);
phraseInput.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.isComposing){e.preventDefault();submitMath();}});
if (viewport) viewport.addEventListener('resize',()=>{if(isPhraseMode())resizePhraseInput();});
// Warm only the modest vocabulary. Phrase files are loaded on demand.
setTimeout(()=>loadWordData().catch(()=>{}),500);
