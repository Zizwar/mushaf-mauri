import React, { Component } from "react";
import {
  Dimensions,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  TouchableNativeFeedback,
  StyleSheet,
  findNodeHandle,
  NativeModules,
  StatusBar,
  ScrollView,
  Vibration,
  TouchableHighlight,
  Animated,
  ImageBackground
} from "react-native";
import { ScreenOrientation } from "expo";
import * as FileSystem from "expo-file-system";
import { activateKeepAwake, deactivateKeepAwake } from "expo-keep-awake"; //wino permission
const DIR = FileSystem.documentDirectory;

import { Audio } from "expo-av";
import { isRTL } from "expo-localization";
import {
  Toast,
  Button,
  Badge,
  Card,
  CardItem,
  Container,
  View,
  Text,
  Content,
  Item,
  Input,
  Left,
  Right,
  Body,
  Header,
  Footer,
  FooterTab,
  Thumbnail,
  ListItem
} from "native-base";

const Toasti = text =>
  Toast.show({
    text,
    type: "success",
    duration: 3000
  });

import ActionButton from "react-native-action-button";
import Icon from "react-native-vector-icons/Ionicons";
import Swiper from "./src/node/Swipino";
import * as langs from "./i18n";
import {
  amakenPage,
  paddingAya,
  aya2id,
  nextAya,
  prevAya,
  getMm,
  getAyatBySuraAya,
  searchAyatByText,
  getPageBySuraAya,
  tarajem,
  getNameBySura,
  getJuzBySuraAya
} from "./src/functions";
import { getImagePageUri, getAudioMoqriUri } from "./src/api";
import { voiceMoqri } from "./src/amaken";

const { width, height } = Dimensions.get("window");

const HEIGH_PAGE = 707;
const WIDTH_PAGE = 456;
const MARGIN_PAGE = 54;

const heightScala = (HEIGH_PAGE - MARGIN_PAGE) * (width / WIDTH_PAGE);
//

const NUMBER_PAGE = 604;
const MINIMAL_PAGE_RENDER = 5;
const SWIPE_horizontal = true;
const currentPage = p => (NUMBER_PAGE - p ? NUMBER_PAGE - p : 0);
const suraAya2id = ({ sura, aya }) => `s${sura}a${aya}z`;
//
import { connect } from "react-redux";
import {
  setExactAya,
  reRender,
  setBookmarks,
  addBookmarks,
  setPlayer,
  setRepeat,
  setTheme
} from "./reducer";
//

import { ButtonPopOver } from "./src/component";
import Modalino from "./src/component/modalino";
import AddNote from "./src/component/addNote";
import Search from "./src/screens/Search";
import Tarajem from "./src/screens/Tarajem";
import Tafsir from "./src/screens/Tafsir";
import Author from "./src/screens/Author";
import First from "./src/screens/First";
import Note from "./src/screens/Note";
import Menu from "./src/screens/Menu";
import { Popover } from "react-native-modal-popover";

//
const THEMES = [
  { backgroundColor: "#555", color: "#fbffd6", night: true }, //night
  { backgroundColor: "#fbffd6", color: "#555" }, //sandart
  { backgroundColor: "#fff", color: "#555" },
  { backgroundColor: "#ffc", color: "#999" },
  { backgroundColor: "#fcf", color: "#303" }
];

