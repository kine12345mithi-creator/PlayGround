// ---------------------------------------------------------------------------
// THE OVAL — data layer
// ---------------------------------------------------------------------------
export const PROJECT = { ox: -96, oy: 38, sx: 13.5, sz: 16 };
export const project = (lon, lat) => ({
  x: (lon - PROJECT.ox) * PROJECT.sx,
  z: (PROJECT.oy - lat) * PROJECT.sz,
});

export const CITIES = [
  { id:'dc', name:'Washington, D.C.', short:'Washington', lon:-77.04, lat:38.90, tier:1, pop:'6.3M', state:'District of Columbia', landmark:'whitehouse', blurb:'The capital of the republic. The White House, the Capitol, and the monuments of the American experiment.' },
  { id:'nyc', name:'New York City', short:'New York', lon:-74.00, lat:40.71, tier:1, pop:'18.9M', state:'New York', landmark:'empire', blurb:'The financial capital of the world. Markets, media, and the United Nations.' },
  { id:'la', name:'Los Angeles', short:'Los Angeles', lon:-118.24, lat:34.05, tier:1, pop:'12.8M', state:'California', landmark:'hollywood', blurb:'Entertainment, aerospace, and the Pacific. The city of angels watches every move you make.' },
  { id:'chi', name:'Chicago', short:'Chicago', lon:-87.63, lat:41.88, tier:1, pop:'9.4M', state:'Illinois', landmark:'willis', blurb:'The heart of the Midwest. Steel, rail, and the Great Lakes.' },
  { id:'mia', name:'Miami', short:'Miami', lon:-80.19, lat:25.76, tier:2, pop:'6.1M', state:'Florida', landmark:'miami', blurb:'The gateway to the Americas. Beaches, hurricanes, and a swinging political pendulum.' },
  { id:'hou', name:'Houston', short:'Houston', lon:-95.37, lat:29.76, tier:2, pop:'7.1M', state:'Texas', landmark:'rocket', blurb:'Energy and space. Mission Control monitors more than rockets.' },
  { id:'sea', name:'Seattle', short:'Seattle', lon:-122.33, lat:47.61, tier:2, pop:'4.0M', state:'Washington', landmark:'needle', blurb:'Software, coffee, and the Pacific trade routes. A gateway to Asia.' },
  { id:'den', name:'Denver', short:'Denver', lon:-104.99, lat:39.74, tier:2, pop:'2.9M', state:'Colorado', landmark:'denver', blurb:'The mile-high capital of the Mountain West. Energy, water, and the Rockies.' },
  { id:'phx', name:'Phoenix', short:'Phoenix', lon:-112.07, lat:33.45, tier:2, pop:'4.8M', state:'Arizona', landmark:'desert', blurb:'The fastest-growing metro in the desert. Heat, water rights, and the border.' },
  { id:'las', name:'Las Vegas', short:'Las Vegas', lon:-115.14, lat:36.17, tier:3, pop:'2.3M', state:'Nevada', landmark:'vegas', blurb:'Neon in the desert. Tourism, unions, and the Nevada political machine.' },
  { id:'sfo', name:'San Francisco', short:'San Francisco', lon:-122.42, lat:37.77, tier:2, pop:'4.7M', state:'California', landmark:'goldengate', blurb:'Venture capital, technology, and the Bay. The future is built here.' },
  { id:'dal', name:'Dallas', short:'Dallas', lon:-96.80, lat:32.78, tier:2, pop:'7.6M', state:'Texas', landmark:'reunion', blurb:'Corporate headquarters and a deep Republican bench. Everything is bigger.' },
  { id:'atl', name:'Atlanta', short:'Atlanta', lon:-84.39, lat:33.75, tier:2, pop:'6.1M', state:'Georgia', landmark:'atlanta', blurb:'The capital of the New South. Hartsfield-Jackson moves the world.' },
  { id:'bos', name:'Boston', short:'Boston', lon:-71.06, lat:42.36, tier:2, pop:'4.9M', state:'Massachusetts', landmark:'boston', blurb:'Old money, new ideas, and the country’s oldest political traditions.' },
  { id:'nola', name:'New Orleans', short:'New Orleans', lon:-90.07, lat:29.95, tier:3, pop:'1.3M', state:'Louisiana', landmark:'nola', blurb:'The Mississippi delta. Culture, ports, and the memory of storms.' },
  { id:'hnl', name:'Honolulu', short:'Honolulu', lon:-157.86, lat:21.31, tier:3, pop:'1.0M', state:'Hawaii', landmark:'hawaii', blurb:'The Pacific outpost of the republic. Pearl Harbor is always on the map.' },
];

