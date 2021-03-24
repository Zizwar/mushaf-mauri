import React, { Component } from "react";

import { Dimensions, Image, ActivityIndicator, StyleSheet } from "react-native";

import {
  CardItem,
  Card,
  Text,
  Right,
  Content,
  Header,
  Left,
  Icon,
  Thumbnail,
  Item,
  Grid,
  View,
  Col,
  H3,
  Body,
  Footer,
  Switch,
  Container,
  Button,
 Title
  
} from "native-base";

import { getAyatBySuraAya, allSuwar, getAllAyaSuraBySura } from "../functions";

import SuraAya from "../component/modalino";
import ModalSelector from "react-native-modal-selector";
import { connect } from "react-redux";
import { setExactAya, setRepeat, setTekrar, setPlayer } from "../../reducer";
import * as lang from "../../i18n";
const { width, height } = Dimensions.get("window");
const arrStart = [1, 2, 3, 4, 5, 6, 7];
class Reciting extends Component {
  constructor(props) {
    super(props);
    this.state = {
      listAllAyaStart: arrStart,
      listAllAyaEnd: arrStart,
      ayaStart: 1,
      suraStart: 1,
      repeat: 0,
      ayaEnd: 7,
      suraEnd: 1
    };
    this.lang = lang[this.props.lang];
    this.listSura = allSuwar(this.props.lang);
  }
  UNSAFE_componentWillMount() {}

  //
  onChangeSuraStart = option => {
    console.log("change aya start to ", { option });
    const suraStart = option.id;
    const listAllAyaStart = getAllAyaSuraBySura(suraStart);

    this.setState({ suraStart, listAllAyaStart });
  };

