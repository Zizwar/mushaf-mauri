import React, { Component } from "react";
import { ListView, Image } from "react-native";
import {
  Container,
  Header,
  Title,
  Content,
  Button,
  Icon,
  List,
  ListItem,
  Text,
  Thumbnail,
  Left,
  Right,
  Body
} from "native-base";
//
import { connect } from "react-redux";
import {setFullReduces } from "../../reducer";
import * as lang from "../../i18n";

import {
 fireBase
} from "../functions";
//
let saveCloud = data => {  
  let user = 'user';
  fireBase.ref('/items').push({
   user,
    data
  });
};
//
class Cloud extends Component {
  constructor(props) {
    super(props);
       this.lang = lang[this.props.lang];
    this.state = {
      basic: true,
      
    };
  }
  render(){
    
    return (    <Container>
        <Header>
          <Left>
            <Button transparent onPress={() => this.goBack()}>
              <Icon name="ios-close" />
            </Button>
          </Left>
          <Body>
            <Title>
              save cloud
              {
              //  this.lang["cloud"]
              }</Title>
          </Body>
          <Right />
        </Header>
          <Content>
                <body>
             <Button transparent onPress={() => 
                saveCloud(this.props.allReduces)
                                         
                                         }>
              <Icon name="save" />
            </Button>
            </body>
                </Content>
</Container>
                );


    
  }
  
}
const mapStateToProps = (allReduces) => ({
allReduces
});

const mapDispatchToProps = {
  setFullReduces,
 
};
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Cloud);