export const COUNTRIES = [
  { id:'CAN', name:'Canada', capital:'Ottawa', region:'North America', lon:-75.7, lat:45.4, gdp:2.14, military:42, stability:88, rel:88, gov:'Parliamentary democracy', leader:'PM Élise Marchand', trait:'cooperative', nuclear:false, bloc:'NATO', flag:['#d52b1e','#ffffff','#d52b1e'] },
  { id:'MEX', name:'Mexico', capital:'Mexico City', region:'North America', lon:-99.1, lat:19.4, gdp:1.79, military:36, stability:58, rel:72, gov:'Federal republic', leader:'Presidenta Sofía Reyes', trait:'pragmatic', nuclear:false, bloc:'USMCA', flag:['#006847','#ffffff','#ce1126'] },
  { id:'GBR', name:'United Kingdom', capital:'London', region:'Europe', lon:-0.1, lat:51.5, gdp:3.34, military:74, stability:82, rel:92, gov:'Parliamentary monarchy', leader:'PM Alistair Finch', trait:'loyal', nuclear:true, bloc:'NATO', flag:['#012169','#ffffff','#c8102e'] },
  { id:'FRA', name:'France', capital:'Paris', region:'Europe', lon:2.35, lat:48.86, gdp:3.13, military:71, stability:74, rel:84, gov:'Semi-presidential republic', leader:'Président Camille Aubert', trait:'independent', nuclear:true, bloc:'NATO', flag:['#0055a4','#ffffff','#ef4135'] },
  { id:'DEU', name:'Germany', capital:'Berlin', region:'Europe', lon:13.4, lat:52.5, gdp:4.46, military:58, stability:81, rel:85, gov:'Federal republic', leader:'Chancellor Jonas Krüger', trait:'cautious', nuclear:false, bloc:'NATO', flag:['#1a1a1a','#dd0000','#ffce00'] },
  { id:'ITA', name:'Italy', capital:'Rome', region:'Europe', lon:12.5, lat:41.9, gdp:2.17, military:51, stability:66, rel:80, gov:'Parliamentary republic', leader:'PM Elena Romano', trait:'flexible', nuclear:false, bloc:'NATO', flag:['#009246','#ffffff','#ce2b37'] },
  { id:'ESP', name:'Spain', capital:'Madrid', region:'Europe', lon:-3.7, lat:40.4, gdp:1.58, military:44, stability:70, rel:78, gov:'Parliamentary monarchy', leader:'PM Álvaro Vidal', trait:'pragmatic', nuclear:false, bloc:'NATO', flag:['#aa151b','#f1bf00','#aa151b'] },
  { id:'POL', name:'Poland', capital:'Warsaw', region:'Europe', lon:21.0, lat:52.2, gdp:0.81, military:54, stability:77, rel:82, gov:'Parliamentary republic', leader:'PM Katarzyna Nowak', trait:'hawkish', nuclear:false, bloc:'NATO', flag:['#ffffff','#dc143c','#ffffff'] },
  { id:'UKR', name:'Ukraine', capital:'Kyiv', region:'Europe', lon:30.5, lat:50.45, gdp:0.18, military:63, stability:44, rel:76, gov:'Presidential republic', leader:'President Petro Danylenko', trait:'defiant', nuclear:false, bloc:'Partner', flag:['#0057b7','#ffd700','#0057b7'] },
  { id:'RUS', name:'Russia', capital:'Moscow', region:'Eurasia', lon:37.6, lat:55.75, gdp:2.02, military:89, stability:63, rel:24, gov:'Authoritarian federation', leader:'President Viktor Volkov', trait:'revisionist', nuclear:true, bloc:'BRICS', flag:['#ffffff','#0039a6','#d52b1e'] },
  { id:'TUR', name:'Türkiye', capital:'Ankara', region:'Eurasia', lon:32.85, lat:39.9, gdp:1.12, military:67, stability:61, rel:62, gov:'Presidential republic', leader:'President Emre Kaya', trait:'opportunist', nuclear:false, bloc:'NATO', flag:['#e30a17','#ffffff','#e30a17'] },
  { id:'SAU', name:'Saudi Arabia', capital:'Riyadh', region:'Middle East', lon:46.7, lat:24.7, gdp:1.07, military:62, stability:64, rel:70, gov:'Absolute monarchy', leader:'Crown Prince Faisal bin Salman', trait:'transactional', nuclear:false, bloc:'Gulf', flag:['#006c35','#ffffff','#006c35'] },
  { id:'ISR', name:'Israel', capital:'Jerusalem', region:'Middle East', lon:35.2, lat:31.8, gdp:0.52, military:73, stability:59, rel:86, gov:'Parliamentary republic', leader:'PM Noa Ben-Ami', trait:'security-first', nuclear:true, bloc:'Partner', flag:['#0038b8','#ffffff','#0038b8'] },
  { id:'EGY', name:'Egypt', capital:'Cairo', region:'Middle East', lon:31.2, lat:30.0, gdp:0.40, military:56, stability:52, rel:66, gov:'Military-backed republic', leader:'President Karim El-Sayed', trait:'pragmatic', nuclear:false, bloc:'Arab League', flag:['#ce1126','#ffffff','#000000'] },
  { id:'IRN', name:'Iran', capital:'Tehran', region:'Middle East', lon:51.4, lat:35.7, gdp:0.42, military:64, stability:56, rel:18, gov:'Theocratic republic', leader:'Supreme Leader Ali Rahmani', trait:'hostile', nuclear:false, bloc:'Axis', flag:['#239f40','#ffffff','#da0000'] },
  { id:'IND', name:'India', capital:'New Delhi', region:'Asia', lon:77.2, lat:28.6, gdp:3.55, military:76, stability:72, rel:68, gov:'Federal republic', leader:'PM Ananya Rao', trait:'non-aligned', nuclear:true, bloc:'Quad', flag:['#ff9933','#ffffff','#138808'] },
  { id:'PAK', name:'Pakistan', capital:'Islamabad', region:'Asia', lon:73.1, lat:33.7, gdp:0.34, military:58, stability:46, rel:52, gov:'Federal republic', leader:'PM Bilal Chaudhry', trait:'volatile', nuclear:true, bloc:'Partner', flag:['#01411c','#ffffff','#01411c'] },
  { id:'CHN', name:'China', capital:'Beijing', region:'Asia', lon:116.4, lat:39.9, gdp:18.27, military:88, stability:78, rel:34, gov:'One-party state', leader:'President Li Wei', trait:'strategic', nuclear:true, bloc:'BRICS', flag:['#de2910','#ffde00','#de2910'] },
  { id:'JPN', name:'Japan', capital:'Tokyo', region:'Asia', lon:139.7, lat:35.7, gdp:4.21, military:55, stability:88, rel:88, gov:'Parliamentary monarchy', leader:'PM Haruto Sato', trait:'cautious', nuclear:false, bloc:'Partner', flag:['#ffffff','#bc002d','#ffffff'] },
  { id:'KOR', name:'South Korea', capital:'Seoul', region:'Asia', lon:127.0, lat:37.55, gdp:1.71, military:66, stability:81, rel:86, gov:'Presidential republic', leader:'President Min-jae Park', trait:'pragmatic', nuclear:false, bloc:'Partner', flag:['#ffffff','#cd2e3a','#0047a0'] },
  { id:'PRK', name:'North Korea', capital:'Pyongyang', region:'Asia', lon:125.75, lat:39.0, gdp:0.03, military:61, stability:71, rel:12, gov:'Totalitarian state', leader:'Marshal Jong-Un Han', trait:'erratic', nuclear:true, bloc:'Axis', flag:['#024fa2','#ed1c27','#ffffff'] },
  { id:'TWN', name:'Taiwan', capital:'Taipei', region:'Asia', lon:121.5, lat:25.0, gdp:0.79, military:48, stability:79, rel:74, gov:'Democratic republic', leader:'President Mei-Ling Chen', trait:'resolute', nuclear:false, bloc:'Partner', flag:['#fe0000','#000095','#ffffff'] },
  { id:'AUS', name:'Australia', capital:'Canberra', region:'Oceania', lon:149.1, lat:-35.3, gdp:1.69, military:52, stability:90, rel:90, gov:'Federal monarchy', leader:'PM Jack Merritt', trait:'loyal', nuclear:false, bloc:'AUKUS', flag:['#012169','#ffffff','#e4002b'] },
  { id:'BRA', name:'Brazil', capital:'Brasília', region:'South America', lon:-47.9, lat:-15.8, gdp:2.17, military:54, stability:62, rel:66, gov:'Federal republic', leader:'Presidente Luiza Fontes', trait:'independent', nuclear:false, bloc:'BRICS', flag:['#009c3b','#ffdf00','#002776'] },
  { id:'ARG', name:'Argentina', capital:'Buenos Aires', region:'South America', lon:-58.4, lat:-34.6, gdp:0.64, military:31, stability:48, rel:60, gov:'Federal republic', leader:'Presidente Mateo Rivas', trait:'volatile', nuclear:false, bloc:'Mercosur', flag:['#74acdf','#ffffff','#74acdf'] },
  { id:'VEN', name:'Venezuela', capital:'Caracas', region:'South America', lon:-66.9, lat:10.5, gdp:0.10, military:33, stability:39, rel:22, gov:'Authoritarian republic', leader:'Presidente Hugo Rangel', trait:'hostile', nuclear:false, bloc:'Axis', flag:['#ffcc00','#00247d','#cf142b'] },
  { id:'CUB', name:'Cuba', capital:'Havana', region:'Caribbean', lon:-82.4, lat:23.1, gdp:0.11, military:22, stability:47, rel:20, gov:'One-party state', leader:'Presidenta Marta Castro', trait:'defiant', nuclear:false, bloc:'Axis', flag:['#002a8f','#ffffff','#cf142b'] },
  { id:'NGA', name:'Nigeria', capital:'Abuja', region:'Africa', lon:7.5, lat:9.1, gdp:0.36, military:38, stability:45, rel:58, gov:'Federal republic', leader:'President Chidi Okonkwo', trait:'pragmatic', nuclear:false, bloc:'AU', flag:['#008751','#ffffff','#008751'] },
  { id:'ZAF', name:'South Africa', capital:'Pretoria', region:'Africa', lon:28.2, lat:-25.7, gdp:0.38, military:34, stability:51, rel:64, gov:'Constitutional democracy', leader:'President Thandiwe Nkosi', trait:'independent', nuclear:false, bloc:'BRICS', flag:['#007749','#ffffff','#de3831'] },
  { id:'IDN', name:'Indonesia', capital:'Jakarta', region:'Asia', lon:106.8, lat:-6.2, gdp:1.37, military:51, stability:66, rel:60, gov:'Presidential republic', leader:'President Bayu Santoso', trait:'non-aligned', nuclear:false, bloc:'ASEAN', flag:['#ce1126','#ffffff','#ce1126'] },
  { id:'VNM', name:'Vietnam', capital:'Hanoi', region:'Asia', lon:105.8, lat:21.0, gdp:0.43, military:49, stability:74, rel:55, gov:'One-party state', leader:'General Secretary Minh Duc', trait:'pragmatic', nuclear:false, bloc:'ASEAN', flag:['#da251d','#ffff00','#da251d'] },
  { id:'PHL', name:'Philippines', capital:'Manila', region:'Asia', lon:121.0, lat:14.6, gdp:0.44, military:36, stability:60, rel:76, gov:'Presidential republic', leader:'President Rosa Delgado', trait:'loyal', nuclear:false, bloc:'Partner', flag:['#0038a8','#ce1126','#ffffff'] },
  { id:'ARE', name:'United Arab Emirates', capital:'Abu Dhabi', region:'Middle East', lon:54.4, lat:24.5, gdp:0.51, military:46, stability:78, rel:72, gov:'Federal monarchy', leader:'President Khalifa Al Nahyan', trait:'transactional', nuclear:false, bloc:'Gulf', flag:['#00732f','#ffffff','#000000'] },
  { id:'SWE', name:'Sweden', capital:'Stockholm', region:'Europe', lon:18.1, lat:59.3, gdp:0.59, military:39, stability:86, rel:82, gov:'Parliamentary monarchy', leader:'PM Astrid Lind', trait:'cautious', nuclear:false, bloc:'NATO', flag:['#006aa7','#fecc00','#006aa7'] },
  { id:'NOR', name:'Norway', capital:'Oslo', region:'Europe', lon:10.75, lat:59.9, gdp:0.48, military:35, stability:89, rel:86, gov:'Parliamentary monarchy', leader:'PM Henrik Dahl', trait:'cooperative', nuclear:false, bloc:'NATO', flag:['#ba0c2f','#ffffff','#00205b'] },
  { id:'NLD', name:'Netherlands', capital:'Amsterdam', region:'Europe', lon:4.9, lat:52.4, gdp:1.12, military:41, stability:84, rel:84, gov:'Parliamentary monarchy', leader:'PM Sanne de Vries', trait:'cooperative', nuclear:false, bloc:'NATO', flag:['#ae1c28','#ffffff','#21468b'] },
  { id:'COL', name:'Colombia', capital:'Bogotá', region:'South America', lon:-74.1, lat:4.7, gdp:0.36, military:37, stability:52, rel:62, gov:'Presidential republic', leader:'Presidente Isabel Cortés', trait:'pragmatic', nuclear:false, bloc:'Partner', flag:['#fcd116','#003893','#ce1126'] },
  { id:'IRQ', name:'Iraq', capital:'Baghdad', region:'Middle East', lon:44.4, lat:33.3, gdp:0.25, military:31, stability:41, rel:48, gov:'Federal republic', leader:'PM Yusuf al-Hashimi', trait:'fragile', nuclear:false, bloc:'Arab League', flag:['#ce1126','#ffffff','#000000'] },
  { id:'AFG', name:'Afghanistan', capital:'Kabul', region:'Asia', lon:69.2, lat:34.5, gdp:0.02, military:19, stability:24, rel:30, gov:'Taliban emirate', leader:'Supreme Leader Mullah Omar Shah', trait:'isolated', nuclear:false, bloc:'None', flag:['#ffffff','#d32011','#000000'] },
  { id:'SGP', name:'Singapore', capital:'Singapore', region:'Asia', lon:103.8, lat:1.35, gdp:0.47, military:42, stability:92, rel:78, gov:'City-state', leader:'PM Wei Ming Tan', trait:'transactional', nuclear:false, bloc:'ASEAN', flag:['#ef3340','#ffffff','#ef3340'] },
  { id:'NZL', name:'New Zealand', capital:'Wellington', region:'Oceania', lon:174.8, lat:-41.3, gdp:0.25, military:20, stability:92, rel:88, gov:'Parliamentary monarchy', leader:'PM Aroha Ngata', trait:'cooperative', nuclear:false, bloc:'Partner', flag:['#00247d','#ffffff','#cc142b'] },
  { id:'CHE', name:'Switzerland', capital:'Bern', region:'Europe', lon:7.45, lat:46.95, gdp:0.88, military:28, stability:94, rel:82, gov:'Federal republic', leader:'President Lena Baumann', trait:'neutral', nuclear:false, bloc:'Neutral', flag:['#da291c','#ffffff','#da291c'] },
  { id:'HUN', name:'Hungary', capital:'Budapest', region:'Europe', lon:19.04, lat:47.5, gdp:0.21, military:26, stability:71, rel:66, gov:'Parliamentary republic', leader:'PM Gábor Szabó', trait:'contrarian', nuclear:false, bloc:'NATO', flag:['#ce2939','#ffffff','#477050'] },
  { id:'SRB', name:'Serbia', capital:'Belgrade', region:'Europe', lon:20.5, lat:44.8, gdp:0.08, military:24, stability:63, rel:45, gov:'Parliamentary republic', leader:'President Nikola Jovanović', trait:'independent', nuclear:false, bloc:'Neutral', flag:['#c6363c','#0c4076','#ffffff'] },
  { id:'GEO', name:'Georgia', capital:'Tbilisi', region:'Eurasia', lon:44.8, lat:41.7, gdp:0.03, military:17, stability:49, rel:55, gov:'Parliamentary republic', leader:'PM Luka Beridze', trait:'fragile', nuclear:false, bloc:'Partner', flag:['#ffffff','#ff0000','#ffffff'] },
];