class Wino extends Component {
  constructor(props) {
    super(props);
    //tray
    this.isHidden = true;
    this.isHiddenSearch = true;
    this.toValue = 250;
    this.state = {
      bounceValue: new Animated.Value(this.toValue),
      //modallvisible
      visibleAddNote: false,
      menuSercl: true,
      vi: [], //[...Array(NUMBER_PAGE).keys()]
      searchText: "",
      searchTextOk: false,
      // index: SWIPE_horizontal ? NUMBER_PAGE - 1 : 0,
      visibleModalTafsir: false,
      visibleModalTarjama: false,
      visibleModalMenu: false,
      visibleModalAuthor: false,

      visibleModalSearch: false,
      ///popOver
      showPopover: false,
      popoverAnchor: { x: 0, y: 0, width: 0, height: 0 },
      dataPopOver: null,
      isPlaying: false,
      //tafsir tarajem
      textTarajem: "",
      bounceValueHeader: new Animated.Value(-150),
      positionPage: []
    };

    this.theme = 0;

    this.audioPlayer = new Audio.Sound();

    this.lastIndex = 1; //NUMBER_PAGE-1;
    this.prevIndex = 0;
    this.index = 603;
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
    //this.prorate = this.props.prorate?0.7:1;
  }
  //awk never slip
  componentWillMount() {
    const { prorate } = this.props;
    if (prorate) this.prorate();
    console.log("WORKING...");
    let vi = [];
    let i = 1;
    for (;;) {
      if (i > NUMBER_PAGE) break;
      vi.push({
        id: i
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
  //

  componentDidMount() {
    const { quira, awk, wino: winos, setExactAya } = this.props;
    const wino = winos.sura ? winos : this.wino;
    this.setAwk(awk);
    this.existPage = this.isExistPage(quira);
    console.log(
      "++++this is exist page =>" + this.existPage,
      "quira=>" + quira
    );
    //this.scrollTo(1);
    //setTimeout(_ => this.selectFullAya(wino), 1);
    let page = wino.page ? wino.page : getAyatBySuraAya(wino).page;
    const positionPage = this.id2index[Number(page)];
    this.setState({ positionPage });
    //this.selectFullAya({aya:1,sura:1})
    setTimeout(_ => this.selectFullAya(wino), 500);
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
      leng: lengz
    } = this.props;
    if (!rerender) return;
    if (rerender === "switchLang") this.lang = langs[langz];

    if (player) {
      //this.props.reRender(false);
      setPlayer(false);
      switch (player) {
        case "play":
          this.selectFullAya(wino);
          setTimeout(_ => this.buildPlayAudio(), 100);
          break;
        case "stop":
          this.playSound(false);
          return;
          break;

        //
      }
    }

    reRender(false);
    const wino_ = this.wino;
    if (wino && wino_)
      if (wino.aya === wino_.aya && wino.sura === wino_.sura) return;

    let page = wino.page ? wino.page : getAyatBySuraAya(wino).page;
    let positionPage = this.id2index[Number(page)];
    this.setState({ positionPage });

    //     console.log(
    //       wino.aya,
    //       "<<  YES RENDER prop this RE_RENDER Local==",
    //       wino_.aya
    //     );

    this.selectFullAya(wino);
    // this.setExactAya(this.props.wino);
  }
  prorate = async _ =>
    await ScreenOrientation.allowAsync(ScreenOrientation.Orientation.LANDSCAPE);

  setAwk = bel => {
    if (bel) activateKeepAwake();
    else deactivateKeepAwake();
  };
  isExistPage = quira => {
    const {
      downloadsHafs,
      downloadshafsDorar,
      downloadsWarsh,
      downloadsTajweed
    } = this.props;
    console.log("QUIRA ", {
      downloadsHafs,
      downloadshafsDorar,
      downloadsWarsh,
      downloadsTajweed
    });

    switch (quira) {
      case "hafs":
        return downloadsHafs;
      case "hafsDorar":
        return downloadshafsDorar;
      case "warsh":
        return downloadsWarsh;
      case "tajweed":
        return downloadsTajweed;
      default:
        return 0;
    }
  };
  //MEdia
  playSound = async uri => {
    try {
      await this.audioPlayer.unloadAsync();
      if (!uri) {
        this.setState({
          isPlaying: false
        });
        return;
      }
      await this.audioPlayer.loadAsync({
        uri
      });
      await this.audioPlayer.playAsync();
      this.setState({
        isPlaying: true
      });
      this.audioPlayer.setOnPlaybackStatusUpdate(
        this._setOnPlaybackStatusUpdate
      );
    } catch (error) {
      console.log(error);
    }
  };
  //
  _setOnPlaybackStatusUpdate = status => {
    if (status.didJustFinish) {
      this.playNextAya(true);
      return;
    }
    if (status.error) alert(`PLAYER ERROR: ${status.error}`);
  };
  ///
  buildPlayAudio = wino => {
    let sura, aya, id;
    if (wino) {
      sura = wino.sura;
      aya = wino.aya;
      page = wino.page;
      id = aya2id({
        sura,
        aya
      });
    } else {
      // if()
      sura = this.wino.sura;
      aya = this.wino.aya;
      id = this.wino.id;
      page = this.wino.page;
    }

    const _id = paddingAya(sura) + paddingAya(aya);
    // const id = aya2id({ sura, aya });
    const path = getAudioMoqriUri({
      moqri: this.props.moqri,
      id: _id
    });
    if (page) this.scrollTo(page);

    this.playSound(path);
  };
  ///
  itRepeat = () => {
    console.log("yes repeat");
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
        isPlaying: false
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
  playNextAya = rec => {
    if (this.props.isRepeat) this.itRepeat();
    else {
      //alert("no repeat");
      const { sura, aya } = nextAya(this.wino);
      this.props.setExactAya({ sura, aya });
      if (this.state.isPlaying) this.buildPlayAudio({ sura, aya });
    }
  };

  prevAya = rec => {
    const { sura, aya } = prevAya(this.wino);
    this.props.setExactAya({ sura, aya });
    if (this.state.isPlaying) this.buildPlayAudio({ sura, aya });
  };
  //end Media
  scrollTo = num => {
    if (!this.refs.swiper) {
      return;
      setTimeout(_ => {
        this.scrollTo(num);
      }, 500);
      // return
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
    if (num > 604) num = 1;
    if (num < 1) num = 604;
    let index = this.id2index[Number(num)];

    if (index === this.index) return;
    if (!index) index = 0;

    //  if (index > 603) index = 1;
    this.currentId = index - this.index;
    // this.statePage(this.currentId)
    // this.index = index;
    // console.log(
    //   ">ScrollTo index => " + index,
    //   ">ScrollTo current=>" + currentI
    // );
    this.refs.swiper.scrollBy(this.currentId, false);
  };
  statePage(positionPage) {
    this.setState({ positionPage });
  }

  toglModalTafsir = togl => {
    //const {visibleModalSearch} = this.state
    let visibleModalTafsir = !this.state.visibleModalTafsir;
    if (togl == "close") visibleModalTafsir = false;
    if (togl == "open") visibleModalTafsir = true;
    this.setState({ visibleModalTafsir });
  };
  toglShowPopover = togl => {
    //const {visibleModalSearch} = this.state
    let showPopover = !this.state.showPopover;
    if (togl == "close") showPopover = false;
    if (togl == "open") showPopover = true;
    this.setState({ showPopover });
  };
  toglModalAuthor = togl => {
    //const {visibleModalSearch} = this.state
    let visibleModalAuthor = !this.state.visibleModalAuthor;
    if (togl == "close") visibleModalAuthor = false;
    if (togl == "open") visibleModalAuthor = true;
    this.setState({ visibleModalAuthor });
  };
  toglModalMenu = togl => {
    //const {visibleModalSearch} = this.state
    let visibleModalMenu = !this.state.visibleModalMenu;
    if (togl == "close") visibleModalMenu = false;
    if (togl == "open") visibleModalMenu = true;
    this.setState({ visibleModalMenu });
  };

  toglModalSearch = (togl, ok) => {
    if (ok && this.state.searchText.length <= 2) {
      alert("main 2 char");
      return;
    }
    //const {visibleModalSearch} = this.state
    let visibleModalSearch = this.state.visibleModalSearch;
    if (togl == "close") visibleModalSearch = false;
    if (togl == "open") visibleModalSearch = true;

    this.setState({
      visibleModalSearch
    });
  };
  _onIndexChanged = index => {
    //const thisindex = this.index;
    this.index = index;

    this.setState({ positionPage: index });
    //this.statePage(index)
    //this.setState({ menuSercl: false });
    // console.log("ChangeIndex=>", { index });
    // alert(index)
  };
  _onMomentumScrollEnd = (e, state, context) =>
    console.log({ e, state, context });
  //
  toglMenuDownUp = cls => {
    // this.toglTray()
    //if (this.awitino) return;
    // this.awitino = true;
    const { menuSercl } = this.state;
    this.setState({ menuSercl: !menuSercl });
    // this.props.handleMenu("open");
    // setTimeout(_ => this.toglSearch(), 100);
  };
  getImagePageLocal = ({ quira, id }) => DIR + quira + "/" + id + ".png";

  renderItemPage = ({ id, index }) => {
    // console.log("render Item", { id, index });
    const {
      quira,
      lang,
      theme: { night, color, backgroundColor, tmp }
    } = this.props;
    this.pages = [];
    this.id2index[id] = index;
    const positions = amakenPage(id, quira);

    const { aya: ayaF, sura: suraF } = positions[0].wino; //first aya
    const hizb = getJuzBySuraAya({ sura: suraF, aya: ayaF });

    let nameSuwarPage = positions.map(({ wino }) => wino.sura);
    nameSuwarPage = [...new Set(nameSuwarPage)].map(sura =>
      getNameBySura({ sura, lang })
    );

    const uri =
      this.existPage >= id
        ? this.getImagePageLocal({ quira, id })
        : getImagePageUri({
            quira, //this.quraa,
            id
          });
    //
    //const opacity =tmp==="selectAllAya"?0.2:0
    //const path = CacheManager.get(uri).getPath();
    const titleSura = (
      <>
        <Left>
          <Text note style={{ textAlign: "left", color }}>
            {lang == "ar" ? langs[lang]["juzString"][hizb - 1] : "Jus' " + hizb}
          </Text>
        </Left>

        <Text note style={{ textAlign: "right", color }}>
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
          {lang == "ar" ? langs[lang]["juzString"][hizb - 1] : "Jus' " + hizb}
        </Text>
      </>
    );

    return (
      <View key={index + "Vz"} style={{ flex: 1 }}>
        <Item
          transparent
          style={{
            height: 32,
            paddingLeft: 40,
            paddingRight: 40,
            borderColor: backgroundColor
          }}
        >
          {!isRTL ? titleSura : titleSuraRtl}
        </Item>

        <View
          style={{
            flex: 1,
            //   backgroundColor:"#369",
            alignItems: "center"
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

          {this.state.positionPage === index &&
            positions.map(({ left, top, height, width, id, wino }, index__) => (
              <TouchableNativeFeedback
                //style={{backgroundColor:'#f61',opacity:0.3}}
                //delayLongPress={5}
                //onPress={this.toglMenuDownUp}
                onPress={_ => this.onLongPressAya({ id, wino })}
                key={`toche${id}`}
              >
                <View
                  key={`vto${id}`}
                  ref={t => {
                    this.pages[id] = { index, t };
                  }}
                  style={[
                    styles.touchAya,
                    this.prevId === `s${wino.sura}a${wino.aya}`
                      ? { backgroundColor, opacity: 0.1 } //styles.onPressAya
                      : { opacity: 0.0 }, //styles.onUnPressAya,
                    !isRTL
                      ? {
                          height,
                          top,
                          left,
                          width
                        }
                      : {
                          height,
                          top,
                          right: left,
                          width
                        }
                  ]}
                />
              </TouchableNativeFeedback>
            ))}
          <Text
            note
            style={{
              textAlign: "center",
              color /* postition:"absolute",top:heightScala + MARGIN_PAGE + 24*/
            }}
          >
            {id}
          </Text>
        </View>
      </View>
    );
  };

  selectFullAya = (wino, first_) => {
    // this.props.handleMenu("open");
    //alert("id=" +id);
    const id = suraAya2id(wino); //wino.idAya
    //  console.log("select full aya=>", { wino, id });
    const opacity = 0.2;
    const {
      theme: { color: backgroundColor }
    } = this.props; //= "#369";
    //let stylez = !scrol ? styles.onPressAya : styles.onUnPressAya;
    const fid = id.substring(0, id.indexOf("z"));
    const oldId = this.prevId;
    this.prevId = fid;
    if (oldId && oldId !== fid) this.unSelectAya(oldId);
    this.wino = wino;
    //if (scroll) {

    let page = wino.page ? wino.page : getAyatBySuraAya(wino).page;
    if (!page) page = 1;
    //this.statePage(page)
    this.scrollTo(page);
    if (first_) {
      this.props.reRender(true);
      return;
    }

    // }
    setTimeout(_ => {
      const zid = ["z_1", "z_2", "z_3"];

      zid.forEach(itm => {
        const cid = fid + itm;

        let refs = this.pages[cid];
        if (refs)
          if (refs.t) {
            //console.log("cid=yes =", cid);
            this.pageIndex = refs.index;

            refs.t.setNativeProps({
              style: { backgroundColor, opacity }
            });
          }
      });
    }, 10);

    if (!this.isHidden) this.setTarjama();
  };
  setTarjama = () => {
    const {
      wino: { aya, sura },
      tarjama
    } = this.props;
    tarajem(
      { aya, sura, tarjama },
      (cb = textTarajem => {
        //alert(textTarajem);
        if (textTarajem) this.setState({ textTarajem });
      })
    );
  };
  unSelectAya = id => {
    const fid = id;
    const opacity = 0.0;
    const backgroundColor = "#369";
    setTimeout(_ => {
      const zid = ["z_1", "z_2", "z_3"];
      zid.forEach(itm => {
        const cid = fid + itm;
        let refs = this.pages[cid];
        if (refs)
          if (refs.t) {
            refs.t.setNativeProps({
              style: { backgroundColor, opacity },
              disabled: false
            });
          }
      });
    }, 1);
  };
  toglPlayer = _ => {
    if (this.state.isPlaying) this.playSound(false);
    else this.buildPlayAudio();
  };
  //

  showPopover(index, wino) {
    //this.selectFullAya(wino);
    const dataPopOver = getAyatBySuraAya(wino);
    this.setState({ dataPopOver, showPopover: true });
    // this.toglShowPopover('open');
    //return;
    const handle = findNodeHandle(this.pages[index].t);
    if (handle) {
      NativeModules.UIManager.measure(handle, (x0, y0, width, height, x, y) => {
        this.setState({
          popoverAnchor: { x, y, width, height },
          dataPopOver,
          showPopover: true
        });
      });
    }
  }
  closePopover = () => this.setState({ showPopover: false });
  //

  addBookmarks = _ => {
    const wino = this.wino;
    //const img = "https://cdn0.iconfinder.com/data/icons/20-flat-icons/128/heart.png";

    const d = new Date();
    const h = d.getHours();
    const m = d.getMinutes();
    const time = h + ":" + m;
    const arrBookmarks = {
      // img,
      text: getAyatBySuraAya(wino).text,
      note: null,
      time,
      id: { sura: wino.sura, aya: wino.aya }
    };

    const setBookmarks = [
      ...this.props.bookmarks,
      {
        // img,
        text: getAyatBySuraAya(wino).text,
        note: null,
        time,
        id: { sura: wino.sura, aya: wino.aya }
      }
    ];

    this.props.setBookmarks(setBookmarks);
    Toasti(this.lang["fav_added"]);
    this.closePopover();
  };
  addNote = note => {
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
        text: getAyatBySuraAya(wino).text,
        note,
        time,
        id: { sura: wino.sura, aya: wino.aya }
      }
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
  toglSearch = arg => {
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
      friction: 8
    }).start();

    this.isHiddenSearch = !this.isHiddenSearch;
    this.awitino = false;
  };

  toglTray = arg => {
    let toValue = this.toValue;
    if (arg == "open") this.isHidden = true;

    if (arg == "close") this.isHidden = false;

    this.setTarjama();

    if (this.isHidden) {
      toValue = 0;
    }
    Animated.spring(this.state.bounceValue, {
      toValue: toValue,
      velocity: 3,
      tension: 2,
      friction: 8
    }).start();
    this.setState({ menuSercl: !this.isHidden });
    this.setState({ visibleModalTarjama: this.isHidden });
    this.isHidden = !this.isHidden;
  };

  /////////////////
  render() {
    const {
      vi,
      showPopover,
      dataPopOver,
      visibleModalTafsir,
      visibleAddNote,
      menuSercl,
      bounceValueHeader,
      textTarajem,
      isPlaying,
      searchText,
      visibleModalSearch,
      visibleModalAuthor,
      bounceValue,
      visibleModalMenu,
      visibleModalTarjama,
      popoverAnchor
    } = this.state;
    const {
      openSmartSearch,
      wino,
      navigation,
      first,
      theme: { color, backgroundColor },
      setTheme,
      quira,
      lang,
      isRepeat,
      tekrar
    } = this.props;
    const changeColor = index => {
      if (quira !== "hafs") {
        setTheme(THEMES[2]);
        return;
      }
      if (index) {
        setTheme(THEMES[index - 1]);
        return;
      }
      this.theme++;
      if (this.theme >= THEMES.length - 1) this.theme = 1;
      setTheme(THEMES[this.theme]);
    };
    const modalShowPopover = (
      <Modalino
        data={
          <ButtonPopOver
            lang={this.lang}
            close={this.closePopover}
            wino={dataPopOver}
            color={color}
            backgroundColor={backgroundColor}
            stop={this.playSound}
            // play={this.buildPlayAudio}
            navigate={navigation.navigate}
            addBookmarks={this.addBookmarks}
            note={_ => this.setState({ visibleAddNote: true })}
            toasti={Toasti}
            tarajem={_ => this.toglTray("open")}
          />
        }
        togl={this.closePopover}
        visible={showPopover}
        // position="down"
        //noSwipe={true}
        //backDrop={true}
        style={{ paddingLeft: 5, paddingRight: 5, paddingTop: 200 }}
      />
    );
    //menu
    const modalMenu = (
      <Modalino
        data={
          <Menu
            close={_ => this.toglModalMenu("close")}
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
          height: 290,
          position: "absolute",
          width: 280,
          left: !isRTL ? (lang === "ar" ? null : 0) : lang === "ar" ? 0 : null,
          right: !isRTL ? (lang === "ar" ? 0 : null) : lang === "ar" ? null : 0,
          top: height - 280,
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
          borderWidth: 1
        }}
        animationIn={
          !isRTL
            ? lang === "ar"
              ? "slideInLeft"
              : "slideInRight"
            : lang === "ar"
            ? "slideInRight"
            : "slideInLeft"
        }
        animationOut={
          !isRTL
            ? lang === "ar"
              ? "slideOutLeft"
              : "slideOutRight"
            : lang === "ar"
            ? "slideOutRight"
            : "slideOutLeft"
        }
      />
    );
    const addNote = (
      <AddNote
        show={visibleAddNote}
        note={note => {
          this.setState({ visibleAddNote: false });
          this.addNote(note);
        }}
        cancel={_ => this.setState({ visibleAddNote: false })}
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
    const modalSearch = () => {
      return (
        <Modalino
          togl={this.toglModalSearch}
          data={
            <Search
              // searchTextOK={searchTextOk}
              searchText={searchText}
              togl={this.toglModalSearch}
            />
          }
          visible={visibleModalSearch}
          //search={this.satee.serach}
        />
      );
    };
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

    const headerSearch = (
      <Animated.View
        style={[
          styles.subViewHeader,
          { transform: [{ translateY: bounceValueHeader }] }
        ]}
      >
        <Card style={{ paddingLeft: 10, paddingRight: 5 }}>
          <Item sytle={{ backgroundColor, borderColor: backgroundColor }}>
            <Button
              onPress={_ => this.toglModalSearch("open", true)}
              transparent
            >
              <Icon size={32} name="ios-search" />
            </Button>
            <Input
              placeholder={this.lang["search"]}
              value={searchText}
              onChangeText={text => this.setState({ searchText: text })}
              onSubmitEditing={() => this.toglModalSearch("open", true)}
              style={{ margin: 9, textAlign: "center" }}
            />
            <Button onPress={openSmartSearch} transparent>
              <Icon size={32} active name="md-more" />
            </Button>
          </Item>
        </Card>
      </Animated.View>
    );

    const ButtonOption = (
      <Button
        transparent
        style={{ position: "absolute", left: 10, bottom: 1 }}
        onPress={_ => {
          //this.changeColor();
          //
          navigation.navigate("Options"); /*this.toglModalTafsir("open") */
        }}
      >
        <Icon color={color} size={26} name="ios-settings" />
      </Button>
    );
    const ButtonOptionRtl = (
      <Button
        transparent
        style={{ position: "absolute", left: 10, bottom: 1 }}
        onPress={this.toglModalMenu}
      >
        <Icon color={color} size={26} name="ios-menu" />
      </Button>
    );

    const ButtonMenu = (
      <Button
        transparent
        style={{ position: "absolute", right: 10, bottom: 0 }}
        onPress={this.toglModalMenu}
      >
        <Icon color={color} size={26} name="ios-menu" />
      </Button>
    );

    const ButtonMenuRtl = (
      <Button
        transparent
        style={{ position: "absolute", right: 10, bottom: 0 }}
        onPress={_ => {
          //this.changeColor();
          //
          navigation.navigate("Options"); /*this.toglModalTafsir("open") */
        }}
      >
        <Icon color={color} size={26} name="ios-settings" />
      </Button>
    );
    const footerMenu = (
      <View style={styles.footerMenu}>
        {!isRTL ? ButtonMenu : ButtonMenuRtl}

        {isPlaying && (
          <Item
            style={{
              position: "absolute",
              bottom: 1,
              alignSelf: "center",
              paddingLeft: 5,
              paddingRight: 5,
              backgroundColor,
              borderRadius: 8,
              borderColor: color,
              borderWidth: 2,
              borderTopWidth: 3
            }}
          >
            <Button
              onPress={this.toglPlayer}
              transparent
              style={styles.buttonHeader}
            >
              <Icon color={color} size={26} name="ios-pause" />
            </Button>
            <Button
              style={styles.buttonHeader}
              transparent
              badge
              onPress={_ => navigation.navigate("Reciting")}
            >
              <Icon color={color} size={26} name="ios-repeat" />
              {isRepeat && (
                <Badge style={{ backgroundColor, opacity: 0.5 }}>
                  <Text note style={{ color, fontSize: 10 }}>
                    {tekrar.repeat}
                  </Text>
                </Badge>
              )}
            </Button>
          </Item>
        )}

        {!isRTL ? ButtonOption : ButtonOptionRtl}
      </View>
    );
    const popOver = (
      <Popover
        contentStyle={{
          backgroundColor,
          borderRadius: 8,
          borderColor: color,
          borderWidth: 2
        }}
        //	backgroundStyle={backgroundColor}
        arrowStyle={{
          borderTopColor: backgroundColor,
          borderColor: color,
          borderWidth: 1
        }}
        useNativeDriver={true}
        visible={showPopover}
        fromRect={popoverAnchor}
        onClose={this.closePopover}
        // placement="bottom"
        duration={100}
      >
        <ButtonPopOver
          lang={this.lang}
          close={this.closePopover}
          wino={dataPopOver}
          stop={this.playSound}
          play={this.buildPlayAudio}
          navigate={navigation.navigate}
          addBookmarks={this.addBookmarks}
          note={_ => this.setState({ visibleAddNote: true })}
          toasti={Toasti}
          tarajem={_ => this.toglTray("open")}
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
          <View style={{ flex: 1, width, height }}>
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
                height: 40
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
                  onPress={() => navigation.navigate("SearchSmart")}
                >
                  <Icon color={color} size={26} name="ios-search" />
                </Button>
                <Button
                  transparent
                  style={styles.buttonHeader}
                  // onPress={_ => this.setState({ visibleAddNote: true })}
                >
                  <Icon size={26} color={color} name="ios-star-outline" />
                </Button>
                <Button
                  transparent
                  style={styles.buttonHeader}
                  onPress={_ => {
                    if (this.theme) {
                      changeColor(0 + 1);
                      this.theme = 0;
                    } else {
                      changeColor(1 + 1);
                      this.theme = 1;
                    }
                  }}
                >
                  <Icon color={color} size={26} name="ios-moon" />
                </Button>
              </Item>
            </View>

            <ScrollView
              style={{
                top: MARGIN_PAGE,
                //height,//:height+32,
                position: "absolute",
                right: 0,
                bottom: visibleModalTarjama ? 250 : 0,
                left: 0
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
                  <ActivityIndicator size="large" color="#f44" />
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
                  height: heightScala + MARGIN_PAGE + 24
                  // backgroundColor:"red",
                }}
                showsHorizontalScrollIndicator={true}
              >
                {vi.map(({ id }, index) => this.renderItemPage({ id, index }))}
              </Swiper>
            </ScrollView>
          </View>

          {/*menuSercl && footerDynamic*/}

          {(!visibleModalTarjama || !visibleModalMenu) && footerMenu}
          {addNote}
          {tray}
          {modalTafsir}
          {/*modalShowPopover*/}
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
    justifyContent: "center"
  },
  horizontal: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 10
  },
  buttonHeader: { paddingLeft: 15, paddingRight: 15 },

  slide1: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#9DD6EB"
  },

  slide2: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#97CAE5"
  },

  slide3: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#92BBD9"
  },

  text: {
    color: "#fff"
    //fontSize: 30,
    //fontWeight: "bold"
  },
  touchAya: {
    position: "absolute",

    //	borderRadius: 10,
    borderWidth: 1,

    borderColor: "#F44",
    borderLeftWidth: 2,
    borderRightWidth: 2,

    shadowColor: "#CCC",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 1,
    marginLeft: 2,
    marginRight: 2,
    marginTop: 3
  },
  onPressAya: {
    backgroundColor: "#369",
    opacity: 0.2
  },
  onRecordAya: {
    backgroundColor: "#F44",
    opacity: 0.3
  },
  onUnPressAya: {
    backgroundColor: "#ffff00",
    opacity: 0.0

    //  borderWidth: 1,
    //    borderColor: "#3300ff",
    //		     borderLeftWidth: 2,
    //		     borderRightWidth: 2,
  },
  containerTray: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5FCFF",
    marginTop: 66
  },

  subView: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF08",
    height: 250
  },
  subViewFirst: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF08",
    height: 210
  },
  footerMenu: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    // backgroundColor: "#FFFFFF01",
    height: 32
    // opacity:0.0
  },
  subViewHeader: {
    position: "absolute",
    // top: -100,
    left: 50,
    right: 50,
    borderRadius: 25,
    //backgroundColor: "#FFFFFF",
    height: 100
  }
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
  downloadsHafs,
  downloadshafsDorar,
  downloadsWarsh,
  downloadsTajweed,
  fontSize,
  theme,
  tmp
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
  downloadsHafs,
  downloadshafsDorar,
  downloadsWarsh,
  downloadsTajweed
});

const mapDispatchToProps = {
  setPlayer,
  setExactAya,
  reRender,
  addBookmarks,
  setBookmarks,
  setRepeat,
  setTheme
};
export default connect(mapStateToProps, mapDispatchToProps)(Wino);
