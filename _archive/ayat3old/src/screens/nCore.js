import React, { Component, PureComponent } from "react";
import {
  Text,
  View,
  Dimensions,
  Image,
  ScrollView,
  TouchableWithoutFeedback,
  TouchableOpacity,
  StyleSheet,
  Vibration,
  Animated
} from "react-native";
//
import { ActionPicker } from "react-native-action-picker";
//import Carousel from "react-native-looped-carousel-improved";
import Carousel from "react-native-snap-carousel";
import ActionButton from "react-native-circular-action-menu";
//import ActionButton from "react-native-action-button";
import Icon from "react-native-vector-icons/Ionicons";
import Expo, { Audio, FileSystem, Permissions } from "expo";
import Store from "rn-json-store";
//
import { connect } from "react-redux";
import { togglePicker, setExactAya, reRender } from "./reducer";

//import ModalPicker from 'react-native-modal-picker'
import _ from "lodash";
import Modalino from "./src/component/modalino";
import Search from "./src/screens/Search";
import Tafsir from "./src/screens/Tafsir";
//import Page from "./src/screens/Page";
//
import {
  amakenPage,
  paddingAya,
  aya2id,
  nextAya,
  getMm,
  getAyatBySuraAya,
  searchAyatByText,
  getPageBySuraAya
} from "./src/functions";
import { getImagePageUri, getAudioMoqriUri } from "./src/api";
import { voiceMoqri } from "./src/amaken";

const { width, height } = Dimensions.get("window");

