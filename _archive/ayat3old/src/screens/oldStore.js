import React, { Component } from "react";
import {
  Platform,
  AsyncStorage,
  Alert,
  Slider,
  Picker,
  Dimensions,
  ActivityIndicator,
  ListView
} from "react-native";
import Expo, { FileSystem, Asset, SQLite } from "expo";
import {
  ListItem,
  Container,
  Header,
  Title,
  Content,
  Button,
  List,
  Card,
  CardItem,
  Icon,
  Text,
  CheckBox,
  Badge,
  Left,
  Right,
  Body,
  Switch,
  View,
  Radio,
  Separator,
  Thumbnail
} from "native-base";
import { listAuthorTafsir, listAuthorTarajem } from "../amaken";
//import SimplePicker from "react-native-simple-picker";
//import styles from "./styles";
import HTMLView from "react-native-htmlview";

import * as lang from "../../i18n";
import { connect } from "react-redux";
import {
  setExactAya,
  setAuthor,
  setLang,
  setAwk,
  setMenu,
  setDownload,
  setQuira,
  setOptions,
  setNightly
} from "../../reducer";
import { loadDBTarajem, loadDBTafsir } from "../api";
import Modalino from "../component/modalino";
import StoreItem from "./StoreItem";

const folderSqlit = `${FileSystem.documentDirectory}SQLite`;
async function fetchForSQLit({ source, author }) {
  let folderSqlitInfo = await FileSystem.getInfoAsync(folderSqlit);
  if (!folderSqlitInfo.exists) await FileSystem.makeDirectoryAsync(folderSqlit);

  const output = `${folderSqlit}/${author}.db`;
  const outputExists = await FileSystem.getInfoAsync(output);
  //if (!outputExists.exists) {
  //  alert("deja kayn hada=>" + author);
  //  return { uri: output };
  // }

  console.log("wait download ", { output });

  const downloaded = await FileSystem.downloadAsync(source(author), output);
  console.log({ downloaded });

  folderSqlitInfo = await FileSystem.readDirectoryAsync(folderSqlit);
  console.log("reading from", { folderSqlit }, { folderSqlitInfo });

  return { uri: downloaded.uri };
}
class Store extends Component {
  constructor(props) {
    super(props);
    this.dsListTafsir = new ListView.DataSource({
      rowHasChanged: (r1, r2) => r1 !== r2
    });
    this.dsListTarajem = new ListView.DataSource({
      rowHasChanged: (r1, r2) => r1 !== r2
    });
    this.lang = lang[this.props.lang];
    this.state = {
      selectedItem: undefined,
      lang: this.props.lang,
      loading: false,
      aya: 1,
      sura: 1,
      id: 1,
      text: "",
      listViewDataTafsir: [],
      listViewDataTarajem: [],
      thisIndic: [],
      toglModalStoreItem: false
    };
    this.db = null;
    this.listAuthorTafsir = listAuthorTafsir(this.lang);
    this.listAuthorTarajem = listAuthorTarajem;
  }

