//import Expo, { FileSystem as FS, Asset, SQLite } from "expo";
import React, { Component } from "react";
import { ActivityIndicator } from "react-native";
import {
  Container,
  Header,
  Content,
  Button,
  List,
  ListItem,
  Body,
  Card,
  Left,
  Right,
  Text,
} from "native-base";
import { connect } from "react-redux";
import SimplePicker from "react-native-simple-picker";
 
import { Icon } from "../component";

import {  setAuthorMoqri, setPlayer  } from "../../reducer";
import * as lang from "../../i18n";
import { listVoiceMoqri } from "../data";
class Player extends Component {
  /**wino**/
  constructor(props) {
    super(props);
    this.lang = lang[this.props.lang];
    this.listAutor = listVoiceMoqri(this.lang);
    this.options = this.listAutor.map((t) => t.id);
    this.labels = this.listAutor.map((t) => t.voice);
   
  }

  goBack = () => this.props.togl && togl("close");
  
  /*
  changeTarjama = (id) => {
    const { setTarjama,nextAya,prevAya} = this.props;
    setTarjama(id);
    nextAya();
    prevAya();
   
  };
  */
  onPressAuthor = (id) => {
    const { setAuthorMoqri, setPlayer, moqri } = this.props;
    if (id === moqri) return;
    setAuthorMoqri(id);
    setPlayer("play");
    // close();
    //this.goBack();
  };
  //
  render() {
    const {
      nextAya,
      prevAya,
      isPlaying,
      wino: { aya },
      toglPlayer,
      text,
      togl,
      
      theme: { color, backgroundColor },
      moqri,
      loadingSound,
    } = this.props;

    return (
         <Header style={{ backgroundColor: color }}>
          <Left>
            <Button transparent onPress={() => togl("close")}>
              <Icon
                size={24}
                style={{ color: backgroundColor }}
                name="ios-arrow-down"
              />
            </Button>
          </Left>
          <Body>
            <Button
              transparent
              iconLeft
              onPress={() => {
                this.refs.picker.show();
              }}
            >
              <Icon
                size={24}
                style={{ color: backgroundColor }}
                name="md-create"
              />
              <Text style={{ color: backgroundColor, fontSize: 11 }} note>
                {moqri}
              </Text>
            </Button>
          </Body>

          <Button transparent onPress={prevAya}>
            <Icon
              size={24}
              style={{ color: backgroundColor }}
              name="play-skip-back-circle-sharp"
            />
          </Button>
          <Button transparent onPress={toglPlayer}>
            {loadingSound ? (
              <ActivityIndicator color={backgroundColor} animating={true} size={16} />
            ) : (
              <Icon
                size={24}
                style={{ color: backgroundColor }}
                name={isPlaying ? "ios-square" : "ios-play"}
              />
            )}
          </Button>
          <Button transparent onPress={nextAya}>
            <Icon
              size={24}
              style={{ color: backgroundColor }}
              name="play-skip-forward-circle-sharp"
            />
          </Button>
          
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
          onSubmit={onPressAuthor}
        />
        </Header>
    
    );
  }
}
const mapStateToProps = ({ wino,  lang,fontSize, theme,moqri }) => ({
  wino,
  
  lang,
  fontSize,
  theme,
  moqri,
});

const mapDispatchToProps = {
  
  
  setPlayer,
  setAuthorMoqri,
};
export default connect(mapStateToProps, mapDispatchToProps)(Player);