export const WORLD_CAPITALS = {
  GBR:{style:'london', label:'LONDON', landmark:'Big Ben & Parliament', palette:['#b9b4a7','#6b7a8f','#c8102e']},
  FRA:{style:'paris', label:'PARIS', landmark:'The Eiffel Tower', palette:['#c9b79c','#6d7f8b','#1d3f73']},
  RUS:{style:'moscow', label:'MOSCOW', landmark:'Red Square & the Kremlin', palette:['#8d3b2f','#c8a24a','#2b3550']},
  CHN:{style:'beijing', label:'BEIJING', landmark:'The Forbidden City', palette:['#9b2c24','#c8a24a','#3a3a3a']},
  JPN:{style:'tokyo', label:'TOKYO', landmark:'Tokyo Tower', palette:['#d9d6cf','#e04b3a','#2a2f45']},
  SAU:{style:'riyadh', label:'RIYADH', landmark:'Kingdom Centre', palette:['#c8b48d','#7e8b8f','#1f5d4a']},
  UKR:{style:'kyiv', label:'KYIV', landmark:'St. Sophia & Independence Square', palette:['#c9c3b3','#c8a24a','#2f5aa8']},
  CAN:{style:'ottawa', label:'OTTAWA', landmark:'Parliament Hill', palette:['#b9b4a7','#5c6f6b','#b3202f']},
  MEX:{style:'mexico', label:'MEXICO CITY', landmark:'Angel of Independence', palette:['#c9a87c','#8b5e3c','#1f6b4a']},
  IND:{style:'delhi', label:'NEW DELHI', landmark:'India Gate', palette:['#c8b48d','#8f6f4c','#e08a28']},
  DEU:{style:'berlin', label:'BERLIN', landmark:'The Brandenburg Gate', palette:['#b8b2a6','#5f6b70','#d4a72c']},
  ITA:{style:'rome', label:'ROME', landmark:'The Colosseum', palette:['#c2a37f','#8d6b4c','#a33a2c']},
  KOR:{style:'seoul', label:'SEOUL', landmark:'Namsan Tower', palette:['#b9b4a7','#596b7a','#2f5aa8']},
  BRA:{style:'brasilia', label:'BRASÍLIA', landmark:'Cathedral of Brasília', palette:['#d9d6cf','#7c8b91','#1f6b4a']},
  AUS:{style:'canberra', label:'CANBERRA', landmark:'Parliament House', palette:['#c9b79c','#6d7f8b','#1f5d4a']},
  TUR:{style:'ankara', label:'ANKARA', landmark:'Anıtkabir', palette:['#c8b48d','#7e8b8f','#b3202f']},
};

