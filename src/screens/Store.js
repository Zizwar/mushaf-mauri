import React, { Component } from "react";
import {
  Dimensions,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Image,
  Alert,
  ProgressBarAndroid,
} from "react-native";

import {
  View,
  Body,
  List,
  ListItem,
  ScrollableTab,
  Tab,
  Button,
  Icon,
  TabHeading,
  Tabs,
  Left,
  Right,
} from "native-base";
import * as FileSystem from "expo-file-system";
import { listAuthorTafsir, listAuthorTarajem, listPage } from "../data";

import * as lang from "../../i18n";
import { connect } from "react-redux";
import {
  setAuthor,
  setLang,
  setDownloads,
  setQuira,
  setOptions,
  setTarajemDB,
} from "../../reducer";
import {
  loadDBTarajem,
  getAudioMoqriUri,
  loadDBTafsir,
  getImagePageUri,
} from "../api";
import Modalino from "../component/modalino";
import { Headerino } from "../component";
import StoreItem from "./StoreItem";
import { id2aya, wait } from "../functions";

const DIR = FileSystem.documentDirectory;
const folderSqlit = `${DIR}SQLite`;
const folderTilawat = `${DIR}tilawat`;
const NUM_PAGE = 639;

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const IMAGE_HEIGHT = 250;

class Store extends Component {
  //________
  constructor(props) {
    super(props);

    this.lang = lang[this.props.lang];
    this.THEME_COLOR = "#007aff"; //this.props.theme.color;
    this.FADED_THEME_COLOR = "#007affc4"; // this.props.theme.color+"c4";
    this._flatList = [];
    this.state = {
      downProgress: 0,
      selectedItem: undefined,
      lang: this.props.lang,
      loading: false,
      aya: 1,
      sura: 1,
      id: 1,
      text: "",
      listViewDataTafsir: [],
      listViewDataTarajem: [],
      listViewDataPage: [],
      thisIndic: [],
      thisLoading: [],
      toglModalStoreItem: false,
      author: null,
      tafsirOrTarajem: null,
      description: TEST_DESCRIPTION,
      loadingItem: false,
      nameTabe: "Store",
      fullName: null,
    };
    this.db = null;
    this.listAuthorTafsir = listAuthorTafsir(this.lang);
    this.listViewDataPage = listPage(this.lang);
    this.listAuthorTarajem = listAuthorTarajem;
  }
  /*
    componentWillMount() {
      //this.creatflders(folderHafs);
      this.creatflders(folderTilawat);
      this.checkFolderTarajem();
    }*/
  async fetchForSQLit({ source, author }) {
    let folderSqlitInfo = await FileSystem.getInfoAsync(folderSqlit);
    if (!folderSqlitInfo.exists)
      await FileSystem.makeDirectoryAsync(folderSqlit);
    const output = `${folderSqlit}/${author}.db`;
    //const outputExists = await FileSystem.getInfoAsync(output);
    //if (!outputExists.exists) {
    //  alert("deja kayn hada=>" + author);
    //  return { uri: output };
    // }
    //console.log("wait download ", { output });
    const downloaded = await FileSystem.downloadAsync(source(author), output);
    // console.log({ downloaded });
    folderSqlitInfo = await FileSystem.readDirectoryAsync(folderSqlit);
    // console.log("reading from", { folderSqlit }, { folderSqlitInfo });
    this.props.setTarajemDB(folderSqlitInfo);
    this.setIndic(author, false);
    return { uri: downloaded.uri };
  }
  async isExistFile(file) {
    const folderSqlitInfo = await FileSystem.getInfoAsync(file);
    return folderSqlitInfo.exists;
  }
  async checkFolderTarajem() {
    let folderSqlitInfo = await FileSystem.getInfoAsync(folderSqlit);
    if (!folderSqlitInfo.exists)
      await FileSystem.makeDirectoryAsync(folderSqlit);
    folderSqlitInfo = await FileSystem.readDirectoryAsync(folderSqlit);
    // console.log("reading from", { folderSqlitInfo });
    this.props.setTarajemDB(folderSqlitInfo);
  }
  async creatflders(folder) {
    let folderInfo = await FileSystem.getInfoAsync(folder);
    if (!folderInfo.exists) await FileSystem.makeDirectoryAsync(folder);
    return true;
  }
  confirm(cb, text = "") {
    Alert.alert(
      this.lang["remove"],
      text,
      [
        {
          text: this.lang["cancel"],
          onPress: () => console.log("Cancel Pressed"),
          style: "cancel",
        },
        {
          text: this.lang["alert_ok"],
          onPress: cb,
        },
      ],
      { cancelable: false }
    );
  }
  async deleteflders(folder, quira) {
    // alert(folder)
    const { setDownloads } = this.props;
    if (quira) setDownloads(0, quira);
    await FileSystem.deleteAsync(folder);
    const exits = await this.isExistFile(folder);
    if (!exits) alert("yes remove :)");
    else alert("opps!! not rm file");
    //this.checkFolderTarajem();
    //  if (folderInfo.exists) return alert("not remove");
    //alert("yes delte :)")
    // return true
  }
  componentDidMount() {
    this.creatflders(folderTilawat);
    this.checkFolderTarajem();
    this.setState({ listViewDataTafsir: this.listAuthorTafsir });
    this.setState({ listViewDataTarajem: this.listAuthorTarajem });
    this.setState({ listViewDataPage: this.listViewDataPage });
  }

