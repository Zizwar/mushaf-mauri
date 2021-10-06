/*import NetInfo from '@react-native-community/netinfo';
let isConnected = false
NetInfo.fetch().then(state => {
  console.log('Connection type', state.type);
  console.log('Is connected?', state.isConnected);
  isConnected = state.isConnected;
});
*/
//
const BASE_URL = "https://alquran.cloud/api/";
const BASE_URL3 = "http://www.everyayah.com/data/";//http://www.everyayah.com/data/AbdulSamad_64kbps_QuranExplorer.Com/001001.mp3
const BASE_URL2 = "http://quran.ksu.edu.sa/";//ayat/mp3/Hudhaify_64kbps/001001.mp3";


//
export const getImagePageUri = ({ quira, id }) => {
  switch (quira) {
    case "warsh":
      correntImg = `${BASE_URL2}safahat/warsh2/${id}.jpg`; break;
    //correntImg = `https://mushaf.ma/fahres/page/images/muhammadi/page${id+2}.png`; break;
      case "madina":
      //  correntImg = `${BASE_URL2}safahat/warsh2/${id}.jpg`; break;
     // correntImg = `${BASE_URL2}safahat/hafs/${id}.png`; break;
      correntImg = `${BASE_URL2}tajweed_png/${id}.png`; break;
      default:
   correntImg = `https://mushaf.ma/fahres/page/images/muhammadi/page${id+2}.png`; break;
   }

  return correntImg;
};
export const getAudioMoqriUri = ({ moqri = "Hudhaify_64kbps", id }) =>
  `${BASE_URL2}ayat/mp3/${moqri}/${id}.mp3`;
//
export const getTafsirUri = ({ author, sura, aya }) =>
  `${BASE_URL2}interface.php?ui=mobile&do=tafsir&author=${
    author ? author : "sa3dy"
  }&sura=${sura}&aya=${aya}`;

export const getTarjama = ({ tarjama, b_sura, b_aya, e_sura, e_aya }) =>
  `${BASE_URL2}interface.php?ui=mobile&do=tarjama&tafsir=${
    tarjama ? tarjama : "ar_muyassar"
  }&b_sura=${b_sura}&b_aya=${b_aya}&e_sura=${e_sura}&e_aya=${e_aya}`;
export const loadDBTarajem = (db) =>
  `${BASE_URL2}ayat/resources/tarajem/${db}.ayt`;
export const loadDBTafsir = (db) =>
  `${BASE_URL2}ayat/resources/tafasir/${db}.ayt`;

/*
fetch('https://smmry.com/')
    .then((resp) => resp.text())
    .then(function (data) {
    })

*/
