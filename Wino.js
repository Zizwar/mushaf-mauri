import React, { Component } from "react";
import {
    
  Dimensions,
  Image,
  ActivityIndicator,
  TouchableNativeFeedback,
  StyleSheet,
  findNodeHandle,
  NativeModules,
  StatusBar,
  ScrollView,
  SafeAreaView,
  Vibration,
  Animated,
  ImageBackground,
} from "react-native";
import * as ScreenOrientation from "expo-screen-orientation";
import { activateKeepAwake, deactivateKeepAwake } from "expo-keep-awake"; //wino permission

import { Audio } from "expo-av";
import { isRTL } from "expo-localization";

import {
  Toast,
  Button,
  Badge,
  Container,
  View,
  Text,
  Content,
  Item,
  Left,
  // Icon,
} from "native-base";
import { connect } from "react-redux";

import { Popover } from "react-native-modal-popover";
//import Popover, { Rect } from "react-native-popover-view";
//import Icon from "react-native-vector-icons/Ionicons";
//import Swiper from "./src/node/Swipino";
import Swiper from "react-native-swiper";
import * as langs from "./i18n";
import {
  coordinatePage,
  paddingAya,
  nextAya,
  prevAya,
  getAyatBySuraAya,
  getPageBySuraAya,
  pageToSuraAya,
  tarajem,
  getNameBySura,
  getJuzBySuraAya,
  dbs,
} from "./src/functions";
import { getAudioMoqriUri } from "./src/api";
//import { Asset } from "expo-asset";

//const SOURCE_ASSETS_IMAGE = Asset.fromModule(require("./assets/wino23.png")).uri;
//console.log("==>>>>",{SOURCE_ASSETS_IMAGE})
//setTimeout(()=>console.log("==TT>>>>",{SOURCE_ASSETS_IMAGE}),10000)

//
import {
  setExactAya,
  reRender,
  setBookmarks,
  addBookmarks,
  setPlayer,
  setRepeat,
  setTheme,
  setTarjama,
} from "./reducer";
//

import { ButtonPopOverCard, Icon } from "./src/component";
import Modalino from "./src/component/modalino";
import AddNote from "./src/component/addNote";
import Tarajem from "./src/screens/Tarajem";
import Tafsir from "./src/screens/Tafsir";
import Author from "./src/screens/Author";
import First from "./src/screens/First";
import Menu from "./src/screens/Menu";

//
import { requirePages } from "./src/data/";
//
const Toasti = (text) =>
  Toast.show({
    text,
    type: "success",
    duration: 3000,
  });
const { width, height } = Dimensions.get("window");

const MARGIN_PAGE = 55;
const MARGIN_PAGE_WIDTH = 5;

//const heightScala = (HEIGH_PAGE - MARGIN_PAGE) * (width / WIDTH_PAGE);
const heightScala = width * 1.471676300578035 - MARGIN_PAGE_WIDTH;
//

const NUMBER_PAGE = 638;
const MINIMAL_PAGE_RENDER = 25; //8;
const SWIPE_horizontal = true;
const currentPage = (p) => NUMBER_PAGE - p || 0;
const suraAya2id = ({ sura, aya }) => `s${sura}a${aya}z`;
//
const THEMES = [
  { backgroundColor: "#ccc", color: "#000", night: true }, //night
  { backgroundColor: "#fff", color: "#000" }, //sandart
  { backgroundColor: "#fffcd9", color: "#000" },
  { backgroundColor: "#e8f7fe", color: "#000" },

  { backgroundColor: "#e7f7ec", color: "#000" },
];

class Wino extends Component {
  constructor(props) {
    super(props);
    //tray
    this.isHidden = true;
    this.isHiddenSearch = true;
    this.toValue = 250;
    this.bookmarksPage = [];
    this.state = {
      openTool: false,
      repeat: 1,
      isRepeat: false,
      bounceValue: new Animated.Value(this.toValue,{useNativeDriver: true}),
      //modallvisible
      visibleAddNote: false,
      isFaves: false,
      menuSercl: true,
      vi: [], //[...Array(NUMBER_PAGE).keys()]
      searchText: "",
      searchTextOk: false,
      // index: SWIPE_horizontal ? NUMBER_PAGE - 1 : 0,
      visibleModalTafsir: false,
      visibleModalTarjama: false,
      visibleModalMenu: false,
      visibleModalAuthor: false,
      visibleModalPopOver: false,

      visibleModalSearch: false,
      ///popOver
      showPopover: false,
      popoverAnchor: { x: 0, y: 0, width: 0, height: 0 },
      dataPopOver: null,
      isPlaying: false,
      //tafsir tarajem
      textTarajem: "",
      bounceValueHeader: new Animated.Value(-150,{useNativeDriver: true}),
      positionPage: [],
    };

    this.theme = 0;

    this.audioPlayer = new Audio.Sound();

    this.lastIndex = 1; //NUMBER_PAGE-1;
    this.prevIndex = 0;
    this.index = NUMBER_PAGE - 1;
    this.pages = [];
    this.swipTo = 0;
    this.id2index = [];
    this.refs.swiper = null;
    // this.scrollTo = this.scrollTo.bind(this);
    this.wino = { sura: 1, aya: 1, page: 1 };
    this.lang = langs[this.props.lang];
    this.repeat = 1;
    this.currentId = 1;
    this.existPage = 0;
    this.listScrollPage = [];
    //this.prorate = this.props.prorate?0.7:1;
  }
  /*
    componentWillMount() {
      const { prorate } = this.props;
      if (prorate) this.prorate();
      console.log("WORKING...");
      let vi = [];
      let i = 1;
      for (;;) {
        if (i > NUMBER_PAGE) break;
        vi.push({
          id: i,
        });
        i++;
      }
      // vi.push({
      //   id: 1
      // });
      if (SWIPE_horizontal) this.setState({ vi: vi.reverse() });
      else this.setState({ vi });
  
      //  await this.audioPlayer.setAudioModeAsync({staysActiveInBackground :true});
      // this.scrollTo(1)
    }
    */

