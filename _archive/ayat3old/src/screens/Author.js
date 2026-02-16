import React, { Component } from "react";
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
  Left,
  Right,
  Body
} from "native-base";

import { listVoiceMoqri } from "../amaken";
import { connect } from "react-redux";
import { setAuthorMoqri,setPlayer } from "../../reducer";
import * as lang from "../../i18n";
class Author extends Component {
    constructor(props) {
    super(props);
    this.lang = lang[this.props.lang];
      
    }
  componentWillMount() {
this.listAutor = listVoiceMoqri(this.lang)
  }
   goBack = arg => {
    if (this.props.togl) this.props.togl("close");
    else this.props.navigation.goBack();
    if (this.props.handleMenu) this.props.handleMenu('open');
  };
  onPressAuthor = id => {
  
    const {setAuthorMoqri, setPlayer,moqri} = this.props;
      if(id===moqri)return;
    setAuthorMoqri(id);
    setPlayer('play');
    this.goBack(true);
  };

  render() {
    const {togl,moqri} = this.props;
    return (
      <Container>
 <Header>
          <Left>
            <Button transparent onPress={() => this.goBack()}>
               <Icon name={"ios-close" }/>
            </Button>
          </Left>
          <Body>
            <Title>{this.lang["bu_download_recites"]}</Title>
          </Body>
          <Right />
        </Header>

        <Content>
          <List
            dataArray={this.listAutor}
            renderRow={(data) => (
              <ListItem
                onPress={() => {
                  this.onPressAuthor(data.id);
                }}
              >
				{/*
                <Left>
                  <Icon name="star" color={moqri===data.id?"#d4aa1e":"#007aff" }/>
                </Left>
				*/}

              
                  <Text>
                    {data.voice} 
                  </Text>
              
              </ListItem>
            )}
          />
        </Content>
      </Container>
    );
  }
}
const mapStateToProps = ({wino,lang,moqri}) => ({
  wino,lang,moqri
});

const mapDispatchToProps = {
  setPlayer,setAuthorMoqri
};
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Author);