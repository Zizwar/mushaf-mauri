import React, { Component } from "react";
import {
  Container,
  Segment,
  Content,
  Button,
  Body,
  CardItem,
  Footer,
  Card,
  Left,
  Right,
  Icon,
  Text,
  View,
} from "native-base";

import HTMLView from "react-native-htmlview";
import SimplePicker from "react-native-simple-picker";

import {
  getAyatBySuraAya,
  fetchText,
  nextAya,
  prevAya,
  getNameBySura,
  dbs,
  wait,
} from "../functions";
import { getTafsirUri } from "../api";
//import styles from "./styles";
import { connect } from "react-redux";
import { setExactAya, setAuthor, reRender } from "../../reducer";
//
import { listAuthorTafsir } from "../data";
import * as lang from "../../i18n";

import { Headerino } from "../component";
import { isRTL } from "expo-localization";
//
class Tafsir extends Component {
  constructor(props) {
    super(props);
    this.lang = lang[this.props.lang];
    this.state = {
      resault: null,
      items: [],
      text: "",
      id: this.props.author,
      textAya: "",
      sura: 1,
      aya: 1,
      page: 1,
      author: this.lang["tafsir_" + this.props.author],
    };
    this.listDB = [];
    this.listAuthorTafsir = listAuthorTafsir(this.lang);
    this.labels = [];
    this.options = [];
    this.reRender = false; //this.props.reRender?true:false;
    this.dbs = [];

    /*
        this.db = SQLite.openDatabase(
          this.props.author + ".db"
        );
        */
    // this.author = this.props.author
  }
  // async
  async componentDidMount() {
    this.options = this.listAuthorTafsir.map((author) => author.id);
    this.labels = this.listAuthorTafsir.map((author) => author.name);
    const {wino:{sura=1,aya=1}} = this.props;
   // console.log("star porops aya =>",{aya,sura})
    this.setState({aya,sura})

    await this.intialDBAuthor();
  }

  async intialDBAuthor() {
    const { author } = this.props;
    this.dbs = new dbs(author);
    await this.dbs.connect();
    console.log("connect db");
    await wait();
    this.getTafsri();
  }

  getTafsri = async (arg = []) => {
    let { sura, aya } = this.state;
    if (arg.sura) {
      sura = arg.sura;
      aya = arg.aya;
    }
    //console.log("thisdbs getTafsri==> ", this.dbs);
    const { author } = this.props;

    const query = `SELECT * FROM ${author} WHERE sura=${sura} and aya=${aya}`;
 //   console.log({ query });
    if (this.dbs.ping) {
      try {
        await this.dbs.execSql(query).then((_array) => {
       //   console.log("~~THIS is DB Author ", JSON.stringify(_array).substr(0,20));
          if (!_array) return;
          const { text, id, sura, aya } = _array[0];
          if (text)
            this.setState({
              text,
              id,
              sura,
              aya,
            });
        });
      } catch (err) {
        alert(JSON.stringify(err));
      }
    } else {
      console.log("no connect db author=>", author);

      const url = getTafsirUri({ sura, aya, author });
      fetchText(url).then((text) => {
    //    console.log("~~THIS HTTPS", { text });
        this.setState({
          text,
          sura,
          aya,
          
        }).catch((err)=>{
             this.setState({
          text:"",
          sura,
          aya,
          
        })
            alert(JSON.stringify(err))
        });
      });
    }
  };

  goBack = () => {
    const {
      navigation: { goBack },
    } = this.props;
    goBack();
  };

  changeAuthor = async (id) => {
    const { setAuthor } = this.props;
    setAuthor(id);
    const author = this.lang[`tafsir_${id}`];
    await this.intialDBAuthor();
  };
  togl = () => {
    const { reRender } = this.props;
    reRender("tarajem");
    this.goBack();
    // this.setState({isActive})
  };

  render() {
    const { sura, aya, text } = this.state;

    let [, TafsirText] = text.split("|||");
    if (!TafsirText) TafsirText = text;
    const {
      author,
      theme: { color, backgroundColor },
      lang,
    } = this.props;
    return (
      <Container style={{ backgroundColor }}>
        <Headerino
          onPress={() => this.goBack()}
          lang={lang}
          text={this.lang["download_ttarajem"]}
          color={color}
          backgroundColor={backgroundColor}
        />

        <Segment style={{ backgroundColor }}>
          <Button onPress={() => this.togl()} active first>
            <Text style={{ color }}>
              {this.lang["download_ttarajem_tarajem"]}
            </Text>
          </Button>
          <Button style={{ backgroundColor: color }} last>
            <Text style={{ color: backgroundColor }}>
              {this.lang["download_ttarajem_tafaser"]}
            </Text>
          </Button>
        </Segment>
        <Content style={{ backgroundColor }}>
          <Card style={{ backgroundColor }}>
            <CardItem style={{ backgroundColor }} bordered>
              <Left>
                <Body>
                  <Text style={{ color }}>
                    {this.lang["sura_s"]} {getNameBySura({ sura, lang })},{" "}
                    {this.lang["aya"]} {aya}
                  </Text>

                  <Text style={{ color }} note>
                    {
                      this.listAuthorTafsir.filter((itm) => itm.id == author)[0]
                        .name
                    }
                  </Text>
                </Body>
              </Left>
            </CardItem>

            <CardItem style={{ backgroundColor }}>
              <Body style={{ margin: 10 }}>
                <View style={{ flex: 1, backgroundColor }}>
                  <HTMLView
                    value={TafsirText}
                    stylesheet={{
                      p: {
                        //  fontWeight: "200",
                        fontSize: 20,
                        color,
                      },
                    }}
                  />
                </View>
              </Body>
            </CardItem>
          </Card>
        </Content>
        <Footer style={{ backgroundColor }}>
          <Left>
            <Button
              style={{ backgroundColor: color }}
              onPress={() => this.getTafsri(nextAya({ sura, aya }))}
            >
              <Icon
                style={{ color: backgroundColor }}
                name={isRTL ? "md-skip-forward" : "md-skip-backward"}
              />
            </Button>
          </Left>
          <Body style={{ backgroundColor }}>
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
              iconRight
              onPress={() => {
                this.refs.picker.show();
              }}
            >
              <Icon style={{ color }} name="create" />
              <Text style={{ textAlign: "center", color, fontSize: 15 }}>
                {
                  this.listAuthorTafsir.filter((itm) => itm.id == author)[0]
                    .name
                }
              </Text>
            </Button>
          </Body>
          <Right>
            <Button
              style={{ backgroundColor: color }}
              onPress={() => this.getTafsri(prevAya({ sura, aya }))}
            >
              <Icon
                style={{ color: backgroundColor }}
                name={!isRTL ? "md-skip-forward" : "md-skip-backward"}
              />
            </Button>
          </Right>
        </Footer>
        <SimplePicker
          ref={"picker"}
          options={this.options}
          labels={this.labels}
          confirmText={this.lang["confirme"]}
          cancelText={this.lang["cancel"]}
          itemStyle={{
            fontSize: 25,
            color: "#000",
            textAlign: "center",
            fontWeight: "bold",
          }}
          onSubmit={this.changeAuthor}
        />
      </Container>
    );
  }
}
const mapStateToProps = ({ wino, author, lang, fontSize, theme }) => ({
  wino,
  author,
  lang,
  fontSize,
  theme,
});

const mapDispatchToProps = {
  setExactAya,
  setAuthor,
  reRender,
};
export default connect(mapStateToProps, mapDispatchToProps)(Tafsir);
