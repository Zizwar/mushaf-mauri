import { WARSH/*, HAFS, TAJWEED */} from "../amaken";
import { hlMeta } from "./hlmeta";
import { Dimensions } from "react-native";
import { aya2id } from "../functions";
let scrW_mosshaf = Dimensions.get("window").width+20;



export const amakenPage = (page, mosshaf) => {
  let currMosshaf = mosshaf;
  let quira;
  if (!currMosshaf) currMosshaf = "warsh"; //defult HAFS
/*
  switch (currMosshaf) {
    case "tajweed":
      quira = TAJWEED;
      break;
    case "warsh":
      quira = WARSH;
      break;
    case "hafs":
      quira = HAFS;
      break;
    default:
      quira = WARSH; //def HAFS
  }
*/
  const amaken = WARSH[page]
  let hilite_id = "_winoId_";
  //logz("FN drawHilites")

  //  let amaken = json;//hilites[currMosshaf][page];
  // //logz("amaken", amaken)
  let sura,
    aya,
    top,
    left,
    prev_top,
    prev_left,
    mgwidth,
    mgheight,
    twidth,
    ofwidth,
    ofheight,
    fasel_sura,
    page_top,
    page_sura_top,
    width,
    height,
    diff,
    hl_id,
    //hilite_id,
    b_top = 0,
    b_left = 0;
  height = hlMeta[currMosshaf]["height"];
  mgwidth = hlMeta[currMosshaf]["mgwidth"];
  twidth = hlMeta[currMosshaf]["twidth"];
  ofwidth = hlMeta[currMosshaf]["ofwidth"];
  ofheight = hlMeta[currMosshaf]["ofheight"];
  fasel_sura = hlMeta[currMosshaf]["fasel_sura"];
  page_top = hlMeta[currMosshaf]["page_top"];
  page_sura_top = hlMeta[currMosshaf]["page_sura_top"];
  //  //logz("page_sura_top", page_sura_top);
  if (page == 1 || page == 2) {
    height = hlMeta[currMosshaf]["fp_height"];
    mgwidth = hlMeta[currMosshaf]["fp_mgwidth"];
    twidth = hlMeta[currMosshaf]["fp_twidth"];
    ofwidth = hlMeta[currMosshaf]["fp_ofwidth"];
    ofheight = hlMeta[currMosshaf]["fp_ofheight"];
  }
  prev_top = null;
  prev_left = null;
  let count = 1;
  let winotafssir = [];
  let allPosition = [];
  for (let i in amaken) {
    // //logz("play forEach")
    //    _.forEach(amaken, function(value,i) {
    //  //logz("forEach" + i)
    //
    sura = i.split("_")[0];
    aya = i.split("_")[1];
    top = amaken[sura + "_" + aya][1] - ofheight;
    left = amaken[sura + "_" + aya][0] - ofwidth;
    let wino_ = {
      aya: aya,
      sura: sura,
      page: page,
      id: aya2id({ sura, aya }) //"s"+sura+"a"+aya+"z"
    };

    //  //logz('coneten = ',wino.tafssir[page][sura + "_" + aya],sura + "_" + aya)
    //if (itm[1] === sura && itm[2] === aya){

    //   //logz('foreach tafsir, _____',winotafssir,"")
    //  //logz("left =",left,"___",
    //  "top =",top,"___|||||")
    //  if (currMosshaf == "hafs" && (page == 1 || page == 2)) { }
    width = 0;

    hl_id = "s" + sura + "a" + aya + "z";
    if (count == 1) {
      prev_left = twidth;
      if (page == 1 || page == 2) {
        prev_top = 270;
      } else {
        if (aya == 1) {
          prev_top = page_sura_top;
        } else {
          prev_top = page_top;
        }
      }
    } else {
      if (aya == 1) {
        prev_top += fasel_sura;
        prev_left = twidth;
      }
    }
    diff = top - prev_top;
    if (diff > height * 1.6) {
      allPosition.push(
        hl_draw(
          hl_id + "_1",
          prev_top,
          mgwidth,
          prev_left - mgwidth,
          height,
          b_top,
          b_left,
          wino_ //.id+"d_1"
        )
      );
      allPosition.push(
        hl_draw(
          hl_id + "_2",
          top,
          left,
          twidth - left,
          height,
          b_top,
          b_left,
          wino_ //_.id+ "_2"
        )
      );
      allPosition.push(
        hl_draw(
          hl_id + "_3",
          prev_top + height,
          mgwidth,
          twidth - mgwidth,
          diff - height,
          b_top,
          b_left,
          wino_ //id +"_3"
        )
      );
    } else if (diff > height * 0.6) {
      allPosition.push(
        hl_draw(
          hl_id + "_1",
          prev_top,
          mgwidth,
          prev_left - mgwidth,
          height,
          b_top,
          b_left,
          wino_ //.id+"d_1"
        )
      );
      allPosition.push(
        hl_draw(
          hl_id + "_2",
          top,
          left,
          twidth - left,
          height,
          b_top,
          b_left,
          wino_ //.id +"_2"
        )
      );
    } else {
      width = prev_left - left;
      allPosition.push(
        hl_draw(hl_id + "_1", top, left, width, height, b_top, b_left, wino_)
      );
    }
    count++;
    prev_top = top;
    prev_left = left;
  }
  return allPosition;
  // wino.tafssir[page] = winotafssir
  //    );//forlodash
};
//

function hl_draw(id, top, left, width, height, b_top = 0, b_left = 0, wino) {
  //  "agr b_top =",b_top,"_______________________");
  //let b_top = 0;
  //let b_left = 0;
  //top = b_top + top;
  //left = b_left + left;
  scrW_mosshaf = scrW_mosshaf +300
  width = ((scrW_mosshaf / 456) * width);
  height = ((scrW_mosshaf / 456) * height);
  left = ((scrW_mosshaf / 456) * left) //+ 2;
  top = ((scrW_mosshaf / 456) * top) //+ 7;

  return { width, height, left, top, wino, id };

  ///creeat composite
}
//
