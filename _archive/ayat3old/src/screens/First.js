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
  H3,
  Left,
  View,
  Right,
  Body,
  Col,
  Separator
} from "native-base";
import { Updates } from "expo";
import { connect } from "react-redux";
import { setLang,setFirst } from "../../reducer";
import * as lang from "../../i18n";
class First extends Component {
    constructor(props) {
    super(props);
    this.lang = lang[this.props.lang];
      
    }

 
  onPressLang = id => {
  
    const { setLang,setFirst} = this.props;
    setFirst(false);
    setLang(id);
     setTimeout(Updates.reload, 10);

  };

  render() {
    const {togl,moqri} = this.props;
    return (
      <Container>

        <Content>
         <Col style={{ alignItems: "center",marginButton: 20}}>
       
             <Button transparent  style={{alignSelf: "center"}}>
               <Icon name="globe"/>
            </Button>
        
            <H3>{this.lang["choose_lang"]}</H3>
  
          </Col>
        
   <ListItem
                onPress={() => {
                  this.onPressLang("ar");
                }}
              >
                <Body>
                 
                     <Text style={{textAlign:"center",color:"#555"}}>
                   العربية
                  </Text>
                </Body>
                     
              </ListItem>
               <ListItem
                onPress={() => {
                  this.onPressLang("en");
                }}
              >
                <Body>
                  
                     <Text style={{textAlign:"center",color:"#555"}}>
                   English
                  </Text>
                </Body>
                     
              </ListItem>

             
        </Content>
      </Container>
    );
  }
}
const mapStateToProps = ({lang}) => ({
  lang
});

const mapDispatchToProps = {
 setLang,setFirst
 
};
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(First);