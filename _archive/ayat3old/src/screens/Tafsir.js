import Expo from "expo";

import * as FileSystem from "expo-file-system";
import React, { Component } from "react";
import {
  Container,
  Header,
  Segment,
  Title,
  Content,
  Button,
  Item,
  //Label,
  Col,
  Input,
  Body,
  CardItem,
  Footer,
  Card,
  List,
  ListItem,
  Left,
  Right,
  Icon,
  Form,
  Text,
  H3,
  H2,
  View
} from "native-base";
import { SQLite } from "expo-sqlite";

import {
  ScrollView,
  Image,
  TouchableNativeFeedback,
  StyleSheet
} from "react-native";
import HTMLView from "react-native-htmlview";
import SimplePicker from "react-native-simple-picker";
import ModalSelector from "react-native-modal-selector";

import {
  pageToSuraAya,
  getAyatBySuraAya,
  fetchText,
  fetchJSON,
  nextAya,
  prevAya
} from "../functions";
import { getTarjama, getTafsirUri } from "../api";
//import styles from "./styles";
import { connect } from "react-redux";
import {
  setExactAya,
  setAuthor,
  setLang,
  setAwk,
  setMenu,
  setDownload,
  setOption,
  reRender
} from "../../reducer";
//
import { listAuthorTafsir } from "../amaken";
import * as lang from "../../i18n";

import SuraAya from "../component/modalino";
//
class Tafsir extends Component {
  constructor(props) {
    super(props);
    this.lang = lang[this.props.lang];
    this.state = {
      searchText: "",
      resault: null,
      items: [],
      text: "",
      id: this.props.author,
      textAya: "",
      sura: 1,
      aya: 1,
      page: 1,
      author: this.lang["tafsir_" + this.props.author]
    };
 this.listDB = [];
    this.listAuthorTafsir = listAuthorTafsir(this.lang);
    this.labels = [];
    this.options = [];
    this.reRender = false; //this.props.reRender?true:false;
    /*
    this.db = SQLite.openDatabase(
      this.props.author + ".db"
    );
    */
    // this.author = this.props.author
  }

  // async
  async componentWillMount() {
    const { sura, aya } = this.props.wino;
    const page = getAyatBySuraAya(this.props.wino).page;

    this.setState({
      sura,
      page,
      aya
    });
    /*
    this.listAuthorTafsir = this.listAuthorTafsir.map((author, key) => ({
      key,
      label: author.name,
      id: author.id
    }));
    
    */ 
    this.options = this.listAuthorTafsir.map(author => author.id);
    this.labels = this.listAuthorTafsir.map(author => author.name);

    const folderSqlit = `${FileSystem.documentDirectory}SQLite`;
let folderSqlitInfo = await FileSystem.getInfoAsync(folderSqlit);
  if (folderSqlitInfo.exists)
    this.listDB = await FileSystem.readDirectoryAsync(folderSqlit);
//    console.log({ ALLDB: this.listDB });
    //const author = this.lang["tafsir_" + this.props.author]
  
    /*  this.labels = this.listAuthorTafsir.map(author => {
    if(folderSqlitInfo.includes(author+".db")){
      alert("yes find=>"+author)
      return author.name +"(Local)";
    }
      return author.name;
    });*/
    this.intialDBAuthor();

    //const wino1 = getAyatBySuraAya(this.props.wino).page;
  }

  componentDidMount() {
    // this.getTafsri(this.props.wino);
  }
  componentDidUpdate() {
    return;
    if (!this.reRender) return;
    // this.reRender = false
    const { sura: sura_, aya: aya_ } = this.state;
    const { sura, aya } = this.props.wino;
    if (aya == aya_ && sura == sura_) return;
    this.getTafsri({ sura, aya });
    console.log("tafsir async update");
  }
  async intialDBAuthor() {
    const { author } = this.props;
    if (this.listDB.includes(author + ".db"))
      this.db = await SQLite.openDatabase(author + ".db");
     else {
       this.db = null;
    const { sura, aya, id } = this.state;
    setTimeout(_ => this.getTafsri({ sura, aya, id }), 200);
     }
  }

  /*getFetch = () => {
    let page = this.state.page;
    const { sura: b_sura, aya: b_aya } = pageToSuraAya(page);
    const pagez = page + 1;
    page = pagez > 604 ? 1 : pagez;
    const { sura: e_sura, aya: e_aya } = pageToSuraAya(pagez);
    console.log({ b_sura, b_aya, e_sura, e_aya });
    const resault = getTarjama({ b_sura, b_aya, e_sura, e_aya });
    console.log({ resault });
    //
    //this.getTafsri({ sura, aya });
  };*/

  getTafsri = ({ sura, aya, id }) => {
    console.log("THIS DB EXIST== ", this.db);
    const author = this.props.author;
    //id ? id : this.state.id; //"sa3dy";
    const wino = sura
      ? { sura, aya, author }
      : { sura: this.state.sura, aya: this.state.aya, author };

    if (!this.listDB.includes(author + ".db") || !this.db) {
      console.log({ wino });
      const url = getTafsirUri(wino);
      fetchText(url).then(text => {
        console.log("~~THIS HTTPS", { text });
        this.setState({
          text,
          sura,
          aya,
          searchText: sura + "," + aya
        });
      });
      return;
    }
    /*
    const text = getTafsirUri({ sura, aya });
    if (text) {
      this.setState({
        text,
        id,
        sura,
        aya,
        searchText: sura + "," + aya
      });
    } else {
      alert(text);
    }
    return;
    */
    const query = id
      ? "SELECT * FROM  " + author + " WHERE id=" + (id + 1)
      : "SELECT * FROM " + author + " WHERE sura=" + sura + " and aya=" + aya;
    if (this.db)
      this.db.transaction(tx => {
        tx.executeSql(query, [], (_, { rows: { _array } }) => {
          console.log("~~THIS is DB", JSON.stringify(_array));
          if (!_array) return;
          const { text, id, sura, aya } = _array[0];
          if (text)
            this.setState({
              text,
              id,
              sura,
              aya,
              searchText: sura + "," + aya
            });
        });
      });
    else alert("err db");
  };