  deleteRowTafsir(id) {
    const newData = [...this.state.listViewDataTafsir];
    newData.splice(id, 1);
    this.setState({ listViewDataTafsir: newData });
  }
  deleteRowTarajem(id) {
    const newData = [...this.state.listViewDataTarajem];
    newData.splice(id, 1);
    this.setState({ listViewDataTarajem: newData });
  }
  goBack = () => {
    if (this.props.togl) this.props.togl("close");
    else this.props.navigation.goBack();
    if (this.props.handleMenu) this.props.handleMenu("open");
  };
  //
  setIndic = (author, statement) => {
    this.setState((state) => {
      state.thisIndic[author] = statement;
      state.loadingItem = statement;

      return state;
    });
  };

  //
  openModalStorTafisrTarajem = (tafsirOrTarajem, data) => {
    const author = data.id;
    const fullName = data.name;
    this.setState({
      tafsirOrTarajem,
      fullName,
      author,
    });
    this.downloadDB(tafsirOrTarajem, author);
  };
  openModalStorPage = ({ id }) => {
    // this.setState({author:id});
    this.downloadImagesPage(id);
    //this.toglModalStoreItem("open");
  };
  downloadDB = async (tafsirOrTarajem, author) => {
    //const { tafsirOrTarajem, author } = this.state;

    if (this.isExistTarajem(author)) return alert("file exist");

    this.setIndic(author, true);
    //
    // this.toglModalStoreItem("open");
    // return;
    //
    console.log("star DOwnload ={", { tafsirOrTarajem, author });
    const source =
      tafsirOrTarajem == this.lang["download_ttarajem_tarajem"]
        ? loadDBTarajem
        : loadDBTafsir;

    const finalSource = await this.fetchForSQLit({ source, author });
    console.log({ finalSource });
    this.setIndic(author, false);
    // const tmp = this.state.thisLoading.map(x=>x);

    //setDownloads(tmp);

    console.log({ downloadz: this.state.thisLoading });

    alert(this.lang["download_compBu"]);
  };

