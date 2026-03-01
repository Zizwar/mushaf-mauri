export const listAuthorTafsir = _lang => [
   

  { id: "sa3dy", name: _lang["tafsir_sa3dy"] },
   { id: "baghawy", name: _lang["tafsir_ba3awy"] },
  { id: "katheer", name: _lang["tafsir_katheer"] },
  { id: "qortoby", name: _lang["tafsir_kortoby"] },
  { id: "tabary", name: _lang["tafsir_tabary"] },
  { id: "indonesian", name: _lang["tafsir_indonesian"] },
  { id: "russian", name: _lang["tafsir_russian"] }
 // { id: "waseet", name: _lang["tafsir_waseet"] },
  //{ id: "tanweer", name: _lang["tafsir_tanweer"] },
  //{ id: "e3rab", name: _lang["tafsir_e3rab"] },
 // { id: "tafheem", name: _lang["tafsir_tafheem"] },
];

export const listPage = _lang => [
  { id: "warsh", name: _lang["mosshaf_warsh"] },
 // { id: "tajweed", name: _lang["mosshaf_tajweed"] },

]
export const listAuthorTarajem = [ 
    //
  { name: "نصوص الآيات - إملائي", filter: "All", id: "ayat" },
  { name: "عربى - التفسير الميسر", filter: "All", id: "ar_muyassar" },
  { name: "عربى - معاني الكلمات", filter: "All", id: "ar_ma3any" },
  { name: "English - Sahih International", filter: "Europe", id: "en_sahih" },
  { name: "Français - Hamidullah", filter: "Europe", id: "fr_hamidullah" },
  { name: "Spanish - Melara Navio", filter: "Europe", id: "es_navio" },
  { name: "Português - El Hayek", filter: "Europe", id: "pt_elhayek" },
  { name: "Deutsch - Bubenheim & Elyas", filter: "Europe", id: "de_bubenheim" },
  { name: "Turkish - Diyanet Isleri", filter: "Europe", id: "tr_diyanet" },
  { name: "Bosnian - Korkut", filter: "Europe", id: "bs_korkut" },
  { name: "Shqiptar - Efendi Nahi", filter: "Europe", id: "sq_nahi" },
  { name: "Italian - Piccardo", filter: "Europe", id: "it_piccardo" },
  { name: "Dutch - Sofian Siregar", filter: "Europe", id: "nl_siregar" },
  { name: "أردو - جالندربرى", filter: "Asia", id: "ur_jalandhry" },
  { name: "كردى - برهان محمد أمين", filter: "Asia", id: "ku_asan" },
  { name: "فارسى - حسين تاجى كله دارى", filter: "Asia", id: "pr_tagi" },
  {
    name: "Indonesian - Bahasa Indonesia",
    filter: "Asia",
    id: "id_indonesian"
  },
  { name: "Malay - Basmeih", filter: "Asia", id: "ms_basmeih" },
  { name: "Thai - ภาษาไทย", filter: "Asia", id: "th_thai" },
  { name: "Bengali - Muhiuddin Khan", filter: "Asia", id: "bn_bengali" },
  {
    name: "Malayalam - Abdul Hameed and Kunhi",
    filter: "Asia",
    id: "ml_abdulhameed"
  },
  { name: "Tamil - Jan Turst Foundation", filter: "Asia", id: "ta_tamil" },
  { name: "Россию - Кулиев", filter: "Asia", id: "ru_kuliev" },
  { name: "Uzbek - Мухаммад Содик", filter: "Asia", id: "uz_sodik" },
  { name: "Chinese - Ma Jian", filter: "Asia", id: "zh_jian" },
  { name: "Somali - Abduh", filter: "Africa", id: "so_abduh" },
  { name: "Hausa - Gumi", filter: "Africa", id: "ha_gumi" },
  { name: "Swahili - Al-Barwani", filter: "Africa", id: "sw_barwani" }
];
// Warsh DB reciters (Al-Kouchi, Al-Kazabri) - use quadratic timing from SQLite DB
export const WARSH_DB_RECITERS = [
  { id: "__warsh_db_1__", warshRecitorId: 1 },
  { id: "__warsh_db_2__", warshRecitorId: 2 },
];

// No CDN Warsh reciters — only DB reciters (Al-Kouchi, Al-Kazabri) for now
export const WARSH_CDN_IDS = [];