export const POLICIES = [
  { id:'address', name:'Address the Nation', icon:'◈', cost:0, cat:'politics', desc:'A prime-time speech from the Oval Office. Rally your coalition and define the moment.', effects:{ approval:2.2, media:1.8, pc:3 } },
  { id:'rally', name:'Hold a Rally', icon:'★', cost:12, cat:'politics', desc:'Take the message to the base. Energizes supporters, alienates the opposition.', effects:{ approval:1.4, pc:6, polarization:1.2 } },
  { id:'infra', name:'Infrastructure Bill', icon:'▤', cost:28, cat:'economy', desc:'$420B for roads, rail, and broadband. Slow to build, broadly popular.', effects:{ economy:2.4, unemployment:-0.3, approval:2.0, debt:0.42 } },
  { id:'tax', name:'Middle-Class Tax Cut', icon:'$', cost:22, cat:'economy', desc:'Cut rates for households under $400k. Stimulates demand, widens the deficit.', effects:{ approval:2.6, economy:1.6, inflation:0.4, debt:0.55 } },
  { id:'health', name:'Expand Health Coverage', icon:'✚', cost:26, cat:'economy', desc:'Extend subsidies and cap drug prices. Popular, expensive, fought by industry.', effects:{ approval:2.8, economy:-0.4, debt:0.7 } },
  { id:'energy', name:'Energy Independence Act', icon:'◭', cost:18, cat:'economy', desc:'Permits for domestic production and clean energy. A balancing act.', effects:{ economy:1.8, inflation:-0.3, approval:-0.3, climate:-1.2 } },
  { id:'immig', name:'Border Security Package', icon:'▮', cost:15, cat:'politics', desc:'More agents, technology, and a path to status for Dreamers.', effects:{ border:6, approval:1.0, polarization:0.8 } },
  { id:'press', name:'Press Conference', icon:'◉', cost:0, cat:'media', desc:'Face the press corps. High risk, high reward.', effects:{ media:2.5, approval:0.4, pc:4 } },
  { id:'purge', name:'Cabinet Shake-Up', icon:'⨯', cost:14, cat:'politics', desc:'Remove underperformers. Resets the narrative, briefly.', effects:{ approval:1.2, pc:-6, media:1.0 } },
  { id:'pardon', name:'Sign a Pardon', icon:'§', cost:8, cat:'politics', desc:'A controversial use of clemency. Your base may cheer or revolt.', effects:{ approval:-0.6, pc:2 } },
];