  async UNSAFE_componentWillMount() {
    const { quira, awk, wino: winos, prorate, bookmarks } = this.props;
    this.bookmarksPage = bookmarks.map((d) => d && d.page);
    this.setAwk(awk);
    //if (prorate) await this.prorate();
    console.log("WORKING...");
    let vi = [];
    let id = NUMBER_PAGE;
    for (;;) {
      if (1 > id) break;
      this.listScrollPage.push({ id });
      vi.push({
        id,
      });
      id--;
    }
    // vi.push({
    //   id: 1
    // });
    if (SWIPE_horizontal) this.setState({ vi: vi.reverse() });
    else this.setState({ vi });

    const wino = winos.sura ? winos : this.wino;

    this.existPage = this.isExistPage(quira);
    console.log(
      "++++this is exist page =>" + this.existPage,
      "quira=>" + quira
    );
    //this.scrollTo(1);
    //setTimeout(_ => this.selectFullAya(wino), 1);
    const page = wino.page || getPageBySuraAya(wino);
    const positionPage = this.id2index[Number(page)];
    this.setState({ positionPage });
    //this.selectFullAya({aya:1,sura:1})
    await this.intialDBTarajem();
    //await wait();
    this.selectFullAya(wino);
    //setExactAya(wino);
  }
  //
  componentDidUpdate() {
    const {
      rerender,
      player,
      setPlayer,
      wino,
      reRender,
      bookmarks,
      lang,
    } = this.props;
    if (!rerender) return;
    if (rerender === "switchLang") this.lang = langs[lang];
    if (rerender === "bookmarks") {
      this.bookmarksPage = bookmarks.map((d) => d && d.page);

      reRender(false);
      const isFaves = this.bookmarksPage.includes(page);
      // console.log({ isFaves });
      this.setState({ isFaves });
      return;
    }
    if (rerender === "tarajem") {
      reRender(false);
      this.toglTray("open");
      return;
    }
    if (player) {
      //this.props.reRender(false);
      setPlayer(false);
      switch (player) {
        case "play":
          this.selectFullAya(wino);
          setTimeout((_) => this.buildPlayAudio(null, true), 100);
          break;
        case "stop":
          this.playSound(false);
          return;

        //
      }
    }

    reRender(false);
    const wino_ = this.wino;
    if (wino && wino_)
      if (wino.aya === wino_.aya && wino.sura === wino_.sura) return;

    let page = wino.page ? wino.page : getPageBySuraAya(wino);
    let positionPage = this.id2index[+page];
    this.setState({ positionPage });

    //     console.log(
    //       wino.aya,
    //       "<<  YES RENDER prop this RE_RENDER Local==",
    //       wino_.aya
    //     );

    this.selectFullAya(wino);
    // this.setExactAya(this.props.wino);
  }
  async intialDBTarajem() {
    const { tarjama } = this.props;
    this.dbs = new dbs(tarjama);
    await this.dbs.connect();
    console.log("connect db tarjama");
    // await this.setTarjama()
  }
  prorate = async (_) =>
    await ScreenOrientation.lockAsync(
      ScreenOrientation.OrientationLock.LANDSCAPE_LEFT
    );
  // await ScreenOrientation.allowAsync(ScreenOrientation.Orientation.LANDSCAPE);

