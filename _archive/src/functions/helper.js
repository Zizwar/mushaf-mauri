import {
  QuranData,
  // ayatJson,
  textwarsh,
  // tarajemMuyassar,
  // indexMuhammadi,
  // indexMadina,
  currentIndex,
} from "../data";

//import { en } from "../../i18n";

import { getTarjama, getTafsirUri } from "../api";
//
const lngS = (lang) => (lang === "ar" ? 0 : lang === "amz" ? 1 : 2);
const isQuira = (arg) => (arg ? global.quira === arg : global.quira);
//
const currentPage = (page) => (isQuira("warsh") ? page - 1 : page);
//
class CurrentIndex {
  get arrayIndex() {
    const { madina, warsh } = currentIndex;
    return isQuira("warsh") ? warsh : madina;
  }
}
const CurrentIndexArray = new CurrentIndex();
export const paddingSuraAya = ({ sura, aya }) => {
  if (isQuira("warsh")) {
    switch (sura) {
      case 2:
        aya++;
        break;

      default:
        break;
    }
  }

  return padding(sura) + padding(aya);
};
export const padding = (aya) => {
  aya = aya + "";
  if (aya.length < 2) return "00" + aya;
  else if (aya.length < 3) {
    return "0" + aya;
  }
  return aya;
};
export const getNameBySura = ({ sura, lang = "ar" }) => {
  const allSuwar_ = allSuwar(lang);
  const suwar = allSuwar_.find((dt = []) => dt.id === parseInt(sura));
  return suwar ? suwar.name : "";
};
export const aya2id = ({ sura, aya }, full) => {
  const [id = 1, page = 1] =
    CurrentIndexArray.arrayIndex.filter(
      ([, , s, a]) => s === sura && a === aya
    )[0] || [];

  return full ? { id, page, sura, aya } : id;
};

export const id2aya = (id_, numeric) => {
  const [id, page, sura, aya] =
    CurrentIndexArray.arrayIndex.filter(([i, p, s, a]) => i === id_)[0] || [];
  return numeric
    ? padding(sura) + "" + padding(aya)
    : { id, page: currentPage(page), sura, aya }; //sura + "_" + aya;
};
export const nextAya = ({ sura, aya }) => {
  let [id] =
    CurrentIndexArray.arrayIndex.filter(
      ([i, p, s, a]) => s === sura && a === aya
    )[0] || [];
  id++;
  if (id > 6214) id = 1;
  let page;
  [id, page, sura, aya] =
    CurrentIndexArray.arrayIndex.filter(([i, p, s, a]) => i === id)[0] || [];
  console.log("next Aya", { id, sura, aya, page: currentPage(page) });
  return {
    id,
    sura,
    aya,
    page: currentPage(page),
  };
  /*
  const sura_ayat = QuranData.Sura[sura][1];
  if (++aya > sura_ayat) {
    sura = parseInt(sura) + 1;
    aya = 1;
  }
  if (sura > 114) {
    sura = 1;
    aya = 1;
  }

  const page = getPageBySuraAya({ aya, sura });
  console.log("=>next aya", { page, sura, aya });
  return { sura, aya, page };
  */
};