export const listVoiceMoqri = _lang => [
  {
    id: "__user_recording__",
    voice: _lang["recite_user"] || "My Recitation"
  },
  // Warsh DB reciters (shown only in Warsh mode)
  {
    id: "__warsh_db_1__",
    voice: _lang["recitor_alkouchi"] || "العيون الكوشي",
    type: "warsh_db"
  },
  {
    id: "__warsh_db_2__",
    voice: _lang["recitor_alkazabri"] || "عمر القزابري",
    type: "warsh_db"
  },
  {
    id: "Hudhaify_64kbps",
    voice: _lang["recite_hudhaify"]
  },
  {
    id: "Husary_64kbps",
    voice: _lang["recite_husary"]
  },
  {
    id: "husary_qasr_64kbps",
    voice: _lang["recite_husary"] + " 2"
  },
  {
    id: "Abdullah_Basfar_64kbps",
    voice: _lang["recite_basfar"]
  },
  {
    id: "Muhammad_Ayyoub_64kbps",
    voice: _lang["recite_ayyoub"]
  },
  {
    id: "Minshawy_Murattal_128kbps",
    voice: _lang["recite_minshawy"]
  },
  {
    id: "Abdul_Basit_Murattal_64kbps",
    voice: _lang["recite_abdul_basit"]
  },
  {
    id: "Banna_32kbps",
    voice: _lang["recite_banna"]
  },
  {
    id: "Mohammad_al_Tablaway_64kbps",
    voice: _lang["recite_tablawy"]
  },
  {
    id: "Ali_Jaber_64kbps",
    voice: _lang["recite_jaber"]
  },
  {
    id: "Alafasy_64kbps",
    voice: _lang["recite_afasy"]
  },
  {
    id: "Abu_Bakr_Ash-Shaatree_64kbps",
    voice: _lang["recite_shaatree"]
  },
  {
    id: "Nasser_Alqatami_128kbps",
    voice: _lang["recite_qatami"]
  },
  {
    id: "tunaiji_64kbps",
    voice: _lang["recite_khaleefa"]
  },
  {
    id: "Yaser_Salamah_128kbps",
    voice: _lang["recite_salamah"]
  },
  {
    id: "Muhammad_Jibreel_64kbps",
    voice: _lang["recite_jibreel"]
  },
  {
    id: "Ghamadi_40kbps",
    voice: _lang["recite_ghamadi"]
  },
  {
    id: "Abdurrahmaan_As-Sudais_64kbps",
    voice: _lang["recite_sudais"]
  },
  {
    id: "Saood_ash-Shuraym_64kbps",
    voice: _lang["recite_shuraym"]
  },

  {
    id: "Maher_AlMuaiqly_64kbps",
    voice: _lang["recite_maher"]
  },
  {
    id: "Ahmed_ibn_Ali_al-Ajamy_64kbps",
    voice: _lang["recite_ajamy"]
  },

  {
    id: "Abdullaah_3awwaad_Al-Juhaynee_128kbps",
    voice: _lang["recite_juhanee"]
  },
  {
    id: "Muhsin_Al_Qasim_192kbps",
    voice: _lang["recite_muhsin"]
  },
  {
    id: "Fares_Abbad_64kbps",
    voice: _lang["recite_abbad"]
  },
  {
    id: "Yasser_Ad-Dussary_128kbps",
    voice: _lang["recite_yaser"]
  },
  {
    id: "Hani_Rifai_192kbps",
    voice: _lang["recite_rifai"]
  },
  {
    id: "Ayman_Sowaid_64kbps",
    voice: _lang["recite_ayman"] + " - " + _lang["recite_moalim"]
  },
  {
    id: "Hussary.teacher_64kbps",
    voice: _lang["recite_husary"] + " - " + _lang["recite_moalim"]
  },
  {
    id: "Minshawy_Teacher_128kbps",
    voice: _lang["recite_minshawy"] + " - " + _lang["recite_moalim"]
  },
  {
    id: "khaleefa_96kbps",
    voice: _lang["recite_khaleefa"] + " - " + _lang["recite_moalim"]
  },
  {
    id: "Husary_Mujawwad_64kbps",
    voice: _lang["recite_husary"] + " - " + _lang["recite_mujawwad"]
  },
  {
    id: "AbdulSamad_64kbps",
    voice: _lang["recite_abdul_basit"] + " - " + _lang["recite_mujawwad"]
  },
  {
    id: "Minshawy_Mujawwad_64kbps",
    voice: _lang["recite_minshawy"] + " - " + _lang["recite_mujawwad"]
  },
  {
    id: "warsh_dossary_128kbps",
    voice: _lang["recite_ibrahim_dosary"] + " - " + _lang["recite_warsh"]
  },
  {
    id: "warsh_husary_64kbps",
    voice: _lang["recite_husary"] + " - " + _lang["recite_warsh"]
  },
  {
    id: "warsh_yassin_64kbps",
    voice: _lang["recite_yassin"] + " - " + _lang["recite_warsh"]
  }
];