  setAwk = (bel) => {
    if (bel) activateKeepAwake();
    else deactivateKeepAwake();
  };
  setRepeat = () => {
    let { repeat } = this.state;
    let isRepeat = false;
    repeat = repeat === 3 ? 1 : repeat + 1;
    if (repeat > 1) isRepeat = true;

    this.setState({ repeat, isRepeat });
  };
  isExistPage = (quira) => {
    const { downloadsWarsh } = this.props;

    switch (quira) {
      case "warsh":
        return downloadsWarsh;
      default:
        return 0;
    }
  };
  //MEdia
  playSound = async (uri) => {
    console.log({ uri });
    this.setState({ loadingSound: uri });
    //setTimeout(_=>((this.state.loadingSound === uri )&& this.playSound(loadingSound),9000));
    try {
      await this.audioPlayer.unloadAsync();
      if (!uri) {
        this.setState({
          isPlaying: false,
        });
        return;
      }
      await this.audioPlayer.loadAsync({
        uri,
      });
      await this.audioPlayer.playAsync();

      this.audioPlayer.setOnPlaybackStatusUpdate(
        this._setOnPlaybackStatusUpdate
      );
      this.setState({
        isPlaying: true,
        loadingSound: false,
        // openTool:true,
      });
    } catch (error) {
      console.log(error);
    }
  };
  //
  _setOnPlaybackStatusUpdate = (status) => {
    //this.setState({loadingSound:status.isPlaying})
    if (status.didJustFinish) {
      this.playNextAya(true);
      return;
    }
    if (status.error) alert(`PLAYER ERROR: ${status.error}`);
  };
  ///
  buildPlayAudio = (wino, button) => {
    if (button)
      this.setState({
        openTool: true,
      });
    let sura, aya;
    if (wino) {
      sura = wino.sura;
      aya = wino.aya;
      page = wino.page;
    } else {
      // if()
      sura = this.wino.sura;
      aya = this.wino.aya;
      page = this.wino.page;
    }

    const _id = paddingAya(sura) + paddingAya(aya);
    // const id = aya2id({ sura, aya });
    const path = getAudioMoqriUri({
      moqri: this.props.moqri,
      id: _id,
    });
    if (page) this.scrollTo(page);

    this.playSound(path);
  };
  ///
  itRepeat = () => {
    //console.log("yes repeat");
    const { setRepeat, tekrar, wino, setPlayer } = this.props;
    const { ayaStart, suraStart, ayaEnd, suraEnd, repeat } = tekrar;
    const { isPlaying } = this.state;
    const { sura, aya } = wino;
    if (
      sura > suraEnd ||
      (sura == suraEnd && aya > ayaEnd) ||
      (sura <= suraStart && aya < ayaStart)
    ) {
      Toasti(this.lang["deactivateRepeat"]);
      setRepeat(false);
      this.setState({
        isPlaying: false,
      });
      setPlayer(false);
      this.playSound(false);
      this.repeat = 1;
      return;
    }

    //
    if (this.repeat >= repeat) {
      this.repeat = 1;
      console.log("yes next repeat =", this.repeat);
      const nextAya_ = nextAya({ sura, aya });
      this.props.setExactAya(nextAya_);
      if (isPlaying) this.buildPlayAudio(nextAya_);
    } else {
      this.repeat = this.repeat + 1;
      console.log("yes repeat =", this.repeat);
      if (isPlaying) this.buildPlayAudio({ sura, aya });
    }
  };
  ///
  itRepeatz = () => {
    console.log("yes repeat");

    const { isPlaying, repeat } = this.state;

    //
    if (this.repeat >= repeat) {
      this.repeat = 1;
      console.log("yes next repeat =", this.repeat);
      this.forcePlayNextAya();
    } else {
      this.repeat = this.repeat + 1;
      console.log("yes repeat =", this.repeat);
      if (isPlaying) this.buildPlayAudio(this.wino);
    }
  };
  //
  forcePlayNextAya = () => {
    const {
      //   wino: { sura, aya },
      setExactAya,
    } = this.props;
    const { isPlaying } = this.state;
    const { sura, aya } = nextAya(this.wino);
    setExactAya({ sura, aya });
    if (isPlaying) this.buildPlayAudio({ sura, aya });
  };
  playNextAya = () => {
    const { isRepeat } = this.state;
    if (isRepeat) this.itRepeatz();
    else this.forcePlayNextAya();
  };

  prevAya = () => {
    const { sura, aya } = prevAya(this.wino);
    this.props.setExactAya({ sura, aya });
    if (this.state.isPlaying) this.buildPlayAudio({ sura, aya });
  };
  //end Media
  scrollTo = (num) => {
    if (!this.refs.swiper) {
      return;
    }
    if (!num) return;
    if (num == "prev") {
      this.refs.swiper.scrollBy(this.index--, false);
      return;
    }
    if (num == "next") {
      this.refs.swiper.scrollBy(this.index++, false);
      return;
    }
    if (num > NUMBER_PAGE) num = 1;
    if (num < 1) num = NUMBER_PAGE;
    let index = this.id2index[Number(num)];

    if (index === this.index) return;
    if (!index) index = 0;

    this.currentId = index - this.index;

    this.refs.swiper.scrollBy(this.currentId, false);
  };
  statePage(positionPage) {
    this.setState({ positionPage });
  }

  toglModalTafsir = (togl) => {
    let visibleModalTafsir = !this.state.visibleModalTafsir;
    if (togl === "close") visibleModalTafsir = false;
    if (togl === "open") visibleModalTafsir = true;
    this.setState({ visibleModalTafsir });
  };
  toglShowPopover = (togl) => {
    let showPopover = !this.state.showPopover;
    if (togl === "close") showPopover = false;
    if (togl === "open") showPopover = true;
    this.setState({ showPopover });
  };
  toglModalAuthor = (togl) => {
    let visibleModalAuthor = !this.state.visibleModalAuthor;
    if (togl === "close") visibleModalAuthor = false;
    if (togl === "open") visibleModalAuthor = true;
    this.setState({ visibleModalAuthor });
  };
  toglModalPopOver = (togl) => {
    let visibleModalPopOver = !this.state.visibleModalPopOver;
    if (togl === "close") visibleModalPopOver = false;
    if (togl === "open") visibleModalPopOver = true;
    this.setState({ visibleModalPopOver });
  };
  toglModalMenu = () => {
    this.props.navigation.toggleDrawer();
    return;
  };

  toglModalSearch = (togl, ok) => {
    if (ok && this.state.searchText.length <= 2) {
      alert("main 2 char");
      return;
    }
    let visibleModalSearch = this.state.visibleModalSearch;
    if (togl === "close") visibleModalSearch = false;
    if (togl === "open") visibleModalSearch = true;

    this.setState({
      visibleModalSearch,
    });
  };
  _onIndexChanged = (index) => {
    const page = currentPage(index);
    const isFaves = this.bookmarksPage.includes(page);
    this.index = index;

    this.setState({ positionPage: index, isFaves });
  };

