import React, { useState, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import { db, handleFirestoreError, OperationType } from "../../lib/firebase";
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, doc, setDoc, increment } from "firebase/firestore";
import { translations } from "../../constants/translations";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Droplet, 
  Flame, 
  Plus, 
  ChevronRight,
  CheckCircle2,
  Trophy,
  Coffee,
  ShieldCheck,
  Zap,
  Heart,
  ArrowRight,
  TrendingUp,
  LayoutGrid,
  Apple,
  Smartphone,
  X
} from "lucide-react";

const getLocalizedStories = (lang: string) => {
  const data: Record<string, any[]> = {
    en: [
      {
        id: 1,
        label: "Superfoods",
        icon: "🥥",
        slides: [
          { title: "Backyard Wonders 🥥", text: "Superfoods aren't expensive imported berries! They are growing right inside your village gardens.", bg: "bg-emerald-950" },
          { title: "Moringa Magic 🌿", text: "Drumstick (Moringa) leaves contain 7x more Vitamin C than oranges and 3x more iron than spinach! Add a handful to your dal.", bg: "bg-teal-950" },
          { title: "Amla Power 🌳", text: "A single fresh Amla (Gooseberry) contains as much Vitamin C as 20 oranges. It boosts immunity against daily fevers naturally.", bg: "bg-emerald-900" }
        ]
      },
      {
        id: 2,
        label: "Kid Diet",
        icon: "👶",
        slides: [
          { title: "Growth Foundations 👶", text: "For growing kids, protein and calcium are vital for healthy bones and sharp minds during school months.", bg: "bg-amber-950" },
          { title: "Nature's Snack 🥜", text: "Skip store-bought sugary biscuits. Offer a fistful of soaked chana or peanut chikki cooked with clean organic jaggery.", bg: "bg-orange-950" },
          { title: "Ragi Malt 🌾", text: "Start their day with a warm ragi porridge. It is packed with easy-to-absorb calcium, keeping them full of energy till lunch.", bg: "bg-amber-900" }
        ]
      },
      {
        id: 3,
        label: "Clean Diet",
        icon: "🥗",
        slides: [
          { title: "Whole & Unprocessed 🥗", text: "Clean eating means choosing local whole grains and fresh foods instead of boxed, chemically enhanced processed items.", bg: "bg-emerald-950" },
          { title: "Better Staples 🌾", text: "Substitute refined white rice with minor millets like Foxtail millet or high-fiber unpolished red brown rice.", bg: "bg-teal-950" },
          { title: "Rainbow Plate 🌈", text: "Aiming for a variety of natural colors (greens, tomatoes, carrots, curd) ensures your body obtains vital minerals.", bg: "bg-emerald-900" }
        ]
      },
      {
        id: 4,
        label: "Millets",
        icon: "🌾",
        slides: [
          { title: "Heritage Grains 🌾", text: "Millets are ancient, resilient grains requiring very little water. They are packed with protein, fiber, and micronutrients.", bg: "bg-emerald-950" },
          { title: "Finger Millet (Ragi) 🦴", text: "Extremely rich in natural calcium. Consuming Ragi assists bone recovery and helps control modern diabetic blood spikes.", bg: "bg-teal-950" },
          { title: "Pearl Millet (Bajra) 🔥", text: "A powerhouse of active dietary iron and phosphorus. Daily intake helps battle chronic fatigue and is ideal for women's health.", bg: "bg-emerald-900" }
        ]
      },
      {
        id: 5,
        label: "Village Pro",
        icon: "🏘️",
        slides: [
          { title: "Locally Sourced 🏡", text: "Traditional village diets are naturally superior when simple hygiene and balanced storage rules are practiced.", bg: "bg-emerald-950" },
          { title: "Pure Cooking Oils 🪔", text: "Cook using cold-pressed groundnut, mustard, or sesame oil rather than industrially bleached multi-refined seed oils.", bg: "bg-teal-950" },
          { title: "Backyard Garden 🌱", text: "Plant clean curry leaves, coriander, and green chilies close to home for pesticide-free source of fresh organic folate.", bg: "bg-emerald-900" }
        ]
      }
    ],
    te: [
      {
        id: 1,
        label: "సూపర్ ఫుడ్స్",
        icon: "🥥",
        slides: [
          { title: "మన పెరటి అద్భుతాలు 🥥", text: "సూపర్ ఫుడ్స్ అంటే ఖరీదైన దిగుమతి చేసుకున్న బెర్రీలు కావు! అవి మీ గ్రామ తోటలలోనే పెరుగుతున్నాయి.", bg: "bg-emerald-950" },
          { title: "మునగాకు మాయ 🌿", text: "మునగాకుల్లో నారింజ పండ్ల కంటే 7 రెట్లు ఎక్కువ విటమిన్ సి మరియు పాలకూర కంటే 3 రెట్లు ఎక్కువ ఇనుము ఉన్నాయి! మీ పప్పులో ఒక గుప్పెడు వేసుకోండి.", bg: "bg-teal-950" },
          { title: "ఉసిరి శక్తి 🌳", text: "ఒకే ఒక్క తాజా ఉసిరికాయలో 20 నారింజ పండ్లకు సమానమైన విటమిన్ సి ఉంటుంది. ఇది సహజంగా రోగనిరోధక శక్తిని పెంచుతుంది.", bg: "bg-emerald-900" }
        ]
      },
      {
        id: 2,
        label: "పిల్లల ఆహారం",
        icon: "👶",
        slides: [
          { title: "ఎదుగుదలకు పునాది 👶", text: "ఎదిగే పిల్లలకు బలమైన ఎముకలు మరియు చురుకైన మెదడు కోసం ప్రోటీన్ మరియు కాల్షియం చాలా ముఖ్యం.", bg: "bg-amber-950" },
          { title: "సహజమైన చిరుతిళ్ళు 🥜", text: "కడలలో కొనే చక్కెర బిస్కెట్లను నివారించండి. నానబెట్టిన శనగలు లేదా బెల్లంతో చేసిన పల్లీ పట్టీలను ఇవ్వండి.", bg: "bg-orange-950" },
          { title: "రాగి జావ 🌾", text: "పిల్లల రోజును వేడి రాగి జావతో ప్రారంభించండి. ఇందులో కాల్షియం పుష్కలంగా ఉంటుంది, ఇది వారికి రోజంతా శక్తిని ఇస్తుంది.", bg: "bg-amber-900" }
        ]
      },
      {
        id: 3,
        label: "మంచి ఆహారం",
        icon: "🥗",
        slides: [
          { title: "సహజమైన ఆహారం 🥗", text: "పరిశుభ్రమైన ఆహారం అంటే ప్యాకెట్లలో దొరికే రసాయనాలు కలిపిన ఆహారానికి బదులుగా స్థానిక తృణధాన్యాలు మరియు తాజా కూరగాయలను ఎంచుకోవడం.", bg: "bg-emerald-950" },
          { title: "ఉత్తమ తృణధాన్యాలు 🌾", text: "తెల్లటి పాలిష్ బియ్యానికి బదులుగా కొర్రలు వంటి చిరుధాన్యాలు లేదా ఎక్కువ పీచు ఉండే దంపుడు బియ్యాన్ని వాడండి.", bg: "bg-teal-950" },
          { title: "రంగురంగుల పళ్లెం 🌈", text: "ఆహారంలో రకరకాల రంగులు (ఆకుకూరలు, టమోటాలు, క్యారెట్లు, పెరుగు) ఉండేలా చూసుకోవడం వల్ల శరీరానికి అవసరమైన ఖనిజాలు అందుతాయి.", bg: "bg-emerald-900" }
        ]
      },
      {
        id: 4,
        label: "చిరుధాన్యాలు",
        icon: "🌾",
        slides: [
          { title: "సాంప్రదాయ ధాన్యాలు 🌾", text: "చిరుధాన్యాలు ప్రాచీనమైనవి, చాలా తక్కువ నీటితో పండించుకోగలవు. ఇవి ప్రొటీన్, పీచుపదార్థాలు మరియు సూక్ష్మపోషకాలతో నిండి ఉన్నాయి.", bg: "bg-emerald-950" },
          { title: "రాగులు (తైదలు) 🦴", text: "సహజ సిద్ధమైన కాల్షియం పుష్కలంగా ఉంటుంది. రాగులను తీసుకోవడం వల్ల ఎముకలు బలంగా తయారవుతాయి మరియు రక్తంలో చక్కెర స్థాయిలను నియంత్రించవచ్చు.", bg: "bg-teal-950" },
          { title: "సజ్జలు 🔥", text: "ఇనుము మరియు భాస్వరం అధికంగా ఉండే ఆహారం. రోజువారీ సజ్జల వినియోగం అలసటను తగ్గిస్తుంది మరియు మహిళల ఆరోగ్యానికి చాలా మంచిది.", bg: "bg-emerald-900" }
        ]
      },
      {
        id: 5,
        label: "విలేజ్ ప్రో",
        icon: "🏘️",
        slides: [
          { title: "స్థానికంగా లభించేవి 🏡", text: "సాధారణ పరిశుభ్రత మరియు నిల్వ నియమాలను పాటించినప్పుడు సాంప్రదాయ గ్రామ ఆహారాలు చాలా మేలైనవి.", bg: "bg-emerald-950" },
          { title: "స్వచ్ఛమైన వంట నూనెలు 🪔", text: "కెమికల్స్ ఉపయోగించి తయారుచేసిన రిఫైండ్ నూనెల కంటే గానుగ పట్టిన వేరుశనగ, ఆవాలు లేదా నువ్వుల నూనెలను వాడండి.", bg: "bg-teal-950" },
          { title: "ఇంటి గార్డెన్ 🌱", text: "పురుగుమందులు లేని తాజా ఫోలేట్ కోసం ఇంటి దగ్గర కరివేపాకు, కొత్తిమీర మరియు పచ్చిమిర్చి మొక్కలను పెంచండి.", bg: "bg-emerald-900" }
        ]
      }
    ],
    hi: [
      {
        id: 1,
        label: "सुपरफूड्स",
        icon: "🥥",
        slides: [
          { title: "घर के आँगन के चमत्कार 🥥", text: "सुपरफूड महंगे आयातित बेर नहीं हैं! वे सीधे आपके गांव के बगीचों में उग रहे हैं।", bg: "bg-emerald-950" },
          { title: "सहजन का जादू 🌿", text: "सहजन (मोरिंगा) की पत्तियों में संतरे से 7 गुना अधिक विटामिन सी और पालक से 3 गुना अधिक आयरन होता है! इसे दाल में मिलाएं।", bg: "bg-teal-950" },
          { title: "आँवला शक्ति 🌳", text: "एक ताजे आंवले में 20 संतरों जितना विटामिन सी होता है। यह प्राकृतिक रूप से दैनिक बीमारियों के खिलाफ प्रतिरोधक क्षमता को बढ़ाता है।", bg: "bg-emerald-900" }
        ]
      },
      {
        id: 2,
        label: "बच्चों का आहार",
        icon: "👶",
        slides: [
          { title: "विकास की नींव 👶", text: "बढ़ते बच्चों के लिए, स्कूल के दिनों में मजबूत हड्डियों और तेज दिमाग के लिए प्रोटीन और कैल्शियम बहुत महत्वपूर्ण हैं।", bg: "bg-amber-950" },
          { title: "प्राकृतिक नाश्ता 🥜", text: "बाजार के मीठे बिस्कुट छोड़ें। बच्चों को भीगे हुए चने या जैविक गुड़ से मूंगफली की चिक्की दें।", bg: "bg-orange-950" },
          { title: "रागी माल्ट 🌾", text: "बच्चों के दिन की शुरुआत गर्म रागी दलिया से करें। यह भरपूर कैल्शियम से युक्त है जो दोपहर के भोजन तक ऊर्जा बनाए रखता है।", bg: "bg-amber-900" }
        ]
      },
      {
        id: 3,
        label: "स्वच्छ आहार",
        icon: "🥗",
        slides: [
          { title: "प्राकृतिक और शुद्ध भोजन 🥗", text: "शुद्ध खान-पान का अर्थ है डिब्बाबंद, रसायनों से युक्त खाद्य पदार्थों के बजाय स्थानीय साबुत अनाज और ताजे भोजन का चयन करना।", bg: "bg-emerald-950" },
          { title: "बेहतर मुख्य आहार 🌾", text: "सफेद पॉलिश चावल के स्थान पर कांगनी जैसे छोटे बाजरे या उच्च फाइबर वाले बिना पॉलिश के लाल भूरे चावल का उपयोग करें।", bg: "bg-teal-950" },
          { title: "इंद्रधनुषी थाली 🌈", text: "थाली में विभिन्न प्राकृतिक रंगों (हरी सब्जियां, टमाटर, गाजर, दही) को शामिल करने से शरीर को सभी आवश्यक खनिज मिलते हैं।", bg: "bg-emerald-900" }
        ]
      },
      {
        id: 4,
        label: "बाजरा",
        icon: "🌾",
        slides: [
          { title: "विरासत के अनाज 🌾", text: "बाजरा प्राचीन और मजबूत अनाज हैं जिन्हें बहुत कम पानी की आवश्यकता होती है। ये प्रोटीन, फाइबर और पोषक तत्वों से भरपूर हैं।", bg: "bg-emerald-950" },
          { title: "रागी (मंडुआ) 🦴", text: "प्राकृतिक कैल्शियम से भरपूर। रागी का सरल रूप से उपभोग हड्डियों को मजबूत बनाने और मधुमेह को नियंत्रित करने में मदद करता।", bg: "bg-teal-950" },
          { title: "बाजरा 🔥", text: "आयरन और फास्फोरस का बड़ा स्रोत। दैनिक सेवन से थकान दूर होती है और यह महिला स्वास्थ्य के लिए उत्कृष्ट है।", bg: "bg-emerald-900" }
        ]
      },
      {
        id: 5,
        label: "विलेज प्रो",
        icon: "🏘️",
        slides: [
          { title: "स्थानीय स्रोत 🏡", text: "ग्रामीण पारंपरिक आहार स्वाभाविक रूप से बेहतर होते हैं जब साधारण स्वच्छता और भंडारण का पालन किया जाता है।", bg: "bg-emerald-950" },
          { title: "शुद्ध खाना पकाने का तेल 🪔", text: "रासायनिक रिफाइंड तेल के बजाय कोल्ड-प्रेस मूंगफली, सरसों या तिल के तेल का उपयोग करें।", bg: "bg-teal-950" },
          { title: "घर का बगीचा 🌱", text: "कीटनाशक मुक्त ताजा फोलेट के लिए घर के पास करी पत्ता, धनिया और हरी मिर्च लगाएं।", bg: "bg-emerald-900" }
        ]
      }
    ],
    ta: [
      {
        id: 1,
        label: "சூப்பர்ஃபுட்ஸ்",
        icon: "🥥",
        slides: [
          { title: "வீட்டுத் தோட்டம் 🥥", text: "சூப்பர்ஃபுட்கள் என்பவை வெளிநாட்டு பழங்கள் அல்ல! அவை நம் கிராமத்து தோட்டங்களிலேயே வளர்கின்றன.", bg: "bg-emerald-950" },
          { title: "முருங்கை மகிமை 🌿", text: "முருங்கை இலையில் ஆரஞ்சை விட 7 மடங்கு அதிக வைட்டமிட சி மற்றும் கீரையை விட 3 மடங்கு அதிக இரும்புச்சத்து உள்ளது! பருப்பில் ஒரு கைப்பிடி சேர்க்கவும்.", bg: "bg-teal-950" },
          { title: "நெல்லிக்காய் சக்தி 🌳", text: "ஒரு நெல்லிக்காயில் 20 ஆரஞ்சு பழங்களுக்கு இணையான வைட்டமின் சி உள்ளது. இது இயற்கையாகவே நோய் எதிர்ப்பு சக்தியை அதிகரிக்கிறது.", bg: "bg-emerald-900" }
        ]
      },
      {
        id: 2,
        label: "குழந்தை உணவு",
        icon: "👶",
        slides: [
          { title: "வளர்ச்சியின் அடித்தளம் 👶", text: "வளரும் குழந்தைகளுக்கு, பள்ளி பருவத்தில் எலும்பு வளர்ச்சிக்கும் சுறுசுறுப்பான மூளைக்கும் புரதமும் கால்சியமும் அவசியம்.", bg: "bg-amber-950" },
          { title: "இயற்கை சிற்றுண்டி 🥜", text: "கடையில் வாங்கும் இனிப்பு பிஸ்கட்டுகளை தவிர்க்கவும். ஊறவைத்த கடலை அல்லது வெல்லம் சேர்த்த கடலை மிட்டாய் தரலாம்.", bg: "bg-orange-950" },
          { title: "ராகி கஞ்சி 🌾", text: "அவர்களின் நாளை சூடான ராகி கஞ்சியுடன் தொடங்குங்கள். இதில் கால்சியம நிறைந்துள்ளது, ಇದು ಮಧ್ಯಾಹ್ನ ವರೆಗೆ ಸಹಾಯ ಮಾಡುತ್ತದೆ.", bg: "bg-amber-900" }
        ]
      },
      {
        id: 3,
        label: "சுத்தமான உணவு",
        icon: "🥗",
        slides: [
          { title: "இயற்கையான உணவு 🥗", text: "அடிப்படையில் சுத்தமான உணவு என்பது பாக்கெட் உணவுகளுக்குப் பதிலாக உள்ளூர் தினை மற்றும் புதிய உணவுகளைத் தேர்ந்தெடுப்பதாகும்.", bg: "bg-emerald-950" },
          { title: "சிறந்த தானியங்கள் 🌾", text: "வெள்ளை அரிசிக்கு பதிலாக தினை, வரகு அல்லது தவிட்டுடன் கூடிய சிகப்பு அரிசியை பயன்படுத்தவும்.", bg: "bg-teal-950" },
          { title: "வண்ணமயமான தட்டு 🌈", text: "உணவில் பல இயற்கை வண்ணங்களை (கீரை, தக்காளி, கேரட், தயிர்) சேர்ப்பது உடலுக்கு தேவையான தாதுக்களை கொடுக்கும்.", bg: "bg-emerald-900" }
        ]
      },
      {
        id: 4,
        label: "சிறுதானியங்கள்",
        icon: "🌾",
        slides: [
          { title: "பாரம்பரிய தானியங்கள் 🌾", text: "சிறுதானியங்கள் குறைந்த தண்ணீரில் வளரக்கூடியவை. இவை புரதமும நார்சத்தும் நிறைந்தவை.", bg: "bg-emerald-950" },
          { title: "கேழ்வரகு (ராகி) 🦴", text: "இயற்கையான கால்சியம் நிறைந்தது. ராகி உண்பது எலும்புகளை பலப்படுத்தும் மற்றும் சர்க்கரை அளவை கட்டுப்படுத்த உதவும்.", bg: "bg-teal-950" },
          { title: "கம்பு 🔥", text: "இரும்பு மற்றும் பாஸ்பரஸ் சத்துக்கள் நிறைந்தது. தினசரி கம்பு சாப்பிடுவது சோர்வை நீக்கும், பெண்களின் ஆரோக்கியத்திற்கு நல்லது.", bg: "bg-emerald-900" }
        ]
      },
      {
        id: 5,
        label: "விலேஜ் ப்ரோ",
        icon: "🏘️",
        slides: [
          { title: "உள்ளூர் உணவுகள் 🏡", text: "சுகாதாரமான முறையில் தயாரிக்கும் போது நமது பாரம்பரிய கிராமத்து உணவுகளே சிறந்தவை.", bg: "bg-emerald-950" },
          { title: "சுத்தமான சமையல் எண்ணெய் 🪔", text: "சுத்திகரிக்கப்பட்ட எண்ணெய்களுக்கு பதிலாக மரச்செக்கு கடலை எண்ணெய், கடுகு எண்ணெய் அல்லது நல்லெண்ணெய் பயன்படுத்தவும்.", bg: "bg-teal-950" },
          { title: "கொல்லைப்புற தோட்டம் 🌱", text: "பூச்சிக்கொல்லி இல்லாத ஆரோக்கியமான உணவிற்காக வீட்டின் அருகே கறிவேப்பிலை, கொத்தமல்லி மற்றும் பச்சை மிளகாய் வளர்க்கவும்.", bg: "bg-emerald-900" }
        ]
      }
    ],
    kn: [
      {
        id: 1,
        label: "ಸೂಪರ್‌ಫುಡ್ಸ್",
        icon: "🥥",
        slides: [
          { title: "ಹಿತ್ತಲಿನ ಅದ್ಭುತಗಳು 🥥", text: "ಸೂಪರ್‌ಫುಡ್‌ಗಳು ಎಂದರೆ ದುಬಾರಿ ಆಮದು ಮಾಡಿದ ಹಣ್ಣುಗಳಲ್ಲ! ಅವು ನಿಮ್ಮ ಹಳ್ಳಿಯ ತೋಟಗಳಲ್ಲೇ ಬೆಳೆಯುತ್ತಿವೆ.", bg: "bg-emerald-950" },
          { title: "ನುಗ್ಗೆಯ ಪವಾಡ 🌿", text: "ನುಗ್ಗೆ ಸೊಪ್ಪಿನಲ್ಲಿ ಕಿತ್ತಳೆಗಿಂತ 7 ಪಟ್ಟು ಹೆಚ್ಚು ವಿಟಮಿನ್ ಸಿ ಮತ್ತು ಪಾಲಕ್ ಗಿಂತ 3 ಪಟ್ಟು ಹೆಚ್ಚು ಕಬ್ಬಿಣಾಂಶವಿದೆ! ದಾಲ್ ಗೆ ಒಂದು ಹಿಡಿ ಸೇರಿಸಿ.", bg: "bg-teal-950" },
          { title: "ನೆಲ್ಲಿಕಾಯಿ ಶಕ್ತಿ 🌳", text: "ಒಂದು ನೆಲ್ಲಿಕಾಯಿಯಲ್ಲಿ 20 ಕಿತ್ತಳೆ ಹಣ್ಣುಗಳಷ್ಟು ವಿಟಮಿನ್ ಸಿ ಇರುತ್ತದೆ. ಇದು ನೈಸರ್ಗಿಕವಾಗಿ ರೋಗನಿರೋಧಕ ಶಕ್ತಿಯನ್ನು ಹೆಚ್ಚಿಸುತ್ತದೆ.", bg: "bg-emerald-900" }
        ]
      },
      {
        id: 2,
        label: "ಮಕ್ಕಳ ಆಹಾರ",
        icon: "👶",
        slides: [
          { title: "ಬೆಳವಣಿಗೆಯ ಅಡಿಪಾಯ 👶", text: "ಬೆಳೆಯುವ ಮಕ್ಕಳಿಗೆ, ಶಾಲಾ ದಿನಗಳಲ್ಲಿ ಬಲವಾದ ಮೂಳೆಗಳು ಮತ್ತು ತೀಕ್ಷ್ಣವಾದ ಮೆದುಳಿಗೆ ಪ್ರೋಟೀನ್ ಮತ್ತು ಕ್ಯಾಲ್ಸಿಯಂ ಬಹಳ ಮುಖ್ಯ.", bg: "bg-amber-950" },
          { title: "ನೈಸರ್ಗಿಕ ತಿಂಡಿ 🥜", text: "ಅಂಗಡಿಯ ಸಿಹಿ ಬಿಸ್ಕತ್ತುಗಳನ್ನು ತಪ್ಪಿಸಿ. ನೆನೆಸಿದ ಕಡಲೆ ಅಥವಾ ಸಾವಯವ ಬೆಲ್ಲದಿಂದ ಮಾಡಿದ ಕಡಲೇಕಾಯಿ ಚಿಕ್ಕಿ ನೀಡಿ.", bg: "bg-orange-950" },
          { title: "ರಾಗಿ ಅಂಬಲಿ 🌾", text: "ಅವರ ದಿನವನ್ನು ಬಿಸಿ ರಾಗಿ ಅಂಬಲಿಯೊಂದಿಗೆ ಪ್ರಾರಂಭಿಸಿ. ಇದರಲ್ಲಿ ಕ್ಯಾಲ್ಸಿಯಂ ಸಮೃದ್ಧವಾಗಿದೆ, ಇದು ಮಧ್ಯಾಹ್ನದ ಊಟದವರೆಗೆ ಶಕ್ತಿಯನ್ನು ನೀಡುತ್ತದೆ.", bg: "bg-amber-900" }
        ]
      },
      {
        id: 3,
        label: "ಸ್ವಚ್ಛ ಆಹಾರ",
        icon: "🥗",
        slides: [
          { title: "ಸಹಜವಾದ ಆಹಾರ 🥗", text: "ಸ್ವಚ್ಛವಾದ ಆಹಾರ ಪದ್ಧತಿ ಎಂದರೆ ರಾಸಾಯನಿಕಯುಕ್ತ ಆಹಾರಗಳ ಬದಲಿಗೆ ಸ್ಥಳೀಯ ಧಾನ್ಯಗಳು ಮತ್ತು ತಾಜಾ ಆಹಾರವನ್ನು ಆಯ್ಕೆ ಮಾಡುವುದು.", bg: "bg-emerald-950" },
          { title: "ಉತ್ತಮ ಧಾನ್ಯಗಳು 🌾", text: "ಬಿಳಿ ಅಕ್ಕಿಯ ಬದಲಿಗೆ ನವಣೆಯಂತಹ ಸಿರಿಧಾನ್ಯಗಳು ಅಥವಾ ಹೆಚ್ಚಿನ ನಾರಿನಂಶವಿರುವ ಕೈದಂಪು ಅಕ್ಕಿಯನ್ನು ಬಳಸಿ.", bg: "bg-teal-950" },
          { title: "ಬಣ್ಣದ ತಟ್ಟೆ 🌈", text: "ಆಹಾರದಲ್ಲಿ various ನೈಸರ್ಗಿಕ ಬಣ್ಣಗಳನ್ನು (ಸೊಪ್ಪುಗಳು, ಟೊಮೆಟೊ, ಕ್ಯಾರೆಟ್, ಮೊಸರು) ಸೇರಿಸುವುದರಿಂದ ದೇಹಕ್ಕೆ ಅಗತ್ಯವಾದ ಖನಿಜಗಳು ಸಿಗುತ್ತವೆ.", bg: "bg-emerald-900" }
        ]
      },
      {
        id: 4,
        label: "ಸಿರಿಧಾನ್ಯಗಳು",
        icon: "🌾",
        slides: [
          { title: "ಪಾರಂಪರಿಕ ಧಾನ್ಯಗಳು 🌾", text: "ಸಿರಿಧಾನ್ಯಗಳು ಕಡಿಮೆ ನೀರಿನಲ್ಲಿ ಬೆಳೆಯುವ ಪುರಾತನ ಧಾನ್ಯಗಳಾಗಿವೆ. ಇವು ಪ್ರೋಟೀನ್, ನಾರಿನಂಶ ಮತ್ತು ಪೋಷಕಾಂಶಗಳಿಂದ ತುಂಬಿವೆ.", bg: "bg-emerald-950" },
          { title: "ರಾಗಿ (ಬೆರಳು ರಾಗಿ) 🦴", text: "ನೈಸರ್ಗಿಕ ಕ್ಯಾಲ್ಸಿಯಂನಿಂದ ಸಮೃದ್ಧವಾಗಿದೆ. ರಾಗಿ ಸೇವನೆಯು ಮೂಳೆಗಳನ್ನು ಬಲಪಡಿಸುತ್ತದೆ ಮತ್ತು ಮಧುಮೇಹವನ್ನು ನಿಯಂತ್ರಿಸಲು ಸಹಾಯ ಮಾಡುತ್ತದೆ.", bg: "bg-teal-950" },
          { title: "ಸಜ್ಜೆ 🔥", text: "ಕಬ್ಬಿಣದ ಅಂಶ ಮತ್ತು ರಂಜಕದ ದೊಡ್ಡ ಮೂಲವಾಗಿದೆ. ದಿನನಿತ್ಯದ ಸಜ್ಜೆ ಸೇವನೆಯು ಆಯಾಸವನ್ನು ದೂರ ಮಾಡುತ್ತದೆ ಮತ್ತು ಮಹಿಳೆಯರ ಆರೋಗ್ಯಕ್ಕೆ ಒಳ್ಳೆಯದು.", bg: "bg-emerald-900" }
        ]
      },
      {
        id: 5,
        label: "ವಿಲೇಜ್ ಪ್ರೊ",
        icon: "🏘️",
        slides: [
          { title: "ಸ್ಥಳೀಯವಾಗಿ ಬೆಳೆದವು 🏡", text: "ಸರಳ ನೈರ್ಮಲ್ಯ ಮತ್ತು ಶೇಖರಣೆಯನ್ನು ಪಾಲಿಸಿದಾಗ ಗ್ರಾಮೀಣ ಆಹಾರಗಳು ಸ್ವಾಭಾವಿಕವಾಗಿ ಉತ್ತಮವಾಗಿರುತ್ತವೆ.", bg: "bg-emerald-950" },
          { title: "ಶುದ್ಧ ಅಡುಗೆ ಎಣ್ಣೆಗಳು 🪔", text: "ರಾಸಾಯನಿಕ ರಿಫೈನ್ಡ್ ಎಣ್ಣೆಗಳ ಬದಲಿಗೆ ಗಾಣದಿಂದ ತಯಾರಿಸಿದ ಶೇಂಗಾ ಅಥವಾ ಸಾಸಿವೆ ಎಣ್ಣೆಯನ್ನು ಬಳಸಿ.", bg: "bg-teal-950" },
          { title: "ಹಿತ್ತಲ ಕೈತೋಟ 🌱", text: "ಕೀಟನಾಶಕ ಮುಕ್ತ ತಾಜಾ ಪೋಷಕಾಂಶಗಳಿಗಾಗಿ ಮನೆಯ ಬಳಿ ಕರಿಬೇವು, ಕೊತ್ತಂಬರಿ ಮತ್ತು ಹಸಿಮೆಣಸಿನಕಾಯಿ ಬೆಳೆಸಿ.", bg: "bg-emerald-900" }
        ]
      }
    ]
  };
  return data[lang] || data.en;
};