export const OPS = [
  { id:'carrier', name:'Deploy Carrier Strike Group', icon:'▲', cost:18, desc:'Send a carrier group to the target’s doorstep. A signal, not a shot.', effects:{ readiness:-4, tension:7, rel:-6 }, success:0.99 },
  { id:'cyber', name:'Cyber Operation', icon:'⌁', cost:14, desc:'Disrupt command networks and steal secrets. Deniable, if it works.', effects:{ intel:5, tension:3, rel:-4 }, success:0.62 },
  { id:'raid', name:'Special Forces Raid', icon:'✦', cost:24, desc:'A precision raid on a high-value target. Lives are on the line.', effects:{ readiness:-6, tension:9, rel:-11, approval:1.5 }, success:0.58 },
  { id:'strike', name:'Limited Airstrike', icon:'✷', cost:22, desc:'Target a military facility. Escalation is almost certain.', effects:{ readiness:-5, tension:14, rel:-16 }, success:0.72 },
  { id:'blockade', name:'Naval Blockade', icon:'≋', cost:26, desc:'Close sea lanes. Strangle trade, provoke a response.', effects:{ readiness:-7, tension:16, rel:-18 }, success:0.8 },
  { id:'evac', name:'Noncombatant Evacuation', icon:'⊕', cost:10, desc:'Extract citizens from a crisis zone. A quiet, noble mission.', effects:{ readiness:-2, approval:1.8, rel:5 }, success:0.86 },
  { id:'drill', name:'Joint Military Exercise', icon:'⊞', cost:9, desc:'Rehearse with allies near a contested border. Reassurance and warning.', effects:{ readiness:-1, tension:5, rel:4 }, success:0.95 },
];