  renderItemPage = ({ id, index }) => {
    const {
      quira,
      lang,
      theme: { color, backgroundColor },
    } = this.props;
    const { positionPage } = this.state;
    this.pages = [];
    this.id2index[id] = index;
    const positions = coordinatePage(id, quira);

    const { aya: ayaF, sura: suraF } = positions[0]
      ? positions[0].wino
      : { aya: 1, sura: 1 }; //first aya
    const hizb = getJuzBySuraAya({ sura: suraF, aya: ayaF });

    let nameSuwarPage = positions.map(({ wino }) => wino.sura);
    nameSuwarPage = [...new Set(nameSuwarPage)].map((sura) =>
      getNameBySura({ sura, lang })
    );

    const source = requirePages[id - 1];
    /* {
      uri: getImagePageUri({
        quira, //this.quraa,
        id,
      }),
    }; // this.getImagePageLocal({ quira, id });
    /*  const uri =   this.existPage >= id
                ? this.getImagePageLocal({ quira, id })
                : getImagePageUri({
                    quira, //this.quraa,
                    id,
                });
                */
    //
    // console.log("linkLocal=>", { uri });

    //const opacity =tmp==="selectAllAya"?0.2:0
    //const path = CacheManager.get(uri).getPath();
    const titleSura = (
      <>
        <Left>
          <Text style={{ textAlign: "left", color, fontSize: 12 }}>
            {lang == "ar"
              ? langs[lang]["juzString"][hizb - 1]
              : `${langs[lang]["juz"]}'${hizb}`}
          </Text>
        </Left>

        <Text style={{ textAlign: "right", color, fontSize: 12 }}>
          {nameSuwarPage.join(",")}
        </Text>
      </>
    );
    const titleSuraRtl = (
      <>
        <Left>
          <Text note style={{ textAlign: "right", color }}>
            {nameSuwarPage.join(",")}
          </Text>
        </Left>
        <Text note style={{ textAlign: "left", color }}>
          {lang == "ar" ? langs[lang]["juzString"][hizb - 1] : `Jus' ${hizb}`}
        </Text>
      </>
    );
    const imagePage = ( //<BlurView tint="dark" intensity={50} >
      <Image
        key={`${id}_${index}`}
        style={{ width: width - MARGIN_PAGE_WIDTH, height: heightScala }}
        resizeMode="stretch"
        source={source}
        //  {...{preview, uri}}
        //tintColor={night ? "#fff" : null}
      />
      //</BlurView>
    );

    return (
      <View key={index + "Vz"} style={{ flex: 1 }}>
        <Item
          transparent
          style={{
            height: 32,
            paddingLeft: 40,
            paddingRight: 40,
            borderColor: backgroundColor,
          }}
        >
          {!isRTL ? titleSura : titleSuraRtl}
        </Item>

        <View
          style={{
            flex: 1,
            //   backgroundColor:"#369",
            alignItems: "center",
            //	position:"absolute",
            //	height: heightScala,
            //   justifyContent: "center"
            backgroundColor,
          }}
          key={index}
        >
          {imagePage}

          {/*
        <View
          style={{
            flex: 1,
            //   backgroundColor:"#369",
            alignItems: "center",
            //	position:"absolute",
            //	height: heightScala,
            //   justifyContent: "center"
            // backgroundColor:"#ff4"
          }}
          key={index}
        >
	
          <Image
            key={id + "_" + index}
            style={{ width: width - MARGIN_PAGE, height: heightScala }}
            // style={{ position:"absolute",left:(MARGIN_PAGE / 2), right:(MARGIN_PAGE / 2), height: heightScala }}

            // resizeMode="contain"
            resizeMode="stretch"
            source={{ uri }}
            //  style={{opacity:this.prorate}}
            //  {...{preview, uri}}
            tintColor={night ? "#fff" : null}
          />
	
		 
  */}
          {positionPage === index &&
            positions.map(({ left, top, height, width, id, wino }, index) => (
              <TouchableNativeFeedback
                //style={{backgroundColor:'#f61',opacity:0.3}}
                //delayLongPress={5}
                //onPress={this.toglMenuDownUp}
                onPress={(_) => this.onLongPressAya({ id, wino })}
                key={`toche${id + index}`}
              >
                <View
                  key={`vto${id + index}`}
                  ref={(t) => {
                    this.pages[id] = { index, t };
                  }}
                  style={[
                    styles.touchAya,
                    this.prevId === `s${wino.sura}a${wino.aya}`
                      ? styles.onPressAya //{ backgroundColor, opacity: 0.1 } //
                      : { opacity: 0.0 }, //styles.onUnPressAya,//
                    !isRTL
                      ? {
                          height,
                          top,
                          left,
                          width,
                        }
                      : {
                          height,
                          top,
                          right: left,
                          width,
                        },
                  ]}
                />
              </TouchableNativeFeedback>
            ))}
          <Text
            note
            style={{
              textAlign: "center",
              color /* postition:"absolute",top:heightScala + MARGIN_PAGE + 24*/,
            }}
          >
            {id}
          </Text>
        </View>
      </View>
    );
  };