export const prevAya = ({ sura, aya }) => {
  let [id] =
    CurrentIndexArray.arrayIndex.filter(
      ([i, p, s, a]) => s === sura && a === aya
    )[0] || [];
  id--;
  if (id < 1) id = 6214;
  let page;
  [id, page, sura, aya] =
    CurrentIndexArray.arrayIndex.filter(([i, p, s, a]) => i === id)[0] || [];
  console.log("next prev", { id, sura, aya, page });
  return {
    id,
    sura,
    aya,
    page: currentPage(page),
  };
  //
  /*
  const sura_ayat = QuranData.Sura[sura][1];

  if (--aya > sura_ayat) {
    sura = sura - 1;
    aya = 1;
  }
  if (sura > 114) {
    sura = 1;
    aya = 1;
  }
  if (sura < 1) {
    sura = 1;
    aya = 1;
  }
  if (aya == 0) {
    sura = sura - 1;
    aya = QuranData.Sura[sura][1];
  }
  if (sura == 0) {
    sura = 1;
    aya = 1; //QuranData.Sura[sura][1]
  }
  const page = getPageBySuraAya({ aya, sura });
  

  return {
    sura,
    aya,
    page,
  };
  */
};
export const getMm = (millis) => {
  const totalSeconds = millis / 1000;
  const seconds = Math.floor(totalSeconds % 60);
  const minutes = Math.floor(totalSeconds / 60);

  const padWithZero = (number) => {
    const string = number.toString();
    if (number < 10) {
      return "0" + string;
    }
    return string;
  };
  return padWithZero(minutes) + ":" + padWithZero(seconds);
};
///
export const searchAyatByText = (txt) => {
  const resaults = [];

  textwarsh.forEach(([text, textNotTashkil = ""], id = 0) => {
    //   console.log({text, textNotTashkil})
    if (textNotTashkil.includes(txt)) {
      const { page = 1, sura = 1, aya = 1 } = id2aya(id + 1);

      resaults.push({
        id,
        sura,
        aya,
        text,
        page,
      });
    }
  });
  // console.log({resaults})
  return resaults;
};
export const getAyatBySuraAya = ({ aya, sura }) => {
  const { id, page } = aya2id({ aya, sura }, true);
  const text = textwarsh[id - 1][0];
  console.log({ id, page, text });
  return { id, sura, aya, text, textNoT: text, page };
  //
  /*
  ayatJson
    .filter((itm) =>
      parseInt(sura) == itm[1] && parseInt(aya) == itm[2] ? true : false
    )
    .map((el) => ({
      id: el[0],
      sura: el[1],
      aya: el[2],
      text: el[3],
      textNoT: el[4],
      page: parseInt(el[5]),
    }))[0];
    */
};
//
const page_key = "Page_warsh"; //"Page";
export const getPageBySuraAya = ({ sura, aya }) => {
  const page = CurrentIndexArray.arrayIndex.filter(
    ([i, p, s, a]) => s === sura && a === aya
  )[0][1];
  return currentPage(page);
  //this page
  /*
  const n = QuranData[page_key].length;
  if (aya) aya = 1;
  for (let i = 1; i < n; i++) {
    if (
      QuranData[page_key][i][0] > sura ||
      (QuranData[page_key][i][0] == sura && QuranData[page_key][i][1] >= aya)
    ) {
      if (
        QuranData[page_key][i][0] == sura &&
        QuranData[page_key][i][1] == aya
      ) {
        return parseInt(i);
      }
      return parseInt(i) - 1;
    }
  }
  */
};
export const allSuwar = (a) => {
  let i = 1; // a ? 3 : 1;
  const min = 114; //a ? a : 114;
  let surLoop = [];

  for (i; i <= min; i++) {
    //	if(!a)
    surLoop.push({
      id: i,
      name: QuranData.Sura[i][lngS(a)],
      makan: QuranData.Sura[i][3],
    });
    //	else surLoop.push({ id: i});
  }
  ///
  //	//console.info(surLoop[1])
  return surLoop;
};
export const getAllAyaSuraBySura = (sura) => {
  //console.log("==============>",CurrentIndexArray.arrayIndex)

  const ayat =
    CurrentIndexArray.arrayIndex
      .filter(([i, p, s, a]) => s === sura)
      .map(([i], index) => index + 1) || [];
  //console.log({ayat})
  return ayat || [];
  ///
  const numberAllAya = QuranData.Sura[sura][1];
  let id = 1;
  let ayaLoop = [];
  for (id; id <= numberAllAya; id++) {
    ayaLoop.push(id);
  }
  return ayaLoop;
};

export const pageToSuraAya = (page) => {
  const [, , sura, aya] =
    CurrentIndexArray.arrayIndex.filter(
      ([i, p, s, a]) => p === currentPage(page)
    )[0] || [];
  /*
  const sa = QuranData.Page[page];
  if (!sa) return { sura: 1, aya: 1 };
  const sura = sa[0];
  const aya = sa[1];
  */
  if (sura) return { sura, aya };
  else return { sura: 1, aya: 1 };
};
//export const storAyat = {ayat:new Collection('@ayat:store'),record:new Collection('@record:store')}
//const OtherStore = new Collection('@other:store')

//import getAyatBySuraAya getAyatBySuraAya