  isExistFloder = async (folder) => {
    const folderInfo = await FileSystem.getInfoAsync(folder);
    //console.log(">>>>>>",folderInfo)
    if (folderInfo.exists) return true;
    return false;
  };
  old_downloadImagesPage = async (quira) => {
    const folderQuira = DIR + quira;
    let page = this.isExistPage(quira) || 0;
    const { setDownloads } = this.props;

    if (NUM_PAGE === page) return alert("exist page");

    this.setIndic(quira, true);
    // await FileSystem.makeDirectoryAsync(folderQuira);
    await this.creatflders(folderQuira);
    console.log("play download image ");
    //download all image
    const listNumImg = [...Array(NUM_PAGE - page).keys()];
    const itemChunk = listNumImg.map(async () => {
      // console.log({ uri });

      if (
        page === 10 ||
        page === 50 ||
        page === 100 ||
        page === 200 ||
        page === 400 ||
        page > 600
      )
        setTimeout((_) => {
          setDownloads(page, quira);
          console.log(
            "save",
            "setTimeout(_=>setDownloads(page, quira),page)",
            { quira },
            page
          );
        }, page / 2);
      page++;
      this.setState({ downProgress: page });
    });

    //
    await Promise.all(itemChunk)
      .then(async (arrayOfValuesOrErrors) => {
        this.setIndic(quira, false);
        console.log({ arrayOfValuesOrErrors });
        const infoFolde = await FileSystem.readDirectoryAsync(folderQuira);
        console.log("=========================", { infoFolde });
      })
      .catch((err) => {
        alert(err);
        console.log(err.message); // some coding error in handling happened
      });
    // setDownloads(page, quira);
    //setDownloads(this.downloads);
  };
  downloadImagesPage = async (quira) => {
    const folderQuira = DIR + quira;
    let page = this.isExistPage(quira) || 0;
    const { setDownloads } = this.props;
    //const exist = await this.creatflders(folderQuira);

    if (NUM_PAGE === page) return alert("exist page");

    this.setIndic(quira, true);
    // await FileSystem.makeDirectoryAsync(folderQuira);
    await this.creatflders(folderQuira);
    console.log("play download image ");
    //download all image
    //  const listNumImg = [...Array(NUM_PAGE - page).keys()];
    const listNumImg = [...Array(NUM_PAGE).keys()];
    const itemChunk = listNumImg.map((id_) => {
      const id = id_;
      const uri = getImagePageUri({ id, quira });
      const file = `${folderQuira}/${id}.png`;
      //console.log("download=>", { uri });
      return FileSystem.downloadAsync(uri, file);
    });
    //
    for (let ii = page; ii < NUM_PAGE + 1; ii++) {
      const forItemChunk = itemChunk.slice(ii, ii + 5);
      try {
        const results = await Promise.all(forItemChunk)
          .then(async (arrayOfValuesOrErrors) => {
            console.log({ arrayOfValuesOrErrors });
            //      this.setIndic(quira, false);
            // const infoFolde = await FileSystem.readDirectoryAsync(folderQuira);
            //  console.log("=========================", { infoFolde });
            this.setState({ downProgress: ii });
          })
          .catch((err) => {
            alert(err);
            console.log(err.message); // some coding error in handling happened
          });
        console.log("en fin =>", { results });
      } catch (err) {
        console.log("catchError==>", err);
      }
      console.log(":::wait:::");
      await wait(100);
      setDownloads(ii, quira);
    }
    this.setIndic(quira, false);
    const infoFolde = await FileSystem.readDirectoryAsync(folderQuira);
    console.log("Finality::=>", { infoFolde });

    // ;
    //setDownloads(this.downloads);
  };

  downloadVoice = async () => {
    const folder = DIR + "Husary_64kbps"; //"Hudhaify_64kbps";//moqri;
    const folderInfo = await FileSystem.getInfoAsync(folder);
    if (!folderInfo.exists) await FileSystem.makeDirectoryAsync(folder);
    //await this.creatflders(path)
    console.log("play download audio Moqri  ");
    //download all image
    const listNumImg = [...Array(11).keys()];
    const itemChunk = listNumImg.map(async (index) => {
      if (index) {
        const id = id2aya(index, true);
        const uri = getAudioMoqriUri({ id });
        console.log({ uri });
        const downloadedQuira = await FileSystem.downloadAsync(
          uri,
          folder + "/" + id + ".mp3"
        );
        console.log({ downloadedQuira });
      }
    });
    await Promise.all(itemChunk)
      .then(async (arrayOfValuesOrErrors) => {
        console.log({ arrayOfValuesOrErrors });
        const infoFolde = await FileSystem.readDirectoryAsync(folder);
        console.log("=========================", { infoFolde });
      })
      .catch((err) => {
        alert(err);
        console.log(err.message); // some coding error in handling happened
      });

    return;
  };
  isExistTarajem = (db) => {
    const { tarajemDB } = this.props;
    //console.log("it ",{tarajemDB});
    if (tarajemDB.includes(db + ".db")) return true;
    return false;
  };
  isExistPage = (quira) => {
    const {
      downloadsWarsh,
    } = this.props;

    switch (quira) {
      
      case "warsh":
        return downloadsWarsh;
        return 0;
    }
  };