  selectFullAya = async (wino, first_) => {
    // this.props.handleMenu("open");
    //alert("id=" +id);
    const id = suraAya2id(wino); //wino.idAya
    //  console.log("select full aya=>", { wino, id });
    const opacity = 0.2;
    const {
      theme: { color: backgroundColor },
    } = this.props; //= "#369";
    //let stylez = !scrol ? styles.onPressAya : styles.onUnPressAya;
    const fid = id.substring(0, id.indexOf("z"));
    const oldId = this.prevId;
    this.prevId = fid;
    if (oldId && oldId !== fid) this.unSelectAya(oldId);
    this.wino = wino;
    //if (scroll) {

    let page = wino.page || getPageBySuraAya(wino);
    if (!page) page = 1;
    //this.statePage(page)
    this.scrollTo(page);
    if (first_) {
      this.props.reRender(true);
      return;
    }

    // }
    setTimeout((_) => {
      const zid = ["z_1", "z_2", "z_3"];

      zid.forEach((itm) => {
        const cid = fid + itm;

        let refs = this.pages[cid];
        if (refs)
          if (refs.t) {
            //console.log("cid=yes =", cid);
            this.pageIndex = refs.index;

            refs.t.setNativeProps({
              style: { backgroundColor, opacity },
            });
          }
      });
    }, 10);

    if (!this.isHidden) await this.setTarjama();
  };
  setTarjama = async () => {
    const {
      wino: { aya, sura },
      tarjama,
    } = this.props;

    const query = `SELECT * FROM ${tarjama} WHERE sura=${sura} and aya=${aya}`;
    //console.log({ query },"dbs=>",this.dbs,"ping=>",this.dbs.ping);
    if (this.dbs.ping) {
      try {
        await this.dbs.execSql(query).then((_array) => {
          // console.log("~~THIS is DB", JSON.stringify(_array));
          if (!_array) return;
          const { text: textTarajem } = _array[0];
          if (textTarajem) this.setState({ textTarajem });
        });
      } catch (err) {
        alert(JSON.stringify(err));
      }
    } else {
      //  console.log("no connect db author=>", tarjama);

      tarajem(
        { aya, sura, tarjama },
        (cb = (textTarajem) => {
          //alert(textTarajem);
          if (textTarajem) this.setState({ textTarajem });
        })
      );
    }
  };
  //
  changeTarjama = async (id) => {
    const { setTarjama } = this.props;
    setTarjama(id);
    await this.intialDBTarajem();
    // this.nextAya();
    // this.prevAya();
  };
  unSelectAya = (id) => {
    const fid = id;
    const opacity = 0.3;
    const backgroundColor = "#369";

    setTimeout((_) => {
      const zid = ["z_1", "z_2", "z_3"];
      zid.forEach((itm) => {
        const cid = fid + itm;
        let refs = this.pages[cid];
        if (refs)
          if (refs.t) {
            refs.t.setNativeProps({
              style: { backgroundColor, opacity },
              disabled: false,
            });
          }
      });
    }, 1);
  };
  toglPlayer = (_) => {
    if (this.state.isPlaying) this.playSound(false);
    else this.buildPlayAudio();
  };
  //

  showPopover(index, wino) {
    //this.selectFullAya(wino);
    const dataPopOver = getAyatBySuraAya(wino);
    this.setState({
      dataPopOver,
      //showPopover: true
    });
    this.toglModalPopOver("open");
    return;
    const handle = findNodeHandle(this.pages[index].t);
    if (handle) {
      NativeModules.UIManager.measure(
        handle,
        (_x0, _y0, width, height, x, y) => {
          this.setState({
            popoverAnchor: { x, y, width, height },
            dataPopOver,
            //  showPopover: true,
          });
        }
      );
    }
  }
  closePopover = () =>
    this.setState({ visibleModalPopOver: false, showPopover: false });
  //
  /*
    addBookmarks = (_) => {
      const { page } = this.wino;
  
      const { bookmarks, setBookmarks } = this.props;
  
      const newData = [...bookmarks];
      if (newData[page]) newData[page] = 0;
      else newData[page] = 1;
      setBookmarks(newData);
    };
    */
  addBookmarks = (rem) => {
    //const wino = this.wino;
    const page = currentPage(this.index);
    const { setBookmarks, bookmarks } = this.props;
    if (rem) {
      const remBookmarks = bookmarks.filter((d) => d.page !== page);
      this.bookmarksPage = remBookmarks.map((d) => d && d.page);
      setBookmarks(remBookmarks);
      const isFaves = this.bookmarksPage.includes(page);
      // console.log("remove", { remBookmarks }, page);
      this.setState({ isFaves });
      return;
    }

    const { sura, aya } = pageToSuraAya(page);

    const d = new Date();
    const h = d.getHours();
    const m = d.getMinutes();
    const time = h + ":" + m;

    const setBookmarksz = [
      ...bookmarks,
      {
        time,
        id: { sura, aya },
        page,
      },
    ];
    this.bookmarksPage = setBookmarksz.map((d) => d && d.page);
    setBookmarks(setBookmarksz);
    const isFaves = this.bookmarksPage.includes(page);
    //console.log({ isFaves });
    this.setState({ isFaves });
    Toasti(this.lang["fav_added"]);

    this.closePopover();
  };
  addNote = (note) => {
    const wino = this.wino;

    const d = new Date();
    const h = d.getHours();
    const m = d.getMinutes();
    const time = h + ":" + m;

    //
    const setBookmarks = [
      ...this.props.bookmarks,
      {
        // img,
        page: null,
        text: getAyatBySuraAya(wino).text,
        note,
        time,
        id: { sura: wino.sura, aya: wino.aya },
      },
    ];
    //
    this.props.setBookmarks(setBookmarks);
    this.closePopover();
    Toasti(this.lang["fav_added"]);
  };
  //
  onLongPressAya = ({ id, wino }) => {
    Vibration.vibrate(5);
    this.props.setExactAya(wino);
    this.showPopover(id, wino); //,2)
  };
  //toggleTray
  toglSearch = (arg) => {
    //return;
    let toValue = -100;
    if (arg == "open") this.isHiddenSearch = true;
    if (arg == "close") this.isHiddenSearch = false;

    if (this.isHiddenSearch) {
      toValue = 25;
    }

    Animated.spring(this.state.bounceValueHeader, {
      toValue: toValue,
      velocity: 3,
      tension: 2,
      friction: 8,
      useNativeDriver: true
    }).start();

    this.isHiddenSearch = !this.isHiddenSearch;
    this.awitino = false;
  };