export const calcKhitma = ({ juz, day, res, lang, _lang }) => {
  let resaultKhitma = [];
  if (day) resaultKhitma.day = parseInt(day);
  if (juz) resaultKhitma.juzPlay = parseInt(juz - 1);
  // console.log('juz_day', resaultKhitma.juzPlay, resaultKhitma.day)
  if (!res) res = starKhitma(resaultKhitma.juzPlay, resaultKhitma.day);
  resaultKhitma = res;
  // //console.info(res);
  let [sura, aya] = QuranData.HizbQaurter[res.playRob3];

  resaultKhitma.starSura = sura;
  resaultKhitma.starAya = aya;
  resaultKhitma.alarm = {
    aya,
    sura,
  };
  let txtWerd = ""; //_lang["txtFromAya"] + ":\n(";
  //   _lang["kemWerd"] + "\n" + res.text + "\n________\n";
  //txtWerd += en["txtFromAya"] + ":\n(";
  const txtStarWerd = getAyatBySuraAya({
    aya: parseInt(aya),
    sura: parseInt(sura),
  }).text;
  resaultKhitma.txtStarWerd = txtStarWerd;
  txtWerd += txtStarWerd + "\n ... \n";
  txtWerd +=
    _lang["sura_s"] +
    " " +
    QuranData.Sura[sura][lngS(lang)] +
    ", " +
    _lang["aya"] +
    " " +
    aya +
    ", ";
  const starPage = getPageBySuraAya({ sura, aya });
  txtWerd += _lang["enterPageNum"] + starPage + "\n________\n";
  txtWerd += _lang["txtToAya"] + ":\n(";
  // resaultKhitma.txtFrom = txtWerd;
  //resaultKhitma.txtWerd = txtWerd;
  const ay_su = QuranData.HizbQaurter[res.endRob3];
  if (!ay_su) return false;
  aya = ay_su[1];
  sura = ay_su[0];
  resaultKhitma.endSura = sura;
  resaultKhitma.endAya = aya;
  const txtEndWerd = getAyatBySuraAya({
    aya: parseInt(aya),
    sura: parseInt(sura),
  }).text;

  resaultKhitma.txtEndWerd = txtEndWerd;

  txtWerd += txtEndWerd + "\n ... \n";
  txtWerd +=
    _lang["sura_s"] +
    " " +
    QuranData.Sura[sura][lngS(lang)] +
    ", " +
    _lang["aya"] +
    " " +
    aya +
    ", ";
  const endPage = getPageBySuraAya({ sura, aya });
  txtWerd += _lang["enterPageNum"] + ": " + endPage;
  resaultKhitma.endPage = resaultKhitma.textFull = txtWerd;
  console.log({ resaultKhitma });
  return resaultKhitma;
};
export const starKhitma = (playJuz, day) => {
  //var playJuz = 1
  //var day = 30;
  //
  const rob3Total = 240 - (playJuz - 1) * 8;
  const rob3Day = parseInt(rob3Total / day);
  const juz_ = rob3Day / 8;
  const juz = parseInt(juz_);
  let rob3 = 0;
  if (juz_ - juz !== 0) {
    rob3 = parseInt((juz_ - juz) * 8);
  }
  if (rob3 == 0 && juz == 0) rob3 = 1;
  //   const juzText = _lang["juzKhitma"] + juz; //?"juzKhitma"[juz]:"";
  //   const rob3Text = _lang["rob3Khitma"] + rob3; //?"rob3Khitma"[rob3]:"";
  //   const and = juz == 0 || rob3 == 0 ? "" : " " + "and" + " ";
  //   const text = juzText + and + rob3Text;
  const playRob3 = parseInt(playJuz) * 8;
  return {
    juz,
    rob3,
    rob3Day,
    // text,
    playRob3: playRob3 ? playRob3 : 1,
    endRob3:
      parseInt(playRob3 + rob3Day) < 240 ? parseInt(playRob3 + rob3Day) : 240,
    day,
    playJuz,
    selection: 1,
    ok: true,
  };
  //console.log("juz=" + juz, "rob3=" + rob3)
};
export const tarajem = ({ sura, aya, tarjama }, cb) => {
  const { sura: e_sura, aya: e_aya } = nextAya({ aya, sura });
  const url = getTarjama({ tarjama, b_sura: sura, b_aya: aya, e_aya, e_sura });
  //console.log("tarajem", { url });
  fetchJSON(url).then((data) => {
    const arrSuraAya = `${sura}_${aya}`;

    const text = data["tafsir"][arrSuraAya]["text"];
    //console.log({ data, text });
    //text ? text : null;
    cb(text || null);
    /*
    const text = data.substring(data.indexOf('":"') + 3 , data.indexOf('"}'));
    console.log({ data, text });
    return text.indexOf("tafsir") ? null : text;
    */
  });
  /*
  const page = getAyatBySuraAya({ sura, aya }).page;
  const arrSuraAya = `${sura}_${aya}`;
  const itemTafsir = tarajemMuyassar[page];
  if (!itemTafsir) return null;
  const text = tarajemMuyassar[page][arrSuraAya];
  return text ? text : null;
  */
};

export const getJuzBySuraAya = ({ sura, aya = 1 }) => {
  const n = QuranData.Juz.length;

  for (let i = 1; i < n; i++) {
    if (
      QuranData.Juz[i][0] > sura ||
      (QuranData.Juz[i][0] == sura && QuranData.Juz[i][1] >= aya)
    ) {
      if (QuranData.Juz[i][0] == sura && QuranData.Juz[i][1] == aya) {
        return i;
      }
      return i - 1;
    }
  }
};
export const getHizbBySuraAya = ({ sura, aya = 1 }) => {
  const n = QuranData.HizbQaurter.length;
  for (let i = 1; i < n; i++) {
    if (
      QuranData.HizbQaurter[i][0] > sura ||
      (QuranData.HizbQaurter[i][0] == sura &&
        QuranData.HizbQaurter[i][1] >= aya)
    ) {
      if (
        QuranData.HizbQaurter[i][0] == sura &&
        QuranData.HizbQaurter[i][1] == aya
      ) {
        return i;
      }
      return i - 1;
    }
  }
};

export const range = (start, end) => {
  let foo = [];
  let i;
  for (i = start; i <= end; i++) {
    foo.push(i);
  }
  return foo;
};

export const fetchJSON = (url) =>
  fetch(url)
    .then((response) => response.json())
    .catch((err) => alert(err));

export const fetchText = (url) =>
  fetch(url).then((response) => response.text());
export const wait = (ms = 200) =>
  new Promise((resolve) => setTimeout(resolve, ms));