export const INTEL_MISSIONS = [
  { id:'surveil', name:'Surveillance Sweep', cost:6, risk:0.12, desc:'Map the target’s military movements and political vulnerabilities.' },
  { id:'sabotage', name:'Sabotage Infrastructure', cost:14, risk:0.36, desc:'Degrade a power grid or command link. Deniable, until it isn’t.' },
  { id:'extract', name:'Extract an Asset', cost:18, risk:0.42, desc:'Bring a high-value source over the wall before they are burned.' },
  { id:'disinfo', name:'Influence Campaign', cost:11, risk:0.28, desc:'Shape the target’s public conversation. Backfires easily.' },
  { id:'decrypt', name:'Decryption Operation', cost:9, risk:0.18, desc:'Break a diplomatic cipher and read the target’s intentions.' },
];

export const EVENTS = [
  {
    id:'border', cat:'SECURITY', title:'Shots Fired at the Southern Border',
    body:'A cartel convoy has exchanged fire with Border Patrol near El Paso. Two agents are wounded. Mexico is demanding a joint investigation; the governors of Texas and Arizona are mobilizing their National Guards.',
    choices:[
      { label:'Deploy federal agents', hint:'Security +, Mexico −', effects:{ border:8, rel:{ MEX:-8 }, approval:1.1, tension:3 } },
      { label:'Joint operation with Mexico', hint:'Relations +, security +', effects:{ border:4, rel:{ MEX:7 }, approval:0.7, tension:-2 } },
      { label:'Stand down and investigate', hint:'Base angry, institutions calm', effects:{ approval:-1.4, media:1.0, polarization:-0.5 } },
    ],
  },
  {
    id:'cyber', cat:'CYBER', title:'A Cyberattack Darkens the Eastern Grid',
    body:'A ransomware variant of unknown origin has knocked out power across three states. The signature resembles a state-linked group, but attribution is not certain. Hospitals are on generators. The public is watching.',
    choices:[
      { label:'Publicly blame Russia', hint:'Tension ++, approval +', effects:{ rel:{ RUS:-14 }, tension:12, approval:1.2 } },
      { label:'Covert counterstrike', hint:'Intel risk, deniable', effects:{ intel:-6, tension:4, approval:0.5 } },
      { label:'Emergency infrastructure bill', hint:'Costly, popular', effects:{ economy:1.5, debt:0.4, approval:1.8, pc:-8 } },
    ],
  },
  {
    id:'assassin', cat:'SECURITY', title:'Assassination Attempt at a Fundraiser',
    body:'A man with a handgun was tackled by Secret Service agents outside a fundraiser in Chicago. He is in custody. The nation is shaken. The press is asking how this happened — and whether your security posture is adequate.',
    choices:[
      { label:'Address the nation tonight', hint:'Approval +, calm', effects:{ approval:2.4, media:2.0, security:2 } },
      { label:'Lock down the capital', hint:'Security ++, liberty −', effects:{ security:8, approval:-0.8, polarization:1.0 } },
      { label:'Blame the opposition', hint:'Base +, country −', effects:{ approval:0.6, polarization:2.2, media:-1.5 } },
    ],
  },
  {
    id:'market', cat:'ECONOMY', title:'Markets Plunge on Inflation Surprise',
    body:'The CPI came in hot. The Dow is down 900 points and the 10-year yield is spiking. Your economic team is split between a emergency rate pressure campaign and a public spending package.',
    choices:[
      { label:'Pressure the Fed to cut', hint:'Markets +, credibility −', effects:{ economy:1.8, inflation:0.6, media:-1.2 } },
      { label:'Announce a deficit package', hint:'Approval +, debt +', effects:{ economy:1.2, approval:1.0, debt:0.5 } },
      { label:'Reassure and do nothing', hint:'Steady, uninspiring', effects:{ economy:-0.5, approval:-0.6 } },
    ],
  },
  {
    id:'china', cat:'DIPLOMACY', title:'Chinese Warships Enter the Taiwan Strait',
    body:'Satellite imagery confirms a carrier group and amphibious vessels conducting exercises inside the strait. Taipei is on alert. Beijing calls it routine. Your Pacific commanders are asking for rules of engagement.',
    choices:[
      { label:'Sail a carrier group through', hint:'Deterrence +, risk ++', effects:{ rel:{ CHN:-15 }, tension:14, approval:1.2, readiness:-3 } },
      { label:'Public warning, private channel', hint:'Balanced', effects:{ rel:{ CHN:-4 }, tension:4, media:0.6 } },
      { label:'Quiet diplomacy with Taipei', hint:'Taiwan +, China −', effects:{ rel:{ TWN:7, CHN:-6 }, intel:3 } },
    ],
  },
  {
    id:'hostage', cat:'CRISIS', title:'Americans Taken Hostage in the Sahel',
    body:'Six American aid workers have been seized by a militant faction in the Sahel. The group demands the release of three prisoners held at Guantánamo and a $40M ransom. Families are on television.',
    choices:[
      { label:'Authorize a rescue raid', hint:'High risk, high reward', effects:{ approval:2.6, readiness:-4, tension:5 } },
      { label:'Negotiate through a third party', hint:'Slow, uncertain', effects:{ approval:-1.2, intel:2, pc:-6 } },
      { label:'Refuse all demands', hint:'Principled, painful', effects:{ approval:-2.0, media:1.0 } },
    ],
  },
  {
    id:'hurricane', cat:'DISASTER', title:'Category 5 Hurricane Makes Landfall',
    body:'Hurricane Delia has come ashore near Tampa with 160 mph winds. Millions are without power. The governors of Florida and Georgia are requesting an emergency declaration and federal troops.',
    choices:[
      { label:'Full federal mobilization', hint:'Approval ++, cost', effects:{ approval:3.0, debt:0.3, economy:0.4, climate:-0.2 } },
      { label:'Send aid, keep troops home', hint:'Cautious', effects:{ approval:1.0, debt:0.1 } },
      { label:'Visit the disaster zone', hint:'Empathy +, risk', effects:{ approval:1.8, media:1.4 } },
    ],
  },
  {
    id:'protests', cat:'DOMESTIC', title:'Protests Spread Beyond Washington',
    body:'What began as a demonstration outside the White House has spread to twenty cities. Organizers are demanding a response on policing and inequality. Counter-protesters are mobilizing too. The cameras are everywhere.',
    choices:[
      { label:'Address the marchers directly', hint:'Approval + if sincere', effects:{ approval:2.2, media:1.5, polarization:-0.8 } },
      { label:'Deploy National Guard', hint:'Order +, backlash', effects:{ approval:-2.4, security:4, polarization:1.6 } },
      { label:'Ignore it and govern', hint:'Narrative fades slowly', effects:{ approval:-1.4, media:-0.8 } },
    ],
  },
  {
    id:'scandal', cat:'POLITICS', title:'A Cabinet Secretary Is Under Investigation',
    body:'The FBI has opened a probe into the Secretary of Commerce over undisclosed foreign payments. The Secretary denies wrongdoing. Congressional committees are demanding testimony and the press has the story.',
    choices:[
      { label:'Fire the Secretary', hint:'Clean break', effects:{ approval:0.6, media:1.8, pc:-8 } },
      { label:'Stand by your Secretary', hint:'Loyalty +, scandal +', effects:{ approval:-1.8, media:-1.4, pc:2 } },
      { label:'Demand an independent counsel', hint:'Institutions +', effects:{ approval:1.2, media:2.2, pc:-4 } },
    ],
  },
  {
    id:'oil', cat:'ECONOMY', title:'OPEC Announces a Production Cut',
    body:'Oil ministers in Vienna have agreed to cut output by 1.5 million barrels a day. Gas prices are already climbing. Riyadh is privately telling your envoy that the cut is aimed at Moscow, not Washington.',
    choices:[
      { label:'Release from the Strategic Reserve', hint:'Prices −, reserves −', effects:{ inflation:-0.5, approval:1.0, readiness:-1 } },
      { label:'Pressure Riyadh privately', hint:'Saudi +, oil −', effects:{ rel:{ SAU:-5 }, inflation:-0.3 } },
      { label:'Expand domestic drilling', hint:'Independence +, climate −', effects:{ economy:1.2, inflation:-0.3, climate:-1.4 } },
    ],
  },
  {
    id:'nato', cat:'DIPLOMACY', title:'A NATO Ally Asks for More Troops',
    body:'Poland and the Baltics are requesting an additional armored brigade on the eastern flank. Moscow has moved missiles into Belarus. Berlin is hesitant; London is ready. The decision is yours.',
    choices:[
      { label:'Deploy the brigade', hint:'Allies +, Russia −', effects:{ rel:{ POL:7, RUS:-10 }, tension:9, readiness:-4 } },
      { label:'Send air defense only', hint:'Measured', effects:{ rel:{ POL:3, RUS:-3 }, tension:4, readiness:-1 } },
      { label:'Decline and push negotiations', hint:'Doves +, hawks −', effects:{ rel:{ POL:-4, RUS:4 }, tension:-4 } },
    ],
  },
  {
    id:'ai', cat:'TECHNOLOGY', title:'A Breakthrough — and a Warning',
    body:'American labs have demonstrated a model that can design novel bioweapons pathways. The scientific community is alarmed. China is racing to catch up. Industry wants a light touch; your advisers want guardrails.',
    choices:[
      { label:'Emergency safety standards', hint:'Safety +, industry −', effects:{ media:1.5, economy:-0.6, approval:0.8 } },
      { label:'Public-private partnership', hint:'Growth +, risk', effects:{ economy:1.4, intel:2, tension:3 } },
      { label:'Classify the breakthrough', hint:'Intel ++, secrecy risk', effects:{ intel:6, media:-1.0, tension:5 } },
    ],
  },
  {
    id:'election', cat:'POLITICS', title:'A Governor Flips a Senate Seat',
    body:'A special election in Ohio has flipped a Senate seat to the opposition. Your legislative agenda is now in danger. The majority leader wants a deal; the base wants a fight.',
    choices:[
      { label:'Cut a bipartisan deal', hint:'Congress +, base −', effects:{ pc:8, approval:0.8, polarization:-0.6 } },
      { label:'Fight in the midterms', hint:'Base +, gridlock', effects:{ pc:-4, approval:1.0, polarization:1.2 } },
      { label:'Executive action blitz', hint:'Action +, legal risk', effects:{ pc:3, approval:1.4, media:-1.0 } },
    ],
  },
  {
    id:'pandemic', cat:'HEALTH', title:'A Novel Virus Emerges Overseas',
    body:'The WHO has reported a cluster of a novel respiratory virus in Southeast Asia. It is not yet a pandemic, but it is moving. Your CDC director wants to activate emergency surveillance now.',
    choices:[
      { label:'Activate early warning', hint:'Preparedness +, cost', effects:{ approval:1.6, economy:-0.3, debt:0.1 } },
      { label:'Travel restrictions', hint:'Security +, allies −', effects:{ approval:1.0, rel:{ JPN:-3, KOR:-3 }, economy:-0.4 } },
      { label:'Wait for more data', hint:'Risk, no cost', effects:{ approval:-0.6, risk:1 } },
    ],
  },
  {
    id:'rival', cat:'INTELLIGENCE', title:'A Rival Leader Makes an Offer',
    body:'A backchannel message arrives from Moscow: a freeze in hostilities, in exchange for sanctions relief and a recognition of “spheres of influence.” Your intelligence community does not trust it. Your business allies love it.',
    choices:[
      { label:'Accept a limited freeze', hint:'Tension −, allies −', effects:{ rel:{ RUS:12, POL:-5, GBR:-3 }, tension:-10, approval:-0.4 } },
      { label:'Reject and expose the offer', hint:'Moral high ground', effects:{ rel:{ RUS:-8, GBR:4 }, media:2.0, tension:4 } },
      { label:'Keep talking, change nothing', hint:'Cautious', effects:{ rel:{ RUS:4 }, intel:3, approval:-0.3 } },
    ],
  },
  {
    id:'coup', cat:'CRISIS', title:'A Coup Is Underway in a Partner Nation',
    body:'The elected president of a partner nation has been detained by the military. Crowds are in the streets. The generals are promising elections “soon.” Your ambassador is asking for instructions.',
    choices:[
      { label:'Condemn and sanction the junta', hint:'Democracy +, stability −', effects:{ approval:1.4, media:1.2, tension:5 } },
      { label:'Quietly work with the generals', hint:'Stability +, values −', effects:{ intel:3, approval:-1.0, media:-1.2 } },
      { label:'Evacuate citizens only', hint:'Safe, detached', effects:{ approval:0.4, readiness:-1 } },
    ],
  },
  {
    id:'nuclear', cat:'NUCLEAR', title:'A Nuclear Test Is Detected',
    body:'Seismic sensors have detected a nuclear test. The yield is small but unmistakable. The culprit is a state that was not supposed to have the bomb. The world is waiting for your response.',
    choices:[
      { label:'Emergency UN Security Council session', hint:'Multilateral', effects:{ media:1.8, approval:0.8, tension:4 } },
      { label:'New sanctions and containment', hint:'Pressure', effects:{ tension:6, approval:1.0, economy:-0.3 } },
      { label:'Signal a military option', hint:'Deterrence +, risk ++', effects:{ tension:12, approval:0.9, readiness:-3 } },
    ],
  },
  {
    id:'presswar', cat:'MEDIA', title:'A Network Runs a Damaging Documentary',
    body:'A major network has aired a documentary alleging that your family business benefited from foreign policy decisions. The White House calls it false. The clip is everywhere. Your communications team is divided on how to respond.',
    choices:[
      { label:'Sit for a hostile interview', hint:'High risk, high reward', effects:{ media:1.6, approval:0.1 } },
      { label:'Attack the network', hint:'Base +, press −', effects:{ approval:0.7, media:-2.2, polarization:1.2 } },
      { label:'Ignore it', hint:'Story fades', effects:{ approval:-0.8, media:-0.4 } },
    ],
  },
];

export const NEWS_SOURCES = ['REUTERS','AP','THE WIRE','NBC','BBC','BLOOMBERG','POLITICO','CNN','FOX','THE ATLANTIC'];

export const TIPS = [
  'Press M for the world map. Tap any country to open a diplomatic channel.',
  'Walk up to The Beast or Marine One and press E to take control.',
  'The Oval Office is inside the White House — the Resolute Desk opens the government dashboard.',
  'Time only moves when you let it. Pause the clock to make decisions without pressure.',
  'Every country watches what you do. Sanctions, strikes, and alliances all leave a trace.',
  'On mobile: left stick moves, drag the right side to look, tap the gold button to interact.',
  'You can fly to any modeled capital from the world map. State visits change relationships.',
  'The DEFCON ladder is not a metaphor. Nuclear release has consequences you cannot undo.',
];
