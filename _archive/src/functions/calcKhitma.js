//import suraSafha getAyatBySuraAya
import React, { Component } from "react";
import { ScreenAya } from "../../component";
export const calcKhitma = (juz, day, res) => {
  let resaultKhitma = [];
  if (day) resaultKhitma.day = parseInt(day);
  if (juz) resaultKhitma.juzPlay = parseInt(juz);
  // console.log('juz_day', resaultKhitma.juzPlay, resaultKhitma.day)
  if (!res)
    res = startKhitma(resaultKhitma.juzPlay, parseInt(resaultKhitma.day));

  resaultKhitma = res;
  // //console.info(res);
  let [sura, aya] = QuranData.HizbQaurter[res.playRob3];
resaultKhitma.werd =  res.text;
  
  resaultKhitma.starSura = QuranData.Sura[sura][lngS];
  resaultKhitma.starAya = aya;

resaultKhitma.starPage = _lang["enterPageNum"] + ": " + suraSafha(sura, aya);
 resaultKhitma.starText = getAyatBySuraAya({ aya: parseInt(aya), sura: parseInt(sura) }).text;
  
    resaultKhitma.alarm = {
    aya: parseInt(aya),
    sura: parseInt(sura),
    page: suraSafha(sura, aya),

  };
  let txtWerd = _lang["kemWerd"] + "\n" + res.text + "\n________\n";
  txtWerd += _lang["txtFromAya"] + ":\n(";
  txtWerd +=
    getAyatBySuraAya({ aya: parseInt(aya), sura: parseInt(sura) })[3] +
    "\n ... \n";
  txtWerd +=
    _lang["sura_s"] +
    " " +
    QuranData.Sura[sura][lngS] +
    ", " +
    _lang["aya"] +
    " " +
    aya +
    ", ";
  txtWerd +=
    _lang["enterPageNum"] + ": " + suraSafha(sura, aya) + "\n________\n";
  txtWerd += _lang["txtToAya"] + ":\n(";
  ////end play

  resaultKhitma.txtFrom = txtWerd;
  resaultKhitma.txtWerd = txtWerd;
  ////
  ay_su = QuranData.HizbQaurter[res.endRob3];
  if (!ay_su) return false;
  aya = ay_su[1];
  sura = ay_su[0];

  txtWerd +=
    getAyatBySuraAya({ aya: parseInt(aya), sura: parseInt(sura) })[3] +
    "\n ... \n";
  txtWerd +=
    _lang["sura_s"] +
    " " +
    QuranData.Sura[sura][lngS] +
    ", " +
    _lang["aya"] +
    " " +
    aya +
    ", ";
  txtWerd += _lang["enterPageNum"] + ": " + suraSafha(sura, aya);
  resaultKhitma.to =  {aya,sura:QuranData.Sura[sura][lngS],
                         page:_lang["enterPageNum"] + ": " + suraSafha(sura, aya),
                        text:getAyatBySuraAya({ aya: parseInt(aya), sura: parseInt(sura) })[3],
                       }
  resaultKhitma.textFull = txtWerd;
  
  resaultKhitma.endSura = QuranData.Sura[sura][lngS];;
  resaultKhitma.endAya = aya;
resaultKhitma.endPage = _lang["enterPageNum"] + ": " + suraSafha(sura, aya);
 resaultKhitma.endText = getAyatBySuraAya({ aya: parseInt(aya), sura: parseInt(sura) }).text;
  
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
  const juzText = _lang["juzKhitma"][juz]; //?_lang["juzKhitma"][juz]:"";
  const rob3Text = _lang["rob3Khitma"][rob3]; //?_lang["rob3Khitma"][rob3]:"";
  const and = juz == 0 || rob3 == 0 ? "" : " " + _lang["and"] + " ";
  const text = juzText + and + rob3Text;
  const playRob3 = parseInt(playJuz) * 8;
  return {
    juz,
    rob3,
    rob3Day,
    text,
    playRob3: playRob3 ? playRob3 : 1,
    endRob3:
      parseInt(playRob3 + rob3Day) < 240 ? parseInt(playRob3 + rob3Day) : 240,
    day,
    playJuz
  };
  //console.log("juz=" + juz, "rob3=" + rob3)
};
