export const getImagePageUri = ({ quira, id }) => {
  let correntImg; //=  "https://quran.ksu.edu.sa/safahat/hafs/" + id + ".png";
          //"http://quran.ksu.edu.sa/png_big/" + id + ".png"; // default hafs
/*
if(quira=="hafsDorar")
         correntImg ="https://quran.ksu.edu.sa/safahat/aldoare/" + id + ".jpg";
  if (quira == "tajweed")
          correntImg = "http://quran.ksu.edu.sa/tajweed_png/" + id + ".png";
  if (quira == "warsh")
           correntImg = "http://quran.ksu.edu.sa/warsh/" + id + ".png";
 */
 switch (quira) {
      case "hafs":
                  correntImg =  "https://quran.ksu.edu.sa/safahat/hafs/" + id + ".png";break;
     case "hafsAlsose":
       correntImg ="https://quran.ksu.edu.sa/safahat/alsose/" + id + ".jpg";break;
        case "hafsShohbah":
       correntImg ="https://quran.ksu.edu.sa/safahat/shoabah/" + id + ".jpg";break;
                 case "hafsDorar":
       correntImg ="https://quran.ksu.edu.sa/safahat/aldoare/" + id + ".jpg";break;
      case "warsh":
        correntImg = "http://quran.ksu.edu.sa/warsh/" + id + ".png";break;
      case "tajweed":
         correntImg = "http://quran.ksu.edu.sa/tajweed_png/" + id + ".png";break;
      default:
        return correntImg =  "https://quran.ksu.edu.sa/safahat/hafs/" + id + ".png";break;
    }

  return(correntImg);
};
export const getAudioMoqriUri = ({ moqri='Hudhaify_64kbps', id }) =>
  `http://quran.ksu.edu.sa/ayat/mp3/${moqri}/${id}.mp3`;
//"http://quran.ksu.edu.sa/ayat/mp3/Hudhaify_64kbps/001001.mp3";
//
export const getTafsirUri = ({ author, sura, aya }) =>
  `http://quran.ksu.edu.sa/interface.php?ui=mobile&do=tafsir&author=${
    author ? author : "sa3dy"
  }&sura=${sura}&aya=${aya}`;

export const getTarjama = ({ tarjama, b_sura, b_aya, e_sura, e_aya }) =>
  `http://quran.ksu.edu.sa/interface.php?ui=mobile&do=tarjama&tafsir=${
    tarjama ? tarjama : "ar_muyassar"
   }&b_sura=${b_sura}&b_aya=${b_aya}&e_sura=${e_sura}&e_aya=${e_aya}`;
export const loadDBTarajem = db =>
  `http://quran.ksu.edu.sa/ayat/resources/tarajem/${db}.ayt`;
export const loadDBTafsir = db =>
  `http://quran.ksu.edu.sa/ayat/resources/tafasir/${db}.ayt`;

/*
fetch('https://smmry.com/')
    .then((resp) => resp.text())
    .then(function (data) {         
    })

*/