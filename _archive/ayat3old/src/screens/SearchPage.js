
import React, { Component } from "react";
import {
  Container,
  Header,
  Title,
  Content,
  Button,
  Item,
  Label,
  Input,
  Body,
  Left,
  Right,
  Icon,
  Form,
  Text
} from "native-base";
//import styles from "./styles";
import { connect } from "react-redux";
import { setExactAya } from "../../reducer";
import { pageToSuraAya } from "../functions";
class SearchPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      searchText: "",
      resault: null,
      items: []
    };
   
  }
  search = text => {
   
      const number = this.state.searchText;
      if(!number)return;
      const { sura, aya } = pageToSuraAya(number);
    console.log("#go pag",{sura, aya })
      if (sura) {
        this.goBack(true);
        this.props.setExactAya({ aya, sura });
      } else alert("no check page");
   
  };
  goBack = arg => {
    if (this.props.togl) this.props.togl("close");
    else this.props.goBack();
    if (this.props.handleMenu) this.props.handleMenu('open');
  };
  render() {
 const {pageNumber,go} = this.props;
     const {searchText} = this.state;
    return (
      <Container>
        <Content>
          <Form>
            <Item floatingLabel>
              <Label style={{ margin: 9, textAlign: "center" }}>{pageNumber}</Label>
              <Input
                maxLength={3}
                keyboardType="numeric"
                value={searchText}
                onChangeText={text => this.setState({ searchText: text })}
                onSubmitEditing={() => this.search(searchText)}
                style={{ margin: 9, textAlign: "center" }}
              />
            </Item>
          </Form>
          <Button onPress={() => this.search(searchText)} block style={{ margin: 15, marginTop: 50 }}>
            <Text>{go}</Text>
          </Button>
        </Content>
      </Container>
    );
  }
}
const mapStateToProps = ({ wino}) => ({
  
  wino
});

const mapDispatchToProps = {
  setExactAya
};
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(SearchPage);