const getChecklistText = (id: number, t: any) => {
  switch(id) {
    case 1: return t.home.healthyBreakfast || "Healthy Breakfast";
    case 2: return t.home.morningWater || "Morning Water (1L)";
    case 3: return t.home.eatFruit || "Eat Fresh Fruit";
    case 4: return t.home.noSugary || "No Sugary Drinks";
    default: return "";
  }
};

export default function HomeView() {
  const { profile, user, familyMembers, appMode, setActiveTab, setActiveTrackerModule, refreshProfile, language } = useApp();
  const t = translations[language] || translations.en;
  const [streak, setStreak] = useState(0);
  const [waterLevel, setWaterLevel] = useState(0);
  const [checklist, setChecklist] = useState([
    { id: 1, done: false, icon: "🍳" },
    { id: 2, done: false, icon: "💧" },
    { id: 3, done: false, icon: "🍎" },
    { id: 4, done: false, icon: "🥤" },
  ]);

  const [seenStories, setSeenStories] = useState<number[]>(() => {
    const saved = localStorage.getItem("seen_stories");
    return saved ? JSON.parse(saved) : [];
  });

  const [activeStory, setActiveStory] = useState<any | null>(null);
  const [activeStorySlide, setActiveStorySlide] = useState(0);

  const addRewardPoints = async (pointsToAdd: number) => {
    if (!user) {
      const current = parseInt(localStorage.getItem("local_reward_points") || "842");
      localStorage.setItem("local_reward_points", (current + pointsToAdd).toString());
      window.dispatchEvent(new Event("localPointsUpdated"));
      return;
    }
    const path = `users/${user.uid}`;
    try {
      const userRef = doc(db, "users", user.uid);
      await setDoc(userRef, { points: increment(pointsToAdd) }, { merge: true });
      await refreshProfile();
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  };

  const markStoryAsSeen = (storyId: number) => {
    if (!seenStories.includes(storyId)) {
      const next = [...seenStories, storyId];
      setSeenStories(next);
      localStorage.setItem("seen_stories", JSON.stringify(next));
      addRewardPoints(10);
    }
  };

  const stories = getLocalizedStories(language);

  useEffect(() => {
    if (!user) return;
    const path = `users/${user.uid}/habits`;
    const q = query(
      collection(db, "users", user.uid, "habits"),
      where("timestamp", ">=", new Date(new Date().setHours(0,0,0,0))),
      orderBy("timestamp", "desc")
    );

    const unsub = onSnapshot(q, (snap) => {
      const todayLogs = snap.docs.map(doc => doc.data());
      const water = todayLogs.filter(l => l.type === 'water').reduce((acc, curr) => acc + curr.value, 0);
      setWaterLevel(Math.min(water, 3.5));
      if (water >= 1) setChecklist(prev => prev.map(item => item.id === 2 ? { ...item, done: true } : item));
      if (todayLogs.some(l => l.type === 'meal')) setChecklist(prev => prev.map(item => item.id === 1 ? { ...item, done: true } : item));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });

    setStreak(profile?.streak || 5);
    return unsub;
  }, [user, profile]);

  const addHabit = async (type: string, value: number) => {
    if (!user) return;
    const path = `users/${user.uid}/habits`;
    try {
      await addDoc(collection(db, "users", user.uid, "habits"), {
        userId: user.uid,
        type,
        value,
        timestamp: serverTimestamp()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  return (
    <div className="space-y-8 text-slate-100">
      {/* Story Circles - Instagram/Duolingo style */}
      <section className="flex gap-4 overflow-x-auto no-scrollbar pb-2 -mx-2 px-2">
        {stories.map(story => {
          const isSeen = seenStories.includes(story.id);
          return (
            <div key={story.id} className="flex flex-col items-center gap-2 flex-shrink-0">
              <motion.button 
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  setActiveStory(story);
                  setActiveStorySlide(0);
                }}
                className={`w-16 h-16 rounded-full p-1 border-2 transition-colors ${
                  isSeen
                    ? 'border-slate-850/80 dark:border-slate-800' 
                    : 'border-emerald-500'
                }`}
              >
                <div className="w-full h-full rounded-full bg-[#131B2A] border border-slate-850 flex items-center justify-center text-2xl shadow-lg">
                  {story.icon}
                </div>
              </motion.button>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{story.label}</span>
            </div>
          );
        })}
      </section>

      {/* Main Greeting & Health Status */}
      <section className="relative">
        <h2 className="text-4xl font-serif italic text-indigo-400 leading-tight">{(t.home.namaste || "Namaste") + ","} <br/><span className="not-italic font-black text-white leading-none">{profile?.displayName?.split(' ')[0]}</span></h2>
        <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="absolute top-0 right-0 flex flex-col items-end"
        >
            <div className="flex items-center gap-2 bg-emerald-950/80 px-3 py-1.5 rounded-full border border-emerald-500/20 mb-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">{t.home.ranking || "Village Ranking: #4"}</span>
            </div>
            <div className="flex -space-x-2">
                {familyMembers.map((m, i) => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-slate-900 bg-[#1D283C] flex items-center justify-center text-xs shadow-sm" title={m.name}>{m.icon}</div>
                ))}
                <div className="w-8 h-8 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center text-[10px] text-slate-200 font-black">+2</div>
            </div>
        </motion.div>
      </section>

      {/* Traffic Light Main Metric */}
      <section className="grid grid-cols-12 gap-4">
        <motion.div 
            whileHover={{ y: -5 }}
            className="col-span-12 bg-[#131B2A] rounded-[40px] p-8 border border-slate-800 shadow-2xl shadow-indigo-950/10"
        >
            <div className="flex justify-between items-start mb-8">
                <div>
                    <p className="text-[10px] font-black text-slate-450 uppercase tracking-[0.2em] mb-1">{t.home.nutriScore || "Your NutriScore"}</p>
                    <div className="flex items-baseline gap-2">
                        <h3 className="text-6xl font-black text-white tracking-tighter">84</h3>
                        <span className="text-indigo-400 font-black">/ 100</span>
                    </div>
                </div>
                <div className="flex flex-col gap-2">
                    <div className="w-12 h-4 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/20" />
                    <div className="w-12 h-4 rounded-full bg-slate-800" />
                    <div className="w-12 h-4 rounded-full bg-slate-800" />
                </div>
            </div>
            
            <div className="flex items-center gap-4 p-4 bg-indigo-950/40 rounded-3xl border border-indigo-800/20">
                <div className="w-10 h-10 bg-[#14233c] rounded-xl flex items-center justify-center text-white p-2">
                    <Zap className="w-full h-full" />
                </div>
                <p className="text-xs font-bold text-indigo-200">{t.home.streakNudge || "Your health is Improving. Great job on the 5-day streak!"}</p>
            </div>
        </motion.div>
      </section>

      {/* Quick Action Grid */}
      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="col-span-full flex items-center justify-between px-2">
            <h4 className="text-xs font-black text-slate-450 uppercase tracking-widest">{t.home.actions || "Nutrition Actions"}</h4>
            <LayoutGrid className="w-4 h-4 text-slate-650" />
        </div>
        <ActionCard 
            label={t.home.logMeal || "Log Meal"} 
            sub={t.home.indianThali || "Indian Thali"} 
            icon={<Apple />} 
            color="indigo" 
            onClick={() => addHabit('meal', 1)}
        />
        <ActionCard 
            label={t.home.drinkWater || "Drink Water"} 
            sub={t.home.addWaterVal || "Add 250ml"} 
            icon={<Droplet />} 
            color="blue" 
            onClick={() => addHabit('water', 0.25)}
        />
        <ActionCard 
            label={t.home.bmiWeight || "BMI & Weight"} 
            sub={t.home.logProgress || "Log Progress"} 
            icon={<TrendingUp />} 
            color="blue" 
            onClick={() => { setActiveTab('trackers'); setActiveTrackerModule('bmi'); }}
        />
        <ActionCard 
            label={t.home.conditionDiet || "Condition Diet"} 
            sub={t.home.therapeuticCare || "Therapeutic Care"} 
            icon={<ShieldCheck />} 
            color="indigo" 
            onClick={() => { setActiveTab('trackers'); setActiveTrackerModule('disease'); }}
        />
        <ActionCard 
            label={t.home.ironWellness || "Iron Wellness"} 
            sub={t.home.anemiaDefense || "Anemia Defense"} 
            icon={<Flame />} 
            color="rose" 
            onClick={() => { setActiveTab('trackers'); setActiveTrackerModule('women'); }}
        />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Family Loop Interactive */}
        <section 
            onClick={() => { setActiveTab('trackers'); setActiveTrackerModule('family'); }}
            className="bg-[#131B2A] rounded-[48px] p-8 md:p-12 text-slate-100 shadow-3xl border border-slate-800 relative overflow-hidden h-full cursor-pointer hover:scale-[1.01] transition-all"
        >
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl" />
            <div className="flex justify-between items-center mb-10">
                <div>
                    <h3 className="text-2xl font-black tracking-tight text-white">{t.trackers.familyLoopTitle || "Family Health Loop"}</h3>
                    <p className="text-slate-400 text-xs font-bold mt-1 uppercase tracking-widest">{t.home.protectingMembers || "Protecting 3 Members"}</p>
                </div>
                <motion.div whileTap={{ scale: 0.9 }} className="w-12 h-12 bg-slate-800 border-2 border-slate-700/60 rounded-2xl flex items-center justify-center">
                    <ChevronRight className="w-6 h-6 text-white" />
                </motion.div>
            </div>
            
            <div className="space-y-6">
                {familyMembers.map((member, idx) => (
                    <div key={idx} className="group cursor-pointer">
                        <div className="flex justify-between items-center mb-3">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-center text-2xl shadow-xl">{member.icon}</div>
                                <div>
                                    <h4 className="font-black text-sm text-white">{member.name}</h4>
                                    <p className={`text-[10px] font-black uppercase tracking-widest ${member.status === 'Healthy' ? 'text-emerald-400' : 'text-rose-400'}`}>{member.status}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black text-slate-400 uppercase">92%</span>
                                <div className="w-16 h-1 hidden sm:block bg-slate-850 rounded-full overflow-hidden border border-slate-800">
                                    <div className="h-full bg-emerald-400 w-[92%]" />
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            
            <button 
                onClick={(e) => { e.stopPropagation(); setActiveTab('trackers'); setActiveTrackerModule('family'); }}
                className="w-full mt-8 py-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-[28px] font-black text-sm flex items-center justify-center gap-3 shadow-xl transition-all"
            >
                <Plus className="w-5 h-5" />
                {t.home.addFamilyMember || "Add Family Member"}
            </button>
        </section>

        {/* Daily Progress */}
        <section className="bg-[#101725] rounded-[40px] p-8 md:p-12 border border-slate-800/60 h-full text-slate-100">
            <div className="flex justify-between items-center mb-6">
                <h4 className="text-sm font-black text-white uppercase tracking-widest">{t.home.todayMissions || "Today's Missions"}</h4>
                <div className="p-2 bg-indigo-950 text-indigo-400 rounded-xl border border-indigo-900/30"><Trophy className="w-4 h-4" /></div>
            </div>
            <div className="space-y-3">
                {checklist.map(item => (
                    <motion.div 
                        key={item.id}
                        layout
                        className={`flex items-center gap-4 p-5 rounded-3xl transition-all ${item.done ? 'bg-slate-900/40 border border-slate-850 opacity-40' : 'bg-slate-900 border border-slate-800 shadow-sm'}`}
                    >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.done ? 'bg-emerald-500 text-slate-950 font-black' : 'bg-slate-850 text-slate-450 border border-slate-800'}`}>
                            {item.done ? <CheckCircle2 className="w-5 h-5 text-white" /> : <span className="text-lg">{item.icon}</span>}
                        </div>
                        <span className={`text-[13px] font-bold ${item.done ? 'text-slate-450 line-through' : 'text-slate-200'}`}>{getChecklistText(item.id, t)}</span>
                        {!item.done && <Plus className="w-4 h-4 text-slate-650 ml-auto" />}
                    </motion.div>
                ))}
            </div>
        </section>
      </div>

      {/* Immersive Story Player Overlay */}
      <AnimatePresence>
        {activeStory && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4"
            onClick={() => {
              if (activeStory?.id) {
                markStoryAsSeen(activeStory.id);
              }
              setActiveStory(null);
            }}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 50 }}
              className={`w-full max-w-md ${activeStory?.slides?.[activeStorySlide]?.bg || "bg-slate-900"} text-white rounded-[40px] overflow-hidden shadow-2xl relative border border-white/10 flex flex-col h-[600px] justify-between p-8`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Progress Bar Indicators at the Top */}
              <div className="flex gap-1.5 w-full bg-white/10 p-1.5 rounded-full mb-4">
                {activeStory?.slides?.map((_: any, idx: number) => (
                  <div key={idx} className="h-1.5 flex-1 bg-white/20 rounded-full overflow-hidden relative">
                    <motion.div 
                      className="absolute top-0 left-0 h-full bg-white rounded-full"
                      initial={{ width: "0%" }}
                      animate={{ 
                        width: activeStorySlide > idx 
                           ? "100%" 
                           : activeStorySlide === idx 
                           ? "100%" 
                           : "0%" 
                      }}
                      transition={{ 
                        duration: activeStorySlide === idx ? 5.0 : 0.2,
                        ease: "linear"
                      }}
                      onAnimationComplete={() => {
                        if (activeStorySlide === idx && activeStory?.slides) {
                          if (activeStorySlide < activeStory.slides.length - 1) {
                            setActiveStorySlide(prev => prev + 1);
                          } else {
                            if (activeStory?.id) {
                              markStoryAsSeen(activeStory.id);
                            }
                            setActiveStory(null);
                          }
                        }
                      }}
                    />
                  </div>
                ))}
              </div>

              {/* Header with Close option */}
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{activeStory?.icon}</span>
                  <div>
                    <h4 className="font-black tracking-tight text-white leading-none">{activeStory?.label}</h4>
                    <span className="text-[9px] font-black uppercase text-white/50 tracking-widest block mt-1.5">{t.home.villageStoryCoach || "Village Story Coach"}</span>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    if (activeStory?.id) {
                      markStoryAsSeen(activeStory.id);
                    }
                    setActiveStory(null);
                  }}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

               {/* Main Content Area */}
              <div className="flex-1 flex flex-col justify-center space-y-6 text-center px-4">
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-white/40">{t.home.healthyLivingMission || "Healthy Living Mission"}</span>
                <h3 className="text-3xl font-black leading-snug tracking-tight text-white">
                  {activeStory?.slides?.[activeStorySlide]?.title}
                </h3>
                <p className="text-white/80 font-semibold text-base leading-relaxed">
                  {activeStory?.slides?.[activeStorySlide]?.text}
                </p>
              </div>

              {/* Footer navigation */}
              <div className="flex items-center justify-between border-t border-white/10 pt-6">
                <button 
                  disabled={activeStorySlide === 0}
                  onClick={() => setActiveStorySlide(prev => Math.max(0, prev - 1))}
                  className="px-6 py-3 rounded-full bg-white/10 hover:bg-white/15 disabled:opacity-30 disabled:pointer-events-none text-xs font-black uppercase tracking-widest text-white transition-all cursor-pointer"
                >
                  {t.home.prev || "Prev"}
                </button>
                <div className="flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3.5 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest">
                  {t.home.pointsReward || "+10 Points Reward"}
                </div>
                {activeStory?.slides && activeStorySlide < activeStory.slides.length - 1 ? (
                  <button 
                    onClick={() => setActiveStorySlide(prev => prev + 1)}
                    className="px-8 py-3 bg-white text-emerald-950 font-black rounded-full text-xs uppercase tracking-widest hover:bg-slate-100 transition-all shadow-lg flex items-center gap-1 cursor-pointer"
                  >
                    {t.home.next || "Next"} <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button 
                    onClick={() => {
                      if (activeStory?.id) {
                        markStoryAsSeen(activeStory.id);
                      }
                      setActiveStory(null);
                    }}
                    className="px-8 py-3 bg-emerald-500 text-white font-black rounded-full text-xs uppercase tracking-widest hover:bg-emerald-400 transition-all shadow-lg flex items-center gap-1 cursor-pointer"
                  >
                    {t.home.finish || "Finish ★"}
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ActionCard({ label, sub, icon, color, onClick }: any) {
    const colors: any = {
        indigo: "bg-[#14233c] text-indigo-400 border-indigo-500/25 shadow-lg shadow-indigo-950/20 hover:bg-[#1a2d4d]",
        blue: "bg-[#0e2744] text-blue-400 border-blue-500/25 shadow-lg shadow-blue-950/20 hover:bg-[#143256]",
        rose: "bg-[#251216] text-rose-400 border-rose-500/25 shadow-lg shadow-rose-950/20 hover:bg-[#32171c]"
    };

    return (
        <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onClick}
            className={`p-6 rounded-[32px] border bg-[#131B2A] flex flex-col items-center gap-4 group transition-all hover:shadow-2xl hover:scale-[1.02] ${colors[color]}`}
        >
            <div className={`w-16 h-16 rounded-[24px] flex items-center justify-center text-3xl shadow-xl transition-all group-hover:scale-110 border ${colors[color]}`}>
                {React.cloneElement(icon as any, { className: "w-8 h-8" })}
            </div>
            <div className="text-center">
                <p className="text-[13px] font-black uppercase tracking-tighter text-white">{label}</p>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">{sub}</p>
            </div>
        </motion.button>
    )
}

function FamilyMember({ name, progress, icon, health }: any) {
    return (
        <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-3">
                    <span className="text-xl">{icon}</span>
                    <span className="font-bold text-white">{name}</span>
                </div>
                <div className="flex items-center gap-3">
                    {health && <span className="bg-rose-950 text-rose-300 border border-rose-500/20 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest">{health}</span>}
                    <span className="font-black text-slate-450">{progress}%</span>
                </div>
            </div>
            <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-850">
                <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className={`h-full ${progress > 80 ? 'bg-emerald-400' : progress > 50 ? 'bg-orange-400' : 'bg-rose-450'}`} 
                />
            </div>
        </div>
    )
}

function QuickLog({ label, sub, icon, color, onClick }: any) {
    const colors: any = {
        blue: "bg-blue-950/80 text-blue-400 hover:bg-blue-900 hover:text-white",
        green: "bg-emerald-950/80 text-emerald-400 hover:bg-emerald-900 hover:text-white",
        rose: "bg-rose-950/80 text-rose-400 hover:bg-rose-900 hover:text-white"
    };

    return (
        <motion.button 
            whileTap={{ scale: 0.95 }}
            onClick={onClick}
            className="flex flex-col items-center gap-3 p-6 bg-[#131B2A] rounded-[32px] border border-slate-850 shadow-sm hover:shadow-xl hover:border-slate-700 transition-all group"
        >
            <div className={`p-4 rounded-2xl transition-all group-hover:scale-110 border border-slate-800 ${colors[color]}`}>
                {React.cloneElement(icon as any, { className: "w-6 h-6" })}
            </div>
            <div className="text-center">
                <p className="text-xs font-black text-white uppercase tracking-tighter">{label}</p>
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{sub}</p>
            </div>
        </motion.button>
    )
}

function StatCard({ title, val, target, icon, progress, color }: any) {
    const barColors: any = {
        blue: "bg-blue-400",
        green: "bg-emerald-400",
        orange: "bg-orange-400"
    };

    return (
        <div className="bg-[#131B2A] p-8 rounded-[40px] border border-slate-850 shadow-sm flex flex-col h-48 transition-all hover:shadow-lg hover:border-slate-700">
            <div className="flex justify-between items-start mb-4">
                <span className="text-xs font-black text-slate-450 uppercase tracking-widest">{title}</span>
                <div className="p-2 bg-slate-900 border border-slate-800 text-slate-300 rounded-xl">{icon}</div>
            </div>
            <div className="mt-auto">
                <div className="text-3xl font-black text-white">{val} <span className="text-xs font-normal text-slate-450">/ {target.split(' ')[0]}</span></div>
                <div className="w-full bg-slate-950 border border-slate-850 h-2 mt-4 rounded-full overflow-hidden">
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        className={`h-full ${barColors[color]}`} 
                    />
                </div>
            </div>
        </div>
    )
}