  //
  /*
    const DB_PATH = `${FileSystem.documentDirectory}SQLite/my.db`
    FileSystem.downloadAsync(
    'http://techslides.com/demos/sample-videos/small.mp4',
    DB_PATH//FileSystem.documentDirectory + 'small.mp4'
    )
    .then(({ uri }) => {
      console.log('Finished downloading to ', uri);
    })
    .catch(error => {
      console.error(error);
    });
    */

  //

  //
  toglModalStoreItem = (togl) => {
    //const {visibleModalSearch} = this.state
    let toglModalStoreItem = !this.state.toglModalStoreItem;
    if (togl == "close") toglModalStoreItem = false;
    if (togl == "open") toglModalStoreItem = true;
    this.setState({ toglModalStoreItem });
  };
  //*******
  //nScroll = new Value(0);
  // scroll = new Value(0);
  //textColor = this.props.theme.color;
  /*this.scroll.interpolate({
      inputRange: [0, SCROLL_HEIGHT / 5, SCROLL_HEIGHT],
      outputRange: [this.THEME_COLOR, this.FADED_THEME_COLOR, "white"],
      extrapolate: "clamp"
    });*/
  // tabBg = this.props.theme.backgroundColor;
  /* this.scroll.interpolate({
       inputRange: [0, SCROLL_HEIGHT],
       outputRange: ["white", this.THEME_COLOR],
       extrapolate: "clamp"
     });*/

  tabContent = (arg) => {
    this._flatList = this.listViewDataTafsir;
    switch (arg) {
      case "tafsir":
        this._flatList = this.listViewDataTafsir;
        break;
      case "tarajem":
        this._flatList = this.listViewDataTarajem;
        break;
      case "page":
        this._flatList = this.listViewDataPage;
        break;
    }
    let s_flatList = [];
    this._flatList.forEach((data) =>
      s_flatList.push(
        <ListItem
          key={data.id}
          onPress={() => {
            this.downloadDB(arg, data.id);
          }}
          // onPress={_ => this.downloadVoice(data.id)}
        >
          <Button transparent>
            {this.state.thisIndic[data.id] ? (
              <ActivityIndicator animating={true} size={32} />
            ) : (
              <Icon name="mdt-book" />
            )}
          </Button>
          <Body>
            <Text>{data.name}</Text>
          </Body>
        </ListItem>
      )
    );

    return (
      <View style={{ height: this.state.height }}>
        <List>{_flatList}</List>
      </View>
    );
  };