  search = text => {
    const [sura, aya] = text.split(",");
    this.getTafsri({ sura, aya });
  };
  goBack = arg => {
    if (this.props.togl) this.props.togl("close");
    else this.props.navigation.goBack();
    if (this.props.handleMenu) this.props.handleMenu("open");
  };
  rem_changeAuthor = ({ label, id }) => {
    this.props.setAuthor(id);
    const author = this.lang["tafsir_" + id];
    this.setState({ author, id });
    const { aya, sura } = this.state;
    this.getTafsri({ aya, sura, id });
  };
  changeAuthor = id => {
    const { aya, sura } = this.state;
    this.props.setAuthor(id);
    const author = this.lang["tafsir_" + id];
    this.setState({ author, id });
    this.intialDBAuthor();
    this.getTafsri({ aya, sura, id });
  };
  togl = () => {
    const {  reRender } = this.props;
    reRender("tarajem")
  this.goBack();
   // this.setState({isActive})
  }

  render() {
    const { searchText, sura, aya, id, text,  } = this.state;

    let [ayaText, TafsirText] = text.split("|||");
    if (!TafsirText) TafsirText = text;
    const { togl, fontSize,author } = this.props;
    return (
      <Container>
        <Header>
          <Left>
            <Button transparent onPress={() => this.goBack()}>
              <Icon name={togl ? "ios-arrow-down" : "ios-close"} />
            </Button>
          </Left>
          <Body>
            <H3 style={{color:"#fff"}}>{this.lang["download_ttarajem"]}</H3>
          </Body>
          
        </Header>
        <Segment>
              <Button onPress={()=>this.togl()} active first ><Text>{this.lang["download_ttarajem_tarajem"]}</Text></Button>
              <Button   last ><Text>{this.lang["download_ttarajem_tafaser"]}</Text></Button>
            </Segment>
        <Content style={{ paddingButtom: 100 }}>
         
          <Card style={{ marginBottom: 15 }}>
            <CardItem bordered>
              <Left>
                <Body>
                  <Text>
                    {this.lang["sura_s"]}: {sura}, {this.lang["aya"]}: {aya}
                  </Text>
                  
                  <Text note>{this.listAuthorTafsir.filter((itm)=>itm.id==author)[0].name}</Text>
                </Body>
              </Left>
            </CardItem>
          </Card>
          <Card style={{ marginBottom: 15 }}>
            <CardItem bordered>
              <Body style={{ margin: 10 }}>
                <View style={{ flex: 1 }}>
                   <HTMLView
                    value={TafsirText}
                    stylesheet={{
                      p: {
                      //  fontWeight: "200",
                        fontSize,
                        color: "#555"
                      }
                    }}
                  />
                </View>
              </Body>
            </CardItem>
          </Card>
        </Content>
        <Footer>
          <Left>
            <Button
              
              onPress={() => this.getTafsri(nextAya({ sura, aya }))}
            >
              <Icon  name="md-skip-backward" />
            </Button>
          </Left>
          <Body>
            {/*
            <ModalSelector
              data={this.listAuthorTafsir}
              initValue={author}
              onChange={this.changeAuthor}
              
              selectTextStyle={{ color: "#fff" }}
              // supportedOrientations={["landscape"]}
              // accessible={true}
              // scrollViewAccessibilityLabel={"Scrollable options"}
              // cancelButtonAccessibilityLabel={"Cancel Button"}
            />
            */}

            <Button
              transparent
              onPress={() => {
                this.refs.picker.show();
              }}
            >
              <Title style={{ textAlign: "center",color: "#007aff" }}>::{this.listAuthorTafsir.filter((itm)=>itm.id==author)[0].name}::</Title>
            </Button>
          </Body>
          <Right>
            <Button
              
              onPress={() => this.getTafsri(prevAya({ sura, aya }))}
            >
              <Icon name="md-skip-forward" />
            </Button>
          </Right>
        </Footer>
        <SimplePicker
          ref={"picker"}
          options={this.options}
          labels={this.labels}
          itemStyle={{
            fontSize: 25,
            color: "#000",
            textAlign: "center",
            fontWeight: "bold"
          }}
          onSubmit={this.changeAuthor}
        />
      </Container>
    );
  }
}
const styleHTML = StyleSheet.create({
  p: {
    // fontWeight: '300',
    fontSize: 20,
    color: "#555"
  }
});
const mapStateToProps = ({ wino, author, lang ,fontSize}) => ({
  wino,
  author,
  lang,
  fontSize
});

const mapDispatchToProps = {
  setExactAya,
  setAuthor,
  reRender
};
export default connect(mapStateToProps, mapDispatchToProps)(Tafsir);
