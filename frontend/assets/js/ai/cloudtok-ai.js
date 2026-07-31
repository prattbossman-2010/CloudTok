class CloudTokAI{


static categories={

"Gaming":{
    keywords:["game","gaming","play","player","level","boss","quest","fps","rpg","mmo","fortnite","minecraft","valorant","league","apex","warzone","steam","xbox","playstation","nintendo","esport","stream","twitch","gamer","console","pc gaming","retro","arcade","indie game","multiplayer","pvp","coop","speedrun","boss fight","inventory","crafting","dungeon","raid","clutch","aimbot","hitbox","lag","fps drop","patch","update","dlc","season pass","battle pass","skin","emote","victory royale","noob","pro","rank","ranked","leaderboard","tournament","competitive","casual","hardcore","survival","sandbox","open world","mmorpg","roguelike","metroidvania","platformer","racing","fighting","strategy","simulation","tower defense","card game","puzzle","horror game","coop","split screen","crossplay","cloud gaming","game pass","vr gaming","mobile gaming","indie","triple a","aa"],
    weight:1.0
},

"Music":{
    keywords:["music","song","singer","band","album","concert","guitar","piano","drums","bass","vocal","melody","rhythm","beat","remix","rap","hip hop","r&b","pop","rock","jazz","blues","country","reggae","edm","electronic","dance","house","techno","trance","dubstep","lo-fi","acoustic","unplugged","karaoke","cover","original","producer","studio","mix","master","track","single","ep","lp","vinyl","concert","festival","gig","tour","stage","microphone","keyboard","synth","loop","sample","auto tune","falsetto","harmony","chorus","verse","bridge","hook","drop","bass drop","beat drop","mashup","playlist","vinyl","turntable","dj","mc","open mic","talent","voice","singing","instrumental","symphony","orchestra","choir","opera","musical","soundtrack","theme song","jingle","anthem","hymn"],
    weight:1.0
},

"Technology":{
    keywords:["tech","technology","code","coding","program","programming","developer","software","hardware","ai","artificial intelligence","machine learning","deep learning","neural","computer","laptop","phone","smartphone","android","ios","apple","samsung","google","microsoft","startup","app","website","web","cloud","data","cyber","security","hack","hacker","network","server","database","api","frontend","backend","fullstack","javascript","python","java","html","css","react","node","database","sql","nosql","git","github","docker","kubernetes","linux","windows","mac","browser","chrome","firefox","ai assistant","chatgpt","openai","blockchain","crypto","bitcoin","nft","web3","metaverse","vr","ar","augmented reality","virtual reality","robot","robotics","iot","smart home","gadget","review","unboxing","benchmark","spec","processor","cpu","gpu","ram","ssd","monitor","keyboard","mouse","headset","webcam","printer","router","modem","5g","wifi","bluetooth","usb","thunderbolt","hdmi","display","oled","led","4k","8k","refresh rate","hz","fps","gaming pc","workstation","mini pc","single board","raspberry pi","arduino","esp32","3d printing","laser cutting","cad","solidworks","autocad","blender","unity","unreal","godot","photoshop","premiere","after effects","figma","sketch","canva","notion","obsidian","vim","vscode","terminal","command line","shell","powershell","bash","regex","algorithm","data structure","oop","functional","async","callback","promise","fetch","ajax","rest","graphql","grpc","websocket","microservice","serverless","lambda","aws","azure","gcp","heroku","vercel","netlify","firebase","supabase","planetscale","mongodb","postgres","mysql","redis","elasticsearch","docker","ci/cd","jenkins","github actions","gitlab","bitbucket","jira","confluence","slack","discord","zoom","teams","meet","notion","trello","asana","monday","clickup","linear","sentry","datadog","grafana","prometheus","kibana","splunk","new relic","pagerduty","opsgenie","statuspage","uptimerobot","pingdom","gtmetrix","lighthouse","pagespeed","webpack","vite","rollup","esbuild","turbopack","babel","typescript","tailwind","bootstrap","material ui","chakra","ant design","tailwind css","sass","less","postcss"," autoprefixer","eslint","prettier","husky","lint-staged","commitlint","semantic release","conventional commits","semver","npm","yarn","pnpm","bun","deno","node","express","fastify","hono","nest","adonis","laravel","rails","django","flask","fastapi","spring","dotnet","rails","ruby","go","rust","swift","kotlin","dart","flutter","swiftui","uikit","jetpack compose","xml","json","yaml","toml","ini","env","dotenv","config","env variable","secret","api key","token","jwt","oauth","saml","ldap","rbac","abac","cors","csrf","xss","sql injection","owasp","pentest","bug bounty","ctf","capture the flag","red team","blue team","purple team","soc","siem","firewall","ids","ips","antivirus","malware","ransomware","phishing","social engineering","zero day","exploit","payload","shellcode","buffer overflow","heap spray","rop","jop","cve","cwe","cvss","vulnerability","patch","update","hotfix","rollback","canary","blue green","rolling","feature flag","ab test","experiment","analytics","metrics","kpi","okr","roi","sla","slo","sli","error budget","incident","postmortem","retrospective","standup","sprint","kanban","scrum","agile","waterfall","devops","sre","platform engineering","cloud native","12 factor","twelve factor","cattle not pets","immutable infrastructure","idempotent","eventual consistency","cap theorem","acid","base","raid","load balancer","reverse proxy","cdn","edge","caching","redis","memcached","varnish","nginx","apache","caddy","traefik","istio","envoy","consul","vault","terraform","ansible","puppet","chef","salt","pulumi","cdk","cloudformation","arm template","bicep","helm","kustomize","k9s","lens","rancher","portainer","kubernetes","k8s","k3s","k0s","microk8s","rke","openshift","nomad","mesos","swarm","fly.io","railway","render","digitalocean","linode","vultr","hetzner","oracle cloud","alibaba cloud","tencent cloud","ibm cloud"," ovh","scaleway","equinix","core","heroku","openshift","dokku","caprover","coolify","yacht","traefik","caddy","ngrok","cloudflare tunnel"," tailscale","wireguard","openvpn","zero trust","beyondcorp","identity","access","sso","mfa","2fa","totp","hotp","passkey","fido","webauthn","biometric","fingerprint","face id","retina","iris","voice recognition","behavioral","continuous auth","session","cookie","token","jwt","access token","refresh token","id token","bearer","basic auth","digest auth","oauth1","oauth2","oidc","saml2","ws-fed","cas","ldap","active directory","okta","auth0","firebase auth","supabase auth","clerk","logto","keycloak","identityserver","duende","aspid","jackson","workos","stytch","passage","loginradius","onelogin","ping","forgerock","wso2","micro focus","netiq","centrify","cyberark","beyond trust","delinea","hashicorp vault","aws secrets manager","azure key vault","gcp secret manager","infisical","doppler","vaultwarden","bitwarden","1password","lastpass","dashlane","keeper","nordpass","roboform","keepass","keepassxc","bitwarden","password manager","passwordless","magic link","email otp","sms otp","push notification","webhook","event bus","message queue","pub sub","kafka","rabbitmq","activemq","nats","pulsar","redpanda","pulsar","nsq","zeromq","nanomsg","mqtt","amqp","stomp","sse","server sent events","long polling","websocket","grpc","thrift","avro","protobuf","msgpack","cbor","bson","flatbuffers","capnproto","arrow","parquet","orc","avro","thrift","protocol buffers","openapi","swagger","raml","asyncapi","grpc","graphql","rest","soap","xmlrpc","jsonrpc","xml","json","yaml","toml","ini","csv","tsv","parquet","orc","arrow","feather","hdf5","netcdf","fits","protobuf","flatbuffers","avro","thrift","msgpack","cbor","bson","sbe","kafka","avro schema","protobuf schema","json schema","xml schema","openapi","swagger","raml","asyncapi","wSDL","wsdl","xsd","dtd","relax ng","schematron","json schema","graphql schema","avro schema","protobuf schema","thrift idl","avro idl"," thrift idl","openapi","swagger","raml","asyncapi","wSDL","wsdl","xsd","dtd","relax ng","schematron","json schema","graphql schema","avro schema","protobuf schema","thrift idl","avro idl","thrift idl"],
    weight:1.0
},

"Sports":{
    keywords:["sport","football","soccer","basketball","baseball","tennis","golf","hockey","cricket","rugby","boxing","mma","ufc","wwe","wrestling","f1","formula","racing","nascar","cycling","swimming","athletics","track","field","marathon","triathlon","skiing","snowboard","surfing","skateboard","climbing","hiking","camping","fishing","hunting","yoga","pilates","gym","workout","fitness","crossfit","bodybuilding","weightlifting","powerlifting","calisthenics","street workout","parkour","freerunning","martial arts","karate","taekwondo","judo","jiu jitsu","muay thai","kickboxing","boxing","fencing","archery","shooting","equestrian","dressage","polo","lacrosse","volleyball","badminton","table tennis","ping pong","squash","racquetball","pickleball","padel","cricket","kabaddi","kho kho","badminton","table tennis","ping pong","squash","racquetball","pickleball","padel"],
    weight:1.0
},

"Comedy":{
    keywords:["funny","comedy","humor","joke","laugh","hilarious","meme","prank","skit","parody","satire","stand up","standup","comedian","comic","fun","lol","rofl","lmao","haha","comedic","slapstick","dark humor","dry humor","witty","punchline","one liner","bit","improv","improvisation","troll","funny moment","fail","epic fail","try not to laugh","laugh challenge","comedy sketch","funny compilation","best moments","highlights","bloopers","outtakes","behind the scenes","funny animals","funny kids","funny reactions","funny compilation","try not to laugh","laughing","giggling","chuckling","smiling","entertaining","amusing","comical","ludicrous","ridiculous","absurd","nonsensical","silly","goofy","wacky","zany","quirky","eccentric","unusual","unexpected","surprising","shocking","jaw dropping","mind blowing","epic","legendary","viral","trending","popular","famous","celebrity","influencer","youtuber","tiktok","streamer","content creator","vlogger","reaction","reaction video","commentary","roast","troll","prank call","hidden camera","candid camera","funny interview","funny conversation","funny story","funny experience","funny moment","best moments","highlights","bloopers","outtakes","behind the scenes","blooper reel","gag reel","funny fails","epic fails","try not to laugh","laugh challenge","comedy challenge","funny challenge","prank war","prank battle","social experiment","hidden camera","candid camera","funny interview","funny conversation","funny story","funny experience","funny moment"],
    weight:1.0
},

"Education":{
    keywords:["learn","tutorial","education","teach","lesson","course","study","school","university","college","professor","teacher","student","class","lecture","exam","test","quiz","homework","assignment","project","research","thesis","dissertation","phd","masters","bachelor","diploma","certificate","degree","major","minor","subject","math","science","physics","chemistry","biology","history","geography","english","literature","philosophy","psychology","sociology","economics","politics","law","medicine","engineering","architecture","design","art","music","language","spanish","french","chinese","japanese","korean","arabic","hindi","portuguese","german","italian","russian","turkish","thai","vietnamese","indonesian","malay","filipino","swedish","norwegian","danish","finnish","dutch","polish","czech","hungarian","romanian","bulgarian","greek","hebrew","urdu","persian","farsi","swahili","yoruba","igbo","hausa","zulu","xhosa","afrikaans","malagasy","maori","hawaiian","samoan","tongan","fijian","chamorro","palauan","marshallese","chuukese","pohnpeian","yapese","tolai","bislama","tok pisin","hiri motu","solomons pigdin","krio","creole","pidgin","lingua franca","trade language","auxiliary language","constructed language","esperanto","interlingua","volapuk","ido","novial","lojban","klingon","dothraki","valyrian","elvish","quenya","sindarin","tengwar","certh","anglo-saxon","old english","middle english","latin","greek","sanskrit","pali","prakrit","tamil","telugu","kannada","malayalam","bengali","gujarati","marathi","punjabi","urdu","hindi","nepali","sinhala","tibetan","burmese","khmer","lao","thai","vietnamese","chinese","japanese","korean","mongolian","tibetan","burmese","khmer","lao","thai","vietnamese","chinese","japanese","korean","mongolian","tibetan","burmese","khmer","lao","thai","vietnamese"],
    weight:1.0
},

"Fashion":{
    keywords:["fashion","style","outfit","clothing","dress","shirt","pants","shoes","sneakers","boots","heels","sandals","accessories","jewelry","watch","ring","necklace","bracelet","earring","sunglasses","hat","cap","scarf","belt","bag","purse","handbag","backpack","wallet","makeup","cosmetics","skincare","beauty","hair","nails","nail art","tattoo","piercing","model","runway","designer","brand","luxury","vintage","thrift","streetwear","street style","casual","formal","business","office","workwear","activewear","athleisure","loungewear","sleepwear","underwear","swimwear","bikini","swimsuit","beachwear","resort wear","cruise wear","holiday wear","festive wear","wedding","bridesmaid","groomsmen","tuxedo","suit","blazer","jacket","coat","sweater","hoodie","sweatshirt","tshirt","tank top","crop top","blouse","polo","henley","flannel","denim","leather","suede","velvet","silk","cotton","linen","wool","cashmere","merino","alpaca","mohair","silk","satin","chiffon","tulle","organza","lace","embroidery","beading","sequin","rhinestone","crystal","pearl","diamond","gold","silver","platinum","rose gold","stainless steel","titanium","copper","brass","bronze","wooden","bamboo","rattan","wicker","crochet","knit","weave","sew","stitch","tailor","alter","hem","seam","button","zipper","snap","Velcro","hook","eye","buckle","clasp","toggle","drawstring","elastic","ribbed","pleated","ruffled","fringed","tasseled","pom pom","feather","fur","faux fur","leather","suede","patent","matte","glossy","shimmer","glitter","metallic","iridescent","holographic","neon","fluorescent","pastel","muted","earth tones","jewel tones","monochrome","color blocking","print","pattern","floral","striped","polka dot","plaid","tartan","checkered","geometric","abstract","animal print","leopard","zebra","tiger","snake","crocodile","elephant","giraffe","horse","cow","sheep","goat","rabbit","fox","wolf","bear","deer","elk","moose","caribou","reindeer","antelope","gazelle","impala","wildebeest","zebra","rhino","hippo","elephant","giraffe","lion","tiger","leopard","cheetah","jaguar","cougar","panther","lynx","bobcat","ocelot","margay","serval","caracal","sand cat","black footed cat","flat headed cat","rusty spotted cat"," Geoffroy cat"," oncilla","tigrina","leptailurus","caracal","prionailurus","felis"],
    weight:0.8
},

"Food":{
    keywords:["food","cook","cooking","recipe","chef","kitchen","bake","baking","restaurant","cafe","coffee","tea","breakfast","lunch","dinner","snack","dessert","cake","pizza","burger","sandwich","sushi","ramen","pasta","steak","chicken","fish","seafood","vegetable","fruit","salad","soup","smoothie","juice","cocktail","wine","beer","whiskey","vodka","rum","tequila","gin","brandy","champagne","sake","soju","mead","cider","kombucha","energy drink","soda","cola","lemonade","iced tea","hot chocolate","milkshake","ice cream","gelato","sorbet","frozen yogurt","pudding","mousse","cheesecake","brownie","cookie","biscuit","muffin","croissant","bagel","donut","waffle","pancake","crepe","french toast","omelette","scrambled eggs","poached eggs","fried eggs","sunny side up","hard boiled","soft boiled","quiche","frittata","shakshuka","huevos rancheros","chilaquiles","tostada","tamale","empanada","samososa","spring roll","egg roll","dumpling","ravioli","gnocchi","risotto","paella","biryani","curry","stew","chili","gumbo","jambalaya","gumbo","jambalaya","gumbo","jambalaya","gumbo","jambalaya","gumbo","jambalaya","gumbo","jambalaya","gumbo","jambalaya","gumbo","jambalaya","gumbo","jambalaya","gumbo","jambalaya","gumbo","jambalaya"],
    weight:0.9
},

"Travel":{
    keywords:["travel","trip","vacation","holiday","tourism","tourist","destination","airport","flight","airplane","hotel","hostel","resort","airbnb","backpack","luggage","suitcase","passport","visa","border","customs","immigration","layover","connection","departure","arrival","boarding","takeoff","landing","cruise","cabin","deck","port","island","beach","mountain","forest","desert","oasis","lake","river","waterfall","canyon","valley","hill","cliff","cave","temple","church","mosque","synagogue","palace","castle","fort","ruins","monument","museum","gallery","market","bazaar","street food","local cuisine","adventure","hiking","trekking","camping","safari","wildlife","nature","scenic","viewpoint","sunset","sunrise","landscape","architecture","culture","tradition","festival","celebration","ceremony","ritual","custom","folklore","legend","myth","history","heritage","ancient","medieval","colonial","modern","contemporary","art","music","dance","theater","opera","cinema","film","movie","documentary","concert","festival","carnival","parade","procession","exhibition","fair","expo","conference","convention","seminar","workshop","summit","symposium","colloquium","forum","panel","debate","lecture","talk","presentation","demonstration","workshop","masterclass","bootcamp","hackathon","meetup","networking","social","party","celebration","gathering","reunion","get together","hangout","outing","excursion","day trip","weekend getaway","road trip","staycation","cation","holiday","vacation","break","time off","leave","absence","sabbatical","retirement","gap year","sabbatical","retirement","gap year","sabbatical","retirement","gap year","sabbatical","retirement","gap year","sabbatical","retirement","gap year","sabbatical","retirement","gap year","sabbatical","retirement","gap year","sabbatical","retirement","gap year","sabbatical","retirement","gap year","sabbatical","retirement","gap year"],
    weight:0.9
},

"Art":{
    keywords:["art","painting","drawing","sketch","illustration","digital art","graphic design","photography","photo","camera","lens","filter","edit","editing","photoshop","lightroom","canva","figma","procreate","illustrator","blender","maya","cinema4d","zbrush","sculpture","ceramic","pottery","glass","stained glass","mosaic","collage","mixed media","installation","performance","conceptual","abstract","realism","surrealism","impressionism","cubism","pop art","street art","graffiti","mural","tattoo","body art","fashion design","interior design","architecture","landscape","urban","portrait","landscape","still life","nude","figurative","expressionism","minimalism","maximalism","contemporary","modern","postmodern","avant-garde","experimental","installation","land art","environmental","kinetic","light art","video art","net art","digital","generative","algorithmic","interactive","immersive","augmented","virtual","mixed reality","xr","360","vr","ar","projection","mapping","sound","music","performance","happening","fluxus","dada","surrealism","cubism","futurism","constructivism","de stijl","bauhaus","art deco","art nouveau","arts and crafts","minimalism","conceptual","land art","performance art","body art","happening","fluxus","dada","surrealism","cubism","futurism","constructivism","de stijl","bauhaus","art deco","art nouveau","arts and crafts"],
    weight:0.9
},

"Lifestyle":{
    keywords:["lifestyle","daily routine","morning routine","night routine","self care","wellness","mental health","mindfulness","meditation","yoga","journaling","gratitude","manifestation","law of attraction","visualization","affirmation","positive thinking","growth mindset","personal development","self improvement","habits","productivity","time management","organization","declutter","minimalism","sustainability","eco friendly","green living","vegan","vegetarian","plant based","organic","natural","holistic","ayurveda","homeopathy","acupuncture","massage","spa","relaxation","stress relief","anxiety","depression","therapy","counseling","coaching","mentoring","support group","community","volunteering","charity","philanthropy","social impact","activism","advocacy","awareness","education","learning","growth","transformation","evolution","awakening","enlightenment","spirituality","religion","faith","belief","practice","ritual","ceremony","tradition","culture","heritage","identity","belonging","connection","relationship","family","friendship","love","romance","dating","marriage","partnership","parenting","motherhood","fatherhood","pregnancy","birth","baby","toddler","child","teenager","adult","senior","elderly","aging","longevity","health","fitness","exercise","nutrition","diet","weight","body","image","beauty","skincare","haircare","makeup","fashion","style","home","decor","design","garden","outdoor","indoor","urban","rural","suburban","coastal","mountain","city","country","travel","adventure","exploration","discovery","wanderlust","wanderlust","nomad","digital nomad","remote work","work life balance","side hustle","freelance","entrepreneur","startup","business","career","job","profession","occupation","industry","sector","market","economy","finance","money","wealth","investment","savings","budget","frugal","thrifty","cheap","affordable","luxury","premium","exclusive","vip","elite","platinum","gold","silver","bronze","diamond","ruby","emerald","sapphire","pearl","crystal","gemstone","jewelry","watch","accessory","bag","shoe","hat","sunglasses","perfume","cologne","fragrance","scent","smell","taste","touch","sight","hearing","sense","intuition","instinct","gut feeling","sixth sense","extrasensory","psychic","clairvoyance","telepathy","precognition","psychokinesis","telekinesis","astral projection","out of body","near death","reincarnation","karma","dharma","chakra","aura","energy","vibration","frequency","resonance","harmony","balance","alignment","grounding","centering","breathing","pranayama","kundalini","tai chi","qigong","reiki","chakra","aura","energy","vibration","frequency","resonance","harmony","balance","alignment","grounding","centering","breathing","pranayama","kundalini","tai chi","qigong","reiki"],
    weight:0.7
}

};


static detectCategory(text){

text=text.toLowerCase();

let bestCategory="General";
let bestScore=0;

for(const[category,config] of
Object.entries(this.categories)){

let score=0;

config.keywords.forEach(keyword=>{

if(text.includes(keyword.toLowerCase())){

score+=config.weight;

}

});

if(score>bestScore){

bestScore=score;
bestCategory=category;

}

}

return bestCategory;

}


static detectCategoryFromTitleAndTags(title,tags){

const combined=(
(title||"")+" "+(tags||[]).join(" ")
).toLowerCase();

return this.detectCategory(combined);

}


static improveCaption(text){

if(!text)return"CloudTok video";

return text.charAt(0).toUpperCase()+text.slice(1);

}


static generateSmartTags(caption,oldTags){

let tags=[...(oldTags||[])];

let words=(caption||"").toLowerCase().split(" ");

words.forEach(word=>{

word=word.replace(/[^a-z0-9]/g,"");

if(word.length>3&&!tags.includes(word)){
tags.push(word);
}

});

if(!tags.includes("cloudtok")){
tags.push("cloudtok");
}

return tags;

}


static async enhanceVideo(video){

try{

const result={
caption:this.improveCaption(video.caption),
tags:this.generateSmartTags(video.caption,video.tags),
category:this.detectCategory(video.caption)
};

return Promise.resolve(result);

}
catch(error){

console.log("AI ERROR",error);
return Promise.resolve(null);

}

}


}


console.log("CloudTok AI Ready");