  render() {
    const {
      tafsirOrTarajem,
      author,
      description,
      toglModalStoreItem,
      loadingItem,
      fullName,
    } = this.state;

    const {
      theme: { color, backgroundColor },
      lang,
    } = this.props;
    const renderItemTafsir = (data) => (
      <ListItem
        style={{ backgroundColor }}
        onPress={() => {
          //this.goBack();
          //this.props.setExactAya(data.id);
          this.openModalStorTafisrTarajem(
            this.lang["bu_download_ttarajem"],
            data
          );
          //this.downloadVoice(data.id);
        }}
        avatar
      >
        <Left>
          <Button
            transparent
            onPress={() => {
              if (this.isExistTarajem(data.id))
                this.confirm(
                  () => this.deleteflders(`${folderSqlit}/${data.id}.db`),
                  data.name
                );
              // this.setIndic(data.id,true);
            }}
          >
            {this.isExistTarajem(data.id) ? (
              <Icon name="ios-close-circle-outline" />
            ) : this.state.tafsirOrTarajem ==
                this.lang["download_ttarajem_tarajem"] &&
              this.state.thisIndic[data.id] ? (
              <ActivityIndicator animating={true} size={32} />
            ) : (
              <Icon name="download" style={{ color }} />
            )}
          </Button>
        </Left>
        <Body>
          <Text style={{ color }}>{data.name}</Text>
        </Body>
        <Right />
      </ListItem>
    );

    const renderItemTarajem = (data) => (
      <ListItem
        style={{ backgroundColor }}
        transparent
        onPress={() => {
          //this.goBack();
          //this.props.setExactAya(data.id);
          this.openModalStorTafisrTarajem(
            this.lang["download_ttarajem_tarajem"],
            data
          );
        }}
        avatar
      >
        <Button
          transparent
          onPress={() => {
            if (this.isExistTarajem(data.id))
              this.confirm(
                () => this.deleteflders(`${folderSqlit}/${data.id}.db`),
                data.name
              );
            //this.setIndic(data.id,true);
          }}
        >
          {this.isExistTarajem(data.id) ? (
            <Icon name="ios-close-circle-outline" style={{ color }} />
          ) : this.state.tafsirOrTarajem ==
              this.lang["download_ttarajem_tarajem"] &&
            this.state.thisIndic[data.id] ? (
            <ActivityIndicator animating={true} size={32} />
          ) : (
            <Icon name="book" style={{ color }} />
          )}
        </Button>
        <Body>
          <Text style={{ color }}>{data.name}</Text>
        </Body>
        <Right />
      </ListItem>
    );
    const renderItemPage = (data) => (
      <ListItem
        style={{ backgroundColor }}
        onPress={() => {
          //this.deleteflders(DIR+data.id)
          //this.goBack();
          //this.props.setExactAya(data.id);
          // this.openModalStorPage(data);
          this.downloadImagesPage(data.id);
        }}
        avatar
      >
        <Button
          transparent
          onPress={() => {
            if (this.isExistPage(data.id) === NUM_PAGE)
              this.confirm(
                () => this.deleteflders(DIR + data.id, data.id),
                data.name
              );
            else this.downloadImagesPage(data.id);
          }}
        >
          {this.isExistPage(data.id) === NUM_PAGE ? (
            <Icon name="ios-close-circle-outline" style={{ color }} />
          ) : this.state.thisIndic[data.id] ? (
            <ActivityIndicator animating={true} size={32} />
          ) : this.isExistPage(data.id) ? (
            <Icon name="ios-close-circle-outline" style={{ color }} />
          ) : (
            <Icon name="download" style={{ color }} />
          )}
        </Button>
        {this.isExistPage(data.id) && this.isExistPage(data.id) !== NUM_PAGE ? (
          <Button
            transparent
            onPress={() => {
              this.downloadImagesPage(data.id);
            }}
          >
            <Icon style={{ color }} name="pause" />
            <Text style={{ color }}>
              {this.isExistPage(data.id)}/{NUM_PAGE}
            </Text>
          </Button>
        ) : null}
        {this.state.thisIndic[data.id] && (
          <ProgressBarAndroid
            styleAttr="Horizontal"
            indeterminate={false}
            progress={this.state.downProgress / NUM_PAGE}
          />
        )}
        <Body>
          <Text style={{ color }}>{data.name}</Text>
        </Body>
        <Right />
      </ListItem>
    );
    const modalStoreItem = (
      <Modalino
        togl={this.toglModalStoreItem}
        data={
          <StoreItem
            togl={this.toglModalStoreItem}
            description={description}
            downloadDB={this.downloadDB}
            testDB={this.downloadVoice}
            title={tafsirOrTarajem}
            name={author}
            fullName={fullName}
            loadingItem={loadingItem}
          />
        }
        visible={toglModalStoreItem}
      />
    );
    return (
      <View>
        {modalStoreItem}
        <View
          style={{
            position: "absolute",
            width: "100%",
            backgroundColor,
            zIndex: 1,
          }}
        >
          <Headerino
            onPress={() => this.goBack()}
            lang={lang}
            text={this.lang["bu_download_cnt"]}
            color={color}
            backgroundColor={backgroundColor}
          />
        </View>
        <ScrollView
          scrollEventThrottle={5}
          showsVerticalScrollIndicator={false}
          style={{ zIndex: 0 }}
          style={{ backgroundColor }}
        >
          <View
            style={{
              backgroundColor,
              alignItems: "center",
              //    alignSelf:"center",
            }}
          >
            <Image
              source={require("../../assets/download.png")}
              style={{
                height: IMAGE_HEIGHT,
                width: 400,

                tintColor: this.props.theme.color,
              }}
            />
          </View>
          <Tabs
            prerenderingSiblingsNumber={3}
            renderTabBar={(props) => (
              <View
                style={{
                  zIndex: 1,
                  width: "100%",
                  backgroundColor,
                }}
              >
                <ScrollableTab
                  {...props}
                  renderTab={(name, page, active, onPress, onLayout) => (
                    <TouchableOpacity
                      key={page}
                      onPress={() => onPress(page)}
                      onLayout={onLayout}
                      activeOpacity={0.4}
                    >
                      <View
                        style={{
                          flex: 1,
                          height: 100,
                          backgroundColor,
                        }}
                      >
                        <TabHeading
                          scrollable
                          style={{
                            backgroundColor: "transparent",
                            width: SCREEN_WIDTH / 3,
                          }}
                          active={active}
                        >
                          <Text
                            style={{
                              fontWeight: active ? "bold" : "normal",
                              color,
                              fontSize: 14,
                            }}
                          >
                            {name}
                          </Text>
                        </TabHeading>
                      </View>
                    </TouchableOpacity>
                  )}
                  //underlineStyle={{ backgroundColor: this.textColor }}
                />
              </View>
            )}
          >
            <Tab
              style={{ backgroundColor }}
              heading={this.lang["download_ttarajem_tarajem"]}
            >
              <List
                dataArray={this.state.listViewDataTarajem}
                // dataArray={datas}
                renderRow={renderItemTarajem}
                renderLeftHiddenRow={() => <Button full></Button>}
                leftOpenValue={75}
                rightOpenValue={-75}
              />
            </Tab>
            <Tab
              style={{ backgroundColor }}
              heading={this.lang["bu_download_ttarajem"]}
            >
              <List
                dataArray={this.state.listViewDataTafsir}
                // dataArray={datas}
                renderRow={renderItemTafsir}
              />
            </Tab>
            <Tab style={{ backgroundColor }} heading={this.lang["pages"]}>
              <List
                dataArray={this.state.listViewDataPage}
                // dataArray={datas}
                renderRow={renderItemPage}
              />
            </Tab>
          </Tabs>
        </ScrollView>
      </View>
    );
  }
}