  onChangeSuraEnd = option => {
    console.log("change aya End to ", { option });
    const suraEnd = option.id;
    const listAllAyaEnd = getAllAyaSuraBySura(suraEnd);

    this.setState({ suraEnd, listAllAyaEnd });
  };
  goBack = arg => {
    if (this.props.togl) this.props.togl("close");
    else this.props.navigation.goBack();
    if (this.props.handleMenu) this.props.handleMenu("open");
  };
  _setRepeat = () => {
    const { ayaStart, suraStart, repeat, ayaEnd, suraEnd } = this.state;
    if (!repeat) return alert("0 repeating!!");
    if (suraStart > suraEnd || (suraStart == suraEnd && ayaStart > ayaEnd)) {
      alert("سورة الإنتهاء اصغر من سورة البدأ ");
      return;
    }

    const {
      setTekrar,
      setExactAya,
      setPlayer,
      setRepeat,
      theme: { color, backgroundColor }
    } = this.props;

    setTekrar({
      ayaStart,
      suraStart,
      repeat,
      ayaEnd,
      suraEnd
    });
    console.log({
      ayaStart,
      suraStart,
      repeat,
      ayaEnd,
      suraEnd
    });
    setRepeat(true);
    setPlayer("play");
    setExactAya({ sura: suraStart, aya: ayaStart });

    this.goBack();
  };
  disabledz = val => {
    const { setRepeat } = this.props;
    setPlayer(false);
    setRepeat(false);
  };
  render() {
    const listAllSura = this.listSura.map((sura, key) => ({
      key,
      label: sura.id + "." + sura.name,
      id: sura.id
    }));
    //
    const { id: id_, name: name_ } = this.listSura[0];
    const firstSura = id_ + "." + name_;
    //
    let { listAllAyaStart, listAllAyaEnd } = this.state;
    listAllAyaStart = listAllAyaStart.map((label, key) => ({
      key,
      label
    }));

    listAllAyaEnd = listAllAyaEnd.map((label, key) => ({
      key,
      label
    }));

    //
    const maplistTekrar = [
      {
        key: 0,
        label: "No Repeat",
        section: true
      },

      { key: 1, label: 2 },
      { key: 2, label: 3 },
      { key: 3, label: 4 },
      { key: 4, label: 5 },
      { key: 5, label: 6 },
      { key: 6, label: 7 }
    ];
    const {
      isRepeat,
      lang,
      theme: { color, backgroundColor }
    } = this.props;

    return (
      <Container style={{ backgroundColor }}>
        <Header style={{ backgroundColor }}>
          <Left>
            <Button transparent onPress={this.goBack}>
              <Icon name="close" style={{ color }}/>
            </Button>
          </Left>
          <Body>
            <Title style={{ color }}>{this.lang["bu_telawa"]}</Title>
          </Body>
          <Right>
            <Switch
              trackColor={color}
              onValueChange={this.disabledz}
              value={isRepeat}
            />
          </Right>
        </Header>
        <Content>
          <Card style={{ backgroundColor }}>
            <CardItem style={{ backgroundColor }}>
              <Body>
                <H3 style={{ color,alignSelf: "center" }}>{this.lang["deterStart"]}</H3>
              </Body>
              {/*
              <Thumbnail
          small
          style={{width:24,height:24}}
          source={require("../../assets/number.png")}
        /> */}
            </CardItem>

            <Grid style={styles.grid}>
              <Col style={{ paddingLeft: 10, paddingRight: 5 }}>
                {/*  <Text style={{ alignSelf: "center" }}>
                    {this.lang["deterStartSura"]}
                  </Text>
				  */}
                <ModalSelector
                  style={{ backgroundColor, borderColor: backgroundColor }}
                  selectTextStyle={{ color }}
                  data={listAllSura}
                  initValue={firstSura}
                  onChange={this.onChangeSuraStart}
                />
              </Col>
            </Grid>
            <Grid style={styles.grid}>
              <Col style={{ paddingLeft: 10, paddingRight: 5 }}>
                {/* <Text style={{ alignSelf: "center" }}>
                    {this.lang["deterStartAya"]}
                  </Text>
				  */}
                <ModalSelector
                  data={listAllAyaStart}
                  style={{ backgroundColor, borderColor: backgroundColor }}
                  selectTextStyle={{ color }}
                  initValue={1}
                  onChange={({ label }) => this.setState({ ayaStart: label })}
                />
              </Col>
            </Grid>

            <CardItem style={{ backgroundColor }}>
              <Body>
                <H3 style={{ color,alignSelf: "center" }}>
                  {this.lang["deterEnd"]}
                </H3>
              </Body>
              {/*  <Thumbnail
          small
          style={{width:24,height:24}}
          source={require("../../assets/number.png")}
        /> 
		*/}
            </CardItem>

            <Grid style={styles.grid}>
              <Col style={{ paddingLeft: 10, paddingRight: 5 }}>
                <ModalSelector
style={{ backgroundColor, borderColor: backgroundColor }}
                  selectTextStyle={{ color }}
                  data={listAllSura}
                  initValue={firstSura}
                  onChange={this.onChangeSuraEnd}
                />
              </Col>
            </Grid>
            <Grid style={styles.grid}>
              <Col style={{ paddingLeft: 10, paddingRight: 5 }}>
           
                <ModalSelector
style={{ backgroundColor, borderColor: backgroundColor }}
                  selectTextStyle={{ color }}
                  data={listAllAyaEnd}
                  initValue={7}
                  onChange={({ label }) => this.setState({ ayaEnd: label })}
                />
              </Col>
            </Grid>

            <CardItem style={{ backgroundColor }}>
              <Grid style={styles.grid}>
                <Col style={{ paddingLeft: 10, paddingRight: 5 }}>
                
                  <ModalSelector
style={{ backgroundColor, borderColor: backgroundColor }}
                  selectTextStyle={{ color }}
                    data={maplistTekrar}
                    initValue={this.lang["repeat_forAya_null"]}
                    onChange={({ label }) => this.setState({ repeat: label })}
                  />
                </Col>
              </Grid>
            </CardItem>

          <CardItem style={{ backgroundColor }}>
              <Grid style={styles.grid}>
                <Col style={{ paddingLeft: 10, paddingRight: 5 }}>
                  <Button
                    onPress={this._setRepeat}
                    style={{  backgroundColor:color }}
                    block
                    iconRight
                  >
                    <Text style={{  color:backgroundColor }}>{this.lang["start"]} </Text>
                  </Button>
                </Col>
              </Grid>
            </CardItem>
          </Card>
        </Content>
      </Container>
    );
  }
}

//

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5FCFF"
  },
  welcome: {
    fontSize: 20,
    textAlign: "center",
    margin: 10
  },
  instructions: {
    textAlign: "center",
    color: "#333333",
    marginBottom: 5
  },
  button: {
    width: 60,
    height: 40,
    backgroundColor: "green"
  },
  grid: { marginTop: 5, marginBottom: 3 }
});
const mapStateToProps = ({ lang, isRepeat, theme, setPlayer }) => ({
  //repoInfo,
  //wino,
  setPlayer,
  theme,
  isRepeat,
  lang
});

const mapDispatchToProps = {
  setExactAya,
  setRepeat,
  setTekrar,
  setPlayer
};
export default connect(mapStateToProps, mapDispatchToProps)(Reciting);
