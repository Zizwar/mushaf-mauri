import React from 'react';


import { Font ,ScreenOrientation} from 'expo';
import { Ionicons } from '@expo/vector-icons';
import {Image,StyleSheet} from 'react-native';

import { Container, Left,Right,Card,CardItem, Header, Content, Body, Text } from 'native-base';

import { searchAyatByText, getPageBySuraAya } from "../functions";
import { connect } from "react-redux";
import { setExactAya } from "../../reducer";
import * as lang from "../../i18n";
class Kids extends React.Component {
  async componentDidMount() {
    ScreenOrientation.allow(Expo.ScreenOrientation.Orientation.LANDSCAPE_RIGHT);


  render() {
    return (
      <KidsOption/>
   
    );
  }
}
//
const stylino = {
  div:{width:900},
img:{width:60,height:100}
}
const URI = "https://www.coque-design.com/3302-thickbox_default/coque-mandala-vertical-.jpg"
class KidsOption extends React.Component {
  render() {
    return (
      <Container>
        <Header />
        <Content>
        <Card>
            <CardItem>
           
               <Image style={stylino.img} source={{uri:URI}} /> 
             
                <Body style={stylino.div}>
                  <Text>
              بسم الله الرحمن الرحيم
                    </Text>
                      
                </Body>
               
                <Image style={stylino.img} source={{uri:URI}} /> 
              
            </CardItem>
            </Card>
        </Content>
      </Container>
    );
  }
}

const mapStateToProps = ({ wino ,lang}) => ({
  wino,
  lang
});

const mapDispatchToProps = {
  setExactAya
};
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Kids);