const NUM_DATA = 604;
class Core extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      wino: { aya: 1, sura: 1 },
      //isPickerVisible: false,
      menuSercle: false,
      activeMenu: false,
      visibleModalSearch: false,
      visibleModalPopUp: false,
      vi: [
      ],
      firstItem: NUM_DATA-1,
      currentIndex: 1,
      position: [],
      positions: [],
      ///audo recoed
      haveRecordingPermissions: false,
      isLoading: false,
      isPlaybackAllowed: false,
      muted: false,
      soundPosition: null,
      soundDuration: null,
      recordingDuration: null,
      shouldPlay: false,
      isPlaying: false,
      isRecording: false,
      // fontLoaded: false,
      shouldCorrectPitch: true,
      volume: 1.0,
      rate: 1.0
      //wino: { sura: 1, aya: 1, page: 1, id: 1 }
      //end audio
    };
    this.audioPlayer = new Audio.Sound();
    this.recording = new Audio.Recording();
    this.recordingSettings = JSON.parse(
      JSON.stringify(Audio.RECORDING_OPTIONS_PRESET_LOW_QUALITY)
    );

    // this.recordingSettings.android['maxFileSize'] = 12000;
    //
    this.text = [...Array(100).keys()];
    this.arrayz = [];
    this.lastIndex = 1;
    this.pages = [];
    this.prevId = null;
    this.wino = { sura: 1, aya: 1 };
    this.listRecording = [];
    this.moqri = "Hudhaify_64kbps";
    this.quraa = "warsh";
    //
    this.isFirstSnapTo = true;
    this.indexRender = 0;
    this.pageIndex = 603;
    this.id2index = [];
  }
  //
  _togglePicker = () => {
    //this.setState({ isPickerVisible: !this.state.isPickerVisible });
    this.props.togglePicker(true);
  };
  createPicker = () => {
    return [
      { label: "Copy", color: "#364", ico: "copy", action: () => this._copy() },
      {
        label: "Share",
        color: "#569",
        ico: "share",
        action: () => this._share()
      },
      {
        label: "Note",
        color: "#C46",
        ico: "Bookmarks",
        action: () => this._note()
      },
      {
        label: "Tafsir",
        color: "green",
        ico: "list",
        action: () => this._tafsir()
      },
      { label: "Play", color: "#00c", ico: "play", action: () => this._play() }
    ];
  };
  //
  toglModalSearch = togl => {
    //const {visibleModalSearch} = this.state
    let visibleModalSearch = this.state.visibleModalSearch;
    if (togl == "close") visibleModalSearch = false;
    if (togl == "open") visibleModalSearch = true;
    this.setState({ visibleModalSearch });
  };
  toglModalPopUp = togl => {
    //const {visibleModalSearch} = this.state
    let visibleModalPopUp = !this.state.visibleModalPopUp;
    if (togl == "close") visibleModalPopUp = false;
    if (togl == "open") visibleModalPopUp = true;
    this.setState({ visibleModalPopUp });
  };

  //
  componentWillMount() {
    // this.setState({vi: this.getData(NUM_DATA, 0)})
    // this.setState({vi: [{id: 1}, {id: 2}, {id: 3}, {id: 4}, {id: 5}, {id: 6}, {id: 7}, {id: 8}, {id: 9}, {id: 10}, {id: 11}]})
  this.nextPageArray()
  }

  componentDidMount() {
    this.setExactAya(this.props.wino);
    this._askForPermissions();
    Store.get("listRecording").then(val => {
      if (val) {
        // console.warn(val);
        //this.listRecording = val;
      }
    });
    //  if(this._carousel)
    //this._carousel.snapToItem(
    //   3,
    //   (animated = false),
    //   (fireCallback = true)
    // );
    // this.setState({ currentIndex: 50 });
    // this._carousel.snapToItem(88, true);
    // this.nextPageArray();
    //   this._carousel.snapToItem (89, animated = true, fireCallback = true)
    //   if(this.props.setExactAya){
    //this.setExactAya(this.props.setExactAya);
    // alert("approch set props syra aya")
    // return
    // }
    
   
  }
  componentDidUpdate() {
    if (!this.props.rerender) {
     // console.log(" NO-RENDER wino local");

      return;
    }
    const wino_ = this.wino;
    const { wino, reRender } = this.props;
    if (wino && wino_)
      if (wino.aya === wino_.aya && wino.sura === wino_.sura) return;

    console.log(
      wino.aya,
      "<<  CORE RENDER RE_RENDER Local==",
      wino_.aya
    );
    reRender(false);
    this.setExactAya(wino);
   // this.selectFullAya(wino, true);
    // this.setExactAya(this.props.wino);
  }
  old_componentDidUpdate() {
    //  alert("update approch set props syra aya");
 
    if (!this.props.rerender) {
      console.log(" NO-RENDER wino local");
      return;
    }
    const wino_ = this.wino;
    const { wino, reRender } = this.props;
    if (wino && wino_)
      if (wino.aya === wino_.aya && wino.sura === wino_.sura) return;

    reRender(false);
    this.setExactAya(wino);

    console.log(wino.aya, "<< prop this RE_RENDER tror==", wino_.aya);

    // this.setExactAya(this.props.wino);
  }
  _askForPermissions = async () => {
    console.log("WORKING...");
    Audio.setIsEnabledAsync(true);
    Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
      playsInSilentLockedModeIOS: false,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX
    });
    const response = await Permissions.askAsync(Permissions.AUDIO_RECORDING);
    this.setState({
      haveRecordingPermissions: response.status === "granted"
    });
  };

  _Vi = (i, data) => {
    this.setState(state => {
      state.wino.vi[i].id = data;
      return state;
    });
  };

  setExactAya = ({ sura, aya, id }) => {
    if (!sura) {
      sura = 1;
      aya = 1;
    }
    const page = getPageBySuraAya({ sura, aya });
    this.wino = { sura, aya, id, page };
    this.snapToItem(page)

 

    //this.snapToItem(page)
   // if (this.nextPageArray(page, page + 9)) {
      // console.log("yes trove page=>", { page, sura, aya });
      setTimeout(_ => this.selectFullAya(`s${sura}a${aya}z`),600);
    //}

    //if(id)this.selectFullAya(id)
    // else this.selectFullAya(`s${sura}a${aya}z`,null,getPageBySuraAya({sura,aya}));
  };

  nextPageArray = (start, end) => {
 
    //for (i = _start; i <= _end; i++) {
      for (i = 1; i <= 604; i++) {
      item.push({ id: i });
    }

    this.setState({
      vi: item.reverse()
    });
 
  };

  creatPositions = (item, index) => {
    //  alert(index)
    //alert(JSON.stringify(WARSH[item.id]));
    let positions = amakenPage(item.id);
    return positions;
    //
    this.setState({ position: positions });

    return;
    let itemz = [];
    positions.forEach((position, index_) => {
      itemz.push(
        <View
          key={`aya${item.id}and${index_}`}
          style={[
            {
              position: "absolute",
              backgroundColor: "#EE2C38",
              height: position.height,
              top: position.top,
              left: position.left,
              opacity: 0.6,
              width: position.width
            }
          ]}
        />
      );
    });
    return <View>{itemz}</View>;
    //this._carousel.snapToNext();
    // this._carousel.snapToItem (index)
    // this._carousel.snapToItem (1, animated = true, fireCallback = true)
    // this.setState({currentIndex:200})
  };
  //
  getData = (num, skip) => {
    const start = skip;
    const end = skip + num;
    console.log("start: ", start);
    console.log("end: ", end);

    return _.range(start, end).map((x, i) => ({
      id: i,
      title: "List Item " + i
    }));
  };
  //
  loadmore = i => {
    alert(JSON.stringify(i));
    // let start = this.state.vi[this.state.vi.length].id;
    this.nextPageArray();
    //let newData = //data.concat(
    //    this.getData(NUM_DATA, data.length + 1)
    //);
    //this.setState({ vi: newData });
  };
  //
  //status record
  _updateScreenForRecordingStatus = status => {
    if (!status) return;
    if (status.canRecord) {
      this.setState({
        isRecording: status.isRecording
        // recordingDuration: status.durationMillis,
      });
    } else if (status.isDoneRecording) {
      // alert("isDoneRecording");
      this.setState({
        isRecording: false
        // recordingDuration: status.durationMillis,
      });
      if (!this.state.isLoading) {
        // this.stopRecord();
      }
    }
  };
  async stopRecord(rtr) {
    //this.audioPlayer.stopAsync();
    this.setState({
      isLoading: true
    });
    await this.audioPlayer.unloadAsync();
    try {
      await this.recording.stopAndUnloadAsync();
      this.recording.setOnRecordingStatusUpdate(null);
    } catch (error) {
      alert(error);
    }
    if (rtr) {
      this.recording = null;
      return;
    }
    const info = await FileSystem.getInfoAsync(this.recording.getURI());
    const uri = this.recording.getURI();
    console.log(`FILE INFO: ${JSON.stringify(info)}`);

    this.setState({
      isLoading: false
    });

    this.listRecording[this.wino.id] = uri;
    Store.set("listRecording", this.listRecording);
    this._nextAya(true);
    // this.playSound(uri);
  }
  //
  onPressRecord = async () => {
    // if (this.state.isRecording) {
    //   console.log("stop record")
    //  this.stopRecord();
    //  return
    // } else {
    if (this.recording !== null) {
      this.recording.setOnRecordingStatusUpdate(null);
      this.recording = null;
    }
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX
    });
    console.log("play record");
    this.recording = new Audio.Recording();
    await this.recording.prepareToRecordAsync(this.recordingSettings);
    this.recording.setOnRecordingStatusUpdate(
      this._updateScreenForRecordingStatus
    );
    await this.recording.startAsync();
    //  }
  };
  ///audio
  _setOnPlaybackStatusUpdate = status => {
    // console.log('p----','befour='+status.isBuffering,"Plying"+status.isPlaying,'finich='+status.didJustFinish);
    this.setState({
      isPlaying: status.isPlaying
    });
    if (status.didJustFinish) {
      //  alert('finich')
      // this.audioPlayer.stopAsync()
      this._nextAya();

      //  return;
    }
    if (status.error) {
      alert(`FATAL PLAYER ERROR: ${status.error}`);
    }
    return;

    if (status.isLoaded) {
      this.setState({
        soundDuration: status.durationMillis,
        soundPosition: status.positionMillis,
        shouldPlay: status.shouldPlay,
        isPlaying: status.isPlaying,
        rate: status.rate,
        muted: status.isMuted,
        volume: status.volume,
        shouldCorrectPitch: status.shouldCorrectPitch,
        isPlaybackAllowed: true
      });
      if (status.didJustFinish) {
        //  alert('finich')

        //(isPlaying:status.isPlaying)
        // this.audioPlayer.stopAsync()
        this._nextAya();
        //  return;
      }
    } else {
      // alert('finich')
      // audioPlayer.stopAsync()
      // this._nextAya();
      this.setState({
        soundDuration: null,
        soundPosition: null,
        isPlaybackAllowed: false
      });
    }
  };
  playSound = async uri => {
    try {
      await this.audioPlayer.unloadAsync();
      if (!uri) return;
      await this.audioPlayer.loadAsync({ uri });
      await this.audioPlayer.playAsync();
      this.audioPlayer.setOnPlaybackStatusUpdate(
        this._setOnPlaybackStatusUpdate
      );
    } catch (error) {
      console.log(error);
    }
  };
  //
  _nextAya = rec => {
    const { sura, aya } = nextAya(this.wino);
    this.wino = { sura, aya, id: aya2id({ sura, aya }) };

    this.selectFullAya(`s${sura}a${aya}z`);
    if (rec) this.onPressRecord();
    else this.buildPlayAudio();
  };
  //
  buildPlayAudio = wino => {
    let sura, aya, id;
    if (wino) {
      sura = wino.sura;
      aya = wino.aya;
      id = aya2id({ sura, aya });
    } else {
      // if()
      sura = this.wino.sura;
      aya = this.wino.aya;
      id = this.wino.id;
    }

    Vibration.vibrate(2);
    const _id = paddingAya(sura) + paddingAya(aya);
    // const id = aya2id({ sura, aya });
    const path = getAudioMoqriUri({ moqri: this.moqri, id: _id });
    // const id = aya2id({ sura, aya }); 
   //if (this.listRecording[id]) this.playSound(this.listRecording[id]);
    //else
    this.playSound(path);
  };
  ///
  unSelectAya = id => {
    const fid = id;
    const opacity = 0.0;
    const backgroundColor = "#F44";
    setTimeout(_ => {
      const zid = ["z_1", "z_2", "z_3"];
      zid.forEach(itm => {
        const cid = fid + itm;
        let refs = this.pages[cid];
        if (refs)
          if (refs.t) {
            refs.t.setNativeProps({
              style: { backgroundColor, opacity }
            });
          }
      });
    }, 10);
  };
  ///
  selectFullAya = (id, scroll) => {
    //alert("id=" +id);
    const opacity = 0.5;
    const backgroundColor = "#369";
    //let stylez = !toggel ? styles.onPressAya : styles.onUnPressAya;
    const fid = id.substring(0, id.indexOf("z"));
    const oldId = this.prevId;
    this.prevId = fid;
    if (oldId && oldId !== fid) this.unSelectAya(oldId);
   
    setTimeout(_ => {
      let page=1;
      const zid = ["z_1", "z_2", "z_3"];
      zid.forEach(itm => {
        const cid = fid + itm;

        let refs = this.pages[cid];
        if (refs)
          if (refs.t) {
            //console.log("cid=yes =", cid);
            page = refs.index;

            refs.t.setNativeProps({
              style: { backgroundColor, opacity }
            });
          }
      });
  //  if(scroll)this._carousel.snapToItem(page,false)
   // if(!scroll) this.snapToItem(pageIndex ? pageIndex : 603);
    }, 200);
    /*  if (this.prevId && !toggel) {
      //toggel old prev
      let previd = this.prevId;
      this.prevId = fid;
      this.onPressAya(id, true);
      // return;
    }
    */

    // this.prevId = id;
  };
  snapToItem = pagez => {
    
    const page =603-pagez;//(this.id2index[pagez]-1);
    if(this.pageIndex === page) {alert("mem page") ;return} 
    this.pageIndex = page
    console.log('snapToItem=>',{pagez,page})
    if (this._carousel)
      this._carousel.snapToItem(
        page ? page : 603,
        (animated = false),
        (fireCallback = true)
      );
    else setTimeout(_ => this.snapToItem(pagez), 200);
  };
  //******
  onLongPressAya = (wino, id) => {
    this.wino = wino;
    this.props.setExactAya(wino, true);
    this._togglePicker(true);

    //this.setState({ menuSercle: true ,activeMenu:true});
   // this.selectFullAya(id);
    // this.setState({ visibleModalPopUp: true });
    // this.setState({ visiblePan: true, wino: wino });
    Vibration.vibrate(1);

    // console.log('search bismi',searchAyatByText('بسم'));
    //   const res = getAyatBySuraAya(wino);

    // if (res) alert(res.text);
    return;
    this.buildPlayAudio(wino);

    //alert(pathCdn);
  };
  onPressAya = (id, toggel) => {
    this.setState({ activeMenu: false, menuSercle: !this.state.menuSercle });
    // setTimeout();
    //  this.selectFullAya(id);
    //return;
    // this.selectFullAya(id, toggel);
  };
  //
  listMoqri = () => {
    //alert("show modal list");
  };
  //
  //******
  _renderItem = ({ item, index }) => {
    this.id2index[item.id] = index;
    console.log("== RENDER ITEM " + index);
    let positions_ = this.creatPositions(item, index);
    //  this.setState(state => {
    //  state.positions[item.id] = this.creatPositions(item, index);
    //  return state;
    // });
    const _getImagePageUri = getImagePageUri({
      quraa: this.quraa,
      id: item.id
    });
    return (
      <View key={item.id}>
        <TouchableWithoutFeedback
          key={item.id}
       
        >
          <Image
               onPress={() =>
            this.setState({
              activeMenu: false,
              menuSercle: !this.state.menuSercle
            })
          }
            key={item.id}
            style={{ width, height }}
            // style={styles.fullImgPage}
            source={{ uri: _getImagePageUri }}
          />
        </TouchableWithoutFeedback>
        {positions_ &&
          positions_.map(({ left, top, height, width, id, wino }, index__) => (
            <TouchableOpacity
              activeOpacity={0}
              ref={t => {
                //let id = position.id;
                // console.warn("p"+ page+"s"+sura+"a"+aya)
                this.pages[id] = { index, t }; //index_
              }}
              onPress={() => this.onPressAya(id)}
              onLongPress={() => this.onLongPressAya(wino, id)}
              key={`aya${id}`}
              style={[
                styles.touchAya,
                this.prevId === `s${wino.sura}a${wino.aya}`
                  ? styles.onPressAya
                  : this.listRecording[wino.id]
                    ? styles.onRecordAya
                    : styles.onUnPressAya,
                {
                  height,
                  top,
                  left,
                  width
                }
              ]}
            />
          ))}
      </View>
    );
  };
  _copy = obj => alert("copy");
  _share = obj => alert("Share");
  _note = obj => alert("note");
  _play = obj => this.buildPlayAudio();
  _tafsir = obj => this.toglModalPopUp("open");

  _menu = (obj, data) => {
    alert(obj);
    return;
    //
    if ("copy") this._copy(data);
    if ("note") this._note(data);
    if ("tafsir") this._tafsir(data);
    if ("play") this._play(data);
    if ("share") this._share(data);
  };
  //
  _actionButton = () => (
    <ActionButton
      //  style={{ position: "absolute",buttom:1 }}
      // activeOpacity={0.7}
      buttonColor="#369"
      active={this.state.activeMenu}
      //autoInactive={this.state.menuSercle}
      position="center"
      useNativeFeedback={false}
      bgColor="transparent"
      spacing={10}
      icon={<Icon size={32} color="#f44" name="md-list" />}
      backdrop={
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            height,
            width,
            backgroundColor: "#000",
            opacity: 0.3
          }}
        />
      }
    >
      <ActionButton.Item
        key="actb_1"
        buttonColor="#369"
        title="Menu"
        onPress={_ => this.props.handleMenu()}
      >
        <Icon size={22} name="ios-list" style={styles.actionButtonIcon} />
      </ActionButton.Item>

      <ActionButton.Item
        key="actb_2"
        buttonColor="#369"
        title="Search"
        onPress={_ => this.toglModalSearch("open")}
      >
        <Icon size={22} name="ios-search" style={styles.actionButtonIcon} />
      </ActionButton.Item>

      <ActionButton.Item
        key="actb_3"
        buttonColor="#9b59b6"
        title="Copy"
        onPress={() => {
         // this.props.setExactAya({ sura: 60, aya: 3 });
          this.setState({currentIndex:103})
          //this.props.reRender(true);
        }}
      >
        <Icon size={22} name="ios-copy" left style={styles.actionButtonIcon} />
      </ActionButton.Item>
      <ActionButton.Item
        key="actb_4"
        buttonColor="#9b59b6"
        title="Stop Record"
        onPress={_ => {
          this.stopRecord();
        }}
      >
        <Icon
          size={22}
          name={this.state.isRecording ? "md-recording" : "ios-create"}
          style={styles.actionButtonIcon}
        />
      </ActionButton.Item>
      <ActionButton.Item
        key="actb_5"
        buttonColor="#3498db"
        title="Note"
        onPress={() => {
          this.snapToItem(103)
          // this.audioPlayer.stopAsync();
          // this.stopRecord(true);
          // this.props.navigation.navigate("BookMarks");
        }}
      >
        <Icon size={22} name="md-book" style={styles.actionButtonIcon} />
      </ActionButton.Item>
      <ActionButton.Item
        key="actb_6"
        buttonColor="#1abc9c"
        title="Tafisr"
        onPress={() => this.toglModalPopUp("open")}
        // onPress={()=>this.setExactAya({sura:1,aya:3})}
      >
        <Icon name="book" style={styles.actionButtonIcon} />
      </ActionButton.Item>
      <ActionButton.Item
        key="actb_7"
        buttonColor="#1abc9c"
        title="Play"
        onPress={_ => {
          if (this.state.isPlaying) this.buildPlayAudio();
          else this.playSound(false);
        }}
        // onPress={()=>this.setExactAya({sura:1,aya:3})}
      >
        <Icon
          name={this.state.isPlaying ? "md-stop" : "md-play"}
          style={styles.actionButtonIcon}
        />
      </ActionButton.Item>
    </ActionButton>
  );

  render() {
    const modalSearch = (
      <Modalino
        togl={this.toglModalSearch}
        data={
          <Search
            togl={this.toglModalSearch}
           // setExactAyaLocal={this.setExactAya}
          />
        }
        visible={this.state.visibleModalSearch}
        //search={this.satee.serach}
      />
    );

    //   const rerender = this.props.rerender;
    //     if(rerender){
    //       alert('yes render');
    //       this.setExactAya(this.props.wino)
    //       this.props.reRender(false)
    //                 }

    const modalPopUp = (
      <Modalino
        togl={this.toglModalPopUp}
        data={
          <Tafsir
            togl={this.toglModalPopUp}
            //setExactAya={this.setExactAya}
          />
        }
        visible={this.state.visibleModalPopUp}
        //search={this.satee.serach}
        position="down"
        // noSwipe={true}
        backDrop={true}
      />
    );

    return (
      <View style={{ flex: 1, backgroundColor: "#f3f3f3" }}>
        <View style={{ flex: 1 }}>
          {modalPopUp}
          {modalSearch}

          <Carousel
           // vertical={true}
            loopClonesPerSide={10}
             initialNumToRender={8}
            data={this.state.vi}
            currentScrollPosition={this.state.currentIndex}
            //onEndReached={this.loadmore}
            //onEndReachedThreshold={0.8}
            //currentIndex={99}
            firstItem={603}
            ref={c => {
              this._carousel = c;
              //this._carousel.snapToItem (9, animated = true, fireCallback = true);
            }}
            enableSnap={true}
            containerCustomStyle={{ flex: 1 }}
            removeClippedSubviews={true}
            decelerationRate="fast"
            activeSlideAlignment="end"
           // slideStyle={{ width }}
            loop={false}
            InteractionManager={true}
            enableMomentum={true}
            lockScrollWhileSnapping={true}
            activeAnimationType="decay"
            renderItem={this._renderItem}
            keyExtractor={item => String(item.id)}
            sliderWidth={width}
            itemWidth={width}
            // apparitionDelay={10}
            //snapOnAndroid={true}
            // activeSlideAlignment="center"
            // lockScrollWhileSnapping={true}
            //onLayout={(index, itm) =>{console.log('layout=',index,itm)}}
            // onScroll={(index, itm) =>{console.log('layout=',index,itm)}}
            // useScrollView = {true}
            //
            //
            // onSnapToItem
            // onBeforeSnapToItem
            onSnapToItem={(index, itm) => {
              console.log("Pageindex=>" + index);
              this.setState({ menuSercle: false, activeMenu: false });
           //   if (!index) this.nextPageArray();
            }}
          />
        </View>
        {this.state.menuSercle && this._actionButton()}
        <ActionPicker
          title={`Sura:${this.wino.sura}, Aya${this.wino.aya}`}
          options={this.createPicker()}
          isVisible={this.props.isPickerVisible}
          onCancelRequest={() => this.props.togglePicker(false)}
          cancelLabel="Cancel"
        />
      </View>
    );
  }
}
//////
//////
const styles = StyleSheet.create({
  actionButtonIcon: {
    //   fontSize: 20,
    height: 22,
    color: "white"
  },

  touchAya: {
    position: "absolute",
    borderRadius: 3
  },
  onPressAya: {
    backgroundColor: "#369",
    opacity: 0.5
  },
  onRecordAya: {
    backgroundColor: "#F44",
    opacity: 0.3
  },
  onUnPressAya: {
    // backgroundColor: "#EE2C38",
    opacity: 0.0
  },
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    alignItems: "center",
    justifyContent: "center"
  },
  panel: {
    flex: 1,
    backgroundColor: "white",
    position: "relative"
  },
  panelHeader: {
    height: 120,
    backgroundColor: "#b197fc",
    alignItems: "center",
    justifyContent: "center"
  },
  favoriteIcon: {
    position: "absolute",
    top: -24,
    right: 24,
    backgroundColor: "#2b8a3e",
    width: 48,
    height: 48,
    padding: 8,
    borderRadius: 24,
    zIndex: 1
  },
  fullImgPage: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    right: 0
  }
});
const mapStateToProps = ({ isPickerVisible, wino, rerender }) => ({
  // repoInfo,
  wino,
  isPickerVisible,
  rerender
});

const mapDispatchToProps = {
  togglePicker,
  setExactAya,
  reRender
};
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Core);