const TEST_DESCRIPTION = `
من اهم التفاسير الاثرية، 
مع وجازة لفظه وشمول معانيه، وقد جعل الله له قبولا عظيما بين الناس،
خاصة وعامة. ومن أهم مميزات تفسير ابن كثير رحمه الله : اختياره أحسن الطرق في تفسير القرآن
مثل تفسير القرآن بالقرآن وتفسير القرآن بالسنة وتفسير القرآن بأقوال الصحابة والتابعين . اهتمامه باللغة وعلومها وأهتمامه بالأسانيد ونقدها .. أهتمامه بذكر القراءات واسباب النزول .. قال السيوطي : وله ( أي ابن كثير ) التفسير الذي لم يؤلف على نمطه مثله . وقال الشوكاني : وله التفسير المشهور وهو في مجلدات وقد جمع في فأوعى ونقل المذاهب والأخبار .. وقال أحمد شاكر في عمدة التفسير عن الحافظ ابن كثير
: وبعد فإن تفسير الحافظ ابن كثير أحسن التفاسير التي رأينا ، وأجودها وأدقها بعد تفسير إمام المفسيرين أبي جعفر الطبري`;
///
const mapStateToProps = ({
  wino,
  lang,
  author,

  downloadsWarsh,

  options,
  quira,
  imagesDB,
  tarajemDB,
  theme,
}) => ({
  wino,
  downloadsWarsh,
  author,
  lang,
  options,
  quira,
  imagesDB,
  tarajemDB,
  theme,
});

const mapDispatchToProps = {
  setAuthor,
  setLang,
  setDownloads,
  setOptions,
  setTarajemDB,
  setQuira,
};
export default connect(mapStateToProps, mapDispatchToProps)(Store);
