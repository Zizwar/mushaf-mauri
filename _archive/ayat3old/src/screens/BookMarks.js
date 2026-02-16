import React, { Component } from "react";
import {  Image } from "react-native";
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
  Body,
  View,
  Segment,
  H3
} from "native-base";
//
import {allSuwar } from "../functions";
import { connect } from "react-redux";
import { setExactAya, setBookmarks } from "../../reducer";
import * as lang from "../../i18n";
//




class BookMarks extends Component {
  constructor(props) {
    super(props);
    //this.ds = new ListView.DataSource({ rowHasChanged: (r1, r2) => r1 !== r2 });
    this.lang = lang[this.props.lang];
    this.allSuwar = allSuwar(this.props.lang);
    this.state = {
      basic: true,
      listViewData: [],
      imgCapture: null,
      isActive:true

    };
  }
  //
  captureThis = () => {
    this.refs.viewShot.capture().then(uri => {
      console.log("do something with ", uri);
    });
  };
  //
  componentWillMount() {

    this.setState({ listViewData: this.props.bookmarks });
  }
  deleteRow(secId, rowId, rowMap) {
	  
    const {bookmarks} = this.props;

    rowMap[`${secId}${rowId}`].props.closeRow();
    const newData = [...bookmarks];
    newData.splice(rowId, 1);
    this.setState({ listViewData: newData });
    this.props.setBookmarks(newData);
  }

    delId(id) {
	  
    const {bookmarks} = this.props;

   
    const newData = [...bookmarks];
    newData.splice(id, 1);
    this.props.setBookmarks(newData);
  }
    goBack = arg => {
    if (this.props.togl) this.props.togl("close");
    else this.props.navigation.goBack();
    if (this.props.handleMenu) this.props.handleMenu('open');
  };
  getNameBySura = (id) => this.allSuwar.find(dt => dt.id === id).name;
  togl = (isActive) => this.setState({isActive})
	  renderItem =(data,id) => (
                <ListItem
                  onPress={() => {
                    this.goBack();
                    this.props.setExactAya(data.id);
                  }}
                  avatar
                >
                  <Left>
                  <Button transparent onPress={() => this.delId(id)}>
              <Icon color="#d4aa1e" name="ios-close" />
            </Button>
                  </Left>
                  <Body>
                  <H3 style={{ textAlign: "right",color: "#007aff" }}></H3>
                    <Text>{data.text}</Text>
                    <Text style={{color:"#007aff"}}note>
                      {data.note}
                    </Text>
                    <Text note>{data.time}</Text>
                  </Body>
                  <Right style={{ width: 80 }}>
                  <View
          style={{
            position: "absolute",
            width: 56,
            top:30,
            right:20,
            zIndex: 1
          }}
        >
          <Text note style={{ color: "#fff", textAlign: "center" }}>
            {data.id.aya}
          </Text>
        </View>
        <Thumbnail
          square
          source={require("../../assets/number.png")}
          style={{ position: "absolute",top:20,right:20, zIndex: 0 }}
        />
  
                  </Right>
                </ListItem>
              );
  render() {
    const {isActive} = this.state;

    const {bookmarks} = this.props;


	return (
      

      <Container>
        <Header>
          <Left>
            <Button transparent onPress={() => this.goBack()}>
              <Icon name="ios-close" />
            </Button>
          </Left>
          <Body>
            <Title>{this.lang["favs"]}</Title>
          </Body>
          <Right />
        </Header>

        <Segment>
              <Button onPress={()=>this.togl(false)}   first active={isActive}><Text>{this.lang["addFav"]}</Text></Button>
              <Button  onPress={()=>this.togl(true)} last active={!isActive}><Text>{this.lang["note"]}</Text></Button>
            </Segment>

          <Content>
            <List
            
		  dataArray={bookmarks}
              renderRow={(data)=>{
console.log({bookmark:data})
				  if(data.note===null && !isActive)
				  return this.renderItem(data)
					else if(isActive && data.note!==null) return this.renderItem(data)
					  }
			  }
          
              renderRightHiddenRow={(data, secId, rowId, rowMap) => (
                <Button
                  full
                  danger
                  onPress={_ => this.deleteRow(secId, rowId, rowMap)}
                  style={{
                    flex: 1,
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  <Icon active name="trash" />
                </Button>
              )}
              renderLeftHiddenRow={(data, secId, rowId, rowMap) => (
                <Button
                  full
                  danger
                  onPress={_ => this.deleteRow(secId, rowId, rowMap)}
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
const mapStateToProps = ({ bookmarks, wino ,lang}) => ({
  // repoInfo,
  lang,
  bookmarks,
  wino
});

const mapDispatchToProps = {
  setExactAya,
  setBookmarks
};
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(BookMarks);