  componentDidMount() {
    this.setState({ listViewDataTafsir: this.listAuthorTafsir });
    this.setState({ listViewDataTarajem: this.listAuthorTarajem });
  }
  deleteRowTafsir(secId, rowId, rowMap) {
    rowMap[`${secId}${rowId}`].props.closeRow();
    const newData = [...this.state.listViewDataTafsir];
    newData.splice(rowId, 1);
    this.setState({ listViewDataTafsir: newData });
  }
  deleteRowTarajem(secId, rowId, rowMap) {
    rowMap[`${secId}${rowId}`].props.closeRow();
    const newData = [...this.state.listViewDataTarajem];
    newData.splice(rowId, 1);
    this.setState({ listViewDataTarajem: newData });
  }
  goBack = arg => {
    if (this.props.togl) this.props.togl("close");
    else this.props.navigation.goBack();
    if (this.props.handleMenu) this.props.handleMenu("open");
  };
  //
  setIndic = (author, statement) => {
    this.setState(state => {
      state.thisIndic[author] = statement;
      return state;
    });
  };
  //
  downloadDB = async (tafsirOrTarajem, author) => {
    this.setIndic(author, true);

    //
    this.toglModalStoreItem("open")
    return
    //
    
    console.log("star DOwnload ={", { tafsirOrTarajem, author });
    const source = tafsirOrTarajem == "tarajem" ? loadDBTarajem : loadDBTafsir;
    const finalSource = await fetchForSQLit({ source, author });
    console.log({ finalSource });
    this.setIndic(author, false);
    alert("final dowlad " + author);
  };
  getTestBD = async author => {
    const { sura, aya } = this.props.wino;
    console.log("star intialDBAuthor=>" + author);
    this.intialDBAuthor(author);
    setTimeout(_ => this.getTafsri({ sura, aya }), 5000);
  };
  getTafsri = ({ sura, aya, id }) => {
    console.log("Play query get db ");
    const query = id
      ? "SELECT * FROM  " + "e3rab" + " WHERE id=" + (id + 1)
      : "SELECT * FROM " + "e3rab" + " WHERE sura=" + sura + " and aya=" + aya;
    if (this.db)
      this.db.transaction(tx => {
        tx.executeSql(query, [], (_, { rows: { _array } }) => {
          console.log(JSON.stringify(_array));
          const { text, id, sura, aya } = _array[0];
          if (text)
            this.setState({
              text,
              id,
              sura,
              aya
            });
        });
      });
    else alert("no db");
    this.setState({ loading: false });
  };
  zrem_onPress = async () => {
    const filePath = `${FileSystem.documentDirectory}video/share-movie.mp4`;
    console.log(filePath);
    const res = await FileSystem.downloadAsync(
      "http://techslides.com/demos/sample-videos/small.mp4",
      filePath
    );
    console.log(res);
    const i = await FileSystem.getInfoAsync(res.uri);
    console.log(i);

    const { status } = await Permissions.askAsync(Permissions.CAMERA_ROLL);
    if (status === "granted") {
      try {
        const result = await CameraRoll.saveToCameraRoll(res.uri, "video");
        console.log(result);
      } catch (e) {
        console.warn(JSON.stringify(e));
      }
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

  intialDBAuthor(db) {
    //if(this.db)this.db.close();
    this.db = SQLite.openDatabase(db + ".db");
    // this.db.open();
  }
  renderItemTafsir = (data, i) => (
    <ListItem
      onPress={() => {
        //this.goBack();
        //this.props.setExactAya(data.id);
        this.downloadDB("tafsir", data.id);
      }}
      avatar
    >
      <Left>
        <Button transparent>
          {this.state.thisIndic[data.id] ? (
            <ActivityIndicator animating={true} size={32} />
          ) : (
            <Icon name="flag" />
          )}
        </Button>
      </Left>
      <Body>
        <Text>{data.name}</Text>
      </Body>
      <Right>
        <Text note>id: {data.id}</Text>
      </Right>
    </ListItem>
  );

  renderItemTarajem = (data, i) => (
    <ListItem
      onPress={() => {
        //this.goBack();
        //this.props.setExactAya(data.id);
        this.downloadDB("tarajem", data.id);
      }}
      avatar
    >
      <Button transparent>
        {this.state.thisIndic[data.id] ? (
          <ActivityIndicator animating={true} size={32} />
        ) : (
          <Icon name="flag" />
        )}
      </Button>
      <Body>
        <Text>{data.name}</Text>
      </Body>
      <Right>
        <Text note>id: {data.id}</Text>
      </Right>
    </ListItem>
  );
  //
  toglModalStoreItem = togl => {
    //const {visibleModalSearch} = this.state
    let toglModalStoreItem = !this.state.toglModalStoreItem;
    if (togl == "close") toglModalStoreItem=false;
    if (togl == "open") toglModalStoreItem=true;
    this.setState({ toglModalStoreItem });
  };
  //
  render() {
    const { loading, text } = this.state;

    if (loading) return <ActivityIndicator animating={true} size="large" />;
    const {
      navigation: { navigate }
    } = this.props;
    const br = (
      <View
        style={{
          borderBottomColor: "#ccc",
          borderBottomWidth: 2
        }}
      />
    );
    const modalStoreItem = (
      <Modalino
        togl={this.toglModalStoreItem}
        data={<StoreItem togl={this.toglModalStoreItem} />}
        visible={this.state.toglModalStoreItem}
      />
    );
    return (
      <Container
        style={
          {
            //   backgroundColor: "#FFF"
          }
        }
      >
        <Header>
          <Left>
            <Button transparent onPress={this.goBack}>
              <Icon name="ios-close" />
            </Button>
          </Left>
          <Body>
            <Title>Store</Title>
          </Body>
          <Right />
        </Header>

        <Content>
      {modalStoreItem}
          {br}

          <ListItem icon>
            <Body>
              <Text>Offline</Text>
            </Body>
            <Right>
              <Switch trackColor="#ccc" />
            </Right>
          </ListItem>
          <ListItem icon onPress={_ => navigate("StoreItem")}>
            <Body>
              <Text>Backup</Text>
            </Body>
            <Right>
              <Text>(Import/Export)</Text>
              {Platform.OS === "ios" && <Icon active name="arrow-forward" />}
            </Right>
          </ListItem>
          <Card>
            <CardItem>
              <Body>
                <Text>{text}</Text>
              </Body>
            </CardItem>
          </Card>
          <ListItem icon onPress={_ => navigate("StoreItem")}>
            <Body>
              <Text>Tafsir</Text>
            </Body>
          </ListItem>
          <List
            dataSource={this.dsListTafsir.cloneWithRows(
              this.state.listViewDataTafsir
            )}
            // dataArray={datas}
            renderRow={this.renderItemTafsir}
            renderLeftHiddenRow={data => (
              <Button
                full
                onPress={() => this.getTestBD(data.id)}
                style={{
                  backgroundColor: "#CCC",
                  flex: 1,
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                <Icon active name="information-circle" />
              </Button>
            )}
            renderRightHiddenRow={(data, secId, rowId, rowMap) => (
              <Button
                full
                danger
                onPress={_ => this.deleteRowTafsir(secId, rowId, rowMap)}
                style={{
                  flex: 1,
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                <Icon active name="trash" />
              </Button>
            )}
            leftOpenValue={75}
            rightOpenValue={-75}
          />
          {br}
          <ListItem icon>
            <Body>
              <Text>Tarajem</Text>
            </Body>
          </ListItem>
          <List
            dataSource={this.dsListTarajem.cloneWithRows(
              this.state.listViewDataTarajem
            )}
            // dataArray={datas}
            renderRow={this.renderItemTarajem}
            renderLeftHiddenRow={data => (
              <Button
                full
                onPress={() => this.getTestBD(data.id)}
                style={{
                  backgroundColor: "#CCC",
                  flex: 1,
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                <Icon active name="information-circle" />
              </Button>
            )}
            renderRightHiddenRow={(data, secId, rowId, rowMap) => (
              <Button
                full
                danger
                onPress={_ => this.deleteRowTarajem(secId, rowId, rowMap)}
                style={{
                  flex: 1,
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                <Icon active name="trash" />
              </Button>
            )}
            leftOpenValue={75}
            rightOpenValue={-75}
          />
        </Content>
      </Container>
    );
  }
}

const mapStateToProps = ({
  wino,
  lang,
  awk,
  download,
  menu,
  options,
  nightly,
  quira
}) => ({
  wino,
  download,
  awk,
  lang,
  menu,
  options,
  nightly,
  quira
});

const mapDispatchToProps = {
  setExactAya,
  setAuthor,
  setLang,
  setAwk,
  setMenu,
  setDownload,
  setOptions,
  setNightly,
  setQuira
};
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Store);
