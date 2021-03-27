import React, { Component } from "react";

import { StyleSheet } from "react-native";

import {
  CardItem,
  Card,
  Text,
  Grid,
  Col,
  Button
} from "native-base";

import { allSuwar, getAllAyaSuraBySura } from "../functions";

import ModalSelector from "react-native-modal-selector";
import * as lang from "../../i18n";
const arrStart = [1, 2, 3, 4, 5, 6, 7];
export default class SuraAya extends Component {
  constructor() {
   // super(props);
    this.state = {
      listAllAyaStart: arrStart,
      ayaStart: 1,
      suraStart: 1,
      
    };
    this.lang = lang[this.props.lang];
    this.listSura = allSuwar(this.props.lang);
  }


  //
  onChangeSuraStart = option => {
    console.log("change aya start to ", { option });
    const suraStart = option.id;
    const listAllAyaStart = getAllAyaSuraBySura(suraStart);

    this.setState({ suraStart, listAllAyaStart });
  };

getSuraAya = _ => {

const {getSuraAya} = this.props;
const {suraStart:sura,ayaStart:aya} = this.state;
console.log("ok getSuraAya",{sura,aya})
getSuraAya({sura,aya})

}
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
    let { listAllAyaStart } = this.state;
    listAllAyaStart = listAllAyaStart.map((label, key) => ({
      key,
      label
    }));

const {textButton} = this.props;


    return (
  
   
            <Card>
              <Grid style={styles.grid}>
                <Col style={{ paddingLeft: 10, paddingRight: 5 }}>
                  <Text style={{ alignSelf: "center" }}>
                    {this.lang["deterStartSura"]}
                  </Text>
                  <ModalSelector
                    data={listAllSura}
                    initValue={firstSura}
                    onChange={this.onChangeSuraStart}
                  />
                </Col>
              </Grid>
              <Grid style={styles.grid}>
                <Col style={{ paddingLeft: 10, paddingRight: 5 }}>
                  <Text style={{ alignSelf: "center" }}>
                    {this.lang["deterStartAya"]}
                  </Text>
                  <ModalSelector
                    data={listAllAyaStart}
                    initValue={1}
                    onChange={({ label }) => this.setState({ ayaStart: label })}
                  />
                </Col>
              </Grid>
              <CardItem>
              <Grid style={styles.grid}>
                <Col style={{ paddingLeft: 10, paddingRight: 5 }}>
                  <Button
                    onPress={this.getSuraAya}
                    style={{ borderWidth: 1 }}
                    block
                    iconRight
                    transparent
                  >
                
         <Text>{textButton?textButton:this.lang["start"]} </Text>
                  </Button>
                </Col>
              </Grid>
            </CardItem>
                   

          </Card>
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