  toglTray = async (arg) => {
    let toValue = this.toValue;
    if (arg == "open") {
      this.isHidden = true;
      await this.intialDBTarajem();
    }

    if (arg == "close") this.isHidden = false;

    this.setTarjama();

    if (this.isHidden) {
      toValue = 0;
    }
    Animated.spring(this.state.bounceValue, {
      toValue: toValue,
      velocity: 3,
      tension: 2,
      friction: 8,
      useNativeDriver: true
    }).start();
    this.setState({ menuSercl: !this.isHidden });
    this.setState({ visibleModalTarjama: this.isHidden });
    this.isHidden = !this.isHidden;
  };

  /////////////////
  render() {
    const {
      showPopover,
      dataPopOver,
      visibleModalTafsir,
      visibleAddNote,
      textTarajem,
      isPlaying,
      loadingSound,
      visibleModalAuthor,
      visibleModalPopOver,
      bounceValue,
      visibleModalMenu,
      visibleModalTarjama,
      popoverAnchor,
      isFaves,
      openTool,
      repeat,
    } = this.state;
    const {
      wino,
      navigation,
      first,
      theme: { color, backgroundColor },
      setTheme,
      lang,
    } = this.props;
    /*
        const isFaves = (page) => {
          console.log({ bookmarks });
          console.log(bookmarks[page], "-", page);
          return bookmarks[page];
        };
        */

    const changeColor = (index) => {
      if (index) {
        setTheme(THEMES[index - 1]);
        return;
      }
      this.theme++;
      if (this.theme >= THEMES.length - 1) this.theme = 1;
      setTheme(THEMES[this.theme]);
    };
    //menu
    const modalMenu = (
      <Modalino
        data={
          <Menu
            close={(_) => this.toglModalMenu("close")}
            color={color}
            backgroundColor={backgroundColor}
            //  toasti={Toasti}
            navigation={navigation}
            changeColor={changeColor}
            authorModal={this.toglModalAuthor}
          />
        }
        togl={this.toglModalMenu}
        visible={visibleModalMenu}
        // position="down"
        //   disbledSwip={true}
        noSwipe={true}
        // backDrop={true}
        
        style={{
          padding: 10,
          height: 320,
          position: "absolute",
          width: 290,
          left: !isRTL ? (lang === "ar" ? null : 0) : lang === "ar" ? 0 : null,
          right: !isRTL ? (lang === "ar" ? 0 : null) : lang === "ar" ? null : 0,
          top: height - 320,
          // bottom: -5,
          justifyContent: "flex-end",
          margin: 0,
          borderTopLeftRadius: !isRTL
            ? lang == "ar"
              ? 30
              : 0
            : lang == "ar"
            ? 0
            : 30,
          borderTopRightRadius: !isRTL
            ? lang == "ar"
              ? 0
              : 30
            : lang == "ar"
            ? 30
            : 0,
          backgroundColor,
          borderColor: color,
          borderWidth: 1,
        }}
        animationIn={
          !isRTL
            ? lang === "ar"
              ? "slideInRight"
              : "slideInLeft"
            : lang !== "ar"
            ? "slideInLeft"
            : "slideInRight"
        }
        animationOut={
          !isRTL
            ? lang !== "ar"
              ? "slideOutRight"
              : "slideOutLeft"
            : lang !== "ar"
            ? "slideOutLeft"
            : "slideOutRight"
        }
      />
    );
    const addNote = (
      <AddNote
        show={visibleAddNote}
        color={color}
        backgroundColor={backgroundColor}
        note={(note) => {
          this.setState({ visibleAddNote: false });
          this.addNote(note);
        }}
        cancel={(_) => this.setState({ visibleAddNote: false })}
        placeholder={this.lang["note"]}
      />
    );

    const modalTafsir = (
      <Modalino
        togl={this.toglModalTafsir}
        data={<Tafsir togl={this.toglModalTafsir} />}
        visible={visibleModalTafsir}
        //search={this.satee.serach}
        // position="down"
        //noSwipe={true}
        disbledSwip={true}
        //backDrop={true}
        //style={{ paddingLeft: 20, paddingRight: 20, paddingTop: 100 }}
      />
    );
    const modalAuthor = (
      <Modalino
        togl={this.toglModalAuthor}
        data={<Author togl={this.toglModalAuthor} />}
        visible={visibleModalAuthor}
      />
    );
    const modalPopOver = (
      <Modalino
        togl={this.toglModalPopOver}
        style={{ paddingLeft: 10, paddingRight: 10, height:300,    justifyContent: 'center',   backgroundColor: "transparent"}}
        data={
          <ButtonPopOverCard
            lang={this.lang}
            close={this.toglModalPopOver}
            wino={dataPopOver}
            stop={this.playSound}
            play={this.buildPlayAudio}
            navigate={navigation.navigate}
            addBookmarks={this.addBookmarks}
            note={(_) => this.setState({ visibleAddNote: true })}
            toasti={Toasti}
            tarajem={(_) => this.toglTray("open")}
            theme={color,backgroundColor}
          />
        }
        visible={visibleModalPopOver}
      />
    );
    const trayFirst = (
      <View style={styles.subViewFirst}>
        <First />
      </View>
    );

    const tray = (
      <View>
        <Animated.View
          style={[styles.subView, { transform: [{ translateY: bounceValue }] }]}
        >
          <Tarajem
            changeTarjama={this.changeTarjama}
            lang={this.lang}
            prevAya={this.prevAya}
            nextAya={this.playNextAya}
            toglPlayer={this.toglPlayer}
            isPlaying={isPlaying}
            wino={wino}
            text={textTarajem}
            togl={this.toglTray}
            color={color}
            backgroundColor={backgroundColor}
          />
        </Animated.View>
      </View>
    );

    const footerMenu = (
      <View style={styles.footerMenu}>
        {openTool && (
          <Item
            style={{
              position: "absolute",
              bottom: 3,
              alignSelf: "center",
              paddingLeft: 50,
              paddingRight: 50,
              backgroundColor,

              // borderRadius: 8,
              borderColor: color,
              borderWidth: 1,
              borderTopWidth: 1,
              borderBottomWidth: 1,
              borderLeftWidth: 1,
              borderRightWidth: 1,
              shadowColor: "#CCC",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.8,
              shadowRadius: 2,
              elevation: 1,
              marginLeft: 2,
              marginRight: 2,
              marginTop: 3,
            }}
          >
            <Button
              onPress={this.toglPlayer}
              transparent
              style={styles.buttonHeader}
            >
              {loadingSound ? (
                <ActivityIndicator color={color} animating={true} size={16} />
              ) : (
                <Icon
                  style={{ color }}
                  size={26}
                  name={isPlaying ? "ios-pause" : "ios-play"}
                />
              )}
            </Button>
            <Button
              style={styles.buttonHeader}
              transparent
              badge
              onPress={this.setRepeat}
            >
              <Icon style={{ color }} size={30} name="ios-repeat" />
              {
                /*isRepeat &&*/ <Badge
                  style={{ backgroundColor, opacity: 0.5 }}
                >
                  <Text note style={{ color, fontSize: 10 }}>
                    {repeat}
                  </Text>
                </Badge>
              }
            </Button>
            <Button />
            <Button
              onPress={() =>
                this.setState({
                  openTool: false,
                })
              }
              transparent
              style={styles.buttonHeader}
            >
              <Icon style={{ color }} size={20} name="ios-close" />
            </Button>
          </Item>
        )}
      </View>
    );
    const popOver = (
      <Popover
        contentStyle={{
          backgroundColor,
          borderRadius: 8,
          borderColor: color,
          borderWidth: 2,
        }}
        //	backgroundStyle={backgroundColor}
        arrowStyle={{
          borderTopColor: backgroundColor,
          borderColor: color,
          borderWidth: 1,
        }}
        useNativeDriver={true}
        visible={showPopover}
        fromRect={popoverAnchor}
        onClose={this.closePopover}
        // placement="bottom"
        duration={100}
      >
        <ButtonPopOverCard
          lang={this.lang}
          close={this.closePopover}
          wino={dataPopOver}
          stop={this.playSound}
          play={this.buildPlayAudio}
          navigate={navigation.navigate}
          addBookmarks={this.addBookmarks}
          note={(_) => this.setState({ visibleAddNote: true })}
          toasti={Toasti}
          tarajem={(_) => this.toglTray("open")}
          color={color}
          backgroundColor={backgroundColor}
        />
      </Popover>
    );

    if (first)
      return (
        <Container>
          <ImageBackground
            source={require("./assets/splash.png")}
            style={{ flex: 1, width, backgroundColor: "#046f98", height }}
          >
            <View style={{ flex: 1, width, height }}>{trayFirst}</View>
          </ImageBackground>
        </Container>
      );
    return (
      <Container style={{ backgroundColor }}>
        <Content style={{ backgroundColor }}>
          <View style={{ flex: 1, width, height: height - 2 }}>
            <StatusBar
              backgroundColor={backgroundColor}
              barStyle="light-content"
              hidden={true}
            />
            <View
              style={{
                flex: 1,
                position: "absolute",
                left: 0,
                right: 0,
                height: 40,
              }}
              transparent
            >
              <Item
                transparent
                style={{ alignSelf: "center", borderColor: backgroundColor }}
              >
                <Button
                  transparent
                  style={styles.buttonHeader}
                  onPress={() => navigation.navigate("Suras")}
                >
                  <Icon style={{ color }} size={30} name="md-book" />
                </Button>
                <Button
                  transparent
                  style={styles.buttonHeader}
                  onPress={() => navigation.navigate("SearchSmart")}
                >
                  <Icon style={{ color }} size={30} name="md-search" />
                </Button>
                <Button
                  transparent
                  style={[
                    wino.page % 2 !== 0
                      ? { transform: [{ rotateY: "180deg" }] }
                      : null,
                    styles.buttonHeader,
                  ]}
                >
                  <Icon style={{ color }} size={30} name="ios-hand" />
                </Button>
                <Button
                  transparent
                  style={styles.buttonHeader}
                  onPress={(_) => this.addBookmarks(isFaves)}
                >
                  <Icon
                    size={26}
                    style={isFaves ? "#090" : { color }}
                    name={isFaves ? "md-star" : "md-star-outline"}
                  />
                </Button>
                <Button
                  transparent
                  style={styles.buttonHeader}
                  onPress={this.toglModalMenu}
                >
                  <Icon style={{ color }} size={30} name="md-menu" />
                </Button>
                {/*
                <Button
                  transparent
                  style={styles.buttonHeader}
                  onPress={(_) => {
                    const color = !night ? THEMES[0] : THEMES[1];
                    this.theme = !night ? 0 : 1;
                    setTheme(color);
                  }}
                >
                  <Icon
                    style={{ color }}
                    size={26}
                    name={night ? "ios-sunny" : "ios-moon"}
                  />
                </Button>
                */}
              </Item>
            </View>
<SafeAreaView style={{flex: 1}}>
            <ScrollView
            keyboardShouldPersistTaps='handled'
              style={{
                top: MARGIN_PAGE,
                //height,//:height+32,
                position: "absolute",
                right: 0,
                bottom: visibleModalTarjama ? 250 : 0,
                left: 0,
              }}
            >
              <Swiper
                ref="swiper"
                loadMinimal={true}
                loadMinimalSize={MINIMAL_PAGE_RENDER}
                autoplay={false}
                horizontal={SWIPE_horizontal}
                bounces={true}
                showsPagination={false}
                loop={false}
                loadMinimalLoader={
                  <ActivityIndicator size="large" color="#555" />
                }
                // onMomentumScrollEnd={this._onMomentumScrollEnd}
                automaticallyAdjustContentInsets={true}
                onIndexChanged={this._onIndexChanged}
                index={this.index}
                style={{
                  top: 0,
                  position: "relative",
                  right: 0,
                  bottom: 0,
                  left: 0,
                  height: heightScala + MARGIN_PAGE + 24,
                  // backgroundColor:"red",
                }}
                showsHorizontalScrollIndicator={true}
              >
                {this.listScrollPage.map(({ id }, index) =>
                  this.renderItemPage({ id, index })
                )}
              </Swiper>
            </ScrollView>
            </SafeAreaView>
          </View>

          {/*menuSercl && footerDynamic*/}

          {(!visibleModalTarjama || !visibleModalMenu) && footerMenu}
          {addNote}
          {tray}
          {modalTafsir}
          {modalPopOver}
          {modalAuthor}
          {popOver}
        </Content>
        {modalMenu}
      </Container>
    );
  }
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
  },
  horizontal: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 10,
  },
  buttonHeader: { paddingLeft: 15, paddingRight: 15 },

  slide1: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#9DD6EB",
  },

  slide2: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#97CAE5",
  },

  slide3: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#92BBD9",
  },

  text: {
    color: "#fff",
    //fontSize: 30,
    //fontWeight: "bold"
  },
  touchAya: {
    position: "absolute",

    //	borderRadius: 10,
    //borderWidth: 1,

    //borderColor: "#F44",
    //borderLeftWidth: 2,
    //  borderRightWidth: 2,

    shadowColor: "#CCC",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 1,
    marginLeft: 2,
    marginRight: 2,
    marginTop: 3,
  },
  onPressAya: {
    backgroundColor: "#369",
    opacity: 0.2,
  },
  onRecordAya: {
    backgroundColor: "#F44",
    opacity: 0.3,
  },
  onUnPressAya: {
    backgroundColor: "#f44c",
    opacity: 0.3,

    borderWidth: 2,
    borderColor: "blue",
    borderLeftWidth: 4,
    borderRightWidth: 2,
  },
  containerTray: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5FCFF",
    marginTop: 66,
  },

  subView: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF08",
    height: 250,
  },
  subViewFirst: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF08",
    height: 300,
  },
  footerMenu: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    // backgroundColor: "#FFFFFF01",
    height: 32,
    zIndex: 999,
    // opacity:0.0
  },
  subViewHeader: {
    position: "absolute",
    // top: -100,
    left: 50,
    right: 50,
    borderRadius: 25,
    //backgroundColor: "#FFFFFF",
    height: 100,
  },
});
const mapStateToProps = ({
  tarjama,
  awk,
  lang,
  wino,
  rerender,
  moqri,
  bookmarks,
  player,
  isRepeat,
  tekrar,
  quira,
  prorate,
  first,
  downloadsWarsh,
  fontSize,
  theme,
  tmp,
}) => ({
  tmp,
  theme,
  fontSize,
  tarjama,
  awk,
  // repoInfo,
  lang,
  isRepeat,
  tekrar,
  player,
  bookmarks,
  wino,
  rerender,
  moqri,
  quira,
  prorate,
  first,
  downloadsWarsh,
});

const mapDispatchToProps = {
  setPlayer,
  setExactAya,
  reRender,
  addBookmarks,
  setBookmarks,
  setRepeat,
  setTheme,
  setTarjama,
};
export default connect(mapStateToProps, mapDispatchToProps)(Wino);
