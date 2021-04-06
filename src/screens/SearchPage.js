import React, { Component } from "react";
import {
  Container,
  Content,
  Button,
  Item,
  Label,
  Input,
  Form,
  Text,
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
      items: [],
    };
  }
  search = () => {
    const number = this.state.searchText;
    if (!number) return;
    const { sura, aya } = pageToSuraAya(+number + 2);

    console.log("#go pag", { sura, aya });
    if (sura) {
      this.goBack(true);
      this.props.setExactAya({ aya, sura });
    } else alert("no check page");
  };
  goBack = () => this.props.goBack();
  render() {
    const { pageNumber, go } = this.props;
    const { searchText } = this.state;
    return (
      <Container>
        <Content>
          <Form>
            <Item floatingLabel>
              <Label style={{ margin: 9, textAlign: "center" }}>
                {pageNumber}
              </Label>
              <Input
                maxLength={3}
                keyboardType="numeric"
                value={searchText}
                onChangeText={(text) => this.setState({ searchText: text })}
                onSubmitEditing={() => this.search(searchText)}
                style={{ margin: 9, textAlign: "center" }}
              />
            </Item>
          </Form>
          <Button
            onPress={() => this.search(searchText)}
            block
            style={{ margin: 15, marginTop: 50, backgroundColor: "#555" }}
          >
            <Text>{go}</Text>
          </Button>
        </Content>
      </Container>
    );
  }
}
const mapStateToProps = ({ wino, theme }) => ({
  theme,
  wino,
});

const mapDispatchToProps = {
  setExactAya,
};
export default connect(mapStateToProps, mapDispatchToProps)(SearchPage);
